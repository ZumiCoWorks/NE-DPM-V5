-- SUPABASE RESET - SQL EDITOR VERSION
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- This is the SAFEST method for resetting your project

-- Step 1: Drop all tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.map_qr_nodes CASCADE;
DROP TABLE IF EXISTS public.floorplans CASCADE;
DROP TABLE IF EXISTS public.ar_campaigns CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Drop custom functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 3: Verification - should show empty results
SELECT '✅ Reset complete! Database is now clean.' as status;
SELECT 'Remaining tables:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Step 4: Now apply the clean schema
-- Run this NEXT: Copy contents of 20241113_clean_schema.sql and paste
-- After that, optionally run 20241113_seed_data.sql for test data