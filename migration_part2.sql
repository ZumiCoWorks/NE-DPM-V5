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
CREATE INDEX idx_booths_gps ON booths(gps_latitude, gps_longitude);
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
