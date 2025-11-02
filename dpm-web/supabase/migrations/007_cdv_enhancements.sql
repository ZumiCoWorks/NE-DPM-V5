-- CDV Reports Table Enhancements for B2B Intelligence Dashboard
-- Migration 007: Add ELT pipeline tracking, revenue attribution, and Quicket integration

-- Add new columns to cdv_reports table
ALTER TABLE cdv_reports ADD COLUMN IF NOT EXISTS detected_zone_id VARCHAR(50);
ALTER TABLE cdv_reports ADD COLUMN IF NOT EXISTS quicket_attendee_id VARCHAR(100);
ALTER TABLE cdv_reports ADD COLUMN IF NOT EXISTS revenue_impact JSONB;
ALTER TABLE cdv_reports ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 0;
ALTER TABLE cdv_reports ADD COLUMN IF NOT EXISTS processing_stage VARCHAR(50) DEFAULT 'raw';
ALTER TABLE cdv_reports ADD COLUMN IF NOT EXISTS x_coordinate FLOAT;
ALTER TABLE cdv_reports ADD COLUMN IF NOT EXISTS y_coordinate FLOAT;
ALTER TABLE cdv_reports ADD COLUMN IF NOT EXISTS enrichment_metadata JSONB;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cdv_reports_detected_zone ON cdv_reports(detected_zone_id);
CREATE INDEX IF NOT EXISTS idx_cdv_reports_quicket_id ON cdv_reports(quicket_attendee_id);
CREATE INDEX IF NOT EXISTS idx_cdv_reports_processing_stage ON cdv_reports(processing_stage);
CREATE INDEX IF NOT EXISTS idx_cdv_reports_quality_score ON cdv_reports(data_quality_score);

-- Create ELT pipeline tracking table
CREATE TABLE IF NOT EXISTS elt_pipeline_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES cdv_reports(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    processing_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elt_logs_report_id ON elt_pipeline_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_elt_logs_stage ON elt_pipeline_logs(stage);
CREATE INDEX IF NOT EXISTS idx_elt_logs_status ON elt_pipeline_logs(status);
CREATE INDEX IF NOT EXISTS idx_elt_logs_created_at ON elt_pipeline_logs(created_at);

-- Create resilience buffer table for overflow handling
CREATE TABLE IF NOT EXISTS resilience_buffer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload JSONB NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_resilience_buffer_status ON resilience_buffer(status);
CREATE INDEX IF NOT EXISTS idx_resilience_buffer_created_at ON resilience_buffer(created_at);

-- Create Quicket attendees mock table
CREATE TABLE IF NOT EXISTS quicket_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    quicket_unique_id VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(200),
    email VARCHAR(255),
    ticket_type VARCHAR(100),
    check_in_status BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quicket_attendees_event_id ON quicket_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_quicket_attendees_unique_id ON quicket_attendees(quicket_unique_id);
CREATE INDEX IF NOT EXISTS idx_quicket_attendees_email ON quicket_attendees(email);

-- Enable RLS
ALTER TABLE elt_pipeline_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resilience_buffer ENABLE ROW LEVEL SECURITY;
ALTER TABLE quicket_attendees ENABLE ROW LEVEL SECURITY;

-- Insert sample Quicket attendees for demo
INSERT INTO quicket_attendees (event_id, quicket_unique_id, full_name, email, ticket_type, check_in_status)
SELECT 
    (SELECT id FROM events LIMIT 1),
    'QKT_' || LPAD(generate_series::text, 5, '0'),
    'Attendee ' || generate_series,
    'attendee' || generate_series || '@example.co.za',
    CASE 
        WHEN generate_series <= 20 THEN 'VIP'
        WHEN generate_series <= 50 THEN 'Premium'
        ELSE 'General'
    END,
    random() > 0.3
FROM generate_series(1, 100)
ON CONFLICT (quicket_unique_id) DO NOTHING;

-- Create function to calculate revenue impact
CREATE OR REPLACE FUNCTION calculate_revenue_impact(
    p_dwell_time_minutes DECIMAL,
    p_hourly_rate DECIMAL,
    p_engagement_multiplier DECIMAL DEFAULT 1.0
) RETURNS JSONB AS $$
DECLARE
    base_value DECIMAL;
    engagement_value DECIMAL;
    total_value DECIMAL;
BEGIN
    -- Base value: dwell time in hours × hourly rate
    base_value := (p_dwell_time_minutes / 60.0) * p_hourly_rate;
    
    -- Engagement multiplier (active engagement = 1.5x, passive = 1.0x)
    engagement_value := base_value * p_engagement_multiplier;
    
    total_value := ROUND(engagement_value::numeric, 2);
    
    RETURN jsonb_build_object(
        'base_value', ROUND(base_value::numeric, 2),
        'engagement_multiplier', p_engagement_multiplier,
        'estimated_value', total_value,
        'currency', 'ZAR'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to auto-enrich CDV reports (trigger-based)
CREATE OR REPLACE FUNCTION auto_enrich_cdv_report()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called by the ELT pipeline in production
    -- For now, just set default processing stage
    IF NEW.processing_stage IS NULL THEN
        NEW.processing_stage := 'raw';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-enrichment
DROP TRIGGER IF EXISTS trigger_auto_enrich_cdv ON cdv_reports;
CREATE TRIGGER trigger_auto_enrich_cdv
    BEFORE INSERT ON cdv_reports
    FOR EACH ROW
    EXECUTE FUNCTION auto_enrich_cdv_report();

-- Update trigger for updated_at on quicket_attendees
CREATE TRIGGER update_quicket_attendees_updated_at 
    BEFORE UPDATE ON quicket_attendees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



