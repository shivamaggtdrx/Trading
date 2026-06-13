-- ============================================================
-- TradeX — Migration 022: Create Missing Admin CRM Tables
-- Creates tables for Market Control, Client Restrictions,
-- Banners, IP Whitelist, and Feature Flags.
-- ============================================================

-- 1. MARKET CONTROL
CREATE TABLE IF NOT EXISTS public.market_control (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment TEXT NOT NULL UNIQUE, -- 'nse_equity', 'forex', 'mcx', etc.
  trading_status TEXT DEFAULT 'open' CHECK (trading_status IN ('open', 'closed', 'halted')),
  start_time TIME DEFAULT '09:15:00',
  end_time TIME DEFAULT '15:30:00',
  manual_halt BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CLIENT RESTRICTIONS
CREATE TABLE IF NOT EXISTS public.client_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  restriction_type TEXT CHECK (restriction_type IN ('block_trading', 'read_only', 'deposit_only', 'block_withdrawals')),
  reasoning TEXT,
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BANNERS
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  image_url TEXT,
  target_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  position INT DEFAULT 1,
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. IP WHITELIST
CREATE TABLE IF NOT EXISTS public.ip_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL UNIQUE,
  label TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. FEATURE FLAGS
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_key TEXT NOT NULL UNIQUE, -- 'margin_trading', 'kyc_mandate', etc.
  status BOOLEAN DEFAULT true,
  description TEXT,
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grant permissions to service_role for API access
GRANT ALL ON TABLE public.market_control TO service_role;
GRANT ALL ON TABLE public.client_restrictions TO service_role;
GRANT ALL ON TABLE public.banners TO service_role;
GRANT ALL ON TABLE public.ip_whitelist TO service_role;
GRANT ALL ON TABLE public.feature_flags TO service_role;
