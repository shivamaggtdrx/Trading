/**
 * Tick Normalizer
 * 
 * Standardizes raw ticks from any feed source (Angel One, Yahoo, future providers)
 * into a consistent format with server-side timestamps and validation.
 * 
 * CRITICAL: This runs on EVERY tick. Must be fast and non-blocking.
 */

let tickSequence = 0;

/**
 * Normalize a raw tick into the standard internal format.
 * Rejects corrupted/invalid ticks.
 * Preserves extra fields (change, high, low, open, volume) for frontend display.
 * 
 * @param {object} rawTick - Raw tick from any feed source
 * @returns {object|null} - Normalized tick, or null if rejected
 */
function normalizeTick(rawTick) {
  const { symbol, ltp, bid, ask, timestamp } = rawTick;

  // ── Validation: Reject corrupted ticks ──
  if (!symbol || typeof symbol !== 'string') return null;
  if (!ltp || typeof ltp !== 'number' || ltp <= 0) return null;
  if (isNaN(ltp) || !isFinite(ltp)) return null;

  // Reject absurd prices (likely data corruption)
  if (ltp > 1000000 || ltp < 0.01) return null;

  // ── Apply server timestamp ──
  const serverTimestamp = Date.now();
  const feedTimestamp = timestamp || serverTimestamp;
  const feedLatencyMs = serverTimestamp - feedTimestamp;

  // Reject stale ticks (older than 30 seconds)
  if (feedLatencyMs > 30000) {
    return null;
  }

  tickSequence++;

  return {
    // Core normalized fields
    symbol: symbol.toUpperCase().trim(),
    ltp: Math.round(ltp * 10000) / 10000,
    price: Math.round(ltp * 10000) / 10000, // Alias for frontend compat
    bid: (bid && bid > 0) ? Math.round(bid * 10000) / 10000 : ltp,
    ask: (ask && ask > 0) ? Math.round(ask * 10000) / 10000 : ltp,
    spread: (ask && bid && ask > 0 && bid > 0)
      ? Math.round((ask - bid) * 10000) / 10000
      : 0,
    timestamp: serverTimestamp,
    feedTimestamp: feedTimestamp,
    feedLatencyMs: feedLatencyMs,
    sequence: tickSequence,
    // Pass-through fields for frontend display (from Yahoo/Angel feed)
    change: rawTick.change || 0,
    change_percent: rawTick.change_percent || 0,
    high: rawTick.high || 0,
    low: rawTick.low || 0,
    open: rawTick.open || 0,
    prev_close: rawTick.prev_close || 0,
    volume: rawTick.volume || 0,
  };
}

/**
 * Get normalizer stats for monitoring
 */
function getNormalizerStats() {
  return {
    totalTicksProcessed: tickSequence,
  };
}

module.exports = { normalizeTick, getNormalizerStats };
