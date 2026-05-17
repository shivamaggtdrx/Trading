const { redisClient } = require('../../redis/client');
const { supabaseAdmin } = require('../../config/supabase');
const { getIO } = require('../../ws/socketServer');

/**
 * MTM (Mark-to-Market) PNL Calculator
 * 
 * Runs as a background interval that:
 * 1. Fetches all open positions
 * 2. Calculates unrealized PNL using latest ticks from Redis (or memory)
 * 3. Pushes updated PNL to each user via Socket.IO /user namespace
 * 4. Updates Redis hash for fast admin dashboard reads
 */

const CALC_INTERVAL_MS = 2000; // Recalculate every 2 seconds
let isRunning = false;

/**
 * Store latest tick price in Redis for PNL lookups
 */
async function cacheTickPrice(symbol, ltp, bid, ask) {
  try {
    await redisClient.hset(`tick:${symbol}`, {
      ltp: String(ltp),
      bid: String(bid || ltp),
      ask: String(ask || ltp),
      ts: String(Date.now()),
    });
  } catch (err) {
    // Redis not available — skip caching
  }
}

/**
 * Get the latest cached price from Redis
 */
async function getCachedPrice(symbol) {
  try {
    const data = await redisClient.hgetall(`tick:${symbol}`);
    if (data && data.ltp) {
      return {
        ltp: parseFloat(data.ltp),
        bid: parseFloat(data.bid),
        ask: parseFloat(data.ask),
        ts: parseInt(data.ts),
      };
    }
  } catch (err) {}
  return null;
}

/**
 * Run one PNL calculation cycle
 */
async function calculateMTM() {
  if (isRunning) return; // Prevent overlap
  isRunning = true;

  try {
    // Fetch all open positions
    const { data: positions, error } = await supabaseAdmin
      .from('positions')
      .select('id, user_id, symbol, side, quantity, entry_price, margin_used')
      .in('status', ['OPEN', 'open']);

    if (error || !positions || positions.length === 0) {
      isRunning = false;
      return;
    }

    // Group by user for efficient broadcasting
    const userPnlMap = {};

    for (const pos of positions) {
      const tick = await getCachedPrice(pos.symbol);
      if (!tick) continue;

      const currentPrice = tick.ltp;
      let unrealizedPnl;

      if (pos.side === 'long' || pos.side === 'BUY') {
        unrealizedPnl = (currentPrice - pos.entry_price) * pos.quantity;
      } else {
        unrealizedPnl = (pos.entry_price - currentPrice) * pos.quantity;
      }

      unrealizedPnl = Math.round(unrealizedPnl * 100) / 100;

      // Aggregate per user
      if (!userPnlMap[pos.user_id]) {
        userPnlMap[pos.user_id] = {
          totalUnrealizedPnl: 0,
          totalMarginUsed: 0,
          positions: [],
        };
      }

      userPnlMap[pos.user_id].totalUnrealizedPnl += unrealizedPnl;
      userPnlMap[pos.user_id].totalMarginUsed += pos.margin_used || 0;
      userPnlMap[pos.user_id].positions.push({
        id: pos.id,
        symbol: pos.symbol,
        side: pos.side,
        quantity: pos.quantity,
        entryPrice: pos.entry_price,
        currentPrice,
        unrealizedPnl,
      });
    }

    // Broadcast to each user's private Socket.IO room
    try {
      const io = getIO();
      for (const [userId, pnlData] of Object.entries(userPnlMap)) {
        pnlData.totalUnrealizedPnl = Math.round(pnlData.totalUnrealizedPnl * 100) / 100;

        io.of('/user').to(`user:${userId}`).emit('USER:PNL_UPDATE', pnlData);

        // Also cache in Redis for admin dashboard reads
        await redisClient.hset(`pnl:${userId}`, {
          totalPnl: String(pnlData.totalUnrealizedPnl),
          marginUsed: String(pnlData.totalMarginUsed),
          positionCount: String(pnlData.positions.length),
          updatedAt: String(Date.now()),
        });
      }
    } catch (err) {
      // Socket not ready yet
    }
  } catch (err) {
    console.error('MTM calculation error:', err.message);
  }

  isRunning = false;
}

/**
 * Start the MTM calculator background loop
 */
function startMTMCalculator() {
  console.log(`📊 MTM Calculator started (interval: ${CALC_INTERVAL_MS}ms)`);
  setInterval(calculateMTM, CALC_INTERVAL_MS);
}

module.exports = { startMTMCalculator, cacheTickPrice, getCachedPrice };
