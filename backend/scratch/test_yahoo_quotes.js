const https = require('https');

async function testUrl(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 5000,
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length, data: data.substring(0, 150) });
      });
    }).on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });
  });
}

async function run() {
  const urls = [
    'https://query1.finance.yahoo.com/v7/finance/quote?symbols=RELIANCE.NS,TCS.NS',
    'https://query2.finance.yahoo.com/v7/finance/quote?symbols=RELIANCE.NS,TCS.NS',
    'https://query1.finance.yahoo.com/v6/finance/quote?symbols=RELIANCE.NS,TCS.NS',
    'https://query2.finance.yahoo.com/v6/finance/quote?symbols=RELIANCE.NS,TCS.NS',
    'https://query1.finance.yahoo.com/v7/finance/quote?symbols=RELIANCE.NS',
  ];

  for (const url of urls) {
    const res = await testUrl(url);
    console.log(`URL: ${url}\nStatus: ${res.status}\nData: ${res.data}\n----------------------------------`);
  }
}

run();
