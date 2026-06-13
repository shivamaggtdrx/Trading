-- ============================================================
-- TradeX — Migration 025: Performance Index & Atomic Position Closure
-- Adds composite index idx_positions_user_status and function close_position_v2
-- ============================================================

-- 1. Create composite index on positions table
CREATE INDEX IF NOT EXISTS idx_positions_user_status ON public.positions (user_id, status);

-- 2. Create atomic position closing function
CREATE OR REPLACE FUNCTION public.close_position_v2(
  p_user_id UUID,
  p_position_id UUID,
  p_last_price NUMERIC,
  p_spread_pct NUMERIC,
  p_close_reason TEXT DEFAULT 'manual'
)
RETURNS JSONB AS $$
DECLARE
  v_position RECORD;
  v_wallet RECORD;
  v_exit_price NUMERIC;
  v_spread_amount NUMERIC;
  v_gross_pnl NUMERIC;
  v_charges NUMERIC;
  v_net_pnl NUMERIC;
  v_new_balance NUMERIC;
  v_trade RECORD;
BEGIN
  -- A. Fetch and lock position
  SELECT * INTO v_position FROM public.positions 
  WHERE id = p_position_id AND user_id = p_user_id AND status = 'open' 
  FOR UPDATE;
  
  IF v_position IS NULL THEN
    RAISE EXCEPTION 'Open position not found';
  END IF;

  -- B. Fetch and lock wallet
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- C. Calculate exit price and PNL
  v_spread_amount := p_last_price * (p_spread_pct / 100);
  
  IF v_position.side = 'long' THEN
    v_exit_price := p_last_price - (v_spread_amount / 2);
    v_gross_pnl := (v_exit_price - v_position.entry_price) * v_position.quantity;
  ELSE
    v_exit_price := p_last_price + (v_spread_amount / 2);
    v_gross_pnl := (v_position.entry_price - v_exit_price) * v_position.quantity;
  END IF;
  
  v_exit_price := round(v_exit_price, 4);
  v_charges := (v_spread_amount * v_position.quantity * 0.01) + v_position.total_swap_fees;
  v_net_pnl := v_gross_pnl - v_charges;

  -- D. Update position record
  UPDATE public.positions
  SET status = 'closed',
      current_price = v_exit_price,
      realized_pnl = v_net_pnl,
      close_reason = p_close_reason,
      closed_at = now()
  WHERE id = p_position_id
  RETURNING * INTO v_position;

  -- E. Insert trade record
  INSERT INTO public.trades (
    user_id, instrument_id, position_id, symbol, side, quantity,
    entry_price, exit_price, gross_pnl, charges, net_pnl,
    spread_revenue, swap_revenue, routing, opened_at, closed_at
  ) VALUES (
    p_user_id, v_position.instrument_id, p_position_id, v_position.symbol,
    CASE WHEN v_position.side = 'long' THEN 'buy'::TEXT ELSE 'sell'::TEXT END,
    v_position.quantity, v_position.entry_price, v_exit_price, v_gross_pnl, v_charges, v_net_pnl,
    v_spread_amount * v_position.quantity * 0.01, v_position.total_swap_fees, v_position.routing, v_position.opened_at, now()
  ) RETURNING * INTO v_trade;

  -- F. Update wallet balance and release margin
  v_new_balance := v_wallet.balance + v_net_pnl;
  UPDATE public.wallets
  SET balance = v_new_balance,
      used_margin = greatest(0, used_margin - v_position.margin_used)
  WHERE user_id = p_user_id;

  -- G. Insert wallet transaction for realizing PNL
  INSERT INTO public.wallet_transactions (
    user_id, type, amount, balance_after, reference_id, reference_type, description
  ) VALUES (
    p_user_id,
    CASE WHEN v_net_pnl >= 0 THEN 'deposit'::TEXT ELSE 'withdrawal'::TEXT END,
    v_net_pnl,
    v_new_balance,
    p_position_id,
    'position',
    'Realized PNL for ' || upper(v_position.side) || ' ' || v_position.quantity::TEXT || ' ' || v_position.symbol || ' @ ' || v_exit_price::TEXT
  );

  RETURN jsonb_build_object(
    'success', true,
    'position', to_jsonb(v_position),
    'trade', to_jsonb(v_trade),
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Security grants
REVOKE EXECUTE ON FUNCTION public.close_position_v2(UUID, UUID, NUMERIC, NUMERIC, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.close_position_v2(UUID, UUID, NUMERIC, NUMERIC, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_position_v2(UUID, UUID, NUMERIC, NUMERIC, TEXT) TO service_role;
