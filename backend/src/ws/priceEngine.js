const WebSocket = require('ws');
const angelOneFeed = require('./angelOneFeed');
const candleAggregator = require('./candleAggregator');
const executionEngine = require('./executionEngine');

let wss;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws/prices' });
  console.log('📡 WebSocket realtime trading engine initialized on /ws/prices');

  // Initialize Angel One Feed
  angelOneFeed.initAngelOneFeed();

  // Handle incoming ticks
  angelOneFeed.onTick((tick) => {
    // 1. Process for server-side candles
    candleAggregator.processTickForCandles(tick);

    // 2. Evaluate simulated Execution (SL/TGT)
    executionEngine.evaluateTick(tick);

    // 3. Broadcast to frontend clients
    broadcastToClients(tick);
  });

  wss.on('connection', (ws) => {
    console.log('🔌 Client connected to realtime feed');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe') {
          ws.subscribedSymbols = data.symbols || [];
          // Tell Angel One feed to subscribe to these tokens if we have real exchange tokens
          // For now, simulated feed handles it.
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
          // Handle drag-and-drop SL/TGT updates from chart
          const { positionId, stopLoss, target } = data.data;
          const updated = await executionEngine.updatePositionTargets(positionId, stopLoss, target);
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
    });
  });
}

function broadcastToClients(tick) {
  if (!wss) return;
  
  // Format matching the requirement
  const payload = JSON.stringify({
    type: 'live_tick',
    data: tick
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (!client.subscribedSymbols || client.subscribedSymbols.length === 0 || client.subscribedSymbols.includes(tick.symbol)) {
        client.send(payload);
      }
    }
  });
}

function stopPriceSimulation() {
  // Not strictly needed for real feed, but kept for interface compatibility
}

module.exports = { initWebSocket, stopPriceSimulation };
