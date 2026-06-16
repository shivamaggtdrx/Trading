/**
 * Shoonya (Finvasia) Market Data Feed Service
 * 
 * Provides real-time, 0-lag market data updates via Shoonya's WebSocket API.
 * Uses a native, dependency-free TOTP generator to automatically authenticate daily sessions.
 * Dynamically resolves internal symbol names to Shoonya tokens using the SearchScrip REST API.
 */

const crypto = require('crypto');
const ws = require('ws');
const axios = require('axios');
const EventEmitter = require('events');
const { feedLogger } = require('../core/monitoring/logger');
const redisClient = require('../redis/client');

// Endpoints
const REST_URL = 'https://api.shoonya.com/NorenWClientTP';
const WS_URL = 'wss://api.shoonya.com/NorenWSTap/';

class ShoonyaFeed extends EventEmitter {
  constructor() {
    super();
    this.status = 'DISCONNECTED';
    this.ws = null;
    this.sessionToken = null;
    this.userId = null;
    this.accountId = null;
    
    // Heartbeat & reconnect trackers
    this.pingInterval = null;
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000;

    // Cache Maps
    this.symbolToTokenMap = new Map(); // symbol -> { token, exchange }
    this.tokenToSymbolMap = new Map(); // token -> symbol

    // Active subscription keys tracking (exchange|token format)
    this.subscribedKeys = new Set();

    // Static mapping fallbacks for popular indices
    this.symbolToTokenMap.set('NIFTY50', { token: '26000', exchange: 'NSE' });
    this.symbolToTokenMap.set('NIFTY', { token: '26000', exchange: 'NSE' });
    this.symbolToTokenMap.set('BANKNIFTY', { token: '26009', exchange: 'NSE' });
    this.tokenToSymbolMap.set('26000', 'NIFTY50');
    this.tokenToSymbolMap.set('26009', 'BANKNIFTY');

    this.stats = {
      ticksReceived: 0,
      errorsEncountered: 0,
      lastTickTime: null,
      lastError: null,
      reconnections: 0
    };
  }

  /**
   * Initialize and start the feed service
   */
  async start() {
    const userId = process.env.SHOONYA_USER_ID;
    const password = process.env.SHOONYA_PASSWORD;
    const apiKey = process.env.SHOONYA_API_KEY;
    const totpSecret = process.env.SHOONYA_TOTP_SECRET;
    const vendorCode = process.env.SHOONYA_VENDOR_CODE;

    if (!userId || !password || !apiKey || !totpSecret || !vendorCode) {
      feedLogger.warn('[SHOONYA] Missing credentials in environment. Shoonya feed disabled.');
      this.status = 'DISABLED';
      return false;
    }

    this.userId = userId;

    feedLogger.info('[SHOONYA] Starting Shoonya feed service...');
    
    // Load cached mappings from Redis to avoid API lookups on restart
    await this._loadSymbolMapFromRedis();

    // Log in to Shoonya REST API
    const authSuccess = await this._login(userId, password, apiKey, totpSecret, vendorCode);
    if (!authSuccess) {
      this.status = 'ERROR';
      return false;
    }

    // Connect to WebSocket
    this._connectWebSocket();
    return true;
  }

  /**
   * Programmatic authentication via REST API
   */
  async _login(userId, password, apiKey, totpSecret, vendorCode) {
    try {
      feedLogger.info('[SHOONYA] Authenticating with Shoonya REST API...');
      
      const totpCode = this._generateTOTP(totpSecret);
      const pwdHash = this._sha256(password);
      const appkeyHash = this._sha256(`${userId}|${apiKey}`);
      
      // Simple static IMEI/MAC placeholder or dynamic env variable
      const imei = process.env.SHOONYA_IMEI || 'mac_address_placeholder';

      const payload = {
        apkversion: '1.0.0',
        uid: userId,
        pwd: pwdHash,
        factor2: totpCode,
        vc: vendorCode,
        appkey: appkeyHash,
        imei: imei,
        source: 'API'
      };

      const response = await axios.post(
        `${REST_URL}/QuickAuth`,
        `jData=${JSON.stringify(payload)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      if (data && data.stat === 'Ok' && data.susertoken) {
        this.sessionToken = data.susertoken;
        this.accountId = data.actid || userId;
        feedLogger.info(`[SHOONYA] Login successful. Account ID: ${this.accountId}`);
        return true;
      } else {
        const errorMsg = data ? (data.emsg || JSON.stringify(data)) : 'Empty response';
        throw new Error(errorMsg);
      }
    } catch (err) {
      this.stats.errorsEncountered++;
      this.stats.lastError = err.message;
      feedLogger.error(`[SHOONYA] Authentication failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Connect to the market data WebSocket
   */
  _connectWebSocket() {
    if (this.ws) {
      this._cleanupWebSocket();
    }

    this.status = 'CONNECTING';
    feedLogger.info(`[SHOONYA] Connecting to WebSocket at ${WS_URL}...`);

    this.ws = new ws(WS_URL);

    this.ws.on('open', () => {
      feedLogger.info('[SHOONYA] WebSocket connection established. Sending auth packet...');
      
      const authPacket = {
        t: 'c',
        uid: this.userId,
        actid: this.accountId,
        susertoken: this.sessionToken,
        source: 'API'
      };

      this.ws.send(JSON.stringify(authPacket));
    });

    this.ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        this._handleWsMessage(data);
      } catch (err) {
        feedLogger.error(`[SHOONYA] Failed to parse WebSocket message: ${err.message}`);
      }
    });

    this.ws.on('close', (code, reason) => {
      feedLogger.warn(`[SHOONYA] WebSocket closed: ${code} - ${reason || 'No reason'}`);
      this.status = 'DISCONNECTED';
      this._cleanupIntervals();
      this._handleReconnect();
    });

    this.ws.on('error', (err) => {
      this.stats.errorsEncountered++;
      this.stats.lastError = err.message;
      feedLogger.error(`[SHOONYA] WebSocket error: ${err.message}`);
    });
  }

  /**
   * Handle incoming WebSocket packets
   */
  _handleWsMessage(data) {
    if (!data || !data.t) return;

    switch (data.t) {
      case 'ck': // Connection acknowledgement
        if (data.s === 'OK') {
          this.status = 'CONNECTED';
          this.reconnectAttempts = 0;
          feedLogger.info('[SHOONYA] WebSocket authenticated successfully.');
          
          this._startHeartbeat();
          
          // Re-subscribe to all active keys if this is a reconnection
          if (this.subscribedKeys.size > 0) {
            feedLogger.info(`[SHOONYA] Re-subscribing to ${this.subscribedKeys.size} instruments...`);
            this._sendSubscriptionMessage(Array.from(this.subscribedKeys));
          }
        } else {
          feedLogger.error(`[SHOONYA] WebSocket auth failed: ${data.emsg || 'Unknown error'}`);
          this.ws.close();
        }
        break;

      case 'tk': // Touchline subscription acknowledgment & initial tick
      case 'tf': // Touchline feed tick update
        this._processTick(data);
        break;

      case 'uk': // Unsubscribe acknowledgement
        // Dynamic logs for trace
        break;

      default:
        // Ignore other messages (e.g. heartbeat responses)
        break;
    }
  }

  /**
   * Process a touchline update and normalize it for the Price Engine
   */
  _processTick(tick) {
    if (!tick.tk) return;

    const internalSymbol = this.tokenToSymbolMap.get(tick.tk);
    if (!internalSymbol) {
      // Ignore ticks for symbols we don't recognize
      return;
    }

    this.stats.ticksReceived++;
    this.stats.lastTickTime = Date.now();

    // Check last traded price. If missing (some tf updates are partial), fallback to prev close
    const ltp = tick.lp ? parseFloat(tick.lp) : null;
    if (ltp === null) return; // Skip partial ticks with no price updates

    const normalizedTick = {
      symbol: internalSymbol,
      exchange: tick.e === 'NSE' ? 'NSE' : (tick.e === 'NFO' ? 'NFO' : 'NSE_INDEX'),
      price: ltp,
      ltp: ltp,
      bid: tick.bp1 ? parseFloat(tick.bp1) : ltp,
      ask: tick.sp1 ? parseFloat(tick.sp1) : ltp,
      high: tick.h ? parseFloat(tick.h) : ltp,
      low: tick.l ? parseFloat(tick.l) : ltp,
      open: tick.o ? parseFloat(tick.o) : ltp,
      prev_close: tick.c ? parseFloat(tick.c) : ltp,
      change: tick.pc ? parseFloat(tick.pc) : 0,
      changePercent: tick.pc ? parseFloat(tick.pc) : 0,
      volume: tick.v ? parseInt(tick.v) : 0,
      timestamp: Date.now(),
      _debug: { source: 'shoonya' }
    };

    this.emit('tick', normalizedTick);
  }

  /**
   * Subscribe to list of internal symbols
   */
  async subscribe(symbols = []) {
    if (symbols.length === 0) return;
    
    const keysToSubscribe = [];

    for (const symbol of symbols) {
      let mapping = this.symbolToTokenMap.get(symbol);
      
      if (!mapping) {
        // Resolve dynamic symbol via SearchScrip
        mapping = await this._resolveSymbolToken(symbol);
      }

      if (mapping && mapping.token && mapping.exchange) {
        const subKey = `${mapping.exchange}|${mapping.token}`;
        if (!this.subscribedKeys.has(subKey)) {
          this.subscribedKeys.add(subKey);
          keysToSubscribe.push(subKey);
        }
      } else {
        feedLogger.warn(`[SHOONYA] Could not resolve token for symbol: ${symbol}`);
      }
    }

    if (keysToSubscribe.length > 0 && this.status === 'CONNECTED') {
      this._sendSubscriptionMessage(keysToSubscribe);
    }
  }

  /**
   * Unsubscribe from list of internal symbols
   */
  async unsubscribe(symbols = []) {
    if (symbols.length === 0) return;

    const keysToUnsubscribe = [];

    for (const symbol of symbols) {
      const mapping = this.symbolToTokenMap.get(symbol);
      if (mapping) {
        const subKey = `${mapping.exchange}|${mapping.token}`;
        if (this.subscribedKeys.has(subKey)) {
          this.subscribedKeys.delete(subKey);
          keysToUnsubscribe.push(subKey);
        }
      }
    }

    if (keysToUnsubscribe.length > 0 && this.status === 'CONNECTED') {
      this._sendUnsubscribeMessage(keysToUnsubscribe);
    }
  }

  /**
   * Sends WebSocket subscription message
   */
  _sendSubscriptionMessage(subKeys) {
    const payload = {
      t: 't',
      k: subKeys.join('#')
    };
    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Sends WebSocket unsubscribe message
   */
  _sendUnsubscribeMessage(unsubKeys) {
    const payload = {
      t: 'u',
      k: unsubKeys.join('#')
    };
    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Resolve an instrument symbol to its token via Shoonya's SearchScrip API
   */
  async _resolveSymbolToken(symbol) {
    try {
      const { fetchAllActiveInstruments } = require('../config/supabase');
      const activeInstruments = await fetchAllActiveInstruments('symbol, segment');
      const instrument = activeInstruments.find(i => i.symbol === symbol);

      let exch = 'NSE'; // default
      if (instrument && instrument.segment) {
        if (instrument.segment === 'fo_futures' || instrument.segment === 'fo_options') {
          exch = 'NFO';
        } else if (instrument.segment === 'bse_equity') {
          exch = 'BSE';
        } else if (instrument.segment === 'mcx') {
          exch = 'MCX';
        }
      }

      feedLogger.info(`[SHOONYA] Searching token for ${symbol} on exchange ${exch}...`);

      const payload = {
        uid: this.userId,
        stext: symbol,
        exch: exch
      };

      const response = await axios.post(
        `${REST_URL}/SearchScrip`,
        `jData=${JSON.stringify(payload)}&jKey=${this.sessionToken}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 8000
        }
      );

      const data = response.data;
      if (data && data.stat === 'Ok' && Array.isArray(data.values)) {
        // Find exact match. For NSE equities, symbol format in SearchScrip is often SYMBOL-EQ (e.g. SBIN-EQ)
        const exactMatch = data.values.find(v => {
          const cleanTsym = v.tsym.replace('-EQ', '').toUpperCase();
          return cleanTsym === symbol.toUpperCase();
        }) || data.values[0]; // fallback to first match if exact match not found

        if (exactMatch) {
          const mapping = { token: exactMatch.token, exchange: exactMatch.exch };
          this.symbolToTokenMap.set(symbol, mapping);
          this.tokenToSymbolMap.set(exactMatch.token, symbol);
          
          feedLogger.info(`[SHOONYA] Resolved ${symbol} -> ${exactMatch.exch}|${exactMatch.token}`);

          // Save map to Redis for longevity
          await this._saveSymbolMapToRedis();
          return mapping;
        }
      }
      return null;
    } catch (err) {
      feedLogger.error(`[SHOONYA] SearchScrip failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  /**
   * Load symbol maps from Redis to survive server restarts
   */
  async _loadSymbolMapFromRedis() {
    try {
      if (!redisClient) return;
      const cached = await redisClient.get('shoonya:symbol_map');
      if (cached) {
        const parsed = JSON.parse(cached);
        Object.entries(parsed).forEach(([sym, val]) => {
          this.symbolToTokenMap.set(sym, val);
          this.tokenToSymbolMap.set(val.token, sym);
        });
        feedLogger.info(`[SHOONYA] Loaded ${Object.keys(parsed).length} mapped symbols from Redis cache.`);
      }
    } catch (err) {
      feedLogger.warn(`[SHOONYA] Redis cache load failed: ${err.message}`);
    }
  }

  /**
   * Save current symbol map to Redis
   */
  async _saveSymbolMapToRedis() {
    try {
      if (!redisClient) return;
      const obj = {};
      this.symbolToTokenMap.forEach((val, key) => {
        obj[key] = val;
      });
      await redisClient.set('shoonya:symbol_map', JSON.stringify(obj));
    } catch (err) {
      feedLogger.warn(`[SHOONYA] Redis cache save failed: ${err.message}`);
    }
  }

  /**
   * Start 30-second heartbeat ping to keep WebSocket connection alive
   */
  _startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.status === 'CONNECTED') {
        // Shoonya heartbeat packet
        const pingPacket = { t: 'h' };
        this.ws.send(JSON.stringify(pingPacket));
      }
    }, 30000);
  }

  /**
   * Handles re-connection strategy
   */
  _handleReconnect() {
    if (this.status === 'DISABLED') return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      feedLogger.error('[SHOONYA] Max reconnection attempts reached. Feed remains disconnected.');
      return;
    }

    this.reconnectAttempts++;
    this.stats.reconnections++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 60000);
    
    feedLogger.info(`[SHOONYA] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
    
    this.reconnectTimeout = setTimeout(() => {
      this._connectWebSocket();
    }, delay);
  }

  /**
   * Cleanup functions
   */
  _cleanupIntervals() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  _cleanupWebSocket() {
    if (this.ws) {
      try {
        this.ws.removeAllListeners('close');
        this.ws.removeAllListeners('message');
        this.ws.on('error', () => {}); // Catch errors during termination to prevent crashes
        this.ws.terminate();
      } catch (e) {}
      this.ws = null;
    }
  }

  stop() {
    feedLogger.info('[SHOONYA] Stopping Shoonya feed service...');
    this._cleanupIntervals();
    this._cleanupWebSocket();
    this.status = 'DISCONNECTED';
  }

  getStatus() {
    return {
      provider: 'shoonya',
      status: this.status,
      activeSymbolCount: this.subscribedKeys.size,
      stats: { ...this.stats }
    };
  }

  // ── Native SHA-256 and TOTP implementation (RFC 6238) ──

  _sha256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  _generateTOTP(secretBase32) {
    const secret = this._decodeBase32(secretBase32);
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(epoch / 30);

    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(timeStep), 0);

    const hmac = crypto.createHmac('sha1', secret).update(buffer).digest();

    const offset = hmac[hmac.length - 1] & 0xf;
    const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
    ) % 1000000;

    return code.toString().padStart(6, '0');
  }

  _decodeBase32(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    const buffer = [];
    const cleanSecret = base32.replace(/[\s=]/g, '').toUpperCase();
    for (let i = 0; i < cleanSecret.length; i++) {
      const val = alphabet.indexOf(cleanSecret[i]);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      buffer.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return Buffer.from(buffer);
  }
}

const shoonyaFeed = new ShoonyaFeed();
module.exports = { shoonyaFeed };
