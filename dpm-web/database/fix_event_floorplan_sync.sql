-- QUICK FIX: Ensure event_id and floorplan_id stay in sync
-- Run this in Supabase SQL Editor

-- Step 1: Create trigger function to auto-sync event_id from floorplan
CREATE OR REPLACE FUNCTION sync_navigation_event_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-populate event_id from the floorplan's event_id
    IF NEW.floorplan_id IS NOT NULL THEN
        NEW.event_id := (
            SELECT event_id FROM floorplans 
            WHERE id = NEW.floorplan_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create triggers for navigation_points
DROP TRIGGER IF EXISTS sync_nav_points_event ON navigation_points;
CREATE TRIGGER sync_nav_points_event
    BEFORE INSERT OR UPDATE ON navigation_points
    FOR EACH ROW
    EXECUTE FUNCTION sync_navigation_event_id();

-- Step 3: Create triggers for navigation_segments
DROP TRIGGER IF EXISTS sync_nav_segments_event ON navigation_segments;
CREATE TRIGGER sync_nav_segments_event
    BEFORE INSERT OR UPDATE ON navigation_segments
    FOR EACH ROW
    EXECUTE FUNCTION sync_navigation_event_id();

-- Step 4: Fix existing data - sync event_id from floorplan_id
UPDATE navigation_points np
SET event_id = (
    SELECT event_id FROM floorplans 
    WHERE id = np.floorplan_id
)
WHERE floorplan_id IS NOT NULL;

UPDATE navigation_segments ns
SET event_id = (
    SELECT event_id FROM floorplans 
    WHERE id = ns.floorplan_id
)
WHERE floorplan_id IS NOT NULL;

-- Step 5: Verify the fix
SELECT 
    'Before Fix' as status,
    COUNT(*) as mismatched_nodes
FROM navigation_points np
JOIN floorplans f ON f.id = np.floorplan_id
WHERE np.event_id != f.event_id;

-- Should return 0 mismatched nodes

SELECT 
    'Summary' as info,
    COUNT(DISTINCT event_id) as events_with_nodes,
    COUNT(*) as total_nodes
FROM navigation_points;
