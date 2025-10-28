# 💰 NavEaze Financial Plan

## Business Model Summary

**NavEaze** is a B2B SaaS platform that provides AR navigation and engagement tracking for events and venues, with revenue coming from event organizers and sponsors who pay for verified attendee engagement data.

---

## 📊 FIXED COSTS (Monthly Operating Expenses)

### General Administration
| Item | Per Month (ZAR) | Per Year (ZAR) | Notes |
|------|-----------------|----------------|-------|
| **Office Supplies** | 500 | 6,000 | Digital-first, minimal physical supplies |
| **Accounting/Bookkeeping** | 1,500 | 18,000 | Monthly bookkeeping services |
| **Legal/Compliance** | 2,000 | 24,000 | POPIA/GDPR compliance, terms of service |
| **Insurance** | 1,000 | 12,000 | Professional liability, cyber insurance |
| **Bank Fees** | 300 | 3,600 | Business account, transaction fees |
| **Subtotal** | **5,300** | **63,600** | |

### Training & Development
| Item | Per Month (ZAR) | Per Year (ZAR) | Notes |
|------|-----------------|----------------|-------|
| **Staff Training** | 2,000 | 24,000 | Courses, certifications (React Native, Supabase) |
| **Industry Events** | 1,500 | 18,000 | Conferences, networking (amortized) |
| **Subtotal** | **3,500** | **42,000** | |

### Selling or Delivering Product/Service
| Item | Per Month (ZAR) | Per Year (ZAR) | Notes |
|------|-----------------|----------------|-------|
| **Supabase Hosting (Pro Plan)** | 450 | 5,400 | Database, auth, storage (~$25/month) |
| **Vercel Hosting (Pro)** | 360 | 4,320 | B2B dashboard hosting (~$20/month) |
| **Expo EAS Build (Production)** | 540 | 6,480 | Mobile app builds & updates (~$30/month) |
| **Domain & SSL** | 100 | 1,200 | naveaze.com, privacy.naveaze.com |
| **Email Service (SendGrid/Mailgun)** | 200 | 2,400 | Transactional emails, notifications |
| **SMS/Push Notifications (OneSignal)** | 300 | 3,600 | Event reminders, alerts |
| **CDN/Image Hosting (Cloudinary)** | 150 | 1,800 | Sponsor logos, venue floorplans |
| **Error Tracking (Sentry)** | 120 | 1,440 | Production error monitoring |
| **Analytics (Mixpanel/PostHog)** | 200 | 2,400 | Product analytics |
| **Customer Support (Intercom/Crisp)** | 450 | 5,400 | Chat support for event organizers |
| **Subtotal** | **2,870** | **34,440** | |

### Rent (if applicable)
| Item | Per Month (ZAR) | Per Year (ZAR) | Notes |
|------|-----------------|----------------|-------|
| **Co-working Space (Optional)** | 3,000 | 36,000 | Hot desk in Cape Town/JHB (or R0 if remote) |
| **Subtotal** | **3,000** | **36,000** | |

### Labour
| Item | Per Month (ZAR) | Per Year (ZAR) | Notes |
|------|-----------------|----------------|-------|
| **Founder Salary (You)** | 25,000 | 300,000 | Minimal living expenses during MVP phase |
| **Full-Stack Developer (Contract)** | 35,000 | 420,000 | Part-time or contract (0.5 FTE) |
| **UX/UI Designer (Contract)** | 15,000 | 180,000 | 2-3 days/month for refinements |
| **Sales/BD (Commission-based)** | 5,000 | 60,000 | Base retainer + 10% commission on deals |
| **Subtotal** | **80,000** | **960,000** | |

### Marketing & Advertising
| Item | Per Month (ZAR) | Per Year (ZAR) | Notes |
|------|-----------------|----------------|-------|
| **Google Ads (B2B Search)** | 5,000 | 60,000 | "event analytics", "sponsor ROI tracking" |
| **LinkedIn Ads (B2B)** | 4,000 | 48,000 | Targeting event organizers, venue managers |
| **Content Marketing** | 2,000 | 24,000 | Blog posts, case studies, SEO |
| **Social Media Management** | 1,500 | 18,000 | Twitter, LinkedIn presence |
| **PR/Press Releases** | 1,000 | 12,000 | TechCabal, Ventureburn, local tech press |
| **Event Sponsorships** | 3,000 | 36,000 | Sponsor 1-2 small events to demo product |
| **Subtotal** | **16,500** | **198,000** | |

---

### **TOTAL FIXED COSTS**
| Category | Per Month (ZAR) | Per Year (ZAR) |
|----------|-----------------|----------------|
| General Administration | 5,300 | 63,600 |
| Training | 3,500 | 42,000 |
| Product/Service Delivery | 2,870 | 34,440 |
| Rent | 3,000 | 36,000 |
| Labour | 80,000 | 960,000 |
| Marketing & Advertising | 16,500 | 198,000 |
| **GRAND TOTAL (Fixed)** | **111,170** | **1,334,040** |

---

## 📈 VARIABLE COSTS (Scale with Usage)

These costs increase as you acquire more customers and process more events.

| Cost Item | Units | Rate (ZAR) | Qty/Event | Cost/Event | Cost/Month | Cost/Year | Notes |
|-----------|-------|------------|-----------|------------|------------|-----------|-------|
| **Supabase Database Usage** | GB storage | 2.00 | 0.5 GB | 1.00 | 50 | 600 | Scales with CDV reports stored |
| **API Requests (Bandwidth)** | Per 1M requests | 100 | 0.1M | 10 | 500 | 6,000 | Mobile app API calls |
| **Push Notifications** | Per 1,000 | 5 | 2,000 | 10 | 500 | 6,000 | Event reminders to attendees |
| **QR Code Generation** | Per 100 codes | 0 | 100 | 0 | 0 | 0 | Free (generated in-app) |
| **Quicket API Calls** | Per event sync | 0 | 1 | 0 | 0 | 0 | Free (Quicket provides API) |
| **Data Export (CDV Reports)** | Per export | 0 | 10 | 0 | 0 | 0 | Free (automated) |
| **Customer Onboarding** | Hours | 500 | 4 hours | 2,000 | 10,000 | 120,000 | Assumes 5 new customers/month |
| **Customer Support** | Hours/month | 400 | 10 hours | - | 4,000 | 48,000 | Ongoing support per customer |

### **TOTAL VARIABLE COSTS**
| Scenario | Events/Month | Customers/Month | Monthly Cost (ZAR) | Yearly Cost (ZAR) |
|----------|--------------|-----------------|-------------------|-------------------|
| **MVP Phase** (Months 1-6) | 3 | 3 | 15,050 | 180,600 |
| **Growth Phase** (Months 7-12) | 10 | 8 | 25,100 | 301,200 |
| **Scale Phase** (Year 2+) | 25 | 20 | 45,200 | 542,400 |

---

## 🛠️ CAPITAL ASSETS (One-Time Startup Costs)

| Startup Asset | Units | Useful Lifespan (months) | Cost (ZAR) | Total Own Contribution | Notes |
|---------------|-------|--------------------------|------------|------------------------|-------|
| **Development Laptop (MacBook Pro)** | 1 | 36 | 35,000 | 35,000 | Already owned |
| **iPhone (iOS Testing)** | 1 | 24 | 18,000 | 18,000 | For testing mobile app |
| **Android Device (Testing)** | 1 | 24 | 8,000 | 8,000 | For testing mobile app |
| **Office Furniture** | 1 set | 60 | 5,000 | 5,000 | Desk, chair (if remote) |
| **Software Licenses** | - | 12 | 3,000 | 3,000 | Figma, Adobe, productivity tools |
| **Initial Marketing Materials** | - | 6 | 2,500 | 2,500 | Pitch deck design, brand kit |
| **Website/Landing Page** | 1 | 12 | 8,000 | 8,000 | Professional website for B2B sales |
| **MVP Development (if outsourced)** | 1 | - | 0 | 0 | You're building it yourself |
| **Legal Setup (Pty Ltd)** | 1 | - | 5,000 | 5,000 | Company registration, IP protection |
| **TOTAL CAPITAL ASSETS** | - | - | **84,500** | **84,500** | |

---

## 💵 REVENUE MODEL

### Pricing Tiers (B2B)

#### **1. Event Organizer Subscription**
| Tier | Price/Event (ZAR) | What's Included | Target Customer |
|------|-------------------|-----------------|-----------------|
| **Starter** | 2,500 | Up to 500 attendees, 10 booths, basic CDV reports | Small local events, workshops |
| **Professional** | 8,000 | Up to 2,000 attendees, 50 booths, advanced analytics | Medium conferences, expos |
| **Enterprise** | 25,000 | Unlimited attendees/booths, white-label, dedicated support | Large trade shows, festivals |

#### **2. Sponsor ROI Reporting (Add-On)**
| Service | Price (ZAR) | Description |
|---------|-------------|-------------|
| **Quicket Integration** | 3,000/event | Link attendee tickets to engagement data |
| **Custom ROI Dashboard** | 5,000/event | White-labeled dashboard for sponsors |
| **Sponsor Prospectus** | 2,000 | PDF report showing historical ROI for sponsors |

#### **3. Venue Owner Annual License**
| Tier | Price/Year (ZAR) | What's Included |
|------|------------------|-----------------|
| **Single Venue** | 15,000 | Unlimited events at 1 venue, floorplan management |
| **Multi-Venue** | 40,000 | Up to 5 venues, centralized analytics |

---

## 📊 FINANCIAL PROJECTIONS (Year 1)

### **Revenue Assumptions (Conservative)**
- **Month 1-3:** 2 pilot events (free/discounted for testimonials)
- **Month 4-6:** 5 paid events @ avg R5,000 = R25,000/month
- **Month 7-9:** 10 paid events @ avg R7,000 = R70,000/month
- **Month 10-12:** 15 paid events @ avg R8,000 = R120,000/month

### **Year 1 Summary**
| Metric | Amount (ZAR) |
|--------|--------------|
| **Total Revenue** | 585,000 |
| **Fixed Costs** | (1,334,040) |
| **Variable Costs** | (240,000) |
| **Net Profit/Loss** | **(989,040)** |

**Funding Required:** R1,000,000 to reach break-even

---

## 💡 BREAK-EVEN ANALYSIS

### **Monthly Break-Even**
- **Fixed Costs:** R111,170/month
- **Variable Cost per Event:** R2,510 (average)
- **Average Revenue per Event:** R7,000

**Break-Even Events/Month:**  
```
Break-Even = Fixed Costs / (Revenue per Event - Variable Cost per Event)
= 111,170 / (7,000 - 2,510)
= 111,170 / 4,490
= 24.8 events/month
```

**You need ~25 events per month to break even.**

### **Path to Profitability**
| Month | Events | Revenue (ZAR) | Total Costs (ZAR) | Profit/(Loss) |
|-------|--------|---------------|-------------------|---------------|
| 1-3 (Pilot) | 2 | 0 | 345,510 | (345,510) |
| 4-6 (Early) | 5 | 75,000 | 360,765 | (285,765) |
| 7-9 (Growth) | 10 | 210,000 | 408,810 | (198,810) |
| 10-12 (Scale) | 15 | 300,000 | 468,990 | (168,990) |
| **Year 1 Total** | 32 | **585,000** | **1,584,075** | **(999,075)** |
| **Year 2 (25 events/month)** | 300 | **2,100,000** | **1,876,440** | **+223,560** ✅ |

**You become profitable in Year 2, Month 3.**

---

## 🎯 VALUE PROPOSITION (For Sponsors)

### **What Sponsors Currently Get:**
- A booth at the event
- Logo on website
- Shoutout on social media
- **NO DATA** on actual attendee engagement

### **What NavEaze Provides:**
✅ **Verified Attendee Engagement**
- How many unique attendees visited their booth
- Average dwell time (passive vs active engagement)
- QR code scan confirmation (active interest)
- Quicket integration = link engagement to real ticket purchasers

✅ **ROI Proof for Future Sponsorships**
- "Your Gold sponsorship generated 347 active engagements with an avg dwell time of 4.2 minutes"
- "73% of Gold tier visitors scanned your QR code vs 22% for Bronze tier"
- Sponsors can justify higher spend next year

✅ **Competitive Benchmarking**
- Compare booth performance to industry averages
- See sponsor tier ROI differences

### **Pricing to Sponsors (via Event Organizer)**
Event organizers can charge sponsors **R2,000-R5,000 extra** for "Engagement Analytics Package" powered by NavEaze.

**Example:**
- Gold Sponsor pays R50,000 for booth
- +R5,000 for NavEaze ROI report
- Event organizer pays NavEaze R3,000 (keeps R2,000 margin)
- Sponsor gets proof of ROI = happy to renew next year

---

## 🚀 FUNDING STRATEGY

### **Option 1: Bootstrapped**
- Use personal savings: R200,000
- Minimize fixed costs (no office, part-time help)
- Extend runway to 6 months
- Goal: 3 paying customers by Month 4

### **Option 2: Friends & Family Round**
- Raise: R500,000
- Equity: 10-15%
- Use: 6 months runway + marketing
- Goal: 10 paying customers by Month 6

### **Option 3: Angel/Seed Investment**
- Raise: R1,500,000
- Equity: 20-25%
- Use: 12 months runway + hire team
- Goal: 50 events, R500k ARR by Month 12
- Position for Series A

### **Option 4: Government Grant (SEDA, IDC)**
- Apply for: R300,000 grant (non-dilutive)
- Use: MVP development, first 3 events
- Prove traction, then raise angel round

---

## 📅 18-MONTH MILESTONES

### **Month 1-3: MVP Launch**
- Complete mobile app + B2B dashboard
- Database migration (DONE ✅)
- 2 pilot events (free)
- Collect testimonials

### **Month 4-6: First Customers**
- 5 paying events @ avg R5,000
- Quicket integration live
- First case study published
- Revenue: R75,000

### **Month 7-9: Product-Market Fit**
- 10 paying events/month
- Refine pricing based on feedback
- Hire part-time sales/BD
- Revenue: R210,000

### **Month 10-12: Scale Preparation**
- 15 events/month
- First annual venue license sold
- Series A pitch deck ready
- Revenue: R360,000

### **Month 13-18: Growth**
- 25 events/month (break-even)
- Expand to Nigeria, Kenya
- Raise Series A (R5M+)
- Revenue: R1,050,000 (6 months)

---

## 🎓 ASSUMPTIONS & NOTES

1. **Currency:** ZAR (South African Rand). Use exchange rate of ~R18/USD for USD services.
2. **Production Month:** Assumes 26 working days/month (312 days/year).
3. **Depreciation:** Capital assets depreciated at 25% per year.
4. **Customer Acquisition Cost (CAC):** ~R8,000 per customer (marketing + sales time).
5. **Lifetime Value (LTV):** ~R50,000 (assumes customer runs 7 events over 2 years).
6. **LTV:CAC Ratio:** 6.25:1 (healthy for SaaS).
7. **Churn Rate:** Assume 15% annual churn (1 in 7 customers don't renew).

---

## 📞 NEXT STEPS

1. **Validate Pricing:** Interview 10 event organizers to confirm willingness to pay R5,000-R25,000/event.
2. **Pilot Partners:** Secure 2-3 pilot events for Nov 2025 (your demo deadline).
3. **Financial Model:** Build detailed Excel/Google Sheets model with monthly cash flow.
4. **Pitch Deck:** Create investor deck highlighting sponsor ROI value prop.
5. **Apply for Grants:** SEDA Seed Fund, IDC, Innovation Bridge.

---

## 💬 KEY TALKING POINTS FOR INVESTORS

1. **"We turn sponsor guesswork into verified ROI data."**
2. **"Event organizers can charge sponsors 10% more for engagement analytics."**
3. **"Our Quicket integration links ticket sales to booth engagement—no other platform does this."**
4. **"25 events/month = break-even. We're targeting 50+ by Month 18."**
5. **"POPIA/GDPR compliance is built-in, not bolted on."**
6. **"Expansion-ready: Same model works for Nigeria (Eventbrite), Kenya (TicketSasa)."**

---

**This financial plan gives you a solid foundation to answer any business planning questions. Let me know if you need me to adjust any numbers or add specific scenarios!**

