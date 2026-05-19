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
    
    const targets = ['TATAMOTORS', 'LTIM', 'BOB', 'ZOMATO', 'MACROTECH', 'TATAMTRDVR'];
    
    for (const target of targets) {
      console.log(`\n--- Matches for target: ${target} ---`);
      const matches = nse.filter(inst => 
        inst.name && 
        (inst.name.toLowerCase().includes(target.toLowerCase()) || 
         inst.name.toLowerCase().replace(/\s+/g, '').includes(target.toLowerCase())) &&
        (inst.segment === 'NSE_EQ' || inst.segment === 'NSE_INDEX')
      );
      console.log(matches.slice(0, 5).map(m => ({
        trading_symbol: m.trading_symbol,
        name: m.name,
        instrument_key: m.instrument_key,
        segment: m.segment
      })));
    }
  } catch (err) {
    console.error(err.message);
  }
  process.exit(0);
}

run();
