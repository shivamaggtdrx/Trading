const Redis = require('ioredis');

// For local dev, defaults to redis://localhost:6379
// In production, configure REDIS_URL in Render or .env
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

console.log(`🔗 Redis connecting to: ${REDIS_URL.replace(/\/\/.*@/, '//***@')}`); // Log URL (masked)

/**
 * Parse REDIS_URL into a connection options object.
 * BullMQ needs raw options (not an ioredis client instance) so it can
 * create its own internal duplicate connections with maxRetriesPerRequest: null.
 */
function parseRedisUrl(url) {
  try {
    const parsed = new URL(url);
    const opts = {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
      maxRetriesPerRequest: null, // Required by BullMQ
      keepAlive: 10000,
      pingInterval: 10000, // Send application-level PINGs every 10s
      retryStrategy: (times) => {
        if (times % 10 === 0) {
          console.warn(`🔄 Redis reconnecting: attempt #${times}`);
        }
        return Math.min(times * 200, 5000);
      },
    };
    if (parsed.password) opts.password = decodeURIComponent(parsed.password);
    if (parsed.username && parsed.username !== 'default') opts.username = parsed.username;
    if (parsed.protocol === 'rediss:') opts.tls = {};
    return opts;
  } catch (err) {
    console.error('Failed to parse REDIS_URL:', err.message);
    return { host: 'localhost', port: 6379, maxRetriesPerRequest: null };
  }
}

const redisOpts = parseRedisUrl(REDIS_URL);

// Primary client for caching, hashes, rate limiting
const redisClient = new Redis(redisOpts);

// Pub/Sub requires dedicated connections in ioredis
const pubClient = new Redis(redisOpts);
const subClient = new Redis(redisOpts);

// Basic error logging (non-crashing)
redisClient.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.error(`❌ Redis connection refused. Make sure REDIS_URL is set correctly!`);
  } else {
    console.error('Redis Client Error:', err.message);
  }
});

pubClient.on('error', (err) => {
  console.error('Redis Pub Client Error:', err.message);
});

subClient.on('error', (err) => {
  console.error('Redis Sub Client Error:', err.message);
});

redisClient.on('connect', () => console.log('✅ Connected to Redis (Primary)'));
pubClient.on('connect', () => console.log('✅ Connected to Redis (Pub)'));
subClient.on('connect', () => console.log('✅ Connected to Redis (Sub)'));

module.exports = {
  redisClient,
  redisOpts, // Export raw options for BullMQ
  pubClient,
  subClient
};
