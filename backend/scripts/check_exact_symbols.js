const fs = require('fs');
const zlib = require('zlib');
const axios = require('axios');

async function run() {
  try {
    const response = await axios.get('https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz', {
      responseType: 'arraybuffer'
    });
    const decompressed = zlib.gunzipSync(response.data);
    const nse = JSON.parse(decompressed.toString('utf8'));
    
    // Search exact trading_symbol
    const symbolsToFind = ['ZOMATO', 'LTIM', 'BANKBARODA', 'LODHA'];
    for (const sym of symbolsToFind) {
      const match = nse.find(inst => inst.trading_symbol === sym && inst.segment === 'NSE_EQ');
      console.log(`\nExact match for ${sym}:`, match ? {
        trading_symbol: match.trading_symbol,
        name: match.name,
        instrument_key: match.instrument_key
      } : 'NOT FOUND');
    }
    
    // Search by partial symbol
    console.log('\n--- Partial matches for ZOM ---');
    console.log(nse.filter(inst => inst.trading_symbol && inst.trading_symbol.startsWith('ZOM') && inst.segment === 'NSE_EQ').map(m => m.trading_symbol));

    console.log('\n--- Partial matches for LTI ---');
    console.log(nse.filter(inst => inst.trading_symbol && inst.trading_symbol.startsWith('LTI') && inst.segment === 'NSE_EQ').map(m => m.trading_symbol));

    console.log('\n--- Partial matches for LOD ---');
    console.log(nse.filter(inst => inst.trading_symbol && inst.trading_symbol.startsWith('LOD') && inst.segment === 'NSE_EQ').map(m => m.trading_symbol));

    console.log('\n--- Partial matches for BARODA ---');
    console.log(nse.filter(inst => inst.trading_symbol && inst.trading_symbol.includes('BARODA') && inst.segment === 'NSE_EQ').map(m => m.trading_symbol));

  } catch (err) {
    console.error(err.message);
  }
  process.exit(0);
}

run();
