/**
 * High-Frequency Price Animator
 * 
 * This is the SECRET SAUCE that makes dabba trading apps feel like Zerodha.
 * 
 * Between real price ticks (which come every 2-5 seconds from NSE/Binance),
 * this module generates realistic micro-price-movements at HIGH FREQUENCY
 * (every 100-150ms = 6-10 updates per second) so the UI feels alive.
 * 
 * How it works:
 * 1. Real ticks from NSE/Binance set the "anchor price" for each symbol
 * 2. The animator runs at 100-150ms intervals
 * 3. For each symbol that has active watchers, it generates a tiny random
 *    variation (±0.01% to ±0.05%) around the anchor price
 * 4. These micro-ticks are emitted via Socket.IO to make the UI flicker
 * 5. When a NEW real tick arrives, the anchor resets to the actual market price
 * 
 * This is EXACTLY how tradex1.live, markettrade.live, and other dabba platforms
 * achieve their "Zerodha-like" price speed.
 */

const { getIO } = require('./socketServer');
const { feedLogger } = require('../core/monitoring/logger');

// ── Configuration ──
const ANIMATION_INTERVAL_MS = 130;     // ~7-8 updates per second
const MICRO_VARIATION_PCT = 0.00015;   // ±0.015% max variation from anchor
const SPREAD_VARIATION_PCT = 0.00008;  // Bid/ask spread micro-variation

// ── State ──
const anchorPrices = new Map();   // symbol → { price, bid, ask, high, low, open, prev_close, change, changePct, volume, exchange, timestamp }
const activeRooms = new Set();     // Symbols with active Socket.IO watchers
let animatorInterval = null;
let tickCount = 0;

/**
 * Update the anchor price for a symbol (called when a REAL tick arrives)
 * @param {Object} tick - Real tick from NSE/Binance/Finnhub
 */
function updateAnchor(tick) {
  if (!tick || !tick.symbol) return;

  const price = tick.ltp || tick.price;
  if (!price || price <= 0) return;

  anchorPrices.set(tick.symbol, {
    price,
    bid: tick.bid || price,
    ask: tick.ask || price,
    high: tick.high || price,
    low: tick.low || price,
    open: tick.open || price,
    prev_close: tick.prev_close || 0,
    change: tick.change || 0,
    changePct: tick.changePercent || tick.change_percent || 0,
    volume: tick.volume || 0,
    exchange: tick.exchange || 'NSE',
    lastRealTick: Date.now(),
    // Track the "drift" — how far the animated price has moved from anchor
    currentAnimatedPrice: price,
  });
}

/**
 * Register a symbol as having active watchers
 * (Called when a client joins a feed room)
 */
function addActiveSymbol(symbol) {
  activeRooms.add(symbol);
}

/**
 * Remove a symbol from active watching
 */
function removeActiveSymbol(symbol) {
  activeRooms.delete(symbol);
}

/**
 * Start the high-frequency price animator
 */
function startAnimator() {
  if (animatorInterval) return;

  feedLogger.info(`[ANIMATOR] 🚀 Starting high-frequency price animator (${Math.round(1000 / ANIMATION_INTERVAL_MS)} ticks/sec per symbol)`);

  animatorInterval = setInterval(() => {
    try {
      const io = getIO();
      const marketNs = io.of('/market');

      // Get all rooms that actually have connected clients
      const rooms = marketNs.adapter?.rooms;
      if (!rooms) return;

      // Iterate all anchor prices and animate the ones with active listeners
      for (const [symbol, anchor] of anchorPrices) {
        const roomName = `feed:${symbol}`;

        // Only animate if someone is actually watching this symbol
        if (!rooms.has(roomName)) continue;

        const roomSize = rooms.get(roomName)?.size || 0;
        if (roomSize === 0) continue;

        // Generate realistic micro-variation
        const microTick = generateMicroTick(symbol, anchor);
        if (!microTick) continue;

        // Emit to the room
        marketNs.to(roomName).emit('MARKET:TICK', microTick);
        tickCount++;
      }
    } catch (err) {
      // Silently skip — don't let animator errors crash the server
    }
  }, ANIMATION_INTERVAL_MS);
}

/**
 * Generate a realistic micro-tick variation from the anchor price
 */
function generateMicroTick(symbol, anchor) {
  const basePrice = anchor.currentAnimatedPrice || anchor.price;
  if (!basePrice || basePrice <= 0) return null;

  // Generate random micro-movement
  // Use a slight mean-reversion toward anchor price to prevent drift
  const driftFromAnchor = (basePrice - anchor.price) / anchor.price;
  const meanReversion = -driftFromAnchor * 0.3; // Pull back toward anchor

  // Random walk component
  const randomWalk = (Math.random() - 0.5) * 2 * MICRO_VARIATION_PCT;

  // Combined movement
  const totalMovement = randomWalk + meanReversion;
  const newPrice = +(basePrice * (1 + totalMovement)).toFixed(getDecimalPlaces(basePrice));

  // Update the animated price state
  anchor.currentAnimatedPrice = newPrice;

  // Calculate bid/ask with micro-spread
  const spreadVariation = basePrice * SPREAD_VARIATION_PCT;
  const bid = +(newPrice - spreadVariation * (0.5 + Math.random() * 0.5)).toFixed(getDecimalPlaces(basePrice));
  const ask = +(newPrice + spreadVariation * (0.5 + Math.random() * 0.5)).toFixed(getDecimalPlaces(basePrice));

  // Update high/low if the animated price exceeds
  const high = Math.max(anchor.high, newPrice);
  const low = Math.min(anchor.low, newPrice);

  // Calculate change from previous close
  const change = anchor.prev_close > 0 ? +(newPrice - anchor.prev_close).toFixed(getDecimalPlaces(basePrice)) : anchor.change;
  const changePct = anchor.prev_close > 0 ? +((newPrice - anchor.prev_close) / anchor.prev_close * 100).toFixed(2) : anchor.changePct;

  return {
    symbol,
    exchange: anchor.exchange,
    price: newPrice,
    ltp: newPrice,
    bid,
    ask,
    high,
    low,
    open: anchor.open,
    prev_close: anchor.prev_close,
    change,
    changePercent: changePct,
    volume: anchor.volume,
    timestamp: Date.now(),
    _debug: { source: 'animator', anchorPrice: anchor.price },
  };
}

/**
 * Determine appropriate decimal places based on price magnitude
 */
function getDecimalPlaces(price) {
  if (price >= 1000) return 2;
  if (price >= 10) return 2;
  if (price >= 1) return 4;
  if (price >= 0.01) return 6;
  return 10; // For micro-priced tokens like PEPE/SHIB
}

/**
 * Stop the animator
 */
function stopAnimator() {
  if (animatorInterval) {
    clearInterval(animatorInterval);
    animatorInterval = null;
  }
  feedLogger.info(`[ANIMATOR] Stopped. Total micro-ticks emitted: ${tickCount}`);
}

/**
 * Get animator stats
 */
function getAnimatorStats() {
  return {
    running: !!animatorInterval,
    anchorSymbols: anchorPrices.size,
    activeWatchers: activeRooms.size,
    totalMicroTicks: tickCount,
    intervalMs: ANIMATION_INTERVAL_MS,
    ticksPerSecond: Math.round(1000 / ANIMATION_INTERVAL_MS),
  };
}

module.exports = {
  updateAnchor,
  addActiveSymbol,
  removeActiveSymbol,
  startAnimator,
  stopAnimator,
  getAnimatorStats,
};
