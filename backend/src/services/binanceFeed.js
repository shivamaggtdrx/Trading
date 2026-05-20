/**
 * Binance Market Data Feed Service
 * 
 * Connects to Binance's FREE public WebSocket streams for real-time crypto prices.
 * NO AUTHENTICATION REQUIRED — Binance public streams are completely free and keyless.
 * 
 * Uses the `!miniTicker@arr` stream which sends 24hr rolling window updates
 * for ALL symbols that have changed. We filter only the crypto pairs that
 * are active in our instruments table.
 * 
 * Covers: BTC, ETH, SOL, XRP, ADA, DOGE, BNB, AVAX, DOT, LINK, etc.
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const { feedLogger } = require('../core/monitoring/logger');
const { fromBinanceSymbol, getAllBinanceSymbols } = require('./symbolMap');

// Base URL — data-stream endpoints are more reliable for cloud/US IPs
const BINANCE_WS_BASE = 'wss://data-stream.binance.com/stream?streams=';

class BinanceFeed extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.status = 'DISCONNECTED';
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
    this.activeSymbols = new Set(); // Binance symbols we care about
    this.pingInterval = null;

    this.stats = {
      ticksReceived: 0,
      ticksFiltered: 0, // Ticks that matched our instruments
      errorsEncountered: 0,
      lastTickTime: null,
      lastError: null,
    };
  }

  /**
   * Start the Binance feed
   */
  start() {
    // Load relevant crypto symbols
    const symbols = getAllBinanceSymbols();
    this.activeSymbols = new Set(symbols);

    if (this.activeSymbols.size === 0) {
      feedLogger.info('[BINANCE] No crypto instruments found in DB. Binance feed skipped.');
      feedLogger.info('[BINANCE] To enable crypto, add instruments with segment "crypto" to the instruments table.');
      return;
    }

    feedLogger.info(`[BINANCE] Starting Binance feed for ${this.activeSymbols.size} crypto pairs...`);
    feedLogger.info(`[BINANCE] Active pairs: ${Array.from(this.activeSymbols).join(', ')}`);

    // Build combined stream URL for all our symbols (e.g., btcusdt@miniTicker/ethusdt@miniTicker/...)
    this.streamUrl = BINANCE_WS_BASE + Array.from(this.activeSymbols).map(s => `${s}@miniTicker`).join('/');

    this._connect();
  }

  /**
   * Connect to Binance WebSocket
   */
  _connect() {
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') return;

    this.status = 'CONNECTING';
    feedLogger.info('[BINANCE WS] Connecting to Binance combined stream...');

    this.ws = new WebSocket(this.streamUrl);

    this.ws.on('open', () => {
      feedLogger.info('[BINANCE WS] ✅ Connected to Binance public stream!');
      this.status = 'CONNECTED';
      this.reconnectAttempts = 0;

      // Start ping/pong keepalive (Binance requires pong response within 10 min)
      this._startPingPong();
    });

    this.ws.on('message', (data) => {
      this._handleMessage(data);
    });

    this.ws.on('close', (code, reason) => {
      feedLogger.warn(`[BINANCE WS] Disconnected (${code}): ${reason || 'No reason'}`);
      this.status = 'DISCONNECTED';
      this.ws = null;
      this._stopPingPong();
      this._scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      feedLogger.error(`[BINANCE WS] Error: ${err.message}`);
      this.stats.errorsEncountered++;
      this.stats.lastError = err.message;
    });

    this.ws.on('pong', () => {
      // Pong received — connection alive
    });
  }

  /**
   * Handle incoming mini ticker array from Binance
   * 
   * Each ticker in the array has the format:
   * {
   *   "e": "24hrMiniTicker",
   *   "E": eventTime,
   *   "s": "BTCUSDT",        // Symbol
   *   "c": "50000.00",       // Close price (current price)
   *   "o": "49000.00",       // Open price
   *   "h": "51000.00",       // High price
   *   "l": "48000.00",       // Low price
   *   "v": "10000",          // Total traded base asset volume
   *   "q": "490000000"       // Total traded quote asset volume
   * }
   */
  _handleMessage(rawData) {
    try {
      const msg = JSON.parse(rawData.toString());

      // Binance combined stream wraps data as { stream: "btcusdt@miniTicker", data: {...} }
      // Individual stream sends the ticker directly as an object or array
      let tickers;
      if (msg.data) {
        // Combined stream format
        tickers = Array.isArray(msg.data) ? msg.data : [msg.data];
      } else if (Array.isArray(msg)) {
        tickers = msg;
      } else if (msg.s) {
        tickers = [msg];
      } else {
        return;
      }

      for (const ticker of tickers) {
        // Filter: only process symbols we care about
        const binanceSymbol = (ticker.s || '').toLowerCase();
        if (!this.activeSymbols.has(binanceSymbol)) continue;

        const internalSymbol = fromBinanceSymbol(binanceSymbol);
        if (!internalSymbol) continue;

        const currentPrice = parseFloat(ticker.c);
        if (!currentPrice || isNaN(currentPrice)) continue;

        const openPrice = parseFloat(ticker.o) || currentPrice;
        const change = currentPrice - openPrice;
        const changePercent = openPrice > 0 ? (change / openPrice) * 100 : 0;

        const tick = {
          symbol: internalSymbol,
          exchange: 'CRYPTO',
          price: currentPrice,
          ltp: currentPrice,
          bid: currentPrice,
          ask: currentPrice,
          high: parseFloat(ticker.h) || currentPrice,
          low: parseFloat(ticker.l) || currentPrice,
          open: openPrice,
          change: parseFloat(change.toFixed(4)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          volume: parseFloat(ticker.v) || 0,
          timestamp: ticker.E || Date.now(),
          _debug: { source: 'binance_ws', providerSymbol: ticker.s },
        };

        this.stats.ticksReceived++;
        this.stats.ticksFiltered++;
        this.stats.lastTickTime = Date.now();

        this.emit('tick', tick);
      }
    } catch (err) {
      this.stats.errorsEncountered++;
      if (this.stats.errorsEncountered % 100 === 0) {
        feedLogger.error(`[BINANCE WS] Parse error: ${err.message}`);
      }
    }
  }

  /**
   * Start ping/pong keepalive
   * Binance requires a pong response to server pings.
   * We also send our own pings every 3 minutes.
   */
  _startPingPong() {
    this._stopPingPong();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 180000); // Every 3 minutes
  }

  _stopPingPong() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  _scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      feedLogger.error(`[BINANCE WS] Max reconnect attempts (${this.maxReconnectAttempts}) reached.`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000 + Math.random() * 1000, 30000);

    feedLogger.info(`[BINANCE WS] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this._connect();
    }, delay);
  }

  /**
   * Dynamically add symbols to track
   * @param {string[]} binanceSymbols - Lowercase Binance symbols (e.g., ['btcusdt', 'ethusdt'])
   */
  addSymbols(binanceSymbols) {
    if (!Array.isArray(binanceSymbols)) return;
    binanceSymbols.forEach(s => this.activeSymbols.add(s.toLowerCase()));
    feedLogger.info(`[BINANCE] Now tracking ${this.activeSymbols.size} crypto pairs`);
  }

  /**
   * Stop the Binance feed
   */
  stop() {
    this.status = 'DISCONNECTED';

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this._stopPingPong();

    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }

    feedLogger.info('[BINANCE] Feed service stopped.');
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      provider: 'binance',
      status: this.status,
      activeSymbolCount: this.activeSymbols.size,
      stats: { ...this.stats },
    };
  }
}

// Export singleton
const binanceFeed = new BinanceFeed();
module.exports = { binanceFeed };
