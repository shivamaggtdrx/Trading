const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

/**
 * GET /api/positions
 * Get user's open positions
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('positions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'open')
      .order('opened_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ positions: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

/**
 * POST /api/positions/:id/close
 * Close a position (square off)
 */
router.post('/:id/close', async (req, res) => {
  try {
    // 1. Fetch position AND instrument in parallel
    const { data: position } = await supabaseAdmin
      .from('positions')
      .select('*, instrument:instruments(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('status', 'open')
      .single();

    if (!position) return res.status(404).json({ error: 'Open position not found' });

    const instrument = position.instrument;
    if (!instrument) return res.status(404).json({ error: 'Instrument not found' });

    // 2. Fetch spread profile (LRU Cached)
    const profile = req.user.profile;
    const cache = require('../core/cache');
    const spreadKey = `spread:${profile.tier}:${instrument.segment}`;
    let spreadProfile = cache.get(spreadKey);

    if (!spreadProfile) {
      const { data } = await supabaseAdmin
        .from('spread_profiles')
        .select('*')
        .eq('tier', profile.tier)
        .eq('segment', instrument.segment)
        .single();
      
      spreadProfile = data;
      if (data) {
        cache.set(spreadKey, data, 300000); // 5m TTL
      }
    }

    const spreadPct = spreadProfile ? spreadProfile.base_spread_pct : 0.05;

    // 3. Execute atomic square-off via Supabase RPC
    const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('close_position_v2', {
      p_user_id: req.user.id,
      p_position_id: position.id,
      p_last_price: parseFloat(instrument.last_price || position.current_price || 0),
      p_spread_pct: parseFloat(spreadPct),
      p_close_reason: 'manual'
    });

    if (rpcErr) {
      console.error('close_position_v2 RPC failed:', rpcErr.message);
      return res.status(500).json({ error: 'Square-off failed: ' + rpcErr.message });
    }

    const closedPos = rpcRes.position;
    const trade = rpcRes.trade;

    // Invalidate wallet cache
    try {
      cache.delete(`wallet:${req.user.id}`);
    } catch (err) {}

    // 4. Emit Socket.IO event for instant UI update
    try {
      const { getIO } = require('../ws/socketServer');
      const io = getIO();
      io.of('/user').to(`user:${req.user.id}`).emit('USER:ORDER_FILLED', {
        position: closedPos,
        execution: { executed_price: trade.exit_price, reason: 'manual_close' },
      });
    } catch (e) { /* socket not available */ }

    res.json({
      message: 'Position closed',
      trade: {
        symbol: trade.symbol,
        side: position.side,
        quantity: trade.quantity,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        gross_pnl: trade.gross_pnl,
        charges: trade.charges,
        net_pnl: trade.net_pnl,
      },
    });
  } catch (err) {
    console.error('Close position error:', err);
    res.status(500).json({ error: 'Failed to close position' });
  }
});

/**
 * PUT /api/positions/:id/sl-tgt
 * Update stop-loss and take-profit for an open position
 */
router.put('/:id/sl-tgt', async (req, res) => {
  try {
    const { stop_loss, target } = req.body;

    const { data: position } = await supabaseAdmin
      .from('positions')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('status', 'open')
      .single();

    if (!position) return res.status(404).json({ error: 'Open position not found' });

    const updates = {};
    if (stop_loss !== undefined) updates.stop_loss = stop_loss;
    if (target !== undefined) updates.target = target;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { error } = await supabaseAdmin
      .from('positions')
      .update(updates)
      .eq('id', position.id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'SL/TGT updated', ...updates });
  } catch (err) {
    console.error('SL/TGT update error:', err);
    res.status(500).json({ error: 'Failed to update SL/TGT' });
  }
});

/**
 * GET /api/positions/history
 * Get closed trade history
 */
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabaseAdmin
      .from('trades')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('closed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ trades: data || [], pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
