-- Database Cleanup Script: Remove Duplicate Navigation Nodes
-- This script removes all nodes without GPS coordinates (Classic Editor nodes)
-- and their associated segments, keeping only Leaflet Editor nodes

-- Event ID
-- f0ca4b22-6d25-4f2b-8360-de84d69395f5

-- Step 1: Delete segments connecting to nodes without GPS
DELETE FROM navigation_segments
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
AND (
  start_node_id IN (
    SELECT id FROM navigation_points 
    WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5' 
    AND (gps_lat IS NULL OR gps_lng IS NULL)
  )
  OR end_node_id IN (
    SELECT id FROM navigation_points 
    WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5' 
    AND (gps_lat IS NULL OR gps_lng IS NULL)
  )
);

-- Step 2: Delete nodes without GPS coordinates
DELETE FROM navigation_points
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
AND (gps_lat IS NULL OR gps_lng IS NULL);

-- Verification queries (run after cleanup)
-- Check remaining nodes
SELECT COUNT(*) as remaining_nodes 
FROM navigation_points 
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5';

-- Check remaining segments
SELECT COUNT(*) as remaining_segments 
FROM navigation_segments 
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5';

-- List remaining nodes
SELECT id, name, gps_lat, gps_lng, is_destination, point_type
FROM navigation_points
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
ORDER BY name;
