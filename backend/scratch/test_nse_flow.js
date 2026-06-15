const https = require('https');

const SAFARI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15';

async function request(path, cookies = '', extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.nseindia.com',
      path,
      method: 'GET',
      headers: {
        'User-Agent': SAFARI_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Cookie': cookies,
        ...extraHeaders,
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      const setCookies = res.headers['set-cookie'] || [];
      const newCookies = setCookies.map(c => c.split(';')[0]).join('; ');
      
      let mergedCookies = cookies;
      if (newCookies) {
        const cookieMap = new Map();
        if (cookies) {
          cookies.split('; ').forEach(c => {
            const [k, v] = c.split('=');
            cookieMap.set(k, v);
          });
        }
        newCookies.split('; ').forEach(c => {
          const [k, v] = c.split('=');
          cookieMap.set(k, v);
        });
        mergedCookies = Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, cookies: mergedCookies, data });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout on ${path}`)); });
    req.end();
  });
}

async function run() {
  try {
    console.log('1. Fetching homepage...');
    let res = await request('/');
    console.log('Homepage status:', res.status);
    let cookies = res.cookies;

    console.log('2. Waiting 1.5 seconds...');
    await new Promise(r => setTimeout(r, 1500));

    console.log('3. Fetching live equity market page...');
    res = await request('/market-data/live-equity-market', cookies);
    console.log('Market page status:', res.status);
    cookies = res.cookies;

    console.log('4. Waiting 1.5 seconds...');
    await new Promise(r => setTimeout(r, 1500));

    console.log('5. Calling API endpoint...');
    res = await request('/api/equity-stockIndices?index=NIFTY%2050', cookies, {
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
    });
    console.log('API status:', res.status);
    if (res.status === 200) {
      const json = JSON.parse(res.data);
      console.log('SUCCESS! Number of stocks:', json.data?.length);
      console.log('First stock:', json.data?.[0]);
    } else {
      console.log('FAILED! Data first 300 chars:', res.data.substring(0, 300));
    }
  } catch (e) {
    console.error('Run failed:', e);
  }
}

run();
