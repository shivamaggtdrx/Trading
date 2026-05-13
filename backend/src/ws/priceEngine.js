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
 * Check if current time is within Indian Market Hours (9:15 AM to 3:30 PM IST, Mon-Fri)
 */
function isMarketOpen() {
  // Get current time in IST
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5)); // IST is +5:30

  const day = istDate.getDay();
  // Saturday = 6, Sunday = 0
  if (day === 0 || day === 6) return false;

  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();

  const currentMinutes = (hours * 60) + minutes;
  const marketOpen = (9 * 60) + 15; // 9:15 AM
  const marketClose = (15 * 60) + 30; // 3:30 PM

  return currentMinutes >= marketOpen && currentMinutes <= marketClose;
}

const yahooFinance = require('yahoo-finance2').default;

/**
 * Price simulation engine
 * In production: replace this with a real market data feed
 * For dabba: we mirror real prices but can add markup/offset per admin config
 */
async function startPriceSimulation() {
  priceInterval = setInterval(async () => {
    try {
      if (!isMarketOpen()) {
        // Broadcast market closed state occasionally to keep connection alive
        const message = JSON.stringify({ type: 'market_status', data: { status: 'CLOSED' } });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) client.send(message);
        });
        // We still fetch the latest closing prices from Yahoo once a minute when closed, but for now we can return
        return; 
      }
      
      // Fetch all active instruments
      const { data: instruments } = await supabaseAdmin
        .from('instruments')
        .select('id, symbol, last_price, base_price, tick_size, day_open, day_high, day_low, prev_close, spread_multiplier')
        .eq('is_active', true);

      if (!instruments || instruments.length === 0) return;

      const priceUpdates = [];
      const symbolsToFetch = instruments.map(i => {
        let sym = i.symbol;
        if (!sym.includes('.')) sym = sym + '.NS'; // Default to NSE
        return sym;
      });

      let quotesArray = [];
      try {
        const quotes = await yahooFinance.quote(symbolsToFetch);
        quotesArray = Array.isArray(quotes) ? quotes : [quotes];
      } catch (yfError) {
        console.error('Yahoo Finance fetch error:', yfError.message);
        return; // Skip this tick if Yahoo fails
      }

      for (const inst of instruments) {
        let searchSym = inst.symbol;
        if (!searchSym.includes('.')) searchSym += '.NS';
        const quote = quotesArray.find(q => q.symbol === searchSym);

        if (quote && quote.regularMarketPrice) {
          let newPrice = quote.regularMarketPrice;
          const tickSize = inst.tick_size || 0.05;

          const change = newPrice - (quote.regularMarketPreviousClose || inst.prev_close || newPrice);
          const changePct = quote.regularMarketChangePercent || (quote.regularMarketPreviousClose ? (change / quote.regularMarketPreviousClose) * 100 : 0);

          priceUpdates.push({
            symbol: inst.symbol,
            price: newPrice,
            change: Math.round(change * 10000) / 10000,
            change_percent: Math.round(changePct * 100) / 100,
            high: Math.max(inst.day_high || quote.regularMarketDayHigh || newPrice, newPrice),
            low: inst.day_low > 0 ? Math.min(inst.day_low, quote.regularMarketDayLow || newPrice) : (quote.regularMarketDayLow || newPrice),
            bid: newPrice - (tickSize * (inst.spread_multiplier || 1)),
            ask: newPrice + (tickSize * (inst.spread_multiplier || 1)),
            timestamp: Date.now(),
          });

          // Update in database
          await supabaseAdmin
            .from('instruments')
            .update({
              last_price: newPrice,
              bid_price: newPrice - (tickSize * (inst.spread_multiplier || 1)),
              ask_price: newPrice + (tickSize * (inst.spread_multiplier || 1)),
              change_amount: Math.round(change * 10000) / 10000,
              change_percent: Math.round(changePct * 100) / 100,
              day_high: Math.max(inst.day_high || quote.regularMarketDayHigh || newPrice, newPrice),
              day_low: inst.day_low > 0 ? Math.min(inst.day_low, quote.regularMarketDayLow || newPrice) : (quote.regularMarketDayLow || newPrice),
              last_price_update: new Date().toISOString(),
            })
            .eq('id', inst.id);
        }
      }

      if (priceUpdates.length === 0) return;

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
