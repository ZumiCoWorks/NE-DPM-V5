-- Fix service role permissions for backend API access
-- This migration grants the service role full access to all tables to bypass RLS restrictions

-- Grant USAGE on schema to service role
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant ALL privileges on all tables to service role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant ALL privileges on all sequences to service role
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant ALL privileges on all functions to service role
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create RLS policies that allow service role to bypass restrictions
-- For map_qr_nodes table (used by editor routes)
CREATE POLICY "service_role_can_access_map_qr_nodes" ON map_qr_nodes
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For pois table (used by editor routes)
CREATE POLICY "service_role_can_access_pois" ON pois
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For events table
CREATE POLICY "service_role_can_access_events" ON events
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For venues table
CREATE POLICY "service_role_can_access_venues" ON venues
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For profiles table
CREATE POLICY "service_role_can_access_profiles" ON profiles
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For users table
CREATE POLICY "service_role_can_access_users" ON users
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For leads table
CREATE POLICY "service_role_can_access_leads" ON leads
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For attendee_scans table
CREATE POLICY "service_role_can_access_attendee_scans" ON attendee_scans
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For qualified_leads table
CREATE POLICY "service_role_can_access_qualified_leads" ON qualified_leads
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For ar_campaigns table
CREATE POLICY "service_role_can_access_ar_campaigns" ON ar_campaigns
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For event_maps table
CREATE POLICY "service_role_can_access_event_maps" ON event_maps
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For floorplans table
CREATE POLICY "service_role_can_access_floorplans" ON floorplans
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For nodes table
CREATE POLICY "service_role_can_access_nodes" ON nodes
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For segments table
CREATE POLICY "service_role_can_access_segments" ON segments
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For zones table
CREATE POLICY "service_role_can_access_zones" ON zones
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For engagements table
CREATE POLICY "service_role_can_access_engagements" ON engagements
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For user_profiles table
CREATE POLICY "service_role_can_access_user_profiles" ON user_profiles
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For venue_templates table
CREATE POLICY "service_role_can_access_venue_templates" ON venue_templates
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- For beacons table
CREATE POLICY "service_role_can_access_beacons" ON beacons
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Ensure future tables also get proper permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;