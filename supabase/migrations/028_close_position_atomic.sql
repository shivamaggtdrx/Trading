-- Migration: 028_close_position_atomic
-- Description: Adds function close_position_atomic for atomic position closing, trade records creation, and wallet settlement.

CREATE OR REPLACE FUNCTION public.close_position_atomic(
  p_user_id UUID,
  p_position_id UUID,
  p_exit_price NUMERIC,
  p_gross_pnl NUMERIC,
  p_net_pnl NUMERIC,
  p_charges NUMERIC,
  p_spread_revenue NUMERIC,
  p_swap_revenue NUMERIC,
  p_close_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_position RECORD;
  v_wallet RECORD;
  v_new_balance NUMERIC;
  v_trade RECORD;
  v_trade_side TEXT;
BEGIN
  -- 1. Fetch and lock position
  SELECT * INTO v_position FROM public.positions 
  WHERE id = p_position_id AND user_id = p_user_id AND status = 'open' 
  FOR UPDATE;
  
  IF v_position IS NULL THEN
    RAISE EXCEPTION 'Open position not found';
  END IF;

  -- 2. Fetch and lock wallet
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- 3. Update position record
  UPDATE public.positions
  SET status = 'closed',
      current_price = p_exit_price,
      realized_pnl = p_net_pnl,
      close_reason = p_close_reason,
      closed_at = now()
  WHERE id = p_position_id
  RETURNING * INTO v_position;

  -- 4. Determine trade side (long position closed by sell trade, short by buy trade)
  IF v_position.side = 'long' THEN
    v_trade_side := 'sell';
  ELSE
    v_trade_side := 'buy';
  END IF;

  -- 5. Insert trade record
  INSERT INTO public.trades (
    user_id, instrument_id, position_id, symbol, side, quantity,
    entry_price, exit_price, gross_pnl, charges, net_pnl,
    spread_revenue, swap_revenue, routing, opened_at, closed_at
  ) VALUES (
    p_user_id, v_position.instrument_id, p_position_id, v_position.symbol,
    v_trade_side, v_position.quantity, v_position.entry_price, p_exit_price,
    p_gross_pnl, p_charges, p_net_pnl,
    p_spread_revenue, p_swap_revenue, v_position.routing, v_position.opened_at, now()
  ) RETURNING * INTO v_trade;

  -- 6. Update wallet balance and release margin
  v_new_balance := v_wallet.balance + p_net_pnl;
  UPDATE public.wallets
  SET balance = v_new_balance,
      used_margin = greatest(0, used_margin - v_position.margin_used)
  WHERE user_id = p_user_id;

  -- 7. Insert wallet transaction for realizing PNL
  INSERT INTO public.wallet_transactions (
    user_id, type, amount, balance_after, reference_id, reference_type, description
  ) VALUES (
    p_user_id,
    CASE WHEN p_net_pnl >= 0 THEN 'deposit'::TEXT ELSE 'withdrawal'::TEXT END,
    p_net_pnl,
    v_new_balance,
    p_position_id,
    'position',
    'Realized PNL for ' || upper(v_position.side) || ' ' || v_position.quantity::TEXT || ' ' || v_position.symbol || ' @ ' || p_exit_price::TEXT
  );

  RETURN jsonb_build_object(
    'success', true,
    'position', to_jsonb(v_position),
    'trade', to_jsonb(v_trade),
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security permissions
REVOKE EXECUTE ON FUNCTION public.close_position_atomic(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.close_position_atomic(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_position_atomic(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT) TO service_role;
