const { SmartAPI, WebSocketV2 } = require('smartapi-javascript');
const fs = require('fs');
const path = require('path');
const { feedLogger } = require('../core/monitoring/logger');

// Angel One Credentials from environment or config
const API_KEY = process.env.ANGEL_ONE_API_KEY || 'ueftLmZQ';
const API_SECRET = process.env.ANGEL_ONE_API_SECRET || '5e1393ad-2a22-4f32-a5c8-a0760f96c72d';
const CLIENT_CODE = process.env.ANGEL_ONE_CLIENT_CODE || '';
const PASSWORD = process.env.ANGEL_ONE_PASSWORD || '';
const TOTP_SECRET = process.env.ANGEL_ONE_TOTP_SECRET || '';

let smartApi = new SmartAPI({ api_key: API_KEY });

let wsClient = null;
let tickSubscribers = [];
let activeSubscriptions = new Set(); // store tokens we are subscribed to
let reconnectTimer = null;
let pingInterval = null;

// Degraded mode / self-healing states
let isBrokerAvailable = false;
let isLoggingIn = false;
let consecutiveFailures = 0;
let cooldownUntil = 0;

// Watchdog & scheduling timers
let lastTickReceivedAt = Date.now();
let watchdogInterval = null;
let tokenRefreshTimer = null;

// Debug & metrics state
let wsConnected = false;
let packetCount = 0;
let reconnectCount = 0;
let lastTickTime = {};

// Replay Recording Setup
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const replayStream = fs.createWriteStream(path.join(logsDir, `market_replay_${new Date().toISOString().slice(0,10)}.jsonl`), { flags: 'a' });

/**
 * Get the current availability status of the broker.
 * Used for degraded mode and /ready status endpoint.
 */
function getBrokerAvailability() {
  return isBrokerAvailable;
}

/**
 * Initialize Angel One WebSocket
 */
async function initAngelOneFeed() {
  if (!CLIENT_CODE || !PASSWORD || !TOTP_SECRET) {
    feedLogger.error('❌ CRITICAL: Missing Angel One Client Code, Password, or TOTP Secret.');
    feedLogger.error('❌ Production Build Policy: No mock feeds are allowed. Real feed cannot start.');
    return;
  }

  // Check login cooldown window
  if (Date.now() < cooldownUntil) {
    const remainingSec = Math.round((cooldownUntil - Date.now()) / 1000);
    feedLogger.warn(`⏳ Angel One Login is in cooldown. Skipping login attempt. Remaining: ${remainingSec}s`, {
      consecutiveFailures,
      cooldownUntil: new Date(cooldownUntil).toISOString()
    });
    return;
  }

  if (isLoggingIn) {
    feedLogger.warn('⏳ Angel One login attempt already in progress. Skipping duplicate request.');
    return;
  }

  isLoggingIn = true;

  try {
    const serverTime = new Date().toISOString();
    const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    feedLogger.info(`📋 Running Angel One Auth Diagnostics:`, {
      serverTime,
      systemTimeZone,
      clientCode: CLIENT_CODE,
      passwordLength: PASSWORD ? PASSWORD.length : 0,
      totpSecretLength: TOTP_SECRET ? TOTP_SECRET.trim().length : 0,
      consecutiveFailures,
    });

    const { TOTP } = require('totp-generator');
    const totpResult = await TOTP.generate(TOTP_SECRET.trim());
    const totp = totpResult.otp;
    const expiresSec = Math.round((totpResult.expires - Date.now()) / 1000);
    
    // Explicit TOTP pre-login validation
    if (!totp || !/^\d{6}$/.test(totp)) {
      throw new Error(`Generated TOTP is invalid (must be exactly 6 digits, got: "${totp || ''}")`);
    }

    feedLogger.info(`📡 Fresh TOTP generated successfully: ${totp} (Expires in: ${expiresSec}s)`);

    const session = await smartApi.generateSession(CLIENT_CODE, PASSWORD, totp);
    
    if (session && session.status && session.data && session.data.jwtToken && session.data.feedToken) {
      feedLogger.info('✅ Angel One SmartAPI Login Successful');
      
      // Reset cooldown and failure counters on success
      consecutiveFailures = 0;
      cooldownUntil = 0;

      connectWebSocket(session.data);
    } else {
      let errMsg = 'Invalid response structure';
      if (session) {
        if (!session.status) errMsg = session.message || 'Login status is false';
        else if (!session.data) errMsg = 'Missing session data object';
        else if (!session.data.jwtToken) errMsg = 'Missing jwtToken in session data';
        else if (!session.data.feedToken) errMsg = 'Missing feedToken in session data';
      }
      
      handleLoginFailure(errMsg, session);
    }
  } catch (error) {
    handleLoginFailure(error.message || error);
  } finally {
    isLoggingIn = false;
  }
}

/**
 * Handle a failed login attempt, checking for cooldown triggers.
 */
function handleLoginFailure(reason, session = null) {
  isBrokerAvailable = false;
  consecutiveFailures++;
  
  feedLogger.error('❌ Angel One Login Failed:', {
    reason,
    consecutiveFailures,
    session: session ? {
      status: session.status,
      message: session.message,
      dataExists: !!session.data,
      hasJwtToken: !!session.data?.jwtToken,
      hasFeedToken: !!session.data?.feedToken
    } : null
  });

  if (consecutiveFailures >= 5) {
    cooldownUntil = Date.now() + 5 * 60 * 1000; // 5 minutes pause
    feedLogger.error(`🚨 5 consecutive Angel One Login failures reached! Pausing connection attempts for 5 minutes (until ${new Date(cooldownUntil).toISOString()}) to avoid broker rate limiting/blocks.`);
  }

  scheduleReconnect();
}

/**
 * Connect the WebSocket client
 */
function connectWebSocket(sessionData) {
  if (wsClient) {
    try { wsClient.close(); } catch (e) {}
  }

  wsClient = new WebSocketV2({
    jwttoken: sessionData.jwtToken,
    apikey: API_KEY,
    clientcode: CLIENT_CODE,
    feedtype: sessionData.feedToken
  });

  wsClient.connect().then(() => {
    feedLogger.info('📡 Angel One WebSocket Connected successfully');
    wsConnected = true;
    isBrokerAvailable = true;
    reconnectCount = 0;
    lastTickReceivedAt = Date.now();
    
    // Auto resubscribe after reconnect
    if (activeSubscriptions.size > 0) {
      const tokens = Array.from(activeSubscriptions);
      subscribeTokens([{ exchangeType: 1, tokens }]);
    }
    
    startPing();
    startWatchdog();
    scheduleTokenRefresh();
  });

  wsClient.on('tick', (data) => {
    packetCount++;
    lastTickReceivedAt = Date.now(); // Feed is alive!
    
    const symbol = data.trading_symbol || String(data.token);
    const tickTime = data.exchange_timestamp || Date.now();
    const ltp = (data.last_traded_price || 0) / 100;
    
    // Duplicate tick handling (ignore if same timestamp and same price to avoid noise)
    if (lastTickTime[symbol] && lastTickTime[symbol].time === tickTime && lastTickTime[symbol].ltp === ltp) {
      return; 
    }

    // Calculate latency
    const latencyMs = Date.now() - tickTime;

    // Normalize the tick to the requested format
    const normalizedTick = {
      symbol: symbol,
      ltp: ltp,
      bid: (data.best_bid_price || 0) / 100,
      ask: (data.best_sell_price || 0) / 100,
      spread: Math.round(Math.abs((data.best_sell_price || 0) - (data.best_bid_price || 0))) / 100,
      timestamp: tickTime,
      _debug: { latencyMs }
    };
    
    lastTickTime[symbol] = { time: tickTime, ltp: ltp, tick: normalizedTick };
    
    // Asynchronously log tick for replay recording (non-blocking)
    replayStream.write(JSON.stringify(normalizedTick) + '\n');
    
    broadcastTick(normalizedTick);
  });

  wsClient.on('close', () => {
    feedLogger.warn('⚠️ Angel WebSocket connection closed.');
    handleDisconnect();
    scheduleReconnect();
  });

  wsClient.on('error', (err) => {
    feedLogger.error('❌ Angel WebSocket error occurred:', { error: err.message || err });
    handleDisconnect();
    // Reconnect is triggered via the 'close' event from the client
  });
}

/**
 * Handle cleanup when disconnected
 */
function handleDisconnect() {
  wsConnected = false;
  isBrokerAvailable = false;
  stopPing();
  stopWatchdog();
  stopTokenRefresh();
}

/**
 * WebSocket Watchdog - detects stale connections ("half-open" states)
 */
function startWatchdog() {
  if (watchdogInterval) clearInterval(watchdogInterval);
  
  watchdogInterval = setInterval(() => {
    if (wsClient && wsConnected && activeSubscriptions.size > 0) {
      const secondsSinceLastTick = (Date.now() - lastTickReceivedAt) / 1000;
      
      // If no ticks are received for 90 seconds, consider the stream dead
      if (secondsSinceLastTick > 90) {
        feedLogger.warn(`⚠️ WebSocket Watchdog: No market ticks received for ${Math.round(secondsSinceLastTick)}s (stale feed detected). Reconnecting...`, {
          activeSubscriptions: activeSubscriptions.size
        });
        
        lastTickReceivedAt = Date.now(); // reset timer to prevent rapid trigger loop
        handleDisconnect();
        
        try { wsClient.close(); } catch (e) {}
        scheduleReconnect();
      }
    }
  }, 30000); // Check every 30 seconds
}

function stopWatchdog() {
  if (watchdogInterval) clearInterval(watchdogInterval);
}

/**
 * Token Refresh Scheduler - Proactively rotates token every 6 hours
 */
function scheduleTokenRefresh() {
  if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
  
  tokenRefreshTimer = setTimeout(async () => {
    feedLogger.info('🔄 Token Refresh Scheduler: Proactively rotating session and refreshing token...');
    isBrokerAvailable = false;
    initAngelOneFeed();
  }, 6 * 60 * 60 * 1000); // 6 hours
}

function stopTokenRefresh() {
  if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
}

/**
 * Reconnection scheduler
 */
function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  
  // Backoff or delay reconnect attempt by 5 seconds
  reconnectTimer = setTimeout(() => {
    if (Date.now() >= cooldownUntil) {
      feedLogger.info('🔄 Attempting to reconnect to Angel One...', { reconnectCount: reconnectCount + 1 });
      reconnectCount++;
      initAngelOneFeed();
    }
  }, 5000);
}

function startPing() {
  if (pingInterval) clearInterval(pingInterval);
  // Optional client-side verification ping every 30 seconds
  pingInterval = setInterval(() => {
    if (wsClient && wsConnected) {
      // Library V2 handles keep-alives internally, this is just to hook into the loop
    }
  }, 30000);
}

function stopPing() {
  if (pingInterval) clearInterval(pingInterval);
}

/**
 * Subscribe to specific tokens
 * @param {Array} tokenObjects - Array of token objects { exchangeType: 1, tokens: ["3045"] }
 */
function subscribeTokens(tokenObjects) {
  if (!tokenObjects || tokenObjects.length === 0) return;
  
  tokenObjects.forEach(obj => {
    obj.tokens.forEach(t => activeSubscriptions.add(t));
  });

  if (wsClient && wsConnected) {
    wsClient.fetchData({
      correlationID: "tradex_sub",
      action: 1, // 1 for subscribe
      mode: 3, // 3 for Full Snap Quote
      exchangeType: 1, // 1 for NSE
      tokens: tokenObjects[0].tokens
    });
  }
}

/**
 * Unsubscribe from tokens to optimize WS
 */
function unsubscribeTokens(tokenObjects) {
  if (!tokenObjects || tokenObjects.length === 0) return;
  
  tokenObjects.forEach(obj => {
    obj.tokens.forEach(t => activeSubscriptions.delete(t));
  });

  if (wsClient && wsConnected) {
    wsClient.fetchData({
      correlationID: "tradex_unsub",
      action: 0, // 0 for unsubscribe
      mode: 3,
      exchangeType: 1,
      tokens: tokenObjects[0].tokens
    });
  }
}

function onTick(callback) {
  tickSubscribers.push(callback);
}

function broadcastTick(tick) {
  tickSubscribers.forEach(cb => cb(tick));
}

// Stats for Debug Panel
function getDebugStats() {
  const stats = {
    connected: wsConnected,
    subscriptions: activeSubscriptions.size,
    packetsPerSec: packetCount,
    reconnects: reconnectCount
  };
  packetCount = 0; // Reset every second when polled
  return stats;
}

function getLatestTick(symbol) {
  return lastTickTime[symbol]?.tick || null;
}

setInterval(() => {
  if (wsConnected) {
    // packetCount tracker reset safety
  }
}, 1000);

module.exports = {
  initAngelOneFeed,
  subscribeTokens,
  unsubscribeTokens,
  onTick,
  getDebugStats,
  getLatestTick,
  getBrokerAvailability
};
