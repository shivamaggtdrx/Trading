const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

/**
 * GET /api/wallet
 * Get user wallet with recent transactions
 */
router.get('/', async (req, res) => {
  try {
    const { data: wallet, error } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const { data: transactions } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({ wallet, transactions: transactions || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

/**
 * GET /api/wallet/transactions
 * Get paginated transaction history
 */
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const type = req.query.type; // optional filter

    let query = supabaseAdmin
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('type', type);

    const { data, count, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    res.json({
      transactions: data || [],
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
