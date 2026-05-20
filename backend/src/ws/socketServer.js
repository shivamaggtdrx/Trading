const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('../redis/client');
const { supabaseAdmin } = require('../config/supabase');

let io;

function initSocketServer(httpServer) {
  // Initialize Socket.IO with strict connection settings
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        process.env.ADMIN_URL || 'http://localhost:5174',
        'http://localhost:3000',
        'https://stockslab-app.onrender.com',
        'https://stockslab.onrender.com',
        'https://stockslab-admin.onrender.com',
      ].filter(Boolean),
      credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 5000 // Drop inactive connections quickly to prevent memory leaks
  });

  // Attach Redis adapter for horizontal scaling across multiple instances
  try {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Socket.IO Server initialized with Redis Adapter');
  } catch (err) {
    console.warn('⚠️ Redis adapter failed — Socket.IO running in single-instance mode:', err.message);
  }

  // ── MARKET NAMESPACE ──
  // Dedicated to public, stateless price ticks (no authentication needed here)
  const marketNamespace = io.of('/market');
  marketNamespace.on('connection', (socket) => {
    
    // Client requests to join specific instrument rooms
    socket.on('MARKET:SUBSCRIBE_TICKERS', (symbols) => {
      if (Array.isArray(symbols)) {
        symbols.forEach(symbol => {
          socket.join(`feed:${symbol}`);
        });
      }
    });

    // Client requests to leave rooms (e.g. removed from watchlist)
    socket.on('MARKET:UNSUBSCRIBE_TICKERS', (symbols) => {
      if (Array.isArray(symbols)) {
        symbols.forEach(symbol => {
          socket.leave(`feed:${symbol}`);
        });
      }
    });

    socket.on('disconnect', () => {
      // Socket.IO automatically removes the socket from all rooms on disconnect
    });
  });

  // ── USER NAMESPACE ──
  // Dedicated to private user data (PNL, orders, margin). Requires Auth.
  const userNamespace = io.of('/user');
  
  userNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error: Missing token'));

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) return next(new Error('Authentication error: Invalid token'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Server error'));
    }
  });

  userNamespace.on('connection', (socket) => {
    // Automatically join the authenticated user to their private room
    if (socket.user && socket.user.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Legacy handler: Validate room ownership by ignoring the requested userId
    // and enforcing the authenticated user's id
    socket.on('USER:JOIN_PRIVATE', (userId) => {
      if (socket.user && socket.user.id) {
        socket.join(`user:${socket.user.id}`);
      }
    });
  });

  // ── ADMIN NAMESPACE ──
  // Dedicated to admin panels (real-time ticks and order flow)
  const adminNamespace = io.of('/admin');
  const jwt = require('jsonwebtoken');

  adminNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error: Missing token'));

      // Admins are authenticated via custom JWT, not Supabase auth tokens
      const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);
      if (!decoded || !decoded.id) return next(new Error('Authentication error: Invalid token'));

      socket.admin = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Server error'));
    }
  });

  adminNamespace.on('connection', (socket) => {
    // Admin client requests to join specific instrument rooms for LiveMarket/DealingDesk
    socket.on('ADMIN:SUBSCRIBE_TICKERS', (symbols) => {
      if (Array.isArray(symbols)) {
        symbols.forEach(symbol => {
          socket.join(`admin:feed:${symbol}`);
        });
      }
    });

    socket.on('ADMIN:UNSUBSCRIBE_TICKERS', (symbols) => {
      if (Array.isArray(symbols)) {
        symbols.forEach(symbol => {
          socket.leave(`admin:feed:${symbol}`);
        });
      }
    });
  });

  return io;
}

/**
 * Get the initialized IO instance to emit events from anywhere in the app
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
}

module.exports = {
  initSocketServer,
  getIO
};
