const axios = require('axios');
const zlib = require('zlib');

async function run() {
  try {
    console.log('Downloading NSE instruments master...');
    const response = await axios.get('https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz', {
      responseType: 'arraybuffer'
    });
    console.log('Decompressing...');
    const decompressed = zlib.gunzipSync(response.data);
    const instruments = JSON.parse(decompressed.toString('utf8'));
    console.log('Total instruments in master:', instruments.length);
    
    // Filter for segment === 'NSE_EQ'
    const equities = instruments.filter(i => i.segment === 'NSE_EQ');
    console.log('Total NSE Equities (segment = NSE_EQ):', equities.length);
    
    // Print a sample of 10 equities
    console.log('Sample equities:', equities.slice(0, 10).map(e => ({
      symbol: e.trading_symbol,
      name: e.name,
      last_price: e.last_price
    })));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
