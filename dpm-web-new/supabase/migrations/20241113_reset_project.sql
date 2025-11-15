-- COMPLETE SUPABASE RESET SCRIPT
-- ⚠️ WARNING: This will delete ALL data and reset your project
-- Only run this if you want to start completely fresh

-- Step 1: Disable RLS and drop all policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY;', r.schemaname, r.tablename);
        
        -- Drop all policies on the table
        FOR policy IN (SELECT policyname FROM pg_policies WHERE schemaname = r.schemaname AND tablename = r.tablename)
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', policy.policyname, r.schemaname, r.tablename);
        END LOOP;
    END LOOP;
END $$;

-- Step 2: Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.map_qr_nodes CASCADE;
DROP TABLE IF EXISTS public.floorplans CASCADE;
DROP TABLE IF EXISTS public.ar_campaigns CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 3: Drop all functions and triggers
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 4: Drop all indexes (optional, will be dropped with tables)
-- This is done automatically when tables are dropped

-- Step 5: Clean up auth users (optional - be very careful with this)
-- DELETE FROM auth.users WHERE email NOT LIKE '%@yourdomain.com';

-- Step 6: Reset storage buckets (if needed)
-- DELETE FROM storage.objects WHERE bucket_id = 'floorplans';
-- DELETE FROM storage.buckets WHERE id = 'floorplans';

-- Step 7: Verify everything is clean
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;

-- You should see no tables or functions if the reset was successful

-- Step 8: Now you can apply your clean schema
-- Run your migration files in order:
-- 1. 20241113_clean_schema.sql
-- 2. 20241113_seed_data.sql