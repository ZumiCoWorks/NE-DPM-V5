-- Deduplication Script: Keep only one node per name
-- This keeps the FIRST occurrence of each node name and deletes the rest

-- Event ID: f0ca4b22-6d25-4f2b-8360-de84d69395f5

-- Step 1: Delete duplicate segments first (segments connecting to nodes we'll delete)
WITH nodes_to_keep AS (
  SELECT DISTINCT ON (name) id
  FROM navigation_points
  WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
  ORDER BY name, created_at DESC
),
nodes_to_delete AS (
  SELECT id
  FROM navigation_points
  WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
  AND id NOT IN (SELECT id FROM nodes_to_keep)
)
DELETE FROM navigation_segments
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
AND (
  start_node_id IN (SELECT id FROM nodes_to_delete)
  OR end_node_id IN (SELECT id FROM nodes_to_delete)
);

-- Step 2: Delete duplicate nodes (keep only the most recent one per name)
WITH nodes_to_keep AS (
  SELECT DISTINCT ON (name) id
  FROM navigation_points
  WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
  ORDER BY name, created_at DESC
)
DELETE FROM navigation_points
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
AND id NOT IN (SELECT id FROM nodes_to_keep);

-- Verification: Check remaining nodes
SELECT name, COUNT(*) as count
FROM navigation_points
WHERE event_id = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5'
GROUP BY name
ORDER BY name;

-- Should show ~20 unique nodes (4 POIs + 12 numbered nodes + 4 named POIs)
