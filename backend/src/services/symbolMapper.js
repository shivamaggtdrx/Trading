/**
 * Upstox Symbol Mapper Service
 * 
 * Provides bi-directional mapping between Stocks Lab internal symbol names (e.g., 'RELIANCE', 'NIFTY50')
 * and Upstox instrument keys (e.g., 'NSE_EQ|INE002A01018', 'NSE_INDEX|Nifty 50').
 */

const upstoxSymbolMap = require('./upstoxSymbolMap.json');

// Build reverse map dynamically for O(1) reverse lookups
const reverseSymbolMap = {};
for (const [internalSymbol, upstoxKey] of Object.entries(upstoxSymbolMap)) {
  reverseSymbolMap[upstoxKey] = internalSymbol;
}

/**
 * Get Upstox Instrument Key for an internal symbol
 * 
 * @param {string} symbol - Standard symbol name (e.g. 'RELIANCE')
 * @returns {string|null} - Upstox instrument key, or null if not found
 */
function toUpstoxKey(symbol) {
  if (!symbol) return null;
  const upperSymbol = symbol.toUpperCase().trim();
  return upstoxSymbolMap[upperSymbol] || null;
}

/**
 * Get internal symbol name for an Upstox Instrument Key
 * 
 * @param {string} upstoxKey - Upstox instrument key (e.g. 'NSE_EQ|INE002A01018')
 * @returns {string|null} - Internal symbol name, or null if not found
 */
function toInternalSymbol(upstoxKey) {
  if (!upstoxKey) return null;
  return reverseSymbolMap[upstoxKey] || null;
}

/**
 * Get all mapped Upstox keys
 * 
 * @returns {string[]} - Array of all Upstox keys
 */
function getAllUpstoxKeys() {
  return Object.values(upstoxSymbolMap);
}

module.exports = {
  toUpstoxKey,
  toInternalSymbol,
  getAllUpstoxKeys
};
