-- ============================================================
-- TradeX — Migration 021: Atomic Market Order Execution
-- Adds execute_market_order_v2 to handle order placement,
-- position creation, margin blocking, and commission debiting
-- in a single database round-trip.
-- ============================================================

CREATE OR REPLACE FUNCTION public.execute_market_order_v2(
  p_user_id UUID,
  p_instrument_id UUID,
  p_symbol TEXT,
  p_side TEXT,
  p_quantity NUMERIC,
  p_requested_price NUMERIC,
  p_executed_price NUMERIC,
  p_slippage_amount NUMERIC,
  p_spread_markup NUMERIC,
  p_execution_delay_ms INT,
  p_margin_required NUMERIC,
  p_stop_loss NUMERIC,
  p_take_profit NUMERIC,
  p_leverage NUMERIC,
  p_commission NUMERIC
)
RETURNS JSONB AS $$
DECLARE
  v_wallet RECORD;
  v_order RECORD;
  v_position RECORD;
  v_new_balance NUMERIC;
  v_side_pos TEXT;
BEGIN
  -- 1. Lock wallet row and check margins
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- Verify if available margin is sufficient
  IF v_wallet.balance - v_wallet.used_margin < (p_margin_required + p_commission) THEN
    RAISE EXCEPTION 'Insufficient margin. Available: %, Required: %',
      v_wallet.balance - v_wallet.used_margin, (p_margin_required + p_commission);
  END IF;

  -- 2. Insert order record
  INSERT INTO public.orders (
    user_id, instrument_id, symbol, side, order_type, quantity,
    requested_price, executed_price, filled_quantity, avg_fill_price,
    slippage_amount, spread_markup, execution_delay_ms, margin_required, margin_blocked,
    status, filled_at
  ) VALUES (
    p_user_id, p_instrument_id, p_symbol, p_side, 'market', p_quantity,
    p_requested_price, p_executed_price, p_quantity, p_executed_price,
    p_slippage_amount, p_spread_markup, p_execution_delay_ms, p_margin_required, p_margin_required,
    'filled', now()
  ) RETURNING * INTO v_order;

  -- Determine position side
  IF p_side = 'buy' THEN
    v_side_pos := 'long';
  ELSE
    v_side_pos := 'short';
  END IF;

  -- 3. Insert position record
  INSERT INTO public.positions (
    user_id, instrument_id, symbol, order_id, side, quantity,
    entry_price, current_price, margin_used, leverage, stop_loss, take_profit, routing
  ) VALUES (
    p_user_id, p_instrument_id, p_symbol, v_order.id, v_side_pos, p_quantity,
    p_executed_price, p_requested_price, p_margin_required, p_leverage, p_stop_loss, p_take_profit, 'b_book'
  ) RETURNING * INTO v_position;

  -- 4. Update wallet (block margin + deduct commission)
  v_new_balance := v_wallet.balance - p_commission;
  UPDATE public.wallets
  SET used_margin = used_margin + p_margin_required,
      balance = v_new_balance
  WHERE user_id = p_user_id;

  -- 5. Insert commission transaction if > 0
  IF p_commission > 0 THEN
    INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, reference_id, reference_type, description)
    VALUES (
      p_user_id, 'withdrawal', -p_commission, v_new_balance,
      v_order.id, 'order',
      'Commission for ' || upper(p_side) || ' ' || p_quantity::TEXT || ' ' || p_symbol || ' @ ' || p_executed_price::TEXT
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order', to_jsonb(v_order),
    'position', to_jsonb(v_position),
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke permissions and grant to service role for security
REVOKE EXECUTE ON FUNCTION public.execute_market_order_v2(UUID, UUID, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.execute_market_order_v2(UUID, UUID, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_market_order_v2(UUID, UUID, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO service_role;
