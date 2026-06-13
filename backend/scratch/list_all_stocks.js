const axios = require('axios');

async function run() {
  try {
    const res = await axios.get('http://localhost:4000/api/instruments');
    if (res.data.instruments) {
      const nse = res.data.instruments.filter(i => i.segment === 'nse_equity').map(i => `${i.symbol} (${i.name})`);
      const us = res.data.instruments.filter(i => i.segment === 'us_equity').map(i => `${i.symbol} (${i.name})`);
      
      console.log('--- Indian NSE Stocks ---');
      console.log(nse.join('\n'));
      console.log('--- USA Market Stocks ---');
      console.log(us.join('\n'));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
