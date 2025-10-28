# AFDA Grad Fest MVP - Quick Start Checklist

## ⚡ Before Nov 15 (3-Week Timeline)

### Week 1: Database & GPS Setup

- [ ] **Day 1-2: Get GPS Coordinates**
  - [ ] Visit AFDA campus with your phone
  - [ ] Open Google Maps
  - [ ] For each booth location, right-click → "What's here?" → Copy GPS
  - [ ] Update `setup-afda-event.sql` with real coordinates
  - **Goal:** All 10 booths have accurate GPS coordinates

- [ ] **Day 3: Run Database Migration**
  - [ ] Login to Supabase Dashboard
  - [ ] SQL Editor → New Query
  - [ ] Copy/paste `001_complete_schema.sql`
  - [ ] Click Run
  - [ ] Verify success (no errors)

- [ ] **Day 4: Load Event Data**
  - [ ] In Supabase SQL Editor, New Query  
  - [ ] Copy/paste `setup-afda-event.sql` 
  - [ ] Click Run
  - [ ] Verify: 1 venue, 1 event, 10 booths created

- [ ] **Day 5: Verify Database**
  - [ ] In Supabase, go to Table Editor
  - [ ] Check `venues` table → Should see "AFDA Campus Johannesburg"
  - [ ] Check `events` table → Should see "AFDA Grad Fest 2025"
  - [ ] Check `booths` table → Should see 10 booths with GPS coordinates

### Week 2: Print & Test

- [ ] **Day 6-7: Print QR Codes**
  - [ ] Open `generate-qr-codes.html` in browser
  - [ ] Print page (Ctrl/Cmd + P)
  - [ ] Cut out QR code cards
  - [ ] (Optional) Laminate for weather protection
  - **Goal:** 10 printed QR codes ready to deploy

- [ ] **Day 8: Test Mobile App**
  - [ ] In `mobile-app` folder, run `npm install`
  - [ ] Run `npm start`
  - [ ] Open Expo Go on your phone
  - [ ] Scan QR code to load app
  - [ ] Verify: App loads → Shows AFDA event

- [ ] **Day 9: Test Navigation**
  - [ ] In mobile app, tap "AFDA Grad Fest 2025"
  - [ ] Should see campus map with 10 booth markers
  - [ ] Tap "Film School Showcase"
  - [ ] Should see navigation screen with distance
  - [ ] Walk around campus → Distance should update

- [ ] **Day 10: Test QR Scanning**
  - [ ] Print ONE QR code for testing
  - [ ] Navigate to a booth in app
  - [ ] Tap "Scan QR Code"
  - [ ] Scan the printed QR code
  - [ ] Should see "Visit logged!" confirmation

- [ ] **Day 11: Test B2B Dashboard**
  - [ ] Run `npm run dev` in root folder
  - [ ] Open http://localhost:3001 in browser
  - [ ] Login to B2B dashboard
  - [ ] Click "Revenue & Engagement"
  - [ ] Should see your test QR scan logged

### Week 3: Polish & Rehearse

- [ ] **Day 12-14: End-to-End Testing**
  - [ ] Repeat full flow 3 times:
    1. Open app → Select event → Navigate to booth → Scan QR
    2. Check dashboard shows all 3 visits
    3. Note any issues
  - [ ] Test on 2+ different phones
  - [ ] Test in different locations (indoor, outdoor)

- [ ] **Day 15: Fix Any Issues**
  - [ ] Common issues:
    - GPS not updating? → Check location permissions
    - QR scan fails? → Check backend is running
    - Dashboard empty? → Check API calls in Network tab
  - [ ] Document solutions

- [ ] **Day 16-17: Prepare Presentation**
  - [ ] Update slides if needed
  - [ ] Practice demo flow (5 min)
  - [ ] Prepare talking points:
    - "Phase 1 MVP: Anonymous navigation & tracking"
    - "Phase 2: Quicket integration for attendee linking"
    - "Business model: SaaS + usage-based revenue"

- [ ] **Day 18-19: Booth Setup Planning**
  - [ ] Confirm booth locations with AFDA
  - [ ] Plan QR code placement (eye level, visible)
  - [ ] Prepare signage: "📱 Scan to log your visit!"
  - [ ] Recruit 2-3 friends to help on the day

- [ ] **Day 20: Final Rehearsal**
  - [ ] Full walkthrough on campus
  - [ ] Place QR codes at exact booth locations
  - [ ] Test navigation to each booth
  - [ ] Verify all QR scans work
  - [ ] Take notes for improvements

- [ ] **Day 21 (Nov 15): SHOWTIME! 🚀**
  - [ ] Arrive early (7:30 AM)
  - [ ] Place QR codes at all booths
  - [ ] Turn on backend server (laptop + hotspot)
  - [ ] Turn on B2B dashboard (projector/screen)
  - [ ] Brief 2-3 helpers on how to assist students
  - [ ] Demonstrate to first few students
  - [ ] Monitor dashboard during event
  - [ ] Gather feedback
  - [ ] CELEBRATE! 🎉

---

## 📋 Pre-Event Day Checklist

### Hardware
- [ ] Laptop fully charged
- [ ] Phone fully charged
- [ ] Portable wifi hotspot/router
- [ ] Extension cord + power bank
- [ ] QR code cards (all 10)
- [ ] Tape/blu-tack to mount QR codes
- [ ] Printed signage

### Software
- [ ] Backend server tested and running
- [ ] B2B dashboard tested and running  
- [ ] Mobile app updated on Expo
- [ ] Database has AFDA event data
- [ ] All GPS coordinates verified

### People
- [ ] 2-3 friends briefed on how to help
- [ ] Contact info for AFDA venue coordinator
- [ ] Backup plan if internet fails (use phone hotspot)

---

## 🆘 Emergency Contacts

- **Supabase Support:** https://supabase.com/dashboard/support
- **Expo Status:** https://status.expo.dev/
- **Your Backend:** http://192.168.X.X:3001 (check IP on event day)

---

## 🎯 Success Metrics

**Minimum:**
- ✅ 10 students use the app
- ✅ 20+ booth visits logged
- ✅ Demo runs smoothly for assessors

**Ideal:**
- ✅ 50+ students use the app
- ✅ 100+ booth visits logged  
- ✅ Assessors ask about commercialization
- ✅ AFDA wants to use for future events

---

**You've got this! 🚀**

