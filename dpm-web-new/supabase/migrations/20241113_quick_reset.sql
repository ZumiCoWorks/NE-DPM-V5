-- QUICK SUPABASE RESET - SQL Editor Version
-- Copy and paste this directly into Supabase SQL Editor
-- ⚠️ This will delete ALL data but is safer than CLI reset

-- Step 1: Drop all custom tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.map_qr_nodes CASCADE;
DROP TABLE IF EXISTS public.floorplans CASCADE;
DROP TABLE IF EXISTS public.ar_campaigns CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Drop custom functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 3: Verify clean slate
SELECT '✅ Reset complete! Database is now clean.' as status;
SELECT 'Remaining tables:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Step 4: Now apply your clean schema
-- Copy and paste the contents of:
-- /Users/zumiww/Documents/NE DPM V5/dpm-web-new/supabase/migrations/20241113_clean_schema.sql

-- Step 5: (Optional) Add seed data
-- Copy and paste the contents of:
-- /Users/zumiww/Documents/NE DPM V5/dpm-web-new/supabase/migrations/20241113_seed_data.sql