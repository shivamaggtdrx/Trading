const angelOneFeed = require('./angelOneFeed');
const yahooFeed = require('./yahooFeed');
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
    activeFeed = 'yahoo';
    yahooFeed.initYahooFeed();
    yahooFeed.onTick(handleTick);
    console.log('📊 Price source: Yahoo Finance (5s polling) connected to Socket.IO');
  }
}

function stopPriceSimulation() {
  if (activeFeed === 'yahoo') yahooFeed.stopYahooFeed();
}

module.exports = { initPriceEngine, stopPriceSimulation };
