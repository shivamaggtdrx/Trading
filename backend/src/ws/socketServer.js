const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('../redis/client');

let io;

function initSocketServer(httpServer) {
  // Initialize Socket.IO with strict connection settings
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        process.env.ADMIN_URL || 'http://localhost:5174',
        'http://localhost:3000'
      ],
      credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 5000 // Drop inactive connections quickly to prevent memory leaks
  });

  // Attach Redis adapter for horizontal scaling across multiple instances
  io.adapter(createAdapter(pubClient, subClient));

  console.log('✅ Socket.IO Server initialized with Redis Adapter');

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
  
  // Future: Add middleware here to authenticate the socket connection
  // userNamespace.use((socket, next) => { ... });

  userNamespace.on('connection', (socket) => {
    // When a user connects and authenticates, they join their private room
    socket.on('USER:JOIN_PRIVATE', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });
  });

  // ── DEALER NAMESPACE ──
  const dealerNamespace = io.of('/dealer');
  dealerNamespace.on('connection', (socket) => {
    // Future Phase 3 implementation
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
