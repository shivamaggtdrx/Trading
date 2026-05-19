const router = require('express').Router();
const { supabaseAdmin, supabasePublic } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

/**
 * POST /api/auth/signup
 * Register a new trader user via Supabase Auth
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, phone, referral_code } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full_name are required' });
    }

    // 1. Create auth user in Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // 2. Look up referrer if referral code provided
    let referredBy = null;
    if (referral_code) {
      const { data: referrer } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('referral_code', referral_code.toUpperCase())
        .single();
      if (referrer) referredBy = referrer.id;
    }

    // 3. Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        email,
        phone: phone || null,
        referred_by: referredBy,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create profile: ' + profileError.message });
    }

    // 4. Sign in to get session
    const { data: session, error: signInError } = await supabasePublic.auth.signInWithPassword({
      email, password,
    });

    if (signInError) {
      return res.status(500).json({ error: 'Account created but login failed' });
    }

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: profile.id,
        client_id: profile.client_id,
        email: profile.email,
        full_name: profile.full_name,
        referral_code: profile.referral_code,
      },
      session: {
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
        expires_at: session.session.expires_at,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login trader user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.status !== 'active') {
      return res.status(403).json({ error: `Account is ${profile.status}. Contact support.` });
    }

    // Update last login
    await supabaseAdmin
      .from('profiles')
      .update({ last_login_at: new Date().toISOString(), login_count: (profile.login_count || 0) + 1 })
      .eq('id', profile.id);

    res.json({
      user: {
        id: profile.id,
        client_id: profile.client_id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone,
        tier: profile.tier,
        kyc_status: profile.kyc_status,
        referral_code: profile.referral_code,
        trading_enabled: profile.trading_enabled,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    // Sign out the specific user (not the server's shared session)
    await supabaseAdmin.auth.admin.signOut(req.user.id);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    // Still return success — client should clear local tokens regardless
    res.json({ message: 'Logged out' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh session using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabasePublic.auth.refreshSession({ refresh_token });

    if (error || !data.session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Refresh failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile + wallet
 */
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    res.json({
      user: req.user.profile,
      wallet: wallet || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * POST /api/auth/change-password
 * Change current user's password (requires current password verification)
 */
router.post('/change-password', authenticateUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Verify current password by attempting sign-in
    const { error: verifyError } = await supabasePublic.auth.signInWithPassword({
      email: req.user.profile.email,
      password: currentPassword,
    });

    if (verifyError) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password via admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      password: newPassword,
    });

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update password: ' + updateError.message });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * GET /api/auth/referrals
 * Get current user's referral data (people they referred)
 */
router.get('/referrals', authenticateUser, async (req, res) => {
  try {
    // Get users who were referred by the current user
    const { data: referrals, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, status, created_at')
      .eq('referred_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Enrich with trade count for each referral
    const enrichedReferrals = await Promise.all(
      (referrals || []).map(async (ref) => {
        const { count: tradeCount } = await supabaseAdmin
          .from('trades')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', ref.id);
          
        const trades = tradeCount || 0;
        // Basic commission logic: ₹10 per trade for example
        const earned = trades * 10;

        return {
          id: ref.id,
          name: ref.full_name || 'Unknown',
          status: ref.status || 'active',
          joined: new Date(ref.created_at).toISOString().split('T')[0],
          trades: trades,
          earned: earned,
        };
      })
    );

    res.json({ referrals: enrichedReferrals });
  } catch (err) {
    console.error('Referrals fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

/**
 * GET /api/auth/notifications
 * Get notifications for the current user (system broadcasts)
 */
router.get('/notifications', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_notifications')
      .select('id, title, message, type, created_at, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const notifications = (data || []).map(n => ({
      id: n.id,
      type: n.type === 'alert' ? 'alert' : n.type === 'trade' ? 'trade' : n.type === 'broadcast' ? 'broadcast' : 'system',
      message: n.message || n.title,
      title: n.title,
      time: formatTimeAgo(n.created_at),
      read: false, // Could be enhanced with a read-status table per user
    }));

    res.json({ notifications });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Helper for relative time
function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const { getAuthUrl, exchangeCodeForToken } = require('../services/upstoxAuth');
const { upstoxStream } = require('../services/upstoxStream');

/**
 * GET /api/auth/upstox
 * Redirects admin/system initiator to Upstox login
 */
router.get('/upstox', (req, res) => {
  try {
    const url = getAuthUrl();
    res.redirect(url);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/upstox/callback
 * Upstox OAuth callback endpoint
 */
router.get('/upstox/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is missing' });
  }

  try {
    const token = await exchangeCodeForToken(code);
    
    // Start stream immediately in the background
    upstoxStream.start();
    
    res.send(`
      <html>
        <head>
          <title>Upstox Authenticated</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background-color: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 40px; text-align: center; max-width: 400px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
            h1 { color: #58a6ff; margin-top: 0; }
            p { margin-bottom: 24px; line-height: 1.5; }
            .btn { background-color: #238636; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; transition: background-color 0.2s; }
            .btn:hover { background-color: #2ea043; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Success!</h1>
            <p>Upstox connection has been authorized and the live market data stream has been successfully started.</p>
            <a class="btn" href="javascript:window.close()">Close Window</a>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`
      <html>
        <head>
          <title>Authentication Failed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background-color: #161b22; border: 1px solid #f85149; border-radius: 12px; padding: 40px; text-align: center; max-width: 400px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
            h1 { color: #f85149; margin-top: 0; }
            p { margin-bottom: 24px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Failed!</h1>
            <p>Upstox authentication failed: ${err.message}</p>
          </div>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/auth/system/debug
 * Exposes live diagnostics for connection monitoring
 */
router.get('/system/debug', async (req, res) => {
  try {
    const { redisClient } = require('../redis/client');
    const token = await getAccessToken();
    const hasToken = !!token;
    
    // Check Redis connection status
    let redisStatus = 'OFFLINE';
    if (redisClient) {
      redisStatus = redisClient.status || (redisClient.connected ? 'CONNECTED' : 'UNKNOWN');
    }

    res.json({
      timestamp: Date.now(),
      status: 'success',
      diagnostics: {
        upstox: {
          connectionStatus: upstoxStream.status,
          hasAccessToken: hasToken,
          credentialsConfigured: !!(process.env.UPSTOX_CLIENT_ID && process.env.UPSTOX_CLIENT_SECRET),
          statistics: {
            ticksReceived: upstoxStream.stats.ticksReceived,
            activeSubscriptions: upstoxStream.stats.activeSubscriptions,
            lastTickTime: upstoxStream.stats.lastTickTime ? new Date(upstoxStream.stats.lastTickTime).toISOString() : null,
            errorsCount: upstoxStream.stats.errorsEncountered,
            lastError: upstoxStream.stats.lastError || null,
            connectionEstablishedAt: upstoxStream.stats.connectionEstablishedAt ? new Date(upstoxStream.stats.connectionEstablishedAt).toISOString() : null
          }
        },
        redis: {
          status: redisStatus
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development'
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;

