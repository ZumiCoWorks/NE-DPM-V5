# 🚀 START DEMOS NOW - Quick Commands

## ✅ What I Just Did For You:
1. ✅ Created `.env` file with Supabase credentials
2. ✅ Dependencies are already installed (node_modules exist)
3. ✅ Created demo prep guide (`DEMO_PREP_OCT24.md`)

---

## 🎯 What You Need To Do (3 Steps):

### **STEP 1: Get Your Supabase Anon Key (2 minutes)**

The demos need your Supabase anon key for the frontend.

1. Go to: https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu/settings/api
2. Copy the **"anon" / "public"** key (NOT the service_role key)
3. Run this command:

```bash
cd "/Users/zumiww/Documents/NE DPM V5"

# Replace YOUR_ANON_KEY_HERE with the actual key
echo 'VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE' >> .env
```

**Or manually edit `.env` file and replace:**
```
VITE_SUPABASE_ANON_KEY=TEMP_KEY_GET_FROM_SUPABASE
```
with:
```
VITE_SUPABASE_ANON_KEY=eyJhbGci... (your anon key)
```

---

### **STEP 2: Start B2B Dashboard + API (30 seconds)**

Open a terminal and run:

```bash
cd "/Users/zumiww/Documents/NE DPM V5"
npm run dev
```

**This starts:**
- API backend → http://localhost:3001
- Dashboard frontend → http://localhost:5173

**Wait for:**
```
✓ ready in X ms
VITE v6.x.x ready in X ms

➜  Local:   http://localhost:5173/
```

**Then open:** http://localhost:5173

You should see the NavEaze B2B dashboard.

---

### **STEP 3: Start Mobile App (30 seconds)**

Open a **NEW terminal** (keep the first one running!) and run:

```bash
cd "/Users/zumiww/Documents/NE DPM V5/mobile-app"
npm run web
```

**Wait for:**
```
› Opening http://localhost:8081 in the browser...
```

A browser will automatically open showing the mobile app.

---

## ✅ What You Should See:

### **B2B Dashboard (http://localhost:5173):**
- Top nav with tabs: Dashboard, Events, Venues & Booths, Quicket Integration, CDV
- Sidebar with sections
- Modern dark UI

**Click through:**
1. **Events tab** → Should be empty initially (we'll load AFDA data next)
2. **CDV tab** → Should be empty initially  
3. **Venues tab** → Should be empty initially

---

### **Mobile App (http://localhost:8081):**
- Full-screen mobile view
- "NavEaze" branding
- Event selection screen

**Should see:**
- Clean mobile interface
- "No events available" message (we'll load AFDA data next)

---

## 🎯 NEXT: Load Demo Data

Once both are running, you need to:

1. **Load AFDA event data:**
   - Go to: https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu/sql/new
   - Copy contents of `setup-afda-event.sql`
   - Paste and click "Run"
   - This creates: 1 event, 1 venue, 10 booths

2. **Generate demo engagement data:**
   ```bash
   cd "/Users/zumiww/Documents/NE DPM V5"
   npm run demo
   ```
   - This creates fake booth visits, dwell time, QR scans
   - Makes the CDV dashboard look realistic

3. **Refresh both apps:**
   - Refresh dashboard: http://localhost:5173
   - Refresh mobile app: http://localhost:8081
   - Now you'll see AFDA data

---

## 🚨 Troubleshooting

### **Issue: Dashboard shows blank/white screen**

**Check 1: Is the anon key set?**
```bash
cat .env | grep VITE_SUPABASE_ANON_KEY
```
Should show a real key, not "TEMP_KEY_GET_FROM_SUPABASE"

**Check 2: Check browser console**
- Open Developer Tools (F12)
- Look for errors
- Most common: "Invalid API key" → means you need the anon key

---

### **Issue: Mobile app shows "Network request failed"**

**Check: Is API running?**
```bash
curl http://localhost:3001/api/events/public
```

Should return:
```json
{"events":[]}
```

If it fails, the API isn't running. Check the terminal where you ran `npm run dev`.

---

### **Issue: Can't access mobile app from physical phone**

For the demo tomorrow, **just use the web version** (http://localhost:8081).

If you need to test on a physical phone later:
1. Find your local IP: `ipconfig getifaddr en0`
2. Update `mobile-app/app.config.ts`:
   ```typescript
   apiBaseUrl: 'http://YOUR_LOCAL_IP:3001/api'
   ```
3. Scan QR code in Expo Go app

But for the presentation demo, **web version is fine**.

---

## ⏱️ Timeline:

| Task | Time |
|------|------|
| Get anon key | 2 min |
| Start dashboard | 1 min |
| Start mobile app | 1 min |
| Load AFDA data | 5 min |
| Generate demo CDV data | 2 min |
| Test both apps | 5 min |
| **TOTAL** | **~15 min** |

---

## 📋 Quick Checklist:

- [ ] Get Supabase anon key and add to `.env`
- [ ] Start dashboard: `npm run dev` in main folder
- [ ] Start mobile app: `npm run web` in mobile-app folder
- [ ] Both apps load without errors
- [ ] Load AFDA data via Supabase SQL Editor
- [ ] Generate demo CDV data: `npm run demo`
- [ ] Refresh both apps
- [ ] See AFDA Grad Fest in both apps
- [ ] See 10 booths in mobile app
- [ ] See engagement charts in B2B dashboard

---

## ✅ When You're Done:

You'll have:
- ✅ B2B Dashboard running at http://localhost:5173
- ✅ Mobile App running at http://localhost:8081
- ✅ AFDA Grad Fest event loaded with 10 booths
- ✅ Realistic engagement data in CDV reports
- ✅ Ready to demo tomorrow

---

## 🎤 Tomorrow Morning (1 Hour Before):

1. Start dashboard: `npm run dev`
2. Start mobile app: `npm run web`  
3. Open 2 browser tabs side-by-side
4. Practice clicking through the demo flow (4 minutes)
5. Close all other tabs/apps
6. You're ready to present

---

**Let me know when both apps are running and I'll help you load the demo data!** 🚀

