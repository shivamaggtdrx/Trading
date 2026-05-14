/**
 * Simulated Execution Engine
 * Evaluates live ticks against open positions to trigger Stop Loss / Target hits
 */
const { supabaseAdmin } = require('../config/supabase');

// In-memory active positions for fast execution
let activePositions = [];

/**
 * Sync active positions from database into memory
 */
async function syncPositions() {
  try {
    const { data, error } = await supabaseAdmin
      .from('positions')
      .select('*')
      .eq('status', 'OPEN');
      
    if (!error && data) {
      activePositions = data;
    }
  } catch (err) {
    console.error('Error syncing positions:', err);
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
  
  // Filter positions for this symbol
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
}

/**
 * Square off a position (simulated)
 */
async function executeSquareOff(position, exitPrice, triggerType) {
  console.log(`⚡ Auto-Squareoff Triggered: ${position.symbol} ${triggerType} at ${exitPrice}`);
  
  const pnl = (position.side === 'BUY' || position.side === 'long')
    ? (exitPrice - position.entry_price) * position.quantity
    : (position.entry_price - exitPrice) * position.quantity;
    
  // Optimistically remove from memory
  activePositions = activePositions.filter(p => p.id !== position.id);
  
  try {
    await supabaseAdmin
      .from('positions')
      .update({
        status: 'CLOSED',
        exit_price: exitPrice,
        close_time: new Date().toISOString(),
        pnl: pnl,
        closed_by: triggerType
      })
      .eq('id', position.id);
      
    // Broadcast position update to user
    // In a real app, you'd send this to the specific user's socket
  } catch (err) {
    console.error('Squareoff failed:', err);
    // Add back to memory if DB update fails
    activePositions.push(position);
  }
}

// Initial sync
syncPositions();
// Re-sync every 30 seconds to catch any external changes
setInterval(syncPositions, 30000);

module.exports = {
  evaluateTick,
  updatePositionTargets,
  syncPositions
};
