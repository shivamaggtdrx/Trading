/**
 * Price Engine
 * 
 * Central market data broker that connects to Upstox streaming service,
 * throttles and broadcasts live ticks to active Socket.IO rooms,
 * and feeds ticks into the backend candle, execution, and risk pipelines.
 */

const { upstoxStream } = require('../services/upstoxStream');
const candleAggregator = require('./candleAggregator');
const executionEngine = require('./executionEngine');
const { getIO } = require('./socketServer');
const { cacheTickPrice } = require('../core/pnl/mtmCalculator');
const { processTick: processOHLC } = require('./feed/ohlcAggregator');
const { feedLogger } = require('../core/monitoring/logger');

let activeFeed = null;
let mockInterval = null;
let lastLiveTickTime = 0;

// ── Tick throttle: max 1 emit per symbol per 250ms ──
// Prevents flooding the Socket.IO bus when Upstox sends high-frequency updates.
const TICK_THROTTLE_MS = 250;
const lastEmitTime = new Map(); // symbol → timestamp

/**
 * Handle a normalized tick from any source
 */
function handleTick(tick) {
  if (!tick || !tick.symbol) return;

  // Track live tick timestamps to control backup simulator
  if (tick._debug?.source !== 'local_simulator') {
    lastLiveTickTime = Date.now();
  }

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
function initPriceEngine() {
  feedLogger.info('Initializing Price Engine with Upstox Feed...');

  const clientId = process.env.UPSTOX_CLIENT_ID || '';
  const clientSecret = process.env.UPSTOX_CLIENT_SECRET || '';

  const hasUpstoxCreds = clientId && clientSecret 
    && !clientId.includes('YOUR_') 
    && !clientId.includes('PLACEHOLDER')
    && !clientSecret.includes('YOUR_')
    && !clientSecret.includes('PLACEHOLDER');

  // Hook stream callbacks
  upstoxStream.on('tick', handleTick);

  if (hasUpstoxCreds) {
    activeFeed = 'upstox';
    feedLogger.info('Starting Upstox Live Streaming client...');
    upstoxStream.start();
  } else {
    activeFeed = 'mock';
    feedLogger.warn('No valid Upstox credentials found. Fallback mode.');
  }

  // Always boot dev simulator as backup (it enforces dev env check internally)
  startMockFeed();

  // Watchdog & Fallback Polling
  watchdogInterval = setInterval(async () => {
    if (activeFeed !== 'upstox') return;

    const timeSinceLastTick = Date.now() - lastLiveTickTime;

    // > 60s: trigger reconnect
    if (timeSinceLastTick > 60000 && timeSinceLastTick <= 120000) {
      feedLogger.warn(`Watchdog: No ticks received in ${Math.round(timeSinceLastTick / 1000)}s. Triggering Upstox reconnect...`);
      upstoxStream.stop();
      upstoxStream.start();
    }
    
    // > 120s: trigger Yahoo Finance fallback polling
    if (timeSinceLastTick > 120000) {
      feedLogger.warn(`Watchdog: Upstox down for > 2m. Fetching fallback prices from Yahoo Finance...`);
      try {
        const { supabaseAdmin } = require('../config/supabase');
        const { data: instruments } = await supabaseAdmin
          .from('instruments')
          .select('symbol')
          .eq('is_active', true);

        if (!instruments) return;

        const yahooFinance = require('yahoo-finance2').default;
        for (const inst of instruments) {
          // Try adding .NS or .BO for Indian stocks
          const yfSymbol = inst.symbol.includes('-') ? inst.symbol : `${inst.symbol}.NS`;
          try {
            const quote = await yahooFinance.quote(yfSymbol);
            if (quote && quote.regularMarketPrice) {
              const tick = {
                symbol: inst.symbol,
                exchange: 'NSE',
                price: quote.regularMarketPrice,
                ltp: quote.regularMarketPrice,
                bid: quote.bid || quote.regularMarketPrice,
                ask: quote.ask || quote.regularMarketPrice,
                change: quote.regularMarketChange || 0,
                changePercent: quote.regularMarketChangePercent || 0,
                timestamp: Date.now(),
                _debug: { source: 'yahoo_fallback' }
              };
              handleTick(tick);
            }
          } catch (yfErr) {
            // Ignore individual fetch errors
          }
        }
      } catch (err) {
        feedLogger.error('Yahoo Finance fallback error:', err);
      }
    }
  }, 30000); // Check every 30s
}

/**
 * Stop Price Simulation & Stream
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
  upstoxStream.stop();
  feedLogger.info('Price Engine shut down successfully.');
}

module.exports = {
  initPriceEngine,
  stopPriceEngine,
  stopPriceSimulation: stopPriceEngine // maintaining legacy naming compatibility
};
