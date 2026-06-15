const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config({ path: 'c:/Users/HP/Desktop/Trading Company Project/backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

const TEST_USER_ID = 'd98c219b-070d-48b1-a94c-5d1b695374f5'; // Test user

async function runTests() {
  console.log('🚀 Starting end-to-end database tests for Partial Exits & SL/TGT...');

  try {
    // 1. Fetch an instrument
    const { data: instrument, error: instErr } = await supabaseAdmin
      .from('instruments')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (instErr) throw instErr;
    console.log(`✅ Selected active instrument: ${instrument.symbol}`);

    // 2. Clear old positions for clean test run
    await supabaseAdmin
      .from('positions')
      .delete()
      .eq('user_id', TEST_USER_ID);
    console.log('✅ Cleaned up old positions');

    // 3. Create a mock opening order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: TEST_USER_ID,
        instrument_id: instrument.id,
        symbol: instrument.symbol,
        side: 'buy',
        order_type: 'market',
        quantity: 10,
        requested_price: 100,
        executed_price: 100,
        filled_quantity: 10,
        avg_fill_price: 100,
        status: 'filled'
      })
      .select()
      .single();

    if (orderErr) throw orderErr;
    console.log(`✅ Inserted opening order: ${order.id}`);

    // 4. Create a position with quantity = 10, SL = 90, Take Profit (Target) = 110
    const testPosition = {
      user_id: TEST_USER_ID,
      instrument_id: instrument.id,
      symbol: instrument.symbol,
      order_id: order.id,
      side: 'long',
      quantity: 10,
      entry_price: 100,
      current_price: 100,
      margin_used: 200, // mock margin
      leverage: 5,
      stop_loss: 90,
      take_profit: 110,
      routing: 'b_book',
      status: 'open'
    };

    console.log('Inserting test position...');
    const { data: position, error: posErr } = await supabaseAdmin
      .from('positions')
      .insert(testPosition)
      .select()
      .single();

    if (posErr) throw posErr;
    console.log(`✅ Successfully inserted position: ${position.id} with SL: ${position.stop_loss}, TGT: ${position.take_profit}`);

    // 5. Verify the position has SL & Take Profit correctly set
    if (position.stop_loss !== 90 || position.take_profit !== 110) {
      throw new Error(`SL/TGT mismatch in database position row. SL: ${position.stop_loss}, TGT: ${position.take_profit}`);
    }
    console.log('✅ SL/TGT verification passed');

    // 6. Execute Partial Close of 4 units via RPC
    console.log('Calling close_position_partial_v2 for 4 units...');
    const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('close_position_partial_v2', {
      p_user_id: TEST_USER_ID,
      p_position_id: position.id,
      p_last_price: 105, // exited at profit
      p_spread_pct: 0.05,
      p_exit_qty: 4,
      p_close_reason: 'manual'
    });

    if (rpcErr) throw rpcErr;
    console.log('✅ RPC executed successfully');

    // 7. Verify updated position quantity is 6 and status is still open
    const { data: updatedPos, error: fetchPosErr } = await supabaseAdmin
      .from('positions')
      .select('*')
      .eq('id', position.id)
      .single();

    if (fetchPosErr) throw fetchPosErr;
    console.log(`✅ Position after partial close: status=${updatedPos.status}, quantity=${updatedPos.quantity}`);

    if (parseFloat(updatedPos.quantity) !== 6 || updatedPos.status !== 'open') {
      throw new Error(`Partial close verification failed. Expected quantity 6, got ${updatedPos.quantity}. Expected status open, got ${updatedPos.status}`);
    }

    // 8. Execute final Close of remaining 6 units
    console.log('Calling close_position_partial_v2 for remaining 6 units...');
    const { data: rpcRes2, error: rpcErr2 } = await supabaseAdmin.rpc('close_position_partial_v2', {
      p_user_id: TEST_USER_ID,
      p_position_id: position.id,
      p_last_price: 102,
      p_spread_pct: 0.05,
      p_exit_qty: 6,
      p_close_reason: 'manual'
    });

    if (rpcErr2) throw rpcErr2;
    console.log('✅ Final RPC executed successfully');

    // 9. Verify position status is closed
    const { data: finalPos, error: fetchFinalErr } = await supabaseAdmin
      .from('positions')
      .select('*')
      .eq('id', position.id)
      .single();

    if (fetchFinalErr) throw fetchFinalErr;
    console.log(`✅ Position after final close: status=${finalPos.status}, quantity=${finalPos.quantity}`);

    if (finalPos.status !== 'closed') {
      throw new Error(`Final close verification failed. Expected status closed, got ${finalPos.status}`);
    }

    // 10. Clean up test data
    console.log('Cleaning up test data...');
    await supabaseAdmin.from('trades').delete().eq('user_id', TEST_USER_ID);
    await supabaseAdmin.from('orders').delete().eq('user_id', TEST_USER_ID);
    await supabaseAdmin.from('positions').delete().eq('user_id', TEST_USER_ID);
    console.log('✅ Clean up complete');

    console.log('🎉 ALL PARTIAL EXIT & SL/TGT DATABASE TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
