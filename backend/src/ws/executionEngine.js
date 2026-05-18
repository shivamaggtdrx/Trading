/**
 * Simulated Execution Engine
 * Evaluates live ticks against open positions to trigger Stop Loss / Target hits
 */
const { supabaseAdmin } = require('../config/supabase');

// In-memory active positions for fast execution
let activePositions = [];

// In-memory pending limit orders
let activeLimitOrders = [];

/**
 * Sync active positions from database into memory
 */
async function syncPositions() {
  try {
    const { data, error } = await supabaseAdmin
      .from('positions')
      .select('*')
      .in('status', ['OPEN', 'open']); // Checking both cases safely
      
    if (!error && data) {
      activePositions = data;
    }
  } catch (err) {
    console.error('Error syncing positions:', err);
  }
}

/**
 * Sync pending limit orders from database into memory
 */
async function syncLimitOrders() {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .eq('order_type', 'limit');
      
    if (!error && data) {
      activeLimitOrders = data;
    }
  } catch (err) {
    console.error('Error syncing limit orders:', err);
  }
}

/**
 * Handle updates to SL/TGT from frontend (drag events)
 */
async function updatePositionTargets(positionId, stopLoss, target, userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('positions')
      .update({ stop_loss: stopLoss, target: target })
      .eq('id', positionId)
      .eq('user_id', userId)
      .select()
      .single();
      
    if (!error && data) {
      // Update in-memory
      const idx = activePositions.findIndex(p => p.id === positionId);
      if (idx !== -1) {
        activePositions[idx] = data;
      }
      return data;
    }
  } catch (err) {
    console.error('Error updating SL/TGT:', err);
  }
  return null;
}

/**
 * Evaluate a tick against open positions
 */
async function evaluateTick(tick) {
  const { symbol, ltp, bid, ask } = tick;
  
  // 1. Evaluate Positions for SL/TP
  const positionsToEval = activePositions.filter(p => p.symbol === symbol);
  
  for (const pos of positionsToEval) {
    let triggered = false;
    let triggerType = null;
    let exitPrice = null;

    // Use bid/ask if available, fallback to ltp
    const evalPrice = (pos.side === 'BUY' || pos.side === 'long') ? (bid || ltp) : (ask || ltp);

    if (pos.side === 'BUY' || pos.side === 'long') {
      // Check Stop Loss
      if (pos.stop_loss && evalPrice <= pos.stop_loss) {
        triggered = true;
        triggerType = 'STOP_LOSS';
        exitPrice = evalPrice;
      }
      // Check Target
      else if (pos.target && evalPrice >= pos.target) {
        triggered = true;
        triggerType = 'TARGET';
        exitPrice = evalPrice;
      }
    } else if (pos.side === 'SELL' || pos.side === 'short') {
      // Check Stop Loss
      if (pos.stop_loss && evalPrice >= pos.stop_loss) {
        triggered = true;
        triggerType = 'STOP_LOSS';
        exitPrice = evalPrice;
      }
      // Check Target
      else if (pos.target && evalPrice <= pos.target) {
        triggered = true;
        triggerType = 'TARGET';
        exitPrice = evalPrice;
      }
    }

    if (triggered) {
      await executeSquareOff(pos, exitPrice, triggerType);
    }
  }

  // 2. Evaluate Limit Orders for execution
  const limitsToEval = activeLimitOrders.filter(o => o.symbol === symbol);
  for (const order of limitsToEval) {
    let matched = false;
    let execPrice = null;

    const evalPrice = (order.side === 'buy') ? (ask || ltp) : (bid || ltp);

    if (order.side === 'buy' && evalPrice <= order.price) {
      matched = true;
      execPrice = order.price; // execute at requested limit price or better
    } else if (order.side === 'sell' && evalPrice >= order.price) {
      matched = true;
      execPrice = order.price;
    }

    if (matched) {
      // Optimistically remove from queue to prevent double-execution
      activeLimitOrders = activeLimitOrders.filter(o => o.id !== order.id);
      
      const { executeQueue } = require('../core/queues/queueManager');
      try {
        await executeQueue.add('fill_limit_order', {
          orderId: order.id,
          executionPrice: execPrice
        });
        console.log(`⏱️ Limit order ${order.id} matched at ${execPrice}, queued for execution`);
      } catch (err) {
        console.error('Failed to queue limit order execution:', err);
        // Put back in queue if failed to send to BullMQ
        activeLimitOrders.push(order);
      }
    }
  }
}

/**
 * Square off a position (Queue to BullMQ worker)
 */
async function executeSquareOff(position, exitPrice, triggerType) {
  console.log(`⚡ Auto-Squareoff Triggered: ${position.symbol} ${triggerType} at ${exitPrice}`);
    
  // Optimistically remove from memory to prevent duplicate triggers
  activePositions = activePositions.filter(p => p.id !== position.id);
  
  try {
    const { executeQueue } = require('../core/queues/queueManager');
    await executeQueue.add('execute_sl_tp', {
      positionId: position.id,
      exitPrice: exitPrice,
      triggerType: triggerType
    });
    console.log(`⏱️ Position ${position.id} queued for SL/TP squareoff`);
  } catch (err) {
    console.error('Squareoff queueing failed:', err);
    // Add back to memory if queueing fails
    activePositions.push(position);
  }
}

// Initial sync
syncPositions();
syncLimitOrders();
// Re-sync every 30 seconds to catch any external changes
setInterval(() => {
  syncPositions();
  syncLimitOrders();
}, 30000);

module.exports = {
  evaluateTick,
  updatePositionTargets,
  syncPositions,
  syncLimitOrders
};
