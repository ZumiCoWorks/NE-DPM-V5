# Supabase Project Reset Guide

## ⚠️ WARNING
These operations will DELETE all your data. Make sure you have backups if needed!

## Method 1: Complete Reset (Nuclear Option)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query

### Step 2: Run the Complete Reset Script
Copy and paste this entire script:

```sql
-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE floorplans DISABLE ROW LEVEL SECURITY;
ALTER TABLE map_qr_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE ar_campaigns DISABLE ROW LEVEL SECURITY;

-- Drop all tables (order matters due to foreign keys)
DROP TABLE IF EXISTS map_qr_nodes;
DROP TABLE IF EXISTS floorplans;
DROP TABLE IF EXISTS ar_campaigns;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS profiles;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS handle_new_user();

-- Verify clean slate
SELECT 'Reset complete - no tables should appear below:' as message;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### Step 3: Apply Your Clean Schema
After reset, run your migration files in order:
1. `20241113_clean_schema.sql`
2. `20241113_seed_data.sql`

## Method 2: Selective Reset (Safer Option)

### Option A: Just Drop Data (Keep Structure)
```sql
-- Truncate all tables (removes data but keeps structure)
TRUNCATE TABLE map_qr_nodes CASCADE;
TRUNCATE TABLE floorplans CASCADE;
TRUNCATE TABLE ar_campaigns CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE venues CASCADE;
TRUNCATE TABLE profiles CASCADE;
```

### Option B: Reset Specific Tables
```sql
-- Only reset certain tables
DROP TABLE IF EXISTS map_qr_nodes;
DROP TABLE IF EXISTS floorplans;

-- Recreate just these tables
CREATE TABLE floorplans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  scale_meters_per_pixel NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE map_qr_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  qr_code_id TEXT NOT NULL,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  floor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Method 3: Using Supabase CLI (Recommended)

### Step 1: Reset Local Database
```bash
# From your project root
npx supabase db reset
```

### Step 2: Push Clean Schema
```bash
# Apply your migrations
npx supabase db push
```

## Verification Steps

After any reset method, verify with:

```sql
-- Check what tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Test basic functionality
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM venues;
SELECT COUNT(*) FROM events;
```

## Post-Reset Setup

1. **Create a test user** (if using auth):
```sql
-- This will trigger the handle_new_user function
-- Or manually insert: INSERT INTO profiles (id, email, role) VALUES ('user-uuid', 'test@email.com', 'admin');
```

2. **Insert test data**:
```sql
-- Run the seed data from your migration file
-- Or manually insert test venues/events
```

3. **Test the API**:
```bash
cd server && npm run smoke-test
```

## Emergency Recovery

If something goes wrong, you can:
1. Check Supabase logs in the dashboard
2. Use the Supabase CLI to reset: `npx supabase db reset`
3. Contact Supabase support for project recovery
4. Restore from backups (if you have any)

## Best Practices

1. **Always backup first** if you have important data
2. **Test on a staging project** before production
3. **Use migrations** instead of manual SQL for repeatable deployments
4. **Document your schema** in version control
5. **Use the CLI** for consistent deployments