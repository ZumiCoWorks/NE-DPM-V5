# 🚀 AFDA Grad Fest - Complete Setup Guide

## Step-by-Step Instructions (Do in Order!)

---

## ✅ **STEP 1: Set Up Supabase Database**

### **1a. Open Supabase SQL Editor**

Go to: https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu/sql/new

---

### **1b. Apply Main Database Migration**

**File:** `/supabase/migrations/001_complete_schema.sql`

**What to do:**
1. Open `001_complete_schema.sql` in your code editor
2. Select ALL (Cmd+A)
3. Copy (Cmd+C)
4. Paste into Supabase SQL Editor
5. Click **"Run"** (bottom right)
6. Wait ~15-20 seconds
7. Look for **"Success"** ✅

**This creates:**
- 15 database tables (users, venues, events, booths, etc.)
- 3 analytics views
- 40+ indexes
- RLS policies
- POPIA/GDPR compliance tables

---

### **1c. Verify Migration Worked**

Run this in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**You should see 15 tables including:**
- venues
- events
- booths
- cdv_reports
- etc.

---

## ✅ **STEP 2: Add AFDA Grad Fest Data**

### **2a. Open setup-afda-event.sql**

**File:** `/setup-afda-event.sql`

**What to do:**
1. Open in your code editor
2. Select ALL (Cmd+A)
3. Copy (Cmd+C)
4. Paste into Supabase SQL Editor
5. Click **"Run"**
6. Look for **"Success"** ✅

**This creates:**
- AFDA Campus venue
- AFDA Grad Fest 2025 event
- 15 booths with QR codes

---

### **2b. Verify Data Loaded**

Run this:

```sql
-- Check venue
SELECT * FROM venues WHERE name = 'AFDA Campus';

-- Check event
SELECT * FROM events WHERE name = 'AFDA Grad Fest 2025';

-- Check booths (should see 15)
SELECT name, sponsor_tier, qr_code 
FROM booths 
WHERE event_id = '00000000-0000-0000-0000-000000000002'::uuid
ORDER BY name;
```

---

## ✅ **STEP 3: Update GPS Coordinates (IMPORTANT!)**

The SQL file has **placeholder GPS coordinates**. You need to update them with real ones from AFDA campus.

### **Option A: Quick Update (Use Google Maps)**

1. Go to Google Maps
2. Search "AFDA Johannesburg"
3. Right-click on different buildings/areas
4. Copy latitude/longitude
5. Update the SQL script

### **Option B: Walk the Campus (Recommended)**

**Do this on Nov 1-5 (campus walkthrough):**

1. Download a GPS logging app (e.g., "GPS Test" on Android, "Compass" on iOS)
2. Walk to each booth location
3. Record exact lat/long coordinates
4. Update database:

```sql
-- Update booth coordinates
UPDATE booths 
SET x_coordinate = -26.107123, -- Your actual latitude
    y_coordinate = 28.056456   -- Your actual longitude
WHERE id = '10000000-0000-0000-0000-000000000001'::uuid; -- Film School booth

-- Repeat for all 15 booths
```

**Why this matters:** GPS accuracy = better tracking = better demo!

---

## ✅ **STEP 4: Generate QR Codes**

### **4a. Open QR Code Generator**

**File:** `/generate-qr-codes.html`

**What to do:**
1. Open `generate-qr-codes.html` in Chrome/Safari
2. Page auto-generates 15 QR codes
3. Click **"Download All as Images"**
4. Save to a folder (e.g., `AFDA_QR_Codes/`)

---

### **4b. Print QR Codes**

**Option A: Professional Printing (Recommended)**

- Go to Postnet/CopyWorld
- Print on **A5 paper** (148 x 210 mm)
- **Laminate** each one (R10-15 each)
- Total cost: ~R300-400 for 15 QR codes

**Option B: DIY Printing**

- Print at home/school on regular paper
- Use clear packaging tape to "laminate"
- Cheaper but less durable

---

### **4c. QR Code Placement Strategy**

**Where to place:**
- Eye level (1.5m from ground)
- Well-lit areas (not in shadows)
- Near booth entrance (not hidden behind tables)
- Protected from rain (if outdoor booths)

**When to place:**
- Nov 14 (setup day) - get permission from event organizers
- Or morning of Nov 15 (arrive 7am)

---

## ✅ **STEP 5: Mobile App Setup**

### **5a. Update API Configuration**

**File:** `mobile-app/app.config.ts`

Update the event ID:

```typescript
extra: {
  apiBaseUrl: process.env.API_BASE_URL || 'http://192.168.8.153:3001/api',
  quicketMode: process.env.QUICKET_MODE || 'mock',
  quicketApiKey: process.env.QUICKET_API_KEY || '',
  afdaEventId: '00000000-0000-0000-0000-000000000002' // AFDA Grad Fest event ID
}
```

---

### **5b. Update Mobile App to Show AFDA Event**

**File:** `mobile-app/services/ApiClient.ts`

Make sure it fetches the AFDA event:

```typescript
async getEvents() {
  try {
    const res = await fetch(`${API_BASE}/events/public`)
    const data = await res.json()
    
    // Filter to show only AFDA Grad Fest
    const afdaEvent = data.events.find(e => 
      e.id === '00000000-0000-0000-0000-000000000002'
    )
    
    return { events: afdaEvent ? [afdaEvent] : data.events }
  } catch (error) {
    console.error('Error fetching events:', error)
    return { events: [] }
  }
}
```

---

## ✅ **STEP 6: Test Everything**

### **6a. Database Test**

```sql
-- Verify booth QR codes are unique
SELECT qr_code, COUNT(*) 
FROM booths 
GROUP BY qr_code 
HAVING COUNT(*) > 1;
-- Should return 0 rows (no duplicates)

-- Check event dates
SELECT name, start_date, end_date 
FROM events 
WHERE name = 'AFDA Grad Fest 2025';
-- Should show Nov 15, 2025
```

---

### **6b. QR Code Test**

1. Open `generate-qr-codes.html` in browser
2. Use your phone's camera to scan one QR code
3. It should show the booth ID (e.g., `AFDA_BOOTH_FILM_10000000...`)
4. Test 2-3 different codes to verify uniqueness

---

### **6c. Mobile App Test** (Once you build it)

1. Download app on your phone
2. Open app
3. Should see "AFDA Grad Fest 2025"
4. Tap it → should see 15 booths
5. Scan a QR code → should log to database
6. Check Supabase: `SELECT * FROM cdv_reports ORDER BY created_at DESC LIMIT 5;`

---

## ✅ **STEP 7: Marketing Push**

**Timeline:**

**Nov 1-7 (2 weeks before):**
- [ ] Post Instagram carousel (use `AFDA_MARKETING_KIT.md`)
- [ ] Email AFDA student list
- [ ] Post in WhatsApp groups
- [ ] Print 10 posters for campus

**Nov 8-14 (1 week before):**
- [ ] Instagram story countdown
- [ ] WhatsApp reminder
- [ ] TestFlight/Play Store links ready

**Nov 14 (day before):**
- [ ] Place QR codes at booths
- [ ] Final app deployment
- [ ] Charge all devices!

**Nov 15 (launch day):**
- [ ] Arrive 7am
- [ ] Verify QR codes
- [ ] Monitor dashboard
- [ ] Celebrate! 🎉

---

## 📊 **Success Metrics**

### **Minimum (Pass Assessment):**
- 20+ app downloads
- 10+ active users
- 40+ booth visits
- 25+ QR scans
- Dashboard shows real data

### **Target (Impressive):**
- 60+ app downloads
- 35+ active users
- 150+ booth visits
- 80+ QR scans
- Live demo for lecturers

### **Stretch (Legendary):**
- 150+ app downloads
- 80+ active users
- 400+ booth visits
- 200+ QR scans
- 3+ corporate inquiries

---

## 🆘 **Troubleshooting**

### **Problem: "venues table doesn't exist"**

**Solution:** Run `/supabase/migrations/001_complete_schema.sql` first!

---

### **Problem: "Duplicate key error" when running setup-afda-event.sql**

**Solution:** The script has `ON CONFLICT` handlers. If it still fails:

```sql
-- Delete existing AFDA data
DELETE FROM booths WHERE event_id = '00000000-0000-0000-0000-000000000002'::uuid;
DELETE FROM events WHERE id = '00000000-0000-0000-0000-000000000002'::uuid;
DELETE FROM venues WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Then re-run setup-afda-event.sql
```

---

### **Problem: QR codes not generating in browser**

**Solution:**
- Make sure you're using Chrome/Safari (not Firefox)
- Check browser console for errors (F12)
- Try refreshing the page

---

### **Problem: GPS coordinates are way off**

**Solution:**
- Walk the campus with GPS app
- Update coordinates in database:
  ```sql
  UPDATE booths SET x_coordinate = -26.xxx, y_coordinate = 28.xxx WHERE name = 'Booth Name';
  ```

---

## 📝 **Quick Reference**

### **Key UUIDs:**

```
AFDA Campus Venue:    00000000-0000-0000-0000-000000000001
AFDA Grad Fest Event: 00000000-0000-0000-0000-000000000002
Booths:               10000000-0000-0000-0000-0000000000XX (01-15)
```

### **Key Dates:**

```
Nov 1-5:   Campus walkthrough, update GPS coords
Nov 8:     Deploy to TestFlight/Play Store
Nov 14:    Setup QR codes
Nov 15:    LAUNCH DAY! 🚀
Nov 16:    Post-event analysis, testimonials
```

### **Important Links:**

```
Supabase Dashboard: https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu
SQL Editor:         https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu/sql/new
Marketing Kit:      /AFDA_MARKETING_KIT.md
QR Generator:       /generate-qr-codes.html
```

---

## ✅ **Final Checklist (Print This!)**

**Database:**
- [ ] 001_complete_schema.sql applied ✅
- [ ] setup-afda-event.sql applied ✅
- [ ] 15 booths visible in database ✅
- [ ] GPS coordinates updated ✅

**QR Codes:**
- [ ] 15 QR codes generated ✅
- [ ] Printed & laminated ✅
- [ ] Tested (scanned with phone) ✅
- [ ] Ready to place Nov 14 ✅

**Mobile App:**
- [ ] Shows AFDA Grad Fest event ✅
- [ ] Booth list loads ✅
- [ ] QR scanner works ✅
- [ ] Data logs to Supabase ✅

**Marketing:**
- [ ] Instagram posts scheduled ✅
- [ ] WhatsApp messages sent ✅
- [ ] Posters printed ✅
- [ ] Email blast sent ✅

**Event Day:**
- [ ] QR codes placed at booths ✅
- [ ] Laptop charged (for dashboard) ✅
- [ ] Phone charged (for demo) ✅
- [ ] Backup screenshots prepared ✅

---

**You're ready to launch! Let's make AFDA Grad Fest 2025 legendary!** 🚀🎬

