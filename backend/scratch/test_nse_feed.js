const https = require('https');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://www.nseindia.com/',
  'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
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

async function getIndexData(cookies) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.nseindia.com',
      path: '/api/equity-stockIndices?index=NIFTY%2050',
      method: 'GET',
      headers: {
        ...BROWSER_HEADERS,
        'Accept': 'application/json, text/plain, */*',
        'Cookie': cookies,
        'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      console.log('API status:', res.statusCode);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          console.log('Data (first 200 chars):', data.substring(0, 200));
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout calling API'));
    });
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
    console.log('Waiting 2 seconds before API call...');
    await new Promise(r => setTimeout(r, 2000));
    console.log('Calling API...');
    const data = await getIndexData(cookies);
    console.log('Success! Data size:', data.data?.length);
    console.log('First stock:', data.data?.[0]);
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
