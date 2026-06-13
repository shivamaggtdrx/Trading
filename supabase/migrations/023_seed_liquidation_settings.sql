-- ============================================================
-- TradeX — Migration 023: Seed Liquidation & Stop-out Config
-- Adds default risk parameters to system_settings for margin
-- calls and stop-out liquidations.
-- ============================================================

INSERT INTO public.system_settings (key, value, description, category) VALUES
  ('margin_call_level', '50', 'Warning alert level percentage (Equity/Used Margin)', 'risk'),
  ('stop_out_level', '0', 'Stop out liquidation level percentage (Equity/Used Margin, 0 means balance depleted)', 'risk'),
  ('auto_liquidation_enabled', 'true', 'Enable/disable auto-liquidation background engine', 'risk')
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category;
