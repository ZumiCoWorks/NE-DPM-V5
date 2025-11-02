# ⚡ Quick Start - 5 Minutes to Get Running

## 🎯 Your New Database Setup

**Database URL:** `https://uzhfjyoztmirybnyifnu.supabase.co`  
**Status:** Empty and ready for setup ✅

---

## 📋 Step 1: Apply Database Schema (2 minutes)

### **Open Supabase SQL Editor:**

https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu/sql/new

### **Copy the Migration:**

1. Open this file in your editor:
   ```
   /Users/zumiww/Documents/NE DPM V5/supabase/migrations/001_complete_schema.sql
   ```

2. **Select All** (Cmd+A)

3. **Copy** (Cmd+C)

### **Run in Supabase:**

1. **Paste** into the SQL Editor

2. Click **"Run"** (bottom right)

3. Wait ~10 seconds

4. Look for **"Success"** message ✅

---

## 📋 Step 2: Get Your Anon Key (1 minute)

### **Open Supabase Settings:**

https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu/settings/api

### **Copy the Anon Key:**

Look for **"anon" / "public"** key (starts with `eyJhbGci...`)

### **Update .env:**

Open `/Users/zumiww/Documents/NE DPM V5/.env` and replace this line:
```
VITE_SUPABASE_ANON_KEY=TEMP_ANON_KEY_NEEDED
```

With:
```
VITE_SUPABASE_ANON_KEY=eyJhbGci... (paste your anon key here)
```

**Save the file.**

---

## 📋 Step 3: Restart Backend (1 minute)

```bash
cd "/Users/zumiww/Documents/NE DPM V5"

# Kill any existing processes
pkill -f "npm run dev"
lsof -ti :3001 | xargs kill -9 2>/dev/null

# Start fresh
npm run dev
```

---

## 📋 Step 4: Test Everything (1 minute)

### **Test B2B Dashboard:**

Open: http://localhost:5173

You should see:
- ✅ Login/Dashboard
- ✅ Navigation tabs (Dashboard, Events, Venues, Quicket, CDV)

### **Test Mobile App:**

The Expo bundler should still be running from before.
If not:
```bash
cd "/Users/zumiww/Documents/NE DPM V5/mobile-app"
npx expo start --clear
```

Scan the QR code and you should see the login screen.

---

## ✅ Verification

After Step 1 (database migration), verify it worked:

Go back to: https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu/sql/new

Run this query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**You should see these tables:**
- analytics_events
- booths
- cdv_reports
- data_access_requests
- data_audit_log
- data_consents
- data_deletion_requests
- engagement_sessions
- events
- floorplans
- navigation_points
- organizations
- quicket_integrations
- users
- venues

**Plus 3 views:**
- booth_engagement_summary
- event_performance_summary  
- sponsor_roi_summary

---

## 🎯 What You'll Have

After these 4 steps:

✅ **Fresh Supabase database** with complete schema  
✅ **B2B Dashboard** connected to database  
✅ **B2C Mobile App** connected to database  
✅ **Quicket Integration** ready to use  
✅ **CDV Reporting** fully functional  
✅ **POPIA/GDPR Compliance** built-in (consent tracking, data access/deletion requests)  

---

## 💡 Why This Approach?

**Fresh Database Benefits:**
- ✅ No legacy data or schema conflicts
- ✅ Clean start with correct relationships
- ✅ All RLS policies properly configured
- ✅ Optimized indexes from the start

**Shared Database Benefits:**
- ✅ Real-time data flow (mobile → dashboard)
- ✅ No syncing needed
- ✅ Single source of truth
- ✅ Lower costs

---

## 🆘 Troubleshooting

### **Migration failed?**
- Make sure you copied the ENTIRE file
- Check for "Success" message in Supabase
- Try refreshing the SQL editor page

### **Can't find anon key?**
- Go to: Settings → API → "Project API keys"
- Look for "anon" or "public" key
- NOT the service_role key!

### **Backend won't start?**
- Check `.env` has all required fields
- Try: `pkill -f node` to kill all Node processes
- Then restart: `npm run dev`

---

## 🎉 Ready to Demo!

Once these 4 steps are done:

1. **Create an event** in the B2B dashboard
2. **Add booths** with QR codes
3. **Open mobile app** and see the event
4. **Scan a QR code** to simulate engagement
5. **View CDV report** in B2B dashboard

**You're ready for your November 15th demo!** 🚀

---

## 📊 Database Stats

After migration, you'll have:

| Item | Count |
|------|-------|
| Tables | 15 |
| Views | 3 |
| Indexes | 40+ |
| RLS Policies | 35+ |
| Triggers | 12 |

**All optimized for B2B + B2C integration with POPIA/GDPR compliance.**


