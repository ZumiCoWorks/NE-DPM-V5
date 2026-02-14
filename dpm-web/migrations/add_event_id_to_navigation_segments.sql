-- Add event_id column to navigation_segments table
-- This fixes the error: "record 'new' has no field 'event_id'"

-- Step 1: Add the column (nullable initially)
ALTER TABLE navigation_segments 
ADD COLUMN IF NOT EXISTS event_id UUID;

-- Step 2: Backfill event_id from floorplan relationship
UPDATE navigation_segments ns
SET event_id = f.event_id
FROM floorplans f
WHERE ns.floorplan_id = f.id
AND ns.event_id IS NULL;

-- Step 3: Add foreign key constraint
ALTER TABLE navigation_segments
ADD CONSTRAINT fk_navigation_segments_event
FOREIGN KEY (event_id) 
REFERENCES events(id) 
ON DELETE CASCADE;

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_navigation_segments_event_id 
ON navigation_segments(event_id);

-- Step 5: Make event_id NOT NULL (after backfill)
ALTER TABLE navigation_segments
ALTER COLUMN event_id SET NOT NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'navigation_segments'
AND column_name = 'event_id';
