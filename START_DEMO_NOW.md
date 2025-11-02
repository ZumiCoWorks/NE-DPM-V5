# 🚀 START YOUR DEMO NOW

## One Command to Rule Them All

```bash
cd "/Users/zumiww/Documents/NE DPM V5"
./start-demo.sh
```

**Wait 10 seconds**, then:

---

## 📊 Open These URLs:

1. **Dashboard:** http://localhost:5173
   - Login with your account
   - Click "MVP Analytics"
   - Select "Tech Innovation Expo 2025"
   - **See 850 scans!**

2. **Mobile App:** http://localhost:19006
   - See event list
   - Click event → see 8 booths
   - Click "Scan QR" → see scanner UI

---

## 🛑 When Done:

```bash
./stop-demo.sh
```

---

## 🎯 What to Say:

### Dashboard (30 seconds):
> "This is what event organizers see. 850 booth scans from 350 unique attendees. Microsoft got 108 scans - that's 108 people who actually visited their booth. Click export to download the sponsor report."

### Mobile App (30 seconds):
> "This is what attendees see. No login required - just anonymous device tracking. They select the event, browse booths by sponsor tier, and scan QR codes to navigate. Every scan logs to the dashboard you just saw."

### The Value (10 seconds):
> "Sponsors finally get proof their R50,000 booth worked. R2,500 per event. 15-minute setup."

---

## 📋 Demo Checklist:

- [ ] Run `./start-demo.sh`
- [ ] Open dashboard at localhost:5173
- [ ] Open mobile at localhost:19006
- [ ] Have `DEMO_CHEAT_SHEET.md` open
- [ ] Practice saying the key numbers (850 scans, 350 devices, R2,500 price)

---

## 🚨 If It Doesn't Work:

1. Check logs:
   ```bash
   tail -f /tmp/naveaze-backend.log
   tail -f /tmp/naveaze-dashboard.log
   tail -f /tmp/naveaze-mobile.log
   ```

2. Or manually start in 3 terminals:
   ```bash
   # Terminal 1
   npm run server:dev
   
   # Terminal 2
   npm run client:dev
   
   # Terminal 3
   cd mobile-app && npx expo start --web
   ```

---

**That's it. Start the script and demo.** 🎉

