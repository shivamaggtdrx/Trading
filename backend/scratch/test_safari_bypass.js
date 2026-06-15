const https = require('https');

const SAFARI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15';

async function getCookies() {
  return new Promise((resolve, reject) => {
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
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      console.log('Homepage status:', res.statusCode);
      const setCookies = res.headers['set-cookie'] || [];
      const cookies = setCookies.map(c => c.split(';')[0]).join('; ');
      resolve(cookies);
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Homepage timeout')); });
    req.end();
  });
}

async function getIndexData(cookies) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.nseindia.com',
      path: '/api/equity-stockIndices?index=NIFTY%2050',
      method: 'GET',
      headers: {
        'User-Agent': SAFARI_UA,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Cookie': cookies,
        'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      console.log('API status:', res.statusCode);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('API timeout')); });
    req.end();
  });
}

async function run() {
  try {
    console.log('Getting cookies...');
    const cookies = await getCookies();
    console.log('Cookies obtained:', cookies);
    if (!cookies) {
      console.log('No cookies returned!');
      return;
    }
    console.log('Waiting 1 second before API call...');
    await new Promise(r => setTimeout(r, 1000));
    console.log('Calling API...');
    const { status, data } = await getIndexData(cookies);
    if (status === 200) {
      const json = JSON.parse(data);
      console.log('SUCCESS! Number of stocks:', json.data?.length);
      console.log('Reliance price:', json.data?.find(s => s.symbol === 'RELIANCE')?.lastPrice);
    } else {
      console.log('FAILED! Status:', status, 'Data (first 200 chars):', data.substring(0, 200));
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
