-- Query current database schema to understand relationships
-- Run this in Supabase SQL Editor

-- 1. Check events table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- 2. Check floorplans table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'floorplans'
ORDER BY ordinal_position;

-- 3. Check navigation_points table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'navigation_points'
ORDER BY ordinal_position;

-- 4. Check all events and their floorplans
SELECT 
    e.id as event_id,
    e.name as event_name,
    e.created_at as event_created,
    f.id as floorplan_id,
    f.image_url,
    (SELECT COUNT(*) FROM navigation_points WHERE event_id = e.id) as node_count
FROM events e
LEFT JOIN floorplans f ON f.event_id = e.id
ORDER BY e.created_at DESC;

-- 5. Check foreign key relationships
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('events', 'floorplans', 'navigation_points', 'navigation_segments')
ORDER BY tc.table_name;
