# ✅ Run Migration - Fixed Version

## The Issue
The original migration files had header comments that caused a syntax error when copied to Supabase.

## ✅ SOLUTION: Use These Clean Files

I've created 3 clean files in your project root:
- `migration_part1_clean.sql` (7.1KB)
- `migration_part2_clean.sql` (10KB)
- `migration_part3_clean.sql` (9.0KB)

---

## 📋 Step-by-Step Instructions

### PART 1: Run migration_part1_clean.sql

1. Open this file on your computer: `migration_part1_clean.sql`
2. Select ALL text (Cmd+A / Ctrl+A)
3. Copy (Cmd+C / Ctrl+C)
4. Go to: https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu
5. Click **SQL Editor** in left sidebar
6. Click **New Query** button
7. **DELETE** any placeholder text in the editor
8. Paste your copied SQL (Cmd+V / Ctrl+V)
9. Click **Run** button (bottom right)
10. ✅ Wait for "Success" message (~10 seconds)

### PART 2: Run migration_part2_clean.sql

1. Click **New Query** again
2. Open file: `migration_part2_clean.sql`
3. Select ALL, copy
4. Paste into Supabase SQL Editor
5. Click **Run**
6. ✅ Wait for "Success"

### PART 3: Run migration_part3_clean.sql

1. Click **New Query** again
2. Open file: `migration_part3_clean.sql`
3. Select ALL, copy
4. Paste into Supabase SQL Editor
5. Click **Run**
6. ✅ Wait for "Success"

---

## ✅ Verify Setup

After all 3 parts run successfully:

1. In Supabase Dashboard, go to **Table Editor** (left sidebar)
2. You should see these tables:
   - users
   - organizations
   - venues
   - events
   - floorplans
   - navigation_points
   - **booths** ← Check this one!
   - cdv_reports
   - engagement_sessions
   - analytics_events
   - data_consents
   - data_deletion_requests
   - data_access_requests
   - data_audit_log

3. Click on **booths** table
4. Check the columns include:
   - ✅ id
   - ✅ venue_id
   - ✅ event_id
   - ✅ name
   - ✅ x_coordinate
   - ✅ y_coordinate
   - ✅ **gps_latitude** ← NEW!
   - ✅ **gps_longitude** ← NEW!
   - ✅ **zone_name** ← NEW!
   - ✅ qr_code
   - ✅ is_active

---

## 🎯 Next Step: Load AFDA Event Data

After migration succeeds:

1. Open file: `setup-afda-event.sql`
2. Copy entire contents
3. Supabase SQL Editor → New Query
4. Paste
5. Run
6. Should create:
   - AFDA Campus venue
   - AFDA Grad Fest 2025 event
   - 10 booths

---

## 🆘 If You Still Get Errors

**Common errors and fixes:**

### "relation already exists"
- The tables already exist in your database
- Solution: The migration uses `DROP TABLE IF EXISTS CASCADE` so it's safe to re-run
- Just run it again - it will drop and recreate

### "permission denied"
- You might be logged in with the wrong account
- Make sure you're on project: `uzhfjyoztmirybnyifnu`

### "timeout" or "failed to fetch"
- The SQL is too large for a single request
- Try refreshing your browser
- Or run one section at a time (e.g., just the CREATE TABLE statements)

---

**You're almost there! 🚀**

