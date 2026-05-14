/**
 * Server-side Candle Aggregator
 * Aggregates live ticks into 1m, 5m, 15m, 1h candles in memory
 */

const candleStore = {};

/**
 * Valid timeframe intervals in milliseconds
 */
const TIMEFRAMES = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000
};

/**
 * Initialize store for a symbol
 */
function initSymbol(symbol, initialPrice = 100) {
  if (!candleStore[symbol]) {
    candleStore[symbol] = {
      '1m': [],
      '5m': [],
      '15m': [],
      '1h': []
    };
    
    // Seed historical data so chart isn't empty initially
    const now = Date.now();
    Object.keys(TIMEFRAMES).forEach(tf => {
      const tfMs = TIMEFRAMES[tf];
      const count = 200;
      let currentPrice = initialPrice;
      let time = now - (count * tfMs);
      
      for(let i=0; i<count; i++) {
        const bucketTime = getBucketTime(time, tfMs) / 1000;
        const volatility = currentPrice * 0.003;
        const open = currentPrice + (Math.random() - 0.5) * volatility;
        const high = open + Math.random() * volatility;
        const low = open - Math.random() * volatility;
        const close = low + Math.random() * (high - low);
        
        candleStore[symbol][tf].push({
          time: bucketTime,
          open, high, low, close,
          volume: Math.floor(Math.random() * 1000)
        });
        
        currentPrice = close;
        time += tfMs;
      }
    });
  }
}

/**
 * Get bucket time based on timeframe
 */
function getBucketTime(timestamp, timeframeMs) {
  return Math.floor(timestamp / timeframeMs) * timeframeMs;
}

/**
 * Process a normalized tick to update candles
 */
function processTickForCandles(tick) {
  const { symbol, ltp, timestamp } = tick;
  initSymbol(symbol, ltp);

  // Update each timeframe
  Object.keys(TIMEFRAMES).forEach(tf => {
    const tfMs = TIMEFRAMES[tf];
    const bucketTime = getBucketTime(timestamp, tfMs) / 1000; // UNIX timestamp in seconds
    
    const tfCandles = candleStore[symbol][tf];
    let currentCandle = tfCandles.length > 0 ? tfCandles[tfCandles.length - 1] : null;

    if (!currentCandle || currentCandle.time !== bucketTime) {
      // Create new candle
      currentCandle = {
        time: bucketTime,
        open: ltp,
        high: ltp,
        low: ltp,
        close: ltp,
        volume: 1
      };
      tfCandles.push(currentCandle);
      
      // Keep memory bounded (e.g., last 500 candles per timeframe)
      if (tfCandles.length > 500) {
        tfCandles.shift();
      }
    } else {
      // Update existing candle
      currentCandle.high = Math.max(currentCandle.high, ltp);
      currentCandle.low = Math.min(currentCandle.low, ltp);
      currentCandle.close = ltp;
      currentCandle.volume += 1;
    }
  });
}

/**
 * Get historical candles from memory
 */
function getCandles(symbol, timeframe) {
  if (candleStore[symbol] && candleStore[symbol][timeframe]) {
    return candleStore[symbol][timeframe];
  }
  return [];
}

/**
 * Get latest live candle for a timeframe
 */
function getLatestCandle(symbol, timeframe) {
  const candles = getCandles(symbol, timeframe);
  return candles.length > 0 ? candles[candles.length - 1] : null;
}

module.exports = {
  processTickForCandles,
  getCandles,
  getLatestCandle
};
