require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');
const cache = require('../src/core/cache');

async function test() {
  const symbol = 'BTCUSDT';
  const symbolKey = `instrument:${symbol.toUpperCase()}`;
  
  // 1. Clear cache
  cache.delete(symbolKey);

  // 2. Fetch using orders.js logic
  const { data, error } = await supabaseAdmin
    .from('instruments')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Fetch error:', error);
  } else {
    console.log('Fetched via supabaseAdmin:', {
      symbol: data.symbol,
      trading_enabled: data.trading_enabled,
      buy_enabled: data.buy_enabled,
      sell_enabled: data.sell_enabled,
    });
    
    // Check type of buy_enabled
    console.log('Types:', {
      buy_enabled_type: typeof data.buy_enabled,
      buy_enabled_val: data.buy_enabled,
      raw_buy_enabled: data.buy_enabled
    });
  }

  process.exit(0);
}

test();
