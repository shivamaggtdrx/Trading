const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

/**
 * POST /api/withdrawals
 * Create a withdrawal request with friction engine
 */
router.post('/', async (req, res) => {
  try {
    const { amount, method, bank_name, account_number, ifsc_code, upi_id } = req.body;
    const userId = req.user.id;

    if (!amount || !method) {
      return res.status(400).json({ error: 'Amount and method are required' });
    }

    // Get wallet
    const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', userId).single();
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    // Check withdrawable balance (balance - used_margin - bonus_locked)
    const withdrawable = wallet.balance - wallet.used_margin - (wallet.bonus_locked ? wallet.bonus_balance : 0);
    if (amount > withdrawable) {
      return res.status(400).json({ error: 'Insufficient withdrawable balance', withdrawable });
    }

    // Check open positions
    const { count: openPositions } = await supabaseAdmin
      .from('positions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'open');

    // ── Withdrawal Friction Engine ──
    // Get system settings for delays
    const { data: holdHoursSetting } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'withdrawal_min_hold_hours').single();
    const { data: firstWdSetting } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'first_withdrawal_hold_hours').single();
    const { data: autoApproveLimit } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'withdrawal_auto_approve_limit').single();

    const minHoldHours = holdHoursSetting ? parseInt(holdHoursSetting.value) : 24;
    const firstWdHours = firstWdSetting ? parseInt(firstWdSetting.value) : 72;
    const autoLimit = autoApproveLimit ? parseInt(autoApproveLimit.value) : 10000;

    // Check if first withdrawal
    const { count: prevWithdrawals } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    const isFirstWithdrawal = prevWithdrawals === 0;
    const holdHours = isFirstWithdrawal ? firstWdHours : minHoldHours;
    const holdUntil = new Date(Date.now() + holdHours * 60 * 60 * 1000);

    let holdReason = `Standard ${holdHours}-hour processing period`;
    if (isFirstWithdrawal) holdReason = 'First withdrawal — enhanced verification required';
    if (amount > 100000) holdReason = 'Large withdrawal — manual review required';

    // Determine initial status
    let status = 'pending';
    let flagReason = null;
    if (amount > 500000) {
      status = 'flagged';
      flagReason = 'Large withdrawal exceeding ₹5L threshold';
    }

    const { data, error } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        user_id: userId,
        amount,
        method,
        bank_name, account_number, ifsc_code, upi_id,
        status,
        flag_reason: flagReason,
        hold_until: holdUntil.toISOString(),
        hold_reason: holdReason,
        balance_at_request: wallet.balance,
        open_positions_count: openPositions || 0,
        ip_address: req.ip,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Withdrawal request submitted', withdrawal: data });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ error: 'Failed to submit withdrawal request' });
  }
});

/**
 * GET /api/withdrawals
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ withdrawals: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

module.exports = router;
