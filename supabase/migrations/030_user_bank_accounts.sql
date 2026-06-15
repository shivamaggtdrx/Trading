-- ============================================================
-- TradeX — Part 30: User Bank Accounts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY select_own_bank_accounts ON public.user_bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_bank_accounts ON public.user_bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_bank_accounts ON public.user_bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY delete_own_bank_accounts ON public.user_bank_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER user_bank_accounts_updated_at 
  BEFORE UPDATE ON public.user_bank_accounts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_bank_accounts_user ON public.user_bank_accounts(user_id);
