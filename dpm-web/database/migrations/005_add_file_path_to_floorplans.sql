-- Migration: Add file_path column to floorplans table
-- Needed for deleting files from storage when floorplan is deleted

ALTER TABLE floorplans 
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'floorplans' 
AND column_name = 'file_path';
