const Redis = require('ioredis');

// For local dev, defaults to redis://localhost:6379
// In production, configure REDIS_URL in Render or .env
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Primary client for caching, hashes, rate limiting
const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ later
});

// Pub/Sub requires dedicated connections in ioredis
const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();

// Basic error logging
redisClient.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.error(`❌ Redis connection refused at ${REDIS_URL}. Make sure Redis is running!`);
  } else {
    console.error('Redis Client Error:', err);
  }
});

redisClient.on('connect', () => console.log('✅ Connected to Redis (Primary)'));

module.exports = {
  redisClient,
  pubClient,
  subClient
};
