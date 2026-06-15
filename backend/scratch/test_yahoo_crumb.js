const https = require('https');

async function getCookiesAndCrumb() {
  return new Promise((resolve, reject) => {
    // 1. Visit fc.yahoo.com to get cookie
    const options1 = {
      hostname: 'fc.yahoo.com',
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 5000,
    };

    const req1 = https.request(options1, (res1) => {
      const setCookies = res1.headers['set-cookie'];
      let cookie = '';
      if (setCookies) {
        cookie = setCookies.map(c => c.split(';')[0]).join('; ');
      }
      
      console.log('Cookie status:', res1.statusCode);
      console.log('Obtained cookies:', cookie);

      if (!cookie) {
        return resolve({ cookie: '', crumb: '' });
      }

      // 2. Request getcrumb with cookie
      const options2 = {
        hostname: 'query2.finance.yahoo.com',
        path: '/v1/test/getcrumb',
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': cookie,
        },
        timeout: 5000,
      };

      const req2 = https.request(options2, (res2) => {
        let crumb = '';
        res2.on('data', chunk => crumb += chunk);
        res2.on('end', () => {
          console.log('Crumb status:', res2.statusCode);
          console.log('Obtained crumb:', crumb);
          resolve({ cookie, crumb });
        });
      });

      req2.on('error', reject);
      req2.end();
    });

    req1.on('error', reject);
    req1.end();
  });
}

async function getBatchQuotes(symbols, cookie, crumb) {
  return new Promise((resolve, reject) => {
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}&crumb=${crumb}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookie,
      },
      timeout: 10000,
    };

    https.get(url, options, (res) => {
      console.log('Quote Request Status:', res.statusCode);
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
    const { cookie, crumb } = await getCookiesAndCrumb();
    if (!cookie || !crumb) {
      console.log('Failed to get cookie or crumb');
      return;
    }
    const symbols = ['RELIANCE.NS', 'TCS.NS', 'SBIN.NS', 'AAPL', 'BTC-USD'];
    const data = await getBatchQuotes(symbols, cookie, crumb);
    console.log('Quote Response result count:', data.quoteResponse?.result?.length);
    console.log('Reliance price:', data.quoteResponse?.result?.[0]?.regularMarketPrice);
  } catch (e) {
    console.error('Error in run:', e);
  }
}

run();
