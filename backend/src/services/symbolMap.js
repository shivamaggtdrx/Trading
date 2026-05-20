/**
 * Unified Symbol Map
 * 
 * Maps internal instrument symbols (e.g., 'RELIANCE', 'AAPL', 'BTCUSDT')
 * to the correct provider-specific symbols for Finnhub and Binance.
 * 
 * Loads mappings from Supabase instruments table on startup,
 * with comprehensive hardcoded fallbacks for all known instruments.
 */

const { feedLogger } = require('../core/monitoring/logger');

// ── Segment-to-provider routing ──
// Determines which feed provider handles each instrument segment
const SEGMENT_PROVIDER = {
  'nse_equity': 'finnhub',
  'bse_equity': 'finnhub',
  'fo_futures': 'finnhub',
  'fo_options': 'finnhub',
  'forex': 'finnhub',
  'mcx': 'finnhub',
  'crypto': 'binance',
  'us_equity': 'finnhub',
  'global_indices': 'finnhub',
};

// ── Finnhub symbol mappings ──
// Internal symbol → Finnhub symbol
const FINNHUB_MAP = {
  // Indian Equities (NSE) — Finnhub uses SYMBOL.NS format for Indian stocks via REST
  // For WebSocket, Finnhub may use exchange:symbol format
  'RELIANCE': 'RELIANCE.NS',
  'HDFCBANK': 'HDFCBANK.NS',
  'TCS': 'TCS.NS',
  'INFY': 'INFY.NS',
  'ICICIBANK': 'ICICIBANK.NS',
  'WIPRO': 'WIPRO.NS',
  'BAJFINANCE': 'BAJFINANCE.NS',
  'SBIN': 'SBIN.NS',
  'TATAMOTORS': 'TATAMOTORS.NS',
  'KOTAKBANK': 'KOTAKBANK.NS',
  'HINDUNILVR': 'HINDUNILVR.NS',
  'LT': 'LT.NS',
  'MARUTI': 'MARUTI.NS',
  'ADANIENT': 'ADANIENT.NS',
  'SUNPHARMA': 'SUNPHARMA.NS',
  'ITC': 'ITC.NS',
  'HCLTECH': 'HCLTECH.NS',
  'AXISBANK': 'AXISBANK.NS',
  'ONGC': 'ONGC.NS',
  'NTPC': 'NTPC.NS',
  'TATASTEEL': 'TATASTEEL.NS',
  'POWERGRID': 'POWERGRID.NS',
  'ULTRACEMCO': 'ULTRACEMCO.NS',
  'COALINDIA': 'COALINDIA.NS',
  'BAJAJFINSV': 'BAJAJFINSV.NS',
  'M&M': 'M&M.NS',
  'TITAN': 'TITAN.NS',
  'GRASIM': 'GRASIM.NS',
  'JSWSTEEL': 'JSWSTEEL.NS',
  'TECHM': 'TECHM.NS',
  'HINDALCO': 'HINDALCO.NS',
  'EICHERMOT': 'EICHERMOT.NS',
  'NESTLEIND': 'NESTLEIND.NS',
  'BHARTIARTL': 'BHARTIARTL.NS',
  'ASIANPAINT': 'ASIANPAINT.NS',
  'HEROMOTOCO': 'HEROMOTOCO.NS',
  'TATACONSUM': 'TATACONSUM.NS',
  'BRITANNIA': 'BRITANNIA.NS',
  'BPCL': 'BPCL.NS',
  'CIPLA': 'CIPLA.NS',
  'DRREDDY': 'DRREDDY.NS',
  'SBILIFE': 'SBILIFE.NS',
  'HDFCLIFE': 'HDFCLIFE.NS',
  'APOLLOHOSP': 'APOLLOHOSP.NS',
  'DIVISLAB': 'DIVISLAB.NS',
  'TATAMTRDVR': 'TATAMTRDVR.NS',
  'BAJAJ-AUTO': 'BAJAJ-AUTO.NS',
  'LTIM': 'LTIM.NS',
  'UPL': 'UPL.NS',
  'ADANIPORTS': 'ADANIPORTS.NS',
  'SHRIRAMFIN': 'SHRIRAMFIN.NS',
  'PNB': 'PNB.NS',
  'BOB': 'BANKBARODA.NS',
  'CANBK': 'CANBK.NS',
  'IDFCFIRSTB': 'IDFCFIRSTB.NS',
  'FEDERALBNK': 'FEDERALBNK.NS',
  'BANDHANBNK': 'BANDHANBNK.NS',
  'AUROPHARMA': 'AUROPHARMA.NS',
  'ZOMATO': 'ZOMATO.NS',
  'JIOFIN': 'JIOFIN.NS',
  'PAYTM': 'PAYTM.NS',
  'NYKAA': 'NYKAA.NS',
  'HAL': 'HAL.NS',
  'BEL': 'BEL.NS',
  'IRFC': 'IRFC.NS',
  'RVNL': 'RVNL.NS',
  'MAZDOCK': 'MAZDOCK.NS',
  'SUZLON': 'SUZLON.NS',
  'TRENT': 'TRENT.NS',
  'CHOLAFIN': 'CHOLAFIN.NS',
  'TORNTPHARM': 'TORNTPHARM.NS',
  'TVSMOTOR': 'TVSMOTOR.NS',
  'GODREJCP': 'GODREJCP.NS',
  'PIDILITIND': 'PIDILITIND.NS',
  'HAVELLS': 'HAVELLS.NS',
  'INDIGO': 'INDIGO.NS',
  'SIEMENS': 'SIEMENS.NS',
  'CUMMINSIND': 'CUMMINSIND.NS',
  'SRF': 'SRF.NS',
  'DLF': 'DLF.NS',
  'MACROTECH': 'MACROTECH.NS',
  'LODHA': 'MACROTECH.NS',
  'PRESTIGE': 'PRESTIGE.NS',
  'OBEROIRLTY': 'OBEROIRLTY.NS',
  'MRF': 'MRF.NS',
  'APOLLOTYRE': 'APOLLOTYRE.NS',
  'CEATLTD': 'CEATLTD.NS',
  'SENSEX': 'BSE:SENSEX',

  // Indian Indices
  'NIFTY50': '^NSEI',
  'BANKNIFTY': '^NSEBANK',

  // US Stocks
  'AAPL': 'AAPL',
  'MSFT': 'MSFT',
  'GOOGL': 'GOOGL',
  'AMZN': 'AMZN',
  'TSLA': 'TSLA',
  'META': 'META',
  'NVDA': 'NVDA',
  'AMD': 'AMD',
  'NFLX': 'NFLX',
  'JPM': 'JPM',
  'V': 'V',
  'WMT': 'WMT',
  'DIS': 'DIS',
  'BA': 'BA',
  'INTC': 'INTC',
  'CSCO': 'CSCO',
  'PFE': 'PFE',
  'KO': 'KO',
  'PEP': 'PEP',
  'NKE': 'NKE',

  // Forex (Finnhub uses OANDA format for forex WebSocket)
  'EURUSD': 'OANDA:EUR_USD',
  'GBPUSD': 'OANDA:GBP_USD',
  'USDJPY': 'OANDA:USD_JPY',
  'USDCHF': 'OANDA:USD_CHF',
  'AUDUSD': 'OANDA:AUD_USD',
  'USDINR': 'OANDA:USD_INR',
  'USDCAD': 'OANDA:USD_CAD',
  'NZDUSD': 'OANDA:NZD_USD',
  'EURJPY': 'OANDA:EUR_JPY',
  'GBPJPY': 'OANDA:GBP_JPY',

  // Commodities (via Finnhub)
  'XAUUSD': 'OANDA:XAU_USD',
  'XAGUSD': 'OANDA:XAG_USD',
  'CRUDEOIL': 'OANDA:BCO_USD',
  'NATURALGAS': 'OANDA:NATGAS_USD',
  'COPPER': 'OANDA:XCU_USD',

  // Global Indices (Finnhub quote endpoint)
  'SPX500': '^GSPC',
  'NASDAQ': '^IXIC',
  'DJI': '^DJI',
  'FTSE100': '^FTSE',
  'DAX': '^GDAXI',
  'NIKKEI': '^N225',
  'HANGSENG': '^HSI',
};

// ── Binance symbol mappings ──
// Internal symbol → Binance lowercase stream symbol
const BINANCE_MAP = {
  'BTCUSDT': 'btcusdt',
  'ETHUSDT': 'ethusdt',
  'BNBUSDT': 'bnbusdt',
  'SOLUSDT': 'solusdt',
  'XRPUSDT': 'xrpusdt',
  'ADAUSDT': 'adausdt',
  'DOTUSDT': 'dotusdt',
  'DOGEUSDT': 'dogeusdt',
  'AVAXUSDT': 'avaxusdt',
  'MATICUSDT': 'maticusdt',
  'LINKUSDT': 'linkusdt',
  'UNIUSDT': 'uniusdt',
  'LTCUSDT': 'ltcusdt',
  'ATOMUSDT': 'atomusdt',
  'ETCUSDT': 'etcusdt',
  'NEARUSDT': 'nearusdt',
  'APTUSDT': 'aptusdt',
  'ARBUSDT': 'arbusdt',
  'OPUSDT': 'opusdt',
  'SHIBUSDT': 'shibusdt',
  'PEPEUSDT': 'pepeusdt',

  // Alternate naming support
  'BITCOIN': 'btcusdt',
  'ETHEREUM': 'ethusdt',
  'BNB': 'bnbusdt',
  'SOLANA': 'solusdt',
  'RIPPLE': 'xrpusdt',
  'CARDANO': 'adausdt',
  'DOGECOIN': 'dogeusdt',
};

// ── Reverse maps (built dynamically) ──
const FINNHUB_REVERSE = {};
const BINANCE_REVERSE = {};

for (const [internal, provider] of Object.entries(FINNHUB_MAP)) {
  FINNHUB_REVERSE[provider] = internal;
  FINNHUB_REVERSE[provider.toUpperCase()] = internal;
  FINNHUB_REVERSE[provider.toLowerCase()] = internal;
}

for (const [internal, provider] of Object.entries(BINANCE_MAP)) {
  BINANCE_REVERSE[provider] = internal;
  BINANCE_REVERSE[provider.toUpperCase()] = internal;
}

// ── Active instruments (populated from DB on startup) ──
let activeInstruments = [];
let instrumentsBySegment = {};

/**
 * Load active instruments from Supabase and enrich the maps
 */
async function loadFromDatabase() {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    const { data, error } = await supabaseAdmin
      .from('instruments')
      .select('symbol, segment, name, is_active')
      .eq('is_active', true);

    if (error) {
      feedLogger.error(`Symbol map DB load error: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      activeInstruments = data;
      
      // Group by segment
      instrumentsBySegment = {};
      data.forEach(inst => {
        const seg = inst.segment || 'unknown';
        if (!instrumentsBySegment[seg]) instrumentsBySegment[seg] = [];
        instrumentsBySegment[seg].push(inst.symbol);
      });

      feedLogger.info(`Symbol map loaded ${data.length} active instruments from database`);
      feedLogger.info(`Segments: ${Object.keys(instrumentsBySegment).join(', ')}`);
    }
  } catch (err) {
    feedLogger.error(`Symbol map DB load failed: ${err.message}`);
  }
}

/**
 * Get the provider name for an internal symbol
 * @param {string} symbol - Internal symbol
 * @returns {'finnhub'|'binance'|null}
 */
function getProvider(symbol) {
  if (!symbol) return null;
  const upper = symbol.toUpperCase().trim();
  
  // Check Binance first (crypto)
  if (BINANCE_MAP[upper]) return 'binance';
  
  // Check Finnhub
  if (FINNHUB_MAP[upper]) return 'finnhub';
  
  // Try to infer from segment in DB
  const inst = activeInstruments.find(i => i.symbol === upper);
  if (inst && inst.segment) {
    return SEGMENT_PROVIDER[inst.segment] || 'finnhub';
  }

  // Default: try Finnhub
  return 'finnhub';
}

/**
 * Get Finnhub symbol for an internal symbol
 * @param {string} symbol - Internal symbol
 * @returns {string|null}
 */
function toFinnhubSymbol(symbol) {
  if (!symbol) return null;
  const upper = symbol.toUpperCase().trim();
  return FINNHUB_MAP[upper] || null;
}

/**
 * Get Binance stream symbol for an internal symbol
 * @param {string} symbol - Internal symbol
 * @returns {string|null}
 */
function toBinanceSymbol(symbol) {
  if (!symbol) return null;
  const upper = symbol.toUpperCase().trim();
  return BINANCE_MAP[upper] || null;
}

/**
 * Convert a Finnhub symbol back to internal symbol
 * @param {string} finnhubSymbol 
 * @returns {string|null}
 */
function fromFinnhubSymbol(finnhubSymbol) {
  if (!finnhubSymbol) return null;
  return FINNHUB_REVERSE[finnhubSymbol] || FINNHUB_REVERSE[finnhubSymbol.toUpperCase()] || null;
}

/**
 * Convert a Binance stream symbol back to internal symbol
 * @param {string} binanceSymbol 
 * @returns {string|null}
 */
function fromBinanceSymbol(binanceSymbol) {
  if (!binanceSymbol) return null;
  return BINANCE_REVERSE[binanceSymbol] || BINANCE_REVERSE[binanceSymbol.toUpperCase()] || null;
}

/**
 * Get all Finnhub symbols that should be subscribed to
 * @returns {string[]}
 */
function getAllFinnhubSymbols() {
  const symbols = new Set();
  
  // From active instruments
  for (const inst of activeInstruments) {
    const provider = getProvider(inst.symbol);
    if (provider === 'finnhub') {
      const fhSym = toFinnhubSymbol(inst.symbol);
      if (fhSym) symbols.add(fhSym);
    }
  }

  // Always include key indices
  symbols.add(FINNHUB_MAP['NIFTY50']);
  symbols.add(FINNHUB_MAP['BANKNIFTY']);

  return Array.from(symbols).filter(Boolean);
}

/**
 * Get all Binance symbols that should be subscribed to
 * @returns {string[]}
 */
function getAllBinanceSymbols() {
  const symbols = new Set();
  
  // From active instruments
  for (const inst of activeInstruments) {
    const provider = getProvider(inst.symbol);
    if (provider === 'binance') {
      const bnSym = toBinanceSymbol(inst.symbol);
      if (bnSym) symbols.add(bnSym);
    }
  }

  return Array.from(symbols).filter(Boolean);
}

/**
 * Get all active instrument symbols
 * @returns {string[]}
 */
function getActiveSymbols() {
  return activeInstruments.map(i => i.symbol);
}

/**
 * Get instruments grouped by segment
 * @returns {Object}
 */
function getInstrumentsBySegment() {
  return { ...instrumentsBySegment };
}

module.exports = {
  loadFromDatabase,
  getProvider,
  toFinnhubSymbol,
  toBinanceSymbol,
  fromFinnhubSymbol,
  fromBinanceSymbol,
  getAllFinnhubSymbols,
  getAllBinanceSymbols,
  getActiveSymbols,
  getInstrumentsBySegment,
  SEGMENT_PROVIDER,
};
