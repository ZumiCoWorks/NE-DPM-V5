-- ============================================
-- Landmark Navigation - Database Schema
-- ============================================
-- Purpose: Add landmark metadata to navigation_points
-- Execute in: Supabase SQL Editor
-- ============================================

-- Step 1: Add landmark columns to navigation_points table
ALTER TABLE navigation_points 
ADD COLUMN IF NOT EXISTS landmark_name TEXT,
ADD COLUMN IF NOT EXISTS landmark_description TEXT,
ADD COLUMN IF NOT EXISTS landmark_photo_url TEXT,
ADD COLUMN IF NOT EXISTS is_landmark BOOLEAN DEFAULT FALSE;

-- Step 2: Create index for faster landmark queries
CREATE INDEX IF NOT EXISTS idx_navigation_points_landmarks 
ON navigation_points(event_id, is_landmark) 
WHERE is_landmark = TRUE;

-- Step 3: Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'navigation_points'
AND column_name IN ('landmark_name', 'landmark_description', 'landmark_photo_url', 'is_landmark')
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Landmark columns added successfully!';
  RAISE NOTICE '📝 Map Editor can now annotate nodes with landmark metadata';
  RAISE NOTICE '🗺️ PWA can use landmarks for weak GPS navigation';
END $$;
