const { SmartAPI, WebSocketV2 } = require('smartapi-javascript');

// Angel One Credentials from environment or config
const API_KEY = process.env.ANGEL_ONE_API_KEY || 'ueftLmZQ';
const API_SECRET = process.env.ANGEL_ONE_API_SECRET || '5e1393ad-2a22-4f32-a5c8-a0760f96c72d';
const CLIENT_CODE = process.env.ANGEL_ONE_CLIENT_CODE || '';
const PASSWORD = process.env.ANGEL_ONE_PASSWORD || '';
const TOTP_SECRET = process.env.ANGEL_ONE_TOTP_SECRET || '';

let smartApi = new SmartAPI({
  api_key: API_KEY,
});

let wsClient = null;
let tickSubscribers = [];

/**
 * Initialize Angel One WebSocket
 */
async function initAngelOneFeed() {
  if (!CLIENT_CODE || !PASSWORD || !TOTP_SECRET) {
    console.warn('⚠️ Missing Angel One Client Code, Password, or TOTP Secret.');
    console.warn('⚠️ Falling back to simulated tick generator for architecture testing.');
    startSimulatedFeed();
    return;
  }

  try {
    const totp = require('totp-generator')(TOTP_SECRET);
    const session = await smartApi.generateSession(CLIENT_CODE, PASSWORD, totp);
    
    if (session.status) {
      console.log('✅ Angel One SmartAPI Login Successful');
      
      wsClient = new WebSocketV2({
        jwttoken: session.data.jwtToken,
        apikey: API_KEY,
        clientcode: CLIENT_CODE,
        feedtype: session.data.feedToken
      });

      wsClient.connect().then(() => {
        console.log('📡 Angel One WebSocket Connected');
      });

      wsClient.on('tick', (data) => {
        // Normalize the tick to the requested format
        // data.last_traded_price, data.best_bid_price, etc.
        const normalizedTick = {
          symbol: data.trading_symbol || 'UNKNOWN',
          ltp: data.last_traded_price / 100, // Usually sent in paisa
          bid: data.best_bid_price / 100,
          ask: data.best_sell_price / 100,
          spread: Math.round(Math.abs(data.best_sell_price - data.best_bid_price)) / 100,
          timestamp: Date.now()
        };
        
        broadcastTick(normalizedTick);
      });

      wsClient.on('error', (err) => console.error('Angel WS Error:', err));
    } else {
      console.error('❌ Angel One Login Failed:', session.message);
      startSimulatedFeed();
    }
  } catch (error) {
    console.error('❌ Angel One Auth Error:', error.message);
    startSimulatedFeed();
  }
}

/**
 * Subscribe to specific tokens
 * @param {Array} tokens - Array of token objects { exchangeType: 1, tokens: ["3045"] }
 */
function subscribeTokens(tokens) {
  if (wsClient) {
    wsClient.fetchData({
      correlationID: "tradex_sub",
      action: 1, // 1 for subscribe
      mode: 3, // 3 for Full Snap Quote
      exchangeType: 1, // 1 for NSE
      tokens: tokens
    });
  }
}

function onTick(callback) {
  tickSubscribers.push(callback);
}

function broadcastTick(tick) {
  tickSubscribers.forEach(cb => cb(tick));
}

// ----------------------------------------------------------------------------
// SIMULATED FEED (Fallback when credentials are not available)
// ----------------------------------------------------------------------------
let simInterval = null;
const simulatedPrices = {
  'RELIANCE': 2950.00,
  'HDFCBANK': 1650.00,
  'TCS': 3900.00,
  'INFY': 1500.00,
  'SBIN': 750.00,
  'ICICIBANK': 1050.00
};

function startSimulatedFeed() {
  if (simInterval) clearInterval(simInterval);
  
  simInterval = setInterval(() => {
    Object.keys(simulatedPrices).forEach(symbol => {
      // Random walk price
      const volatility = simulatedPrices[symbol] * 0.0005; // 0.05%
      const change = (Math.random() - 0.5) * volatility;
      simulatedPrices[symbol] = Math.round((simulatedPrices[symbol] + change) * 100) / 100;
      
      const ltp = simulatedPrices[symbol];
      const spread = Math.max(0.05, Math.round((ltp * 0.0002) * 100) / 100); // Dynamic spread
      
      const normalizedTick = {
        symbol: symbol,
        ltp: ltp,
        bid: Math.round((ltp - spread/2) * 100) / 100,
        ask: Math.round((ltp + spread/2) * 100) / 100,
        spread: spread,
        timestamp: Date.now()
      };
      
      broadcastTick(normalizedTick);
    });
  }, 500); // 500ms tick rate for high-frequency feel
}

module.exports = {
  initAngelOneFeed,
  subscribeTokens,
  onTick
};
