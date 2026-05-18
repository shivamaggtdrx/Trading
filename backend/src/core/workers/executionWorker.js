const { Worker } = require('bullmq');
const { redisOpts } = require('../../redis/client');
const { supabaseAdmin } = require('../../config/supabase');
const { getIO } = require('../../ws/socketServer');
const { updateExposure } = require('../risk/validator');
const angelOneFeed = require('../../ws/angelOneFeed');

/**
 * Execution Worker
 * Processes orders from the BullMQ queue asynchronously.
 * This is the core B-Book execution engine.
 */
const executionWorker = new Worker(
  'order-execution',
  async (job) => {
    const { name, data } = job;
    console.log(`⚡ Processing job [${job.id}]: ${name}`);

    switch (name) {
      case 'execute_market_order':
        return await processMarketOrder(data);
      case 'execute_limit_order':
        return await processLimitOrder(data);
      default:
        throw new Error(`Unknown job type: ${name}`);
    }
  },
  {
    connection: redisOpts,
    concurrency: 5, // Process up to 5 orders simultaneously
    limiter: {
      max: 50,
      duration: 1000, // Max 50 orders per second
    },
  }
);

/**
 * Process a Market Order (instant fill, B-Book)
 */
async function processMarketOrder(data) {
  const {
    userId,
    symbol,
    side,
    quantity,
    instrumentId,
    instrument,
    marginRequired,
    executionPrice,
    referencePrice,
    spreadAmount,
    executionDelay,
    stopLoss,
    takeProfit,
    bidPrice,
    askPrice,
  } = data;

  // ── Step 1: Create the order record ──
  const orderData = {
    user_id: userId,
    instrument_id: instrumentId,
    symbol,
    side,
    order_type: 'market',
    quantity,
    requested_price: referencePrice,
    executed_price: executionPrice,
    filled_quantity: quantity,
    avg_fill_price: executionPrice,
    slippage_amount: Math.abs(executionPrice - (side === 'buy' ? askPrice : bidPrice)),
    spread_markup: spreadAmount,
    execution_delay_ms: executionDelay,
    margin_required: marginRequired,
    margin_blocked: marginRequired,
    status: 'filled',
    filled_at: new Date().toISOString(),
  };

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderErr) throw new Error('Failed to create order: ' + orderErr.message);

  // ── Step 2: Create position ──
  const positionData = {
    user_id: userId,
    instrument_id: instrumentId,
    symbol,
    order_id: order.id,
    side: side === 'buy' ? 'long' : 'short',
    quantity,
    entry_price: executionPrice,
    current_price: referencePrice,
    margin_used: marginRequired,
    leverage: 100 / (instrument.margin_required || 10),
    stop_loss: stopLoss || null,
    take_profit: takeProfit || null,
    routing: 'b_book',
  };

  const { data: position, error: posErr } = await supabaseAdmin
    .from('positions')
    .insert(positionData)
    .select()
    .single();

  if (posErr) throw new Error('Order filled but position creation failed: ' + posErr.message);

  // ── Step 3: Block margin atomically ──
  const { error: marginErr } = await supabaseAdmin.rpc('block_margin', {
    p_user_id: userId,
    p_margin_amount: marginRequired,
  });
  if (marginErr) console.error('Margin block RPC error:', marginErr);

  // ── Step 4: Log wallet transaction ──
  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  await supabaseAdmin.from('wallet_transactions').insert({
    user_id: userId,
    type: 'commission',
    amount: -(spreadAmount * quantity * 0.01),
    balance_after: wallet ? wallet.balance : 0,
    reference_id: order.id,
    reference_type: 'order',
    description: `Order ${side.toUpperCase()} ${quantity} ${symbol} @ ${executionPrice}`,
  });

  // ── Step 5: Notify user via Socket.IO ──
  try {
    const io = getIO();
    io.of('/user').to(`user:${userId}`).emit('USER:ORDER_FILLED', {
      order,
      position,
      execution: {
        requested_price: referencePrice,
        executed_price: executionPrice,
        spread: spreadAmount,
        slippage: Math.abs(executionPrice - (side === 'buy' ? askPrice : bidPrice)),
        delay_ms: executionDelay,
      },
    });
  } catch (err) {
    // Socket not available — user will get update on next poll
  }

  // ── Step 6: Update Redis exposure tracking ──
  await updateExposure(symbol, side, quantity);

  console.log(`✅ Order executed: ${side} ${quantity}x ${symbol} @ ${executionPrice} [${order.id}]`);

  return { orderId: order.id, positionId: position.id, executionPrice };
}

/**
 * Process a Limit Order (placeholder for Phase 3 limit order matching)
 */
async function processLimitOrder(data) {
  // For now, just insert the pending order. The execution engine
  // will match it when price reaches the limit.
  const { userId, symbol, side, quantity, price, instrumentId, marginRequired } = data;

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      instrument_id: instrumentId,
      symbol,
      side,
      order_type: 'limit',
      quantity,
      price,
      margin_required: marginRequired,
      margin_blocked: marginRequired,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create limit order: ' + error.message);

  return { orderId: order.id, status: 'pending' };
}

// ── Worker Event Logging ──
executionWorker.on('completed', (job, result) => {
  console.log(`✅ Job [${job.id}] completed:`, result);
});

executionWorker.on('failed', (job, err) => {
  console.error(`❌ Job [${job?.id}] failed:`, err.message);
});

executionWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

module.exports = { executionWorker };
