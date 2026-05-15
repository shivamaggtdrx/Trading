/**
 * Yahoo Finance Live Price Feed
 * Fetches real-time market data using yahoo-finance2
 * Produces normalized ticks compatible with the existing pipeline
 */
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const { supabaseAdmin } = require('../config/supabase');

let tickSubscribers = [];
let feedInterval = null;
let symbolMap = {};     // internal symbol -> yahoo ticker
let lastPrices = {};    // symbol -> last known price
let isRunning = false;

// ── Symbol mapping: Our DB symbol → Yahoo Finance ticker ──
const YAHOO_TICKER_MAP = {
  // NSE Equities (append .NS)
  'ADANIENT':    'ADANIENT.NS',
  'BAJFINANCE':  'BAJFINANCE.NS',
  'HDFCBANK':    'HDFCBANK.NS',
  'HINDUNILVR':  'HINDUNILVR.NS',
  'ICICIBANK':   'ICICIBANK.NS',
  'INFY':        'INFY.NS',
  'KOTAKBANK':   'KOTAKBANK.NS',
  'LT':          'LT.NS',
  'MARUTI':      'MARUTI.NS',
  'RELIANCE':    'RELIANCE.NS',
  'SBIN':        'SBIN.NS',
  'SUNPHARMA':   'SUNPHARMA.NS',
  'TATAMOTORS':  'TATAMOTORS.NS',
  'TCS':         'TCS.NS',
  'WIPRO':       'WIPRO.NS',
  // Indices
  'NIFTY50':     '^NSEI',
  'BANKNIFTY':   '^NSEBANK',
  'SENSEX':      '^BSESN',
  // Forex
  'USDINR':      'USDINR=X',
  'EURUSD':      'EURUSD=X',
  'GBPUSD':      'GBPUSD=X',
  'USDJPY':      'USDJPY=X',
  'USDCHF':      'USDCHF=X',
  'AUDUSD':      'AUDUSD=X',
  // Commodities
  'XAUUSD':      'GC=F',
  'XAGUSD':      'SI=F',
  'CRUDEOIL':    'CL=F',
  'NATURALGAS':  'NG=F',
  'COPPER':      'HG=F',
};

/**
 * Load all active instruments from DB and build the symbol map
 */
async function loadInstruments() {
  try {
    const { data, error } = await supabaseAdmin
      .from('instruments')
      .select('symbol, last_price')
      .eq('is_active', true);

    if (!error && data) {
      data.forEach(inst => {
        const yahooTicker = YAHOO_TICKER_MAP[inst.symbol];
        if (yahooTicker) {
          symbolMap[inst.symbol] = yahooTicker;
          lastPrices[inst.symbol] = parseFloat(inst.last_price) || 0;
        }
      });
      console.log(`📊 Yahoo Feed: Loaded ${Object.keys(symbolMap).length} instruments for live pricing`);
    }
  } catch (err) {
    console.error('❌ Yahoo Feed: Failed to load instruments:', err.message);
  }
}

/**
 * Fetch live quotes from Yahoo Finance in batches
 */
async function fetchQuotes() {
  const symbols = Object.keys(symbolMap);
  if (symbols.length === 0) return;

  // Yahoo tickers to query
  const yahooTickers = symbols.map(s => symbolMap[s]);

  try {
    // Fetch all quotes in one batch call
    const results = await yahooFinance.quote(yahooTickers);

    // results is an array of quote objects
    const quotes = Array.isArray(results) ? results : [results];
    const dbUpdates = [];

    for (const quote of quotes) {
      if (!quote || !quote.symbol) continue;

      // Reverse-lookup our internal symbol from yahoo ticker
      const internalSymbol = symbols.find(s => symbolMap[s] === quote.symbol);
      if (!internalSymbol) continue;

      const ltp = quote.regularMarketPrice || 0;
      if (ltp <= 0) continue;

      const prevClose = quote.regularMarketPreviousClose || ltp;
      const change = ltp - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
      const dayHigh = quote.regularMarketDayHigh || ltp;
      const dayLow = quote.regularMarketDayLow || ltp;
      const dayOpen = quote.regularMarketOpen || ltp;
      const volume = quote.regularMarketVolume || 0;

      // Simulate bid/ask with a small spread
      const spreadPct = internalSymbol.includes('USD') || internalSymbol.includes('EUR') || internalSymbol.includes('GBP')
        ? 0.0001 : 0.0005;
      const spread = ltp * spreadPct;
      const bid = +(ltp - spread / 2).toFixed(4);
      const ask = +(ltp + spread / 2).toFixed(4);

      // Build normalized tick (same format as angelOneFeed.js)
      const tick = {
        symbol: internalSymbol,
        ltp: ltp,
        price: ltp,
        bid: bid,
        ask: ask,
        spread: +spread.toFixed(4),
        change: +change.toFixed(2),
        change_percent: +changePct.toFixed(2),
        high: dayHigh,
        low: dayLow,
        open: dayOpen,
        prev_close: prevClose,
        volume: volume,
        timestamp: Date.now(),
        _debug: { source: 'yahoo', latencyMs: 0 }
      };

      lastPrices[internalSymbol] = ltp;

      // Broadcast tick to subscribers (goes to candle aggregator + execution engine + frontend)
      broadcastTick(tick);

      // Queue DB update
      dbUpdates.push({
        symbol: internalSymbol,
        last_price: ltp,
        change_amount: +change.toFixed(2),
        change_percent: +changePct.toFixed(2),
        day_high: dayHigh,
        day_low: dayLow,
        day_open: dayOpen,
        prev_close: prevClose,
        volume: volume,
        bid_price: bid,
        ask_price: ask,
      });
    }

    // Batch update instrument prices in DB (non-blocking)
    if (dbUpdates.length > 0) {
      updateInstrumentPrices(dbUpdates);
    }

  } catch (err) {
    // yahoo-finance2 can throw on rate limit or network issues
    console.error('❌ Yahoo Feed: Quote fetch error:', err.message);
  }
}

/**
 * Update instrument prices in Supabase
 */
async function updateInstrumentPrices(updates) {
  try {
    // Batch upsert — update each instrument's price
    for (const update of updates) {
      await supabaseAdmin
        .from('instruments')
        .update({
          last_price: update.last_price,
          change_amount: update.change_amount,
          change_percent: update.change_percent,
          day_high: update.day_high,
          day_low: update.day_low,
          day_open: update.day_open,
          prev_close: update.prev_close,
          volume: update.volume,
          bid_price: update.bid_price,
          ask_price: update.ask_price,
        })
        .eq('symbol', update.symbol);
    }
  } catch (err) {
    // Non-critical — prices still flow via WebSocket
    console.error('❌ Yahoo Feed: DB update error:', err.message);
  }
}

/**
 * Initialize the Yahoo Finance feed
 */
async function initYahooFeed() {
  console.log('📡 Initializing Yahoo Finance live price feed...');
  
  await loadInstruments();

  if (Object.keys(symbolMap).length === 0) {
    console.error('❌ Yahoo Feed: No instruments mapped. Feed not started.');
    return;
  }

  // Fetch immediately on start
  await fetchQuotes();

  // Then poll every 5 seconds (Yahoo allows reasonable polling)
  feedInterval = setInterval(fetchQuotes, 5000);
  isRunning = true;

  console.log(`✅ Yahoo Finance feed started — polling ${Object.keys(symbolMap).length} symbols every 5s`);
}

/**
 * Stop the feed
 */
function stopYahooFeed() {
  if (feedInterval) clearInterval(feedInterval);
  isRunning = false;
  console.log('🛑 Yahoo Finance feed stopped');
}

/**
 * Subscribe to ticks
 */
function onTick(callback) {
  tickSubscribers.push(callback);
}

function broadcastTick(tick) {
  tickSubscribers.forEach(cb => {
    try { cb(tick); } catch (e) { /* ignore subscriber errors */ }
  });
}

/**
 * Get debug stats
 */
function getDebugStats() {
  return {
    connected: isRunning,
    source: 'Yahoo Finance',
    subscriptions: Object.keys(symbolMap).length,
    packetsPerSec: 0,
    reconnects: 0,
  };
}

/**
 * Get latest tick for a symbol
 */
function getLatestTick(symbol) {
  const price = lastPrices[symbol];
  if (!price) return null;
  return { symbol, ltp: price, timestamp: Date.now() };
}

// Placeholder for API compatibility with angelOneFeed
function subscribeTokens() {}
function unsubscribeTokens() {}

module.exports = {
  initYahooFeed,
  stopYahooFeed,
  subscribeTokens,
  unsubscribeTokens,
  onTick,
  getDebugStats,
  getLatestTick,
};
