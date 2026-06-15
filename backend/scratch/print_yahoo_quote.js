const https = require('https');

async function getCookiesAndCrumb() {
  return new Promise((resolve) => {
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
      if (setCookies) cookie = setCookies.map(c => c.split(';')[0]).join('; ');
      
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
          resolve({ cookie, crumb });
        });
      });
      req2.end();
    });
    req1.end();
  });
}

async function run() {
  const { cookie, crumb } = await getCookiesAndCrumb();
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=RELIANCE.NS&crumb=${crumb}`;
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Cookie': cookie,
    },
  };
  https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      console.log('Reliance Quote keys & values:', JSON.stringify(json.quoteResponse?.result?.[0], null, 2));
    });
  });
}

run();
