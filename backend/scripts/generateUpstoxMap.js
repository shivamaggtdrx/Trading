require('dotenv').config();
const axios = require('axios');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../src/config/supabase');

async function run() {
  try {
    console.log('1. Querying active symbols from Supabase...');
    const { data: dbInstruments, error: dbError } = await supabaseAdmin
      .from('instruments')
      .select('symbol, exchange')
      .eq('is_active', true);
      
    if (dbError) {
      throw new Error(`DB Query failed: ${dbError.message}`);
    }
    
    const dbSymbols = dbInstruments.map(d => d.symbol.toUpperCase());
    console.log(`Found ${dbSymbols.length} active symbols in database.`);
    
    console.log('2. Downloading NSE instruments master from Upstox assets...');
    const response = await axios.get('https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz', {
      responseType: 'arraybuffer'
    });
    
    console.log('Decompressing and parsing master list...');
    const decompressed = zlib.gunzipSync(response.data);
    const nseInstruments = JSON.parse(decompressed.toString('utf8'));
    console.log(`NSE master contains ${nseInstruments.length} instruments.`);
    
    const symbolMap = {};
    
    // Manual overrides for indices, forex, commodities, and mismatches
    const overrides = {
      'NIFTY50': 'NSE_INDEX|Nifty 50',
      'BANKNIFTY': 'NSE_INDEX|Nifty Bank',
      'NIFTY': 'NSE_INDEX|Nifty 50',
      'BANKNIFTY_INDEX': 'NSE_INDEX|Nifty Bank',
      'BOB': 'NSE_EQ|INE028A01039',
      'MACROTECH': 'NSE_EQ|INE670K01029',
      'TATAMOTORS': 'NSE_EQ|INE155A01022',
      'TATAMTRDVR': 'NSE_EQ|INE996A01028',
      'ZOMATO': 'NSE_EQ|INE758T01015',
      'LTIM': 'NSE_EQ|INE214B01012',
      'SENSEX': 'BSE_INDEX|SENSEX',
      'USDINR': 'NSE_CD|USDINR',
      'CRUDEOIL': 'MCX_FO|CRUDEOIL',
      'NATURALGAS': 'MCX_FO|NATURALGAS',
      'XAUUSD': 'MCX_FO|GOLD',
      'XAGUSD': 'MCX_FO|SILVER',
      'USDJPY': 'NSE_CD|USDJPY',
      'USDCHF': 'NSE_CD|USDCHF',
      'GBPUSD': 'NSE_CD|GBPUSD',
      'AUDUSD': 'NSE_CD|AUDUSD',
      'EURUSD': 'NSE_CD|EURUSD',
      'COPPER': 'MCX_FO|COPPER'
    };
    
    console.log('3. Mapping symbols...');
    for (const symbol of dbSymbols) {
      if (overrides[symbol]) {
        symbolMap[symbol] = overrides[symbol];
        continue;
      }
      
      // Try to find equity matching trading_symbol
      let match = nseInstruments.find(inst => inst.trading_symbol === symbol && inst.segment === 'NSE_EQ');
      
      // Try index segment if not found as equity
      if (!match) {
        match = nseInstruments.find(inst => inst.trading_symbol === symbol && inst.segment === 'NSE_INDEX');
      }
      
      if (match) {
        symbolMap[symbol] = match.instrument_key;
      } else {
        // Log not found symbols (forex, MCX etc.)
        console.log(`⚠️ No direct NSE match for: ${symbol}`);
      }
    }
    
    console.log(`Mapped ${Object.keys(symbolMap).length} / ${dbSymbols.length} symbols.`);
    
    // Save to service folder
    const targetDir = path.join(__dirname, '../src/services');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const targetFile = path.join(targetDir, 'upstoxSymbolMap.json');
    fs.writeFileSync(targetFile, JSON.stringify(symbolMap, null, 2));
    console.log(`Success! Saved mapping to ${targetFile}`);
    
  } catch (err) {
    console.error('Error generating Upstox map:', err.message);
  }
  process.exit(0);
}

run();
