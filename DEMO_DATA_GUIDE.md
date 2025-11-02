# 🎬 NavEaze Demo Data Setup Guide

This guide will help you load realistic demo data to showcase the NavEaze MVP.

---

## 📊 What's Included

### Demo Event: **Tech Innovation Expo 2025**
- **Date:** March 15-17, 2025 (3-day event)
- **Venue:** TechHub Convention Center, Sandton, Johannesburg
- **Capacity:** 1,000 attendees

### 8 Sponsor Booths:

**🥇 Gold Sponsors (2):**
1. Microsoft Azure Pavilion
2. Google Cloud Innovation Hub

**🥈 Silver Sponsors (3):**
3. Amazon Web Services Center
4. IBM Watson AI Experience
5. Oracle Digital Innovation

**🥉 Bronze Sponsors (3):**
6. Salesforce Customer 360
7. SAP Business Solutions
8. Cisco Networking Zone

### Engagement Data: **~850 Anonymous Scans**
- **Day 1:** 250 scans (opening day)
- **Day 2:** 420 scans (peak day)
- **Day 3:** 180 scans (closing day)

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `uzhfjyoztmirybnyifnu`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Load Demo Data

1. Open the `demo-data.sql` file in your IDE
2. **Copy ALL the SQL** (Cmd+A, Cmd+C)
3. **Paste into Supabase SQL Editor**
4. Click **"Run"** (or press Cmd+Enter)

You should see:
```
Success. Rows: X
```

### Step 3: Verify Data Loaded

Run this verification query:
```sql
SELECT 
  b.sponsor_name,
  b.sponsor_tier,
  COUNT(DISTINCT s.device_id) as unique_devices,
  COUNT(s.id) as total_scans
FROM booths b
LEFT JOIN anonymous_scans s ON s.booth_id = b.id
WHERE b.venue_id = 'demo-venue-001'
GROUP BY b.id, b.sponsor_name, b.sponsor_tier
ORDER BY total_scans DESC;
```

You should see a table showing:
- Microsoft ~108 scans
- Google ~106 scans
- AWS ~105 scans
- etc.

---

## 🎯 How to Showcase

### 1. **MVP Setup Page** (`/mvp-setup`)

**Show:**
- ✅ Select "Tech Innovation Expo 2025" from event dropdown
- ✅ Upload a demo floorplan image (any image works - use a floor plan screenshot or diagram)
- ✅ Click on the floorplan to place 8 anchor points
- ✅ Name each anchor (e.g., "Microsoft Azure Entrance")
- ✅ Associate each anchor with a booth
- ✅ Generate individual QR codes
- ✅ Download all QR codes as a ZIP file

**Talking Points:**
> "Event organizers can upload their venue floorplan and visually place AR anchor points. Each anchor generates a unique QR code that attendees will scan when they arrive. The system supports both QR codes and image targets for flexibility."

### 2. **MVP Analytics Page** (`/mvp-analytics`)

**Show:**
- ✅ Select "Tech Innovation Expo 2025"
- ✅ View summary cards:
  - Total Scans: ~850
  - Unique Devices: ~300-400
  - Active Booths: 8
- ✅ Booth-by-booth breakdown table
- ✅ Export data to CSV

**Talking Points:**
> "Here's real engagement data from our demo event. You can see Microsoft and Google (our Platinum sponsors) are getting the most traffic - about 100+ scans each. This anonymous tracking respects privacy while giving sponsors valuable ROI metrics."

> "Event organizers can export this data to CSV and provide custom reports to each sponsor showing exactly how many unique attendees engaged with their booth."

### 3. **Key Metrics to Highlight**

- **Total Event Engagement:** 850 scans over 3 days
- **Unique Attendees:** ~350 unique devices
- **Peak Day Performance:** Day 2 with 420 scans (50% of total)
- **Gold Sponsor Value:** Top 2 sponsors got ~25% of all traffic
- **Bronze Tier Engagement:** Even lower-tier sponsors got 80-90 scans

---

## 💡 Demo Script

### Opening (Problem)
> "Event organizers spend thousands on sponsor packages, but have no way to prove ROI. Sponsors don't know if anyone actually visited their booth or engaged with their brand."

### Solution (NavEaze)
> "NavEaze solves this with anonymous AR navigation that tracks booth visits automatically. Let me show you..."

### Walk-Through:

**1. Setup (2 min)**
> "First, the event organizer uploads their floorplan [show MVP Setup]. They click to place QR codes at key locations - entrances, sponsor booths, food courts. Each QR gets associated with a sponsor."

> "The system generates these QR codes automatically [show generate]. Organizers print them and place them at the event. When attendees scan to navigate, NavEaze tracks it anonymously."

**2. Analytics (2 min)**
> "Here's the magic [show MVP Analytics]. This is data from a 3-day tech expo we simulated. 850 scans, 350 unique attendees, 8 sponsor booths."

> "Look at Microsoft - 108 total scans, 42 unique devices. That's concrete proof their sponsorship package is working. Google got similar numbers. Both Gold tier sponsors."

> "Even the Bronze sponsors like Salesforce got 80+ scans. That's 80+ attendees who actively walked to their booth and engaged."

**3. Value (1 min)**
> "Organizers can now sell sponsorship packages with data-backed guarantees. Sponsors get monthly reports showing real ROI. And best part? It's all anonymous - we never collect names or personal data. Just device IDs that reset per event."

### Closing
> "This is Phase 1. Phase 2 adds dwell time tracking, multi-day analysis, and advanced positioning. But even this MVP gives sponsors what they've never had before: proof."

---

## 🔧 Troubleshooting

### No data showing in dashboard?
- Make sure you're **logged in** to the dashboard
- Verify your **user ID** is the organizer of the event (check SQL query)
- Try **refreshing the page**

### Event not appearing in dropdown?
- Check if events table has data:
  ```sql
  SELECT * FROM events WHERE id = 'demo-event-001';
  ```
- Ensure the `organizer_id` matches your user ID

### Scans not showing?
- Verify the `anonymous_scans` table was populated:
  ```sql
  SELECT COUNT(*) FROM anonymous_scans WHERE event_id = 'demo-event-001';
  ```
- Should return ~850

---

## 🎨 Optional: Create Custom Floorplan

Want a more realistic demo? Create a simple floorplan:

1. Use any drawing tool (PowerPoint, Figma, Canva, etc.)
2. Draw a simple rectangle (venue outline)
3. Add 8 smaller rectangles or circles (booths)
4. Label them: "Microsoft", "Google", "AWS", etc.
5. Export as PNG or JPG
6. Upload to MVP Setup page

---

## 📊 Expected Results

After loading demo data, you should see:

**MVP Analytics Dashboard:**
| Booth | Sponsor | Tier | Total Scans | Unique Devices |
|-------|---------|------|-------------|----------------|
| Microsoft Azure | Microsoft | Gold | ~108 | ~42 |
| Google Cloud | Google | Gold | ~106 | ~41 |
| AWS Center | Amazon | Silver | ~105 | ~40 |
| IBM Watson | IBM | Silver | ~107 | ~43 |
| Oracle Digital | Oracle | Silver | ~106 | ~42 |
| Salesforce 360 | Salesforce | Bronze | ~107 | ~43 |
| SAP Business | SAP | Bronze | ~105 | ~41 |
| Cisco Network | Cisco | Bronze | ~106 | ~42 |

**Summary Cards:**
- 📊 Total Scans: **~850**
- 👥 Unique Devices: **~300-400**
- 🎯 Active Booths: **8**

---

**You're now ready to demo the NavEaze MVP!** 🚀

