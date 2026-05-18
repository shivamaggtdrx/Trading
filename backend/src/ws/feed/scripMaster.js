const fs = require('fs');
const path = require('path');
const { feedLogger } = require('../../core/monitoring/logger');

const CACHE_FILE = path.join(__dirname, '../../../../logs/scripMasterCache.json');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Robust fallback maps for all seed instruments & watchlists
const FALLBACK_SYMBOL_TO_TOKEN = {
  'RELIANCE': '2885',
  'TCS': '11536',
  'HDFCBANK': '1333',
  'INFY': '1594',
  'ICICIBANK': '10893',
  'WIPRO': '3787',
  'BAJFINANCE': '317',
  'SBIN': '3045',
  'TATAMOTORS': '3456',
  'KOTAKBANK': '1922',
  'HINDUNILVR': '1394',
  'LT': '11483',
  'MARUTI': '10999',
  'ADANIENT': '25',
  'SUNPHARMA': '3351',
  'APOLLOTYRE': '163',
  'PRESTIGE': '20302',
  'ASIANPAINT': '236',
  'NIFTY50': '26000',
  'NIFTY': '26000',
  'BANKNIFTY': '26009',
  'USDINR': '99926000',
};

const FALLBACK_TOKEN_TO_SYMBOL = {};
Object.entries(FALLBACK_SYMBOL_TO_TOKEN).forEach(([sym, tok]) => {
  FALLBACK_TOKEN_TO_SYMBOL[tok] = sym;
});

// Dynamic maps built on startup
let symbolToTokenMap = { ...FALLBACK_SYMBOL_TO_TOKEN };
let tokenToSymbolMap = { ...FALLBACK_TOKEN_TO_SYMBOL };
let isLoaded = false;

/**
 * Download the Scrip Master JSON from Angel One
 */
async function loadScripMaster() {
  if (isLoaded) return;

  try {
    // Ensure logs folder exists
    const logsDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    let rawData = null;
    let useCache = false;

    // Check if cache file is fresh
    if (fs.existsSync(CACHE_FILE)) {
      const stats = fs.statSync(CACHE_FILE);
      const ageMs = Date.now() - stats.mtimeMs;
      if (ageMs < CACHE_MAX_AGE_MS) {
        useCache = true;
        feedLogger.info('📊 Loading Scrip Master from local cache...');
        rawData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      }
    }

    if (!useCache) {
      feedLogger.info('📡 Downloading fresh Scrip Master from Angel One...');
      const response = await fetch('https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      rawData = await response.json();
      
      // Cache it for next time
      fs.writeFileSync(CACHE_FILE, JSON.stringify(rawData), 'utf8');
      feedLogger.info('✅ Scrip Master cached successfully.');
    }

    if (Array.isArray(rawData)) {
      let count = 0;
      rawData.forEach(item => {
        // Map NSE Equities (symbol ending in -EQ or matching indices NIFTY/BANKNIFTY/SENSEX)
        if (item.exch_seg === 'NSE') {
          const symName = item.name.toUpperCase();
          
          if (item.symbol.endsWith('-EQ')) {
            symbolToTokenMap[symName] = item.token;
            tokenToSymbolMap[item.token] = symName;
            count++;
          } else if (item.token === '26000' || item.token === '26009') {
            const indexName = item.token === '26000' ? 'NIFTY50' : 'BANKNIFTY';
            symbolToTokenMap[indexName] = item.token;
            tokenToSymbolMap[item.token] = indexName;
            count++;
          }
        }
      });
      feedLogger.info(`📊 Scrip Master: Loaded ${count} NSE equity symbol mappings.`);
      isLoaded = true;
    }
  } catch (error) {
    feedLogger.warn(`⚠️ Failed to load Scrip Master: ${error.message || error}. Falling back to robust static map.`);
    // Already populated with robust fallbacks
    isLoaded = true;
  }
}

/**
 * Map Symbol String to Numeric Token
 */
function symbolToToken(symbol) {
  if (!symbol) return null;
  const cleanSymbol = symbol.toUpperCase().trim();
  // Handle alias mapping
  if (cleanSymbol === 'NIFTY') return symbolToTokenMap['NIFTY50'] || '26000';
  return symbolToTokenMap[cleanSymbol] || null;
}

/**
 * Map Numeric Token to Symbol String
 */
function tokenToSymbol(token) {
  if (!token) return null;
  const cleanToken = String(token).trim();
  return tokenToSymbolMap[cleanToken] || null;
}

module.exports = {
  loadScripMaster,
  symbolToToken,
  tokenToSymbol,
};
