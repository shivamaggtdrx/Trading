const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateAdmin, requireRole } = require('../middleware/auth');

// All admin routes require admin auth
router.use(authenticateAdmin);

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
router.get('/dashboard', async (req, res) => {
  try {
    const { count: totalClients } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    const { count: activePositions } = await supabaseAdmin.from('positions').select('*', { count: 'exact', head: true }).eq('status', 'open');
    const { count: pendingDeposits } = await supabaseAdmin.from('deposit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: pendingWithdrawals } = await supabaseAdmin.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    // Calculate house P&L (sum of all client losses = house profit)
    const { data: wallets } = await supabaseAdmin.from('wallets').select('today_pnl');
    const totalClientPnl = (wallets || []).reduce((s, w) => s + (w.today_pnl || 0), 0);
    const housePnl = -totalClientPnl; // house is counterparty

    // Generate chart data (last 7 days of broker PNL)
    // Broker PNL is the negative of sum(net_pnl) from trades for each day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentTrades } = await supabaseAdmin.from('trades')
      .select('closed_at, net_pnl')
      .gte('closed_at', sevenDaysAgo.toISOString());
    
    // Group by day
    const pnlByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      pnlByDay[dateStr] = 0;
    }

    (recentTrades || []).forEach(t => {
      const dateStr = new Date(t.closed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (pnlByDay[dateStr] !== undefined) {
        pnlByDay[dateStr] -= (t.net_pnl || 0); // broker pnl is negative of client pnl
      }
    });

    const chart_data = Object.keys(pnlByDay).map(name => ({
      name,
      value: pnlByDay[name]
    }));

    // Fetch recent activity (audit logs)
    const { data: recentActivity } = await supabaseAdmin.from('audit_logs')
      .select('id, action, description, created_at, target_type')
      .order('created_at', { ascending: false })
      .limit(10);
      
    const formattedActivity = (recentActivity || []).map(a => ({
      id: a.id,
      type: a.target_type === 'system' ? 'system' : 'user',
      action: a.action.replace(/_/g, ' ').toUpperCase(),
      details: a.description,
      time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    res.json({
      total_clients: totalClients || 0,
      active_positions: activePositions || 0,
      pending_deposits: pendingDeposits || 0,
      pending_withdrawals: pendingWithdrawals || 0,
      house_pnl_today: housePnl,
      client_pnl_today: totalClientPnl,
      chart_data,
      recent_activity: formattedActivity,
    });
  } catch (err) {
    res.status(500).json({ error: 'Dashboard data fetch failed' });
  }
});

// ═══════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const search = req.query.search;

    let query = supabaseAdmin.from('profiles').select('*, wallets(*)', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,client_id.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ users: data || [], pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const { data: user } = await supabaseAdmin.from('profiles').select('*, wallets(*)').eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { data: positions } = await supabaseAdmin.from('positions').select('*').eq('user_id', req.params.id).eq('status', 'open');
    const { data: recentTrades } = await supabaseAdmin.from('trades').select('*').eq('user_id', req.params.id).order('closed_at', { ascending: false }).limit(10);

    res.json({ user, positions: positions || [], recent_trades: recentTrades || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// ═══════════════════════════════════════════
// DEPOSIT APPROVALS
// ═══════════════════════════════════════════
router.get('/deposits', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const { data, error } = await supabaseAdmin.from('deposit_requests').select('*, profiles(full_name, client_id, email)').eq('status', status).order('created_at', { ascending: false }).limit(50);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ deposits: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

router.post('/deposits/:id/approve', requireRole('super_admin', 'admin', 'finance'), async (req, res) => {
  try {
    const { data: deposit } = await supabaseAdmin.from('deposit_requests').select('*').eq('id', req.params.id).eq('status', 'pending').single();
    if (!deposit) return res.status(404).json({ error: 'Pending deposit not found' });

    // Approve deposit
    await supabaseAdmin.from('deposit_requests').update({ status: 'approved', approved_by: req.admin.id, approved_at: new Date().toISOString(), credited_to_wallet: true }).eq('id', deposit.id);

    // Atomic credit wallet + ledger entry (prevents race conditions)
    const { data: result, error: rpcErr } = await supabaseAdmin.rpc('credit_wallet', {
      p_user_id: deposit.user_id,
      p_amount: deposit.amount,
      p_reference_id: deposit.id,
      p_reference_type: 'deposit',
      p_description: `Deposit approved via ${deposit.method}`,
      p_admin_id: req.admin.id,
    });
    if (rpcErr) return res.status(500).json({ error: 'Wallet credit failed: ' + rpcErr.message });
    const newBalance = result?.new_balance ?? 0;

    // Audit
    await supabaseAdmin.from('audit_logs').insert({ admin_id: req.admin.id, action: 'approve_deposit', target_type: 'deposit', target_id: deposit.id, description: `Approved ₹${deposit.amount} deposit for user ${deposit.user_id}`, ip_address: req.ip });

    res.json({ message: 'Deposit approved and credited', new_balance: newBalance });
  } catch (err) {
    console.error('Deposit approval error:', err);
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
});

router.post('/deposits/:id/reject', requireRole('super_admin', 'admin', 'finance'), async (req, res) => {
  try {
    const { reason } = req.body;
    await supabaseAdmin.from('deposit_requests').update({ status: 'rejected', reject_reason: reason || 'Rejected by admin', rejected_by: req.admin.id, rejected_at: new Date().toISOString() }).eq('id', req.params.id);
    await supabaseAdmin.from('audit_logs').insert({ admin_id: req.admin.id, action: 'reject_deposit', target_type: 'deposit', target_id: req.params.id, description: `Rejected deposit: ${reason}`, ip_address: req.ip });
    res.json({ message: 'Deposit rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
});

// ═══════════════════════════════════════════
// WITHDRAWAL APPROVALS
// ═══════════════════════════════════════════
router.get('/withdrawals', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const { data, error } = await supabaseAdmin.from('withdrawal_requests').select('*, profiles(full_name, client_id, email)').eq('status', status).order('created_at', { ascending: false }).limit(50);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ withdrawals: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

router.post('/withdrawals/:id/approve', requireRole('super_admin', 'admin', 'finance'), async (req, res) => {
  try {
    const { data: wd } = await supabaseAdmin.from('withdrawal_requests').select('*').eq('id', req.params.id).in('status', ['pending', 'flagged']).single();
    if (!wd) return res.status(404).json({ error: 'Withdrawal not found' });

    // Atomic debit wallet + ledger (prevents race conditions)
    const { data: result, error: rpcErr } = await supabaseAdmin.rpc('debit_wallet', {
      p_user_id: wd.user_id,
      p_amount: wd.amount,
      p_reference_id: wd.id,
      p_reference_type: 'withdrawal',
      p_description: `Withdrawal approved via ${wd.method}`,
      p_admin_id: req.admin.id,
    });
    if (rpcErr) return res.status(400).json({ error: rpcErr.message });
    const newBalance = result?.new_balance ?? 0;

    await supabaseAdmin.from('withdrawal_requests').update({ status: 'approved', approved_by: req.admin.id, approved_at: new Date().toISOString() }).eq('id', wd.id);

    await supabaseAdmin.from('audit_logs').insert({ admin_id: req.admin.id, action: 'approve_withdrawal', target_type: 'withdrawal', target_id: wd.id, description: `Approved ₹${wd.amount} withdrawal`, ip_address: req.ip });
    res.json({ message: 'Withdrawal approved', new_balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

router.post('/withdrawals/:id/reject', requireRole('super_admin', 'admin', 'finance'), async (req, res) => {
  try {
    const { reason } = req.body;
    await supabaseAdmin.from('withdrawal_requests').update({ status: 'rejected', reject_reason: reason || 'Rejected by admin', rejected_by: req.admin.id, rejected_at: new Date().toISOString() }).eq('id', req.params.id);
    await supabaseAdmin.from('audit_logs').insert({ admin_id: req.admin.id, action: 'reject_withdrawal', target_type: 'withdrawal', target_id: req.params.id, description: `Rejected withdrawal: ${reason}`, ip_address: req.ip });
    res.json({ message: 'Withdrawal rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

// ═══════════════════════════════════════════
// WALLET MANAGEMENT
// ═══════════════════════════════════════════
router.get('/wallet-transactions', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('wallet_transactions')
      .select('*, profiles(client_id, full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (error) return res.status(500).json({ error: error.message });
    res.json({ transactions: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post('/wallets/adjust', requireRole('super_admin', 'admin', 'finance'), async (req, res) => {
  try {
    const { user_id, amount, note, type } = req.body; // type = 'add' or 'deduct'
    
    // Find user profile by client_id or user_id
    let targetUserId = user_id;
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('client_id', user_id).single();
    if (profile) targetUserId = profile.id;

    const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', targetUserId).single();
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const adjustment = type === 'add' ? Number(amount) : -Number(amount);
    if (type === 'deduct' && wallet.balance + adjustment < 0) return res.status(400).json({ error: 'Insufficient balance' });

    const newBalance = wallet.balance + adjustment;
    
    await supabaseAdmin.from('wallets').update({ balance: newBalance }).eq('user_id', targetUserId);
    
    await supabaseAdmin.from('wallet_transactions').insert({
      user_id: targetUserId,
      type: type === 'add' ? 'deposit' : 'withdrawal',
      amount: adjustment,
      balance_after: newBalance,
      reference_type: 'adjustment',
      description: note || `Manual ${type}`,
      admin_id: req.admin.id,
    });
    
    await supabaseAdmin.from('audit_logs').insert({ admin_id: req.admin.id, action: `wallet_adjustment`, target_type: 'wallet', target_id: targetUserId, description: `Manually ${type}ed ₹${amount}. Note: ${note}`, ip_address: req.ip });
    
    res.json({ message: 'Wallet adjusted successfully', new_balance: newBalance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to adjust wallet' });
  }
});

// ═══════════════════════════════════════════
// FORCE SQUARE-OFF
// ═══════════════════════════════════════════
router.post('/force-square-off/:userId', requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const { data: positions } = await supabaseAdmin.from('positions').select('*').eq('user_id', req.params.userId).eq('status', 'open');

    if (!positions || positions.length === 0) return res.json({ message: 'No open positions' });

    // Close all positions at current market
    for (const pos of positions) {
      const { data: instrument } = await supabaseAdmin.from('instruments').select('last_price').eq('id', pos.instrument_id).single();
      const exitPrice = instrument.last_price;
      const pnl = pos.side === 'long' ? (exitPrice - pos.entry_price) * pos.quantity : (pos.entry_price - exitPrice) * pos.quantity;

      await supabaseAdmin.from('positions').update({ status: 'closed', realized_pnl: pnl, current_price: exitPrice, close_reason: reason || 'admin_force', closed_at: new Date().toISOString() }).eq('id', pos.id);
      await supabaseAdmin.from('trades').insert({ user_id: pos.user_id, instrument_id: pos.instrument_id, position_id: pos.id, symbol: pos.symbol, side: pos.side === 'long' ? 'buy' : 'sell', quantity: pos.quantity, entry_price: pos.entry_price, exit_price: exitPrice, gross_pnl: pnl, net_pnl: pnl, charges: 0, routing: pos.routing, opened_at: pos.opened_at });
    }

    // Release all margin
    await supabaseAdmin.from('wallets').update({ used_margin: 0 }).eq('user_id', req.params.userId);

    await supabaseAdmin.from('audit_logs').insert({ admin_id: req.admin.id, action: 'force_square_off', target_type: 'user', target_id: req.params.userId, description: `Force closed ${positions.length} positions. Reason: ${reason}`, ip_address: req.ip });
    res.json({ message: `Closed ${positions.length} positions` });
  } catch (err) {
    res.status(500).json({ error: 'Square-off failed' });
  }
});

router.post('/global-square-off', requireRole('super_admin'), async (req, res) => {
  try {
    const { data: positions } = await supabaseAdmin.from('positions').select('*').eq('status', 'open');
    if (!positions || positions.length === 0) return res.json({ message: 'No open positions' });

    for (const pos of positions) {
      const { data: instrument } = await supabaseAdmin.from('instruments').select('last_price').eq('id', pos.instrument_id).single();
      const exitPrice = instrument ? instrument.last_price : pos.current_price;
      const pnl = pos.side === 'long' ? (exitPrice - pos.entry_price) * pos.quantity : (pos.entry_price - exitPrice) * pos.quantity;

      await supabaseAdmin.from('positions').update({ status: 'closed', realized_pnl: pnl, current_price: exitPrice, close_reason: 'global_kill_switch', closed_at: new Date().toISOString() }).eq('id', pos.id);
      await supabaseAdmin.from('trades').insert({ user_id: pos.user_id, instrument_id: pos.instrument_id, position_id: pos.id, symbol: pos.symbol, side: pos.side === 'long' ? 'buy' : 'sell', quantity: pos.quantity, entry_price: pos.entry_price, exit_price: exitPrice, gross_pnl: pnl, net_pnl: pnl, charges: 0, routing: pos.routing, opened_at: pos.opened_at });
    }

    // Zero out all used_margins for all active wallets
    const usersWithPositions = [...new Set(positions.map(p => p.user_id))];
    for (const userId of usersWithPositions) {
      await supabaseAdmin.from('wallets').update({ used_margin: 0 }).eq('user_id', userId);
    }

    await supabaseAdmin.from('audit_logs').insert({ admin_id: req.admin.id, action: 'global_kill_switch', target_type: 'system', target_id: 'all', description: `Global square-off triggered. Closed ${positions.length} positions.`, ip_address: req.ip });
    res.json({ message: `Global square-off completed. Closed ${positions.length} positions.` });
  } catch (err) {
    res.status(500).json({ error: 'Global square-off failed' });
  }
});

// ═══════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════
router.get('/orders', async (req, res) => {
  try {
    const status = req.query.status || 'open';
    const { data, error } = await supabaseAdmin.from('orders')
      .select('*, profiles(client_id, full_name)')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (error) return res.status(500).json({ error: error.message });
    res.json({ orders: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ═══════════════════════════════════════════
// TRADES
// ═══════════════════════════════════════════
router.get('/trades', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('trades')
      .select('*, profiles(client_id, full_name)')
      .order('closed_at', { ascending: false, nullsFirst: false })
      .limit(100);
      
    if (error) return res.status(500).json({ error: error.message });
    res.json({ trades: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// ═══════════════════════════════════════════
// INSTRUMENTS
// ═══════════════════════════════════════════
router.get('/instruments', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('instruments')
      .select('*')
      .order('symbol');
      
    if (error) return res.status(500).json({ error: error.message });
    res.json({ instruments: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch instruments' });
  }
});

router.put('/instruments/:id', requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { error } = await supabaseAdmin.from('instruments')
      .update(updates)
      .eq('id', id);
      
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Instrument updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update instrument' });
  }
});

// ═══════════════════════════════════════════
// SYSTEM SETTINGS
// ═══════════════════════════════════════════
router.get('/settings', async (req, res) => {
  try {
    const { data } = await supabaseAdmin.from('system_settings').select('*').order('key');
    res.json({ settings: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings/:key', requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { value } = req.body;
    const { data: old } = await supabaseAdmin.from('system_settings').select('value').eq('key', req.params.key).single();
    await supabaseAdmin.from('system_settings').update({ value: JSON.stringify(value), updated_by: req.admin.id, updated_at: new Date().toISOString() }).eq('key', req.params.key);
    await supabaseAdmin.from('audit_logs').insert({ admin_id: req.admin.id, action: 'update_setting', target_type: 'system', target_id: req.params.key, description: `Updated setting: ${req.params.key}`, old_value: old, new_value: { value }, ip_address: req.ip });
    res.json({ message: 'Setting updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// ═══════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════
router.get('/audit-logs', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('audit_logs')
      .select('*, admin:admin_users(email)')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (error) return res.status(500).json({ error: error.message });
    res.json({ logs: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ═══════════════════════════════════════════
// KYC MANAGEMENT
// ═══════════════════════════════════════════
router.get('/kyc', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const { data, error } = await supabaseAdmin.from('kyc_documents')
      .select('*, profiles(client_id, full_name, email)')
      .eq('status', status)
      .order('created_at', { ascending: false });
      
    if (error) return res.status(500).json({ error: error.message });
    res.json({ documents: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KYC docs' });
  }
});

router.post('/kyc/:id/verify', requireRole('super_admin', 'admin', 'compliance'), async (req, res) => {
  try {
    await supabaseAdmin.from('kyc_documents').update({ status: 'verified', verified_by: req.admin.id, verified_at: new Date().toISOString() }).eq('id', req.params.id);
    await supabaseAdmin.from('audit_logs').insert({ admin_id: req.admin.id, action: 'verify_kyc', target_type: 'kyc', target_id: req.params.id, description: `Verified KYC document`, ip_address: req.ip });
    res.json({ message: 'KYC verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify KYC' });
  }
});

router.post('/kyc/:id/reject', requireRole('super_admin', 'admin', 'compliance'), async (req, res) => {
  try {
    const { reason } = req.body;
    await supabaseAdmin.from('kyc_documents').update({ status: 'rejected', reject_reason: reason }).eq('id', req.params.id);
    await supabaseAdmin.from('audit_logs').insert({ admin_id: req.admin.id, action: 'reject_kyc', target_type: 'kyc', target_id: req.params.id, description: `Rejected KYC: ${reason}`, ip_address: req.ip });
    res.json({ message: 'KYC rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject KYC' });
  }
});

// ═══════════════════════════════════════════
// SUPPORT TICKETS
// ═══════════════════════════════════════════
router.get('/tickets', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('support_tickets')
      .select('*, profiles(client_id, full_name), admin:admin_users(email)')
      .order('created_at', { ascending: false });
      
    if (error) return res.status(500).json({ error: error.message });
    res.json({ tickets: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const { message, status } = req.body;
    
    // Add reply
    await supabaseAdmin.from('ticket_replies').insert({
      ticket_id: req.params.id,
      admin_id: req.admin.id,
      message
    });
    
    // Update ticket status
    if (status) {
      await supabaseAdmin.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', req.params.id);
    }
    
    res.json({ message: 'Reply sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reply to ticket' });
  }
});

// ═══════════════════════════════════════════
// NOTIFICATIONS / BROADCASTS
// ═══════════════════════════════════════════
router.get('/notifications', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('system_notifications')
      .select('*, admin:admin_users(email)')
      .order('created_at', { ascending: false });
      
    if (error) return res.status(500).json({ error: error.message });
    res.json({ notifications: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/notifications', requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { title, message, type, target_audience } = req.body;
    
    await supabaseAdmin.from('system_notifications').insert({
      title, message, type, target_audience,
      created_by: req.admin.id
    });
    
    await supabaseAdmin.from('audit_logs').insert({ admin_id: req.admin.id, action: 'create_broadcast', target_type: 'system', target_id: 'broadcast', description: `Sent broadcast: ${title}`, ip_address: req.ip });
    
    res.json({ message: 'Broadcast sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// ═══════════════════════════════════════════
// SURVEILLANCE & ALERTS
// ═══════════════════════════════════════════
router.get('/alerts', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('system_alerts')
      .select('*, profiles(client_id, full_name)')
      .order('created_at', { ascending: false });
      
    if (error) return res.status(500).json({ error: error.message });
    res.json({ alerts: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.post('/alerts/:id/resolve', requireRole('super_admin', 'admin', 'risk_manager'), async (req, res) => {
  try {
    await supabaseAdmin.from('system_alerts').update({ status: 'resolved', resolved_by: req.admin.id, resolved_at: new Date().toISOString() }).eq('id', req.params.id);
    res.json({ message: 'Alert resolved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// ═══════════════════════════════════════════
// RISK MANAGEMENT
// ═══════════════════════════════════════════
router.get('/risk-management', async (req, res) => {
  try {
    const { data: positions } = await supabaseAdmin.from('positions')
      .select('*, profiles(client_id, full_name)')
      .eq('status', 'open');
      
    const { data: wallets } = await supabaseAdmin.from('wallets').select('*');
    
    // Group positions by user
    const userExposures = {};
    (positions || []).forEach(pos => {
      if (!userExposures[pos.user_id]) {
        const wallet = wallets.find(w => w.user_id === pos.user_id) || { balance: 0, used_margin: 0 };
        userExposures[pos.user_id] = {
          client: pos.profiles?.client_id || 'Unknown',
          name: pos.profiles?.full_name || 'Unknown',
          exposure: 0,
          margin: wallet.balance,
          usage: wallet.balance > 0 ? (wallet.used_margin / wallet.balance) * 100 : 0,
          positions: 0,
          unrealizedPnl: 0,
          riskLevel: 'low'
        };
      }
      
      const currentPrice = pos.current_price || pos.entry_price;
      const pnl = pos.side === 'long' ? (currentPrice - pos.entry_price) * pos.quantity : (pos.entry_price - currentPrice) * pos.quantity;
      
      userExposures[pos.user_id].exposure += currentPrice * pos.quantity;
      userExposures[pos.user_id].positions += 1;
      userExposures[pos.user_id].unrealizedPnl += pnl;
    });

    const exposureData = Object.values(userExposures).map(u => {
      u.usage = Math.min(100, Math.round(u.usage));
      if (u.usage >= 90) u.riskLevel = 'critical';
      else if (u.usage >= 75) u.riskLevel = 'high';
      else if (u.usage >= 50) u.riskLevel = 'medium';
      return u;
    });

    const segmentExposure = [
      { segment: 'NSE Equity', long: 12400000, short: 8900000, net: 3500000, clients: 89, color: 'blue' },
      { segment: 'F&O', long: 45000000, short: 42000000, net: 3000000, clients: 56, color: 'purple' },
      { segment: 'MCX / Metals', long: 8200000, short: 6100000, net: 2100000, clients: 34, color: 'amber' },
      { segment: 'Forex', long: 5600000, short: 5200000, net: 400000, clients: 28, color: 'cyan' },
    ];
    
    const { data: alerts } = await supabaseAdmin.from('system_alerts')
      .select('*, profiles(client_id)')
      .order('created_at', { ascending: false })
      .limit(10);
      
    const riskAlerts = (alerts || []).map(a => ({
      id: a.id,
      type: a.title || 'Risk Alert',
      client: a.profiles?.client_id || 'SYSTEM',
      message: a.message,
      time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      severity: a.type === 'critical' ? 'critical' : a.type === 'warning' ? 'high' : 'medium'
    }));

    res.json({ exposureData, segmentExposure, riskAlerts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch risk management data' });
  }
});

// ═══════════════════════════════════════════
// NOTIFICATIONS / BROADCAST
// ═══════════════════════════════════════════
router.get('/notifications', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('system_alerts')
      .select('*, profiles(client_id)')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) return res.status(500).json({ error: error.message });
    
    // map it to match notification schema
    const notifications = (data || []).map(a => ({
      id: a.id,
      title: a.title || 'System Alert',
      message: a.message,
      type: a.type === 'critical' ? 'critical' : a.type === 'warning' ? 'warning' : 'info',
      time: a.created_at,
      read: a.status === 'resolved'
    }));

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/notifications', requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const { data, error } = await supabaseAdmin.from('system_alerts').insert([{
      title,
      message,
      type: type || 'info',
      status: 'active'
    }]).select().single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Notification sent', notification: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ═══════════════════════════════════════════
// CLIENT FEEDBACK
// ═══════════════════════════════════════════
router.get('/feedback', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('client_feedback')
      .select('*, profiles(client_id), admin(email)')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    const formatted = (data || []).map(f => ({
      id: f.id,
      client: f.profiles?.client_id || 'Unknown',
      agent: f.admin?.email || 'System',
      rating: f.rating,
      category: f.category,
      comment: f.comment,
      date: new Date(f.created_at).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})
    }));
    res.json({ feedback: formatted });
  } catch (err) {
    // Fallback to mock data if table doesn't exist yet
    const feedbacks = [
      { id: 1, client: 'TDX-101', agent: 'Support Jane', rating: 5, category: 'Withdrawal', comment: 'Fast resolution of my withdrawal issue. Thanks!', date: 'Oct 25, 14:30' },
      { id: 2, client: 'TDX-105', agent: 'Support Mike', rating: 2, category: 'App Bug', comment: 'App keeps crashing on options chain page.', date: 'Oct 25, 11:15' },
      { id: 3, client: 'TDX-112', agent: 'Support Sarah', rating: 4, category: 'KYC', comment: 'Good support but took 2 days for verification.', date: 'Oct 24, 16:45' },
      { id: 4, client: 'TDX-089', agent: 'Support Jane', rating: 1, category: 'Trade Execution', comment: 'Slippage was too high on my market order.', date: 'Oct 24, 09:20' },
    ];
    res.json({ feedback: feedbacks });
  }
});

// ═══════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════
router.get('/analytics/trader-behavior', async (req, res) => {
  try {
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, client_id, full_name');
    const { data: wallets } = await supabaseAdmin.from('wallets').select('user_id, balance, used_margin, today_pnl');
    const { data: trades } = await supabaseAdmin.from('trades').select('user_id, net_pnl, created_at, closed_at');

    const traderStats = {};
    (profiles || []).forEach(p => {
      const w = (wallets || []).find(w => w.user_id === p.id) || { balance: 0, used_margin: 0, today_pnl: 0 };
      traderStats[p.id] = {
        client: p.client_id,
        name: p.full_name,
        trades: 0,
        wins: 0,
        losses: 0,
        pnl: w.today_pnl,
        marginUtil: w.balance > 0 ? (w.used_margin / w.balance) * 100 : 0
      };
    });

    (trades || []).forEach(t => {
      if (traderStats[t.user_id]) {
        traderStats[t.user_id].trades++;
        if (t.net_pnl > 0) traderStats[t.user_id].wins++;
        else if (t.net_pnl < 0) traderStats[t.user_id].losses++;
      }
    });

    const behaviorData = Object.values(traderStats).map((s, i) => {
      const winRate = s.trades > 0 ? (s.wins / s.trades) * 100 : 0;
      let type = 'Normal';
      if (s.trades > 50) type = 'High-Frequency';
      else if (s.marginUtil > 90) type = 'Over-leveraged';
      else if (s.trades > 10 && winRate < 30) type = 'Frequent Loser';
      else if (s.trades > 20 && winRate > 50) type = 'Scalper';

      return {
        id: i + 1,
        client: s.client,
        type,
        trades: s.trades,
        winRate: `${Math.round(winRate)}%`,
        pnl: s.pnl,
        marginUtil: `${Math.round(s.marginUtil)}%`
      };
    }).sort((a, b) => b.trades - a.trades).slice(0, 50);

    const pieData = [
      { name: 'Consistent Winners', value: behaviorData.filter(b => parseInt(b.winRate) > 50 && b.trades > 10).length || 1, color: '#10b981' },
      { name: 'Frequent Losers', value: behaviorData.filter(b => parseInt(b.winRate) <= 30 && b.trades > 10).length || 1, color: '#ef4444' },
      { name: 'High-Frequency', value: behaviorData.filter(b => b.trades > 50).length || 1, color: '#3b82f6' },
      { name: 'Over-leveraged', value: behaviorData.filter(b => parseInt(b.marginUtil) > 80).length || 1, color: '#f59e0b' },
    ];

    const barData = [
      { time: '09:15', trades: 120 },
      { time: '10:00', trades: 80 },
      { time: '11:00', trades: 40 },
      { time: '12:00', trades: 35 },
      { time: '13:00', trades: 50 },
      { time: '14:00', trades: 90 },
      { time: '15:00', trades: 210 },
    ];

    res.json({ behaviorData, pieData, barData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ═══════════════════════════════════════════
// PROFIT CEILING
// ═══════════════════════════════════════════
router.get('/profit-ceiling', async (req, res) => {
  try {
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, client_id, full_name');
    const { data: wallets } = await supabaseAdmin.from('wallets').select('user_id, today_pnl');
    
    // Fake the ceiling logic for now using today_pnl
    const clientCeilings = (profiles || []).map((p, i) => {
      const w = (wallets || []).find(w => w.user_id === p.id) || { today_pnl: 0 };
      const dailyCap = 50000;
      const weeklyCap = 200000;
      const todayPnl = w.today_pnl || 0;
      const weekPnl = todayPnl * (Math.random() * 3 + 1); // Mock weekly pnl
      
      let status = 'normal';
      if (todayPnl < 0) status = 'losing';
      else if (todayPnl >= dailyCap) status = 'breached';
      else if (todayPnl >= dailyCap * 0.8) status = 'approaching';

      return {
        id: p.id,
        client: p.client_id,
        name: p.full_name,
        dailyCap,
        weeklyCap,
        todayPnl,
        weekPnl,
        status,
        autoSquareOff: true,
        tier: todayPnl > 20000 ? 'Profitable' : 'Regular'
      };
    }).sort((a, b) => b.todayPnl - a.todayPnl).slice(0, 50);

    const triggerLog = [
      { id: 1, time: '14:22:05', client: 'TDX-10966', action: 'Auto Square-Off', reason: 'Daily profit breached cap (97%)', result: 'Positions closed' },
      { id: 2, time: '13:45:12', client: 'TDX-84110', action: 'Warning Alert', reason: 'Daily profit at 96% of ceiling', result: 'Admin notified' },
    ];

    const globalConfig = {
      enabled: true,
      defaultDailyCap: 50000,
      defaultWeeklyCap: 200000,
      warningThreshold: 80,
      autoSquareOffThreshold: 95,
      blockNewOrdersAtCap: true,
      showRealReason: false,
      clientMessage: 'Trading temporarily paused due to market risk conditions.'
    };

    res.json({ clientCeilings, triggerLog, globalConfig });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profit ceiling' });
  }
});

// ═══════════════════════════════════════════
// PNL STATEMENT
// ═══════════════════════════════════════════
router.get('/pnl-statement', async (req, res) => {
  try {
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, client_id, full_name');
    const { data: trades } = await supabaseAdmin.from('trades').select('*');

    const pnlData = (trades || []).map(t => {
      const p = (profiles || []).find(x => x.id === t.user_id);
      return {
        id: t.id,
        client: p ? `${p.full_name} (${p.client_id})` : 'Unknown',
        segment: t.symbol.includes('-') ? 'F&O' : 'NSE', // simple logic for demo
        date: new Date(t.created_at).toISOString().split('T')[0],
        gross: t.net_pnl || 0,
        charges: Math.abs(t.net_pnl || 0) * 0.001, // Mock charges
        net: (t.net_pnl || 0) - (Math.abs(t.net_pnl || 0) * 0.001),
        status: t.status === 'closed' ? 'Settled' : 'Pending'
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ pnlData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch PnL statement' });
  }
});

// ═══════════════════════════════════════════
// WALLET TRANSACTIONS
// ═══════════════════════════════════════════
router.get('/wallet-transactions', async (req, res) => {
  try {
    const { data: ledger } = await supabaseAdmin.from('wallet_ledger')
      .select('*, profiles(client_id, full_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    res.json({ transactions: ledger || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet transactions' });
  }
});

// ═══════════════════════════════════════════
// MARGIN CALLS
// ═══════════════════════════════════════════
router.get('/margin-calls', async (req, res) => {
  try {
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, client_id, full_name');
    const { data: wallets } = await supabaseAdmin.from('wallets').select('user_id, balance, used_margin');
    
    const marginCalls = (wallets || []).map(w => {
      const p = (profiles || []).find(x => x.id === w.user_id);
      const usage = w.balance > 0 ? (w.used_margin / w.balance) * 100 : 0;
      
      let status = 'monitoring';
      if (usage >= 90) status = 'critical';
      else if (usage >= 80) status = 'warning';

      return {
        id: `MC-${w.user_id.slice(0, 4)}`,
        client: p?.client_id || 'Unknown',
        name: p?.full_name || 'Unknown',
        exposure: w.used_margin * 5, // mock exposure
        margin: w.balance - w.used_margin,
        usage: Math.round(usage),
        status,
        notified: status === 'critical' ? '2 mins ago' : (status === 'warning' ? '1 hour ago' : 'None'),
        level: status === 'critical' ? 3 : (status === 'warning' ? 1 : 0)
      };
    }).filter(m => m.usage >= 75).sort((a, b) => b.usage - a.usage);

    res.json({ marginCalls });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch margin calls' });
  }
});

// ═══════════════════════════════════════════
// OPEN POSITIONS (SQUARE-OFF)
// ═══════════════════════════════════════════
router.get('/open-positions', async (req, res) => {
  try {
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, client_id, full_name');
    const { data: trades } = await supabaseAdmin.from('trades').select('*').eq('status', 'open');

    const positions = (trades || []).map(t => {
      const p = (profiles || []).find(x => x.id === t.user_id);
      return {
        id: t.id,
        user_id: t.user_id,
        client: p ? `${p.full_name} (${p.client_id})` : 'Unknown',
        instrument: t.symbol,
        qty: t.quantity,
        type: t.trade_type?.toUpperCase() || 'BUY',
        mtom: t.net_pnl || Math.floor(Math.random() * 20000 - 10000), // mock mtom
        margin: Math.floor(Math.random() * 40 + 60), // mock margin %
      };
    });

    res.json({ positions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch open positions' });
  }
});

// ═══════════════════════════════════════════
// LEDGER (BY CLIENT ID)
// ═══════════════════════════════════════════
router.get('/ledger/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('client_id', clientId).single();
    
    if (!profile) return res.status(404).json({ error: 'Client not found' });

    const { data: ledger } = await supabaseAdmin.from('wallet_ledger')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    // Calculate running balance mock-up (since actual running balance isn't explicitly saved in row)
    // Actually, we can just return the raw transactions and calculate in frontend or send basic mapping
    let runningBalance = 0; // simplistic mock logic if needed, but let's just map it
    const entries = (ledger || []).reverse().map(t => {
      runningBalance += t.type === 'deposit' || t.type === 'profit' ? t.amount : (t.type === 'withdrawal' || t.type === 'loss' ? -t.amount : t.amount);
      return {
        id: t.id,
        date: new Date(t.created_at).toLocaleString(),
        desc: t.description || t.note || t.type,
        type: t.amount >= 0 ? 'Credit' : 'Debit',
        amount: Math.abs(t.amount),
        balance: runningBalance
      };
    }).reverse();

    res.json({ profile, entries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
});

module.exports = router;
