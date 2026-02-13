-- Migration 007: Add Real-Time Location Tracking and Safety Features
-- Created: 2026-02-13
-- Purpose: Support real-time attendee tracking, emergency alerts, and capacity monitoring

-- ============================================
-- 1. ATTENDEE LOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attendee_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendee_id UUID, -- Anonymous tracking allowed (NULL = anonymous)
  session_id TEXT NOT NULL, -- Browser session ID for tracking
  x_coord FLOAT NOT NULL,
  y_coord FLOAT NOT NULL,
  floor_level INTEGER DEFAULT 0,
  source TEXT NOT NULL CHECK (source IN ('gps', 'qr', 'manual')),
  accuracy_meters FLOAT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for real-time queries
CREATE INDEX idx_attendee_locations_event_timestamp 
  ON attendee_locations(event_id, timestamp DESC);

CREATE INDEX idx_attendee_locations_session 
  ON attendee_locations(session_id, timestamp DESC);

-- Note: Removed partial index with NOW() due to immutability constraint
-- Query recent data using: WHERE timestamp > NOW() - INTERVAL '5 minutes' in application

-- Enable Realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE attendee_locations;

COMMENT ON TABLE attendee_locations IS 'Real-time attendee position tracking for crowd monitoring and analytics';

-- ============================================
-- 2. EMERGENCY ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendee_id UUID, -- Can be anonymous
  session_id TEXT,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('medical', 'security', 'lost', 'other')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location_x FLOAT,
  location_y FLOAT,
  floor_level INTEGER DEFAULT 0,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'responding', 'resolved')),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_emergency_alerts_event_status 
  ON emergency_alerts(event_id, status, created_at DESC);

-- Partial index for active alerts (status-based, not time-based)
CREATE INDEX idx_emergency_alerts_active 
  ON emergency_alerts(event_id, created_at DESC) 
  WHERE status IN ('active', 'acknowledged', 'responding');

-- Enable Realtime for instant alerts
ALTER PUBLICATION supabase_realtime ADD TABLE emergency_alerts;

COMMENT ON TABLE emergency_alerts IS 'Emergency distress pins and incident tracking';

-- ============================================
-- 3. CAPACITY ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS capacity_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('green', 'amber', 'red')),
  current_count INTEGER NOT NULL,
  capacity_limit INTEGER NOT NULL,
  capacity_percentage FLOAT NOT NULL,
  threshold_exceeded TEXT NOT NULL, -- '50%', '80%', '100%'
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_capacity_alerts_event_status 
  ON capacity_alerts(event_id, status, created_at DESC);

CREATE INDEX idx_capacity_alerts_zone 
  ON capacity_alerts(zone_id, created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE capacity_alerts;

COMMENT ON TABLE capacity_alerts IS 'Graduated capacity threshold alerts (Green/Amber/Red)';

-- ============================================
-- 4. LOCATION HISTORY (Aggregated Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  zone_name TEXT,
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ,
  dwell_time_seconds INTEGER,
  avg_x FLOAT,
  avg_y FLOAT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_location_history_event 
  ON location_history(event_id, entry_time DESC);

CREATE INDEX idx_location_history_zone 
  ON location_history(zone_id, entry_time DESC);

CREATE INDEX idx_location_history_session 
  ON location_history(session_id, entry_time DESC);

COMMENT ON TABLE location_history IS 'Aggregated location data for post-event analytics and sponsor ROI';

-- ============================================
-- 5. ADD CAPACITY FIELDS TO ZONES
-- ============================================
ALTER TABLE zones 
  ADD COLUMN IF NOT EXISTS capacity_limit INTEGER,
  ADD COLUMN IF NOT EXISTS alert_threshold_amber FLOAT DEFAULT 0.8,
  ADD COLUMN IF NOT EXISTS alert_threshold_red FLOAT DEFAULT 1.0;

COMMENT ON COLUMN zones.capacity_limit IS 'Maximum safe capacity for this zone';
COMMENT ON COLUMN zones.alert_threshold_amber IS 'Percentage threshold for amber alert (default 80%)';
COMMENT ON COLUMN zones.alert_threshold_red IS 'Percentage threshold for red alert (default 100%)';

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Attendee Locations: Public read for event, authenticated write
ALTER TABLE attendee_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert location data"
  ON attendee_locations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view locations for their events"
  ON attendee_locations FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'security')
    )
  );

-- Emergency Alerts: Public insert, authenticated read
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create emergency alerts"
  ON emergency_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Event staff can view and manage alerts"
  ON emergency_alerts FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'security')
    )
  );

-- Capacity Alerts: System-generated, staff can view
ALTER TABLE capacity_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event staff can view capacity alerts"
  ON capacity_alerts FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'security')
    )
  );

-- Location History: Event organizers only
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event organizers can view location history"
  ON location_history FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to get current attendee count per zone
CREATE OR REPLACE FUNCTION get_zone_attendee_count(
  p_event_id UUID,
  p_zone_id UUID,
  p_time_window_minutes INTEGER DEFAULT 5
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT session_id)
  INTO v_count
  FROM attendee_locations al
  JOIN zones z ON ST_Contains(
    ST_GeomFromGeoJSON(z.geo_json::text),
    ST_SetSRID(ST_MakePoint(al.x_coord, al.y_coord), 4326)
  )
  WHERE al.event_id = p_event_id
    AND z.id = p_zone_id
    AND al.timestamp > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION get_zone_attendee_count IS 'Get current attendee count in a zone based on recent location data';

-- ============================================
-- 8. TRIGGERS
-- ============================================

-- Auto-update timestamp on emergency_alerts
CREATE OR REPLACE FUNCTION update_emergency_alert_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emergency_alerts_updated_at
  BEFORE UPDATE ON emergency_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_alert_timestamp();
