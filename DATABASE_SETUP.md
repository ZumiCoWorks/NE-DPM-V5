# Database Setup - NavEaze B2B + B2C Platform

## 🗄️ Database Configuration

You're using the **same Supabase database** from `naveaze-v4`:

```
Database URL: https://zodxwaueujojlmydjhrk.supabase.co
Project: zodxwaueujojlmydjhrk
```

**This is CORRECT** - Both B2B and B2C share the same database for seamless integration.

---

## 📊 Current Database Schema

Your database already has these tables from `naveaze-v4`:

### **Core Tables** (Already Exists)
- ✅ `users` - Organizers, venue managers, admins
- ✅ `organizations` - Company/org profiles
- ✅ `venues` - Event locations
- ✅ `events` - Events at venues
- ✅ `floorplans` - Venue floor plans
- ✅ `navigation_points` - Points of interest (including booths!)
- ✅ `ar_advertisements` - AR content
- ✅ `analytics_events` - General analytics

---

## 🆕 Tables Needed for B2B Features

Run this migration to add B2B-specific features: **`supabase/migrations/010_add_b2b_features.sql`**

This adds:
1. ✅ **`booths`** - Sponsor booth configuration with QR codes
2. ✅ **`cdv_reports`** - Engagement tracking from mobile app
3. ✅ **`quicket_integrations`** - Quicket API settings per organizer
4. ✅ **`engagement_sessions`** - Mobile app session tracking

---

## 🚀 How to Run the Migration

### **Option 1: Supabase Dashboard (Recommended)**

1. Go to: https://supabase.com/dashboard/project/zodxwaueujojlmydjhrk
2. Navigate to: **SQL Editor** (left sidebar)
3. Click: **"New Query"**
4. Copy the entire contents of: `/Users/zumiww/Documents/NE DPM V5/supabase/migrations/010_add_b2b_features.sql`
5. Paste into the SQL editor
6. Click: **"Run"**

---

### **Option 2: Supabase CLI** (If you prefer command line)

```bash
cd "/Users/zumiww/Documents/NE DPM V5"

# Link to your Supabase project (one-time setup)
npx supabase link --project-ref zodxwaueujojlmydjhrk

# Push the migration
npx supabase db push
```

---

## 📋 What This Migration Does

### 1. **Booths Table**
Links to existing `navigation_points` but adds:
- Sponsor name, tier (Gold/Silver/Bronze)
- QR codes for active engagement
- Sponsor branding (logo, website)

**Why:** Separate booth config from navigation points to keep sponsor data organized.

---

### 2. **CDV Reports Table**
Stores engagement data from mobile app:
- Booth visited (zone_name)
- Dwell time (minutes)
- Active engagement (QR scan = true)
- Quicket order ID (for attendee verification)
- Coordinates (x, y)

**Why:** This is your **financial assurance** data - proving sponsor ROI.

---

### 3. **Quicket Integrations Table**
Per-organizer Quicket API settings:
- Encrypted user token
- Mock/live mode toggle
- Last sync timestamp
- Sync status

**Why:** Enable attendee verification via Quicket guest lists.

---

### 4. **Engagement Sessions Table**
Mobile app session tracking:
- Session start/end
- Booths visited count
- QR codes scanned
- Total dwell time

**Why:** High-level analytics for event performance.

---

### 5. **Analytics Views** (Automatically Created)

#### **`booth_engagement_summary`**
Per-booth metrics:
- Total engagements
- Active vs. passive engagements
- Average dwell time
- Unique visitors
- Verified attendees (from Quicket)

#### **`event_performance_summary`**
Per-event metrics:
- Total unique users
- Verified attendees
- Total engagements
- Average dwell time

#### **`sponsor_roi_summary`**
Per-sponsor ROI calculation:
- Unique visitors
- Verified attendees
- Active engagements
- **Estimated revenue** (based on sponsor tier)

**This view is KEY to your B2B value proposition!**

---

## 💡 Database Integration Points

### **B2B Dashboard → Database**

```typescript
// Fetch booth engagement for a sponsor
SELECT * FROM booth_engagement_summary 
WHERE sponsor_name = 'Microsoft';

// Get CDV reports for an event
SELECT * FROM cdv_reports 
WHERE event_id = 'abc-123' 
ORDER BY created_at DESC;

// Check Quicket integration status
SELECT * FROM quicket_integrations 
WHERE organizer_id = 'user-uuid';
```

---

### **B2C Mobile App → Database**

```typescript
// Fetch events (public read)
SELECT * FROM events 
WHERE status = 'active';

// Fetch booths for a venue (public read)
SELECT b.*, np.x_coordinate, np.y_coordinate, np.name as booth_name
FROM booths b
JOIN navigation_points np ON b.navigation_point_id = np.id
WHERE b.venue_id = 'venue-uuid' AND b.is_active = true;

// Submit CDV report (public insert)
INSERT INTO cdv_reports (
  event_id, venue_id, booth_id, mobile_user_id, 
  zone_name, dwell_time_minutes, active_engagement_status,
  x_coordinate, y_coordinate
) VALUES (...);
```

---

## 🔐 Row Level Security (RLS)

The migration sets up proper RLS policies:

### **Booths**
- ✅ Venue managers can manage booths at their venues
- ✅ Event organizers can manage booths for their events
- ✅ **Public can view** active booths (for mobile app)

### **CDV Reports**
- ✅ Organizers can view reports for their events
- ✅ Venue managers can view reports for their venues
- ✅ **Public can insert** reports (mobile app engagement tracking)

### **Quicket Integrations**
- ✅ Users can only manage their own integration settings

### **Engagement Sessions**
- ✅ Organizers can view sessions for their events
- ✅ **Public can insert** sessions (mobile app)

---

## ✅ Verification Steps

After running the migration, verify it worked:

### **Check Tables Exist**

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('booths', 'cdv_reports', 'quicket_integrations', 'engagement_sessions');
```

Expected result: 4 tables

---

### **Check Views Exist**

```sql
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('booth_engagement_summary', 'event_performance_summary', 'sponsor_roi_summary');
```

Expected result: 3 views

---

### **Test Public Read Access (for mobile app)**

```sql
-- This should work without authentication
SELECT * FROM booths WHERE is_active = true LIMIT 1;
SELECT * FROM events WHERE status = 'active' LIMIT 1;
```

---

## 🎯 Next Steps After Migration

1. **Update backend API routes** to query new tables
2. **Update B2B dashboard** to display analytics from new views
3. **Update mobile app** to submit CDV reports
4. **Test end-to-end flow**:
   - Create booth in B2B dashboard
   - Mobile app fetches booth data
   - User scans QR code
   - CDV report appears in dashboard

---

## 📝 Notes

### **Why Share One Database?**

✅ **Seamless Integration**: Mobile app engagement data flows directly to B2B dashboard  
✅ **Real-time Updates**: No data syncing needed  
✅ **Simplified Architecture**: One source of truth  
✅ **Cost Effective**: One Supabase instance

### **Why Not Separate Databases?**

❌ Would require data syncing between B2B and B2C  
❌ More complex infrastructure  
❌ Risk of data inconsistency  
❌ Higher costs

---

## 🆘 Troubleshooting

### **"RLS policy violation"**
- Mobile app should NOT be authenticated for public operations
- Use `anon` key for mobile app, not service role key

### **"Table already exists"**
- That's fine! The migration uses `CREATE TABLE IF NOT EXISTS`
- Just means you've run it before

### **"Column already exists"**
- Also fine! Means partial migration was applied
- Drop the table and re-run, or comment out duplicate lines

---

## 🎉 Ready to Go!

Once this migration runs:

✅ B2B dashboard can display sponsor ROI  
✅ Mobile app can submit engagement data  
✅ Quicket integration can verify attendees  
✅ Everything is connected and working together

**Run the migration in Supabase Dashboard SQL Editor and you're good to go!**


