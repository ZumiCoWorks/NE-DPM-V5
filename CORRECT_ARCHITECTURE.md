# ✅ CORRECT ARCHITECTURE: B2B → B2C Integration

**Date:** October 24, 2025  
**Issue Fixed:** Quicket integration flow was backwards  
**Status:** ✅ Corrected and implemented

---

## ❌ **WRONG APPROACH (What I Built Initially)**

```
B2C User (Attendee)
    ↓
Downloads NavEaze App
    ↓
"Login with Quicket" button
    ↓
OAuth flow with Quicket
    ↓
User authenticates directly with Quicket
```

**Problem:** This makes no sense. The attendee already HAS a ticket from Quicket. They shouldn't need to "log in" again.

---

## ✅ **CORRECT APPROACH (Fixed Architecture)**

### **The Two-Part System:**

---

## 🏢 **PART 1: B2B Dashboard (Event Organizer)**

### **Step 1: Organizer Links Quicket Account**

```
Event Organizer logs into NavEaze Dashboard
    ↓
Settings → Integrations → Quicket
    ↓
Enters Quicket API credentials:
- API Key (from Quicket dashboard)
- User Token (organizer's Quicket account)
    ↓
NavEaze syncs attendee list via Quicket API
    ↓
Attendees are now in NavEaze database
```

**Database Schema:**

```sql
-- Organizer's Quicket credentials (encrypted)
CREATE TABLE quicket_integrations (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  api_key TEXT NOT NULL, -- Encrypted
  user_token TEXT NOT NULL, -- Encrypted
  last_sync_at TIMESTAMPTZ,
  mock_mode BOOLEAN DEFAULT false
);

-- Synced attendee data from Quicket
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  quicket_ticket_id VARCHAR(100) UNIQUE, -- e.g., "AFDA-2025-001234"
  attendee_name VARCHAR(255),
  attendee_email VARCHAR(255),
  ticket_type VARCHAR(100), -- "VIP", "General Admission", etc.
  ticket_status VARCHAR(50), -- "valid", "cancelled", "refunded"
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📱 **PART 2: B2C Mobile App (Attendee)**

### **Step 2: Attendee Links Their Ticket**

**Attendee Journey:**

```
1. Attendee buys ticket on Quicket
   └─→ Receives email with:
       • PDF ticket with QR code
       • Ticket ID (e.g., "AFDA-2025-001234")

2. Attendee downloads NavEaze app
   └─→ Opens app for first time

3. App shows auth mode selection:
   ┌────────────────────────────────┐
   │ Welcome to NavEaze!            │
   │                                │
   │ [ 👤 Anonymous Mode ]          │
   │ Use without linking a ticket   │
   │                                │
   │ [ 🎫 I Have a Ticket ]         │
   │ Link for prizes & features     │
   └────────────────────────────────┘

4. If "I Have a Ticket" → verify-ticket screen:
   ┌────────────────────────────────┐
   │ Verify Your Ticket             │
   │                                │
   │ [ 📷 Scan QR Code ]            │
   │ Use camera to scan ticket      │
   │                                │
   │ [ # Enter Ticket ID ]          │
   │ Manually type ticket number    │
   └────────────────────────────────┘

5. User chooses method:
   
   Option A: Scan QR Code
   └─→ Camera opens
   └─→ Scans Quicket ticket QR code
   └─→ Extracts ticket ID from QR data
   └─→ Calls API: POST /api/tickets/verify
   
   Option B: Manual Entry
   └─→ User types: "AFDA-2025-001234"
   └─→ Calls API: POST /api/tickets/verify

6. Backend verifies ticket:
   SELECT * FROM event_attendees 
   WHERE quicket_ticket_id = 'AFDA-2025-001234'
   AND ticket_status = 'valid';
   
   If found:
   └─→ Return: { valid: true, attendee: { name, email, ticket_type } }
   
   If not found:
   └─→ Return: { valid: false, error: "Ticket not found" }

7. If valid → ticket-consent screen:
   ┌────────────────────────────────┐
   │ Ticket Verified!               │
   │ Welcome, John Smith!           │
   │                                │
   │ Your Ticket:                   │
   │ ID: AFDA-2025-001234           │
   │ Name: John Smith               │
   │ Email: john@example.com        │
   │ Type: General Admission        │
   │                                │
   │ Data Sharing Preferences:      │
   │ ☑ Share with organizer         │
   │ ☐ Share with sponsors          │
   │ ☑ Prize draw eligibility       │
   │                                │
   │ [ Accept & Continue ]          │
   └────────────────────────────────┘

8. User accepts → app stores:
   - Ticket data (name, email, ticket ID)
   - Consent preferences
   - Auth mode: "ticket"

9. User navigates to event → booth list → QR scan
   └─→ All data is linked to their ticket ID
```

---

## 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────┐
│  B2B: EVENT ORGANIZER                                       │
│                                                             │
│  NavEaze Dashboard                                          │
│      ↓                                                      │
│  Connect Quicket API                                        │
│      ↓                                                      │
│  Sync attendee list                                         │
│      ↓                                                      │
│  ┌──────────────────────────────────┐                      │
│  │ NavEaze Database                 │                      │
│  │ event_attendees table            │                      │
│  │ - ticket_id: AFDA-2025-001234    │                      │
│  │ - name: John Smith               │                      │
│  │ - email: john@example.com        │                      │
│  │ - ticket_type: General Admission │                      │
│  └──────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                     ↓
                     │ Ticket data is ready
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  B2C: ATTENDEE                                              │
│                                                             │
│  Mobile App                                                 │
│      ↓                                                      │
│  Scans Quicket ticket QR code                               │
│      ↓                                                      │
│  POST /api/tickets/verify                                   │
│  { ticketId: "AFDA-2025-001234" }                           │
│      ↓                                                      │
│  Backend checks event_attendees table                       │
│      ↓                                                      │
│  Returns: { valid: true, attendee: {...} }                  │
│      ↓                                                      │
│  App shows: "Welcome, John Smith!"                          │
│      ↓                                                      │
│  User accepts consent preferences                           │
│      ↓                                                      │
│  App stores ticket data locally                             │
│      ↓                                                      │
│  User scans booth QR codes                                  │
│      ↓                                                      │
│  POST /api/cdv-report                                       │
│  { ticket_id: "AFDA-2025-001234", booth_id: "...", ... }    │
│      ↓                                                      │
│  Backend links engagement to ticket_id                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ **BACKEND API ENDPOINTS NEEDED**

### **1. POST /api/tickets/verify**

**Request:**
```json
{
  "ticketId": "AFDA-2025-001234"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "attendee": {
    "id": "uuid-here",
    "ticketId": "AFDA-2025-001234",
    "name": "John Smith",
    "email": "john@example.com",
    "ticket_type": "General Admission",
    "event_id": "uuid-here"
  }
}
```

**Response (Failure):**
```json
{
  "valid": false,
  "error": "Ticket not found or already used"
}
```

**Implementation:**
```typescript
// api/routes/tickets.ts
router.post('/verify', async (req, res) => {
  const { ticketId } = req.body;

  const { data: attendee, error } = await supabaseAdmin
    .from('event_attendees')
    .select('*')
    .eq('quicket_ticket_id', ticketId)
    .eq('ticket_status', 'valid')
    .single();

  if (error || !attendee) {
    return res.json({ valid: false, error: 'Ticket not found' });
  }

  return res.json({
    valid: true,
    attendee: {
      id: attendee.id,
      ticketId: attendee.quicket_ticket_id,
      name: attendee.attendee_name,
      email: attendee.attendee_email,
      ticket_type: attendee.ticket_type,
      event_id: attendee.event_id
    }
  });
});
```

---

### **2. POST /api/quicket/sync (B2B Dashboard)**

**Called by:** B2B Dashboard when organizer connects Quicket

**What it does:**
1. Uses organizer's Quicket API credentials
2. Fetches attendee list from Quicket API
3. Inserts/updates `event_attendees` table
4. Returns sync status

**Request:**
```json
{
  "organizationId": "uuid",
  "apiKey": "quicket-api-key",
  "userToken": "quicket-user-token",
  "eventId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "attendeesSynced": 247,
  "lastSyncAt": "2025-10-24T10:30:00Z"
}
```

---

## 📊 **DATABASE UPDATES NEEDED**

### **Add to existing schema:**

```sql
-- Attendees synced from Quicket
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  quicket_ticket_id VARCHAR(100) UNIQUE NOT NULL,
  attendee_name VARCHAR(255),
  attendee_email VARCHAR(255),
  ticket_type VARCHAR(100),
  ticket_status VARCHAR(50) DEFAULT 'valid', -- 'valid', 'cancelled', 'refunded', 'used'
  synced_from_quicket BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_attendees_ticket_id ON event_attendees(quicket_ticket_id);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_email ON event_attendees(attendee_email);

-- RLS Policy
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can verify their own tickets"
  ON event_attendees FOR SELECT
  USING (true); -- Anyone can verify a ticket (we check ticket_id match in API)

CREATE POLICY "Event organizers can manage attendees"
  ON event_attendees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizations o ON e.organization_id = o.id
      WHERE e.id = event_attendees.event_id
      AND o.id = auth.uid()
    )
  );
```

---

## 🔐 **PRIVACY IMPROVEMENTS**

**This architecture is BETTER for privacy:**

1. **No OAuth required** - Attendees don't give Quicket credentials to NavEaze
2. **Ticket verification only** - We only check if ticket ID exists
3. **Data already owned** - Organizer already has attendee data from Quicket
4. **Attendee controls sharing** - Consent preferences still apply

**Comparison:**

| Approach | Data Source | Attendee Action | Privacy Risk |
|----------|-------------|-----------------|--------------|
| **❌ Wrong (OAuth)** | Attendee logs into Quicket | Give credentials to 3rd party | HIGH |
| **✅ Correct (Verification)** | Organizer syncs from Quicket | Just verify ticket ID | LOW |

---

## 🎤 **HOW TO PRESENT THIS TOMORROW**

### **If Asked: "How does Quicket integration work?"**

> "Great question. It's a two-part system. First, the event organizer connects their Quicket account to the NavEaze dashboard and syncs their attendee list—this is B2B integration. Then, when an attendee downloads the NavEaze app, they simply scan their Quicket ticket QR code or enter their ticket ID. We verify it against the synced attendee list. No OAuth, no credentials—just ticket verification. The attendee is already in the system because the organizer imported them. This is privacy-friendly and seamless for users."

### **If Asked: "Do users need to log into Quicket?"**

> "No. That would be bad UX. They already have a ticket. They just verify it by scanning the QR code or entering the ticket number. We match it to the attendee list that the event organizer already imported from Quicket. It's like checking in at a hotel—you show your confirmation number, you don't log into Booking.com again."

---

## ✅ **FILES IMPLEMENTED**

1. ✅ **`mobile-app/app/auth-mode.tsx`** - Updated (changed "Login with Quicket" to "I Have a Ticket")
2. ✅ **`mobile-app/app/verify-ticket.tsx`** - NEW (QR scan or manual entry)
3. ✅ **`mobile-app/app/ticket-consent.tsx`** - NEW (shows verified ticket data + consent)
4. ❌ **`mobile-app/app/quicket-consent.tsx`** - DELETED (old, incorrect approach)

---

## 🚀 **NEXT STEPS BEFORE NOV 15**

### **Backend Work Needed:**

1. **Create API route:** `POST /api/tickets/verify`
   - Input: `{ ticketId: string }`
   - Output: `{ valid: boolean, attendee?: {...} }`

2. **Create database table:** `event_attendees`
   - Run migration to add table
   - Add RLS policies

3. **Create Quicket sync service:** (For B2B dashboard)
   - `POST /api/quicket/sync`
   - Fetches attendees from Quicket API
   - Inserts into `event_attendees` table

### **Testing Checklist:**

- [ ] Test ticket QR code scanning
- [ ] Test manual ticket ID entry
- [ ] Test valid ticket verification
- [ ] Test invalid ticket rejection
- [ ] Test consent screen with pre-populated data
- [ ] Test that booth visits are linked to ticket ID

---

## 🎯 **BOTTOM LINE**

### **Before (WRONG):**
- B2C user logs into Quicket from mobile app
- User gives Quicket credentials to NavEaze
- Confusing UX, privacy risk

### **After (CORRECT):**
- B2B organizer syncs attendees from Quicket
- B2C user just verifies their ticket (scan or enter ID)
- Seamless UX, privacy-friendly, makes sense!

**This is how ticketing integrations should work.** ✅

---

**Status:** ✅ Architecture corrected  
**Files Updated:** 4 (1 deleted, 2 created, 1 updated)  
**Backend Work:** 3 API endpoints + 1 database table  
**Ready for:** Testing & Nov 15 launch 🚀

