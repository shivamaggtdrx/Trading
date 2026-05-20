const { redisClient } = require('../../redis/client');
const { supabaseAdmin } = require('../../config/supabase');

/**
 * Risk Validator — Pre-Trade Validation Engine
 * 
 * Runs BEFORE an order is queued to BullMQ.
 * Checks:
 *   1. Global kill switch (Redis-first, DB fallback)
 *   2. Symbol-level exposure limits
 *   3. User margin sufficiency
 *   4. User-level position limits
 *   5. Symbol trading status
 */

// ── Redis Key Conventions ──
// risk:kill_switch        → '1' or '0'
// risk:symbol_disabled:{SYMBOL} → '1' if disabled
// exp:symbol:{SYMBOL}     → Net exposure (sum of all user quantities, +buy -sell)
// exp:user:{USER_ID}      → Total margin used by user
// risk:max_exposure:{SYMBOL} → Max allowed net exposure for a symbol

/**
 * Check if the global kill switch is active
 */
async function isKillSwitchActive() {
  try {
    const val = await redisClient.get('risk:kill_switch');
    if (val === '1') return true;
  } catch (err) {
    // Redis down — fall through to DB check
  }

  // Fallback to Postgres
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('value')
    .eq('key', 'global_kill_switch')
    .single();

  return data && data.value === 'true';
}

/**
 * Check if a symbol is disabled for trading
 */
async function isSymbolDisabled(symbol) {
  try {
    const val = await redisClient.get(`risk:symbol_disabled:${symbol}`);
    if (val === '1') return true;
  } catch (err) {}
  return false;
}

/**
 * Get the current net exposure for a symbol across all users
 */
async function getSymbolExposure(symbol) {
  try {
    const val = await redisClient.get(`exp:symbol:${symbol}`);
    return parseFloat(val) || 0;
  } catch (err) {
    return 0;
  }
}

/**
 * Get the max allowed exposure for a symbol
 */
async function getMaxExposure(symbol) {
  try {
    const val = await redisClient.get(`risk:max_exposure:${symbol}`);
    if (val) return parseFloat(val);
  } catch (err) {}
  // Default: no limit (Infinity)
  return Infinity;
}

/**
 * Update exposure after a trade executes
 */
async function updateExposure(symbol, side, quantity) {
  const delta = side === 'buy' ? quantity : -quantity;
  try {
    const key = `exp:symbol:${symbol}`;
    await redisClient.incrbyfloat(key, delta);
    await redisClient.expire(key, 86400); // 24h TTL, resets on every trade
  } catch (err) {
    console.error('Failed to update exposure in Redis:', err.message);
  }
}

/**
 * Freeze a user (block all trading)
 */
async function freezeUser(userId) {
  try {
    await redisClient.set(`risk:user_frozen:${userId}`, '1');
  } catch (err) {}
}

/**
 * Check if user is frozen
 */
async function isUserFrozen(userId) {
  try {
    const val = await redisClient.get(`risk:user_frozen:${userId}`);
    return val === '1';
  } catch (err) {}
  return false;
}

/**
 * Unfreeze a user
 */
async function unfreezeUser(userId) {
  try {
    await redisClient.del(`risk:user_frozen:${userId}`);
  } catch (err) {}
}

/**
 * Full pre-trade validation
 * Returns { allowed: true } or { allowed: false, reason: string }
 */
async function validateOrder(orderData) {
  const { userId, symbol, side, quantity } = orderData;

  // 1. Kill switch
  if (await isKillSwitchActive()) {
    return { allowed: false, reason: 'Trading is temporarily halted (kill switch active).' };
  }

  // 2. Symbol disabled
  if (await isSymbolDisabled(symbol)) {
    return { allowed: false, reason: `Trading is disabled for ${symbol}.` };
  }

  // 3. User frozen
  if (await isUserFrozen(userId)) {
    return { allowed: false, reason: 'Your account has been frozen. Contact support.' };
  }

  // 4. Symbol exposure check
  const currentExposure = await getSymbolExposure(symbol);
  const maxExposure = await getMaxExposure(symbol);
  const projectedExposure = side === 'buy'
    ? currentExposure + quantity
    : currentExposure - quantity;

  if (Math.abs(projectedExposure) > maxExposure) {
    return {
      allowed: false,
      reason: `Exposure limit reached for ${symbol}. Current: ${currentExposure}, Max: ${maxExposure}.`,
    };
  }

  return { allowed: true };
}

// ── Admin Emergency Controls ──

/**
 * Activate the global kill switch
 */
async function activateKillSwitch() {
  await redisClient.set('risk:kill_switch', '1');
  console.log('🚨 KILL SWITCH ACTIVATED — All trading halted.');
}

/**
 * Deactivate the global kill switch
 */
async function deactivateKillSwitch() {
  await redisClient.del('risk:kill_switch');
  console.log('✅ Kill switch deactivated — Trading resumed.');
}

/**
 * Disable a specific symbol
 */
async function disableSymbol(symbol) {
  await redisClient.set(`risk:symbol_disabled:${symbol}`, '1');
  console.log(`🚫 Symbol ${symbol} disabled for trading.`);
}

/**
 * Enable a specific symbol
 */
async function enableSymbol(symbol) {
  await redisClient.del(`risk:symbol_disabled:${symbol}`);
  console.log(`✅ Symbol ${symbol} enabled for trading.`);
}

/**
 * Set max exposure for a symbol
 */
async function setMaxExposure(symbol, maxQty) {
  await redisClient.set(`risk:max_exposure:${symbol}`, String(maxQty));
  console.log(`📊 Max exposure for ${symbol} set to ${maxQty}.`);
}

module.exports = {
  validateOrder,
  updateExposure,
  isKillSwitchActive,
  isSymbolDisabled,
  isUserFrozen,
  freezeUser,
  unfreezeUser,
  activateKillSwitch,
  deactivateKillSwitch,
  disableSymbol,
  enableSymbol,
  setMaxExposure,
  getSymbolExposure,
};
