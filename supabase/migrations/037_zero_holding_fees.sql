-- Migration: 037_zero_holding_fees
-- Description: Sets long_swap_rate and short_swap_rate defaults to 0, updates existing instruments to 0 swap rates, and updates close_position_partial_v2 to charge 0 swap fees.

-- 1. Alter defaults on instruments table
ALTER TABLE public.instruments 
  ALTER COLUMN long_swap_rate SET DEFAULT 0.0000,
  ALTER COLUMN short_swap_rate SET DEFAULT 0.0000;

-- 2. Update existing instruments
UPDATE public.instruments 
SET long_swap_rate = 0.0000, 
    short_swap_rate = 0.0000;

-- 3. Recreate close_position_partial_v2 with 0 swap fees/charges
CREATE OR REPLACE FUNCTION public.close_position_partial_v2(
  p_user_id UUID,
  p_position_id UUID,
  p_last_price NUMERIC,
  p_spread_pct NUMERIC,
  p_exit_qty NUMERIC DEFAULT NULL::numeric,
  p_close_reason TEXT DEFAULT 'manual'::text
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
  v_margin_released NUMERIC;
  v_swap_fee_realized NUMERIC;
  v_target_exit_qty NUMERIC;
  v_original_qty NUMERIC;
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

  v_original_qty := v_position.quantity;

  -- 3. Determine quantity to close
  v_target_exit_qty := COALESCE(p_exit_qty, v_position.quantity);
  IF v_target_exit_qty <= 0 THEN
    RAISE EXCEPTION 'Invalid exit quantity';
  END IF;
  IF v_target_exit_qty > v_position.quantity THEN
    v_target_exit_qty := v_position.quantity;
  END IF;

  -- 4. Calculate exit price and PNL for this quantity
  v_spread_amount := p_last_price * (p_spread_pct / 100);
  
  IF v_position.side = 'long' THEN
    v_exit_price := p_last_price - (v_spread_amount / 2);
    v_gross_pnl := (v_exit_price - v_position.entry_price) * v_target_exit_qty;
  ELSE
    v_exit_price := p_last_price + (v_spread_amount / 2);
    v_gross_pnl := (v_position.entry_price - v_exit_price) * v_target_exit_qty;
  END IF;
  
  v_exit_price := round(v_exit_price, 4);
  
  -- Swap fees: charge a proportional amount of the accumulated swap fees (forced to 0)
  v_swap_fee_realized := 0;
  
  -- BROKERAGE & SWAP SET TO 0
  v_charges := 0; 
  v_net_pnl := v_gross_pnl - v_charges;

  -- Margin to release: proportional
  v_margin_released := (v_position.margin_used * (v_target_exit_qty / v_position.quantity));

  -- 5. Update position record
  IF v_target_exit_qty = v_position.quantity THEN
    -- Close position fully
    UPDATE public.positions
    SET status = 'closed',
        quantity = quantity - v_target_exit_qty,
        current_price = v_exit_price,
        realized_pnl = realized_pnl + v_net_pnl,
        unrealized_pnl = 0,
        margin_used = 0,
        total_swap_fees = total_swap_fees - v_swap_fee_realized,
        close_reason = p_close_reason,
        closed_at = now()
    WHERE id = p_position_id
    RETURNING * INTO v_position;
  ELSE
    -- Close position partially (keep status open, update quantity & margin)
    UPDATE public.positions
    SET quantity = quantity - v_target_exit_qty,
        margin_used = margin_used - v_margin_released,
        total_swap_fees = total_swap_fees - v_swap_fee_realized,
        realized_pnl = realized_pnl + v_net_pnl,
        current_price = p_last_price
    WHERE id = p_position_id
    RETURNING * INTO v_position;
  END IF;

  -- 6. Insert trade record for the exited portion
  INSERT INTO public.trades (
    user_id, instrument_id, position_id, symbol, side, quantity,
    entry_price, exit_price, gross_pnl, charges, net_pnl,
    spread_revenue, swap_revenue, routing, opened_at, closed_at
  ) VALUES (
    p_user_id, v_position.instrument_id, p_position_id, v_position.symbol,
    CASE WHEN v_position.side = 'long' THEN 'buy'::TEXT ELSE 'sell'::TEXT END,
    v_target_exit_qty, v_position.entry_price, v_exit_price, v_gross_pnl, v_charges, v_net_pnl,
    0, v_swap_fee_realized, v_position.routing, v_position.opened_at, now()
  ) RETURNING * INTO v_trade;

  -- 7. Update wallet balance and release margin
  v_new_balance := v_wallet.balance + v_net_pnl;
  UPDATE public.wallets
  SET balance = v_new_balance,
      used_margin = greatest(0, used_margin - v_margin_released)
  WHERE user_id = p_user_id;

  -- 8. Insert wallet transaction for realizing PNL
  INSERT INTO public.wallet_transactions (
    user_id, type, amount, balance_after, reference_id, reference_type, description
  ) VALUES (
    p_user_id,
    CASE WHEN v_net_pnl >= 0 THEN 'deposit'::TEXT ELSE 'withdrawal'::TEXT END,
    v_net_pnl,
    v_new_balance,
    p_position_id,
    'position',
    'Realized partial PNL for ' || upper(v_position.side) || ' ' || v_target_exit_qty::TEXT || '/' || v_original_qty::TEXT || ' ' || v_position.symbol || ' @ ' || v_exit_price::TEXT
  );

  RETURN jsonb_build_object(
    'success', true,
    'position', to_jsonb(v_position),
    'trade', to_jsonb(v_trade),
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
