# 📱 → 📊 Mobile App to Dashboard Data Flow

Complete guide showing how data flows from the mobile app to the B2B analytics dashboard.

---

## 🔄 The Complete Flow

```
Mobile App (Attendee)
    ↓ Scans QR Code
    ↓ Calls: ApiClient.logAnonymousScan()
    ↓
Backend API (/api/scans/log)
    ↓ Validates data
    ↓ Generates unique device_id
    ↓ Saves to database
    ↓
Supabase (anonymous_scans table)
    ↓ Stores: device_id, anchor_id, event_id, booth_id, timestamp
    ↓
B2B Dashboard (MVP Analytics)
    ↓ Queries: anonymous_scans + booths
    ↓ Aggregates: total scans, unique devices
    ↓
Event Organizer (Sees ROI Data)
    ✅ Views booth performance
    ✅ Exports sponsor reports
```

---

## 📱 Step 1: Mobile App Scan

### What Happens:
1. Attendee opens mobile app
2. Selects "Tech Innovation Expo 2025" event
3. Browses booth list
4. Clicks "Scan QR" button for a booth
5. Camera opens → scans QR code

### Code Flow:

**File:** `mobile-app/app/mvp-scanner.tsx`

```typescript
// When QR code is scanned:
async function handleBarCodeScanned({ data }) {
  // data = "QR-MSFT-AZURE-001" (the QR code content)
  
  await ApiClient.logAnonymousScan({
    eventId: '22222222-2222-2222-2222-222222222222',
    anchorId: data, // "QR-MSFT-AZURE-001"
    boothId: '33333333-3333-3333-3333-333333333301'
  });
}
```

---

## 🔌 Step 2: API Client

### What Happens:
1. Gets/generates unique `device_id` from AsyncStorage
2. Sends POST request to backend
3. Receives success/error response

### Code Flow:

**File:** `mobile-app/services/ApiClient.ts`

```typescript
async logAnonymousScan(data) {
  const deviceId = await this.getDeviceId() // "device_1730035200_abc123"
  
  const payload = {
    device_id: deviceId,
    anchor_id: data.anchorId,
    event_id: data.eventId,
    booth_id: data.boothId,
    timestamp: new Date().toISOString()
  }
  
  const res = await fetch(`${API_BASE}/scans/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  
  return await res.json()
}
```

**Example Payload:**
```json
{
  "device_id": "device_1730035200_abc123",
  "anchor_id": "QR-MSFT-AZURE-001",
  "event_id": "22222222-2222-2222-2222-222222222222",
  "booth_id": "33333333-3333-3333-3333-333333333301",
  "timestamp": "2025-10-27T12:30:00.000Z"
}
```

---

## 🖥️ Step 3: Backend API

### What Happens:
1. Receives POST request at `/api/scans/log`
2. Validates payload with Zod schema
3. If `booth_id` is missing, looks it up by `anchor_id`
4. Inserts row into `anonymous_scans` table
5. Returns success response

### Code Flow:

**File:** `api/routes/scans.ts`

```typescript
router.post('/log', async (req, res) => {
  // Validate payload
  const validatedData = scanLogSchema.parse(req.body)
  
  // Look up booth_id if not provided
  if (!booth_id) {
    const { data: boothData } = await supabaseAdmin
      .from('booths')
      .select('id')
      .eq('qr_code', anchor_id)
      .single()
    
    booth_id = boothData?.id
  }
  
  // Insert into database
  const { data } = await supabaseAdmin
    .from('anonymous_scans')
    .insert({
      device_id,
      anchor_id,
      event_id,
      booth_id,
      timestamp
    })
    .select()
    .single()
  
  res.json({ success: true, scan: data })
})
```

---

## 🗄️ Step 4: Database Storage

### What Happens:
Data is inserted into the `anonymous_scans` table in Supabase.

### Schema:

**Table:** `anonymous_scans`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Auto-generated unique ID |
| device_id | text | Anonymous device identifier |
| anchor_id | text | QR code that was scanned |
| event_id | uuid | Event foreign key |
| booth_id | uuid | Booth foreign key (nullable) |
| timestamp | timestamptz | When the scan occurred |
| created_at | timestamptz | When row was created |

**Example Row:**
```sql
id:         "44444444-4444-4444-4444-444444444444"
device_id:  "device_1730035200_abc123"
anchor_id:  "QR-MSFT-AZURE-001"
event_id:   "22222222-2222-2222-2222-222222222222"
booth_id:   "33333333-3333-3333-3333-333333333301"
timestamp:  "2025-10-27 12:30:00+00"
created_at: "2025-10-27 12:30:00+00"
```

---

## 📊 Step 5: Dashboard Analytics

### What Happens:
1. Event organizer opens **MVP Analytics** page
2. Selects "Tech Innovation Expo 2025"
3. Dashboard queries `anonymous_scans` joined with `booths`
4. Aggregates data:
   - Total scans per booth
   - Unique devices per booth
   - Overall event stats
5. Displays in table and summary cards

### Code Flow:

**File:** `src/pages/MVPAnalyticsPage.tsx`

```typescript
// Fetch all scans for the event
const { data: scansData } = await supabase
  .from('anonymous_scans')
  .select(`
    booth_id,
    device_id,
    booths (
      id,
      name,
      sponsor_name,
      sponsor_tier
    )
  `)
  .eq('event_id', eventId)

// Aggregate per booth
scansData.forEach((scan) => {
  boothMap[scan.booth_id].total_scans++
  boothMap[scan.booth_id].unique_devices.add(scan.device_id)
})
```

### Example Query Result:

```json
[
  {
    "booth_id": "33333333-3333-3333-3333-333333333301",
    "booth_name": "Microsoft Azure Pavilion",
    "sponsor_name": "Microsoft",
    "sponsor_tier": "Gold",
    "total_scans": 108,
    "unique_devices": 42
  },
  {
    "booth_id": "33333333-3333-3333-3333-333333333302",
    "booth_name": "Google Cloud Innovation Hub",
    "sponsor_name": "Google",
    "sponsor_tier": "Gold",
    "total_scans": 106,
    "unique_devices": 41
  }
]
```

---

## 🎬 Testing the Complete Flow

### Option A: Use Demo Data (Already Done)
You already have 850 demo scans loaded from `demo-data.sql`. Just view them in MVP Analytics!

### Option B: Test with Real Mobile App

1. **Start Backend:**
   ```bash
   cd /Users/zumiww/Documents/NE\ DPM\ V5
   npm run server:dev
   ```

2. **Start Mobile App:**
   ```bash
   cd /Users/zumiww/Documents/NE\ DPM\ V5/mobile-app
   npx expo start
   ```

3. **Update API Base URL in mobile app:**
   Edit `mobile-app/app.config.ts`:
   ```typescript
   extra: {
     apiBaseUrl: 'http://YOUR_LOCAL_IP:3001/api'
   }
   ```

4. **Test on Phone:**
   - Open Expo Go app
   - Scan QR code from terminal
   - Navigate to event → booth
   - Click "Scan QR"
   - Scan any QR code
   - Check dashboard MVP Analytics

5. **Verify in Dashboard:**
   - Open http://localhost:5173
   - Go to MVP Analytics
   - Select your event
   - See the new scan appear!

---

## 🐛 Troubleshooting

### Mobile app can't connect to backend
- **Issue:** `Network request failed`
- **Fix:** Update `apiBaseUrl` in `app.config.ts` to your computer's local IP (not localhost)

### Scan not showing in dashboard
- **Check 1:** Look at backend console logs - did the POST request succeed?
- **Check 2:** Verify in Supabase SQL Editor:
  ```sql
  SELECT * FROM anonymous_scans ORDER BY created_at DESC LIMIT 10;
  ```
- **Check 3:** Make sure `event_id` and `booth_id` are correct UUIDs

### Device ID not persisting
- **Issue:** Same device counted as multiple unique devices
- **Fix:** Clear app data and restart - new `device_id` will be generated and cached

---

## 📈 What You Can Demo

### For Investors/Clients:

1. **Show Mobile App:**
   - "Here's what attendees see - simple event selection and QR scanner"
   - Scan a QR code (use any QR generator online for demo)
   - "That's it - no login, no personal data, just anonymous tracking"

2. **Show Dashboard:**
   - "Here's what event organizers see"
   - Click MVP Analytics
   - "850 scans from 350 unique attendees across 8 sponsor booths"
   - "Microsoft got 108 scans - that's proof their R50k sponsorship is working"

3. **Show Export:**
   - Click "Export to CSV"
   - "Organizers can send this report directly to sponsors"

---

## 🎯 Key Selling Points

1. **Privacy-First:** No names, no emails, just anonymous device IDs
2. **Instant ROI:** Sponsors see engagement data in real-time
3. **Zero Friction:** Attendees just scan QR codes - no app download required
4. **Proven Value:** "108 scans = 108 attendees who walked to Microsoft's booth"

---

**You now have a complete end-to-end data flow!** 🚀

Mobile scans → Backend API → Database → Dashboard Analytics → Sponsor Reports

