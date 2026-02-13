-- Check which event has the 18 nodes and verify floorplan relationship
-- Run this in Supabase SQL Editor

SELECT 
    e.id as event_id,
    e.name as event_name,
    f.id as floorplan_id,
    COUNT(np.id) as node_count,
    COUNT(ns.id) as segment_count
FROM events e
LEFT JOIN floorplans f ON f.event_id = e.id
LEFT JOIN navigation_points np ON np.event_id = e.id
LEFT JOIN navigation_segments ns ON ns.event_id = e.id
WHERE e.id IN (
    SELECT DISTINCT event_id FROM navigation_points
)
GROUP BY e.id, e.name, f.id;

-- Also show the event the editor is looking for
SELECT 
    'Editor Looking For' as info,
    'f0ca4b22-6d25-4f2b-8360-de84d69395f5' as event_id,
    e.name as event_name,
    f.id as floorplan_id
FROM events e
LEFT JOIN floorplans f ON f.event_id = e.id
WHERE e.id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5';
