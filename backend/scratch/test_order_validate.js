require('dotenv').config();
const { checkMarketHours } = require('../src/core/risk/marketHours');

async function test() {
  console.log('Testing checkMarketHours for all segments...');
  try {
    const segments = ['nse_equity', 'fo_futures', 'mcx', 'forex', 'crypto', 'us_equity'];
    for (const segment of segments) {
      const res = await checkMarketHours(segment);
      console.log(`Segment: ${segment} ->`, res);
    }
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();
