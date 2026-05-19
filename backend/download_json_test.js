const axios = require('axios');
const fs = require('fs');
const zlib = require('zlib');

async function run() {
  try {
    console.log('Downloading NSE.json.gz from Upstox assets...');
    const response = await axios.get('https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz', {
      responseType: 'arraybuffer'
    });
    
    console.log('Download complete! Decompressing...');
    const decompressed = zlib.gunzipSync(response.data);
    const json = JSON.parse(decompressed.toString('utf8'));
    console.log(`Success! Found ${json.length} instruments.`);
    console.log('Sample instrument:', json[0]);
    
    // Find RELIANCE
    const reliance = json.find(inst => inst.trading_symbol === 'RELIANCE');
    console.log('RELIANCE details:', reliance);
    
    // Find Nifty 50
    const n50 = json.filter(inst => inst.segment === 'NSE_INDEX' && (inst.trading_symbol.toLowerCase().includes('nifty 50') || inst.name.toLowerCase().includes('nifty 50') || inst.trading_symbol === 'NIFTY50' || inst.exchange_token === '9' || inst.exchange_token === '26000'));
    console.log('Nifty 50 matches:', n50);
    
    // Also find Sensex details
    const sensex = json.filter(inst => inst.trading_symbol.toLowerCase().includes('sensex') || inst.name.toLowerCase().includes('sensex'));
    console.log('Sensex matches:', sensex);
  } catch (err) {
    console.error('Download failed:', err.message);
  }
  process.exit(0);
}

run();
