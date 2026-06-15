const https = require('https');

async function getYahooChart(symbol) {
  return new Promise((resolve, reject) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    };

    https.get(url, options, (res) => {
      console.log(`Yahoo Finance Chart Status for ${symbol}:`, res.statusCode);
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
    const data = await getYahooChart('RELIANCE.NS');
    console.log('Chart result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Yahoo chart test error:', e);
  }
}

run();
