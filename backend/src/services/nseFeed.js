/**
 * NSE India Market Data Feed Service
 * 
 * Fetches real-time prices directly from NSE India's public JSON API.
 * This is the SAME data source that nseindia.com uses internally.
 * 
 * NO API KEY REQUIRED — completely free.
 * Polls every 2-3 seconds per batch for near-real-time prices.
 * 
 * Covers: All NSE Equities, NIFTY 50, BANK NIFTY, and other indices.
 * 
 * NOTE: NSE requires proper cookie/session handling to avoid 401s.
 * We maintain a session by first hitting the homepage, then using
 * the session cookies for subsequent API calls.
 */

const https = require('https');
const EventEmitter = require('events');
const { feedLogger } = require('../core/monitoring/logger');

const NSE_BASE = 'www.nseindia.com';

// Common headers to mimic a real browser
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
  'Connection': 'keep-alive',
  'Referer': 'https://www.nseindia.com/',
};

class NseFeed extends EventEmitter {
  constructor() {
    super();
    this.status = 'DISCONNECTED';
    this.cookies = '';
    this.cookieExpiry = 0;
    this.pollInterval = null;
    this.activeSymbols = []; // Internal symbols to poll
    this.indexSymbols = [];  // Index symbols (NIFTY50, BANKNIFTY)

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
      feedLogger.info('[NSE] No Indian stock symbols to track. NSE feed skipped.');
      return;
    }

    feedLogger.info(`[NSE] Starting NSE India feed for ${symbols.length} stocks + ${indexSymbols.length} indices`);

    // Initialize session (get cookies)
    await this._refreshSession();

    if (!this.cookies) {
      feedLogger.error('[NSE] Failed to establish session. Will retry...');
    }

    this.status = 'CONNECTED';
    this._startPolling();
  }

  /**
   * Refresh NSE session cookies by hitting the homepage
   */
  async _refreshSession() {
    return new Promise((resolve) => {
      const options = {
        hostname: NSE_BASE,
        path: '/',
        method: 'GET',
        headers: {
          ...BROWSER_HEADERS,
          'Accept': 'text/html,application/xhtml+xml',
        },
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          // Extract cookies from response headers
          const setCookies = res.headers['set-cookie'];
          if (setCookies && setCookies.length > 0) {
            this.cookies = setCookies.map(c => c.split(';')[0]).join('; ');
            this.cookieExpiry = Date.now() + 5 * 60 * 1000; // Refresh every 5 minutes
            this.stats.sessionRefreshes++;
            feedLogger.info(`[NSE] Session established (cookies obtained)`);
          }
          resolve();
        });
      });

      req.on('error', (err) => {
        feedLogger.error(`[NSE] Session refresh failed: ${err.message}`);
        resolve();
      });

      req.on('timeout', () => {
        feedLogger.error('[NSE] Session refresh timed out');
        req.destroy();
        resolve();
      });

      req.end();
    });
  }

  /**
   * Start polling loop — uses bulk index endpoints to minimize HTTP connections
   */
  _startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    const POLL_INTERVAL_MS = 2000; // Poll every 2s

    // ── NSE Bulk index groups ──
    // NSE has bulk endpoints for each index. Together these cover ALL ~3,000 listed stocks.
    // We stagger them across cycles so we never send more than 3-4 requests per cycle.
    //
    // Group A (every cycle, ~2s): NIFTY 50 + NIFTY NEXT 50 = top 100 stocks
    // Group B (every 2 cycles, ~4s): NIFTY MIDCAP 150 + NIFTY SMALLCAP 250 = 400 more stocks
    // Group C (every 3 cycles, ~6s): NIFTY 500 + NIFTY MICROCAP 250 = broader coverage
    // Group D (every 5 cycles, ~10s): NIFTY TOTAL MARKET = all remaining stocks
    // Group E (every 10 cycles, ~20s): Securities in F&O = all F&O eligible stocks
    // Individual fallback: any symbol still not covered after all bulk runs

    const bulkCoveredSymbols = new Set();
    let individualBatchIndex = 0;
    const INDIVIDUAL_BATCH_SIZE = 30;

    this.pollInterval = setInterval(async () => {
      try {
        // Refresh session if expired
        if (Date.now() > this.cookieExpiry) {
          await this._refreshSession();
        }

        if (!this.cookies) return;

        this.stats.pollCycles++;
        const cycle = this.stats.pollCycles;

        // ── Group A: Every cycle (every 2s) — Top 100 stocks ──
        await Promise.allSettled([
          this._fetchBulkQuotes('NIFTY%2050', bulkCoveredSymbols),
          this._fetchBulkQuotes('NIFTY%20NEXT%2050', bulkCoveredSymbols),
        ]);

        // ── Group B: Every 2 cycles (every 4s) — Mid + Small cap (400 stocks) ──
        if (cycle % 2 === 0) {
          await Promise.allSettled([
            this._fetchBulkQuotes('NIFTY%20MIDCAP%20150', bulkCoveredSymbols),
            this._fetchBulkQuotes('NIFTY%20SMALLCAP%20250', bulkCoveredSymbols),
          ]);
        }

        // ── Group C: Every 3 cycles (every 6s) — NIFTY 500 + NIFTY 200 ──
        if (cycle % 3 === 0) {
          await Promise.allSettled([
            this._fetchBulkQuotes('NIFTY%20500', bulkCoveredSymbols),
            this._fetchBulkQuotes('NIFTY200%20QUALITY%2030', bulkCoveredSymbols),
          ]);
        }

        // ── Group D: Every 5 cycles (every 10s) — Microcap + broader indices ──
        if (cycle % 5 === 0) {
          await Promise.allSettled([
            this._fetchBulkQuotes('NIFTY%20MICROCAP%20250', bulkCoveredSymbols),
            this._fetchBulkQuotes('NIFTY%20TOTAL%20MARKET', bulkCoveredSymbols),
          ]);
        }

        // ── Group E: Every 10 cycles (every 20s) — F&O eligible stocks ──
        if (cycle % 10 === 0) {
          await Promise.allSettled([
            this._fetchBulkQuotes('Securities%20in%20F%26O', bulkCoveredSymbols),
            this._fetchBulkQuotes('NIFTY%20LARGEMIDCAP%20250', bulkCoveredSymbols),
          ]);
        }

        // ── Individual fallback: symbols not covered by any bulk index ──
        // These are very small-cap / SME stocks not part of any major NSE index.
        const uncoveredSymbols = this.activeSymbols.filter(s => !bulkCoveredSymbols.has(s));
        if (uncoveredSymbols.length > 0) {
          const start = individualBatchIndex * INDIVIDUAL_BATCH_SIZE;
          const batch = uncoveredSymbols.slice(start, start + INDIVIDUAL_BATCH_SIZE);
          individualBatchIndex = (start + INDIVIDUAL_BATCH_SIZE >= uncoveredSymbols.length) ? 0 : individualBatchIndex + 1;
          if (batch.length > 0) {
            const promises = batch.map(symbol => this._fetchEquityQuote(symbol));
            await Promise.allSettled(promises);
          }
          // Log uncovered count periodically for monitoring
          if (cycle % 30 === 0) {
            feedLogger.info(`[NSE] ${bulkCoveredSymbols.size} stocks covered by bulk endpoints, ${uncoveredSymbols.length} on individual rotation`);
          }
        }

        // ── Indices (NIFTY50, BANKNIFTY) — less frequently ──
        if (this.indexSymbols.length > 0 && cycle % 3 === 0) {
          await this._fetchIndexQuotes();
        }

      } catch (err) {
        this.stats.errorsEncountered++;
        if (this.stats.errorsEncountered % 20 === 0) {
          feedLogger.error(`[NSE] Poll cycle error: ${err.message}`);
        }
      }
    }, POLL_INTERVAL_MS);

    feedLogger.info(`[NSE] Polling started — ${this.activeSymbols.length} stocks, multi-index bulk mode every ${POLL_INTERVAL_MS}ms`);
    feedLogger.info(`[NSE] Bulk coverage: Top 100 every 2s | Mid+Small 400 every 4s | NIFTY 500 every 6s | Total Market every 10s`);
  }


  /**
   * Fetch bulk quotes for all stocks in an NSE index (e.g., NIFTY 50, NIFTY 500)
   * This returns ALL stocks in the index in ONE HTTP call instead of N separate calls.
   * @param {string} nseIndex - URL-encoded NSE index name (e.g., 'NIFTY%2050')
   * @param {Set} coveredSymbols - Set to track which symbols were covered
   */
  async _fetchBulkQuotes(nseIndex, coveredSymbols) {
    return new Promise((resolve) => {
      const path = `/api/equity-stockIndices?index=${nseIndex}`;

      const options = {
        hostname: NSE_BASE,
        path,
        method: 'GET',
        headers: {
          ...BROWSER_HEADERS,
          'Cookie': this.cookies,
        },
        timeout: 8000,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              const stocks = json.data || [];

              for (const stock of stocks) {
                const symbol = stock.symbol;
                if (!symbol) continue;

                const ltp = stock.lastPrice;
                if (!ltp || ltp <= 0) continue;

                // Mark as covered so individual fetch loop skips this symbol
                coveredSymbols.add(symbol);

                const tick = {
                  symbol,
                  exchange: 'NSE',
                  price: ltp,
                  ltp,
                  bid: ltp,
                  ask: ltp,
                  high: stock.dayHigh || ltp,
                  low: stock.dayLow || ltp,
                  open: stock.open || ltp,
                  prev_close: stock.previousClose || 0,
                  change: stock.change || 0,
                  change_percent: stock.pChange || 0,
                  volume: stock.totalTradedVolume || 0,
                  timestamp: Date.now(),
                  _debug: { source: 'nse_bulk', index: nseIndex, providerSymbol: symbol },
                };

                this.stats.ticksReceived++;
                this.stats.lastTickTime = Date.now();
                this.emit('tick', tick);
              }

              if (stocks.length > 0) {
                feedLogger.debug?.(`[NSE BULK] ${nseIndex}: ${stocks.length} stocks updated`);
              }

            } catch (err) {
              // Parse error — skip
            }
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            this.cookieExpiry = 0;
          } else if (res.statusCode === 429) {
            feedLogger.warn(`[NSE BULK] Rate limited on ${nseIndex}`);
          }
          resolve();
        });
      });

      req.on('error', (err) => {
        this.stats.errorsEncountered++;
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        resolve();
      });

      req.end();
    });
  }

  /**
   * Fetch a single equity quote from NSE
   */
  async _fetchEquityQuote(symbol) {
    return new Promise((resolve) => {
      const path = `/api/quote-equity?symbol=${encodeURIComponent(symbol)}`;

      const options = {
        hostname: NSE_BASE,
        path,
        method: 'GET',
        headers: {
          ...BROWSER_HEADERS,
          'Cookie': this.cookies,
        },
        timeout: 5000,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              const priceInfo = json.priceInfo;

              if (!priceInfo || !priceInfo.lastPrice) {
                return resolve();
              }

              const tick = {
                symbol: symbol,
                exchange: 'NSE',
                price: priceInfo.lastPrice,
                ltp: priceInfo.lastPrice,
                bid: priceInfo.lastPrice, // NSE doesn't give bid/ask in this endpoint
                ask: priceInfo.lastPrice,
                high: priceInfo.intraDayHighLow?.max || priceInfo.lastPrice,
                low: priceInfo.intraDayHighLow?.min || priceInfo.lastPrice,
                open: priceInfo.open || priceInfo.lastPrice,
                prev_close: priceInfo.previousClose || 0,
                change: priceInfo.change || 0,
                change_percent: priceInfo.pChange || 0,
                volume: json.securityWiseDP?.quantityTraded || 0,
                timestamp: Date.now(),
                _debug: { source: 'nse_india', providerSymbol: symbol },
              };

              this.stats.ticksReceived++;
              this.stats.lastTickTime = Date.now();
              this.emit('tick', tick);

            } catch (err) {
              // Parse error — skip
            }
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            // Session expired — need refresh
            this.cookieExpiry = 0;
          }
          resolve();
        });
      });

      req.on('error', (err) => {
        this.stats.errorsEncountered++;
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        resolve();
      });

      req.end();
    });
  }

  /**
   * Fetch NIFTY 50 and BANK NIFTY index quotes
   */
  async _fetchIndexQuotes() {
    const indexMap = {
      'NIFTY50': 'NIFTY 50',
      'NIFTY': 'NIFTY 50',
      'BANKNIFTY': 'NIFTY BANK',
    };

    for (const idxSymbol of this.indexSymbols) {
      const nseIndexName = indexMap[idxSymbol] || idxSymbol;
      
      await new Promise((resolve) => {
        const path = `/api/allIndices`;

        const options = {
          hostname: NSE_BASE,
          path,
          method: 'GET',
          headers: {
            ...BROWSER_HEADERS,
            'Cookie': this.cookies,
          },
          timeout: 5000,
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const json = JSON.parse(data);
                const indices = json.data || [];

                for (const idx of indices) {
                  if (idx.index === nseIndexName || idx.indexSymbol === nseIndexName) {
                    const tick = {
                      symbol: idxSymbol,
                      exchange: 'NSE_INDEX',
                      price: idx.last,
                      ltp: idx.last,
                      bid: idx.last,
                      ask: idx.last,
                      high: idx.high || idx.last,
                      low: idx.low || idx.last,
                      open: idx.open || idx.last,
                      prev_close: idx.previousClose || 0,
                      change: idx.variation || 0,
                      change_percent: idx.percentChange || 0,
                      volume: 0,
                      timestamp: Date.now(),
                      _debug: { source: 'nse_india_index', providerSymbol: nseIndexName },
                    };

                    this.stats.ticksReceived++;
                    this.stats.lastTickTime = Date.now();
                    this.emit('tick', tick);
                    break;
                  }
                }
              } catch (err) {
                // Parse error
              }
            } else if (res.statusCode === 401 || res.statusCode === 403) {
              this.cookieExpiry = 0;
            }
            resolve();
          });
        });

        req.on('error', () => resolve());
        req.on('timeout', () => { req.destroy(); resolve(); });
        req.end();
      });
    }
  }

  /**
   * Stop the NSE feed
   */
  stop() {
    this.status = 'DISCONNECTED';
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    feedLogger.info('[NSE] Feed service stopped.');
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      provider: 'nse_india',
      status: this.status,
      activeSymbolCount: this.activeSymbols.length,
      indexCount: this.indexSymbols.length,
      stats: { ...this.stats },
    };
  }
}

// Export singleton
const nseFeed = new NseFeed();
module.exports = { nseFeed };
