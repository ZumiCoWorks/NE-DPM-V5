-- Create safety_alerts table for distress signals
CREATE TABLE IF NOT EXISTS public.safety_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional, can be anonymous
    type TEXT NOT NULL DEFAULT 'distress', -- 'distress', 'medical', 'security'
    status TEXT NOT NULL DEFAULT 'new', -- 'new', 'investigating', 'resolved'
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store device info, battery, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT -- Changed from UUID to TEXT for demo/MVP to allow 'demo-staff-001'
);

-- Enable RLS
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Attendees can INSERT alerts (anyone can ask for help)
CREATE POLICY "Attendees can create alerts" 
ON public.safety_alerts FOR INSERT 
TO public, anon, authenticated 
WITH CHECK (true);

-- 2. Staff/Admins can VIEW all alerts
-- (For now, allowing authenticated users to view for demo purposes, or specific staff roles if implemented)
CREATE POLICY "Staff can view alerts" 
ON public.safety_alerts FOR SELECT 
TO authenticated 
USING (true);

-- 3. Staff can UPDATE alerts (to resolve them)
CREATE POLICY "Staff can update alerts" 
ON public.safety_alerts FOR UPDATE
TO authenticated 
USING (true);

-- Realtime subscription
-- Enable realtime for this table so the dashboard updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_alerts;
