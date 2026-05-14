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
    await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    // Supabase approach: use the supabase client directly if available
    // For now, if refresh fails, we force re-login
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
};

// ══════════════════════════════════════════════════════════════
// WebSocket Price Feed
// ══════════════════════════════════════════════════════════════
let ws = null;
let reconnectTimer = null;

export function connectPriceFeed(onPriceUpdate, symbols = []) {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(WS_BASE);

  ws.onopen = () => {
    console.log('📡 Price feed connected');
    if (symbols.length > 0) {
      ws.send(JSON.stringify({ type: 'subscribe', symbols }));
    }
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'price_update' && onPriceUpdate) {
        onPriceUpdate(msg.data);
      }
    } catch (e) {
      console.warn('WS parse error', e);
    }
  };

  ws.onclose = () => {
    console.log('📡 Price feed disconnected, reconnecting in 3s...');
    reconnectTimer = setTimeout(() => connectPriceFeed(onPriceUpdate, symbols), 3000);
  };

  ws.onerror = () => ws.close();
}

export function disconnectPriceFeed() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) ws.close();
  ws = null;
}

// ── Auth helpers ──
export function isLoggedIn() {
  return !!getToken();
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('tradex_user')); } catch { return null; }
}
