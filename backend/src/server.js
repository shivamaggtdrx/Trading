require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');

const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

// Import routes
const authRoutes = require('./routes/auth');
const adminAuthRoutes = require('./routes/adminAuth');
const userRoutes = require('./routes/users');
const walletRoutes = require('./routes/wallet');
const instrumentRoutes = require('./routes/instruments');
const orderRoutes = require('./routes/orders');
const positionRoutes = require('./routes/positions');
const depositRoutes = require('./routes/deposits');
const withdrawalRoutes = require('./routes/withdrawals');
const adminRoutes = require('./routes/admin');

// ── Import WebSocket ──
// Old raw ws implementation (Deprecated in Phase 1):
// const { initWebSocket } = require('./ws/priceEngine'); 
// New Socket.IO implementation:
const { initSocketServer } = require('./ws/socketServer');
const { initPriceEngine } = require('./ws/priceEngine');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;

// ── Sentry Initialization ──
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0, 
  profilesSampleRate: 1.0,
});

// The request handler must be the first middleware on the app
Sentry.setupExpressErrorHandler(app);

// ── Security Middleware ──
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
  ],
  credentials: true,
}));

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 500,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Body Parsing & Logging ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Health Check ──
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin', adminRoutes);

// Optional fallback route for testing Sentry
app.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('Sentry Testing Error!');
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    sentryId: res.sentry,
  });
});

// ── Start Server ──
server.listen(PORT, () => {
  console.log(`\n🚀 TradeX Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health\n`);
});

// ── Init Socket.IO Server ──
// Old raw WS call: initWebSocket(server);
initSocketServer(server);
initPriceEngine();

// ── Init BullMQ Worker & MTM Calculator ──
const { executionWorker } = require('./core/workers/executionWorker');
const { startMTMCalculator } = require('./core/pnl/mtmCalculator');
const { initOHLCAggregator } = require('./ws/feed/ohlcAggregator');
startMTMCalculator();
initOHLCAggregator();
console.log('⚡ Execution Worker online | 📊 MTM Calculator running | 📊 OHLC Aggregator active');

module.exports = { app, server };
