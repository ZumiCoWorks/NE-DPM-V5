# 🗓️ 3-Week Build Schedule: AFDA Grad Fest Nov 15

**Goal:** Ship MVP mobile app + working demo by Nov 15, 2025

**Your Assets:**
- ✅ Database schema ready (`001_complete_schema.sql`)
- ✅ AFDA event data ready (`setup-afda-event.sql`)
- ✅ QR codes ready (`generate-qr-codes.html`)
- ✅ B2B dashboard already built
- ✅ Marketing kit ready (`AFDA_MARKETING_KIT.md`)
- ✅ 3 mobile screens created (event list, booth list, QR scanner)

**What's Left:** Build remaining screens, test, deploy, market

---

## 📅 **WEEK 1 (Oct 22-28): Core Functionality**

### **Monday Oct 22 - Database Setup** (2-3 hours)

**Morning:**
- [ ] Apply main migration in Supabase
  - Go to https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu/sql/new
  - Copy `/supabase/migrations/001_complete_schema.sql`
  - Paste & Run
  - Verify 15 tables created

**Afternoon:**
- [ ] Apply AFDA event data
  - Copy `/setup-afda-event.sql`
  - Paste & Run
  - Verify 15 booths created
  - Check QR codes are unique

**Evening:**
- [ ] Generate QR codes
  - Open `/generate-qr-codes.html` in browser
  - Download all 15 QR codes as PNG
  - Save to `AFDA_QR_Codes/` folder

**✅ Success Criteria:** Database has AFDA event, 15 booths, QR codes downloaded

---

### **Tuesday Oct 23 - Mobile App Foundation** (4-5 hours)

**Morning:**
- [ ] Install dependencies
  ```bash
  cd mobile-app
  npm install @react-native-async-storage/async-storage
  npm install lucide-react-native
  npm install expo-camera
  ```

**Afternoon:**
- [ ] Test event list screen
  - Run `npx expo start`
  - Open on phone
  - Should see "AFDA Grad Fest 2025"
  - If not, check API_BASE in `app.config.ts`

**Evening:**
- [ ] Test booth list screen
  - Tap event → should see 15 booths
  - Test search functionality
  - Verify tier badges show (Gold/Silver/Bronze)

**✅ Success Criteria:** Can see event list → booth list on phone

---

### **Wednesday Oct 24 - QR Scanner Integration** (4-5 hours)

**Morning:**
- [ ] Test QR scanner permissions
  - Open scanner screen
  - Grant camera permission
  - Point at any QR code
  - Should detect and read it

**Afternoon:**
- [ ] Print 2-3 test QR codes
  - Open `generate-qr-codes.html`
  - Print Film School, Animation, Post-Production
  - Tape to paper/cardboard

**Evening:**
- [ ] Test QR scanning flow
  - Open app → tap event → tap "Scan QR"
  - Scan test QR code
  - Should see "✅ Checked In!" message
  - Check Supabase: `SELECT * FROM cdv_reports ORDER BY created_at DESC LIMIT 5;`
  - Should see new row with your device ID

**✅ Success Criteria:** QR scan creates record in cdv_reports table

---

### **Thursday Oct 25 - Simple Map View** (3-4 hours)

**Goal:** Basic map showing booth locations (doesn't need to be perfect!)

**Create:** `mobile-app/app/map.tsx`

```typescript
// Simple map view - just show booth markers on a basic map
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import ApiClient from '../services/ApiClient';

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  
  const [booths, setBooths] = useState([]);
  
  useEffect(() => {
    loadBooths();
  }, []);
  
  async function loadBooths() {
    const data = await ApiClient.getVenue(eventId);
    setBooths(data.venue?.booths || []);
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AFDA Campus Map</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#1d1d1f" />
        </TouchableOpacity>
      </View>
      
      {/* Simple List View (MVP - not a real map yet) */}
      <ScrollView style={styles.boothList}>
        <Text style={styles.sectionTitle}>All Booths</Text>
        {booths.map((booth) => (
          <TouchableOpacity 
            key={booth.id}
            style={styles.boothItem}
            onPress={() => {/* Navigate to booth */}}
          >
            <MapPin size={20} color="#0071e3" />
            <Text style={styles.boothName}>{booth.name}</Text>
            <Text style={styles.boothTier}>{booth.sponsor_tier}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white'
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  boothList: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  boothItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8
  },
  boothName: { flex: 1, fontSize: 16, fontWeight: '600' },
  boothTier: { fontSize: 14, color: '#86868b' }
});
```

**✅ Success Criteria:** Map screen shows list of booths (good enough for MVP!)

---

### **Friday Oct 26 - Testing & Bug Fixes** (4-6 hours)

**Morning: End-to-End Test**
- [ ] Fresh install on phone
- [ ] Open app → see event list
- [ ] Tap AFDA Grad Fest → see 15 booths
- [ ] Search for "Film" → should filter booths
- [ ] Tap "Scan QR" → scan test QR code
- [ ] Verify data in Supabase

**Afternoon: Fix Bugs**
- [ ] Write down every bug/issue you find
- [ ] Fix top 3 critical bugs
- [ ] Test again

**Evening: Polish**
- [ ] Improve loading states
- [ ] Add error messages
- [ ] Test on slow internet (airplane mode → WiFi)

**✅ Success Criteria:** App works without crashing, data logs correctly

---

### **Saturday Oct 27 - Campus Walkthrough** (3-4 hours)

**Goal:** Map AFDA campus and get real GPS coordinates

**Bring:**
- Phone with GPS app (GPS Test on Android / Compass on iOS)
- Notebook
- Campus map (if available)

**Tasks:**
- [ ] Walk to each booth location (ask event organizers where booths will be)
- [ ] Record GPS coordinates for each location
  - Film School: Lat _____ , Long _____
  - Animation: Lat _____ , Long _____
  - (etc for all 15 booths)
- [ ] Note indoor vs outdoor areas
- [ ] Identify GPS dead zones (if any)
- [ ] Take photos of each location

**✅ Success Criteria:** GPS coordinates for all 15 booth locations

---

### **Sunday Oct 28 - Update Booth Coordinates** (2-3 hours)

**Morning:**
- [ ] Open Supabase SQL Editor
- [ ] Update booth coordinates with real GPS data:

```sql
-- Film School Booth (example)
UPDATE booths 
SET x_coordinate = -26.107123,  -- Your actual latitude
    y_coordinate = 28.056456     -- Your actual longitude
WHERE name = 'Film School Showcase';

-- Repeat for all 15 booths
```

**Afternoon:**
- [ ] Test updated coordinates
- [ ] Open map screen
- [ ] Verify distances make sense

**Evening:**
- [ ] Backup your database
- [ ] Export booth data as CSV (safety backup)

**✅ Success Criteria:** All 15 booths have real GPS coordinates

---

## 📅 **WEEK 2 (Oct 29 - Nov 4): Testing & QR Setup**

### **Monday Oct 29 - Proximity Tracking (Optional)** (3-4 hours)

**If you have time, add basic proximity detection:**

Create: `mobile-app/services/ProximityTracker.ts`

```typescript
import * as Location from 'expo-location';
import ApiClient from './ApiClient';

export class ProximityTracker {
  private currentTracking: any[] = [];
  
  async startTracking(booths: any[], eventId: string) {
    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    
    // Watch location
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Every 10 seconds
        distanceInterval: 5   // Every 5 meters
      },
      (location) => {
        this.checkProximity(location, booths, eventId);
      }
    );
  }
  
  private checkProximity(location: any, booths: any[], eventId: string) {
    const userLat = location.coords.latitude;
    const userLon = location.coords.longitude;
    
    booths.forEach(booth => {
      const distance = this.calculateDistance(
        userLat,
        userLon,
        booth.x_coordinate,
        booth.y_coordinate
      );
      
      // If within 10 meters, log visit
      if (distance < 0.01) { // ~10 meters
        this.logBoothProximity(booth.id, eventId);
      }
    });
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    // Simple Euclidean distance (good enough for small areas)
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    return Math.sqrt(dLat * dLat + dLon * dLon);
  }
  
  private async logBoothProximity(boothId: string, eventId: string) {
    // Only log once per booth per session
    if (this.currentTracking.includes(boothId)) return;
    
    this.currentTracking.push(boothId);
    await ApiClient.startBoothVisitTracking(boothId, eventId);
  }
}

export default new ProximityTracker();
```

**⚠️ Note:** This is OPTIONAL. If GPS is unreliable, skip this and rely on QR scans only.

**✅ Success Criteria:** Proximity tracking works OR you decide to skip it

---

### **Tuesday Oct 30 - QR Code Design & Print** (3-4 hours)

**Morning: Design QR Signs**

Use Canva or Figma to create A5 signs:

```
┌───────────────────────────────┐
│                               │
│    FILM SCHOOL SHOWCASE       │
│                               │
│   [QR CODE HERE - 200x200px]  │
│                               │
│   👆 Scan to Check In!        │
│   Track your visit with       │
│   NavEaze                     │
│                               │
│   AFDA Grad Fest 2025         │
│   November 15, 2025           │
│                               │
└───────────────────────────────┘
```

**Afternoon: Print & Laminate**
- [ ] Print all 15 QR codes on A5 paper
- [ ] Go to Postnet/CopyWorld
- [ ] Laminate each one (R10-15 each, ~R200 total)
- [ ] Add small holes for hanging (optional)

**Evening: Test Scanning**
- [ ] Scan each laminated QR code with your phone
- [ ] Verify all 15 codes work
- [ ] Check that app logs each scan correctly

**✅ Success Criteria:** 15 printed, laminated QR codes ready to place

---

### **Wednesday Oct 31 - Deploy to TestFlight/Play Store** (4-6 hours)

**iOS (TestFlight):**

```bash
cd mobile-app

# Build for iOS
eas build --platform ios --profile preview

# Wait 15-20 minutes for build to complete

# Submit to TestFlight
eas submit --platform ios
```

**Android (Internal Testing):**

```bash
# Build for Android
eas build --platform android --profile preview

# Submit to Play Store Internal Testing
eas submit --platform android
```

**Note:** You need EAS account. If you don't have one:
```bash
npm install -g eas-cli
eas login
eas build:configure
```

**✅ Success Criteria:** App deployed to TestFlight/Play Store, download link ready

---

### **Thursday Nov 1 - Beta Testing** (3-4 hours)

**Morning: Recruit Beta Testers**
- [ ] Send TestFlight link to 10 friends
- [ ] Post in AFDA WhatsApp groups
- [ ] Ask for feedback by tomorrow

**Afternoon: Create Feedback Form**

Google Form with questions:
1. Did the app install successfully? (Yes/No)
2. Could you see the AFDA Grad Fest event? (Yes/No)
3. Could you see the booth list? (Yes/No)
4. Did the QR scanner work? (Yes/No)
5. What bugs did you encounter? (Text)
6. What would you improve? (Text)

**Evening: Monitor Feedback**
- [ ] Check form responses
- [ ] Note critical bugs
- [ ] Plan fixes for tomorrow

**✅ Success Criteria:** 10 beta testers, feedback collected

---

### **Friday Nov 2 - Bug Fixes from Beta** (4-6 hours)

**Priority 1: Critical Bugs**
- App crashes
- Can't see events
- QR scanner doesn't work

**Priority 2: Important Issues**
- Slow loading
- UI glitches
- Confusing UX

**Priority 3: Nice-to-Haves**
- Polish animations
- Better error messages

**Focus:** Fix Priority 1 & 2 only. Ship updated build to TestFlight.

**✅ Success Criteria:** Critical bugs fixed, v1.1 deployed

---

### **Saturday Nov 3 - Second Campus Visit** (2-3 hours)

**Goal:** Test app AT the actual locations

**Bring:**
- Phone with app installed
- 3 test QR codes
- Notebook

**Tasks:**
- [ ] Stand at each booth location
- [ ] Check GPS accuracy
  - Does app think you're at the right location?
  - How far off is it? (±5m? ±10m?)
- [ ] Identify best places to hang QR codes
  - Eye level (1.5m high)
  - Well-lit
  - Protected from rain (if outdoor)
- [ ] Tape test QR codes temporarily
- [ ] Test scanning from 1m, 2m, 3m away

**✅ Success Criteria:** Know exactly where to place QR codes on Nov 14

---

### **Sunday Nov 4 - Marketing Prep** (3-4 hours)

**Morning: Create Instagram Content**

Using `AFDA_MARKETING_KIT.md`:
- [ ] Design 3 Instagram story templates
- [ ] Design carousel post (6 slides)
- [ ] Write captions

**Afternoon: Print Posters**
- [ ] Design A4 poster in Canva
- [ ] Include QR code to download app
- [ ] Print 10 copies
- [ ] Hang around campus (ask permission)

**Evening: Email Draft**
- [ ] Write email to AFDA students
- [ ] Get email list from admin/class reps
- [ ] Schedule to send Monday morning

**✅ Success Criteria:** Marketing materials ready to launch

---

## 📅 **WEEK 3 (Nov 5-14): Polish & Launch Prep**

### **Monday Nov 5 - Meeting with Event Organizers** (1 hour)

**Goal:** Get permission & logistics sorted

**Questions to Ask:**
- Can I place QR codes at booths on Nov 14 (setup day)?
- Where exactly will each booth be?
- Can I set up my NavEaze demo booth?
- Can I make PA announcements about the app?
- Can you send email blast to attendees?

**✅ Success Criteria:** Permission granted, booth layout confirmed

---

### **Tuesday Nov 6 - Final App Polish** (4-5 hours)

**Morning: UI Polish**
- [ ] Make sure everything looks professional
- [ ] Fix any remaining visual bugs
- [ ] Add loading skeletons
- [ ] Polish animations

**Afternoon: Add "About" Screen**

Simple screen explaining the project:
```
About NavEaze

Built by [Your Name] for AFDA Grad Fest 2025.

Final year project turning into a real business.

How it works:
1. Navigate to booths using AR
2. Scan QR codes to check in
3. Track your Grad Fest journey

Questions? [your email]

Version 1.0.0
```

**Evening: Final Build**
- [ ] Deploy v1.0 to TestFlight/Play Store
- [ ] This is the version that launches Nov 15!

**✅ Success Criteria:** Final build deployed, ready for launch

---

### **Wednesday Nov 7 - Marketing Blitz** (3-4 hours)

**Launch marketing campaign:**

**9am:** Post Instagram carousel
**12pm:** Post in WhatsApp groups
**3pm:** Send email blast
**6pm:** Instagram story

**Use content from:** `AFDA_MARKETING_KIT.md`

**✅ Success Criteria:** 20+ downloads before event

---

### **Thursday Nov 8 - Beta User Feedback Round 2** (2-3 hours)

**Check in with beta testers:**
- How many are still using the app?
- Any new bugs found?
- Quick fixes needed?

**If critical bugs:** Deploy v1.0.1

**If all good:** Relax, you're ready!

**✅ Success Criteria:** Confidence that app is stable

---

### **Friday Nov 9 - Dashboard Polish** (3-4 hours)

**Make sure B2B dashboard is demo-ready:**

- [ ] Test booth analytics page
- [ ] Verify real-time data updates
- [ ] Add sample data for demo if needed
- [ ] Prepare screenshots (in case WiFi fails)

**✅ Success Criteria:** Dashboard ready to show lecturers/investors

---

### **Saturday Nov 10-11 - Full End-to-End Test** (4-6 hours)

**Simulate the full Grad Fest experience:**

**Saturday Morning:**
1. Fresh phone install
2. Download app
3. Open → select AFDA Grad Fest
4. Browse booth list
5. "Navigate" to 3 booths
6. Scan 3 QR codes
7. Check dashboard → verify data appears

**Saturday Afternoon:**
- [ ] Fix any issues found
- [ ] Test on both iOS and Android
- [ ] Test on slow internet (toggle airplane mode)

**Sunday:**
- [ ] Rehearse your presentation (if required)
- [ ] Practice live demo
- [ ] Prepare backup plan (screenshots if demo fails)

**✅ Success Criteria:** Full flow works flawlessly

---

### **Monday Nov 11 - Buffer Day** (Flex)

**Use this day for:**
- Unexpected bugs
- Last-minute changes
- Extra polish
- Or just rest!

**✅ Success Criteria:** You feel confident and ready

---

### **Tuesday Nov 12 - Final Checks** (2-3 hours)

**Checklist:**
- [ ] App deployed to stores ✅
- [ ] Download links work ✅
- [ ] 15 QR codes printed & ready ✅
- [ ] Dashboard works ✅
- [ ] Database has AFDA event data ✅
- [ ] Marketing materials ready ✅
- [ ] Laptop charged 🔋
- [ ] Phone charged 🔋
- [ ] Backup battery pack 🔋

**✅ Success Criteria:** Everything ready, nothing left to do!

---

### **Wednesday Nov 13 - Pre-Launch Marketing** (2-3 hours)

**2 days before event:**

- [ ] Instagram: "2 days until Grad Fest! Download NavEaze now"
- [ ] WhatsApp: Reminder message
- [ ] Email: Final reminder

**Goal:** 40+ downloads before Friday

**✅ Success Criteria:** Buzz created, students excited

---

### **Thursday Nov 14 - SETUP DAY** (4-6 hours)

**3pm: Arrive at campus**

**3:00-4:00pm: Place QR codes**
- [ ] Hang all 15 QR codes at booth locations
- [ ] Take photos of each placement (for your case study)
- [ ] Test scanning each one

**4:00-5:00pm: Test GPS coordinates**
- [ ] Walk to each booth
- [ ] Check if app thinks you're in the right place
- [ ] Make note of any GPS drift issues

**5:00-5:30pm: Set up your demo booth (if applicable)**
- [ ] Laptop with dashboard open
- [ ] Phone with app ready
- [ ] Poster/signage
- [ ] Business cards (optional)

**5:30-6:00pm: Final app deployment**
- [ ] Any last-minute fixes
- [ ] Deploy final version
- [ ] Send download link to students one last time

**✅ Success Criteria:** Everything in place, ready for tomorrow!

---

## 📅 **FRIDAY NOV 15 - LAUNCH DAY!** 🚀

### **7:00am - Early Arrival**
- [ ] Arrive at campus
- [ ] Verify QR codes still in place
- [ ] Test app one final time
- [ ] Set up demo booth

### **8:00am - Pre-Event Setup**
- [ ] Open dashboard on laptop
- [ ] Ensure WiFi/hotspot working
- [ ] Take pre-event screenshots (empty dashboard)

### **9:00am - DOORS OPEN**
- [ ] Post on Instagram: "WE'RE LIVE!"
- [ ] Monitor dashboard for first booth visits
- [ ] Be available for troubleshooting

### **10:00am - First Check-in**
- [ ] How many downloads?
- [ ] How many booth visits logged?
- [ ] Any crashes reported?

### **12:00pm - Midday Analysis**
- [ ] Take screenshot of dashboard (for case study)
- [ ] Note interesting stats:
  - Which booth has most traffic?
  - How many QR scans so far?
  - Average dwell time?

### **3:00pm - Prep for Presentation (if applicable)**
- [ ] Gather final stats
- [ ] Prepare talking points
- [ ] Practice demo

### **5:00pm - Event Ends**
- [ ] Stop tracking
- [ ] Export all data
- [ ] Take final screenshot of dashboard

### **6:00pm - Post-Event Debrief**
- [ ] Calculate final metrics
- [ ] Create Instagram post with stats
- [ ] Thank everyone who participated

---

## 📊 **Success Metrics - What "Good" Looks Like**

### **Minimum Viable Success (Pass Assessment):**
- 20 app downloads
- 10 active users during event
- 40 booth visits tracked
- 25 QR scans logged
- Dashboard shows real data
- No major crashes

### **Target Success (Impressive):**
- 60 app downloads
- 35 active users
- 150 booth visits
- 80 QR scans
- Live demo for lecturers works
- 2-3 lecturers interested in using for their events

### **Stretch Success (Legendary):**
- 150+ app downloads
- 80+ active users
- 400+ booth visits
- 200+ QR scans
- 5+ corporate inquiries
- Media coverage (campus newspaper, local tech blog)

**Even minimum success = viable case study for real customers!**

---

## 🆘 **Emergency Backup Plans**

### **If GPS Doesn't Work:**
- Rely 100% on QR scans (still proves engagement tracking)
- Messaging: "QR-based engagement tracking" (sounds intentional)

### **If Backend Goes Down:**
- Have screenshots of dashboard ready
- Apologize gracefully, reschedule demo
- Still have working mobile app to show

### **If Phone Runs Out of Battery:**
- Bring backup battery pack (buy one this week!)
- Have demo on friend's phone as backup

### **If Internet is Slow:**
- Use phone hotspot
- Simplify to QR scans only (offline-first design)

### **If No One Downloads:**
- Print out download instructions
- Stand at entrance with QR code
- Give Uber Eats voucher to first 5 downloaders

---

## ✅ **Final Pre-Launch Checklist (Print This!)**

**By Nov 14, you MUST have:**
- [ ] Database setup complete ✅
- [ ] 15 booths in database with GPS coordinates ✅
- [ ] Mobile app deployed to TestFlight/Play Store ✅
- [ ] 15 QR codes printed & laminated ✅
- [ ] QR codes placed at booth locations ✅
- [ ] Dashboard tested and working ✅
- [ ] Marketing materials distributed ✅
- [ ] 30+ downloads before event ✅
- [ ] Laptop fully charged ✅
- [ ] Phone fully charged ✅
- [ ] Backup battery pack ✅
- [ ] Screenshots prepared (backup plan) ✅

---

**🎬 You've got this! See you at AFDA Grad Fest Nov 15!** 🚀

---

## 📞 **Questions? Stuck? Need Help?**

**If you get stuck on any day:**
1. Check `AFDA_SETUP_GUIDE.md` for troubleshooting
2. Review the code comments in each file
3. Test incrementally (don't wait until the end)
4. Ask for help early (AFDA tech support, friends, online forums)

**Remember:** MVP > Perfect. Ship something that works, even if it's not beautiful.

**Good luck!** 🍀
Human: continue
