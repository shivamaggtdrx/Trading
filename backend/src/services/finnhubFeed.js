/**
 * Finnhub Market Data Feed Service
 * 
 * Connects to Finnhub's free WebSocket API for real-time price data.
 * Covers: US Stocks, Forex, Commodities, and Global Indices.
 * 
 * NOTE: Indian stocks (.NS) are handled by the NSE India direct feed (nseFeed.js).
 * Finnhub free tier does NOT support Indian stocks, so they are filtered out here.
 * 
 * Auth: Requires FINNHUB_API_KEY (free signup at finnhub.io — no credit card).
 */

const WebSocket = require('ws');
const axios = require('axios');
const EventEmitter = require('events');
const { feedLogger } = require('../core/monitoring/logger');
const { fromFinnhubSymbol, getAllFinnhubSymbols, toFinnhubSymbol, getActiveSymbols, getProvider } = require('./symbolMap');

const FINNHUB_WS_URL = 'wss://ws.finnhub.io';
const FINNHUB_REST_URL = 'https://finnhub.io/api/v1';

class FinnhubFeed extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.apiKey = '';
    this.status = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, CONNECTED
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
    this.subscribedSymbols = new Set();
    this.pollInterval = null;
    this.pollSymbols = []; // Symbols that need REST polling instead of WebSocket
    this.wsSymbols = [];   // Symbols successfully subscribed via WebSocket

    this.stats = {
      ticksReceived: 0,
      wsTicksReceived: 0,
      pollTicksReceived: 0,
      errorsEncountered: 0,
      lastTickTime: null,
      lastError: null,
    };
  }

  /**
   * Start the Finnhub feed service
   * @param {string} apiKey - Finnhub API key
   */
  async start(apiKey) {
    if (!apiKey) {
      feedLogger.error('[FINNHUB] No API key provided. Finnhub feed will not start.');
      return;
    }

    this.apiKey = apiKey;
    feedLogger.info('[FINNHUB] Starting Finnhub feed service...');

    // Start WebSocket connection
    this._connectWebSocket();

    // Start REST polling for symbols that may not work over WS (Indian stocks on free tier)
    this._startRestPolling();
  }

  /**
   * Connect to Finnhub WebSocket
   */
  _connectWebSocket() {
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') return;

    this.status = 'CONNECTING';
    const url = `${FINNHUB_WS_URL}?token=${this.apiKey}`;

    feedLogger.info('[FINNHUB WS] Connecting to Finnhub WebSocket...');

    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      feedLogger.info('[FINNHUB WS] ✅ Connected successfully!');
      this.status = 'CONNECTED';
      this.reconnectAttempts = 0;

      // Subscribe to all Finnhub symbols
      this._subscribeAll();
    });

    this.ws.on('message', (data) => {
      this._handleMessage(data);
    });

    this.ws.on('close', (code, reason) => {
      feedLogger.warn(`[FINNHUB WS] Connection closed (${code}): ${reason || 'No reason'}`);
      this.status = 'DISCONNECTED';
      this.ws = null;
      this._scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      feedLogger.error(`[FINNHUB WS] Error: ${err.message}`);
      this.stats.errorsEncountered++;
      this.stats.lastError = err.message;
    });
  }

  /**
   * Subscribe to all Finnhub symbols via WebSocket
   */
  _subscribeAll() {
    if (this.status !== 'CONNECTED' || !this.ws) return;

    // Filter out Indian stocks (.NS) — handled by NSE direct feed
    const allSymbols = getAllFinnhubSymbols();
    const symbols = allSymbols.filter(s => !s.endsWith('.NS') && !s.endsWith('.BO') && !s.startsWith('^NSE') && s !== '^NSEI' && s !== '^NSEBANK');
    if (symbols.length === 0) {
      feedLogger.warn('[FINNHUB WS] No non-Indian symbols to subscribe to.');
      return;
    }

    feedLogger.info(`[FINNHUB WS] Subscribing to ${symbols.length} symbols...`);

    // Finnhub free tier allows ~50 symbols on WebSocket
    // Prioritize US stocks and forex which work best on WS
    const wsSymbols = symbols.slice(0, 50);
    this.wsSymbols = wsSymbols;

    // Remaining symbols go to REST polling
    const restSymbols = symbols.slice(50);
    this.pollSymbols = restSymbols;

    for (const symbol of wsSymbols) {
      try {
        this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
        this.subscribedSymbols.add(symbol);
      } catch (err) {
        feedLogger.error(`[FINNHUB WS] Failed to subscribe to ${symbol}: ${err.message}`);
      }
    }

    feedLogger.info(`[FINNHUB WS] Subscribed to ${wsSymbols.length} symbols via WebSocket`);
    if (restSymbols.length > 0) {
      feedLogger.info(`[FINNHUB REST] ${restSymbols.length} symbols will use REST polling`);
    }
  }

  /**
   * Handle incoming WebSocket messages from Finnhub
   */
  _handleMessage(rawData) {
    try {
      const msg = JSON.parse(rawData.toString());

      // Finnhub sends { type: 'trade', data: [...] } for real-time trades
      if (msg.type === 'trade' && Array.isArray(msg.data)) {
        for (const trade of msg.data) {
          const internalSymbol = fromFinnhubSymbol(trade.s);
          if (!internalSymbol) continue;

          const tick = {
            symbol: internalSymbol,
            exchange: this._getExchange(trade.s),
            price: trade.p,
            ltp: trade.p,
            bid: trade.p, // Finnhub trades don't include bid/ask
            ask: trade.p,
            volume: trade.v || 0,
            change: 0,
            changePercent: 0,
            timestamp: trade.t || Date.now(),
            _debug: { source: 'finnhub_ws', providerSymbol: trade.s },
          };

          this.stats.ticksReceived++;
          this.stats.wsTicksReceived++;
          this.stats.lastTickTime = Date.now();

          this.emit('tick', tick);
        }
      }
      // Finnhub sends { type: 'ping' } as keepalive
      else if (msg.type === 'ping') {
        // No action needed — connection is alive
      }
    } catch (err) {
      this.stats.errorsEncountered++;
      if (this.stats.errorsEncountered % 50 === 0) {
        feedLogger.error(`[FINNHUB WS] Parse error: ${err.message}`);
      }
    }
  }

  /**
   * Start REST polling for symbols not covered by WebSocket
   * Also polls ALL Indian stocks since Finnhub WS may not support them on free tier
   */
  _startRestPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    // Get all active Finnhub symbols, but skip Indian stocks (handled by NSE direct feed)
    const allFinnhubSymbols = getAllFinnhubSymbols()
      .filter(s => !s.endsWith('.NS') && !s.endsWith('.BO') && !s.startsWith('^NSE') && s !== '^NSEI' && s !== '^NSEBANK');

    // Poll interval: 3 seconds
    const POLL_INTERVAL_MS = 3000;
    // Max symbols per poll cycle (rate limit: ~60 calls/min on free tier => 3 per 3 seconds = 60/min)
    const BATCH_SIZE = 3;
    let batchIndex = 0;

    this.pollInterval = setInterval(async () => {
      try {
        // Get current batch of symbols to poll
        const symbolsToPoll = allFinnhubSymbols;
        if (symbolsToPoll.length === 0) return;

        const start = batchIndex * BATCH_SIZE;
        const batch = symbolsToPoll.slice(start, start + BATCH_SIZE);
        batchIndex = (start + BATCH_SIZE >= symbolsToPoll.length) ? 0 : batchIndex + 1;

        // Fetch quotes in parallel
        const promises = batch.map(fhSymbol => this._fetchQuote(fhSymbol));
        await Promise.allSettled(promises);

      } catch (err) {
        feedLogger.error(`[FINNHUB REST] Poll cycle error: ${err.message}`);
      }
    }, POLL_INTERVAL_MS);

    feedLogger.info(`[FINNHUB REST] Polling started — ${allFinnhubSymbols.length} symbols, batch size ${BATCH_SIZE}, every ${POLL_INTERVAL_MS}ms`);
  }

  /**
   * Fetch a single quote from Finnhub REST API
   */
  async _fetchQuote(finnhubSymbol) {
    try {
      const response = await axios.get(`${FINNHUB_REST_URL}/quote`, {
        params: {
          symbol: finnhubSymbol,
          token: this.apiKey,
        },
        timeout: 5000,
      });

      const q = response.data;
      // q = { c: currentPrice, d: change, dp: changePercent, h: high, l: low, o: open, pc: previousClose, t: timestamp }

      if (!q || q.c === 0 || q.c === undefined || q.c === null) return;

      const internalSymbol = fromFinnhubSymbol(finnhubSymbol);
      if (!internalSymbol) return;

      const tick = {
        symbol: internalSymbol,
        exchange: this._getExchange(finnhubSymbol),
        price: q.c,
        ltp: q.c,
        bid: q.c,
        ask: q.c,
        high: q.h || 0,
        low: q.l || 0,
        open: q.o || 0,
        change: q.d || 0,
        changePercent: q.dp || 0,
        volume: 0,
        timestamp: (q.t && q.t > 0) ? q.t * 1000 : Date.now(),
        _debug: { source: 'finnhub_rest', providerSymbol: finnhubSymbol },
      };

      this.stats.ticksReceived++;
      this.stats.pollTicksReceived++;
      this.stats.lastTickTime = Date.now();

      this.emit('tick', tick);

    } catch (err) {
      // Rate limit or network error — silently skip
      if (err.response && err.response.status === 429) {
        feedLogger.warn(`[FINNHUB REST] Rate limited. Slowing down...`);
      }
    }
  }

  /**
   * Determine exchange from Finnhub symbol
   */
  _getExchange(finnhubSymbol) {
    if (!finnhubSymbol) return 'UNKNOWN';
    if (finnhubSymbol.endsWith('.NS')) return 'NSE';
    if (finnhubSymbol.endsWith('.BO')) return 'BSE';
    if (finnhubSymbol.startsWith('OANDA:')) return 'FOREX';
    if (finnhubSymbol.startsWith('BINANCE:')) return 'CRYPTO';
    if (finnhubSymbol.startsWith('^')) return 'INDEX';
    if (finnhubSymbol.startsWith('BSE:')) return 'BSE';
    // Default to US
    return 'US';
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  _scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      feedLogger.error(`[FINNHUB WS] Max reconnect attempts (${this.maxReconnectAttempts}) reached.`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000 + Math.random() * 1000, 30000);

    feedLogger.info(`[FINNHUB WS] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this._connectWebSocket();
    }, delay);
  }

  /**
   * Stop the Finnhub feed
   */
  stop() {
    this.status = 'DISCONNECTED';

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }

    feedLogger.info('[FINNHUB] Feed service stopped.');
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      provider: 'finnhub',
      wsStatus: this.status,
      subscribedCount: this.subscribedSymbols.size,
      pollSymbolCount: this.pollSymbols.length,
      stats: { ...this.stats },
    };
  }
}

// Export singleton
const finnhubFeed = new FinnhubFeed();
module.exports = { finnhubFeed };
