const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { supabaseAdmin } = require('../config/supabase');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window`
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
});

/**
 * POST /api/admin/auth/login
 * Admin panel login
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get admin user
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // IP Whitelist check
    try {
      const { data: whitelist } = await supabaseAdmin.from('ip_whitelist').select('ip_address').eq('status', 'active');
      if (whitelist && whitelist.length > 0) {
        const allowedIps = whitelist.map(w => w.ip_address);
        // Also allow standard local IPs for dev testing
        const isLocal = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1';
        if (!allowedIps.includes(req.ip) && !isLocal) {
          console.warn(`Blocked admin login from non-whitelisted IP: ${req.ip}`);
          return res.status(403).json({ error: 'Access denied: IP not whitelisted' });
        }
      }
    } catch (ipErr) {
      // If table doesn't exist yet, just continue safely
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, department: admin.department },
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Update last login
    await supabaseAdmin
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id);

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      admin_id: admin.id,
      action: 'admin_login',
      target_type: 'admin',
      target_id: admin.id,
      description: `Admin ${admin.name} logged in`,
      ip_address: req.ip,
    });

    res.json({
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department,
        avatar: admin.avatar,
      },
      token,
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
