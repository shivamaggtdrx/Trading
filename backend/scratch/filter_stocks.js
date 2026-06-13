const axios = require('axios');
const zlib = require('zlib');

async function run() {
  try {
    console.log('Downloading NSE instruments master...');
    const response = await axios.get('https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz', {
      responseType: 'arraybuffer'
    });
    const decompressed = zlib.gunzipSync(response.data);
    const instruments = JSON.parse(decompressed.toString('utf8'));
    
    // Filter NSE equities
    const rawEquities = instruments.filter(i => i.segment === 'NSE_EQ');
    
    // Clean and filter liquid stocks
    const liquidStocks = rawEquities.filter(i => {
      const sym = i.trading_symbol;
      const name = i.name || '';
      
      // Symbol must be alphabetical (A-Z) only, no numbers, no special chars (except maybe -)
      const isPureAlpha = /^[A-Z\-]+$/.test(sym);
      if (!isPureAlpha) return false;
      
      // Filter out typical non-equity strings
      if (name.includes('SDL') || name.includes('GOI') || name.includes('GR ') || name.includes('GS ') || name.includes('BOND') || name.includes('DEBENTURE')) return false;
      if (name.includes(' Gilt ') || name.includes(' Liquid ') || name.includes(' ETF ') || name.endsWith('ETF')) return false;
      if (sym.endsWith('ETF') || sym.endsWith('BEES') || sym.endsWith('GILT') || sym.includes('GOLD')) return false;
      
      // Filter out option contracts or futures style symbols if any leaked in
      if (sym.length > 15) return false;
      
      return true;
    });

    console.log('Total raw equities:', rawEquities.length);
    console.log('Filtered clean equities:', liquidStocks.length);
    
    // Print first 50 symbols
    console.log('Sample of 50 clean symbols:');
    console.log(liquidStocks.map(s => s.trading_symbol).slice(0, 50).join(', '));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
