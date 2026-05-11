import { create } from 'zustand';
import { api, connectPriceFeed, disconnectPriceFeed, isLoggedIn, getStoredUser } from '../services/api';

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
    set({
      isAuthenticated: false, user: null, wallet: null,
      instruments: [], positions: [], orders: [], tradeHistory: [],
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
    let instruments = [];

    switch (state.activeMarketTab) {
      case 'stocks': instruments = state.getStocks(); break;
      case 'forex': instruments = state.getForex(); break;
      case 'metals': instruments = state.getMetals(); break;
      case 'indices': instruments = state.getIndices(); break;
      default: instruments = state.getStocks();
    }

    if (state.showWatchlistOnly) {
      const favs = JSON.parse(localStorage.getItem('tradex_favorites') || '[]');
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
    const favs = JSON.parse(localStorage.getItem('tradex_favorites') || '[]');
    const updated = favs.includes(symbol) ? favs.filter(s => s !== symbol) : [...favs, symbol];
    localStorage.setItem('tradex_favorites', JSON.stringify(updated));
    set({}); // trigger re-render
  },

  isFavorite: (symbol) => {
    const favs = JSON.parse(localStorage.getItem('tradex_favorites') || '[]');
    return favs.includes(symbol);
  },

  getAllFavorites: () => {
    const state = get();
    const favs = JSON.parse(localStorage.getItem('tradex_favorites') || '[]');
    return state.instruments.filter(i => favs.includes(i.symbol));
  },

  getAllInstruments: () => get().instruments,

  // ── Search ──
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // ── Selected Instrument ──
  selectedInstrument: null,
  setSelectedInstrument: (instrument) => set({ selectedInstrument: instrument }),

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
      // Refresh positions and wallet after trade
      get().fetchPositions();
      get().fetchWallet();
      get().fetchOrders();
      set({ orderLoading: false });
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
    } catch (err) {
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

  // ── Notifications (local for now) ──
  notifications: [],
  unreadCount: 0,
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    unreadCount: state.notifications.filter(n => !n.read && n.id !== id).length,
  })),

  // ── Live Price Updates ──
  startPriceFeed: () => {
    connectPriceFeed((updates) => {
      set((state) => {
        const newInstruments = [...state.instruments];
        for (const update of updates) {
          const idx = newInstruments.findIndex(i => i.symbol === update.symbol);
          if (idx !== -1) {
            newInstruments[idx] = {
              ...newInstruments[idx],
              // Keep both snake_case (for any code that uses it) and camelCase
              last_price: update.price,
              price: update.price,
              change_amount: update.change,
              change: update.change,
              change_percent: update.change_percent,
              changePercent: update.change_percent,
              day_high: update.high,
              high: update.high,
              day_low: update.low,
              low: update.low,
              bid_price: update.bid,
              ask_price: update.ask,
            };
          }
        }

        // Also update open positions with live prices
        const newPositions = state.positions.map(pos => {
          const priceUpdate = updates.find(u => u.symbol === pos.symbol);
          if (priceUpdate) {
            const currentPrice = priceUpdate.price;
            const unrealizedPnl = pos.type === 'BUY'
              ? (currentPrice - pos.entryPrice) * pos.quantity
              : (pos.entryPrice - currentPrice) * pos.quantity;
            return {
              ...pos,
              current_price: currentPrice,
              currentPrice,
              pnl: unrealizedPnl,
              pnlPercent: pos.margin > 0 ? (unrealizedPnl / pos.margin) * 100 : 0,
            };
          }
          return pos;
        });

        return { instruments: newInstruments, positions: newPositions };
      });
    });
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

  loadInitialData: async () => {
    set({ isLoading: true });
    await Promise.all([
      get().fetchInstruments(),
      get().fetchWallet(),
      get().fetchPositions(),
      get().fetchOrders(),
      get().fetchHistory(),
    ]);
    get().startPriceFeed();
    set({ isLoading: false });
  },
}));
