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
    symbol: symbol.toUpperCase().trim(),
    ltp: Math.round(ltp * 10000) / 10000, // 4 decimal precision
    bid: (bid && bid > 0) ? Math.round(bid * 10000) / 10000 : ltp,
    ask: (ask && ask > 0) ? Math.round(ask * 10000) / 10000 : ltp,
    spread: (ask && bid && ask > 0 && bid > 0)
      ? Math.round((ask - bid) * 10000) / 10000
      : 0,
    timestamp: serverTimestamp,        // Server-authoritative timestamp
    feedTimestamp: feedTimestamp,       // Original feed timestamp (for debugging)
    feedLatencyMs: feedLatencyMs,      // Feed delivery latency
    sequence: tickSequence,            // Monotonic sequence number
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
