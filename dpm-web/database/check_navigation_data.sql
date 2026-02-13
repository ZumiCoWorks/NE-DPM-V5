-- Check all navigation data for your event
-- Run this in Supabase SQL Editor

-- 1. Check navigation points (nodes)
SELECT 
    id,
    name,
    point_type,
    is_destination,
    gps_lat,
    gps_lng,
    x_coord,
    y_coord,
    created_at
FROM navigation_points 
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
ORDER BY created_at DESC;

-- 2. Check navigation segments (paths)
SELECT 
    id,
    start_node_id,
    end_node_id,
    is_bidirectional,
    created_at
FROM navigation_segments 
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
ORDER BY created_at DESC;

-- 3. Summary counts
SELECT 
    'Nodes' as type,
    COUNT(*) as count,
    COUNT(CASE WHEN point_type = 'poi' THEN 1 END) as pois,
    COUNT(CASE WHEN point_type = 'node' THEN 1 END) as regular_nodes
FROM navigation_points 
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
UNION ALL
SELECT 
    'Segments' as type,
    COUNT(*) as count,
    NULL as pois,
    NULL as regular_nodes
FROM navigation_segments 
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5';

-- 4. Check if nodes exist but with wrong event_id
SELECT 
    event_id,
    COUNT(*) as node_count
FROM navigation_points
GROUP BY event_id
ORDER BY node_count DESC
LIMIT 10;
