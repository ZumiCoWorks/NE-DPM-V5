-- Add navigation segments table for path connections between nodes
-- Segments connect navigation_points (nodes) to create walkable paths

CREATE TABLE IF NOT EXISTS public.navigation_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  floorplan_id UUID NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
  start_node_id UUID NOT NULL REFERENCES navigation_points(id) ON DELETE CASCADE,
  end_node_id UUID NOT NULL REFERENCES navigation_points(id) ON DELETE CASCADE,
  is_bidirectional BOOLEAN DEFAULT true,
  distance_meters DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_navigation_segments_event ON navigation_segments(event_id);
CREATE INDEX IF NOT EXISTS idx_navigation_segments_floorplan ON navigation_segments(floorplan_id);
CREATE INDEX IF NOT EXISTS idx_navigation_segments_start_node ON navigation_segments(start_node_id);
CREATE INDEX IF NOT EXISTS idx_navigation_segments_end_node ON navigation_segments(end_node_id);

-- Comments
COMMENT ON TABLE navigation_segments IS 'Path segments connecting navigation nodes for wayfinding';
COMMENT ON COLUMN navigation_segments.start_node_id IS 'Starting navigation point (node) of this segment';
COMMENT ON COLUMN navigation_segments.end_node_id IS 'Ending navigation point (node) of this segment';
COMMENT ON COLUMN navigation_segments.is_bidirectional IS 'Whether path can be traversed in both directions (default true)';
COMMENT ON COLUMN navigation_segments.distance_meters IS 'Optional: actual walking distance in meters';

-- RLS Policies
ALTER TABLE navigation_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view navigation segments" ON navigation_segments;
CREATE POLICY "Anyone can view navigation segments"
  ON navigation_segments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert navigation segments" ON navigation_segments;
CREATE POLICY "Authenticated users can insert navigation segments"
  ON navigation_segments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own navigation segments" ON navigation_segments;
CREATE POLICY "Users can update their own navigation segments"
  ON navigation_segments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = navigation_segments.event_id
      AND events.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own navigation segments" ON navigation_segments;
CREATE POLICY "Users can delete their own navigation segments"
  ON navigation_segments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = navigation_segments.event_id
      AND events.organizer_id = auth.uid()
    )
  );
