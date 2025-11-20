-- EMERGENCY FIX: Match column names to what code expects
-- Run this in Supabase SQL Editor RIGHT NOW

-- Add missing columns that code expects
ALTER TABLE public.navigation_points
ADD COLUMN IF NOT EXISTS x_coord NUMERIC,
ADD COLUMN IF NOT EXISTS y_coord NUMERIC;

-- Copy data from existing columns if they have different names
UPDATE public.navigation_points 
SET x_coord = x_coordinate, y_coord = y_coordinate 
WHERE x_coord IS NULL;

-- Make new columns NOT NULL after data is copied
ALTER TABLE public.navigation_points
ALTER COLUMN x_coord SET NOT NULL,
ALTER COLUMN y_coord SET NOT NULL;
