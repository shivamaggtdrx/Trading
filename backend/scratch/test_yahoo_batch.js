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
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Status ${res.statusCode}: ${data}`));
            return;
          }
          const json = JSON.parse(data);
          resolve(json.quoteResponse?.result || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log('Fetching cookie and crumb...');
    const { cookie, crumb } = await getCookiesAndCrumb();
    console.log('Cookie & crumb obtained:', cookie ? 'YES' : 'NO', crumb);
    
    // Create a list of 3000 symbols (we'll just use RELIANCE.NS repeated with indexes for testing URL length)
    const baseSymbols = [];
    for (let i = 0; i < 3000; i++) {
      baseSymbols.push('RELIANCE.NS');
    }

    const BATCH_SIZE = 300;
    const start = Date.now();
    
    console.log(`Starting fetch of 3000 symbols in batches of ${BATCH_SIZE}...`);
    for (let i = 0; i < baseSymbols.length; i += BATCH_SIZE) {
      const batch = baseSymbols.slice(i, i + BATCH_SIZE);
      const batchStart = Date.now();
      const results = await getBatchQuotes(batch, cookie, crumb);
      console.log(`Batch ${i / BATCH_SIZE + 1} fetched ${results.length} quotes in ${Date.now() - batchStart}ms`);
    }
    
    console.log(`Total time for 3000 symbols: ${Date.now() - start}ms`);
  } catch (e) {
    console.error('Batch run error:', e);
  }
}

run();
