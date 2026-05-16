-- 011_performance_hardening.sql
-- Add missing covering indexes for foreign keys (improves JOIN and cascading delete performance)

CREATE INDEX IF NOT EXISTS idx_deposit_requests_approved_by ON public.deposit_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_rejected_by ON public.deposit_requests(rejected_by);
CREATE INDEX IF NOT EXISTS idx_eod_settlements_started_by ON public.eod_settlements(started_by);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_verified_by ON public.kyc_documents(verified_by);
CREATE INDEX IF NOT EXISTS idx_orders_instrument_id ON public.orders(instrument_id);
CREATE INDEX IF NOT EXISTS idx_positions_instrument_id ON public.positions(instrument_id);
CREATE INDEX IF NOT EXISTS idx_positions_order_id ON public.positions(order_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved_by ON public.system_alerts(resolved_by);
CREATE INDEX IF NOT EXISTS idx_system_alerts_user_id ON public.system_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_system_notifications_created_by ON public.system_notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by ON public.system_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_admin_id ON public.ticket_replies(admin_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON public.ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_user_id ON public.ticket_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_instrument_id ON public.trades(instrument_id);
CREATE INDEX IF NOT EXISTS idx_trades_position_id ON public.trades(position_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_admin_id ON public.wallet_transactions(admin_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_approved_by ON public.withdrawal_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_rejected_by ON public.withdrawal_requests(rejected_by);

-- Drop unused indexes (saves disk space and speeds up INSERT/UPDATE/DELETE operations)
DROP INDEX IF EXISTS public.idx_profiles_client_id;
DROP INDEX IF EXISTS public.idx_profiles_email;
DROP INDEX IF EXISTS public.idx_profiles_tier;
DROP INDEX IF EXISTS public.idx_profiles_status;
DROP INDEX IF EXISTS public.idx_profiles_referral;
DROP INDEX IF EXISTS public.idx_wallet_tx_type;
DROP INDEX IF EXISTS public.idx_wallet_tx_ref;
DROP INDEX IF EXISTS public.idx_instruments_segment;
DROP INDEX IF EXISTS public.idx_instruments_active;
DROP INDEX IF EXISTS public.idx_orders_status;
DROP INDEX IF EXISTS public.idx_orders_symbol;
DROP INDEX IF EXISTS public.idx_orders_placed;
DROP INDEX IF EXISTS public.idx_positions_user;
DROP INDEX IF EXISTS public.idx_positions_symbol;
DROP INDEX IF EXISTS public.idx_positions_routing;
DROP INDEX IF EXISTS public.idx_trades_symbol;
DROP INDEX IF EXISTS public.idx_trades_closed;
DROP INDEX IF EXISTS public.idx_trades_settlement;
DROP INDEX IF EXISTS public.idx_positions_symbol_user_id;
DROP INDEX IF EXISTS public.idx_deposits_user;
DROP INDEX IF EXISTS public.idx_deposits_created;
DROP INDEX IF EXISTS public.idx_withdrawals_user;
DROP INDEX IF EXISTS public.idx_withdrawals_created;
DROP INDEX IF EXISTS public.idx_audit_admin;
DROP INDEX IF EXISTS public.idx_audit_action;
