-- PHASE 2: Schema Migration - Floorplan-Centric Navigation
-- Run this AFTER cleanup_all_data.sql

-- Step 0: Drop RLS policies that depend on event_id
DROP POLICY IF EXISTS "Users can update their own navigation segments" ON navigation_segments;
DROP POLICY IF EXISTS "Users can delete their own navigation segments" ON navigation_segments;
DROP POLICY IF EXISTS "Users can insert their own navigation segments" ON navigation_segments;
DROP POLICY IF EXISTS "Users can view their own navigation segments" ON navigation_segments;

DROP POLICY IF EXISTS "Users can update their own navigation points" ON navigation_points;
DROP POLICY IF EXISTS "Users can delete their own navigation points" ON navigation_points;
DROP POLICY IF EXISTS "Users can insert their own navigation points" ON navigation_points;
DROP POLICY IF EXISTS "Users can view their own navigation points" ON navigation_points;

-- Step 1: Drop foreign key constraints on event_id
ALTER TABLE navigation_points 
DROP CONSTRAINT IF EXISTS navigation_points_event_id_fkey;

ALTER TABLE navigation_segments 
DROP CONSTRAINT IF EXISTS navigation_segments_event_id_fkey;

-- Step 2: Drop the event_id columns
ALTER TABLE navigation_points DROP COLUMN IF EXISTS event_id;
ALTER TABLE navigation_segments DROP COLUMN IF EXISTS event_id;

-- Step 3: Ensure floorplan_id is NOT NULL (data integrity)
ALTER TABLE navigation_points 
ALTER COLUMN floorplan_id SET NOT NULL;

ALTER TABLE navigation_segments 
ALTER COLUMN floorplan_id SET NOT NULL;

-- Step 4: Create helpful view for querying with event info
CREATE OR REPLACE VIEW navigation_with_event AS
SELECT 
    np.id,
    np.name,
    np.floorplan_id,
    np.x_coord,
    np.y_coord,
    np.gps_lat,
    np.gps_lng,
    np.point_type,
    np.is_destination,
    f.event_id,
    e.name as event_name,
    e.venue_id
FROM navigation_points np
JOIN floorplans f ON f.id = np.floorplan_id
JOIN events e ON e.id = f.event_id;

-- Step 5: Verify schema changes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('navigation_points', 'navigation_segments')
    AND column_name IN ('event_id', 'floorplan_id')
ORDER BY table_name, column_name;

-- Expected: Only floorplan_id should exist, event_id should be gone

-- Step 6: Recreate RLS policies using floorplan-based access control
-- Users can access navigation if they own the event that owns the floorplan

-- Enable RLS
ALTER TABLE navigation_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_segments ENABLE ROW LEVEL SECURITY;

-- Navigation Points Policies
CREATE POLICY "Users can view navigation points for their events"
ON navigation_points FOR SELECT
USING (
    floorplan_id IN (
        SELECT f.id FROM floorplans f
        JOIN events e ON e.id = f.event_id
        WHERE e.organizer_id = auth.uid()
    )
);

CREATE POLICY "Users can insert navigation points for their events"
ON navigation_points FOR INSERT
WITH CHECK (
    floorplan_id IN (
        SELECT f.id FROM floorplans f
        JOIN events e ON e.id = f.event_id
        WHERE e.organizer_id = auth.uid()
    )
);

CREATE POLICY "Users can update navigation points for their events"
ON navigation_points FOR UPDATE
USING (
    floorplan_id IN (
        SELECT f.id FROM floorplans f
        JOIN events e ON e.id = f.event_id
        WHERE e.organizer_id = auth.uid()
    )
);

CREATE POLICY "Users can delete navigation points for their events"
ON navigation_points FOR DELETE
USING (
    floorplan_id IN (
        SELECT f.id FROM floorplans f
        JOIN events e ON e.id = f.event_id
        WHERE e.organizer_id = auth.uid()
    )
);

-- Navigation Segments Policies
CREATE POLICY "Users can view navigation segments for their events"
ON navigation_segments FOR SELECT
USING (
    floorplan_id IN (
        SELECT f.id FROM floorplans f
        JOIN events e ON e.id = f.event_id
        WHERE e.organizer_id = auth.uid()
    )
);

CREATE POLICY "Users can insert navigation segments for their events"
ON navigation_segments FOR INSERT
WITH CHECK (
    floorplan_id IN (
        SELECT f.id FROM floorplans f
        JOIN events e ON e.id = f.event_id
        WHERE e.organizer_id = auth.uid()
    )
);

CREATE POLICY "Users can update navigation segments for their events"
ON navigation_segments FOR UPDATE
USING (
    floorplan_id IN (
        SELECT f.id FROM floorplans f
        JOIN events e ON e.id = f.event_id
        WHERE e.organizer_id = auth.uid()
    )
);

CREATE POLICY "Users can delete navigation segments for their events"
ON navigation_segments FOR DELETE
USING (
    floorplan_id IN (
        SELECT f.id FROM floorplans f
        JOIN events e ON e.id = f.event_id
        WHERE e.organizer_id = auth.uid()
    )
);

COMMENT ON VIEW navigation_with_event IS 
'Helper view to query navigation data with event context. Use this when you need event info.';
