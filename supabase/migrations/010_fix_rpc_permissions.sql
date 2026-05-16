-- ============================================================
-- Stocks Lab — Migration 010: Fix RPC Permissions (CRITICAL)
-- Previous migrations failed because they revoked from anon/authenticated
-- but PostgreSQL grants EXECUTE to PUBLIC by default, and those roles
-- inherit from PUBLIC. Must revoke from PUBLIC first.
-- ============================================================

-- Step 1: Revoke default PUBLIC execute on ALL dangerous SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.block_margin(uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.credit_wallet(uuid, numeric, uuid, text, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.debit_wallet(uuid, numeric, uuid, text, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.settle_position_pnl(uuid, numeric, numeric, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_wallet_for_new_user() FROM PUBLIC;

-- Also explicitly revoke from anon and authenticated (belt and suspenders)
REVOKE EXECUTE ON FUNCTION public.block_margin(uuid, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_wallet(uuid, numeric, uuid, text, text, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debit_wallet(uuid, numeric, uuid, text, text, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.settle_position_pnl(uuid, numeric, numeric, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_wallet_for_new_user() FROM anon, authenticated;

-- Step 2: Ensure service_role can still execute them (backend uses service_role key)
GRANT EXECUTE ON FUNCTION public.block_margin(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_wallet(uuid, numeric, uuid, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.debit_wallet(uuid, numeric, uuid, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_position_pnl(uuid, numeric, numeric, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_wallet_for_new_user() TO service_role;
