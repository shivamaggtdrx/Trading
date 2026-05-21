const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticateUser);

/**
 * GET /api/users/profile
 */
router.get('/profile', async (req, res) => {
  res.json({ profile: req.user.profile });
});

/**
 * PUT /api/users/profile
 * Update user profile (limited fields)
 */
router.put('/profile', async (req, res) => {
  try {
    const allowedFields = ['full_name', 'phone', 'date_of_birth', 'gender', 'address_line1', 'address_city', 'address_state', 'address_pincode'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ profile: data });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

/**
 * GET /api/users/watchlist
 * Retrieve user watchlists
 */
router.get('/watchlist', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_watchlists')
      .select('data')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    res.json({ watchlist: data ? data.data : { active: 'MW-1', lists: { 'MW-1': [], 'MW-2': [], 'MW-3': [], 'MW-4': [], 'MW-5': [] } } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

/**
 * PUT /api/users/watchlist
 * Update user watchlists
 */
router.put('/watchlist', async (req, res) => {
  try {
    const { watchlist } = req.body;
    if (!watchlist) return res.status(400).json({ error: 'Watchlist data is required' });

    const { data, error } = await supabaseAdmin
      .from('user_watchlists')
      .upsert({ user_id: req.user.id, data: watchlist, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ watchlist: data.data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

module.exports = router;
