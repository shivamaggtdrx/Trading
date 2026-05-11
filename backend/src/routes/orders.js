const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

/**
 * POST /api/orders
 * Place a new order (THE CORE DABBA LOGIC)
 */
router.post('/', async (req, res) => {
  try {
    const { symbol, side, order_type, quantity, price, trigger_price, stop_loss, take_profit } = req.body;
    const userId = req.user.id;
    const profile = req.user.profile;

    // ── Validations ──
    if (!symbol || !side || !order_type || !quantity) {
      return res.status(400).json({ error: 'symbol, side, order_type, and quantity are required' });
    }

    // Check if trading is enabled for user
    if (!profile.trading_enabled) {
      return res.status(403).json({ error: 'Trading is disabled for your account. Contact support.' });
    }

    // Check global kill switch
    const { data: killSwitch } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'global_kill_switch')
      .single();

    if (killSwitch && killSwitch.value === 'true') {
      return res.status(503).json({ error: 'Trading is temporarily halted. Please try again later.' });
    }

    // Get instrument
    const { data: instrument } = await supabaseAdmin
      .from('instruments')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .eq('is_active', true)
      .single();

    if (!instrument) return res.status(404).json({ error: 'Instrument not found or inactive' });
    if (!instrument.trading_enabled) return res.status(403).json({ error: 'Trading disabled for this instrument' });
    if (side === 'buy' && !instrument.buy_enabled) return res.status(403).json({ error: 'Buying disabled for this instrument' });
    if (side === 'sell' && !instrument.sell_enabled) return res.status(403).json({ error: 'Selling disabled for this instrument' });

    // Get wallet
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    // ── Calculate execution price with SPREAD & SLIPPAGE (House Edge) ──
    const { data: spreadProfile } = await supabaseAdmin
      .from('spread_profiles')
      .select('*')
      .eq('tier', profile.tier)
      .eq('segment', instrument.segment)
      .single();

    const sp = spreadProfile || { base_spread_pct: 0.05, slippage_min_pct: 0, slippage_max_pct: 0.05, execution_delay_min_ms: 0, execution_delay_max_ms: 200, house_favor_pct: 70 };

    // Apply spread markup
    const spreadAmount = instrument.last_price * (sp.base_spread_pct / 100);
    // Apply slippage (random within range, biased towards house)
    const slippageRange = sp.slippage_max_pct - sp.slippage_min_pct;
    const slippagePct = sp.slippage_min_pct + (Math.random() * slippageRange);
    const slippageAmount = instrument.last_price * (slippagePct / 100);
    const houseFavors = Math.random() * 100 < sp.house_favor_pct;

    let executionPrice = instrument.last_price;
    if (side === 'buy') {
      executionPrice += spreadAmount / 2; // buyer pays higher
      executionPrice += houseFavors ? slippageAmount : -slippageAmount * 0.3;
    } else {
      executionPrice -= spreadAmount / 2; // seller gets lower
      executionPrice -= houseFavors ? slippageAmount : -slippageAmount * 0.3;
    }

    executionPrice = Math.round(executionPrice * 10000) / 10000;

    // ── Margin calculation ──
    const orderValue = quantity * executionPrice;
    const marginRequired = orderValue * (instrument.margin_required / 100);

    if (wallet.balance - wallet.used_margin < marginRequired) {
      return res.status(400).json({
        error: 'Insufficient margin',
        required: marginRequired,
        available: wallet.balance - wallet.used_margin,
      });
    }

    // ── Check profit ceiling ──
    if (profile.profit_ceiling_enabled) {
      const dailyCap = profile.max_daily_profit;
      if (wallet.today_pnl >= dailyCap) {
        const { data: ceilingSetting } = await supabaseAdmin
          .from('system_settings')
          .select('value')
          .eq('key', 'client_message_at_ceiling')
          .single();

        const msg = ceilingSetting ? JSON.parse(ceilingSetting.value) : 'Trading paused due to market conditions.';
        return res.status(403).json({ error: msg });
      }
    }

    // ── Create Order ──
    const executionDelay = sp.execution_delay_min_ms + Math.floor(Math.random() * (sp.execution_delay_max_ms - sp.execution_delay_min_ms));

    const orderData = {
      user_id: userId,
      instrument_id: instrument.id,
      symbol: instrument.symbol,
      side,
      order_type,
      quantity,
      price: order_type === 'limit' ? price : null,
      trigger_price: order_type === 'stop_loss' ? trigger_price : null,
      requested_price: instrument.last_price,
      executed_price: order_type === 'market' ? executionPrice : null,
      filled_quantity: order_type === 'market' ? quantity : 0,
      avg_fill_price: order_type === 'market' ? executionPrice : null,
      slippage_amount: Math.abs(executionPrice - instrument.last_price),
      spread_markup: spreadAmount,
      execution_delay_ms: executionDelay,
      margin_required: marginRequired,
      margin_blocked: marginRequired,
      status: order_type === 'market' ? 'filled' : 'pending',
      filled_at: order_type === 'market' ? new Date().toISOString() : null,
    };

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderErr) return res.status(500).json({ error: 'Failed to create order: ' + orderErr.message });

    // ── For MARKET orders: create position immediately ──
    if (order_type === 'market') {
      // Create position
      const positionData = {
        user_id: userId,
        instrument_id: instrument.id,
        symbol: instrument.symbol,
        order_id: order.id,
        side: side === 'buy' ? 'long' : 'short',
        quantity,
        entry_price: executionPrice,
        current_price: instrument.last_price,
        margin_used: marginRequired,
        leverage: 100 / instrument.margin_required,
        stop_loss: stop_loss || null,
        take_profit: take_profit || null,
        routing: 'b_book', // ALL trades go B-Book by default (dabba)
      };

      const { data: position, error: posErr } = await supabaseAdmin
        .from('positions')
        .insert(positionData)
        .select()
        .single();

      if (posErr) return res.status(500).json({ error: 'Order filled but position creation failed: ' + posErr.message });

      // Atomic margin block (prevents race conditions)
      const { error: marginErr } = await supabaseAdmin.rpc('block_margin', {
        p_user_id: userId,
        p_margin_amount: marginRequired,
      });
      if (marginErr) console.error('Margin block RPC error:', marginErr);

      // Log transaction
      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: userId,
        type: 'commission',
        amount: -(spreadAmount * quantity * 0.01),
        balance_after: wallet.balance,
        reference_id: order.id,
        reference_type: 'order',
        description: `Order ${side.toUpperCase()} ${quantity} ${symbol} @ ${executionPrice}`,
      });

      return res.status(201).json({
        message: 'Order executed successfully',
        order,
        position,
        execution: {
          requested_price: instrument.last_price,
          executed_price: executionPrice,
          spread: spreadAmount,
          slippage: Math.abs(executionPrice - instrument.last_price),
          delay_ms: executionDelay,
        },
      });
    }

    // For LIMIT/SL orders — just return the pending order
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

/**
 * GET /api/orders
 * Get user's orders
 */
router.get('/', async (req, res) => {
  try {
    const status = req.query.status; // 'pending', 'filled', etc.
    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ orders: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * DELETE /api/orders/:id
 * Cancel a pending order
 */
router.delete('/:id', async (req, res) => {
  try {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('status', 'pending')
      .single();

    if (!order) return res.status(404).json({ error: 'Pending order not found' });

    await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: 'User cancelled' })
      .eq('id', order.id);

    // Release blocked margin
    if (order.margin_blocked > 0) {
      const { data: wallet } = await supabaseAdmin.from('wallets').select('used_margin').eq('user_id', req.user.id).single();
      await supabaseAdmin.from('wallets').update({ used_margin: Math.max(0, wallet.used_margin - order.margin_blocked) }).eq('user_id', req.user.id);
    }

    res.json({ message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;
