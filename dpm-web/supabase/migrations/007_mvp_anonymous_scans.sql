-- MVP Anonymous Scans Table
-- Simple scan logging without attendee identity for internal testing

-- Drop table if exists (for idempotent migration)
DROP TABLE IF EXISTS anonymous_scans CASCADE;

-- Create anonymous_scans table
CREATE TABLE anonymous_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id VARCHAR(255) NOT NULL,
  anchor_id VARCHAR(255) NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  booth_id UUID REFERENCES booths(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_scans_event ON anonymous_scans(event_id);
CREATE INDEX idx_scans_anchor ON anonymous_scans(anchor_id);
CREATE INDEX idx_scans_device ON anonymous_scans(device_id);
CREATE INDEX idx_scans_booth ON anonymous_scans(booth_id);
CREATE INDEX idx_scans_timestamp ON anonymous_scans(timestamp);

-- Enable RLS
ALTER TABLE anonymous_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public inserts (mobile app logging)
CREATE POLICY "Allow public inserts for anonymous scans"
  ON anonymous_scans
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to view their event's scans
CREATE POLICY "Allow organizers to view event scans"
  ON anonymous_scans
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );

-- Allow admins to view all scans
CREATE POLICY "Allow admins to view all scans"
  ON anonymous_scans
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE anonymous_scans IS 'MVP table for tracking anonymous booth scans without attendee identity';

