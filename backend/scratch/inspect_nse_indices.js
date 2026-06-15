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

async function getIndices(cookies) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.nseindia.com',
      path: '/api/allIndices',
      method: 'GET',
      headers: {
        'User-Agent': SAFARI_UA,
        'Accept': 'application/json, text/plain, */*',
        'Cookie': cookies,
        'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.end();
  });
}

async function run() {
  try {
    const cookies = await getCookies();
    const data = await getIndices(cookies);
    console.log('Indices data response:', JSON.stringify(data, null, 2).substring(0, 1500));
  } catch (e) {
    console.error(e);
  }
}

run();
