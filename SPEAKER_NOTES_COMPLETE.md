# NavEaze Presentation - Complete Speaker Notes

**Total Time: 12-15 minutes**  
**Tone: Confident, honest, data-driven**

---

## 🎯 Opening (30 seconds)

**[Slide: Title - NavEaze Business Results & Strategy]**

"Good morning. I'm Tlotlo Molope, founder of NavEaze. Today I'm sharing what I've built in the past 3 weeks, what I've learned, and what I need help with to scale this business.

This is a results-focused update—I'll show you working code, real financials, and honest gaps."

**[Transition: Click to next slide]**

---

## 💰 Slide 2: The R200,000 Problem (1 minute)

**[Slide: The R200,000 Problem: Sponsor Retention]**

"Let me start with the problem I'm solving. Event organizers collect data—ticket sales in Quicket, maybe foot traffic from NFC badges, sponsor leads in spreadsheets. But when a R50,000 sponsor asks 'did VIP attendees engage with our booth?', they can't connect the dots. They have data, not insights.

For sponsors: They're paying R50k+ per event but organizers can't prove ROI. 'Did our target customers visit our booth?' Organizers have foot traffic data but can't link it to ticket types. No proof means no renewal.

For event organizers: They risk losing R200,000+ in sponsor renewals because they can't prove value. They end up competing on price instead of data.

NavEaze solves the integration problem. We link ticket identity to engagement behavior—proving which attendees visited, how long they stayed, and whether they engaged. For mid-tier events that can't afford R50-per-attendee NFC infrastructure, we deliver enterprise analytics through a free app at 1/10th the cost."

**Key Point:** Sponsors don't pay for booth space—they pay for attention. We measure attention.

**[Transition]:** "So how did I get here? Let me show you the strategic pivot..."

---

## 🔄 Slide 3: The Strategic Pivot (1 minute)

**[Slide: The Strategic Pivot]**

"Here's what changed in the past weeks. I started with a broad idea: a Digital Product Management platform with AR navigation. Too broad, too unfocused.

The adapted solution: An end-to-end data platform. The AR app is the hook—it gets attendees to download. But sponsor engagement data is the value—it's what event organizers pay for.

The key learning here: Focus on commercial pain first, then build technology to solve it. Not the other way around. I was building cool tech without proving anyone would pay for it. That's backwards."

**[Transition]:** "That pivot came from validation signals..."

---

## ✅ Slide 4: Market Validation - Why Now? (2 minutes)

**[Slide: Market Validation - Why Now? Three Key Signals]**

"Three signals told me this was the right pivot:

**First: The hook is validated.** At AVI JOZI, I watched attendees struggle to find exhibitors like 'Pineapple on Pizza Studios.' Finding points of interest is a real pain point. AR and map navigation solve genuine UX problems—that's what gets people to download the app.

**Second: The value is validated.** Rex Bowden from XDS Canada told me: 'Focus on quantifiable metrics.' Event organizers don't care about features—they need hard numbers to show sponsors. Engagement data is the differentiator, not fancy tech.

**Third: The industry is ready.** At AWS JHB, I saw they're already using NFC badges for tracking. The industry is comfortable with location analytics. QR codes are a lower barrier than custom hardware, and we're delivering similar data at 1/10th the cost.

**Early pipeline:** AFDA Grad Fest is secured for November 15th. rAge 2026 is deferred while I focus on validation. My target is 3 Gold or Platinum organizers by Q1 2026 to prove the business model."

**[Transition]:** "So what have I actually built? Let me show you..."

---

## 🏗️ Slide 5: What I've Built - Execution Over Ideas (2 minutes)

**[Slide: What I've Built: Execution Over Ideas]**

"Here's what's live right now:

**Business Core:** A working B2B dashboard with real-time booth engagement analytics, CDV report generation for sponsors, and an event organizer admin panel. You can see engagement data updating live.

**Data Foundation:** I built a production-ready Supabase database—610 lines of SQL across 15 tables with over 40 indexes. POPIA and GDPR compliance is built in from Day 1, not bolted on later. I have 3 analytics views specifically for sponsor ROI calculations. GPS navigation fields are already in the schema for real-world wayfinding.

**Mobile App MVP:** Three core screens are built and functional: Event Selection, Booth List with search and filter, and QR Scanner with engagement logging. I simplified to GPS compass navigation for the Nov 15 launch—AR camera is deferred to Phase 2.

**Go-to-Market Execution:** AFDA Grad Fest pilot is secured for November 15th. I've configured 15 booths with unique QR codes. Marketing kit is ready—social posts, email blast, printed posters. I have a 3-week deployment schedule that's on track."

**Key Point:** This isn't slides—this is working software.

**[Transition]:** "Let me show you the prototype status..."

---

## 📱 Slide 6: Prototype Status (45 seconds)

**[Slide: Prototype Status]**

"Current build status:
- B2B Dashboard: LIVE and functional
- Database: 606 lines of SQL, compliance-ready, deployed
- Mobile App: 3 screens built, ready for TestFlight
- Quicket Integration Framework: API structure ready, waiting on customer API keys
- AFDA Pilot: November 15th, 15 booths, expecting 500 attendees

Everything you see here is deployed and working, not mockups."

**[Transition]:** "How did I ship this alone? Disciplined execution..."

---

## 🎯 Slide 7: Disciplined Execution: How I Shipped Alone (2 minutes)

**[Slide: Disciplined Execution: How I Shipped Alone]**

"Let me walk you through how I actually shipped this in 3 weeks as a solo founder.

**Phase 1: Database Schema.** 606 lines of SQL with POPIA and GDPR compliance built in. I made the migrations idempotent—you can run them multiple times without breaking things.

**Phase 2: B2B Dashboard.** I built the revenue driver first—the organizer value. Analytics views for sponsor ROI came before fancy features.

**Phase 3: Mobile App MVP.** Three core screens with reusable components. Event list, booth list, QR scanner. I made a strategic simplification: GPS compass instead of AR camera for November 15th. That saved me 2 weeks of camera permission complexity.

**Phase 4: AFDA Pilot Prep.** QR code generator for 15 unique codes. Marketing kit with social posts, email templates, and posters. A 3-week implementation schedule that's on track.

**But let me be honest about setbacks:**

I faced three major challenges:
- Database migration failed initially—610 lines was too large for one request. I split it into 3 parts.
- AR camera complexity exceeded my timeline. I deferred it to Phase 2 and used GPS compass instead.
- Quicket authentication proved complex. Moved to Phase 2 post-validation.

**The learning:** Ship working MVP first, add complexity after validation. I was falling into the trap of building perfect tech before proving anyone would pay. That's how startups die."

**[Transition]:** "This execution required hard choices about what NOT to build..."

---

## 🎯 Slide 8: The MVP Decision Framework (1 minute)

**[Slide: The MVP Decision Framework]**

"Let me show you what I could have built but didn't, and why:

**I could have built:**
- Full AR camera navigation with 3D booth markers
- Real-time attendee chat features
- AI-powered booth recommendations
- Gamification with leaderboards

**What I actually built:**
- GPS compass navigation—works reliably, no complex permissions
- QR code scanning—industry-standard, sponsors already understand it
- Dwell time tracking—the ONE metric sponsors actually care about
- Anonymous mode—privacy-first, faster launch

**Why?** We charge for outcomes—ROI proof—not features. Fancy tech doesn't pay the bills. Boring solutions that work do."

**[Transition]:** "So how do I justify the pricing? Let me show you the ROI math..."

---

## 💰 Slide 9: The ROI Math (1.5 minutes)

**[Slide: The ROI Math: Why Organizers Pay]**

"Let me show you why event organizers will pay for this. It comes down to ROI math.

Here's the situation organizers face today: They have ticket data in Quicket. They might have foot traffic numbers from NFC badges. They have sponsor leads in a spreadsheet. But when a R50,000 sponsor asks **'Did VIP ticket holders engage with our booth?'**—they can't answer. They have data—lots of it—but it's **fragmented**. They can't connect ticket identity to engagement behavior. No proof of ROI means the sponsor doesn't renew.

**[Pause]**

Losing one R50,000 sponsor is bad. But most events have 4-5 sponsors. That's R200,000+ at risk every year because organizers can't prove value.

NavEaze solves the integration problem. We connect Quicket ticket data to our engagement tracking. Now when that sponsor asks 'did VIPs engage?', the organizer shows them a report:

**'237 attendees visited your booth. 89 were VIP ticket holders. Average dwell time: 4.2 minutes. 89 QR code scans showing active interest.'**

That's not just data—that's **proof**.

**[Pause]**

Here's what that's worth: For a small event like AFDA—500 attendees, 15 booths—the organizer pays **R2,500** for our Starter package. If NavEaze helps renew even **ONE** R50,000 sponsor, that's a **20x return**. But most events have 4-5 sponsors worth R200,000 total. If we help renew all of them, that's an **80x return**.

**[Pause after "80x return" - let it land]**

The key insight: The investment pays for itself if we save just one sponsor renewal. Everything beyond that is pure upside. And as events grow—more attendees, more booths, more sponsors—they upgrade to our R8,000 Professional tier or R25,000 Enterprise tier. We grow with them."

**[Transition]:** "Let me show you the actual financials per event..."

---

## 📊 Slide 10: Our Financials (Per Event) (1 minute)

**[Slide: Our Financials (Per Event)]**

"Here's the unit economics across our three tiers:

**Starter (up to 500 attendees, ~15 booths):**
- Revenue: R2,500  
- Variable cost: R2,120 (lower because fewer attendees, less data, less support)
- Profit: R380  
- Profit margin: 15%
- Use case: AFDA, small campus events

**Professional (up to 2,000 attendees, ~30 booths):**
- Revenue: R8,000  
- Variable cost: R2,858 (moderate scale)
- Profit: R5,142  
- Profit margin: 64%
- This is our target tier—strong sustainable margins

**Enterprise (unlimited attendees, 50+ booths):**
- Revenue: R25,000  
- Variable cost: R4,793 (higher because more attendees, data, white-glove support)
- Profit: R20,207  
- Profit margin: 81%
- Use case: rAge, Sandton Convention Centre—highest absolute profit

**Notice the pattern:** As events get bigger, our costs go up—but revenue goes up FASTER. That's why margins improve from 15% to 64% to 81%. We're profitable at every tier, and we get MORE profitable as customers scale. This is classic SaaS economics.

At 23 events per month (weighted mix of tiers): We break even  
At 40 events per month: R150k+ profit  

**The key insight:** Variable costs scale with event size, but revenue scales faster. Once fixed costs are covered, every new event is 60-80% pure profit."

**[Transition]:** "So who's buying this and how do I reach them?"

---

## 🎯 Slide 11: Go-to-Market: Who Buys & How We Grow (1.5 minutes)

**[Slide: Go-to-Market: Who Buys & How We Grow]**

"**Target customer:** I'm selling to Revenue Teams—specifically Sponsorship Managers. NOT IT departments.

**Why?** Sponsorship managers own the ROI problem. They lose sleep over sponsor renewals. They have budget authority—R8k is a rounding error in their sponsor revenue budgets. And they measure success by revenue, not features. They don't care about fancy tech—they care about keeping R200k in renewals.

**Tiered pricing strategy:**
- Starter: R2,500 (up to 500 attendees) ← Entry point for small events like AFDA
- Professional: R8,000 (up to 2,000 attendees) ← Target tier, profitable
- Enterprise: R25,000 (unlimited) ← High-margin for large venues

The psychology here: Starter gets customers in the door and proves value at minimal cost. As their events grow, they naturally upgrade to Professional. The R25k Enterprise tier makes R8k look affordable. That's anchoring.

**Land & Expand model:**
- First sale: R2,500 Starter (proves value, breaks even)
- Migration: R8,000 Professional as event grows (64% margin, profitable)
- Upsell: Quicket integration (+R3k/event) for verified attendee segmentation
- Upsell: Annual venue license (R15k/year for unlimited events at one venue)
- Lifetime value: R50,000+ over 2 years (average 7 events, mix of tiers)

**The acquisition question I need help with:** How do I reach these sponsorship managers? I'm targeting Sandton Convention Centre, TicketPro Dome, Gallagher Convention Centre. What's the timeline from demo to payment? Do I cold email, LinkedIn outreach, or hire a sales rep?"

**[Transition]:** "Let me show you exactly what's done and what's next..."

---

## ✅ Slide 12: What's Done vs. What's Next (1.5 minutes)

**[Slide: What's Done vs. What's Next]**

"**COMPLETED:**
- Mobile App MVP: Event Selection, Booth List, QR Scanner—all functional
- Database Schema: POPIA/GDPR compliance, 15 tables, 40+ indexes, 3 analytics views
- Quicket Integration Framework: API structure ready, waiting on customer API keys to test

**NEXT PHASE timeline:**
- October 31: Deploy to TestFlight and Play Store for internal testing
- November 15: AFDA Grad Fest Pilot Event with GPS Compass Navigation live
- November 16-20: Post-Event Analysis—generate CDV reports, analyze metrics, create case study
- December 2025: AR-Lite Navigation Phase 2—enhanced AR camera overlay, QR anchor points for sub-5-meter accuracy

**Marketing Goals (Nov 1-15):**
- 500 AFDA student downloads (targeting 60% of attendees)
- 3 social media posts + 1 email blast to students
- 10 printed QR code posters at high-traffic campus areas
- Post-event: LinkedIn case study with real engagement data

**Current Funding Status:**
- Bootstrapped: R0 raised, R500 total spend (domain name only)
- Built on free tiers: Supabase, Expo, React Native
- No burn rate—fully sustainable on free infrastructure
- Not seeking funding pre-validation"

**[Transition]:** "Now let me be honest about where I need help..."

---

## 🚨 Slide 13: Strategic Gaps & Input Needed (2 minutes)

**[Slide: Strategic Gaps & Input Needed]**

"Here are the areas where I need investor attention or input:

**1. Technical Execution Challenges:**

**GPS Accuracy Indoors:** Current accuracy is ±10 meters, which is acceptable for the MVP. Goal for Phase 2 is sub-5-meter accuracy using QR anchor points—simpler and cheaper than full AR.

**AR Navigation Complexity:** I made the decision to defer 'true AR' to Phase 2. My approach: QR anchor points are simpler and cheaper than camera-based AR. They work indoors where GPS fails.

**Mobile App Deployment:** This is my first time using EAS and TestFlight. Risk: App Store approval delays could push the Nov 15 timeline. I need to submit by Oct 31 to have buffer time.

**2. Commercial Validation:**

I need 1-2 paid pilots in Q1 2026 to validate the R8k pricing with real customers. AFDA is free in exchange for case study rights, but I need paying customers to prove the model.

**Customer Acquisition Strategy:** How do I reach sponsorship managers at places like Sandton Convention Centre, TicketPro Dome, Gallagher Convention Centre? Is it cold email, LinkedIn outreach, industry events, or do I hire a sales rep?

**Sales Process Unknown:** What's the timeline from demo to payment? Do I need legal contracts or is a simple MSA enough? What's the typical sales cycle for B2B SaaS in the events industry?

**3. Personal Development & Team Growth:**

I learned full-stack development to ship this MVP—React Native, TypeScript, SQL, Express. This was my first time deploying to production, first time writing 610 lines of SQL, first time building B2B SaaS.

**Growth in 3 weeks:** I went from designer to founder-engineer.

**Next team milestone:** I need a Technical Co-Founder after 3 paid pilots validate the business model. Right now I'm the bottleneck—I can't sell and code at the same time.

**Questions for you:**
- When should I hire a Sales/BD person vs doing it myself?
- When do I bring on a Technical Co-Founder?
- Should I focus on getting to 3 paid pilots first, or raise pre-revenue?"

**[Transition]:** "Let me close with where we're headed..."

---

## 🎯 Closing: What Success Looks Like (1 minute)

**[Slide: Thank you / Questions slide - or stay on Strategic Gaps]**

"To summarize:

**What I've proven:**
- I can ship. 610 lines of SQL, working dashboard, mobile app ready for pilot—in 3 weeks, alone.
- The problem is real. Organizers are losing R200k in renewals because they can't prove sponsor ROI.
- The solution is validated. Industry feedback confirms CDV reports are exactly what they need.

**What I'm testing on Nov 15:**
- Can I get 500 students to download and use the app?
- Does the engagement data actually help with sponsor renewals?
- Will organizers pay R8,000 for this after seeing results?

**What I need help with:**
- Customer acquisition: How do I reach sponsorship managers?
- Sales process: What's the timeline from demo to payment?
- Team: When do I hire vs bootstrap longer?

**My commitment:** I'll have answers to all of these by November 20th—5 days after the pilot. I'll have real usage data, real CDV reports, and real feedback from AFDA organizers.

That's how I'll know if this business is viable or if I need to pivot again.

Thank you. Happy to take questions."

---

## 🎤 Q&A Prep (Common Questions)

### **Q: "What if AFDA doesn't work out?"**

**A:** "Then I have a validated case study of what NOT to do. I'll learn whether the problem is product, marketing, or target audience. The pilot is low-risk—I spent R500 and 3 weeks. If it fails, I pivot fast. But I've structured it to maximize learning either way."

---

### **Q: "How do you compete with NFC badge companies?"**

**A:** "NFC costs R50+ per attendee. We're R8k flat. They track presence, we track dwell time + active engagement. We're 1/10th the cost for better data. NFC also requires hardware procurement lead time—we work on attendees' existing phones. We're not competing with NFC for enterprise clients—we're winning mid-tier events that can't afford NFC at all."

---

### **Q: "What about privacy concerns?"**

**A:** "POPIA and GDPR compliance is built into the database schema from Day 1. We have data consent tracking, deletion requests, access requests, and audit logs. Users can opt for anonymous mode—no ticket linking required. For verified attendees, we ask explicit consent before linking ticket data to engagement. Privacy isn't an afterthought—it's a core feature."

---

### **Q: "Why not just use Google Analytics or heatmaps?"**

**A:** "Google Analytics shows website behavior. We measure physical behavior at events. Heatmaps work for foot traffic but don't link to ticket identity. We answer 'did VIP attendees engage?' not just 'how many people walked past?' The integration of ticket data + engagement data is what makes us unique."

---

### **Q: "What if Quicket builds this themselves?"**

**A:** "Quicket sells tickets—that's their core business. Building engagement analytics would require mobile app development, GPS tracking, data analytics—a completely different competency. We integrate WITH Quicket, not compete. If they wanted to build it, they would have already. We're actually INCREASING Quicket's value—organizers will prefer Quicket over Webtickets if it integrates with NavEaze."

---

### **Q: "How will you handle customer support at scale?"**

**A:** "Phase 1: I handle it manually to learn the edge cases. Phase 2: Build self-service documentation and in-app help. Phase 3: Hire customer success after 10 paying customers. Right now, I WANT to talk to customers—that's how I learn what to build next."

---

### **Q: "What's your biggest risk?"**

**A:** "Customer acquisition. I can build—I've proven that. But I haven't proven I can sell B2B SaaS to risk-averse event organizers. That's why Nov 15 is critical. If I can get AFDA to say 'this is amazing,' I have social proof. If they say 'meh,' I know I have a product problem or a messaging problem. Either way, I learn fast."

---

### **Q: "Are you profitable?"**

**A:** "Not yet—I have zero paying customers. But the unit economics are sound: R8k revenue, R2.8k variable cost, R5.2k profit per event at 64% margin. Once I hit 2 events per month, I'm covering my living expenses. At 10 events per month, I'm at R50k profit. The business CAN be profitable—I just need to prove customers will pay."

---

### **Q: "What happens if you can't get a technical co-founder?"**

**A:** "I keep building myself until I can afford to hire developers. I've already proven I can ship—610 lines of SQL and a working app in 3 weeks. It's slower than having a technical co-founder, but it's not a blocker. The real blocker is sales. I'd rather find a Sales Co-Founder than a Technical Co-Founder right now."

---

## ⏱️ Timing Breakdown

| Section | Time |
|---------|------|
| Opening | 30s |
| Problem | 1m |
| Pivot | 1m |
| Validation | 2m |
| What I Built | 2m |
| Prototype Status | 45s |
| Execution | 2m |
| MVP Framework | 1m |
| Pricing | 1.5m |
| Financials | 1m |
| Go-to-Market | 1.5m |
| What's Next | 1.5m |
| Strategic Gaps | 2m |
| Closing | 1m |
| **TOTAL** | **~12-14 minutes** |

---

## 🎯 Key Reminders

1. **Speak conversationally** - These notes are a guide, not a script
2. **Make eye contact** - Don't read slides word-for-word
3. **Use pauses** - After big numbers (R200k, 64% margin), pause for impact
4. **Show confidence in gaps** - "I don't know X yet, but here's how I'll learn it"
5. **End strong** - "I'll have answers by Nov 20th" shows commitment

---

## 🚀 Pre-Presentation Checklist

- [ ] Practice out loud 2x (time yourself)
- [ ] Test slide transitions
- [ ] Have backup (PDF on phone)
- [ ] Water bottle nearby
- [ ] Phone on silent
- [ ] Know your opening line by heart
- [ ] Know your closing line by heart

**You've got this. You've built something real. Now just explain it.** 🎯

