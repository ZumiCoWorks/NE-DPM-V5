-- This script fixes the "permission denied for table safety_alerts" error.
-- It applies both the base table privileges (GRANT) and the RLS Policy.

-- 1. Grant base INSERT privileges to the anonymous role
GRANT INSERT ON public.safety_alerts TO anon;

-- 2. Ensure Row Level Security is enabled
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policy if it exists to replace it
DROP POLICY IF EXISTS "Allow anonymous insert on safety_alerts" ON public.safety_alerts;

-- 4. Create the policy allowing anonymous inserts
CREATE POLICY "Allow anonymous insert on safety_alerts" 
ON public.safety_alerts
FOR INSERT 
TO anon
WITH CHECK (true);
