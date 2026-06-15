const https = require('https');

async function getYahooQuotes(symbols) {
  return new Promise((resolve, reject) => {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    };

    https.get(url, options, (res) => {
      console.log('Yahoo Finance Quote Status:', res.statusCode);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    const symbols = ['RELIANCE.NS', 'TCS.NS', 'SBIN.NS', 'AAPL', 'BTC-USD'];
    const data = await getYahooQuotes(symbols);
    console.log('Quote result keys:', Object.keys(data));
    console.log('Result counts:', data.quoteResponse?.result?.length);
    console.log('First result:', data.quoteResponse?.result?.[0]);
  } catch (e) {
    console.error('Yahoo test error:', e);
  }
}

run();
