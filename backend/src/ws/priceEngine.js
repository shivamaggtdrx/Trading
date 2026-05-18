const angelOneFeed = require('./angelOneFeed');
const candleAggregator = require('./candleAggregator');
const executionEngine = require('./executionEngine');
const { getIO } = require('./socketServer');
const { cacheTickPrice } = require('../core/pnl/mtmCalculator');
const { normalizeTick } = require('./feed/normalizer');
const { processTick: processOHLC } = require('./feed/ohlcAggregator');

let activeFeed = null;
let mockInterval = null;

// ── Tick throttle: max 1 emit per symbol per 250ms ──
// Prevents flooding the Socket.IO bus when Angel One sends ticks faster
// than clients can process (e.g. index futures during high volatility).
const TICK_THROTTLE_MS = 250;
const lastEmitTime = new Map(); // symbol → timestamp

function handleTick(rawTick) {
  // 0. Normalize & validate the tick (rejects corrupted/stale data)
  const tick = normalizeTick(rawTick);
  if (!tick) return; // Corrupted tick rejected

  // 1. Throttle: skip emit if we sent this symbol within TICK_THROTTLE_MS
  const now = Date.now();
  const lastEmit = lastEmitTime.get(tick.symbol) || 0;
  const shouldEmit = (now - lastEmit) >= TICK_THROTTLE_MS;

  if (shouldEmit) {
    lastEmitTime.set(tick.symbol, now);
    try {
      const io = getIO();
      io.of('/market').to(`feed:${tick.symbol}`).emit('MARKET:TICK', tick);
    } catch (err) {
      // If Socket.io isn't initialized yet, ignore
    }
  }

  // 2. Process other heavy pipeline steps asynchronously using setImmediate
  // to avoid blocking the event loop and ensure zero latency for price delivery.
  setImmediate(() => {
    try {
      candleAggregator.processTickForCandles(tick);
      processOHLC(tick);
      executionEngine.evaluateTick(tick);
      cacheTickPrice(tick.symbol, tick.ltp, tick.bid, tick.ask);
    } catch (err) {
      console.error('❌ Async pipeline error:', err.message);
    }
  });
}

// Poll for room updates every 5 seconds since users can join/leave dynamically.
// Socket.io adapter.rooms gives us the active subscriptions across all instances.
function updateGlobalSubscriptions() {
  if (activeFeed !== 'angel') return;
  try {
    const io = getIO();
    const rooms = io.of('/market').adapter.rooms;
    const tokens = [];
    for (const [roomName, clients] of rooms.entries()) {
      if (roomName.startsWith('feed:')) {
        tokens.push(roomName.split(':')[1]);
      }
    }
    if (tokens.length > 0) {
      angelOneFeed.subscribeTokens([{ exchangeType: 1, tokens }]);
    }
  } catch (err) {}
}

async function startMockFeed() {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    
    // Load active instruments from DB
    const { data: instruments } = await supabaseAdmin
      .from('instruments')
      .select('symbol, last_price')
      .eq('is_active', true);
      
    if (!instruments || instruments.length === 0) {
      console.log('⚠️ Mock Feed: No active instruments found in DB to simulate.');
      return;
    }

    const prices = {};
    instruments.forEach(i => {
      prices[i.symbol] = parseFloat(i.last_price) || 100;
    });

    console.log(`✅ Local Mock Simulator started: simulating ${instruments.length} active instruments at ultra-smooth 100ms intervals.`);

    mockInterval = setInterval(() => {
      instruments.forEach(inst => {
        const currentPrice = prices[inst.symbol];
        // Micro-price fluctuations for ultra-realistic rendering (-0.02% to +0.02% per 100ms)
        const changePct = (Math.random() - 0.5) * 0.0004;
        const changeAmount = currentPrice * changePct;
        const newPrice = Math.max(0.1, +(currentPrice + changeAmount).toFixed(2));
        prices[inst.symbol] = newPrice;

        const spread = newPrice * 0.0005;
        const bid = +(newPrice - spread / 2).toFixed(2);
        const ask = +(newPrice + spread / 2).toFixed(2);

        const tick = {
          symbol: inst.symbol,
          ltp: newPrice,
          price: newPrice,
          bid: bid,
          ask: ask,
          spread: +spread.toFixed(2),
          change: +(newPrice - (inst.last_price || newPrice)).toFixed(2),
          change_percent: +((newPrice - (inst.last_price || newPrice)) / (inst.last_price || newPrice) * 100).toFixed(2),
          timestamp: Date.now(),
          _debug: { source: 'local_simulator' }
        };

        handleTick(tick);
      });
    }, 100); // 100ms update rate for continuousZerodha-like ticks
  } catch (err) {
    console.error('❌ Failed to start local mock simulator:', err.message);
  }
}

function initPriceEngine() {
  console.log('📡 Engine initialized on Socket.IO');

  const isProduction = process.env.NODE_ENV === 'production';
  const hasAngelCreds = process.env.ANGEL_ONE_CLIENT_CODE 
    && process.env.ANGEL_ONE_PASSWORD 
    && process.env.ANGEL_ONE_TOTP_SECRET;

  if (hasAngelCreds) {
    activeFeed = 'angel';
    angelOneFeed.initAngelOneFeed();
    angelOneFeed.onTick(handleTick);
    setInterval(updateGlobalSubscriptions, 5000);
    console.log('📊 Price source: Angel One SmartAPI (live tick) connected to Socket.IO');
  } else if (!isProduction) {
    activeFeed = 'mock';
    startMockFeed();
  } else {
    console.error('❌ FATAL ERROR: Angel One credentials are missing in your production environment!');
    console.error('To run live price feeds in production, you MUST configure ANGEL_ONE_CLIENT_CODE, ANGEL_ONE_PASSWORD, and ANGEL_ONE_TOTP_SECRET.');
    console.warn('⚠️ Live pricing will remain inactive on production until credentials are provided.');
  }
}

function stopPriceSimulation() {
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
  }
}

module.exports = { initPriceEngine, stopPriceSimulation };
