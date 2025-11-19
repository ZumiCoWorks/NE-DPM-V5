-- Fix database permissions for anon and authenticated roles
-- This grants basic read access to all tables for the anon role
-- and full access to the authenticated role

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select permissions on tables that should be publicly readable
GRANT SELECT ON public.venues TO anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;
GRANT SELECT ON public.event_maps TO anon, authenticated;
GRANT SELECT ON public.nodes TO anon, authenticated;
GRANT SELECT ON public.segments TO anon, authenticated;
GRANT SELECT ON public.zones TO anon, authenticated;
GRANT SELECT ON public.pois TO anon, authenticated;
GRANT SELECT ON public.beacons TO anon, authenticated;
GRANT SELECT ON public.venue_templates TO anon, authenticated;
GRANT SELECT ON public.map_qr_nodes TO anon, authenticated;
GRANT SELECT ON public.ar_campaigns TO anon, authenticated;

-- Grant full access to authenticated users
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.attendee_scans TO authenticated;
GRANT ALL ON public.engagements TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.floorplans TO authenticated;
GRANT ALL ON public.venues TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.event_maps TO authenticated;
GRANT ALL ON public.nodes TO authenticated;
GRANT ALL ON public.segments TO authenticated;
GRANT ALL ON public.zones TO authenticated;
GRANT ALL ON public.pois TO authenticated;
GRANT ALL ON public.beacons TO authenticated;
GRANT ALL ON public.venue_templates TO authenticated;
GRANT ALL ON public.map_qr_nodes TO authenticated;
GRANT ALL ON public.ar_campaigns TO authenticated;
GRANT ALL ON public.qualified_leads TO authenticated;

-- Grant insert permissions for registration
GRANT INSERT ON public.profiles TO anon;
GRANT INSERT ON public.users TO anon;

-- Grant select on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;