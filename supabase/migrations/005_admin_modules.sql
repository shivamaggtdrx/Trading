-- Migration: 005_admin_modules
-- Description: Creates tables for KYC, Support Tickets, and Notifications

-- KYC Documents
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL, -- e.g., 'aadhaar', 'pan', 'passport'
    document_url TEXT NOT NULL,
    document_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    reject_reason TEXT,
    verified_by UUID REFERENCES public.admin_users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL, -- e.g., TKT-1001
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category TEXT DEFAULT 'general',
    assigned_to UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket Replies
CREATE TABLE IF NOT EXISTS public.ticket_replies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Null if admin replied
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE, -- Null if user replied
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Notifications (Broadcasts)
CREATE TABLE IF NOT EXISTS public.system_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'alert', 'success')),
    target_audience TEXT DEFAULT 'all', -- 'all', 'active_traders', 'inactive'
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.admin_users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can do everything on these tables (via service role bypass or admin policy)
-- Service role bypasses RLS anyway.

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'TKT-' || (floor(random() * 900000) + 100000)::text;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();
