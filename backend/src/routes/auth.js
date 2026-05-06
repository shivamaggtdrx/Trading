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
    await supabasePublic.auth.signOut();
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
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

module.exports = router;
