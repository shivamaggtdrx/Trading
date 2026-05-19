/**
 * Upstox Market Data Streaming Service (WebSocket V3)
 * 
 * Establishes a secure WebSocket connection to Upstox Market Data Feed (V3),
 * handles authorization redirects, subscribes to all active instruments,
 * decodes incoming binary frames dynamically using ProtobufJS,
 * and emits normalized tick events.
 */

const WebSocket = require('ws');
const axios = require('axios');
const EventEmitter = require('events');
const protobuf = require('protobufjs');
const { getAccessToken, validateAccessToken } = require('./upstoxAuth');
const { toInternalSymbol, getAllUpstoxKeys } = require('./symbolMapper');
const { feedLogger } = require('../core/monitoring/logger');

// Hardcoded Upstox V3 Protobuf Schema for extremely fast and robust dynamic decoding
const PROTO_SCHEMA = `
syntax = "proto3";
package com.upstox.marketdatafeeder.rpc.proto;

message LTPC {
  double ltp = 1;
  int64 ltt = 2;
  int64 ltq = 3;
  double cp = 4; //close price
}

message MarketLevel {
  repeated Quote bidAskQuote = 1;
}

message MarketOHLC {
  repeated OHLC ohlc = 1;
}

message Quote {
  int32 bq = 1; //bid quantity
  double bp = 2; //bid price
  int32 bno = 3; //bid number of orders
  int32 aq = 4; // ask quantity
  double ap = 5; // ask price
  int32 ano = 6; // ask number of orders
}

message OptionGreeks {
  double op = 1; // option price
  double up = 2; //underlying price
  double iv = 3; // implied volatility
  double delta = 4;
  double theta = 5;
  double gamma = 6;
  double vega = 7;
  double rho = 8;
}

message ExtendedFeedDetails {
  double atp = 1; //avg traded price
  double cp = 2; //close price
  int64 vtt = 3; //volume traded today
  double oi = 4; //open interest
  double changeOi = 5; //change oi
  double lastClose = 6;
  double tbq = 7; //total buy quantity
  double tsq = 8; //total sell quantity
  double close = 9;
  double lc = 10; //lower circuit
  double uc = 11; //upper circuit
  double yh = 12; //yearly high
  double yl = 13; //yearly low
  double fp = 14; //fill price
  int32 fv = 15; //fill volume
  int64 mbpBuy = 16; //mbp buy
  int64 mbpSell = 17; //mbp sell
  int64 tv = 18; //traded volume
  double dhoi = 19; //day high open interest
  double dloi = 20; //day low open interest
  double sp = 21; //spot price
  double poi = 22; //previous open interest
}

message OHLC {
  string interval = 1;
  double open = 2;
  double high = 3;
  double low = 4;
  double close = 5;
  int32 volume = 6;
  int64 ts = 7;
}

enum Type{
  initial_feed = 0;
  live_feed = 1;
}

message MarketFullFeed{
  LTPC ltpc = 1;
  MarketLevel marketLevel = 2;
  OptionGreeks optionGreeks = 3;
  MarketOHLC marketOHLC = 4;
  ExtendedFeedDetails eFeedDetails = 5;
}

message IndexFullFeed{
  LTPC ltpc = 1;
  MarketOHLC marketOHLC = 2;
  double lastClose = 3;
  double yh = 4; //yearly high
  double yl = 5; //yearly low
}

message FullFeed {
  oneof FullFeedUnion {
    MarketFullFeed marketFF = 1;
    IndexFullFeed indexFF = 2;
  }
}

message OptionChain{
  LTPC ltpc = 1;
  Quote bidAskQuote = 2;
  OptionGreeks optionGreeks = 3;
  ExtendedFeedDetails eFeedDetails = 4;
}

message Feed {
  oneof FeedUnion {
    LTPC ltpc = 1;
    FullFeed ff = 2;
    OptionChain oc = 3;
  }
}

message FeedResponse{
  Type type = 1;
  map<string, Feed> feeds = 2;
}
`;

class UpstoxStream extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.status = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, CONNECTED
    
    // Connection & stats tracking
    this.stats = {
      ticksReceived: 0,
      errorsEncountered: 0,
      activeSubscriptions: 0,
      lastTickTime: null,
      connectionEstablishedAt: null,
      lastError: null
    };

    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
    
    // In-memory latest ticks cache for backwards compatibility with execution and risk engines
    this.latestTicks = new Map();
    
    // Initialize Protobuf decoders
    try {
      this.protoRoot = protobuf.parse(PROTO_SCHEMA).root;
      this.FeedResponse = this.protoRoot.lookupType('com.upstox.marketdatafeeder.rpc.proto.FeedResponse');
      feedLogger.info('Upstox Protobuf root and decoders initialized successfully.');
    } catch (err) {
      feedLogger.error('Failed to parse hardcoded Upstox Protobuf schema:', err);
    }
  }

  /**
   * Get the latest tick for a symbol from memory cache
   * 
   * @param {string} symbol - Internal symbol name
   * @returns {object|null} - Latest tick or null
   */
  getLatestTick(symbol) {
    if (!symbol) return null;
    return this.latestTicks.get(symbol.toUpperCase().trim()) || null;
  }

  /**
   * Start the streaming service
   */
  async start() {
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') {
      feedLogger.warn(`Upstox stream already in state: ${this.status}`);
      return;
    }
    
    this.status = 'CONNECTING';
    
    try {
      // 1. Get access token
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No Upstox access token available. Please authenticate via OAuth.');
      }

      // 2. Validate token
      const isValid = await validateAccessToken(token);
      if (!isValid) {
        throw new Error('Upstox access token is invalid or expired.');
      }

      // 3. Get WebSocket Authorized Connection URL
      feedLogger.info('Requesting authorized WebSocket redirect URL from Upstox...');
      const authResponse = await axios.get('https://api.upstox.com/v2/feed/market-data-feed/authorize', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const wsUrl = authResponse.data.data.authorizedRedirectUrl || authResponse.data.data.authorized_redirect_uri;
      if (!wsUrl) {
        throw new Error('Failed to obtain authorizedRedirectUrl from Upstox response.');
      }

      feedLogger.info(`Authorized URL obtained successfully. Connecting to WebSocket...`);
      this._connect(wsUrl);

    } catch (err) {
      this.status = 'DISCONNECTED';
      this.stats.errorsEncountered++;
      this.stats.lastError = err.message;
      feedLogger.error(`Failed to start Upstox Stream: ${err.message}`);
      
      // Schedule reconnect
      this._scheduleReconnect();
    }
  }

  /**
   * Internal connection worker
   */
  _connect(url) {
    this.ws = new WebSocket(url, {
      followRedirects: true // Essential to follow standard 302 redirects
    });

    this.ws.on('open', () => {
      feedLogger.info('Upstox WebSocket connection successfully opened!');
      this.status = 'CONNECTED';
      this.reconnectAttempts = 0;
      this.stats.connectionEstablishedAt = Date.now();
      
      // Subscribe to all symbols
      this._subscribeToAll();
    });

    this.ws.on('message', (data) => {
      this._handleBinaryFrame(data);
    });

    this.ws.on('close', (code, reason) => {
      feedLogger.warn(`Upstox WebSocket closed (Code: ${code}, Reason: ${reason || 'None'})`);
      this.status = 'DISCONNECTED';
      this.ws = null;
      this._scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      feedLogger.error('Upstox WebSocket error occurred:', err);
      this.stats.errorsEncountered++;
      this.stats.lastError = err.message;
    });
  }

  /**
   * Subscribe to all instruments in the map
   */
  _subscribeToAll() {
    if (this.status !== 'CONNECTED' || !this.ws) return;

    const keys = getAllUpstoxKeys();
    if (keys.length === 0) {
      feedLogger.warn('No instrument keys found to subscribe to.');
      return;
    }

    feedLogger.info(`Subscribing to ${keys.length} Upstox instruments...`);
    
    const subscriptionPayload = {
      guid: `sub_${Date.now()}`,
      method: 'sub',
      data: {
        mode: 'full', // 'full' mode provides high/low/open/close, close, volume, LTP
        instrumentKeys: keys
      }
    };

    try {
      this.ws.send(JSON.stringify(subscriptionPayload));
      this.stats.activeSubscriptions = keys.length;
      feedLogger.info('Upstox subscription payload sent successfully.');
    } catch (err) {
      feedLogger.error('Failed to send Upstox subscription payload:', err);
      this.stats.errorsEncountered++;
    }
  }

  /**
   * Process binary WebSocket frame and decode
   */
  _handleBinaryFrame(buffer) {
    try {
      this.stats.ticksReceived++;
      this.stats.lastTickTime = Date.now();

      // Convert Node Buffer to Uint8Array for ProtobufJS
      const decodedMessage = this.FeedResponse.decode(new Uint8Array(buffer));
      
      // Convert to clean Javascript object with defaults populated
      const feedObj = this.FeedResponse.toObject(decodedMessage, {
        longs: String,
        enums: String,
        bytes: String,
        defaults: true
      });

      if (!feedObj.feeds) return;

      // Iterate through each instrument key feed in the response
      for (const [key, feed] of Object.entries(feedObj.feeds)) {
        const symbol = toInternalSymbol(key);
        if (!symbol) continue; // Skip unmapped keys

        // Extract tick parameters safely
        const tick = this._parseFeedObject(symbol, key, feed);
        if (tick) {
          this.latestTicks.set(symbol, tick);
          this.emit('tick', tick);
        }
      }

    } catch (err) {
      // Avoid excessive logging on decoding errors
      if (this.stats.errorsEncountered % 100 === 0) {
        feedLogger.error('Error decoding Upstox binary message:', err);
      }
      this.stats.errorsEncountered++;
      this.stats.lastError = err.message;
    }
  }

  /**
   * Parses the raw feed object based on segment/type
   */
  _parseFeedObject(symbol, key, feed) {
    try {
      let ltp = 0;
      let timestamp = Date.now();
      let close = 0;
      let open = 0;
      let high = 0;
      let low = 0;
      let volume = 0;

      // 1. Extract LTPC (Last Traded Price & Close)
      let ltpc = null;
      let fullFeed = null;

      if (feed.ltpc) {
        ltpc = feed.ltpc;
      }
      
      if (feed.ff) {
        fullFeed = feed.ff;
        // Check for Market or Index full feed unions
        const ffUnion = fullFeed.marketFF || fullFeed.indexFF;
        if (ffUnion && ffUnion.ltpc) {
          ltpc = ffUnion.ltpc;
        }
      }

      if (!ltpc || !ltpc.ltp) return null; // No active price

      ltp = ltpc.ltp;
      close = ltpc.cp || close;
      timestamp = ltpc.ltt ? parseInt(ltpc.ltt) : timestamp;

      // Ensure timestamp is in milliseconds (Upstox uses epoch ms usually, but let's guard it)
      if (timestamp < 10000000000) {
        timestamp = timestamp * 1000;
      }

      // 2. Extract OHLC & Volume details if in FullFeed mode
      if (fullFeed) {
        if (fullFeed.marketFF) {
          const mff = fullFeed.marketFF;
          
          // Close and Volume
          if (mff.eFeedDetails) {
            close = mff.eFeedDetails.close || mff.eFeedDetails.lastClose || close;
            volume = mff.eFeedDetails.vtt || mff.eFeedDetails.tv || volume;
          }

          // Daily OHLC
          if (mff.marketOHLC && mff.marketOHLC.ohlc) {
            const dayOHLC = mff.marketOHLC.ohlc.find(o => o.interval === '1d');
            if (dayOHLC) {
              open = dayOHLC.open || open;
              high = dayOHLC.high || high;
              low = dayOHLC.low || low;
              close = dayOHLC.close || close;
            }
          }
        } else if (fullFeed.indexFF) {
          const iff = fullFeed.indexFF;
          close = iff.lastClose || close;
          
          if (iff.marketOHLC && iff.marketOHLC.ohlc) {
            const dayOHLC = iff.marketOHLC.ohlc.find(o => o.interval === '1d');
            if (dayOHLC) {
              open = dayOHLC.open || open;
              high = dayOHLC.high || high;
              low = dayOHLC.low || low;
              close = dayOHLC.close || close;
            }
          }
        }
      }

      // 3. Fallbacks and normalized calculations
      open = open || ltp;
      high = high || Math.max(ltp, open);
      low = low || Math.min(ltp, open);
      close = close || open; // close is previous close or close of day

      const change = ltp - close;
      const changePercent = close !== 0 ? (change / close) * 100 : 0;

      // Determine exchange (NSE, BSE, MCX) from the key prefix
      const exchange = key.split('_')[0] || 'NSE';

      return {
        symbol,
        exchange,
        price: ltp,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume: parseInt(volume) || 0,
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        open: parseFloat(open.toFixed(2)),
        timestamp,
        // Backward compatibility layer
        ltp: ltp 
      };

    } catch (err) {
      return null;
    }
  }

  /**
   * Schedule exponential backoff reconnect
   */
  _scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      feedLogger.error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached. Streaming stopped.`);
      this.status = 'DISCONNECTED';
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff with jitter, up to 30 seconds
    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000 + Math.random() * 1000, 30000);
    
    feedLogger.info(`Scheduling stream reconnect in ${Math.round(delay / 1000)} seconds (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.start();
    }, delay);
  }

  /**
   * Stop the streaming service
   */
  stop() {
    this.status = 'DISCONNECTED';
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      try {
        this.ws.close();
      } catch (err) {}
      this.ws = null;
    }
    
    feedLogger.info('Upstox market feed streaming stopped.');
  }
}

// Export single singleton instance
const upstoxStream = new UpstoxStream();

module.exports = {
  upstoxStream
};
