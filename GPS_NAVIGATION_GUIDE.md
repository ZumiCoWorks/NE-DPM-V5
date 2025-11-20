# Hybrid GPS + QR Navigation System - Quick Start Guide

## ✅ What's Been Implemented

### 1. Database Schema (GPS Support)
**File:** `add-gps-navigation-support.sql`

**Run this SQL in Supabase SQL Editor:**
- Adds `navigation_mode` to events (indoor/outdoor/hybrid)
- Adds GPS coordinates to events, venues, and navigation_points
- Adds QR code generation fields
- Creates indexes for GPS lookups

### 2. Event Editor (Navigation Mode Settings)
**File:** `dpm-web/src/pages/events/EditEventPage.tsx`

**Features:**
- ✅ Select navigation mode: Indoor (QR only), Outdoor (GPS only), or Hybrid (GPS + QR)
- ✅ Set GPS center coordinates for outdoor/hybrid events
- ✅ GPS fields appear automatically when outdoor or hybrid mode is selected

### 3. Map Editor (GPS Coordinate Picker)
**Files:**
- `dpm-web/src/components/DevScaffoldFloorplanEditor.jsx`
- `dpm-web/src/components/scaffold/POIForm.jsx`

**Features:**
- ✅ "Use My Current Location" button to get GPS coordinates
- ✅ Manual lat/lng input for each POI
- ✅ Zone type selection (outdoor/indoor/transition)
- ✅ QR calibration checkbox
- ✅ Saves GPS data to navigation_points table

### 4. Attendee PWA (GPS Navigation)
**Files:**
- `dpm-web/src/pages/mobile/AttendeePWA.tsx`
- `dpm-web/src/lib/gpsNavigation.ts` (helper functions)

**Features:**
- ✅ Auto-detects event navigation mode
- ✅ Enables GPS tracking for outdoor/hybrid events
- ✅ Shows GPS accuracy and coordinates
- ✅ Displays location source (GPS vs QR)
- ✅ Real-time position updates on map
- ✅ Different instructions based on navigation mode

## 🚀 How to Use for Your Pilot

### Step 1: Run Database Migration
1. Open Supabase dashboard: https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy contents of `add-gps-navigation-support.sql`
4. Run the query
5. Verify: Check that events table now has `navigation_mode` column

### Step 2: Configure Your Event
1. Log into DPM Web: http://localhost:5173
2. Go to Events → Edit your pilot event
3. Set **Navigation Mode** to "Hybrid" (or "Outdoor" if no indoor areas)
4. Enter GPS center coordinates:
   - Right-click on Google Maps at your venue center
   - Copy coordinates (e.g., -25.7461, 28.1881)
   - Paste into Latitude/Longitude fields
5. Save event

### Step 3: Add POIs with GPS Coordinates
1. Go to Map Editor (Events → [Your Event] → Edit Map)
2. Upload venue floorplan if not already done
3. Select your event from dropdown
4. Click POI mode
5. Click on the map to place a POI
6. In the POI form:
   - Enter name (e.g., "Main Entrance", "Food Court")
   - Click "📍 Use My Current Location" (if you're physically at that spot)
   - OR manually enter GPS coordinates
   - Select zone type (outdoor/indoor/transition)
   - Click "Save POI"
7. Repeat for all key locations

### Step 4: Test Attendee Navigation
1. Open AttendeePWA: http://localhost:5173/attendee?event_id=[YOUR_EVENT_ID]
2. Allow location permissions when prompted
3. Check Map tab:
   - Should see "GPS Active • Accuracy: Xm"
   - Badge shows "🌐 Hybrid GPS + QR Navigation"
   - Your location appears as blue dot on map
4. Test navigation:
   - Go to Directory tab
   - Tap "Directions" on any POI
   - Map should show route (if pathfinding configured)

## 📋 For Outdoor Pilot Without QR Codes

**Best Configuration:**
1. Set event navigation_mode to `outdoor`
2. Add all booths/POIs with GPS coordinates
3. Attendees see their location automatically via GPS
4. No QR codes needed!

**If GPS accuracy is poor indoors:**
- Switch to `hybrid` mode
- Place a few QR codes at main indoor locations only
- GPS handles outdoor areas
- QR codes provide precision indoors

## 🔧 Troubleshooting

### GPS Not Working
**Issue:** "GPS Searching..." stuck
- **Fix:** Ensure HTTPS or localhost (HTTP works for development)
- **Fix:** Check browser location permissions
- **Fix:** Try outdoors (GPS weak indoors)

### Location Not Updating
**Issue:** Blue dot doesn't move
- **Fix:** Check event has GPS bounds set (gps_bounds_ne_lat, etc.)
- **Fix:** Verify you're within event GPS boundaries
- **Fix:** Check browser console for errors

### POI GPS Coordinates Not Saving
**Issue:** POI saves but no GPS data
- **Fix:** Ensure event is in outdoor/hybrid mode
- **Fix:** Check API endpoint `/editor/poi` accepts GPS fields
- **Fix:** Verify navigation_points table has gps_lat/gps_lng columns

## 🎯 What Still Needs Work

### QR Code Generation Tool
- Add button in Map Editor to generate printable QR codes
- Creates PDF with QR codes linked to navigation_points
- Each QR contains: `{qr_code_id, event_id, floorplan_id, x, y}`

### Smart GPS/QR Switching
- Auto-prompt for QR scan when GPS accuracy drops
- Detect indoor/outdoor zones automatically
- Prefer QR when available, fallback to GPS

### Event GPS Bounds Auto-Calculate
- Calculate bounds automatically from POI GPS coordinates
- No need to manually set ne/sw corners

## ⚡ Quick Commands

```bash
# Start development server
cd dpm-web
npm run dev

# Open Attendee PWA
# http://localhost:5173/attendee?event_id=YOUR_EVENT_ID

# Open Map Editor
# http://localhost:5173/events (then click event → edit map)
```

## 📝 Important Notes

1. **GPS works best outdoors** - Expect 5-50m accuracy
2. **HTTPS required for production** - GPS blocked on HTTP (except localhost)
3. **Mobile devices have better GPS** - Use phone to test, not laptop
4. **QR codes provide 1-2m accuracy** - Use for indoor precision
5. **Hybrid mode is recommended** - Best of both worlds

## ✨ For Your Pilot Demo

**Recommended Setup:**
1. Navigation Mode: **Hybrid**
2. Add 5-10 key outdoor POIs with GPS
3. Print 2-3 QR codes for main indoor spots (entrance, registration, food)
4. Test on your phone at the venue
5. Attendees get GPS outdoors + QR precision indoors

**This gives you the flexibility to skip QR codes if you run out of time!**

