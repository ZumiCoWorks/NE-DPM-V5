# 🚀 Running All Three Apps Locally - Complete Guide

This guide will help you run all three DPM apps locally to test the complete flow before deploying to production.

## 📋 Prerequisites

Make sure you have these installed:
- Node.js (v18 or higher)
- npm or pnpm
- Expo CLI (`npm install -g expo-cli`)
- Git

## 🏃‍♂️ Quick Start Commands

### 1. Start the Backend API (Terminal 1)
```bash
cd /Users/zumiww/Documents/NE\ DPM\ V5/dpm-web
npm run dev
```

### 2. Start Attendee Mobile App (Terminal 2)
```bash
cd /Users/zumiww/Documents/NE\ DPM\ V5/attendee-mobile
npm install
expo start
```

### 3. Start Staff Mobile App (Terminal 3)
```bash
cd /Users/zumiww/Documents/NE\ DPM\ V5/staff-mobile
npm install
expo start
```

### 4. Access Web App (Browser)
- Open http://localhost:5173
- Login with your credentials
- Test the admin dashboard

## 🔧 Environment Setup

### Backend API (.env file)
```bash
SUPABASE_URL=https://uzhfjyoztmirybnyifnu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM
JWT_SECRET=6yI1K/1AWtlw5RRU2plF5ODjN2oVbhHPTdnrlQX3PvK8BF9iQyv9eRyXEVWO921d5uVW5fYrbmQMeywgloxc2A==
FRONTEND_URL=http://localhost:5173
```

### Mobile Apps (app.json)
Both apps are configured to use the local API:
```json
{
  "extra": {
    "API_URL": "http://localhost:3001/api"
  }
}
```

## 🔄 Testing the Complete Flow

### 1. Web App Flow
1. **Login/Register**: http://localhost:5173/login
2. **Create Event**: Dashboard → Events → Create Event
3. **Create Venue**: Dashboard → Venues → Create Venue
4. **Map Editor**: Dashboard → Map Editor → Add QR codes
5. **AR Campaigns**: Dashboard → AR Campaigns → Create Campaign

### 2. Attendee Mobile App Flow
1. **Open App**: Launch Expo app on your phone
2. **Scan QR Code**: Point camera at QR code
3. **View Map**: See your location on the event map
4. **AR Rewards**: Navigate to AR campaign locations

### 3. Staff Mobile App Flow
1. **Open App**: Launch Expo app on your phone
2. **Scan Ticket**: Point camera at attendee ticket QR
3. **Qualify Lead**: Enter attendee details
4. **Save Lead**: Submit lead information

## 🧪 API Endpoints to Test

### Public Endpoints (No Auth Required)
```bash
# Health Check
curl http://localhost:3001/api/health

# QR Code Lookup (for mobile apps)
curl "http://localhost:3001/api/editor/qr-nodes?event_id=00000000-0000-0000-0000-000000000000"

# Lead Capture (for staff mobile app)
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Attendee",
    "email": "test@example.com",
    "company": "Test Company",
    "event_id": "00000000-0000-0000-0000-000000000000"
  }'
```

### Protected Endpoints (Requires Auth)
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Get Events (requires token)
curl http://localhost:3001/api/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚨 Common Issues & Solutions

### Issue: "Port 3001 already in use"
**Solution**: Kill the existing process
```bash
lsof -ti:3001 | xargs kill -9
```

### Issue: "Expo app won't connect to local API"
**Solution**: Make sure your phone and computer are on the same WiFi network

### Issue: "Database permission denied"
**Solution**: Database permissions are already fixed, but if you see this:
```bash
# Re-apply the migration if needed
cd /Users/zumiww/Documents/NE\ DPM\ V5
supabase_apply_migration supabase/migrations/20251118_fix_service_role_permissions.sql
```

### Issue: "QR code not found"
**Solution**: Make sure you've created QR codes in the map editor first

## 📱 Mobile App Development URLs

When running Expo, you'll see something like:
- **Attendee App**: exp://192.168.1.100:19000
- **Staff App**: exp://192.168.1.100:19001

Scan the QR codes with your phone's camera to open in Expo Go app.

## 🎯 Test Scenarios

### Scenario 1: Basic Event Flow
1. Create event in web app
2. Add QR codes to map
3. Scan QR with attendee app
4. Verify location shows correctly

### Scenario 2: Lead Capture Flow
1. Staff scans attendee ticket
2. Staff enters lead details
3. Verify lead is saved in database
4. Check leads in web app dashboard

### Scenario 3: AR Campaign Flow
1. Create AR campaign in web app
2. Set campaign locations
3. Attendee navigates to location
4. Verify AR reward is triggered

## 📊 Monitoring

### Check API Logs
Watch the terminal where you ran `npm run dev` for any errors.

### Check Database
You can query the database directly to verify data:
```bash
# Check if leads are being saved
psql $SUPABASE_URL -c "SELECT * FROM leads LIMIT 5;"

# Check QR codes
psql $SUPABASE_URL -c "SELECT * FROM map_qr_nodes LIMIT 5;"
```

## 🚀 Ready for Production

Once you've tested everything locally and it works:
1. **Deploy to Vercel**: Use the deployment trigger file
2. **Update Mobile Apps**: Change API_URL to production domain
3. **Test Production**: Verify all flows work on live domain

## 📞 Need Help?

If you encounter any issues:
1. Check the terminal logs for error messages
2. Verify all services are running
3. Test API endpoints with curl commands
4. Check database permissions

---

**Happy Testing!** 🎉