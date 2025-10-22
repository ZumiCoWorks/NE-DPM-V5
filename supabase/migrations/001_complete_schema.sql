-- NavEaze Complete Database Schema
-- Fresh database for B2B + B2C Platform
-- Combines base schema + B2B features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- CORE TABLES (From naveaze-v4)
-- ============================================================================

-- Users table (extends Supabase auth.users)
-- Drop and recreate if it exists
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'event_organizer', 'venue_manager', 'advertiser')),
    avatar_url TEXT,
    phone TEXT,
    company TEXT,
    address TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
DROP TABLE IF EXISTS organizations CASCADE;

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues table
DROP TABLE IF EXISTS venues CASCADE;

CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    capacity INTEGER CHECK (capacity > 0),
    contact_email TEXT,
    contact_phone TEXT,
    amenities TEXT[],
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
DROP TABLE IF EXISTS events CASCADE;

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    max_attendees INTEGER CHECK (max_attendees > 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_event_dates CHECK (end_date > start_date)
);

-- Floorplans table
DROP TABLE IF EXISTS floorplans CASCADE;

CREATE TABLE floorplans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    floor_number INTEGER DEFAULT 1,
    image_url TEXT,
    svg_data TEXT,
    scale_factor DECIMAL(10,6) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation points table
DROP TABLE IF EXISTS navigation_points CASCADE;

CREATE TABLE navigation_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floorplan_id UUID NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrance', 'exit', 'restroom', 'elevator', 'stairs', 'booth', 'stage', 'food', 'info', 'emergency', 'custom')),
    x_coordinate DECIMAL(10,6) NOT NULL,
    y_coordinate DECIMAL(10,6) NOT NULL,
    description TEXT,
    is_accessible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- B2B FEATURES (New)
-- ============================================================================

-- Booths table (sponsor booth configuration)
DROP TABLE IF EXISTS booths CASCADE;

CREATE TABLE booths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    navigation_point_id UUID REFERENCES navigation_points(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sponsor_name VARCHAR(200),
    sponsor_tier VARCHAR(50) DEFAULT 'Silver' CHECK (sponsor_tier IN ('Gold', 'Silver', 'Bronze', 'Standard')),
    sponsor_logo_url TEXT,
    sponsor_website TEXT,
    description TEXT,
    x_coordinate DECIMAL(10,6) NOT NULL,
    y_coordinate DECIMAL(10,6) NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CDV Reports table (Contextual Dwell Verification)
DROP TABLE IF EXISTS cdv_reports CASCADE;

CREATE TABLE cdv_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    booth_id UUID REFERENCES booths(id) ON DELETE SET NULL,
    mobile_user_id TEXT,
    quicket_order_id VARCHAR(100),
    quicket_user_id INTEGER,
    zone_name VARCHAR(200) NOT NULL,
    dwell_time_minutes DECIMAL(10,2) NOT NULL,
    active_engagement_status BOOLEAN DEFAULT false,
    x_coordinate DECIMAL(10,6),
    y_coordinate DECIMAL(10,6),
    session_id TEXT,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quicket Integrations table
DROP TABLE IF EXISTS quicket_integrations CASCADE;

CREATE TABLE quicket_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    user_token_encrypted TEXT,
    api_key_hint VARCHAR(20),
    mock_mode BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
    sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Engagement Sessions table
DROP TABLE IF EXISTS engagement_sessions CASCADE;

CREATE TABLE engagement_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mobile_user_id TEXT NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    booths_visited INTEGER DEFAULT 0,
    qr_codes_scanned INTEGER DEFAULT 0,
    total_dwell_minutes DECIMAL(10,2) DEFAULT 0,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
DROP TABLE IF EXISTS analytics_events CASCADE;

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    event_data JSONB,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- POPIA/GDPR COMPLIANCE TABLES
-- ============================================================================

-- Data Processing Consents (POPIA/GDPR)
DROP TABLE IF EXISTS data_consents CASCADE;

CREATE TABLE data_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mobile_user_id TEXT NOT NULL,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('location_tracking', 'analytics', 'marketing', 'data_sharing')),
    consent_given BOOLEAN NOT NULL DEFAULT false,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consent_withdrawn_date TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Deletion Requests (Right to be Forgotten)
DROP TABLE IF EXISTS data_deletion_requests CASCADE;

CREATE TABLE data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mobile_user_id TEXT NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    request_status TEXT NOT NULL DEFAULT 'pending' CHECK (request_status IN ('pending', 'processing', 'completed', 'rejected')),
    processed_date TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    data_categories_to_delete TEXT[] DEFAULT ARRAY['location_data', 'engagement_data', 'session_data', 'analytics'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Access Requests (Right to Access)
DROP TABLE IF EXISTS data_access_requests CASCADE;

CREATE TABLE data_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mobile_user_id TEXT NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    request_status TEXT NOT NULL DEFAULT 'pending' CHECK (request_status IN ('pending', 'processing', 'completed', 'rejected')),
    processed_date TIMESTAMP WITH TIME ZONE,
    data_export_url TEXT,
    export_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log for Data Operations (POPIA/GDPR compliance)
DROP TABLE IF EXISTS data_audit_log CASCADE;

CREATE TABLE data_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_type TEXT NOT NULL CHECK (operation_type IN ('data_access', 'data_export', 'data_deletion', 'consent_update')),
    mobile_user_id TEXT,
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operation_details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_venues_manager_id ON venues(manager_id);
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_floorplans_venue_id ON floorplans(venue_id);
CREATE INDEX idx_navigation_points_floorplan_id ON navigation_points(floorplan_id);
CREATE INDEX idx_navigation_points_type ON navigation_points(type);
CREATE INDEX idx_booths_navigation_point_id ON booths(navigation_point_id);
CREATE INDEX idx_booths_venue_id ON booths(venue_id);
CREATE INDEX idx_booths_event_id ON booths(event_id);
CREATE INDEX idx_booths_qr_code ON booths(qr_code);
CREATE INDEX idx_cdv_reports_event_id ON cdv_reports(event_id);
CREATE INDEX idx_cdv_reports_venue_id ON cdv_reports(venue_id);
CREATE INDEX idx_cdv_reports_booth_id ON cdv_reports(booth_id);
CREATE INDEX idx_cdv_reports_mobile_user_id ON cdv_reports(mobile_user_id);
CREATE INDEX idx_cdv_reports_quicket_order_id ON cdv_reports(quicket_order_id);
CREATE INDEX idx_cdv_reports_created_at ON cdv_reports(created_at);
CREATE INDEX idx_cdv_reports_active_engagement ON cdv_reports(active_engagement_status);
CREATE INDEX idx_quicket_integrations_organizer_id ON quicket_integrations(organizer_id);
CREATE INDEX idx_engagement_sessions_mobile_user_id ON engagement_sessions(mobile_user_id);
CREATE INDEX idx_engagement_sessions_event_id ON engagement_sessions(event_id);
CREATE INDEX idx_engagement_sessions_venue_id ON engagement_sessions(venue_id);
CREATE INDEX idx_engagement_sessions_session_start ON engagement_sessions(session_start);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_data_consents_mobile_user_id ON data_consents(mobile_user_id);
CREATE INDEX idx_data_consents_consent_type ON data_consents(consent_type);
CREATE INDEX idx_data_deletion_requests_mobile_user_id ON data_deletion_requests(mobile_user_id);
CREATE INDEX idx_data_deletion_requests_status ON data_deletion_requests(request_status);
CREATE INDEX idx_data_access_requests_mobile_user_id ON data_access_requests(mobile_user_id);
CREATE INDEX idx_data_access_requests_status ON data_access_requests(request_status);
CREATE INDEX idx_data_audit_log_mobile_user_id ON data_audit_log(mobile_user_id);
CREATE INDEX idx_data_audit_log_operation_type ON data_audit_log(operation_type);
CREATE INDEX idx_data_audit_log_created_at ON data_audit_log(created_at);

-- Spatial index for navigation
CREATE INDEX idx_navigation_points_coordinates ON navigation_points USING GIST (point(x_coordinate, y_coordinate));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_floorplans_updated_at BEFORE UPDATE ON floorplans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_navigation_points_updated_at BEFORE UPDATE ON navigation_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booths_updated_at BEFORE UPDATE ON booths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cdv_reports_updated_at BEFORE UPDATE ON cdv_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quicket_integrations_updated_at BEFORE UPDATE ON quicket_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_consents_updated_at BEFORE UPDATE ON data_consents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_deletion_requests_updated_at BEFORE UPDATE ON data_deletion_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_access_requests_updated_at BEFORE UPDATE ON data_access_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE floorplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdv_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE quicket_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_audit_log ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Venues policies
CREATE POLICY "Public can view active venues" ON venues FOR SELECT USING (status = 'active');
CREATE POLICY "Venue managers can manage their venues" ON venues FOR ALL USING (
    manager_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Events policies
CREATE POLICY "Public can view active events" ON events FOR SELECT USING (status IN ('published', 'active'));
CREATE POLICY "Event organizers can manage their events" ON events FOR ALL USING (
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Floorplans policies
CREATE POLICY "Public can view active floorplans" ON floorplans FOR SELECT USING (is_active = true);
CREATE POLICY "Venue managers can manage floorplans" ON floorplans FOR ALL USING (
    EXISTS (
        SELECT 1 FROM venues v 
        WHERE v.id = floorplans.venue_id 
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- Navigation points policies
CREATE POLICY "Public can view navigation points" ON navigation_points FOR SELECT USING (true);
CREATE POLICY "Venue managers can manage navigation points" ON navigation_points FOR ALL USING (
    EXISTS (
        SELECT 1 FROM floorplans f
        JOIN venues v ON v.id = f.venue_id
        WHERE f.id = navigation_points.floorplan_id
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- Booths policies
CREATE POLICY "Public can view active booths" ON booths FOR SELECT USING (is_active = true);
CREATE POLICY "Venue managers can manage booths at their venues" ON booths FOR ALL USING (
    EXISTS (
        SELECT 1 FROM venues v 
        WHERE v.id = booths.venue_id 
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    ) OR
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = booths.event_id 
        AND (e.organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- CDV Reports policies
CREATE POLICY "Organizers can view CDV reports for their events" ON cdv_reports FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = cdv_reports.event_id 
        AND (e.organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    ) OR
    EXISTS (
        SELECT 1 FROM venues v 
        WHERE v.id = cdv_reports.venue_id 
        AND (v.manager_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);
CREATE POLICY "Public can insert CDV reports" ON cdv_reports FOR INSERT WITH CHECK (true);

-- Quicket Integrations policies
CREATE POLICY "Users can manage their own Quicket integration" ON quicket_integrations FOR ALL USING (organizer_id = auth.uid());

-- Engagement Sessions policies
CREATE POLICY "Organizers can view sessions for their events" ON engagement_sessions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = engagement_sessions.event_id 
        AND (e.organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
);
CREATE POLICY "Public can insert engagement sessions" ON engagement_sessions FOR INSERT WITH CHECK (true);

-- Analytics events policies
CREATE POLICY "Users can view their own analytics" ON analytics_events FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can insert analytics events" ON analytics_events FOR INSERT WITH CHECK (true);

-- Data consents policies (POPIA/GDPR)
CREATE POLICY "Mobile apps can insert consent records" ON data_consents FOR INSERT WITH CHECK (true);
CREATE POLICY "Mobile apps can update consent records" ON data_consents FOR UPDATE USING (true);
CREATE POLICY "Admins can view all consent records" ON data_consents FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Data deletion requests policies (POPIA/GDPR - Right to be Forgotten)
CREATE POLICY "Mobile apps can create deletion requests" ON data_deletion_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all deletion requests" ON data_deletion_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update deletion requests" ON data_deletion_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Data access requests policies (POPIA/GDPR - Right to Access)
CREATE POLICY "Mobile apps can create access requests" ON data_access_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all access requests" ON data_access_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update access requests" ON data_access_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Data audit log policies (POPIA/GDPR - Accountability)
CREATE POLICY "System can insert audit log entries" ON data_audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view audit log" ON data_audit_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Booth engagement summary
CREATE OR REPLACE VIEW booth_engagement_summary AS
SELECT 
    b.id as booth_id,
    b.name as booth_name,
    b.sponsor_name,
    b.sponsor_tier,
    b.venue_id,
    b.event_id,
    COUNT(c.id) as total_engagements,
    COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) as active_engagements,
    COUNT(CASE WHEN c.active_engagement_status = false THEN 1 END) as passive_engagements,
    AVG(c.dwell_time_minutes) as avg_dwell_time,
    SUM(c.dwell_time_minutes) as total_dwell_time,
    COUNT(DISTINCT c.mobile_user_id) as unique_visitors,
    COUNT(DISTINCT c.quicket_order_id) as verified_attendees
FROM booths b
LEFT JOIN cdv_reports c ON b.id = c.booth_id
WHERE b.is_active = true
GROUP BY b.id, b.name, b.sponsor_name, b.sponsor_tier, b.venue_id, b.event_id;

-- Event performance summary
CREATE OR REPLACE VIEW event_performance_summary AS
SELECT 
    e.id as event_id,
    e.name as event_name,
    e.status,
    e.start_date,
    e.end_date,
    v.name as venue_name,
    COUNT(DISTINCT c.mobile_user_id) as total_unique_users,
    COUNT(DISTINCT c.quicket_order_id) as verified_attendees,
    COUNT(c.id) as total_engagements,
    COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) as active_engagements,
    AVG(c.dwell_time_minutes) as avg_dwell_time,
    SUM(c.dwell_time_minutes) as total_dwell_minutes,
    COUNT(DISTINCT es.id) as total_sessions
FROM events e
JOIN venues v ON e.venue_id = v.id
LEFT JOIN cdv_reports c ON e.id = c.event_id
LEFT JOIN engagement_sessions es ON e.id = es.event_id
GROUP BY e.id, e.name, e.status, e.start_date, e.end_date, v.name;

-- Sponsor ROI summary
CREATE OR REPLACE VIEW sponsor_roi_summary AS
SELECT 
    b.sponsor_name,
    b.sponsor_tier,
    e.name as event_name,
    v.name as venue_name,
    COUNT(DISTINCT c.mobile_user_id) as unique_visitors,
    COUNT(DISTINCT c.quicket_order_id) as verified_attendees,
    COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) as active_engagements,
    AVG(c.dwell_time_minutes) as avg_dwell_time,
    SUM(c.dwell_time_minutes) as total_dwell_time,
    CASE b.sponsor_tier
        WHEN 'Gold' THEN COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) * 15.00
        WHEN 'Silver' THEN COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) * 10.00
        WHEN 'Bronze' THEN COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) * 5.00
        ELSE COUNT(CASE WHEN c.active_engagement_status = true THEN 1 END) * 3.00
    END as estimated_revenue
FROM booths b
JOIN venues v ON b.venue_id = v.id
LEFT JOIN events e ON b.event_id = e.id
LEFT JOIN cdv_reports c ON b.id = c.booth_id
WHERE b.is_active = true
GROUP BY b.sponsor_name, b.sponsor_tier, e.name, v.name;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON venues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON floorplans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON navigation_points TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON booths TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cdv_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quicket_integrations TO authenticated;
GRANT SELECT, INSERT ON engagement_sessions TO authenticated;
GRANT SELECT, INSERT ON analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON data_consents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON data_deletion_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON data_access_requests TO authenticated;
GRANT SELECT, INSERT ON data_audit_log TO authenticated;

-- Anonymous user grants (for mobile app)
GRANT SELECT ON venues TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON floorplans TO anon;
GRANT SELECT ON navigation_points TO anon;
GRANT SELECT ON booths TO anon;
GRANT INSERT ON cdv_reports TO anon;
GRANT INSERT ON engagement_sessions TO anon;
GRANT INSERT ON analytics_events TO anon;
GRANT INSERT, UPDATE ON data_consents TO anon;
GRANT INSERT ON data_deletion_requests TO anon;
GRANT INSERT ON data_access_requests TO anon;

-- Grant view access
GRANT SELECT ON booth_engagement_summary TO authenticated;
GRANT SELECT ON event_performance_summary TO authenticated;
GRANT SELECT ON sponsor_roi_summary TO authenticated;

COMMIT;

