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

module.exports = router;
