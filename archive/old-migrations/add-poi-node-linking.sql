-- Link POIs to Navigation Nodes for Pathfinding
-- This allows POIs (destinations) to connect to the navigation graph

-- Add linked_node_id to navigation_points table
-- When a POI is created, it can be linked to a nearby navigation node
-- Pathfinding will route to that node, then the POI is "at" that node

ALTER TABLE public.navigation_points 
ADD COLUMN IF NOT EXISTS linked_node_id UUID REFERENCES navigation_points(id) ON DELETE SET NULL;

-- Add flag to mark which points are destinations (POIs) vs waypoints (nodes)
ALTER TABLE public.navigation_points 
ADD COLUMN IF NOT EXISTS is_destination BOOLEAN DEFAULT false;

-- Add description/instructions for navigation nodes
ALTER TABLE public.navigation_points 
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Comments
COMMENT ON COLUMN navigation_points.linked_node_id IS 'For POIs: the navigation node closest to this POI (used as pathfinding terminus)';
COMMENT ON COLUMN navigation_points.is_destination IS 'True if this is a destination POI, false if waypoint node';
COMMENT ON COLUMN navigation_points.instructions IS 'Turn-by-turn instructions or landmarks at this point';

-- Example update: Mark existing POIs
-- UPDATE navigation_points SET is_destination = true WHERE poi_name IS NOT NULL AND poi_name != '';
