const https = require('https');

async function tryFetch(userAgent, includeReferer) {
  return new Promise((resolve) => {
    const headers = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
    };
    if (includeReferer) {
      headers['Referer'] = 'https://www.google.com/';
    }

    const options = {
      hostname: 'www.nseindia.com',
      path: '/',
      method: 'GET',
      headers,
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      const setCookies = res.headers['set-cookie'] || [];
      resolve({
        status: res.statusCode,
        setCookie: setCookies.join('; '),
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 408 });
    });
    req.end();
  });
}

async function run() {
  const uas = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  ];

  for (const ua of uas) {
    const res1 = await tryFetch(ua, false);
    console.log(`UA: ${ua.substring(0, 30)}... | Referer: NO -> Status: ${res1.status} | Cookies: ${res1.setCookie ? 'YES' : 'NO'}`);
    const res2 = await tryFetch(ua, true);
    console.log(`UA: ${ua.substring(0, 30)}... | Referer: YES -> Status: ${res2.status} | Cookies: ${res2.setCookie ? 'YES' : 'NO'}`);
    console.log('---');
  }
}

run();
