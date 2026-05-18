require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
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
app.set('trust proxy', 1); // Trust first proxy (Render, Cloudflare, etc.) for rate limiting
const server = createServer(app);
const PORT = process.env.PORT || 4000;

// ── Sentry Initialization ──
const IS_PROD = process.env.NODE_ENV === 'production';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  // 1.0 in dev captures everything; 0.1 in production is sufficient (10% sampling)
  tracesSampleRate: IS_PROD ? 0.1 : 1.0,
  profilesSampleRate: IS_PROD ? 0.05 : 1.0,
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

// ── Compression (gzip) — must be before routes ──
// Compresses all responses > 1KB. Saves ~70% on JSON payloads.
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses > 1KB
}));

// ── Body Parsing & Logging ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(IS_PROD ? 'combined' : 'dev'));

const { getBrokerAvailability } = require('./ws/angelOneFeed');

// ── Health Check (minimal for cron-job.org) ──
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ── Ready Check (degraded state detection) ──
app.get('/ready', (req, res) => {
  const hasAngelCreds = process.env.ANGEL_ONE_CLIENT_CODE && process.env.ANGEL_ONE_PASSWORD && process.env.ANGEL_ONE_TOTP_SECRET;
  
  if (hasAngelCreds) {
    const isAvailable = getBrokerAvailability();
    if (isAvailable) {
      res.status(200).json({ status: 'ready', broker: 'available' });
    } else {
      res.status(503).json({ status: 'degraded', broker: 'unavailable', error: 'Angel One Broker connection is offline or authenticating' });
    }
  } else {
    // If no credentials are configured, we run in Yahoo Finance polling mode, which is always available
    res.status(200).json({ status: 'ready', broker: 'local_mock' });
  }
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
