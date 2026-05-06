const WebSocket = require('ws');
const { supabaseAdmin } = require('../config/supabase');

let wss;
let priceInterval;

/**
 * Initialize WebSocket server for live price feed
 * Simulates real-time market data by adding small random fluctuations
 * to stored instrument prices
 */
function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws/prices' });

  console.log('📡 WebSocket price engine initialized on /ws/prices');

  wss.on('connection', (ws) => {
    console.log('🔌 Client connected to price feed');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        // Clients can subscribe to specific symbols
        if (data.type === 'subscribe') {
          ws.subscribedSymbols = data.symbols || [];
        }
      } catch (e) {}
    });

    ws.on('close', () => {
      console.log('🔌 Client disconnected from price feed');
    });
  });

  // Start price simulation loop (every 2 seconds)
  startPriceSimulation();
}

/**
 * Price simulation engine
 * In production: replace this with a real market data feed
 * For dabba: we mirror real prices but can add markup/offset per admin config
 */
async function startPriceSimulation() {
  priceInterval = setInterval(async () => {
    try {
      // Fetch all active instruments
      const { data: instruments } = await supabaseAdmin
        .from('instruments')
        .select('id, symbol, last_price, base_price, tick_size, day_open, day_high, day_low, prev_close, spread_multiplier')
        .eq('is_active', true);

      if (!instruments || instruments.length === 0) return;

      const priceUpdates = [];

      for (const inst of instruments) {
        // Simulate price movement: small random walk
        const volatility = inst.last_price * 0.0003; // 0.03% per tick
        const direction = Math.random() > 0.48 ? 1 : -1; // slight upward bias
        const noise = (Math.random() * volatility * 2 - volatility) + (direction * volatility * 0.1);
        let newPrice = inst.last_price + noise;

        // Round to tick size
        const tickSize = inst.tick_size || 0.05;
        newPrice = Math.round(newPrice / tickSize) * tickSize;
        newPrice = Math.max(newPrice, tickSize); // never go to 0

        const change = newPrice - inst.prev_close;
        const changePct = inst.prev_close ? (change / inst.prev_close) * 100 : 0;

        priceUpdates.push({
          symbol: inst.symbol,
          price: newPrice,
          change: Math.round(change * 10000) / 10000,
          change_percent: Math.round(changePct * 100) / 100,
          high: Math.max(inst.day_high || newPrice, newPrice),
          low: inst.day_low > 0 ? Math.min(inst.day_low, newPrice) : newPrice,
          bid: newPrice - (tickSize * (inst.spread_multiplier || 1)),
          ask: newPrice + (tickSize * (inst.spread_multiplier || 1)),
          timestamp: Date.now(),
        });

        // Update in database (batch would be better in production)
        await supabaseAdmin
          .from('instruments')
          .update({
            last_price: newPrice,
            bid_price: newPrice - (tickSize * (inst.spread_multiplier || 1)),
            ask_price: newPrice + (tickSize * (inst.spread_multiplier || 1)),
            change_amount: Math.round(change * 10000) / 10000,
            change_percent: Math.round(changePct * 100) / 100,
            day_high: Math.max(inst.day_high || newPrice, newPrice),
            day_low: inst.day_low > 0 ? Math.min(inst.day_low, newPrice) : newPrice,
            last_price_update: new Date().toISOString(),
          })
          .eq('id', inst.id);
      }

      // Broadcast to all connected clients
      const message = JSON.stringify({ type: 'price_update', data: priceUpdates });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          // If client subscribed to specific symbols, filter
          if (client.subscribedSymbols && client.subscribedSymbols.length > 0) {
            const filtered = priceUpdates.filter(p => client.subscribedSymbols.includes(p.symbol));
            if (filtered.length > 0) {
              client.send(JSON.stringify({ type: 'price_update', data: filtered }));
            }
          } else {
            client.send(message);
          }
        }
      });
    } catch (err) {
      console.error('Price simulation error:', err.message);
    }
  }, 2000); // Every 2 seconds
}

function stopPriceSimulation() {
  if (priceInterval) clearInterval(priceInterval);
}

module.exports = { initWebSocket, stopPriceSimulation };
