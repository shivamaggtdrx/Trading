import { create } from 'zustand';
import { api, connectPriceFeed, disconnectPriceFeed, isLoggedIn, getStoredUser } from '../services/api';

// Main trading store — connected to real backend
export const useTradeStore = create((set, get) => ({
  // ── Auth ──
  isAuthenticated: isLoggedIn(),
  user: getStoredUser(),
  authLoading: false,
  authError: null,

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const data = await api.login(email, password);
      set({ isAuthenticated: true, user: data.user, authLoading: false });
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
      set({ isAuthenticated: true, user: data.user, authLoading: false });
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
  walletLoading: false,

  fetchWallet: async () => {
    set({ walletLoading: true });
    try {
      const data = await api.getWallet();
      set({ wallet: data.wallet, walletLoading: false });
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
      set({ instruments: data.instruments || [], instrumentsLoading: false });
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
      set({ positions: data.positions || [], positionsLoading: false });
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
      set({ orders: data.orders || [], ordersLoading: false });
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
      set({ tradeHistory: data.trades || [], historyLoading: false });
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
              last_price: update.price,
              change_amount: update.change,
              change_percent: update.change_percent,
              day_high: update.high,
              day_low: update.low,
              bid_price: update.bid,
              ask_price: update.ask,
            };
          }
        }

        // Also update open positions current_price
        const newPositions = state.positions.map(pos => {
          const priceUpdate = updates.find(u => u.symbol === pos.symbol);
          if (priceUpdate) {
            const currentPrice = priceUpdate.price;
            const unrealizedPnl = pos.side === 'long'
              ? (currentPrice - pos.entry_price) * pos.quantity
              : (pos.entry_price - currentPrice) * pos.quantity;
            return { ...pos, current_price: currentPrice, unrealized_pnl: unrealizedPnl };
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
  loadInitialData: async () => {
    set({ isLoading: true });
    await Promise.all([
      get().fetchInstruments(),
      get().fetchWallet(),
      get().fetchPositions(),
      get().fetchOrders(),
    ]);
    get().startPriceFeed();
    set({ isLoading: false });
  },
}));
