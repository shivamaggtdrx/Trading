require('dotenv').config();
const { fyersFeed } = require('../src/services/fyersFeed');
const { nseFeed } = require('../src/services/nseFeed');
const { redisClient } = require('../src/redis/client');

async function run() {
  console.log('Fyers Status:', fyersFeed.getStatus());
  console.log('Yahoo Fallback Status:', nseFeed.getStatus());
  const segmentSettings = await redisClient.get('animator:segment_settings');
  console.log('Redis Segment Settings:', segmentSettings);
  process.exit(0);
}

// Wait for Redis connection to initialize
setTimeout(run, 1000);
