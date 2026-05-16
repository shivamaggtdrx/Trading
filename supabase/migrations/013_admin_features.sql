-- 013_admin_features.sql

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'new',
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Tiers
CREATE TABLE IF NOT EXISTS public.client_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL,
  min_deposit NUMERIC,
  commission_discount NUMERIC DEFAULT 0,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Holidays
CREATE TABLE IF NOT EXISTS public.market_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date DATE NOT NULL,
  description TEXT NOT NULL,
  exchange TEXT DEFAULT 'NSE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Network Nodes
CREATE TABLE IF NOT EXISTS public.network_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_name TEXT NOT NULL,
  ip_address TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Smart Spreads
CREATE TABLE IF NOT EXISTS public.smart_spreads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  tier_id UUID REFERENCES public.client_tiers(id),
  spread_markup NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Corporate Actions
CREATE TABLE IF NOT EXISTS public.corporate_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  action_type TEXT NOT NULL,
  ex_date DATE NOT NULL,
  details JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  subject TEXT,
  body TEXT NOT NULL,
  channels TEXT[] DEFAULT '{"email", "in_app"}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  target_url TEXT,
  status TEXT DEFAULT 'active',
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IP Whitelist
CREATE TABLE IF NOT EXISTS public.ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  prize_pool NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Deny Public Access
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_spreads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY deny_leads ON public.leads FOR ALL TO public USING (false);
CREATE POLICY deny_client_tiers ON public.client_tiers FOR ALL TO public USING (false);
CREATE POLICY deny_market_holidays ON public.market_holidays FOR ALL TO public USING (false);
CREATE POLICY deny_api_keys ON public.api_keys FOR ALL TO public USING (false);
CREATE POLICY deny_network_nodes ON public.network_nodes FOR ALL TO public USING (false);
CREATE POLICY deny_smart_spreads ON public.smart_spreads FOR ALL TO public USING (false);
CREATE POLICY deny_corporate_actions ON public.corporate_actions FOR ALL TO public USING (false);
CREATE POLICY deny_notification_templates ON public.notification_templates FOR ALL TO public USING (false);
CREATE POLICY deny_banners ON public.banners FOR ALL TO public USING (false);
CREATE POLICY deny_ip_whitelist ON public.ip_whitelist FOR ALL TO public USING (false);
CREATE POLICY deny_feature_flags ON public.feature_flags FOR ALL TO public USING (false);
CREATE POLICY deny_tournaments ON public.tournaments FOR ALL TO public USING (false);
CREATE POLICY deny_campaigns ON public.campaigns FOR ALL TO public USING (false);
