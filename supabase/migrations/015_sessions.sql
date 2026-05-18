-- 015_sessions.sql

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  type TEXT CHECK (type IN ('Admin', 'Client')),
  user_name TEXT,
  role TEXT,
  device TEXT,
  ip TEXT,
  location TEXT,
  status TEXT DEFAULT 'Active',
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_sessions ON public.sessions FOR ALL TO public USING (false);
