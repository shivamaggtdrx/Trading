-- 012_rls_policies_and_fixes.sql

-- 1. Fix RLS policies to use (select auth.uid()) pattern for performance

DROP POLICY IF EXISTS kyc_select_own ON public.kyc_documents;
CREATE POLICY kyc_select_own ON public.kyc_documents FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS tickets_select_own ON public.support_tickets;
CREATE POLICY tickets_select_own ON public.support_tickets FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS tickets_insert_own ON public.support_tickets;
CREATE POLICY tickets_insert_own ON public.support_tickets FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS replies_select_own ON public.ticket_replies;
CREATE POLICY replies_select_own ON public.ticket_replies FOR SELECT 
  USING ((select auth.uid()) = user_id OR ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS deposits_select_own ON public.deposit_requests;
CREATE POLICY deposits_select_own ON public.deposit_requests FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS withdrawals_select_own ON public.withdrawal_requests;
CREATE POLICY withdrawals_select_own ON public.withdrawal_requests FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS wallets_select_own ON public.wallets;
CREATE POLICY wallets_select_own ON public.wallets FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS wallet_tx_select_own ON public.wallet_transactions;
CREATE POLICY wallet_tx_select_own ON public.wallet_transactions FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS orders_select_own ON public.orders;
CREATE POLICY orders_select_own ON public.orders FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS positions_select_own ON public.positions;
CREATE POLICY positions_select_own ON public.positions FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS trades_select_own ON public.trades;
CREATE POLICY trades_select_own ON public.trades FOR SELECT USING ((select auth.uid()) = user_id);

-- 2. Add explicit policies for the 6 unprotected tables
-- Explicitly deny all access to authenticated and anon users since these are backend/admin only

CREATE POLICY deny_admin_users ON public.admin_users FOR ALL TO public USING (false);
CREATE POLICY deny_audit_logs ON public.audit_logs FOR ALL TO public USING (false);
CREATE POLICY deny_eod_settlements ON public.eod_settlements FOR ALL TO public USING (false);
CREATE POLICY deny_spread_profiles ON public.spread_profiles FOR ALL TO public USING (false);
CREATE POLICY deny_system_alerts ON public.system_alerts FOR ALL TO public USING (false);
CREATE POLICY deny_system_settings ON public.system_settings FOR ALL TO public USING (false);
