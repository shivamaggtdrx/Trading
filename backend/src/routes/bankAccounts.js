const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

/**
 * GET /api/bank-accounts
 * Retrieve user's bank accounts
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_bank_accounts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ bankAccounts: data || [] });
  } catch (err) {
    console.error('Fetch bank accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
});

/**
 * POST /api/bank-accounts
 * Create a new bank account
 */
router.post('/', async (req, res) => {
  try {
    const { bank_name, account_holder_name, account_number, ifsc_code } = req.body;

    if (!bank_name || !account_holder_name || !account_number || !ifsc_code) {
      return res.status(400).json({ error: 'All bank details are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('user_bank_accounts')
      .insert({
        user_id: req.user.id,
        bank_name,
        account_holder_name,
        account_number,
        ifsc_code,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: 'Bank account added successfully', bankAccount: data });
  } catch (err) {
    console.error('Create bank account error:', err);
    res.status(500).json({ error: 'Failed to add bank account' });
  }
});

/**
 * DELETE /api/bank-accounts/:id
 * Delete a user's bank account
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('user_bank_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      // If no row matches, single() may return an error code or PGRST116 (JSON object requested, multiple or no rows returned)
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Bank account not found or unauthorized' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Bank account deleted successfully' });
  } catch (err) {
    console.error('Delete bank account error:', err);
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

module.exports = router;
