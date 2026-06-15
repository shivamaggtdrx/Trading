const https = require('https');

const SAFARI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15';

async function getCookies() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.nseindia.com',
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': SAFARI_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
      },
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      const setCookies = res.headers['set-cookie'] || [];
      const cookies = setCookies.map(c => c.split(';')[0]).join('; ');
      resolve(cookies);
    });
    req.end();
  });
}

async function testPath(path, cookies) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.nseindia.com',
      path,
      method: 'GET',
      headers: {
        'User-Agent': SAFARI_UA,
        'Accept': 'application/json, text/plain, */*',
        'Cookie': cookies,
        'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
      },
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ path, status: res.statusCode, data: data.substring(0, 150) });
      });
    });
    req.on('error', (err) => resolve({ path, status: 500, error: err.message }));
    req.end();
  });
}

async function run() {
  try {
    const cookies = await getCookies();
    const paths = [
      '/api/equity-stockIndices?index=NIFTY%2050',
      '/api/equity-stockIndices?index=NIFTY%2050&mode=full',
      '/api/equity-stockIndices?index=nifty%2050',
      '/api/equity-stockIndices',
      '/api/equity-stockindices?index=NIFTY%2050',
      '/api/equity-stockindices',
      '/api/quote-equity?symbol=RELIANCE',
      '/api/quote-equity?symbol=TCS',
    ];

    for (const p of paths) {
      const res = await testPath(p, cookies);
      console.log(`Path: ${res.path} -> Status: ${res.status}`);
      if (res.status === 200) {
        console.log(`   Data: ${res.data}`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

run();
