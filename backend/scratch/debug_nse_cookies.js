const https = require('https');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
      console.log('Homepage response headers:', JSON.stringify(res.headers, null, 2));
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

async function run() {
  try {
    const cookies = await getCookies();
    console.log('Cookies:', cookies);
  } catch (e) {
    console.error('Run error:', e);
  }
}

run();
