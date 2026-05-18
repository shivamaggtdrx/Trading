const angelOneFeed = require('./angelOneFeed');
const candleAggregator = require('./candleAggregator');
const executionEngine = require('./executionEngine');
const { getIO } = require('./socketServer');
const { cacheTickPrice } = require('../core/pnl/mtmCalculator');
const { normalizeTick } = require('./feed/normalizer');
const { processTick: processOHLC } = require('./feed/ohlcAggregator');

let activeFeed = null;

function handleTick(rawTick) {
  // 0. Normalize & validate the tick (rejects corrupted/stale data)
  const tick = normalizeTick(rawTick);
  if (!tick) return; // Corrupted tick rejected

  // 1. Process for server-side in-memory candles (multi-timeframe)
  candleAggregator.processTickForCandles(tick);

  // 2. Process for persistent 1m OHLC (Redis + Postgres)
  processOHLC(tick);

  // 3. Evaluate simulated execution (SL/TGT)
  executionEngine.evaluateTick(tick);

  // 4. Cache tick in Redis for PNL calculator
  cacheTickPrice(tick.symbol, tick.ltp, tick.bid, tick.ask);

  // 5. Broadcast to Socket.IO clients in the specific symbol room
  try {
    const io = getIO();
    io.of('/market').to(`feed:${tick.symbol}`).emit('MARKET:TICK', tick);
  } catch (err) {
    // If Socket.io isn't initialized yet, ignore
  }
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

function initPriceEngine() {
  console.log('📡 Engine initialized on Socket.IO');

  const hasAngelCreds = process.env.ANGEL_ONE_CLIENT_CODE 
    && process.env.ANGEL_ONE_PASSWORD 
    && process.env.ANGEL_ONE_TOTP_SECRET;

  if (hasAngelCreds) {
    activeFeed = 'angel';
    angelOneFeed.initAngelOneFeed();
    angelOneFeed.onTick(handleTick);
    setInterval(updateGlobalSubscriptions, 5000);
    console.log('📊 Price source: Angel One SmartAPI (live tick) connected to Socket.IO');
  } else {
    console.error('❌ FATAL ERROR: Angel One credentials are missing in your environment!');
    console.error('To run live price feeds, you MUST configure ANGEL_ONE_CLIENT_CODE, ANGEL_ONE_PASSWORD, and ANGEL_ONE_TOTP_SECRET.');
    console.warn('⚠️ Server will run, but live pricing will not be active until Angel One is configured.');
  }
}

function stopPriceSimulation() {
  // Angel One handles connections automatically via WebSocket lifecycle
}

module.exports = { initPriceEngine, stopPriceSimulation };
