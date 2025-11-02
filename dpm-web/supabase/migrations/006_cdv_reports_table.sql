-- CDV Reports Table for Contextual Dwell Verification
-- This table stores data from B2C app when users engage with High-Value Zones

CREATE TABLE cdv_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    attendee_id VARCHAR(100) NOT NULL, -- Mock ID from Quicket API
    dwell_time_minutes DECIMAL(5,2) NOT NULL, -- Simulated dwell time
    active_engagement_status BOOLEAN NOT NULL DEFAULT false, -- YES/NO engagement
    zone_coordinates JSONB, -- HVZ coordinates {x, y, width, height}  
    zone_name VARCHAR(100), -- Name of the High-Value Zone
    session_id VARCHAR(100), -- Track B2C app session
    device_info JSONB, -- Optional device/app info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_cdv_reports_event_id ON cdv_reports(event_id);
CREATE INDEX idx_cdv_reports_venue_id ON cdv_reports(venue_id);
CREATE INDEX idx_cdv_reports_attendee_id ON cdv_reports(attendee_id);
CREATE INDEX idx_cdv_reports_created_at ON cdv_reports(created_at);
CREATE INDEX idx_cdv_reports_active_engagement ON cdv_reports(active_engagement_status);

-- Enable RLS (Row Level Security) for Supabase
ALTER TABLE cdv_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see CDV reports for their own events/venues
CREATE POLICY "Users can view their own CDV reports" ON cdv_reports 
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        ) OR
        venue_id IN (
            SELECT id FROM venues WHERE owner_id = auth.uid()
        )
    );

-- Policy: Allow inserts from API (this will be refined with API key authentication)
CREATE POLICY "Allow CDV report inserts" ON cdv_reports 
    FOR INSERT WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cdv_reports_updated_at 
    BEFORE UPDATE ON cdv_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();