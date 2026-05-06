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

module.exports = router;
