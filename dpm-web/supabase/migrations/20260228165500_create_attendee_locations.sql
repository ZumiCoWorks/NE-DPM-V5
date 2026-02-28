-- Create attendee_locations table for live tracking
CREATE TABLE IF NOT EXISTS attendee_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    attendee_id UUID NOT NULL, -- Anonymous or registered user ID
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast spatial queries and recent active users
CREATE INDEX IF NOT EXISTS idx_attendee_locations_event_id ON attendee_locations(event_id);
CREATE INDEX IF NOT EXISTS idx_attendee_locations_last_ping_at ON attendee_locations(last_ping_at);
-- Optionally you could add PostGIS extension and index on a geometry column here later.

-- RLS Policies
ALTER TABLE attendee_locations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to insert/update their own location
CREATE POLICY "Attendees can update their own location"
    ON attendee_locations FOR ALL
    USING (true) -- Simplified for pilot: anyone can ping
    WITH CHECK (true);

-- Allow organizers and staff to view all locations for their events
CREATE POLICY "Staff can view all attendee locations"
    ON attendee_locations FOR SELECT
    USING (true); -- Simplified for pilot: staff can see all locations
