const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const angelOneFeed = require('./angelOneFeed');
const yahooFeed = require('./yahooFeed');
const candleAggregator = require('./candleAggregator');
const executionEngine = require('./executionEngine');

let wss;
let activeFeed = null; // 'angel' or 'yahoo'

// Keep track of total needed subscriptions across all clients
function updateGlobalSubscriptions() {
  if (!wss) return;
  const globalSymbols = new Set();
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.subscribedSymbols) {
      client.subscribedSymbols.forEach(s => globalSymbols.add(s));
    }
  });
  
  // Forward to active feed
  const tokens = Array.from(globalSymbols);
  if (tokens.length > 0 && activeFeed === 'angel') {
    angelOneFeed.subscribeTokens([{ exchangeType: 1, tokens }]);
  }
}

/**
 * Handle incoming ticks from either feed source
 */
function handleTick(tick) {
  // 1. Process for server-side candles
  candleAggregator.processTickForCandles(tick);

  // 2. Evaluate simulated execution (SL/TGT)
  executionEngine.evaluateTick(tick);

  // 3. Broadcast to frontend clients
  broadcastToClients(tick);
}

function initWebSocket(server) {
  wss = new WebSocket.Server({ 
    server, 
    path: '/ws/prices',
    perMessageDeflate: {
      zlibDeflateOptions: { chunkSize: 1024, memLevel: 7, level: 3 },
      zlibInflateOptions: { chunkSize: 10 * 1024 },
      clientNoContextTakeover: true,
      serverNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024
    }
  });
  console.log('📡 WebSocket realtime trading engine initialized on /ws/prices');

  // ── Decide which feed to use ──
  const hasAngelCreds = process.env.ANGEL_ONE_CLIENT_CODE 
    && process.env.ANGEL_ONE_PASSWORD 
    && process.env.ANGEL_ONE_TOTP_SECRET;

  if (hasAngelCreds) {
    // Use Angel One for real-time tick-by-tick data
    activeFeed = 'angel';
    angelOneFeed.initAngelOneFeed();
    angelOneFeed.onTick(handleTick);
    console.log('📊 Price source: Angel One SmartAPI (live tick)');
  } else {
    // Use Yahoo Finance for real-time polling (5s interval)
    activeFeed = 'yahoo';
    yahooFeed.initYahooFeed();
    yahooFeed.onTick(handleTick);
    console.log('📊 Price source: Yahoo Finance (5s polling)');
  }

  // Get debug stats from whichever feed is active
  const getStats = activeFeed === 'angel' ? angelOneFeed.getDebugStats : yahooFeed.getDebugStats;

  // Broadcast debug stats every second
  setInterval(() => {
    const stats = getStats();
    if (wss) {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.wantsDebug) {
          client.send(JSON.stringify({ type: 'debug_stats', data: stats }));
        }
      });
    }
  }, 1000);

  wss.on('connection', (ws, req) => {
    console.log('🔌 Client connected to realtime feed');
    ws.subscribedSymbols = new Set();
    ws.userId = null;
    
    try {
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      if (token && process.env.SUPABASE_JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
        ws.userId = decoded.sub;
      }
    } catch (err) {
      console.warn('WS auth warning:', err.message);
    }

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe') {
          ws.subscribedSymbols = new Set(data.symbols || []);
          updateGlobalSubscriptions();
        }
        else if (data.type === 'debug_subscribe') {
          ws.wantsDebug = true;
        }
        else if (data.type === 'get_candles') {
          const { symbol, timeframe } = data.data;
          const candles = candleAggregator.getCandles(symbol, timeframe);
          ws.send(JSON.stringify({
            type: 'historical_candles',
            data: { symbol, timeframe, candles }
          }));
        }
        else if (data.type === 'update_sl_tgt') {
          if (!ws.userId) {
            console.error('Unauthorized SL/TGT update attempt');
            return;
          }
          const { positionId, stopLoss, target } = data.data;
          const updated = await executionEngine.updatePositionTargets(positionId, stopLoss, target, ws.userId);
          if (updated) {
            ws.send(JSON.stringify({
              type: 'position_updated',
              data: updated
            }));
          }
        }
      } catch (e) {
        console.error('WS Message Error:', e);
      }
    });

    ws.on('close', () => {
      console.log('🔌 Client disconnected');
      ws.subscribedSymbols = new Set();
      updateGlobalSubscriptions();
    });
  });
}

function broadcastToClients(tick) {
  if (!wss) return;
  
  const payload = JSON.stringify({
    type: 'live_tick',
    data: tick
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (client.subscribedSymbols.size === 0 || client.subscribedSymbols.has(tick.symbol)) {
        client.send(payload);
      }
    }
  });
}

function stopPriceSimulation() {
  if (activeFeed === 'yahoo') yahooFeed.stopYahooFeed();
}

module.exports = { initWebSocket, stopPriceSimulation };
