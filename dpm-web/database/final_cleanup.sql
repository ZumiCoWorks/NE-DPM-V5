-- Final cleanup: Delete ALL navigation data for this event
-- We'll start completely fresh

DELETE FROM navigation_segments
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5';

DELETE FROM navigation_points
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5';

-- Verify cleanup
SELECT 
  (SELECT COUNT(*) FROM navigation_points WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5') as points_count,
  (SELECT COUNT(*) FROM navigation_segments WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5') as segments_count;
