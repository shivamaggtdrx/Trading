-- 014_client_restrictions.sql

CREATE TABLE IF NOT EXISTS public.client_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  login BOOLEAN DEFAULT true,
  trading BOOLEAN DEFAULT true,
  withdrawals BOOLEAN DEFAULT true,
  options BOOLEAN DEFAULT true,
  mcx BOOLEAN DEFAULT false,
  leverage_multiplier NUMERIC(4,2) DEFAULT 1.00,
  max_order_value BIGINT DEFAULT 500000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.admin_users(id)
);

ALTER TABLE public.client_restrictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_client_restrictions ON public.client_restrictions FOR ALL TO public USING (false);
