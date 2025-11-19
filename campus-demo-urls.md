# Campus Demo - All Apps Running Locally

## 🚀 All Systems Are Live!

### Main DPM Web App
**URL:** http://localhost:5173/
**Status:** ✅ Running (Frontend)
**Backend API:** http://localhost:3001/ ✅ Running

### PWA Mobile Apps
**Attendee PWA:** http://localhost:5173/mobile/attendee
**Staff PWA:** http://localhost:5173/mobile/staff
**Status:** ✅ Both PWAs are running with real QR scanning

## 📱 Test the Complete Flow

### 1. Start with DPM Web App
- Open: http://localhost:5173/
- Create/edit event floorplans
- Generate QR codes for sponsors
- Test editor functionality

### 2. Test Attendee PWA
- Open: http://localhost:5173/mobile/attendee
- Grant camera permission when prompted
- Scan QR codes from the DPM app
- Test real QR scanning functionality

### 3. Test Staff PWA
- Open: http://localhost:5173/mobile/staff
- Grant camera permission when prompted
- Scan attendee QR codes
- Capture leads with real data
- Export CSV functionality

## 🔧 Technical Status

- **Backend Server:** Port 3001 ✅ Active
- **Frontend Client:** Port 5173 ✅ Active
- **Database:** Supabase ✅ Connected
- **Real QR Scanning:** ✅ Enabled (jsQR library)
- **Demo Mode:** ❌ Disabled (all real functionality)

## 🎯 Ready for Friday's Pilot!

All apps are running with real functionality - no simulations. Test the complete data flow from DPM → Attendee → Staff apps.