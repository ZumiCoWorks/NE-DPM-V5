-- NavEaze V5 DPM MVP - B2B Analytics Tables Migration
-- This migration creates tables for real-time analytics and vendor data monetization

-- Vendors Table - For B2B data access and monetization
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    subscription_tier VARCHAR(50) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
    api_key VARCHAR(255) UNIQUE NOT NULL,
    data_access_level VARCHAR(50) DEFAULT 'aggregated' CHECK (data_access_level IN ('aggregated', 'detailed', 'real_time')),
    rate_limit_per_hour INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vendors_api_key ON vendors(api_key);
CREATE INDEX idx_vendors_subscription_tier ON vendors(subscription_tier);
CREATE INDEX idx_vendors_active ON vendors(is_active);

-- Visitor Tracking Table - Core real-time analytics data
CREATE TABLE visitor_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    visitor_id VARCHAR(100) NOT NULL, -- Anonymous visitor identifier
    x_coordinate FLOAT NOT NULL,
    y_coordinate FLOAT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dwell_time_seconds INTEGER DEFAULT 0,
    movement_speed FLOAT DEFAULT 0.0,
    zone_id UUID, -- Reference to heat zones
    device_type VARCHAR(50),
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_visitor_tracking_event_id ON visitor_tracking(event_id);
CREATE INDEX idx_visitor_tracking_visitor_id ON visitor_tracking(visitor_id);
CREATE INDEX idx_visitor_tracking_timestamp ON visitor_tracking(timestamp);
CREATE INDEX idx_visitor_tracking_zone_id ON visitor_tracking(zone_id);
CREATE INDEX idx_visitor_tracking_session_id ON visitor_tracking(session_id);

-- Heat Zones Table - Predefined zones for analytics
CREATE TABLE heat_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    floorplan_id UUID NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    polygon_coordinates JSONB NOT NULL, -- Array of {x, y} coordinates
    zone_type VARCHAR(50) DEFAULT 'general' CHECK (zone_type IN ('entrance', 'exit', 'booth', 'stage', 'food', 'restroom', 'general')),
    capacity INTEGER,
    priority_level INTEGER DEFAULT 1, -- For bottleneck detection
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_heat_zones_event_id ON heat_zones(event_id);
CREATE INDEX idx_heat_zones_floorplan_id ON heat_zones(floorplan_id);
CREATE INDEX idx_heat_zones_type ON heat_zones(zone_type);

-- Engagement Metrics Table - Aggregated engagement data
CREATE TABLE engagement_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES heat_zones(id) ON DELETE CASCADE,
    time_bucket TIMESTAMP WITH TIME ZONE NOT NULL, -- 5-minute intervals
    visitor_count INTEGER DEFAULT 0,
    avg_dwell_time_seconds FLOAT DEFAULT 0.0,
    peak_occupancy INTEGER DEFAULT 0,
    engagement_score FLOAT DEFAULT 0.0, -- Calculated engagement metric
    movement_velocity FLOAT DEFAULT 0.0, -- Average movement speed
    entry_count INTEGER DEFAULT 0,
    exit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_engagement_metrics_event_id ON engagement_metrics(event_id);
CREATE INDEX idx_engagement_metrics_zone_id ON engagement_metrics(zone_id);
CREATE INDEX idx_engagement_metrics_time_bucket ON engagement_metrics(time_bucket);
CREATE UNIQUE INDEX idx_engagement_metrics_unique ON engagement_metrics(event_id, zone_id, time_bucket);

-- Bottleneck Alerts Table - Real-time congestion detection
CREATE TABLE bottleneck_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES heat_zones(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('congestion', 'overcapacity', 'slow_movement', 'emergency_exit_blocked')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    current_occupancy INTEGER NOT NULL,
    capacity_threshold INTEGER NOT NULL,
    occupancy_percentage FLOAT NOT NULL,
    alert_message TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bottleneck_alerts_event_id ON bottleneck_alerts(event_id);
CREATE INDEX idx_bottleneck_alerts_zone_id ON bottleneck_alerts(zone_id);
CREATE INDEX idx_bottleneck_alerts_severity ON bottleneck_alerts(severity);
CREATE INDEX idx_bottleneck_alerts_resolved ON bottleneck_alerts(is_resolved);
CREATE INDEX idx_bottleneck_alerts_created_at ON bottleneck_alerts(created_at);

-- Vendor Analytics Table - Track vendor data access for billing
CREATE TABLE vendor_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    api_endpoint VARCHAR(200) NOT NULL,
    request_count INTEGER DEFAULT 1,
    data_points_accessed INTEGER DEFAULT 0,
    request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_ms INTEGER,
    data_size_bytes INTEGER,
    billing_tier VARCHAR(50),
    cost_per_request DECIMAL(10,4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vendor_analytics_vendor_id ON vendor_analytics(vendor_id);
CREATE INDEX idx_vendor_analytics_event_id ON vendor_analytics(event_id);
CREATE INDEX idx_vendor_analytics_timestamp ON vendor_analytics(request_timestamp);
CREATE INDEX idx_vendor_analytics_endpoint ON vendor_analytics(api_endpoint);

-- Enable Row Level Security on all new tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottleneck_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_analytics ENABLE ROW LEVEL SECURITY;

-- Sample data for testing
-- Insert a demo vendor
INSERT INTO vendors (name, contact_email, subscription_tier, api_key, data_access_level)
VALUES (
    'Demo Analytics Vendor',
    'vendor@example.com',
    'premium',
    'vnd_' || gen_random_uuid()::text,
    'real_time'
);

-- Create a function to generate visitor tracking data (for testing)
CREATE OR REPLACE FUNCTION generate_sample_visitor_data(p_event_id UUID, p_visitor_count INTEGER DEFAULT 100)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
    visitor_id_val VARCHAR(100);
    x_coord FLOAT;
    y_coord FLOAT;
BEGIN
    FOR i IN 1..p_visitor_count LOOP
        visitor_id_val := 'visitor_' || i::text;
        x_coord := random() * 1000; -- Assuming 1000x1000 coordinate system
        y_coord := random() * 1000;
        
        INSERT INTO visitor_tracking (event_id, visitor_id, x_coordinate, y_coordinate, dwell_time_seconds, session_id)
        VALUES (
            p_event_id,
            visitor_id_val,
            x_coord,
            y_coord,
            (random() * 300)::INTEGER, -- 0-5 minutes dwell time
            'session_' || i::text
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate engagement metrics
CREATE OR REPLACE FUNCTION calculate_engagement_metrics(p_event_id UUID, p_time_bucket TIMESTAMP WITH TIME ZONE)
RETURNS VOID AS $$
DECLARE
    zone_record RECORD;
    visitor_count_val INTEGER;
    avg_dwell_val FLOAT;
    engagement_score_val FLOAT;
BEGIN
    -- Calculate metrics for each zone
    FOR zone_record IN SELECT id FROM heat_zones WHERE event_id = p_event_id LOOP
        -- Count visitors in this zone during the time bucket
        SELECT COUNT(DISTINCT visitor_id), AVG(dwell_time_seconds)
        INTO visitor_count_val, avg_dwell_val
        FROM visitor_tracking vt
        WHERE vt.event_id = p_event_id
        AND vt.zone_id = zone_record.id
        AND vt.timestamp >= p_time_bucket
        AND vt.timestamp < p_time_bucket + INTERVAL '5 minutes';
        
        -- Calculate engagement score (simple formula: visitor_count * avg_dwell_time / 100)
        engagement_score_val := COALESCE(visitor_count_val * avg_dwell_val / 100.0, 0.0);
        
        -- Insert or update engagement metrics
        INSERT INTO engagement_metrics (
            event_id, zone_id, time_bucket, visitor_count, 
            avg_dwell_time_seconds, engagement_score
        ) VALUES (
            p_event_id, zone_record.id, p_time_bucket, 
            COALESCE(visitor_count_val, 0), COALESCE(avg_dwell_val, 0.0), engagement_score_val
        )
        ON CONFLICT (event_id, zone_id, time_bucket) 
        DO UPDATE SET
            visitor_count = EXCLUDED.visitor_count,
            avg_dwell_time_seconds = EXCLUDED.avg_dwell_time_seconds,
            engagement_score = EXCLUDED.engagement_score,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;