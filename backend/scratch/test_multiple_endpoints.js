const https = require('https');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
  'Connection': 'keep-alive',
  'Referer': 'https://www.nseindia.com/',
};

async function getCookies() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.nseindia.com',
      path: '/',
      method: 'GET',
      headers: BROWSER_HEADERS,
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      console.log('Homepage status:', res.statusCode);
      const setCookies = res.headers['set-cookie'];
      if (setCookies) {
        const cookies = setCookies.map(c => c.split(';')[0]).join('; ');
        resolve(cookies);
      } else {
        resolve('');
      }
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout getting cookies'));
    });
    req.end();
  });
}

async function testEndpoint(path, cookies) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.nseindia.com',
      path,
      method: 'GET',
      headers: {
        ...BROWSER_HEADERS,
        'Accept': 'application/json, text/plain, */*',
        'Cookie': cookies,
        'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      console.log(`Path: ${path} -> Status: ${res.statusCode}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length, data: data.substring(0, 150) });
      });
    });

    req.on('error', (err) => {
      console.log(`Path: ${path} -> Error: ${err.message}`);
      resolve({ status: 500, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      console.log(`Path: ${path} -> Timeout`);
      resolve({ status: 408 });
    });
    req.end();
  });
}

async function run() {
  try {
    const cookies = await getCookies();
    if (!cookies) {
      console.log('No cookies obtained!');
      return;
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Test multiple possible endpoints
    await testEndpoint('/api/marketStatus', cookies);
    await testEndpoint('/api/allIndices', cookies);
    await testEndpoint('/api/equity-stockIndices?index=NIFTY%2050', cookies);
    await testEndpoint('/api/equity-stockIndices?index=NIFTY%20NEXT%2050', cookies);
    await testEndpoint('/api/quote-equity?symbol=RELIANCE', cookies);
  } catch (e) {
    console.error('Run error:', e);
  }
}

run();
