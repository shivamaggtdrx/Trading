-- ============================================================
-- TradeX Dabba Trading Platform — Migration 036
-- Referral & Affiliate Marketing System
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. REFERRAL REWARD CONFIG (global, admin-adjustable settings)
--    Single-row table – always upsert on id = 1
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.referral_reward_config (
    id                                INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton
    -- Signup bonuses (only when code is used)
    signup_bonus_referrer             NUMERIC(12,2)  DEFAULT 100,   -- bonus to code owner
    signup_bonus_referee              NUMERIC(12,2)  DEFAULT 50,    -- bonus to new signup
    bonus_turnover_multiplier         NUMERIC(6,2)   DEFAULT 5,     -- trade 5x to unlock bonus
    -- Referral commission rates (trade-based, applied to referee trades)
    referral_trade_commission_pct     NUMERIC(6,4)   DEFAULT 0.5,   -- % of trade P&L / volume
    -- Referral commission rates (deposit-based, credited as bonus)
    referral_deposit_commission_pct   NUMERIC(6,4)   DEFAULT 1.0,   -- % of referred user deposit
    -- Affiliate default rates (override per affiliate in affiliate_accounts)
    affiliate_default_deposit_pct     NUMERIC(6,4)   DEFAULT 3.0,
    affiliate_default_trade_pct       NUMERIC(6,4)   DEFAULT 0.5,
    -- Program toggles
    referral_program_active           BOOLEAN        DEFAULT true,
    affiliate_program_active          BOOLEAN        DEFAULT true,
    -- Affiliate payout cycle
    affiliate_payout_cycle            TEXT           DEFAULT 'biweekly'
                                         CHECK (affiliate_payout_cycle IN ('weekly','biweekly','monthly')),
    -- Metadata
    updated_at                        TIMESTAMPTZ    DEFAULT now(),
    updated_by                        UUID           REFERENCES public.admin_users(id)
);

-- Seed with defaults
INSERT INTO public.referral_reward_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 2. REFERRAL TIERS (editable from admin panel)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.referral_tiers (
    id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                            TEXT NOT NULL,                    -- Bronze, Silver, Gold, Platinum
    min_referrals                   INT  NOT NULL DEFAULT 0,
    max_referrals                   INT,                              -- NULL = unlimited
    deposit_commission_pct          NUMERIC(6,4) DEFAULT 0,          -- % on referred deposit
    trade_commission_pct            NUMERIC(6,4) DEFAULT 0,          -- % on referred trades
    signup_bonus_referrer_override  NUMERIC(12,2),                   -- NULL = use global config
    signup_bonus_referee_override   NUMERIC(12,2),
    display_color                   TEXT  DEFAULT '#6366F1',
    sort_order                      INT   DEFAULT 0,
    is_active                       BOOLEAN DEFAULT true,
    created_at                      TIMESTAMPTZ DEFAULT now(),
    updated_at                      TIMESTAMPTZ DEFAULT now()
);

-- Seed default tiers
INSERT INTO public.referral_tiers (name, min_referrals, max_referrals, deposit_commission_pct, trade_commission_pct, display_color, sort_order) VALUES
  ('Bronze',   0,  4,   0.5,  0.25, '#92400e', 1),
  ('Silver',   5,  14,  1.0,  0.5,  '#64748b', 2),
  ('Gold',     15, 49,  1.5,  0.75, '#d97706', 3),
  ('Platinum', 50, NULL,2.0,  1.0,  '#0891b2', 4)
ON CONFLICT DO NOTHING;

CREATE TRIGGER referral_tiers_updated_at BEFORE UPDATE ON public.referral_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 3. REFERRAL BONUS EVENTS (signup bonus log)
--    Created at signup (pending); credited on first deposit
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.referral_bonus_events (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referee_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referral_code           TEXT NOT NULL,
    bonus_referrer_amount   NUMERIC(12,2) DEFAULT 0,
    bonus_referee_amount    NUMERIC(12,2) DEFAULT 0,
    turnover_required       NUMERIC(15,2) DEFAULT 0,  -- referrer's turnover requirement
    status                  TEXT DEFAULT 'pending'
                              CHECK (status IN ('pending','credited','expired','cancelled')),
    deposit_trigger_id      UUID,                      -- which deposit triggered credit
    credited_at             TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days'),
    created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_bonus_events_referee
    ON public.referral_bonus_events(referee_id);   -- one bonus per referee only

CREATE INDEX IF NOT EXISTS idx_referral_bonus_events_referrer
    ON public.referral_bonus_events(referrer_id);

CREATE INDEX IF NOT EXISTS idx_referral_bonus_events_status
    ON public.referral_bonus_events(status);

-- RLS
ALTER TABLE public.referral_bonus_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY rbe_referrer_select ON public.referral_bonus_events
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- ══════════════════════════════════════════════════════════════
-- 4. AFFILIATE TIERS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.affiliate_tiers (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    TEXT NOT NULL,           -- Standard, Premium, VIP
    description             TEXT,
    default_deposit_pct     NUMERIC(6,4) DEFAULT 3.0,
    default_trade_pct       NUMERIC(6,4) DEFAULT 0.5,
    min_referred_users      INT DEFAULT 0,
    display_color           TEXT DEFAULT '#6366F1',
    sort_order              INT DEFAULT 0,
    is_active               BOOLEAN DEFAULT true,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.affiliate_tiers (name, description, default_deposit_pct, default_trade_pct, min_referred_users, display_color, sort_order) VALUES
  ('Standard', 'New affiliate partners',          3.0, 0.5,  0,  '#64748b', 1),
  ('Premium',  'Established partners (10+ users)', 5.0, 0.75, 10, '#d97706', 2),
  ('VIP',      'Top partners (50+ users)',         7.0, 1.0,  50, '#7c3aed', 3)
ON CONFLICT DO NOTHING;

CREATE TRIGGER affiliate_tiers_updated_at BEFORE UPDATE ON public.affiliate_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 5. AFFILIATE ACCOUNTS (YouTubers, influencers, partners)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.affiliate_accounts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    TEXT NOT NULL,
    email                   TEXT UNIQUE NOT NULL,
    phone                   TEXT,
    platform                TEXT DEFAULT 'other'
                              CHECK (platform IN ('youtube','instagram','twitter','telegram','website','other')),
    channel_url             TEXT,
    subscriber_count        BIGINT DEFAULT 0,
    -- Code & rates
    affiliate_code          TEXT UNIQUE NOT NULL,         -- e.g. YT-JOHNDOE
    deposit_commission_pct  NUMERIC(6,4) DEFAULT 3.0,     -- override per affiliate
    trade_commission_pct    NUMERIC(6,4) DEFAULT 0.5,
    tier_id                 UUID REFERENCES public.affiliate_tiers(id),
    -- Earnings tracking
    total_earnings          NUMERIC(15,2) DEFAULT 0,
    total_paid              NUMERIC(15,2) DEFAULT 0,
    pending_balance         NUMERIC(15,2) DEFAULT 0,
    -- Link to trader account (optional)
    linked_user_id          UUID REFERENCES public.profiles(id),
    -- Payout info
    bank_name               TEXT,
    bank_account_number     TEXT,
    bank_ifsc               TEXT,
    upi_id                  TEXT,
    next_payout_date        DATE,
    -- Status & notes
    status                  TEXT DEFAULT 'active'
                              CHECK (status IN ('active','paused','banned')),
    notes                   TEXT,                         -- internal admin notes
    created_by              UUID REFERENCES public.admin_users(id),
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_code
    ON public.affiliate_accounts(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_status
    ON public.affiliate_accounts(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_linked_user
    ON public.affiliate_accounts(linked_user_id);

CREATE TRIGGER affiliate_accounts_updated_at BEFORE UPDATE ON public.affiliate_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 6. AFFILIATE COMMISSIONS (earnings ledger per event)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id        UUID NOT NULL REFERENCES public.affiliate_accounts(id) ON DELETE CASCADE,
    referred_user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    commission_type     TEXT NOT NULL CHECK (commission_type IN ('deposit','trade')),
    source_id           UUID NOT NULL,          -- deposit_requests.id or trades.id
    source_amount       NUMERIC(15,2) NOT NULL, -- deposit amount or trade volume
    commission_pct      NUMERIC(6,4)  NOT NULL,
    commission_amount   NUMERIC(15,2) NOT NULL,
    status              TEXT DEFAULT 'pending'
                          CHECK (status IN ('pending','included_in_payout','paid','cancelled')),
    payout_id           UUID,                   -- set when included in a payout request
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aff_comm_affiliate   ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_aff_comm_user        ON public.affiliate_commissions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_aff_comm_status      ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_aff_comm_type        ON public.affiliate_commissions(commission_type);
CREATE INDEX IF NOT EXISTS idx_aff_comm_created     ON public.affiliate_commissions(created_at DESC);

CREATE TRIGGER affiliate_commissions_updated_at BEFORE UPDATE ON public.affiliate_commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 7. AFFILIATE PAYOUT REQUESTS (bi-weekly payout tracking)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.affiliate_payout_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id        UUID NOT NULL REFERENCES public.affiliate_accounts(id) ON DELETE CASCADE,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    total_amount        NUMERIC(15,2) NOT NULL DEFAULT 0,
    commission_count    INT DEFAULT 0,            -- number of commission events included
    -- Status flow: pending → approved → paid / rejected
    status              TEXT DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','paid','rejected')),
    -- Payment details (filled by admin on payment)
    payment_method      TEXT CHECK (payment_method IN ('bank_transfer','upi','other')),
    payment_reference   TEXT,                     -- UTR/transaction ID
    payment_date        DATE,
    -- Admin workflow
    requested_at        TIMESTAMPTZ DEFAULT now(),
    reviewed_at         TIMESTAMPTZ,
    reviewed_by         UUID REFERENCES public.admin_users(id),
    paid_at             TIMESTAMPTZ,
    paid_by             UUID REFERENCES public.admin_users(id),
    reject_reason       TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aff_payout_affiliate ON public.affiliate_payout_requests(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_aff_payout_status    ON public.affiliate_payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_aff_payout_created   ON public.affiliate_payout_requests(created_at DESC);

CREATE TRIGGER affiliate_payout_requests_updated_at BEFORE UPDATE ON public.affiliate_payout_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 8. STORE AFFILIATE CODE ON PROFILES
--    Add column to track which affiliate code was used at signup
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS affiliate_code_used TEXT,    -- which affiliate code brought this user
    ADD COLUMN IF NOT EXISTS affiliate_id        UUID REFERENCES public.affiliate_accounts(id);

CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_id
    ON public.profiles(affiliate_id);

-- ══════════════════════════════════════════════════════════════
-- 9. HELPER RPC: credit_referral_bonus
--    Called after first deposit to credit both wallets atomically
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.credit_referral_bonus(
    p_event_id       UUID,
    p_deposit_id     UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event          public.referral_bonus_events%ROWTYPE;
    v_config         public.referral_reward_config%ROWTYPE;
    v_referrer_wallet public.wallets%ROWTYPE;
    v_referee_wallet  public.wallets%ROWTYPE;
BEGIN
    -- Get event & config
    SELECT * INTO v_event  FROM public.referral_bonus_events WHERE id = p_event_id AND status = 'pending';
    SELECT * INTO v_config FROM public.referral_reward_config WHERE id = 1;

    IF v_event.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bonus event not found or already processed');
    END IF;

    -- Credit referee bonus_balance
    IF v_event.bonus_referee_amount > 0 THEN
        UPDATE public.wallets
           SET bonus_balance          = bonus_balance + v_event.bonus_referee_amount,
               bonus_turnover_required = bonus_turnover_required + (v_event.bonus_referee_amount * v_config.bonus_turnover_multiplier),
               updated_at             = now()
         WHERE user_id = v_event.referee_id;

        INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, reference_id, reference_type, description)
        SELECT v_event.referee_id, 'bonus', v_event.bonus_referee_amount,
               w.balance, p_event_id::text, 'referral_bonus',
               'Referral signup bonus (used code: ' || v_event.referral_code || ')'
          FROM public.wallets w WHERE w.user_id = v_event.referee_id;
    END IF;

    -- Credit referrer bonus_balance
    IF v_event.bonus_referrer_amount > 0 THEN
        UPDATE public.wallets
           SET bonus_balance          = bonus_balance + v_event.bonus_referrer_amount,
               bonus_turnover_required = bonus_turnover_required + (v_event.bonus_referrer_amount * v_config.bonus_turnover_multiplier),
               updated_at             = now()
         WHERE user_id = v_event.referrer_id;

        INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, reference_id, reference_type, description)
        SELECT v_event.referrer_id, 'bonus', v_event.bonus_referrer_amount,
               w.balance, p_event_id::text, 'referral_bonus',
               'Referral bonus: ' || (SELECT full_name FROM public.profiles WHERE id = v_event.referee_id) || ' made their first deposit'
          FROM public.wallets w WHERE w.user_id = v_event.referrer_id;
    END IF;

    -- Mark event as credited
    UPDATE public.referral_bonus_events
       SET status             = 'credited',
           credited_at        = now(),
           deposit_trigger_id = p_deposit_id
     WHERE id = p_event_id;

    RETURN jsonb_build_object('success', true, 'referee_bonus', v_event.bonus_referee_amount, 'referrer_bonus', v_event.bonus_referrer_amount);
END;
$$;

-- ══════════════════════════════════════════════════════════════
-- 10. ADMIN RLS BYPASS (service role handles all admin ops)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.referral_reward_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tiers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_tiers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payout_requests ENABLE ROW LEVEL SECURITY;

-- Service role (backend) bypasses RLS for all admin reads/writes
-- No additional user-facing policies needed — all via backend API
