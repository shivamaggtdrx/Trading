const axios = require('axios');

async function run() {
  try {
    console.log('Downloading Upstox Protobuf definition...');
    const response = await axios.get('https://assets.upstox.com/feed/market-data-feed/v1/MarketDataFeed.proto');
    console.log('--- PROTOBUF CONTENTS ---');
    console.log(response.data);
    console.log('--- END OF PROTOBUF ---');
  } catch (err) {
    console.error('Failed to download proto:', err.message);
  }
  process.exit(0);
}

run();
