const { redisClient } = require('../../redis/client');
const { supabaseAdmin } = require('../../config/supabase');
const { getIO } = require('../../ws/socketServer');

/**
 * MTM (Mark-to-Market) PNL Calculator
 * 
 * Runs as a background interval that:
 * 1. Fetches all open positions
 * 2. Calculates unrealized PNL using latest ticks from Redis (batched MGET)
 * 3. Pushes updated PNL to each user via Socket.IO /user namespace
 * 4. Updates Redis hash for admin dashboard reads (pipeline for efficiency)
 * 
 * Optimizations:
 * - Batched tick fetches with MGET (one round-trip for all symbols)
 * - Dead-band filter: skips emit if PNL hasn't changed by > ₹0.01
 * - Redis pipeline for all HSET writes (one round-trip)
 * - TTL applied to pnl: cache keys (30s auto-expiry)
 */

const CALC_INTERVAL_MS = 2000; // Recalculate every 2 seconds
const TICK_TTL_SECONDS = 30;   // Tick cache expires after 30s (stale protection)
const PNL_TTL_SECONDS = 30;    // PNL cache expires after 30s
const PNL_DEADBAND = 0.01;     // Only broadcast if PNL change > ₹0.01

let isRunning = false;

// Track last broadcasted PNL per user to detect meaningful changes
const lastBroadcastedPnl = new Map(); // userId → totalUnrealizedPnl

/**
 * Store latest tick price in Redis for PNL lookups
 * Uses HSET with a TTL — ensures stale data auto-expires
 */
async function cacheTickPrice(symbol, ltp, bid, ask) {
  try {
    const pipeline = redisClient.pipeline();
    pipeline.hset(`tick:${symbol}`, {
      ltp: String(ltp),
      bid: String(bid || ltp),
      ask: String(ask || ltp),
      ts: String(Date.now()),
    });
    pipeline.expire(`tick:${symbol}`, TICK_TTL_SECONDS);
    await pipeline.exec();
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
 * Batch-fetch tick prices for multiple symbols using Redis MGET.
 * Returns { symbol → { ltp, bid, ask, ts } }
 */
async function batchGetTickPrices(symbols) {
  if (!symbols || symbols.length === 0) return {};

  const uniqueSymbols = [...new Set(symbols)];
  const priceMap = {};

  try {
    // Use pipeline to HGETALL all symbols in one round-trip
    const pipeline = redisClient.pipeline();
    uniqueSymbols.forEach(sym => pipeline.hgetall(`tick:${sym}`));
    const results = await pipeline.exec();

    results.forEach(([err, data], i) => {
      if (!err && data && data.ltp) {
        priceMap[uniqueSymbols[i]] = {
          ltp: parseFloat(data.ltp),
          bid: parseFloat(data.bid),
          ask: parseFloat(data.ask),
          ts: parseInt(data.ts),
        };
      }
    });
  } catch (err) {
    // Fallback to individual fetches if pipeline fails
    for (const sym of uniqueSymbols) {
      priceMap[sym] = await getCachedPrice(sym);
    }
  }

  return priceMap;
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

    // ── OPTIMIZATION: Batch all tick fetches in one Redis round-trip ──
    const symbols = positions.map(p => p.symbol);
    const tickMap = await batchGetTickPrices(symbols);

    // Group by user for efficient broadcasting
    const userPnlMap = {};

    for (const pos of positions) {
      const tick = tickMap[pos.symbol];
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

    // ── OPTIMIZATION: Use Redis pipeline for all HSET writes ──
    let io;
    try { io = getIO(); } catch (_) {}

    const redisPipeline = redisClient.pipeline();

    for (const [userId, pnlData] of Object.entries(userPnlMap)) {
      pnlData.totalUnrealizedPnl = Math.round(pnlData.totalUnrealizedPnl * 100) / 100;

      // ── DEAD-BAND FILTER: Only emit if PNL changed by > ₹0.01 ──
      const lastPnl = lastBroadcastedPnl.get(userId);
      const changed = lastPnl === undefined || Math.abs(pnlData.totalUnrealizedPnl - lastPnl) > PNL_DEADBAND;

      if (changed && io) {
        io.of('/user').to(`user:${userId}`).emit('USER:PNL_UPDATE', pnlData);
        lastBroadcastedPnl.set(userId, pnlData.totalUnrealizedPnl);
      }

      // Cache in Redis for admin dashboard reads (pipelined)
      if (changed) {
        redisPipeline.hset(`pnl:${userId}`, {
          totalPnl: String(pnlData.totalUnrealizedPnl),
          marginUsed: String(pnlData.totalMarginUsed),
          positionCount: String(pnlData.positions.length),
          updatedAt: String(Date.now()),
        });
        redisPipeline.expire(`pnl:${userId}`, PNL_TTL_SECONDS);
      }
    }

    await redisPipeline.exec();

  } catch (err) {
    console.error('MTM calculation error:', err.message);
  }

  isRunning = false;
}

/**
 * Start the MTM calculator background loop
 */
function startMTMCalculator() {
  console.log(`📊 MTM Calculator started (interval: ${CALC_INTERVAL_MS}ms, deadband: ₹${PNL_DEADBAND})`);
  setInterval(calculateMTM, CALC_INTERVAL_MS);
}

module.exports = { startMTMCalculator, cacheTickPrice, getCachedPrice };
