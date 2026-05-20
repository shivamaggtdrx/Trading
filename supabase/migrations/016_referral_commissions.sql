-- ============================================================
-- TradeX Dabba Trading Platform — Migration 016
-- Referral Commissions Ledger
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referral_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    trade_count INT DEFAULT 0,
    trade_volume NUMERIC(15,2) DEFAULT 0,
    amount_earned NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (referrer_id, referee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON public.referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referee ON public.referral_commissions(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_date ON public.referral_commissions(date);

-- Auto-update updated_at timestamp
CREATE TRIGGER referral_commissions_updated_at BEFORE UPDATE ON public.referral_commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ref_commissions_select_own ON public.referral_commissions FOR SELECT USING (auth.uid() = referrer_id);
