-- PHASE 1: Clean Slate - Delete All Test Data
-- WARNING: This will delete ALL data. Make sure you want to start fresh!

-- Step 1: Delete navigation data (must be first due to foreign keys)
DELETE FROM navigation_segments;
DELETE FROM navigation_points;

-- Step 2: Delete floorplans
DELETE FROM floorplans;

-- Step 3: Delete events
DELETE FROM events;

-- Step 4: Delete venues
DELETE FROM venues;

-- Step 5: Verify everything is deleted
SELECT 
    'venues' as table_name, 
    COUNT(*) as remaining_count 
FROM venues
UNION ALL 
SELECT 'events', COUNT(*) FROM events
UNION ALL 
SELECT 'floorplans', COUNT(*) FROM floorplans
UNION ALL 
SELECT 'navigation_points', COUNT(*) FROM navigation_points
UNION ALL 
SELECT 'navigation_segments', COUNT(*) FROM navigation_segments;

-- Expected result: All counts should be 0
