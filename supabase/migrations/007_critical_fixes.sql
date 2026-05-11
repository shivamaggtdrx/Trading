-- ============================================================
-- TradeX — Migration 007: Critical Fixes
-- 1. Auto-create wallet on profile creation
-- 2. Atomic wallet update functions (prevent race conditions)
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. AUTO-CREATE WALLET ON SIGNUP
-- Triggered after a new profile row is inserted
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, used_margin, today_pnl, week_pnl, total_pnl, total_deposited, total_withdrawn)
  VALUES (NEW.id, 0, 0, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_wallet_on_signup ON public.profiles;
CREATE TRIGGER trigger_create_wallet_on_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_wallet_for_new_user();

-- ══════════════════════════════════════════════════════════════
-- 2. ATOMIC WALLET CREDIT (for deposit approvals)
-- Uses balance = balance + amount to prevent race conditions
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reference_id UUID,
  p_reference_type TEXT,
  p_description TEXT,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  -- Atomic balance update
  UPDATE public.wallets
  SET balance = balance + p_amount,
      total_deposited = total_deposited + p_amount
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  -- Ledger entry
  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, reference_id, reference_type, description, admin_id)
  VALUES (p_user_id, 'deposit', p_amount, v_new_balance, p_reference_id, p_reference_type, p_description, p_admin_id);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- 3. ATOMIC WALLET DEBIT (for withdrawal approvals)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.debit_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reference_id UUID,
  p_reference_type TEXT,
  p_description TEXT,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_wallet RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Lock the row to prevent concurrent reads
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  IF v_wallet.balance - v_wallet.used_margin < p_amount THEN
    RAISE EXCEPTION 'Insufficient withdrawable balance';
  END IF;

  v_new_balance := v_wallet.balance - p_amount;

  UPDATE public.wallets
  SET balance = v_new_balance,
      total_withdrawn = total_withdrawn + p_amount
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, reference_id, reference_type, description, admin_id)
  VALUES (p_user_id, 'withdrawal', -p_amount, v_new_balance, p_reference_id, p_reference_type, p_description, p_admin_id);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- 4. ATOMIC MARGIN BLOCK (for order placement)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.block_margin(
  p_user_id UUID,
  p_margin_amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_wallet.balance - v_wallet.used_margin < p_margin_amount THEN
    RAISE EXCEPTION 'Insufficient margin. Available: %, Required: %',
      v_wallet.balance - v_wallet.used_margin, p_margin_amount;
  END IF;

  UPDATE public.wallets
  SET used_margin = used_margin + p_margin_amount
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'available_margin', v_wallet.balance - v_wallet.used_margin - p_margin_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- 5. ATOMIC POSITION CLOSE (settle PnL + release margin)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.settle_position_pnl(
  p_user_id UUID,
  p_net_pnl NUMERIC,
  p_margin_to_release NUMERIC,
  p_reference_id UUID,
  p_symbol TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  UPDATE public.wallets
  SET balance = balance + p_net_pnl,
      used_margin = GREATEST(0, used_margin - p_margin_to_release),
      total_pnl = total_pnl + p_net_pnl,
      today_pnl = today_pnl + p_net_pnl,
      week_pnl = week_pnl + p_net_pnl
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, reference_id, reference_type, description)
  VALUES (
    p_user_id, 'trade_pnl', p_net_pnl, v_new_balance,
    p_reference_id, 'trade',
    'Closed ' || p_symbol || ' | PnL: ' || CASE WHEN p_net_pnl >= 0 THEN '+' ELSE '' END || ROUND(p_net_pnl, 2)::TEXT
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- 6. BACKFILL: Create wallets for any existing profiles without one
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.wallets (user_id, balance, used_margin, today_pnl, week_pnl, total_pnl, total_deposited, total_withdrawn)
SELECT p.id, 0, 0, 0, 0, 0, 0, 0
FROM public.profiles p
LEFT JOIN public.wallets w ON w.user_id = p.id
WHERE w.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
