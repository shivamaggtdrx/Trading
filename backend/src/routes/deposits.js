const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

/**
 * POST /api/deposits
 * Create a deposit request
 */
router.post('/', async (req, res) => {
  try {
    const { amount, method, utr_number, bank_reference } = req.body;

    if (!amount || !method) {
      return res.status(400).json({ error: 'Amount and method are required' });
    }

    if (amount < 100) return res.status(400).json({ error: 'Minimum deposit is ₹100' });

    const { data, error } = await supabaseAdmin
      .from('deposit_requests')
      .insert({
        user_id: req.user.id,
        amount,
        method,
        utr_number: utr_number || null,
        bank_reference: bank_reference || null,
        ip_address: req.ip,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Deposit request submitted', deposit: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit deposit request' });
  }
});

/**
 * GET /api/deposits
 * Get user's deposit history
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('deposit_requests')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ deposits: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

module.exports = router;
