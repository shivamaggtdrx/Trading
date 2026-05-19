/**
 * Upstox Authentication Service
 * 
 * Handles OAuth 2.0 flow, dynamic token storage in Redis, environmental overrides,
 * token validation against Upstox endpoints, and connection life cycle.
 */

const axios = require('axios');
const { redisClient } = require('../redis/client');
const { feedLogger } = require('../core/monitoring/logger');

// Environment configurations
const UPSTOX_CLIENT_ID = process.env.UPSTOX_CLIENT_ID;
const UPSTOX_CLIENT_SECRET = process.env.UPSTOX_CLIENT_SECRET;
const UPSTOX_REDIRECT_URI = process.env.UPSTOX_REDIRECT_URI || 'http://localhost:5000/api/auth/upstox/callback';

const REDIS_TOKEN_KEY = 'upstox:access_token';

/**
 * Get the Upstox OAuth authorization URL
 * 
 * @returns {string} - Authorization dialog URL
 */
function getAuthUrl() {
  if (!UPSTOX_CLIENT_ID) {
    feedLogger.error('UPSTOX_CLIENT_ID is not configured in env variables');
    throw new Error('UPSTOX_CLIENT_ID is missing');
  }
  return `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${encodeURIComponent(UPSTOX_CLIENT_ID)}&redirect_uri=${encodeURIComponent(UPSTOX_REDIRECT_URI)}`;
}

/**
 * Exchange Authorization Code for an Access Token
 * 
 * @param {string} code - The auth code received from Upstox redirect
 * @returns {Promise<string>} - The access token
 */
async function exchangeCodeForToken(code) {
  try {
    feedLogger.info('Exchanging authorization code for Upstox access token...');
    
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', UPSTOX_CLIENT_ID);
    params.append('client_secret', UPSTOX_CLIENT_SECRET);
    params.append('redirect_uri', UPSTOX_REDIRECT_URI);
    params.append('grant_type', 'authorization_code');

    const response = await axios.post('https://api.upstox.com/v2/login/authorization/token', params, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = response.data;
    if (!access_token) {
      throw new Error('No access_token found in Upstox token response');
    }

    // Save token to Redis
    await saveAccessToken(access_token);
    feedLogger.info('Successfully exchanged code and saved Upstox access token to Redis.');
    
    return access_token;
  } catch (err) {
    const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
    feedLogger.error(`Failed to exchange auth code for Upstox token: ${errorMsg}`);
    throw new Error(`Upstox Auth exchange failed: ${errorMsg}`);
  }
}

/**
 * Save access token to Redis
 * 
 * @param {string} token - Upstox access token
 */
async function saveAccessToken(token) {
  try {
    if (redisClient) {
      await redisClient.set(REDIS_TOKEN_KEY, token);
    }
  } catch (err) {
    feedLogger.error('Failed to save Upstox access token in Redis:', err);
  }
}

/**
 * Retrieve the active access token
 * Priority: env variable override -> Redis cache
 * 
 * @returns {Promise<string|null>} - Active access token, or null if none
 */
async function getAccessToken() {
  // Priority 1: Environmental override
  if (process.env.UPSTOX_ACCESS_TOKEN) {
    return process.env.UPSTOX_ACCESS_TOKEN;
  }

  // Priority 2: Redis store
  try {
    if (redisClient) {
      const cachedToken = await redisClient.get(REDIS_TOKEN_KEY);
      if (cachedToken) return cachedToken;
    }
  } catch (err) {
    feedLogger.error('Failed to read Upstox access token from Redis:', err);
  }

  return null;
}

/**
 * Validate an access token against Upstox profile endpoint
 * 
 * @param {string} token - Upstox access token
 * @returns {Promise<boolean>} - True if token is valid, false otherwise
 */
async function validateAccessToken(token) {
  if (!token) return false;
  try {
    feedLogger.info('Validating Upstox access token...');
    const response = await axios.get('https://api.upstox.com/v2/user/profile', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200 && response.data && response.data.data) {
      feedLogger.info(`Upstox token is VALID. Authenticated user: ${response.data.data.user_name || 'Unknown'}`);
      return true;
    }
    return false;
  } catch (err) {
    const status = err.response ? err.response.status : null;
    const msg = err.response ? JSON.stringify(err.response.data) : err.message;
    feedLogger.warn(`Upstox token validation failed (Status: ${status}): ${msg}`);
    return false;
  }
}

/**
 * Clear current active access token (logout)
 */
async function clearAccessToken() {
  try {
    if (redisClient) {
      await redisClient.del(REDIS_TOKEN_KEY);
    }
    feedLogger.info('Cleared Upstox access token from cache.');
  } catch (err) {
    feedLogger.error('Failed to clear Upstox access token:', err);
  }
}

module.exports = {
  getAuthUrl,
  exchangeCodeForToken,
  getAccessToken,
  saveAccessToken,
  validateAccessToken,
  clearAccessToken
};
