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
    const { data: position } = await supabaseAdmin
      .from('positions')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('status', 'open')
      .single();

    if (!position) return res.status(404).json({ error: 'Open position not found' });

    // Get current instrument price
    const { data: instrument } = await supabaseAdmin
      .from('instruments')
      .select('*')
      .eq('id', position.instrument_id)
      .single();

    if (!instrument) return res.status(404).json({ error: 'Instrument not found' });

    // Apply exit slippage
    const profile = req.user.profile;
    const { data: sp } = await supabaseAdmin
      .from('spread_profiles')
      .select('*')
      .eq('tier', profile.tier)
      .eq('segment', instrument.segment)
      .single();

    const spreadPct = sp ? sp.base_spread_pct : 0.05;
    const spreadAmount = instrument.last_price * (spreadPct / 100);

    let exitPrice = instrument.last_price;
    if (position.side === 'long') {
      exitPrice -= spreadAmount / 2; // selling at lower
    } else {
      exitPrice += spreadAmount / 2; // buying back at higher
    }
    exitPrice = Math.round(exitPrice * 10000) / 10000;

    // Calculate P&L
    let grossPnl = 0;
    if (position.side === 'long') {
      grossPnl = (exitPrice - position.entry_price) * position.quantity;
    } else {
      grossPnl = (position.entry_price - exitPrice) * position.quantity;
    }

    const charges = (spreadAmount * position.quantity * 0.01) + position.total_swap_fees;
    const netPnl = grossPnl - charges;

    // Close position
    await supabaseAdmin
      .from('positions')
      .update({
        status: 'closed',
        current_price: exitPrice,
        realized_pnl: netPnl,
        close_reason: 'manual',
        closed_at: new Date().toISOString(),
      })
      .eq('id', position.id);

    // Create trade record
    await supabaseAdmin.from('trades').insert({
      user_id: req.user.id,
      instrument_id: instrument.id,
      position_id: position.id,
      symbol: position.symbol,
      side: position.side === 'long' ? 'buy' : 'sell',
      quantity: position.quantity,
      entry_price: position.entry_price,
      exit_price: exitPrice,
      gross_pnl: grossPnl,
      charges,
      net_pnl: netPnl,
      spread_revenue: spreadAmount * position.quantity * 0.01,
      swap_revenue: position.total_swap_fees,
      routing: position.routing,
      opened_at: position.opened_at,
    });

    // Atomic wallet settlement: PnL credit + margin release + ledger entry
    const { error: settleErr } = await supabaseAdmin.rpc('settle_position_pnl', {
      p_user_id: req.user.id,
      p_net_pnl: netPnl,
      p_margin_to_release: position.margin_used,
      p_reference_id: position.id,
      p_symbol: `${position.side.toUpperCase()} ${position.quantity} ${position.symbol}`,
    });
    if (settleErr) console.error('Settlement RPC error:', settleErr);

    res.json({
      message: 'Position closed',
      trade: {
        symbol: position.symbol,
        side: position.side,
        quantity: position.quantity,
        entry_price: position.entry_price,
        exit_price: exitPrice,
        gross_pnl: grossPnl,
        charges,
        net_pnl: netPnl,
      },
    });
  } catch (err) {
    console.error('Close position error:', err);
    res.status(500).json({ error: 'Failed to close position' });
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
