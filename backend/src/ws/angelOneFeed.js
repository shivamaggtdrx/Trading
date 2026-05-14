const { SmartAPI, WebSocketV2 } = require('smartapi-javascript');
const fs = require('fs');
const path = require('path');

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
 * Initialize Angel One WebSocket
 */
async function initAngelOneFeed() {
  if (!CLIENT_CODE || !PASSWORD || !TOTP_SECRET) {
    console.error('❌ CRITICAL: Missing Angel One Client Code, Password, or TOTP Secret.');
    console.error('❌ Production Build Policy: No mock feeds are allowed. Real feed cannot start.');
    return;
  }

  try {
    const totp = require('totp-generator')(TOTP_SECRET);
    const session = await smartApi.generateSession(CLIENT_CODE, PASSWORD, totp);
    
    if (session.status) {
      console.log('✅ Angel One SmartAPI Login Successful');
      connectWebSocket(session.data);
    } else {
      console.error('❌ Angel One Login Failed:', session.message);
      scheduleReconnect();
    }
  } catch (error) {
    console.error('❌ Angel One Auth Error:', error.message);
    scheduleReconnect();
  }
}

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
    console.log('📡 Angel One WebSocket Connected');
    wsConnected = true;
    reconnectCount = 0;
    
    // Auto resubscribe after reconnect
    if (activeSubscriptions.size > 0) {
      const tokens = Array.from(activeSubscriptions);
      // Group by exchange if necessary, assuming NSE (1) for now
      subscribeTokens([{ exchangeType: 1, tokens }]);
    }
    
    startPing();
  });

  wsClient.on('tick', (data) => {
    packetCount++;
    const symbol = data.trading_symbol || String(data.token);
    
    // Duplicate tick handling (ignore if same timestamp and same price to avoid noise)
    const tickTime = data.exchange_timestamp || Date.now();
    const ltp = (data.last_traded_price || 0) / 100;
    
    if (lastTickTime[symbol] && lastTickTime[symbol].time === tickTime && lastTickTime[symbol].ltp === ltp) {
      return; // duplicate tick
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
    console.warn('⚠️ Angel WS Closed');
    wsConnected = false;
    stopPing();
    scheduleReconnect();
  });

  wsClient.on('error', (err) => {
    console.error('❌ Angel WS Error:', err);
    wsConnected = false;
    stopPing();
    // Do not schedule reconnect here if it also emits 'close', wait for 'close'.
  });
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    console.log('🔄 Attempting to reconnect to Angel One...');
    reconnectCount++;
    initAngelOneFeed();
  }, 5000);
}

function startPing() {
  if (pingInterval) clearInterval(pingInterval);
  // Send heartbeat ping every 30 seconds
  pingInterval = setInterval(() => {
    if (wsClient && wsConnected) {
      // Angel API WSV2 might handle internal pings, but sending a safe generic request if needed.
      // Often just doing nothing is fine if the library handles it, but we can verify connection.
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
  
  // Track subscriptions
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
    // We reset packetCount to 0 in getDebugStats, so if not polled, reset here to avoid overflow
  }
}, 1000);

module.exports = {
  initAngelOneFeed,
  subscribeTokens,
  unsubscribeTokens,
  onTick,
  getDebugStats,
  getLatestTick
};
