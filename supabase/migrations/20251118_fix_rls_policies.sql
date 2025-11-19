-- Fix RLS policies for service role access
-- This allows the backend API to bypass RLS when using service role key

-- First, check if we need to create a service role or fix existing policies
-- The service role should bypass RLS, but let's ensure the policies are correct

-- For map_qr_nodes table (critical for attendee mobile app)
DROP POLICY IF EXISTS "map_qr_nodes_select_policy" ON public.map_qr_nodes;
DROP POLICY IF EXISTS "map_qr_nodes_insert_policy" ON public.map_qr_nodes;
DROP POLICY IF EXISTS "map_qr_nodes_update_policy" ON public.map_qr_nodes;
DROP POLICY IF EXISTS "map_qr_nodes_delete_policy" ON public.map_qr_nodes;

-- Create new policies that allow service role to bypass RLS
CREATE POLICY "map_qr_nodes_service_role_policy" ON public.map_qr_nodes
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- For qualified_leads table (critical for staff mobile app)
DROP POLICY IF EXISTS "qualified_leads_select_policy" ON public.qualified_leads;
DROP POLICY IF EXISTS "qualified_leads_insert_policy" ON public.qualified_leads;
DROP POLICY IF EXISTS "qualified_leads_update_policy" ON public.qualified_leads;
DROP POLICY IF EXISTS "qualified_leads_delete_policy" ON public.qualified_leads;

CREATE POLICY "qualified_leads_service_role_policy" ON public.qualified_leads
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- For leads table (general lead management)
DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;

CREATE POLICY "leads_service_role_policy" ON public.leads
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant explicit permissions to service role
GRANT ALL ON public.map_qr_nodes TO service_role;
GRANT ALL ON public.qualified_leads TO service_role;
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.events TO service_role;
GRANT ALL ON public.venues TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.pois TO service_role;
GRANT ALL ON public.event_maps TO service_role;
GRANT ALL ON public.nodes TO service_role;
GRANT ALL ON public.segments TO service_role;
GRANT ALL ON public.vendors TO service_role;
GRANT ALL ON public.beacons TO service_role;
GRANT ALL ON public.engagements TO service_role;
GRANT ALL ON public.floorplans TO service_role;
GRANT ALL ON public.venue_templates TO service_role;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.attendee_scans TO service_role;