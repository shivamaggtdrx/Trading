import { io } from 'socket.io-client';

// ══════════════════════════════════════════════════════════════
// TradeX Trader App — API Service Layer
// Connects to Express backend at localhost:4000
// ══════════════════════════════════════════════════════════════

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws/prices';

// ── Token management ──
function getToken() {
  const session = localStorage.getItem('tradex_session');
  if (!session) return null;
  try { return JSON.parse(session).access_token; } catch { return null; }
}

function getRefreshToken() {
  const session = localStorage.getItem('tradex_session');
  if (!session) return null;
  try { return JSON.parse(session).refresh_token; } catch { return null; }
}

function setSession(session) {
  localStorage.setItem('tradex_session', JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem('tradex_session');
  localStorage.removeItem('tradex_user');
}

// ── Token refresh ──
let isRefreshing = false;
async function tryRefreshToken() {
  if (isRefreshing) return false;
  isRefreshing = true;
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!res.ok) return false;
    
    const data = await res.json();
    if (data.session) {
      setSession(data.session);
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

// ── HTTP helper ──
async function request(path, options = {}, _isRetry = false) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401 && !_isRetry) {
      // Try refreshing token once before giving up
      const refreshed = await tryRefreshToken();
      if (refreshed) return request(path, options, true);
      clearSession();
      window.location.href = '/login';
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

// ══════════════════════════════════════════════════════════════
// API Methods
// ══════════════════════════════════════════════════════════════
export const api = {
  // ── Auth ──
  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setSession(data.session);
    localStorage.setItem('tradex_user', JSON.stringify(data.user));
    return data;
  },

  async signup(email, password, full_name, phone, referral_code) {
    const data = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, phone, referral_code }),
    });
    setSession(data.session);
    localStorage.setItem('tradex_user', JSON.stringify(data.user));
    return data;
  },

  async logout() {
    try { await request('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    clearSession();
  },

  async getMe() {
    return request('/auth/me');
  },

  // ── Instruments ──
  async getInstruments(segment) {
    const query = segment ? `?segment=${segment}` : '';
    return request(`/instruments${query}`);
  },

  async getInstrument(symbol) {
    return request(`/instruments/${symbol}`);
  },

  // ── Orders ──
  async placeOrder(orderData) {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async getOrders(status) {
    const query = status ? `?status=${status}` : '';
    return request(`/orders${query}`);
  },

  async cancelOrder(orderId) {
    return request(`/orders/${orderId}`, { method: 'DELETE' });
  },

  // ── Positions ──
  async getPositions() {
    return request('/positions');
  },

  async closePosition(positionId) {
    return request(`/positions/${positionId}/close`, { method: 'POST' });
  },

  async getTradeHistory(page = 1, limit = 20) {
    return request(`/positions/history?page=${page}&limit=${limit}`);
  },

  // ── Wallet ──
  async getWallet() {
    return request('/wallet');
  },

  async getTransactions(page = 1, limit = 20, type) {
    const params = `?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`;
    return request(`/wallet/transactions${params}`);
  },

  // ── Deposits ──
  async submitDeposit(amount, method, utr_number) {
    return request('/deposits', {
      method: 'POST',
      body: JSON.stringify({ amount, method, utr_number }),
    });
  },

  async getDeposits() {
    return request('/deposits');
  },

  // ── Withdrawals ──
  async submitWithdrawal(data) {
    return request('/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getWithdrawals() {
    return request('/withdrawals');
  },

  // ── User Profile ──
  async updateProfile(updates) {
    return request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // ── Password ──
  async changePassword(currentPassword, newPassword) {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // ── Referrals ──
  async getReferrals() {
    return request('/auth/referrals');
  },

  // ── Notifications ──
  async getNotifications() {
    return request('/auth/notifications');
  },
};

// ══════════════════════════════════════════════════════════════
// Socket.IO Price Feed (/market namespace)
// ══════════════════════════════════════════════════════════════
let marketSocket = null;
let staleCheckTimer = null;
let lastMessageTime = Date.now();
const subscribedSymbols = new Set();

export function connectPriceFeed(onPriceUpdate, onCandleUpdate = null, onDebugUpdate = null, symbols = []) {
  if (Array.isArray(symbols)) {
    symbols.forEach(s => subscribedSymbols.add(s));
  }

  if (marketSocket && marketSocket.connected) {
    const currentSymbols = Array.from(subscribedSymbols);
    if (currentSymbols.length > 0) {
      marketSocket.emit('MARKET:SUBSCRIBE_TICKERS', currentSymbols);
    }
    return;
  }

  const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:4000';
  
  // Connect to the public /market namespace
  marketSocket = io(`${API_URL}/market`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  marketSocket.on('connect', () => {
    console.log('📡 Socket.IO Price feed connected');
    const currentSymbols = Array.from(subscribedSymbols);
    if (currentSymbols.length > 0) {
      console.log('📡 Subscribing to symbols:', currentSymbols);
      marketSocket.emit('MARKET:SUBSCRIBE_TICKERS', currentSymbols);
    }
  });

  marketSocket.on('MARKET:TICK', (tick) => {
    lastMessageTime = Date.now();
    if (onPriceUpdate) {
      onPriceUpdate([tick]); // Pass as array for backward compatibility
    }
  });

  marketSocket.on('disconnect', (reason) => {
    console.log('📡 Socket.IO Price feed disconnected:', reason);
    if (reason === 'io server disconnect') {
      marketSocket.connect();
    }
  });

  marketSocket.on('connect_error', (error) => {
    console.error('Socket.IO Market Error:', error);
  });

  // Stale feed detection
  if (staleCheckTimer) clearInterval(staleCheckTimer);
  staleCheckTimer = setInterval(() => {
    if (Date.now() - lastMessageTime > 15000) {
      if (onDebugUpdate) {
        onDebugUpdate({ connected: marketSocket.connected, staleWarning: true });
      }
    }
  }, 2000);
}

export function requestHistoricalCandles(symbol, timeframe) {
  if (marketSocket && marketSocket.connected) {
    marketSocket.emit('MARKET:GET_CANDLES', { symbol, timeframe });
  }
}

export function updatePositionSlTgtWs(positionId, stopLoss, target) {
  // SL/TGT updates go via REST API (safer than WS for mutations)
  request(`/positions/${positionId}/sl-tgt`, {
    method: 'PUT',
    body: JSON.stringify({ stop_loss: stopLoss, target }),
  }).catch(err => console.error('SL/TGT update failed:', err));
}

export function subscribeWsSymbols(symbols) {
  if (!Array.isArray(symbols)) return;
  symbols.forEach(s => subscribedSymbols.add(s));

  if (marketSocket && marketSocket.connected) {
    console.log('📡 Dynamically subscribing to symbols:', symbols);
    marketSocket.emit('MARKET:SUBSCRIBE_TICKERS', symbols);
  }
}

export function debugSubscribeWs() {
  if (marketSocket && marketSocket.connected) {
    marketSocket.emit('MARKET:DEBUG_SUBSCRIBE');
  }
}

export function disconnectPriceFeed() {
  if (staleCheckTimer) clearInterval(staleCheckTimer);
  if (marketSocket) {
    marketSocket.disconnect();
    marketSocket = null;
  }
  subscribedSymbols.clear();
  disconnectUserSocket();
}

// ══════════════════════════════════════════════════════════════
// Socket.IO User Events (/user namespace)
// Private channel for: order fills, PNL updates, notifications
// ══════════════════════════════════════════════════════════════
let userSocket = null;
let _onOrderFilled = null;
let _onPnlUpdate = null;
let _onBroadcast = null;

/**
 * Connect to the /user namespace for private realtime events.
 * Call this after login with the user's ID.
 */
export function connectUserSocket(userId, { onOrderFilled, onPnlUpdate, onBroadcast } = {}) {
  if (userSocket && userSocket.connected) return;

  _onOrderFilled = onOrderFilled;
  _onPnlUpdate = onPnlUpdate;
  _onBroadcast = onBroadcast;

  const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:4000';

  userSocket = io(`${API_URL}/user`, {
    transports: ['websocket'],
    auth: {
      token: getToken()
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  userSocket.on('connect', () => {
    console.log('🔐 Socket.IO User channel connected');
    // Join private room
    userSocket.emit('USER:JOIN_PRIVATE', userId);
  });

  // ── Order filled notification from BullMQ worker ──
  userSocket.on('USER:ORDER_FILLED', (data) => {
    console.log('✅ Order filled via Socket.IO:', data);
    if (_onOrderFilled) _onOrderFilled(data);
  });

  // ── Realtime PNL updates from MTM calculator ──
  userSocket.on('USER:PNL_UPDATE', (data) => {
    if (_onPnlUpdate) _onPnlUpdate(data);
  });

  // ── Admin broadcast / system announcement ──
  userSocket.on('SYSTEM:BROADCAST', (data) => {
    console.log('📢 Admin broadcast received:', data.title);
    if (_onBroadcast) _onBroadcast(data);
  });

  userSocket.on('disconnect', (reason) => {
    console.log('🔐 User channel disconnected:', reason);
  });

  userSocket.on('connect_error', (error) => {
    console.error('Socket.IO User Error:', error);
  });
}

export function disconnectUserSocket() {
  if (userSocket) {
    userSocket.disconnect();
    userSocket = null;
  }
  _onOrderFilled = null;
  _onPnlUpdate = null;
  _onBroadcast = null;
}

// ── Auth helpers ──
export function isLoggedIn() {
  return !!getToken();
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('tradex_user')); } catch { return null; }
}
