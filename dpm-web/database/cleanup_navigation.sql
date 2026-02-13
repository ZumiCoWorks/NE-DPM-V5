-- Complete cleanup of navigation data for fresh start
-- Run this in Supabase SQL Editor

-- Step 1: Delete segments first (foreign key constraint)
DELETE FROM navigation_segments 
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5';

-- Step 2: Delete all nodes
DELETE FROM navigation_points 
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5';

-- Step 3: Verify cleanup
SELECT 
    'Segments' as table_name,
    COUNT(*) as remaining_count 
FROM navigation_segments 
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
UNION ALL
SELECT 
    'Nodes' as table_name,
    COUNT(*) as remaining_count 
FROM navigation_points 
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5';

-- Expected result: Both should show 0
