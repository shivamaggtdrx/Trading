/**
 * NSE India Market Data Feed Service (Yahoo Finance Backed)
 * 
 * Fetches real-time prices for NSE stocks using Yahoo Finance's high-performance batch query API.
 * 
 * NO API KEY REQUIRED — completely free.
 * Replaces the old direct NSE scraper which was constantly blocked by Akamai (403/401/404).
 * 
 * Batch-polls all active stocks (~3000 symbols) in groups of 300 every 5 seconds.
 * Leverages the price engine's animator to achieve a fast, smooth UI update rate.
 */

const https = require('https');
const EventEmitter = require('events');
const { feedLogger } = require('../core/monitoring/logger');

class NseFeed extends EventEmitter {
  constructor() {
    super();
    this.status = 'DISCONNECTED';
    this.pollTimeout = null;
    this.activeSymbols = []; // Internal stock symbols (e.g. RELIANCE, TCS)
    this.indexSymbols = [];  // Internal index symbols (e.g. NIFTY50, BANKNIFTY)
    
    // Yahoo Session Credentials
    this.yahooCookie = '';
    this.yahooCrumb = '';
    this.sessionExpiry = 0;

    // Backoff trackers
    this.sessionBackoffDelay = 5000;
    this.nextSessionRetryTime = 0;

    this.stats = {
      ticksReceived: 0,
      pollCycles: 0,
      errorsEncountered: 0,
      lastTickTime: null,
      lastError: null,
      sessionRefreshes: 0,
    };
  }

  /**
   * Start the NSE feed
   * @param {string[]} symbols - Internal stock symbols to track (e.g., ['RELIANCE', 'TCS'])
   * @param {string[]} indexSymbols - Index symbols (e.g., ['NIFTY50', 'BANKNIFTY'])
   */
  async start(symbols = [], indexSymbols = []) {
    this.activeSymbols = symbols;
    this.indexSymbols = indexSymbols;

    if (symbols.length === 0 && indexSymbols.length === 0) {
      feedLogger.info('[NSE] No Indian stock symbols to track. Yahoo feed skipped.');
      return;
    }

    feedLogger.info(`[NSE] Starting Yahoo-backed NSE feed for ${symbols.length} stocks + ${indexSymbols.length} indices`);
    
    this.status = 'CONNECTED';
    
    // Initialize session cookies & crumb
    await this._refreshSession();
    
    this._startPolling();
  }

  /**
   * Establish a new session with Yahoo Finance to get Cookie and Crumb
   */
  async _refreshSession() {
    if (Date.now() < this.nextSessionRetryTime) {
      feedLogger.warn(`[NSE/YAHOO] Session refresh skipped (in backoff for another ${Math.round((this.nextSessionRetryTime - Date.now()) / 1000)}s).`);
      return false;
    }

    try {
      this.stats.sessionRefreshes++;
      
      // 1. Visit fc.yahoo.com to get cookie
      const cookie = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'fc.yahoo.com',
          path: '/',
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 5000,
        };

        const req = https.request(options, (res) => {
          res.resume(); // Always consume the response stream to release the socket
          const setCookies = res.headers['set-cookie'];
          if (setCookies) {
            resolve(setCookies.map(c => c.split(';')[0]).join('; '));
          } else {
            resolve('');
          }
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Cookie timeout')); });
        req.end();
      });

      if (!cookie) {
        throw new Error('No cookie returned from fc.yahoo.com');
      }

      // 2. Request getcrumb with cookie
      const crumb = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'query2.finance.yahoo.com',
          path: '/v1/test/getcrumb',
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': cookie,
          },
          timeout: 5000,
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200 && data.trim()) {
              resolve(data.trim());
            } else {
              reject(new Error(`Crumb status ${res.statusCode}: ${data}`));
            }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Crumb timeout')); });
        req.end();
      });

      this.yahooCookie = cookie;
      this.yahooCrumb = crumb;
      this.sessionExpiry = Date.now() + 30 * 60 * 1000; // Refresh session every 30 minutes
      this.sessionBackoffDelay = 5000; // Reset backoff delay on success
      feedLogger.info('[NSE/YAHOO] Established session successfully.');
      return true;
    } catch (err) {
      this.stats.errorsEncountered++;
      this.stats.lastError = err.message;
      feedLogger.error(`[NSE/YAHOO] Failed to establish session: ${err.message}`);

      // Exponential backoff: double up to 120s
      this.sessionBackoffDelay = Math.min(this.sessionBackoffDelay * 2, 120000);
      this.nextSessionRetryTime = Date.now() + this.sessionBackoffDelay;
      feedLogger.warn(`[NSE/YAHOO] Session refresh backoff active. Next retry in ${this.sessionBackoffDelay / 1000} seconds.`);

      return false;
    }
  }

  /**
   * Start polling loop using batch quotes
   */
  _startPolling() {
    if (this.pollTimeout) clearTimeout(this.pollTimeout);

    const BATCH_SIZE = 300;
    const POLL_INTERVAL_MS = 5000; // Poll interval

    const pollCycle = async () => {
      if (this.status !== 'CONNECTED') return;

      // Map internal symbols to Yahoo symbols dynamically on each cycle
      const yahooSymbolMap = new Map(); // internal -> yahoo
      const reverseSymbolMap = new Map(); // yahoo -> internal

      // Process indices
      this.indexSymbols.forEach(sym => {
        let yhSym = '';
        if (sym === 'NIFTY50' || sym === 'NIFTY') yhSym = '^NSEI';
        else if (sym === 'BANKNIFTY') yhSym = '^NSEBANK';
        else if (sym === 'SENSEX') yhSym = '^BSESN';
        else yhSym = sym;

        yahooSymbolMap.set(sym, yhSym);
        reverseSymbolMap.set(yhSym, sym);
      });

      // Process stocks
      this.activeSymbols.forEach(sym => {
        let yhSym = `${sym}.NS`;
        if (sym === 'SENSEX') yhSym = '^BSESN';
        
        yahooSymbolMap.set(sym, yhSym);
        reverseSymbolMap.set(yhSym, sym);
      });

      const allYahooSymbols = Array.from(yahooSymbolMap.values());

      try {
        this.stats.pollCycles++;

        // Ensure session cookie & crumb are active
        if (!this.yahooCookie || !this.yahooCrumb || Date.now() > this.sessionExpiry) {
          const ok = await this._refreshSession();
          if (!ok) {
            // Re-schedule the next check later if refresh was skipped or failed
            if (this.status === 'CONNECTED') {
              this.pollTimeout = setTimeout(pollCycle, POLL_INTERVAL_MS);
            }
            return;
          }
        }

        // Fetch in sequential batches to prevent rate limits or URL truncation
        for (let i = 0; i < allYahooSymbols.length; i += BATCH_SIZE) {
          const batch = allYahooSymbols.slice(i, i + BATCH_SIZE);
          
          try {
            const quotes = await this._fetchYahooBatch(batch);
            
            quotes.forEach(q => {
              if (!q || !q.symbol) return;
              
              const internalSymbol = reverseSymbolMap.get(q.symbol) || q.symbol.replace('.NS', '').replace('.BO', '');
              const ltp = q.regularMarketPrice || q.regularMarketPreviousClose || 100;
              
              const tick = {
                symbol: internalSymbol,
                exchange: q.symbol.endsWith('.NS') ? 'NSE' : (q.symbol.endsWith('.BO') ? 'BSE' : 'NSE_INDEX'),
                price: ltp,
                ltp: ltp,
                bid: ltp,
                ask: ltp,
                high: q.regularMarketDayHigh || ltp,
                low: q.regularMarketDayLow || ltp,
                open: q.regularMarketOpen || ltp,
                prev_close: q.regularMarketPreviousClose || ltp,
                change: q.regularMarketChange || 0,
                change_percent: q.regularMarketChangePercent || 0,
                volume: q.regularMarketVolume || 0,
                timestamp: q.regularMarketTime ? q.regularMarketTime * 1000 : Date.now(),
                _debug: { source: 'yahoo_batch', providerSymbol: q.symbol },
              };

              this.stats.ticksReceived++;
              this.stats.lastTickTime = Date.now();
              this.emit('tick', tick);
            });
          } catch (batchErr) {
            this.stats.errorsEncountered++;
            this.stats.lastError = batchErr.message;
            
            // Force cookie/crumb refresh on next cycle if unauthorized
            if (batchErr.message.includes('401')) {
              this.yahooCookie = '';
              this.yahooCrumb = '';
            }
          }
        }
      } catch (err) {
        this.stats.errorsEncountered++;
        this.stats.lastError = err.message;
      }

      // Self-schedule next run sequentially to prevent overlapping execution
      if (this.status === 'CONNECTED') {
        this.pollTimeout = setTimeout(pollCycle, POLL_INTERVAL_MS);
      }
    };

    // Trigger initial poll
    pollCycle();
  }

  /**
   * Helper to perform a batch quote request
   */
  async _fetchYahooBatch(symbols) {
    return new Promise((resolve, reject) => {
      const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}&crumb=${this.yahooCrumb}`;
      
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': this.yahooCookie,
        },
        timeout: 8000,
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              resolve(json.quoteResponse?.result || []);
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`Yahoo HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Yahoo batch request timeout'));
      });
    });
  }

  /**
   * Stop the feed service
   */
  stop() {
    this.status = 'STOPPED';
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    feedLogger.info('[NSE] Feed service stopped.');
  }

  /**
   * Get current statuses
   */
  getStatus() {
    return {
      provider: 'yahoo_finance_nse',
      status: this.status,
      activeSymbolCount: this.activeSymbols.length,
      indexCount: this.indexSymbols.length,
      stats: { ...this.stats },
    };
  }
}

const nseFeed = new NseFeed();
module.exports = { nseFeed };
