# NavEaze: One-Page Summary

## The Problem
Event organizers lose R200,000+ annually when sponsors don't renew because they can't prove ROI. Traditional systems (Quicket, NFC badges, foot traffic counters) can't connect **who attended** (ticket data) to **what they did** (booth engagement).

## The Solution
NavEaze is a **thin integration layer** that plugs into existing event systems (Quicket) and generates sponsor ROI reports by connecting ticket identity to physical booth engagement.

## How It Works

### For Event Organizers (15-minute setup)
**Step 1: Import Event (5 min)**
- Connect Quicket API key
- Import event, attendees, ticket tiers

**Step 2: Setup Booths (5 min)**
- Upload floorplan (optional)
- Drop pins for each sponsor booth
- Auto-generate QR codes

**Step 3: Print & Place (5 min)**
- Download QR codes as PDF
- Print and place at physical booths

### During the Event (Attendee Experience)
**Mobile App:**
1. Select event → See booth map
2. Navigate to booth → GPS compass + distance
3. Arrive at booth → Scan QR code
4. Backend tracks: Dwell time (GPS) + Active engagement (QR)

### After the Event (Sponsor ROI Reports)
**Dashboard:**
- Generate report showing per sponsor:
  - Total visits
  - VIP vs. General ticket holder breakdown
  - Average dwell time
  - Active engagement rate (QR scans)
  - Comparison to other booths

## The Value Proposition

**For Organizers:**
- R8,000 investment prevents R50,000+ sponsor loss
- 6.25x ROI minimum, up to 25x if all sponsors renew
- 15-minute setup, fully automated tracking

**For Sponsors:**
- First-time proof their booth generated value
- See which ticket tiers engaged most
- Justify renewal with concrete data

## Why It's Defensible

**We DON'T compete with:**
- Quicket (ticketing/event management)
- Eventbrite (event creation)
- Cvent (full EMS platforms)

**We ARE the only platform that:**
- Connects Quicket ticket data to physical engagement
- Tracks both passive (dwell) and active (QR) engagement
- Generates standardized sponsor ROI reports

**The Moat:** Quicket has ticket data. We have engagement data. Only together can you prove which ticket holders engaged with which sponsors.

## The Business Model

**Tiered SaaS Pricing:**
- Starter (≤500 attendees): R2,500/event
- Professional (≤2,000 attendees): R8,000/event
- Enterprise (unlimited): R25,000/event

**Unit Economics:**
- Variable cost: R2,120-R4,793/event
- Profit margin: 15-81% (scales with tier)
- Break-even: 23 events/month

**Land & Expand:**
- Land: Single event trial
- Expand: Annual license (R120k/year)

## Go-To-Market Strategy

**Target Customer:** Sponsorship Managers (not IT departments)

**Phase 1 (Nov 2025):** AFDA Grad Fest pilot → Proof of concept
**Phase 2 (Q1 2026):** 3 paid pilots → Product-market fit
**Phase 3 (Q2 2026):** Major venues (Sandton, Gallagher) → Scale

**Key Insight:** Start narrow (university events), win early (prove ROI), expand fast (convention centers).

## The Tech Stack

**B2B Dashboard (React/Vite):**
- QuicketSyncPage → Import event
- BoothSetupPage → Place booth pins
- ROIDashboardPage → Generate reports

**Mobile App (React Native/Expo):**
- Event selection → Booth map
- GPS navigation → QR scanning
- Engagement tracking → Backend sync

**Backend (Node.js/Express):**
- Quicket API integration
- Engagement tracking
- Analytics aggregation
- Supabase database

## Current Status

**✅ Completed:**
- B2B dashboard UI (3 pages)
- Mobile app (navigation + QR scanning)
- Database schema (events, booths, engagement)

**🚧 In Progress:**
- Quicket API integration
- Analytics endpoint (ROI aggregation)
- End-to-end testing

**📅 Next Milestone:** Working prototype for AFDA Nov 15

## The "Secret"
Traditional event tech measures foot traffic. We measure **attention**. Sponsors don't pay for booth space—they pay for attention. We're the only ones who can prove they got it.

