-- Add event_id column to navigation_points table
-- This fixes the error: "column navigation_points.event_id does not exist"

-- Step 1: Add the column (nullable initially to allow existing data)
ALTER TABLE navigation_points 
ADD COLUMN IF NOT EXISTS event_id UUID;

-- Step 2: Backfill event_id from floorplan relationship
UPDATE navigation_points np
SET event_id = f.event_id
FROM floorplans f
WHERE np.floorplan_id = f.id
AND np.event_id IS NULL;

-- Step 3: Add foreign key constraint
ALTER TABLE navigation_points
ADD CONSTRAINT fk_navigation_points_event
FOREIGN KEY (event_id) 
REFERENCES events(id) 
ON DELETE CASCADE;

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_navigation_points_event_id 
ON navigation_points(event_id);

-- Step 5: Make event_id NOT NULL (after backfill)
ALTER TABLE navigation_points
ALTER COLUMN event_id SET NOT NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'navigation_points'
AND column_name = 'event_id';
