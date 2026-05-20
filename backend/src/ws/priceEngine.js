/**
 * Price Engine
 * 
 * Central market data broker that connects to multiple FREE feed providers:
 * - NSE India Direct (Indian Stocks & Indices — FREE, no key needed)
 * - Finnhub (US Stocks, Forex, Commodities — FREE with API key)
 * - Binance (Crypto — FREE, no key needed)
 * 
 * Throttles and broadcasts live ticks to active Socket.IO rooms,
 * and feeds ticks into the backend candle, execution, and risk pipelines.
 */

const { nseFeed } = require('../services/nseFeed');
const { finnhubFeed } = require('../services/finnhubFeed');
const { binanceFeed } = require('../services/binanceFeed');
const { loadFromDatabase: loadSymbolMap, getInstrumentsBySegment } = require('../services/symbolMap');
const candleAggregator = require('./candleAggregator');
const executionEngine = require('./executionEngine');
const { getIO } = require('./socketServer');
const { cacheTickPrice } = require('../core/pnl/mtmCalculator');
const { processTick: processOHLC } = require('./feed/ohlcAggregator');
const { feedLogger } = require('../core/monitoring/logger');

let mockInterval = null;
let lastLiveTickTime = 0;

// ── Tick throttle: max 1 emit per symbol per 250ms ──
// Prevents flooding the Socket.IO bus when providers send high-frequency updates.
const TICK_THROTTLE_MS = 250;
const lastEmitTime = new Map(); // symbol → timestamp

// ── Track per-symbol last known prices (for stale detection) ──
const lastKnownPrices = new Map(); // symbol → { price, timestamp }

/**
 * Handle a normalized tick from any source
 */
function handleTick(tick) {
  if (!tick || !tick.symbol) return;

  // Track live tick timestamps
  if (!tick._debug || tick._debug.source !== 'local_simulator') {
    lastLiveTickTime = Date.now();
  }

  // Update last known price
  lastKnownPrices.set(tick.symbol, {
    price: tick.price || tick.ltp,
    timestamp: Date.now(),
    source: tick._debug?.source || 'unknown',
  });

  // 1. Throttle Socket.IO broadcasts
  const now = Date.now();
  const lastEmit = lastEmitTime.get(tick.symbol) || 0;
  const shouldEmit = (now - lastEmit) >= TICK_THROTTLE_MS;

  if (shouldEmit) {
    lastEmitTime.set(tick.symbol, now);
    try {
      const io = getIO();
      io.of('/market').to(`feed:${tick.symbol}`).emit('MARKET:TICK', tick);
    } catch (err) {
      // Ignore if Socket.io is not ready yet
    }
  }

  // 2. Heavy pipeline processing (candles, limits, risk, margin) handled asynchronously
  setImmediate(() => {
    try {
      candleAggregator.processTickForCandles(tick);
      processOHLC(tick);
      executionEngine.evaluateTick(tick);
      cacheTickPrice(tick.symbol, tick.ltp || tick.price, tick.bid || tick.price, tick.ask || tick.price);
    } catch (err) {
      feedLogger.error(`Pipeline execution failed for ${tick.symbol}: ${err.message}`);
    }
  });
}

/**
 * Local Simulator - strictly used in development fallback ONLY
 */
async function startMockFeed() {
  // If in production, DO NOT start the mock simulator under any circumstances!
  if (process.env.NODE_ENV === 'production') {
    feedLogger.info('Production mode detected. Local mock simulator is disabled in production per safety guidelines.');
    return;
  }

  try {
    const { supabaseAdmin } = require('../config/supabase');
    
    // Load active instruments
    const { data: instruments } = await supabaseAdmin
      .from('instruments')
      .select('symbol, last_price')
      .eq('is_active', true);
      
    if (!instruments || instruments.length === 0) {
      feedLogger.warn('Mock Feed: No active instruments found in DB.');
      return;
    }

    const prices = {};
    instruments.forEach(i => {
      prices[i.symbol] = parseFloat(i.last_price) || 100;
    });

    feedLogger.info(`Development Backup: Simulated ${instruments.length} active instruments.`);

    mockInterval = setInterval(() => {
      // Only simulate if no live feed ticks have arrived in the last 10 seconds
      const isLiveFeedOffline = (Date.now() - lastLiveTickTime) > 10000;
      if (!isLiveFeedOffline) return;

      instruments.forEach(inst => {
        const currentPrice = prices[inst.symbol];
        const changePct = (Math.random() - 0.5) * 0.0006; // Micro price changes
        const changeAmount = currentPrice * changePct;
        const newPrice = Math.max(0.1, +(currentPrice + changeAmount).toFixed(2));
        prices[inst.symbol] = newPrice;

        const spread = newPrice * 0.0005;
        const bid = +(newPrice - spread / 2).toFixed(2);
        const ask = +(newPrice + spread / 2).toFixed(2);

        const tick = {
          symbol: inst.symbol,
          exchange: 'NSE',
          price: newPrice,
          ltp: newPrice,
          bid,
          ask,
          change: +(newPrice - (inst.last_price || newPrice)).toFixed(2),
          changePercent: +((newPrice - (inst.last_price || newPrice)) / (inst.last_price || newPrice) * 100).toFixed(2),
          timestamp: Date.now(),
          _debug: { source: 'local_simulator' }
        };

        handleTick(tick);
      });
    }, 200);

  } catch (err) {
    feedLogger.error('Failed to initialize local backup simulator:', err);
  }
}

let watchdogInterval = null;

/**
 * Initialize the Price Engine
 */
async function initPriceEngine() {
  feedLogger.info('═══════════════════════════════════════════════');
  feedLogger.info('  Initializing Multi-Provider Price Engine');
  feedLogger.info('  All providers are FREE — zero cost');
  feedLogger.info('═══════════════════════════════════════════════');

  // 1. Load symbol mappings from database
  await loadSymbolMap();

  // Get instruments by segment to route to the right provider
  const segmented = getInstrumentsBySegment();
  
  // ── Indian Stocks: NSE India Direct (FREE, no key) ──
  const nseEquities = segmented['nse_equity'] || [];
  const foFutures = segmented['fo_futures'] || [];
  const mcxSymbols = segmented['mcx'] || [];
  const indianStocks = [...new Set([...nseEquities, ...foFutures, ...mcxSymbols])];
  const indianIndices = ['NIFTY50', 'BANKNIFTY'];

  if (indianStocks.length > 0 || indianIndices.length > 0) {
    feedLogger.info(`[PRICE ENGINE] 🇮🇳 Starting NSE India feed (FREE — no key needed)`);
    feedLogger.info(`[PRICE ENGINE]    ${indianStocks.length} equities + ${indianIndices.length} indices`);
    nseFeed.on('tick', handleTick);
    await nseFeed.start(indianStocks, indianIndices);
  }

  // ── US Stocks, Forex, Commodities: Finnhub (FREE with API key) ──
  const finnhubApiKey = process.env.FINNHUB_API_KEY || '';
  const forexSymbols = segmented['forex'] || [];
  const usEquities = segmented['us_equity'] || [];
  
  if (finnhubApiKey && finnhubApiKey !== 'your_finnhub_api_key_here') {
    feedLogger.info('[PRICE ENGINE] 🌍 Starting Finnhub feed (FREE — US stocks, forex, commodities)');
    finnhubFeed.on('tick', handleTick);
    await finnhubFeed.start(finnhubApiKey);
  } else {
    if (forexSymbols.length > 0 || usEquities.length > 0) {
      feedLogger.warn('[PRICE ENGINE] ⚠️ FINNHUB_API_KEY missing — US stocks & forex feed disabled');
      feedLogger.warn('[PRICE ENGINE] Get a free API key at https://finnhub.io');
    }
  }

  // ── Crypto: Binance (FREE, no key needed) ──
  feedLogger.info('[PRICE ENGINE] ₿ Starting Binance feed (FREE — no key needed)');
  binanceFeed.on('tick', handleTick);
  binanceFeed.start();

  // 4. Always boot dev simulator as backup (it enforces dev env check internally)
  startMockFeed();

  // 5. Watchdog — monitor feed health
  watchdogInterval = setInterval(() => {
    const timeSinceLastTick = Date.now() - lastLiveTickTime;

    // Log health status every 60s
    if (timeSinceLastTick > 60000) {
      feedLogger.warn(`[WATCHDOG] No live ticks received in ${Math.round(timeSinceLastTick / 1000)}s`);

      // Try reconnecting Finnhub if it's been > 2 minutes
      if (timeSinceLastTick > 120000 && finnhubApiKey) {
        feedLogger.warn('[WATCHDOG] Attempting Finnhub reconnect...');
        finnhubFeed.stop();
        finnhubFeed.start(finnhubApiKey);
      }
    }
  }, 30000);

  // 6. Log summary
  feedLogger.info('═══════════════════════════════════════════════');
  feedLogger.info('  Price Engine Initialized — ALL FREE');
  feedLogger.info(`  🇮🇳 NSE India: ${indianStocks.length > 0 ? 'ACTIVE' : 'NO SYMBOLS'} (free, no key)`);
  feedLogger.info(`  🌍 Finnhub:   ${finnhubApiKey ? 'ACTIVE' : 'DISABLED (no key)'} (free tier)`);
  feedLogger.info(`  ₿  Binance:   ACTIVE (free, no key)`);
  feedLogger.info(`  🔧 Dev Sim:   ${process.env.NODE_ENV !== 'production' ? 'STANDBY' : 'DISABLED'}`);
  feedLogger.info('═══════════════════════════════════════════════');
}

/**
 * Stop Price Engine
 */
function stopPriceEngine() {
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
  }
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
  nseFeed.stop();
  finnhubFeed.stop();
  binanceFeed.stop();
  feedLogger.info('Price Engine shut down successfully.');
}

/**
 * Get feed status for health checks
 */
function getFeedStatus() {
  return {
    nse: nseFeed.getStatus(),
    finnhub: finnhubFeed.getStatus(),
    binance: binanceFeed.getStatus(),
    lastLiveTickAge: Date.now() - lastLiveTickTime,
    totalSymbolsTracked: lastKnownPrices.size,
  };
}

module.exports = {
  initPriceEngine,
  stopPriceEngine,
  getFeedStatus,
  stopPriceSimulation: stopPriceEngine // maintaining legacy naming compatibility
};
