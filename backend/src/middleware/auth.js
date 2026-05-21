const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');
const { redisClient } = require('../redis/client');

const USER_CACHE_TTL = 60;  // 60 seconds
const ADMIN_CACHE_TTL = 60; // 60 seconds

/**
 * Middleware: Verify Supabase user JWT token
 * Uses Redis cache to avoid hitting Supabase on every request.
 */
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // ── Step 1: Verify token with Supabase (or cache) ──
    // We hash the last 16 chars of the token as a cache key to avoid storing full tokens
    const tokenKey = `auth:user:token:${token.slice(-16)}`;
    let userId = null;

    try {
      const cachedUserId = await redisClient.get(tokenKey);
      if (cachedUserId) {
        userId = cachedUserId;
      }
    } catch (e) { /* Redis down — fall through to Supabase */ }

    if (!userId) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      userId = user.id;

      // Cache token→userId mapping
      try { await redisClient.setex(tokenKey, USER_CACHE_TTL, userId); } catch (e) {}
    }

    // ── Step 2: Get profile (cached) ──
    const profileKey = `auth:user:profile:${userId}`;
    let profile = null;

    try {
      const cached = await redisClient.get(profileKey);
      if (cached) {
        profile = JSON.parse(cached);
      }
    } catch (e) { /* Redis down — fall through to Supabase */ }

    if (!profile) {
      const { data: dbProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!dbProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }
      profile = dbProfile;

      // Cache profile
      try { await redisClient.setex(profileKey, USER_CACHE_TTL, JSON.stringify(profile)); } catch (e) {}
    }

    if (profile.status !== 'active') {
      return res.status(403).json({ error: `Account is ${profile.status}` });
    }

    req.user = { id: userId, email: profile.email, profile };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware: Verify admin JWT token
 * Uses Redis cache to avoid hitting Supabase on every request.
 */
async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);

    // ── Check Redis cache first ──
    const cacheKey = `auth:admin:${decoded.id}`;
    let admin = null;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        admin = JSON.parse(cached);
      }
    } catch (e) { /* Redis down — fall through */ }

    if (!admin) {
      const { data: dbAdmin } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('id', decoded.id)
        .eq('is_active', true)
        .single();

      if (!dbAdmin) {
        return res.status(401).json({ error: 'Admin not found or inactive' });
      }
      admin = dbAdmin;

      // Cache admin profile
      try { await redisClient.setex(cacheKey, ADMIN_CACHE_TTL, JSON.stringify(admin)); } catch (e) {}
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware: Check admin role
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticateUser, authenticateAdmin, requireRole };
