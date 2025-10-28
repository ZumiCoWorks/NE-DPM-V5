# ✅ Migration Successful! Next Steps

## 🎉 You've Completed: Database Schema Setup

All tables, indexes, policies, and views are now created in your Supabase database.

---

## 📋 Step 1: Verify Tables Were Created

1. In Supabase Dashboard, click **Table Editor** (left sidebar)
2. You should see these tables in the list:
   - users
   - organizations  
   - venues
   - events
   - floorplans
   - navigation_points
   - **booths** ← Most important for AFDA!
   - cdv_reports
   - quicket_integrations
   - engagement_sessions
   - analytics_events
   - data_consents
   - data_deletion_requests
   - data_access_requests
   - data_audit_log

3. Click on **booths** table
4. Click **View Columns** or check the column list
5. Verify these NEW columns exist:
   - ✅ **gps_latitude** (DECIMAL)
   - ✅ **gps_longitude** (DECIMAL)
   - ✅ **zone_name** (VARCHAR)

---

## 📋 Step 2: Load AFDA Grad Fest Event Data

Now that the schema is ready, let's add the AFDA event!

### Instructions:

1. Open the file in your editor: `setup-afda-event.sql`
2. **Select ALL text** (Cmd+A / Ctrl+A)
3. **Copy** (Cmd+C / Ctrl+C)
4. Go back to **Supabase Dashboard** → **SQL Editor**
5. Click **New Query**
6. **Paste** the SQL (Cmd+V / Ctrl+V)
7. Click **Run**
8. ✅ Wait for "Success" (~5 seconds)

### What This Creates:

- **1 Venue:** AFDA Campus Johannesburg
- **1 Event:** AFDA Grad Fest 2025 (Nov 15, 2025)
- **10 Booths:**
  1. Film School Showcase
  2. Animation Studio
  3. Post-Production Lab
  4. Screenwriting Corner
  5. Acting Studio
  6. Cinematography Showcase
  7. Live Events Production
  8. Game Design & Interactive Media
  9. Sound Design Lab
  10. Industry Connections Hub

---

## 📋 Step 3: Verify AFDA Data Loaded

After running `setup-afda-event.sql`:

1. In Supabase **Table Editor**, click on **events** table
2. You should see: **"AFDA Grad Fest 2025"**
3. Click on **venues** table
4. You should see: **"AFDA Campus Johannesburg"**
5. Click on **booths** table
6. You should see: **10 booths** listed
7. Check one booth has:
   - ✅ `gps_latitude` value (e.g., -26.107500)
   - ✅ `gps_longitude` value (e.g., 28.056000)
   - ✅ `zone_name` (e.g., "Film Building")

---

## 📋 Step 4: Update GPS Coordinates (CRITICAL!)

⚠️ **The booths currently have placeholder GPS coordinates!**

You MUST update them with real campus locations:

### How to Get Real GPS Coordinates:

1. Go to [Google Maps](https://maps.google.com)
2. Search for "AFDA Johannesburg" or zoom to your campus
3. **For each booth location:**
   - Right-click on the exact spot where the booth will be
   - Click **"What's here?"**
   - Copy the coordinates (format: `-26.107500, 28.056000`)
4. Update the booth in Supabase:
   - Go to **Table Editor** → **booths** table
   - Click on a booth row (e.g., "Film School Showcase")
   - Update the `gps_latitude` and `gps_longitude` fields
   - Click **Save**
5. Repeat for all 10 booths

**OR** you can update them all at once via SQL:

```sql
-- Example: Update Film School Showcase booth
UPDATE booths 
SET 
  gps_latitude = -26.190123,  -- Your real GPS latitude
  gps_longitude = 28.030456   -- Your real GPS longitude
WHERE name = 'Film School Showcase';

-- Repeat for all 10 booths...
```

---

## 📋 Step 5: Test the Mobile App

Now that the database is ready, test the mobile app!

### Backend Setup:

1. Open Terminal
2. Navigate to your project:
   ```bash
   cd "/Users/zumiww/Documents/NE DPM V5"
   ```
3. Start the backend:
   ```bash
   npm run dev
   ```
4. You should see: `Server running on http://localhost:3001`

### Mobile App Setup:

1. Open a **NEW Terminal window** (keep backend running in the first)
2. Navigate to mobile app:
   ```bash
   cd "/Users/zumiww/Documents/NE DPM V5/mobile-app"
   ```
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
4. Start Expo:
   ```bash
   npm start
   ```
5. Scan the QR code with **Expo Go** app on your phone

### Test Flow:

1. App should open and show "AFDA Grad Fest 2025" event
2. Tap the event
3. Should see campus map with 10 booth markers
4. Tap "Film School Showcase"
5. Should see navigation screen with GPS directions
6. Distance should update as you move

---

## 📋 Step 6: Print QR Codes

1. Open in browser: `generate-qr-codes.html`
2. QR codes will auto-generate for all 10 booths
3. Print the page (File → Print or Ctrl/Cmd + P)
4. Cut out each QR code card
5. Place at booth locations on Nov 15

---

## 🎯 You're Now Ready For:

- ✅ Testing the full navigation flow
- ✅ Updating GPS coordinates on campus
- ✅ Printing and placing QR codes
- ✅ Running the demo on Nov 15

---

## 🆘 Troubleshooting

### App shows "No events"
- Backend might not be running
- Check: `npm run dev` is running in terminal
- Check: Mobile app is pointing to correct API URL

### Navigation shows wrong distance
- GPS coordinates are placeholders
- Update them with real campus coordinates (Step 4)

### QR scan doesn't work
- Backend not running
- Check browser console for errors
- Verify booth exists in database

---

## 📊 Current Status

- ✅ Database schema created
- ✅ AFDA event data loaded (after Step 2)
- ⏳ GPS coordinates need updating (Step 4)
- ⏳ Mobile app needs testing (Step 5)
- ⏳ QR codes need printing (Step 6)

---

**Next immediate action: Run Step 2 (Load AFDA Event Data)** 🚀

