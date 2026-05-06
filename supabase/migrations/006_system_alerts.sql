-- System Alerts for Surveillance
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT NOT NULL,
    script TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    resolved_by UUID REFERENCES public.admin_users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
