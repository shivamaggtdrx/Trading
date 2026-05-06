// Mock data for the trading platform
// This will be replaced with real API data in the future

export const mockUser = {
  id: 'USR-82491',
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@email.com',
  phone: '+91 98765 43210',
  clientId: 'TDX-82491',
  referralCode: 'RAJESH50',
  avatar: null,
  kycStatus: 'verified',
  joinedDate: '2024-03-15',
};

export const mockWallet = {
  balance: 125430.50,
  equity: 143250.75,
  usedMargin: 17820.25,
  availableMargin: 107610.25,
  todayPnl: 2340.00,
  todayPnlPercent: 1.86,
  totalPnl: 18450.50,
  totalPnlPercent: 14.8,
};

// Helper to generate sparkline data points (simple deterministic pseudo-random)
function generateSparkline(base, volatility, trend = 0, points = 20) {
  const data = [];
  let price = base;
  for (let i = 0; i < points; i++) {
    const noise = Math.sin(i * 1.7 + base * 0.01) * volatility;
    price = price + noise + trend;
    data.push(Math.round(price * 100) / 100);
  }
  return data;
}

export const mockStocks = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2456.30, change: 32.50, changePercent: 1.34, high: 2480.00, low: 2410.00, volume: '12.5M', sparkline: generateSparkline(2420, 8, 1.5), isFavorite: true },
  { symbol: 'TCS', name: 'Tata Consultancy', price: 3892.15, change: -18.40, changePercent: -0.47, high: 3920.00, low: 3875.00, volume: '5.2M', sparkline: generateSparkline(3910, 6, -1), isFavorite: false },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1678.90, change: 15.20, changePercent: 0.91, high: 1690.00, low: 1655.00, volume: '8.1M', sparkline: generateSparkline(1660, 5, 0.8), isFavorite: true },
  { symbol: 'INFY', name: 'Infosys', price: 1542.60, change: -8.30, changePercent: -0.54, high: 1558.00, low: 1535.00, volume: '7.8M', sparkline: generateSparkline(1550, 4, -0.5), isFavorite: false },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1123.45, change: 22.80, changePercent: 2.07, high: 1130.00, low: 1095.00, volume: '9.3M', sparkline: generateSparkline(1100, 5, 1.2), isFavorite: false },
  { symbol: 'WIPRO', name: 'Wipro Ltd', price: 487.20, change: 5.60, changePercent: 1.16, high: 492.00, low: 480.00, volume: '6.4M', sparkline: generateSparkline(481, 2, 0.3), isFavorite: false },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 7234.50, change: -45.20, changePercent: -0.62, high: 7310.00, low: 7200.00, volume: '2.1M', sparkline: generateSparkline(7280, 15, -2), isFavorite: false },
  { symbol: 'SBIN', name: 'State Bank of India', price: 634.80, change: 12.40, changePercent: 1.99, high: 640.00, low: 620.00, volume: '15.2M', sparkline: generateSparkline(622, 3, 0.6), isFavorite: true },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 945.30, change: -3.10, changePercent: -0.33, high: 955.00, low: 938.00, volume: '11.7M', sparkline: generateSparkline(948, 3, -0.2), isFavorite: false },
  { symbol: 'NIFTY50', name: 'NIFTY 50 Index', price: 22456.80, change: 142.30, changePercent: 0.64, high: 22510.00, low: 22280.00, volume: '245M', sparkline: generateSparkline(22300, 40, 8), isFavorite: true },
];

export const mockForex = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar', price: 1.0876, change: 0.0023, changePercent: 0.21, high: 1.0892, low: 1.0845, volume: '1.2B', sparkline: generateSparkline(1.085, 0.001, 0.0001), isFavorite: true },
  { symbol: 'GBPUSD', name: 'British Pound / USD', price: 1.2654, change: -0.0018, changePercent: -0.14, high: 1.2680, low: 1.2630, volume: '890M', sparkline: generateSparkline(1.267, 0.001, -0.0001), isFavorite: false },
  { symbol: 'USDJPY', name: 'US Dollar / Yen', price: 154.32, change: 0.45, changePercent: 0.29, high: 154.80, low: 153.90, volume: '950M', sparkline: generateSparkline(153.8, 0.15, 0.02), isFavorite: false },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', price: 0.8934, change: -0.0012, changePercent: -0.13, high: 0.8950, low: 0.8920, volume: '450M', sparkline: generateSparkline(0.8945, 0.0008, -0.0001), isFavorite: false },
  { symbol: 'AUDUSD', name: 'Australian Dollar / USD', price: 0.6543, change: 0.0035, changePercent: 0.54, high: 0.6560, low: 0.6510, volume: '520M', sparkline: generateSparkline(0.651, 0.0008, 0.0002), isFavorite: false },
  { symbol: 'USDINR', name: 'US Dollar / Indian Rupee', price: 83.42, change: -0.15, changePercent: -0.18, high: 83.60, low: 83.30, volume: '380M', sparkline: generateSparkline(83.55, 0.05, -0.01), isFavorite: true },
];

export const mockMetals = [
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', price: 2342.50, change: 18.30, changePercent: 0.79, high: 2355.00, low: 2320.00, volume: '180K', sparkline: generateSparkline(2325, 5, 0.9), isFavorite: true },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', price: 27.84, change: -0.32, changePercent: -1.14, high: 28.20, low: 27.60, volume: '95K', sparkline: generateSparkline(28.1, 0.12, -0.02), isFavorite: false },
  { symbol: 'XPTUSD', name: 'Platinum / US Dollar', price: 978.40, change: 12.60, changePercent: 1.30, high: 985.00, low: 962.00, volume: '42K', sparkline: generateSparkline(966, 4, 0.6), isFavorite: false },
  { symbol: 'COPPER', name: 'Copper', price: 4.32, change: 0.08, changePercent: 1.89, high: 4.35, low: 4.22, volume: '65K', sparkline: generateSparkline(4.24, 0.02, 0.004), isFavorite: false },
];

export const mockPositions = [
  { id: 1, symbol: 'RELIANCE', type: 'BUY', quantity: 50, entryPrice: 2420.00, currentPrice: 2456.30, pnl: 1815.00, pnlPercent: 1.50, margin: 12100.00, timestamp: '2024-03-28 10:30:00' },
  { id: 2, symbol: 'XAUUSD', type: 'BUY', quantity: 2, entryPrice: 2310.00, currentPrice: 2342.50, pnl: 65.00, pnlPercent: 1.41, margin: 4620.00, timestamp: '2024-03-28 11:15:00' },
  { id: 3, symbol: 'EURUSD', type: 'SELL', quantity: 10000, entryPrice: 1.0920, currentPrice: 1.0876, pnl: 44.00, pnlPercent: 0.40, margin: 1092.00, timestamp: '2024-03-27 14:20:00' },
  { id: 4, symbol: 'TCS', type: 'BUY', quantity: 25, entryPrice: 3950.00, currentPrice: 3892.15, pnl: -1446.25, pnlPercent: -1.47, margin: 9875.00, timestamp: '2024-03-26 09:45:00' },
  { id: 5, symbol: 'SBIN', type: 'BUY', quantity: 100, entryPrice: 618.50, currentPrice: 634.80, pnl: 1630.00, pnlPercent: 2.63, margin: 6185.00, timestamp: '2024-03-25 11:00:00' },
];

export const mockOrders = [
  // Open / Pending orders
  { id: 'ORD-2001', symbol: 'RELIANCE', side: 'BUY', type: 'LIMIT', quantity: 20, price: 2400.00, status: 'pending', createdAt: '2024-03-28 14:10:00' },
  { id: 'ORD-2002', symbol: 'NIFTY50', side: 'BUY', type: 'STOP LOSS', quantity: 3, price: 22200.00, status: 'pending', createdAt: '2024-03-28 13:45:00' },
  { id: 'ORD-2003', symbol: 'XAUUSD', side: 'SELL', type: 'LIMIT', quantity: 1, price: 2370.00, status: 'pending', createdAt: '2024-03-28 11:30:00' },
  // Filled orders
  { id: 'ORD-1901', symbol: 'RELIANCE', side: 'BUY', type: 'MARKET', quantity: 50, price: 2420.00, status: 'filled', createdAt: '2024-03-28 10:30:00', filledAt: '2024-03-28 10:30:02' },
  { id: 'ORD-1902', symbol: 'XAUUSD', side: 'BUY', type: 'MARKET', quantity: 2, price: 2310.00, status: 'filled', createdAt: '2024-03-28 11:15:00', filledAt: '2024-03-28 11:15:01' },
  { id: 'ORD-1903', symbol: 'EURUSD', side: 'SELL', type: 'MARKET', quantity: 10000, price: 1.0920, status: 'filled', createdAt: '2024-03-27 14:20:00', filledAt: '2024-03-27 14:20:03' },
  { id: 'ORD-1904', symbol: 'TCS', side: 'BUY', type: 'LIMIT', quantity: 25, price: 3950.00, status: 'filled', createdAt: '2024-03-26 09:45:00', filledAt: '2024-03-26 10:02:14' },
  { id: 'ORD-1905', symbol: 'SBIN', side: 'BUY', type: 'MARKET', quantity: 100, price: 618.50, status: 'filled', createdAt: '2024-03-25 11:00:00', filledAt: '2024-03-25 11:00:01' },
  { id: 'ORD-1906', symbol: 'HDFCBANK', side: 'BUY', type: 'MARKET', quantity: 30, price: 1640.00, status: 'filled', createdAt: '2024-03-20 09:30:00', filledAt: '2024-03-20 09:30:02' },
  // Cancelled orders
  { id: 'ORD-1801', symbol: 'INFY', side: 'BUY', type: 'LIMIT', quantity: 50, price: 1500.00, status: 'cancelled', createdAt: '2024-03-27 10:00:00', cancelledAt: '2024-03-27 15:30:00' },
  { id: 'ORD-1802', symbol: 'WIPRO', side: 'SELL', type: 'STOP LOSS', quantity: 200, price: 470.00, status: 'cancelled', createdAt: '2024-03-25 09:15:00', cancelledAt: '2024-03-25 15:30:00' },
];

export const mockTradeHistory = [
  { id: 101, symbol: 'HDFCBANK', type: 'BUY', quantity: 30, entryPrice: 1640.00, exitPrice: 1678.90, pnl: 1167.00, status: 'closed', openDate: '2024-03-20', closeDate: '2024-03-28' },
  { id: 102, symbol: 'INFY', type: 'SELL', quantity: 40, entryPrice: 1580.00, exitPrice: 1542.60, pnl: 1496.00, status: 'closed', openDate: '2024-03-18', closeDate: '2024-03-27' },
  { id: 103, symbol: 'XAGUSD', type: 'BUY', quantity: 5, entryPrice: 26.50, exitPrice: 27.20, pnl: 3.50, status: 'closed', openDate: '2024-03-15', closeDate: '2024-03-25' },
  { id: 104, symbol: 'WIPRO', type: 'BUY', quantity: 100, entryPrice: 475.00, exitPrice: 487.20, pnl: 1220.00, status: 'closed', openDate: '2024-03-12', closeDate: '2024-03-22' },
  { id: 105, symbol: 'GBPUSD', type: 'SELL', quantity: 5000, entryPrice: 1.2700, exitPrice: 1.2654, pnl: 23.00, status: 'closed', openDate: '2024-03-10', closeDate: '2024-03-20' },
  { id: 106, symbol: 'ICICIBANK', type: 'BUY', quantity: 50, entryPrice: 1080.00, exitPrice: 1123.45, pnl: 2172.50, status: 'closed', openDate: '2024-03-08', closeDate: '2024-03-18' },
  { id: 107, symbol: 'TATAMOTORS', type: 'SELL', quantity: 60, entryPrice: 960.00, exitPrice: 945.30, pnl: 882.00, status: 'closed', openDate: '2024-03-05', closeDate: '2024-03-15' },
  { id: 108, symbol: 'NIFTY50', type: 'BUY', quantity: 5, entryPrice: 22100.00, exitPrice: 22456.80, pnl: 1784.00, status: 'closed', openDate: '2024-03-01', closeDate: '2024-03-12' },
  { id: 109, symbol: 'BAJFINANCE', type: 'BUY', quantity: 10, entryPrice: 7100.00, exitPrice: 6980.00, pnl: -1200.00, status: 'closed', openDate: '2024-02-25', closeDate: '2024-03-10' },
  { id: 110, symbol: 'RELIANCE', type: 'BUY', quantity: 30, entryPrice: 2380.00, exitPrice: 2420.00, pnl: 1200.00, status: 'closed', openDate: '2024-02-20', closeDate: '2024-03-05' },
];

export const mockNotifications = [
  { id: 1, type: 'trade', message: 'RELIANCE buy order executed at ₹2,420.00', time: '2 hours ago', read: false },
  { id: 2, type: 'alert', message: 'NIFTY50 crossed 22,400 level', time: '4 hours ago', read: false },
  { id: 3, type: 'system', message: 'KYC verification completed successfully', time: '1 day ago', read: true },
  { id: 4, type: 'trade', message: 'HDFCBANK position closed with ₹1,167 profit', time: '2 days ago', read: true },
];
