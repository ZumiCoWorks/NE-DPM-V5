# Fix: "Failed to fetch" Error When Running Migration

## Problem
The `001_complete_schema.sql` file is too large (610 lines) and times out when running in Supabase Dashboard.

## ✅ SOLUTION: Run Migration in 3 Parts

I've split the migration into 3 smaller files for you. Run them **in order**:

### Step 1: Run Part 1 (Tables)
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project: `https://uzhfjyoztmirybnyifnu.supabase.co`
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Open the file: `migration_part1.sql` on your computer
6. Copy the **entire contents**
7. Paste into Supabase SQL Editor
8. Click **Run** (bottom right)
9. ✅ Wait for "Success" message

### Step 2: Run Part 2 (Indexes & Policies)
1. In Supabase SQL Editor, click **New Query** again
2. Open the file: `migration_part2.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run**
6. ✅ Wait for "Success"

### Step 3: Run Part 3 (Views & Triggers)
1. Click **New Query** again
2. Open the file: `migration_part3.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run**
6. ✅ Wait for "Success"

### Step 4: Verify Setup
1. In Supabase Dashboard, go to **Table Editor**
2. You should see these tables:
   - `users`
   - `organizations`
   - `venues`
   - `events`
   - `floorplans`
   - `navigation_points`
   - `booths` ← **Check this has `gps_latitude` and `gps_longitude` columns**
   - `cdv_reports`
   - `engagement_sessions`
   - More...

3. Click on `booths` table
4. Check the columns include:
   - ✅ `gps_latitude`
   - ✅ `gps_longitude`
   - ✅ `zone_name`

---

## Alternative: Use Supabase CLI (Advanced)

If the above still fails, you can use the Supabase CLI:

### Install Supabase CLI:
```bash
npm install -g supabase
```

### Login & Link to Project:
```bash
supabase login
supabase link --project-ref uzhfjyoztmirybnyifnu
```

### Run Migration:
```bash
cd "/Users/zumiww/Documents/NE DPM V5"
supabase db push
```

---

## Other Troubleshooting

### If you get "Permission denied" errors:
- Make sure you're using the **Service Role Key** (not Anon Key)
- The Service Role Key is in your `.env` file: `SUPABASE_SERVICE_ROLE_KEY`

### If tables already exist:
- The migration uses `DROP TABLE IF EXISTS CASCADE` so it's safe to re-run
- It will drop existing tables and recreate them
- **⚠️ WARNING:** This will delete all existing data!

### If you want to keep existing data:
1. Don't run the full migration
2. Instead, manually add just the new columns:
   ```sql
   ALTER TABLE booths ADD COLUMN IF NOT EXISTS gps_latitude DECIMAL(10,8);
   ALTER TABLE booths ADD COLUMN IF NOT EXISTS gps_longitude DECIMAL(11,8);
   ALTER TABLE booths ADD COLUMN IF NOT EXISTS zone_name VARCHAR(100);
   CREATE INDEX IF NOT EXISTS idx_booths_gps ON booths(gps_latitude, gps_longitude);
   ```

---

## Next Step After Migration Succeeds

Once all 3 parts run successfully, proceed to:

**Load AFDA Event Data:**
1. Open `setup-afda-event.sql` in a text editor
2. Copy entire contents
3. Paste into Supabase SQL Editor → New Query
4. Click **Run**
5. Should create AFDA venue, event, and 10 booths

---

**Let me know if any part fails and I'll help debug!**

