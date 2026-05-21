import { create } from 'zustand';
import { api, connectPriceFeed, disconnectPriceFeed, connectUserSocket, disconnectUserSocket, isLoggedIn, getStoredUser, requestHistoricalCandles, updatePositionSlTgtWs, subscribeWsSymbols, debugSubscribeWs } from '../services/api';

// ── Normalization helpers ──
function normalizeUser(raw) {
  if (!raw) return null;
  return {
    ...raw,
    name: raw.full_name || raw.name || '',
    clientId: raw.client_id || raw.clientId || '',
    referralCode: raw.referral_code || raw.referralCode || '',
    kycStatus: raw.kyc_status || raw.kycStatus || 'pending',
  };
}

function normalizeWallet(raw) {
  if (!raw) return null;
  return {
    ...raw,
    usedMargin: raw.used_margin ?? raw.usedMargin ?? 0,
    availableMargin: raw.available_margin ?? raw.availableMargin ?? 0,
    todayPnl: raw.today_pnl ?? raw.todayPnl ?? 0,
    weekPnl: raw.week_pnl ?? raw.weekPnl ?? 0,
    totalPnl: raw.total_pnl ?? raw.totalPnl ?? 0,
    totalDeposited: raw.total_deposited ?? raw.totalDeposited ?? 0,
    totalWithdrawn: raw.total_withdrawn ?? raw.totalWithdrawn ?? 0,
    bonusBalance: raw.bonus_balance ?? raw.bonusBalance ?? 0,
    todayPnlPercent: raw.balance > 0 ? ((raw.today_pnl ?? 0) / raw.balance) * 100 : 0,
  };
}

function generateSparkline() {
  const points = [];
  let val = 50 + Math.random() * 50;
  for (let i = 0; i < 20; i++) {
    val += (Math.random() - 0.48) * 8;
    points.push(Math.max(10, Math.min(90, val)));
  }
  return points;
}

function normalizeInstrument(raw) {
  return {
    ...raw,
    price: raw.last_price ?? raw.price ?? 0,
    change: raw.change_amount ?? raw.change ?? 0,
    changePercent: raw.change_percent ?? raw.changePercent ?? 0,
    high: raw.day_high ?? raw.high ?? 0,
    low: raw.day_low ?? raw.low ?? 0,
    open: raw.day_open ?? raw.open ?? 0,
    prevClose: raw.prev_close ?? raw.prevClose ?? 0,
    sparkline: raw.sparkline || generateSparkline(),
  };
}

function normalizePosition(raw) {
  const side = raw.side === 'long' ? 'BUY' : raw.side === 'short' ? 'SELL' : (raw.type || raw.side || '').toUpperCase();
  const entryPrice = raw.entry_price ?? raw.entryPrice ?? 0;
  const currentPrice = raw.current_price ?? raw.currentPrice ?? entryPrice;
  const qty = raw.quantity ?? 0;
  const unrealizedPnl = raw.unrealized_pnl ?? raw.pnl ?? ((side === 'BUY' ? 1 : -1) * (currentPrice - entryPrice) * qty);
  const marginUsed = raw.margin_used ?? raw.margin ?? 0;
  return {
    ...raw,
    type: side,
    entryPrice,
    currentPrice,
    pnl: unrealizedPnl,
    pnlPercent: marginUsed > 0 ? (unrealizedPnl / marginUsed) * 100 : 0,
    margin: marginUsed,
  };
}

function normalizeOrder(raw) {
  return {
    ...raw,
    side: (raw.side || '').toUpperCase(),
    type: raw.order_type || raw.type || 'market',
    filledAt: raw.filled_at || raw.filledAt || null,
    cancelledAt: raw.cancelled_at || raw.cancelledAt || null,
    createdAt: raw.created_at || raw.createdAt || null,
  };
}

function normalizeTrade(raw) {
  const side = (raw.side || '').toUpperCase();
  return {
    ...raw,
    type: side === 'BUY' ? 'BUY' : 'SELL',
    pnl: raw.net_pnl ?? raw.pnl ?? 0,
    entryPrice: raw.entry_price ?? raw.entryPrice ?? 0,
    exitPrice: raw.exit_price ?? raw.exitPrice ?? 0,
    openDate: raw.opened_at ? new Date(raw.opened_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : (raw.openDate || ''),
    closeDate: raw.closed_at ? new Date(raw.closed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : (raw.closeDate || ''),
  };
}

// Main trading store — connected to real backend
export const useTradeStore = create((set, get) => ({
  // ── Auth ──
  isAuthenticated: isLoggedIn(),
  user: normalizeUser(getStoredUser()),
  authLoading: false,
  authError: null,

  // ── System Banner (from admin broadcasts) ──
  systemBanner: null,
  dismissBanner: () => set({ systemBanner: null }),
  handleBroadcast: (data) => {
    set({ systemBanner: data });
    // Auto-dismiss info banners after 15 seconds
    if (data.type === 'info') {
      setTimeout(() => {
        const current = get().systemBanner;
        if (current && current.timestamp === data.timestamp) set({ systemBanner: null });
      }, 15000);
    }
  },

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const data = await api.login(email, password);
      set({ isAuthenticated: true, user: normalizeUser(data.user), authLoading: false });
      // Load initial data after login
      get().loadInitialData();
      return { success: true };
    } catch (err) {
      set({ authLoading: false, authError: err.message });
      return { success: false, error: err.message };
    }
  },

  signup: async (email, password, full_name, phone, referral_code) => {
    set({ authLoading: true, authError: null });
    try {
      const data = await api.signup(email, password, full_name, phone, referral_code);
      set({ isAuthenticated: true, user: normalizeUser(data.user), authLoading: false });
      get().loadInitialData();
      return { success: true };
    } catch (err) {
      set({ authLoading: false, authError: err.message });
      return { success: false, error: err.message };
    }
  },

  logout: async () => {
    await api.logout();
    disconnectPriceFeed();
    disconnectUserSocket();
    if (get()._notificationInterval) {
      clearInterval(get()._notificationInterval);
    }
    set({
      isAuthenticated: false, user: null, wallet: null,
      instruments: [], positions: [], orders: [], tradeHistory: [],
      _notificationInterval: null, _initializing: false
    });
  },

  // ── Wallet ──
  wallet: null,
  walletTransactions: [],
  walletLoading: false,

  fetchWallet: async () => {
    set({ walletLoading: true });
    try {
      const data = await api.getWallet();
      set({ wallet: normalizeWallet(data.wallet), walletTransactions: data.transactions || [], walletLoading: false });
    } catch (err) {
      console.error('Wallet fetch error:', err);
      set({ walletLoading: false });
    }
  },

  // ── Instruments (from real DB) ──
  instruments: [],
  instrumentsLoading: false,
  activeMarketTab: 'stocks',
  setActiveMarketTab: (tab) => set({ activeMarketTab: tab }),

  fetchInstruments: async () => {
    set({ instrumentsLoading: true });
    try {
      const data = await api.getInstruments();
      set({ instruments: (data.instruments || []).map(normalizeInstrument), instrumentsLoading: false });
    } catch (err) {
      console.error('Instruments fetch error:', err);
      set({ instrumentsLoading: false });
    }
  },

  // Map instruments by segment for the UI tabs
  getStocks: () => get().instruments.filter(i => ['nse_equity', 'bse_equity'].includes(i.segment)),
  getForex: () => get().instruments.filter(i => i.segment === 'forex'),
  getMetals: () => get().instruments.filter(i => i.segment === 'mcx'),
  getIndices: () => get().instruments.filter(i => ['fo_futures', 'fo_options'].includes(i.segment)),

  getFilteredInstruments: () => {
    const state = get();
    const query = state.searchQuery.toLowerCase();
    let instruments;

    switch (state.activeMarketTab) {
      case 'stocks': instruments = state.getStocks(); break;
      case 'forex': instruments = state.getForex(); break;
      case 'metals': instruments = state.getMetals(); break;
      case 'indices': instruments = state.getIndices(); break;
      default: instruments = state.getStocks();
    }

    if (state.showWatchlistOnly) {
      const favs = JSON.parse(localStorage.getItem('tradex_watchlist') || '[]');
      instruments = instruments.filter(i => favs.includes(i.symbol));
    }

    if (!query) return instruments;
    return instruments.filter(i =>
      i.symbol.toLowerCase().includes(query) || i.name.toLowerCase().includes(query)
    );
  },

  // ── Watchlist / Favorites (stored locally) ──
  showWatchlistOnly: false,
  setShowWatchlistOnly: (show) => set({ showWatchlistOnly: show }),

  toggleFavorite: (symbol) => {
    const favs = JSON.parse(localStorage.getItem('tradex_watchlist') || '[]');
    const updated = favs.includes(symbol) ? favs.filter(s => s !== symbol) : [...favs, symbol];
    localStorage.setItem('tradex_watchlist', JSON.stringify(updated));
    set({}); // trigger re-render
  },

  isFavorite: (symbol) => {
    const favs = JSON.parse(localStorage.getItem('tradex_watchlist') || '[]');
    return favs.includes(symbol);
  },

  getAllFavorites: () => {
    const state = get();
    const favs = JSON.parse(localStorage.getItem('tradex_watchlist') || '[]');
    return state.instruments.filter(i => favs.includes(i.symbol));
  },

  getAllInstruments: () => get().instruments,

  // ── Search ──
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // ── Selected Instrument ──
  selectedInstrument: null,
  setSelectedInstrument: (instrument) => {
    set({ selectedInstrument: instrument });
    get().updateSubscriptions();
  },

  // ── Trading ──
  orderType: 'market',
  setOrderType: (type) => set({ orderType: type }),
  orderSide: 'buy',
  setOrderSide: (side) => set({ orderSide: side }),
  quantity: '',
  setQuantity: (qty) => set({ quantity: qty }),
  orderLoading: false,

  placeOrder: async (orderData) => {
    set({ orderLoading: true });
    try {
      const data = await api.placeOrder(orderData);
      set({ orderLoading: false });
      
      // Backend now returns 202 (queued) for market orders.
      // The actual fill will arrive via Socket.IO USER:ORDER_FILLED event.
      // We still do a quick refresh to pick up pending state.
      if (data.status === 'queued') {
        // Order is queued — UI will update when USER:ORDER_FILLED fires
        setTimeout(() => {
          get().fetchPositions();
          get().fetchOrders();
          get().fetchWallet();
        }, 1500); // Give the worker 1.5s to process
        return { success: true, message: data.message || 'Order accepted for execution', ...data };
      }
      
      // Fallback for non-queued responses (limit orders, etc.)
      get().fetchPositions();
      get().fetchWallet();
      get().fetchOrders();
      return { success: true, ...data };
    } catch (err) {
      set({ orderLoading: false });
      return { success: false, error: err.message };
    }
  },

  // ── Positions ──
  positions: [],
  positionsLoading: false,

  fetchPositions: async () => {
    set({ positionsLoading: true });
    try {
      const data = await api.getPositions();
      set({ positions: (data.positions || []).map(normalizePosition), positionsLoading: false });
    } catch (err) {
      console.error('Positions fetch error:', err);
      set({ positionsLoading: false });
    }
  },

  closePosition: async (id) => {
    try {
      const data = await api.closePosition(id);
      get().fetchPositions();
      get().fetchWallet();
      return { success: true, ...data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  updatePositionSlTgt: (positionId, stopLoss, target) => {
    // Optimistic UI update
    set(state => ({
      positions: state.positions.map(p => p.id === positionId ? { ...p, stop_loss: stopLoss, target: target } : p)
    }));
    // Send to backend via WS
    updatePositionSlTgtWs(positionId, stopLoss, target);
  },

  // ── Candles ──
  candles: {},
  requestCandles: (symbol, timeframe) => {
    requestHistoricalCandles(symbol, timeframe);
  },

  // ── Orders ──
  orders: [],
  ordersLoading: false,
  activeOrderTab: 'open',
  setActiveOrderTab: (tab) => set({ activeOrderTab: tab }),

  fetchOrders: async () => {
    set({ ordersLoading: true });
    try {
      const data = await api.getOrders();
      set({ orders: (data.orders || []).map(normalizeOrder), ordersLoading: false });
    } catch (err) {
      console.error('Orders fetch error:', err);
      set({ ordersLoading: false });
    }
  },

  getFilteredOrders: () => {
    const state = get();
    switch (state.activeOrderTab) {
      case 'open': return state.orders.filter(o => o.status === 'pending');
      case 'filled': return state.orders.filter(o => o.status === 'filled');
      case 'cancelled': return state.orders.filter(o => o.status === 'cancelled');
      default: return state.orders;
    }
  },

  cancelOrder: async (id) => {
    try {
      await api.cancelOrder(id);
      get().fetchOrders();
      get().fetchWallet();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── History ──
  tradeHistory: [],
  historyLoading: false,
  historyFilter: { symbol: '', dateRange: 'all' },
  setHistoryFilter: (filter) => set((state) => ({ historyFilter: { ...state.historyFilter, ...filter } })),

  fetchHistory: async () => {
    set({ historyLoading: true });
    try {
      const data = await api.getTradeHistory();
      set({ tradeHistory: (data.trades || []).map(normalizeTrade), historyLoading: false });
    } catch {
      set({ historyLoading: false });
    }
  },

  getFilteredHistory: () => {
    const state = get();
    let history = state.tradeHistory;
    if (state.historyFilter.symbol) {
      history = history.filter(t => t.symbol.toLowerCase().includes(state.historyFilter.symbol.toLowerCase()));
    }
    return history;
  },

  // ── Notifications (from backend) ──
  notifications: [],
  unreadCount: 0,
  notificationsLoading: false,

  fetchNotifications: async () => {
    set({ notificationsLoading: true });
    try {
      const data = await api.getNotifications();
      const notifs = data.notifications || [];
      set({
        notifications: notifs,
        unreadCount: notifs.filter(n => !n.read).length,
        notificationsLoading: false,
      });
    } catch (err) {
      console.error('Notifications fetch error:', err);
      set({ notificationsLoading: false });
    }
  },

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    unreadCount: state.notifications.filter(n => !n.read && n.id !== id).length,
  })),

  // ── Live Price Updates ──
  debugStats: null,
  startPriceFeed: () => {
    let tickBuffer = [];
    let frameId = null;

    const processBatch = () => {
      if (tickBuffer.length > 0) {
        const batch = [...tickBuffer];
        tickBuffer = [];

        set((state) => {
          const newInstruments = [...state.instruments];
          const updatedSymbols = new Set(batch.map(b => b.symbol));

          // To optimize lookup, map the latest ticks by symbol
          const latestTicks = {};
          batch.forEach(tick => {
            latestTicks[tick.symbol] = tick;
          });

          for (const symbol in latestTicks) {
            const update = latestTicks[symbol];
            const idx = newInstruments.findIndex(i => i.symbol === symbol);
            if (idx !== -1) {
              const previousPrice = newInstruments[idx].price || newInstruments[idx].last_price || 0;
              const newPrice = update.ltp || update.price || previousPrice;
              
              // Only flash if the price actually changed
              let tickDirection = newInstruments[idx].tickDirection || 'none';
              if (newPrice > previousPrice) {
                tickDirection = 'up';
              } else if (newPrice < previousPrice) {
                tickDirection = 'down';
              }

              newInstruments[idx] = {
                ...newInstruments[idx],
                last_price: newPrice,
                price: newPrice,
                change_amount: update.change !== undefined ? update.change : newInstruments[idx].change || 0,
                change: update.change !== undefined ? update.change : newInstruments[idx].change || 0,
                change_percent: update.change_percent !== undefined ? update.change_percent : newInstruments[idx].changePercent || 0,
                changePercent: update.change_percent !== undefined ? update.change_percent : newInstruments[idx].changePercent || 0,
                day_high: update.high || newInstruments[idx].high || 0,
                high: update.high || newInstruments[idx].high || 0,
                day_low: update.low || newInstruments[idx].low || 0,
                low: update.low || newInstruments[idx].low || 0,
                day_open: update.open || newInstruments[idx].open || 0,
                open: update.open || newInstruments[idx].open || 0,
                prev_close: update.prev_close || newInstruments[idx].prevClose || 0,
                prevClose: update.prev_close || newInstruments[idx].prevClose || 0,
                volume: update.volume || newInstruments[idx].volume || 0,
                bid_price: update.bid !== undefined ? update.bid : newInstruments[idx].bid_price || 0,
                ask_price: update.ask !== undefined ? update.ask : newInstruments[idx].ask_price || 0,
                spread: update.spread !== undefined ? update.spread : newInstruments[idx].spread || 0,
                tickDirection: tickDirection,
                lastTickTime: Date.now()
              };
            }
          }

          // Also update open positions with live prices
          const newPositions = state.positions.map(pos => {
            if (updatedSymbols.has(pos.symbol)) {
              const priceUpdate = latestTicks[pos.symbol];
              if (priceUpdate) {
                const currentPrice = priceUpdate.price || priceUpdate.ltp;
                const exitPrice = pos.type === 'BUY' ? priceUpdate.bid : priceUpdate.ask;
                const evalPrice = exitPrice > 0 ? exitPrice : currentPrice; // Fallback if bid/ask is 0
                
                const unrealizedPnl = pos.type === 'BUY'
                  ? (evalPrice - pos.entryPrice) * pos.quantity
                  : (pos.entryPrice - evalPrice) * pos.quantity;
                  
                return {
                  ...pos,
                  current_price: evalPrice,
                  currentPrice: evalPrice,
                  pnl: unrealizedPnl,
                  pnlPercent: pos.margin > 0 ? (unrealizedPnl / pos.margin) * 100 : 0,
                };
              }
            }
            return pos;
          });

          return { instruments: newInstruments, positions: newPositions };
        });
      }
      frameId = requestAnimationFrame(processBatch);
    };

    frameId = requestAnimationFrame(processBatch);

    connectPriceFeed((updates) => {
      tickBuffer.push(...updates);
    }, (candleMsg) => {
      // Handle historical candles
      set(state => ({
        candles: {
          ...state.candles,
          [`${candleMsg.symbol}_${candleMsg.timeframe}`]: candleMsg.candles
        }
      }));
    }, (debugMsg) => {
      set({ debugStats: debugMsg });
    });
    
    // Subscribe to debug info
    setTimeout(() => debugSubscribeWs(), 1000);

    // Return disconnect cleanup helper
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  },
  
  updateSubscriptions: () => {
    const state = get();
    const symbolsToSub = new Set();
    
    // 1. Core indices for the header ticker
    symbolsToSub.add('NIFTY50');
    symbolsToSub.add('BANKNIFTY');

    // 2. Legacy Watchlist (tradex_watchlist)
    const favs = JSON.parse(localStorage.getItem('tradex_watchlist') || '[]');
    favs.forEach(s => symbolsToSub.add(s));

    // 3. Multi-Watchlists (tradex_watchlists: MW-1 to MW-5)
    try {
      const wlists = JSON.parse(localStorage.getItem('tradex_watchlists') || 'null');
      if (wlists && wlists.lists) {
        Object.values(wlists.lists).forEach(list => {
          if (Array.isArray(list)) {
            list.forEach(s => symbolsToSub.add(s));
          }
        });
      }
    } catch (e) {
      console.warn('Failed to parse tradex_watchlists', e);
    }
    
    // 4. Chart
    if (state.selectedInstrument) {
      symbolsToSub.add(state.selectedInstrument.symbol);
    }
    
    // 5. Positions
    state.positions.forEach(p => {
      if (p.status !== 'CLOSED') symbolsToSub.add(p.symbol);
    });
    
    subscribeWsSymbols(Array.from(symbolsToSub));
  },

  // ── UI State ──
  showOrderModal: false,
  setShowOrderModal: (show) => set({ showOrderModal: show }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // ── Load all data after login ──
  // ── Deposit / Withdraw actions ──
  depositLoading: false,
  submitDeposit: async (amount, method, utr_number) => {
    set({ depositLoading: true });
    try {
      const data = await api.submitDeposit(amount, method, utr_number);
      get().fetchWallet();
      set({ depositLoading: false });
      return { success: true, ...data };
    } catch (err) {
      set({ depositLoading: false });
      return { success: false, error: err.message };
    }
  },

  withdrawLoading: false,
  submitWithdrawal: async (withdrawalData) => {
    set({ withdrawLoading: true });
    try {
      const data = await api.submitWithdrawal(withdrawalData);
      get().fetchWallet();
      set({ withdrawLoading: false });
      return { success: true, ...data };
    } catch (err) {
      set({ withdrawLoading: false });
      return { success: false, error: err.message };
    }
  },

  // ── Handle realtime order fill from BullMQ worker ──
  handleOrderFilled: (data) => {
    console.log('🔔 Order filled event received:', data);
    // Refresh all trading data
    get().fetchPositions();
    get().fetchOrders();
    get().fetchWallet();
  },

  // ── Handle realtime PNL update from MTM calculator ──
  handlePnlUpdate: (pnlData) => {
    if (!pnlData || !pnlData.positions) return;
    
    set((state) => {
      const updatedPositions = state.positions.map(pos => {
        const livePos = pnlData.positions.find(p => p.id === pos.id);
        if (livePos) {
          return {
            ...pos,
            currentPrice: livePos.currentPrice,
            current_price: livePos.currentPrice,
            pnl: livePos.unrealizedPnl,
            pnlPercent: pos.margin > 0 ? (livePos.unrealizedPnl / pos.margin) * 100 : 0,
          };
        }
        return pos;
      });

      return { positions: updatedPositions };
    });
  },

  _initializing: false,
  loadInitialData: async () => {
    // Guard against double-calls (React 18 StrictMode, etc.)
    if (get()._initializing) return;
    set({ _initializing: true, isLoading: true });
    await Promise.all([
      get().fetchInstruments(),
      get().fetchWallet(),
      get().fetchPositions(),
      get().fetchOrders(),
      get().fetchHistory(),
      get().fetchNotifications(),
    ]);
    get().startPriceFeed();
    get().updateSubscriptions();
    
    // Connect to the /user namespace for private events
    const user = get().user;
    if (user && user.id) {
      connectUserSocket(user.id, {
        onOrderFilled: (data) => get().handleOrderFilled(data),
        onPnlUpdate: (data) => get().handlePnlUpdate(data),
        onBroadcast: (data) => get().handleBroadcast(data),
      });
    }
    
    // Start notifications poll system (every 30 seconds)
    if (!get()._notificationInterval) {
      const interval = setInterval(() => {
        if (get().isAuthenticated) {
          get().fetchNotifications();
        }
      }, 30000);
      set({ _notificationInterval: interval });
    }
    
    set({ isLoading: false, _initializing: false });
  },
}));
