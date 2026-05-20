const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { enqueueOrder } = require('../core/queues/orderQueue');
const { validateOrder } = require('../core/risk/validator');
const { v4: uuidv4 } = require('uuid');

router.use(authenticateUser);

/**
 * POST /api/orders
 * Place a new order (THE CORE DABBA LOGIC)
 * Now queues to BullMQ for async execution instead of blocking the API.
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

    // Feed health is checked passively — orders always proceed
    // Price data comes from multiple providers (Finnhub + Binance)

    // Check if trading is enabled for user
    if (!profile.trading_enabled) {
      return res.status(403).json({ error: 'Trading is disabled for your account. Contact support.' });
    }

    // ── Risk Engine Pre-Trade Validation (Redis-first) ──
    const riskCheck = await validateOrder({
      userId,
      symbol: (symbol || '').toUpperCase(),
      side,
      quantity,
    });
    if (!riskCheck.allowed) {
      return res.status(403).json({ error: riskCheck.reason });
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

    // Reference price from instrument (continuously updated by price engine ticks)
    const referencePrice = instrument.last_price || 0;
    if (referencePrice <= 0) {
      return res.status(400).json({ error: 'No price available for this instrument. Market data may be loading.' });
    }
    const bidPrice = referencePrice;
    const askPrice = referencePrice;

    // Apply spread markup from tier
    const spreadAmount = referencePrice * (sp.base_spread_pct / 100);
    // Apply slippage (random within range, biased towards house)
    const slippageRange = sp.slippage_max_pct - sp.slippage_min_pct;
    const slippagePct = sp.slippage_min_pct + (Math.random() * slippageRange);
    const slippageAmount = referencePrice * (slippagePct / 100);
    const houseFavors = Math.random() * 100 < sp.house_favor_pct;

    let executionPrice;
    if (side === 'buy') {
      executionPrice = askPrice + (spreadAmount / 2); // buyer pays higher
      executionPrice += houseFavors ? slippageAmount : -slippageAmount * 0.3;
    } else {
      executionPrice = bidPrice - (spreadAmount / 2); // seller gets lower
      executionPrice -= houseFavors ? slippageAmount : -slippageAmount * 0.3;
    }

    executionPrice = Math.round(executionPrice * 10000) / 10000;

    // ── Margin calculation & Atomic Block ──
    const orderValue = quantity * executionPrice;
    const marginRequired = orderValue * (instrument.margin_required / 100);

    const { error: marginErr } = await supabaseAdmin.rpc('block_margin', {
      p_user_id: userId,
      p_margin_amount: marginRequired,
    });

    if (marginErr) {
      return res.status(400).json({
        error: 'Insufficient margin',
        required: marginRequired,
        details: marginErr.message
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

    // ── Execution Delay ──
    const executionDelay = sp.execution_delay_min_ms + Math.floor(Math.random() * (sp.execution_delay_max_ms - sp.execution_delay_min_ms));

    // ── Generate idempotency key ──
    const idempotencyKey = uuidv4();

    // ── Queue the order for async execution ──
    const jobName = order_type === 'market' ? 'execute_market_order' : 'execute_limit_order';
    const priority = order_type === 'market' ? 3 : 5; // Market orders get higher priority

    const job = await enqueueOrder(jobName, {
      idempotencyKey,
      userId,
      symbol: instrument.symbol,
      side,
      orderType: order_type,
      quantity,
      price: order_type === 'limit' ? price : null,
      triggerPrice: order_type === 'stop_loss' ? trigger_price : null,
      instrumentId: instrument.id,
      instrument: {
        margin_required: instrument.margin_required,
        segment: instrument.segment,
      },
      marginRequired,
      executionPrice,
      referencePrice,
      spreadAmount,
      executionDelay,
      stopLoss: stop_loss || null,
      takeProfit: take_profit || null,
      bidPrice,
      askPrice,
    }, { priority });

    // Return immediately — the worker will process and notify via Socket.IO
    return res.status(202).json({
      message: 'Order accepted for execution',
      jobId: job.id,
      idempotencyKey,
      status: 'queued',
      estimatedExecution: {
        price: executionPrice,
        spread: spreadAmount,
        delay_ms: executionDelay,
      },
    });

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

    try {
      const { syncLimitOrders } = require('../ws/executionEngine');
      syncLimitOrders();
    } catch (err) {}

    res.json({ message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;
