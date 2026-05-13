-- Migration: 009_enterprise_crm
-- Description: Creates tables for Enterprise CRM/BI, Leads, API Keys, Network Nodes, Smart Spreads, etc.

-- Leads (Sales CRM)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT,
    status TEXT DEFAULT 'new', -- new, contacted, qualified, converted, lost
    assigned_to UUID REFERENCES public.admin_users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys (Algorithmic Trading)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_token TEXT UNIQUE NOT NULL,
    secret_hash TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, revoked
    req_per_sec INTEGER DEFAULT 10,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Tiers
CREATE TABLE IF NOT EXISTS public.client_tiers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tier_name TEXT UNIQUE NOT NULL,
    min_balance NUMERIC DEFAULT 0,
    brokerage_discount_pct NUMERIC DEFAULT 0,
    margin_multiplier NUMERIC DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Corporate Actions (Dividends, Splits, etc)
CREATE TABLE IF NOT EXISTS public.corporate_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol TEXT NOT NULL,
    action_type TEXT NOT NULL, -- dividend, split, bonus
    ex_date DATE NOT NULL,
    ratio TEXT, -- e.g., '2:1' for split
    amount NUMERIC, -- e.g., dividend amount
    status TEXT DEFAULT 'pending', -- pending, applied, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Holidays
CREATE TABLE IF NOT EXISTS public.market_holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    holiday_date DATE NOT NULL,
    description TEXT,
    segments TEXT[], -- e.g., ['NSE', 'BSE', 'MCX']
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Smart Spreads (Markup Management)
CREATE TABLE IF NOT EXISTS public.smart_spreads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol TEXT, -- null means global default
    tier_id UUID REFERENCES public.client_tiers(id),
    spread_markup_pct NUMERIC DEFAULT 0,
    min_markup_points NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    subject_template TEXT,
    body_template TEXT NOT NULL,
    type TEXT DEFAULT 'email', -- email, sms, push
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Network Nodes (Franchises/Master Brokers)
CREATE TABLE IF NOT EXISTS public.network_nodes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    node_type TEXT NOT NULL, -- master, franchisee, ib
    parent_node_id UUID REFERENCES public.network_nodes(id),
    owner_id UUID REFERENCES public.profiles(id),
    revenue_share_pct NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing relationships if needed (e.g. leads to users when converted)
ALTER TABLE public.leads ADD COLUMN converted_user_id UUID REFERENCES public.profiles(id);

-- Enable RLS for the new tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_spreads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_nodes ENABLE ROW LEVEL SECURITY;

-- Note: In a real system, we would add strict policies. For now, service role bypasses RLS.
