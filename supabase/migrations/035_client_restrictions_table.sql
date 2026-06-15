-- Migration: 035_client_restrictions_table.sql
-- Description: Create client_restrictions table to store login, trading, segment, and leverage overrides for specific users.

CREATE TABLE IF NOT EXISTS public.client_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  login BOOLEAN DEFAULT true,
  trading BOOLEAN DEFAULT true,
  withdrawals BOOLEAN DEFAULT true,
  options BOOLEAN DEFAULT true,
  mcx BOOLEAN DEFAULT false,
  leverage_multiplier NUMERIC(4,2) DEFAULT 1.00,
  max_order_value BIGINT DEFAULT 500000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL
);

-- Enable Row-Level Security
ALTER TABLE public.client_restrictions ENABLE ROW LEVEL SECURITY;

-- Block all public client access (accessible only via admin service role)
DROP POLICY IF EXISTS deny_client_restrictions ON public.client_restrictions;
CREATE POLICY deny_client_restrictions ON public.client_restrictions FOR ALL TO public USING (false);

-- Grant privileges to service_role
GRANT ALL ON TABLE public.client_restrictions TO service_role;
