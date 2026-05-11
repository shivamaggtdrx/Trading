-- ============================================================
-- TradeX — Migration 008: Security Hardening
-- 1. Revoke anon/authenticated EXECUTE on wallet RPCs
-- 2. Enable RLS on unprotected tables
-- 3. Set search_path on all functions
-- ============================================================

-- 1. REVOKE PUBLIC EXECUTE on sensitive wallet functions
REVOKE EXECUTE ON FUNCTION public.credit_wallet(UUID, NUMERIC, UUID, TEXT, TEXT, UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debit_wallet(UUID, NUMERIC, UUID, TEXT, TEXT, UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.block_margin(UUID, NUMERIC) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.settle_position_pnl(UUID, NUMERIC, NUMERIC, UUID, TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_wallet_for_new_user() FROM anon, authenticated;

-- 2. SET search_path on all functions
ALTER FUNCTION public.create_wallet_for_new_user() SET search_path = public;
ALTER FUNCTION public.credit_wallet(UUID, NUMERIC, UUID, TEXT, TEXT, UUID) SET search_path = public;
ALTER FUNCTION public.debit_wallet(UUID, NUMERIC, UUID, TEXT, TEXT, UUID) SET search_path = public;
ALTER FUNCTION public.block_margin(UUID, NUMERIC) SET search_path = public;
ALTER FUNCTION public.settle_position_pnl(UUID, NUMERIC, NUMERIC, UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.generate_ticket_number() SET search_path = public;

-- 3. ENABLE RLS on all unprotected public tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eod_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spread_profiles ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY instruments_select_all ON public.instruments FOR SELECT USING (true);
CREATE POLICY margin_settings_select_all ON public.margin_settings FOR SELECT USING (true);

-- 4. Policies for tables with RLS enabled but no policies
CREATE POLICY kyc_select_own ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tickets_select_own ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tickets_insert_own ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY replies_select_own ON public.ticket_replies FOR SELECT
  USING (auth.uid() = user_id OR ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid()));
CREATE POLICY notifications_select_active ON public.system_notifications FOR SELECT USING (is_active = true);
