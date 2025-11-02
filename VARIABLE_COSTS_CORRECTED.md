# Variable Costs Corrected by Tier

## ❌ The Flaw in the Original Model

The financial plan assumed **R2,841 variable cost for ALL events**, regardless of size. This doesn't make sense because:

1. **Larger events = more attendees = more API calls, storage, notifications**
2. **Larger events = more booths = more QR codes, more support time**
3. **Variable costs should SCALE with event size**

---

## ✅ Corrected Variable Costs by Tier

### **Starter Tier (up to 500 attendees, ~15 booths)**

| Cost Item | Units | Rate (ZAR) | Qty | Cost (ZAR) |
|-----------|-------|------------|-----|-----------|
| Database storage | GB | 2.00 | 0.2 GB | 0.40 |
| API bandwidth | Per 10k calls | 1.00 | 20,000 calls | 2.00 |
| Push notifications | Per 1,000 | 5.00 | 500 attendees | 2.50 |
| SMS (optional) | Per SMS | 0.30 | 50 VIPs | 15.00 |
| QR code generation | Per 100 | 0 | 15 booths | 0.00 |
| CDV report | Per report | 0 | 1 | 0.00 |
| Quicket sync | Per sync | 0 | 1 | 0.00 |
| Customer onboarding | Hours @ R500/hr | 500 | 3 hours | 1,500 |
| Event setup/support | Hours @ R400/hr | 400 | 1.5 hours | 600 |
| Data export | Per report | 0 | 1 | 0.00 |
| **TOTAL - Starter** | | | | **R2,120** |

---

### **Professional Tier (up to 2,000 attendees, ~30 booths)**

| Cost Item | Units | Rate (ZAR) | Qty | Cost (ZAR) |
|-----------|-------|------------|-----|-----------|
| Database storage | GB | 2.00 | 0.5 GB | 1.00 |
| API bandwidth | Per 10k calls | 1.00 | 50,000 calls | 5.00 |
| Push notifications | Per 1,000 | 5.00 | 1,500 attendees | 7.50 |
| SMS (optional) | Per SMS | 0.30 | 150 VIPs | 45.00 |
| QR code generation | Per 100 | 0 | 30 booths | 0.00 |
| CDV report | Per report | 0 | 1 | 0.00 |
| Quicket sync | Per sync | 0 | 1 | 0.00 |
| Customer onboarding | Hours @ R500/hr | 500 | 4 hours | 2,000 |
| Event setup/support | Hours @ R400/hr | 400 | 2 hours | 800 |
| Data export | Per report | 0 | 1 | 0.00 |
| **TOTAL - Professional** | | | | **R2,858** |

**Note:** This is close to the original R2,841 estimate - the model was based on Professional tier assumptions.

---

### **Enterprise Tier (unlimited attendees, ~50+ booths)**

| Cost Item | Units | Rate (ZAR) | Qty | Cost (ZAR) |
|-----------|-------|------------|-----|-----------|
| Database storage | GB | 2.00 | 1.5 GB | 3.00 |
| API bandwidth | Per 10k calls | 1.00 | 150,000 calls | 15.00 |
| Push notifications | Per 1,000 | 5.00 | 5,000 attendees | 25.00 |
| SMS (optional) | Per SMS | 0.30 | 500 VIPs | 150.00 |
| QR code generation | Per 100 | 0 | 50 booths | 0.00 |
| CDV report | Per report | 0 | 1 | 0.00 |
| Quicket sync | Per sync | 0 | 1 | 0.00 |
| Customer onboarding | Hours @ R500/hr | 500 | 6 hours | 3,000 |
| Event setup/support | Hours @ R400/hr | 400 | 4 hours | 1,600 |
| Data export | Per report | 0 | 1 | 0.00 |
| **TOTAL - Enterprise** | | | | **R4,793** |

---

## 📊 Corrected Unit Economics

### **Starter Tier**
- Revenue: **R2,500**
- Variable Cost: **R2,120**
- Profit: **R380**
- Profit Margin: **15%**

✅ **Positive margin, good for customer acquisition**

---

### **Professional Tier**
- Revenue: **R8,000**
- Variable Cost: **R2,858**
- Profit: **R5,142**
- Profit Margin: **64%**

✅ **Strong margin, target tier**

---

### **Enterprise Tier**
- Revenue: **R25,000**
- Variable Cost: **R4,793**
- Profit: **R20,207**
- Profit Margin: **81%**

✅ **Highest absolute profit, best tier**

---

## 🎯 Updated Narrative

### **OLD (Wrong):**
> "Starter loses money (R2,500 revenue vs R2,841 cost = -R341 loss). We use it as a loss leader."

### **NEW (Correct):**
> "All three tiers are profitable. Starter has a 15% margin—enough to cover customer acquisition. Professional has 64% margin—our sustainable core. Enterprise has 81% margin—our high-value scaling tier. We don't lose money on any tier, we just optimize margins as customers grow."

---

## 💡 Why This Makes Sense

### **Small Events Cost Less to Service:**
- Fewer attendees = less data storage
- Fewer booths = less setup time
- Fewer API calls = less bandwidth
- Smaller scope = faster onboarding

### **Large Events Cost More to Service:**
- More attendees = more infrastructure
- More booths = more configuration
- More complexity = more support time
- Higher expectations = white-glove service

### **But Revenue Scales Faster Than Costs:**
- Starter: 15% margin (low but positive)
- Professional: 64% margin (strong)
- Enterprise: 81% margin (highest)

**This is classic SaaS economics** - margins improve with scale.

---

## 🎤 Updated Speaker Notes

### **Slide 10: Financials**

**SAY:**
> "Here's the unit economics across our three tiers:
>
> **Starter:** R2,500 revenue, R2,120 variable cost, R380 profit, 15% margin. This is our entry point—small events like AFDA. Profitable, but slim margin.
>
> **Professional:** R8,000 revenue, R2,858 variable cost, R5,142 profit, 64% margin. This is our target tier—medium events up to 2,000 attendees. Strong margins, sustainable growth.
>
> **Enterprise:** R25,000 revenue, R4,793 variable cost, R20,207 profit, 81% margin. Large venues like Sandton Convention Centre. Highest absolute profit, best margin.
>
> Notice the pattern: as events get bigger, our costs go up—but revenue goes up faster. That's why margins improve from 15% to 64% to 81%. This is classic SaaS economics. We're profitable at every tier, and we get MORE profitable as customers scale."

---

## 📈 Impact on Break-Even Analysis

### **NEW Break-Even Calculation:**

**Fixed Costs:** R111,170/month

**Average Variable Cost (Weighted by Tier Mix):**
- 40% Starter (R2,120) = R848
- 50% Professional (R2,858) = R1,429
- 10% Enterprise (R4,793) = R479
- **Weighted Average:** R2,756/event

**Average Revenue (Weighted by Tier Mix):**
- 40% Starter (R2,500) = R1,000
- 50% Professional (R8,000) = R4,000
- 10% Enterprise (R25,000) = R2,500
- **Weighted Average:** R7,500/event

**Contribution Margin:** R7,500 - R2,756 = **R4,744/event**

**Break-Even Events/Month:** R111,170 ÷ R4,744 = **23.4 events/month**

**This is BETTER than the original model (25 events/month).**

---

## ✅ Key Takeaways

1. ✅ **All tiers are profitable** (not just Professional and Enterprise)
2. ✅ **Margins improve with scale** (15% → 64% → 81%)
3. ✅ **Variable costs scale with event size** (R2,120 → R2,858 → R4,793)
4. ✅ **Break-even is slightly better** (23 events vs 25)
5. ✅ **Narrative is stronger** (no "loss leader" needed)

---

## 🚨 Correction for Cheat Sheet

**Update Key Numbers:**
- Starter margin: **15%** (not -13%)
- Professional margin: **64%** ✓
- Enterprise margin: **81%** (not 89%)
- Break-even: **23 events/month** (not 25)

---

**This correction makes your financial model much more defensible and realistic.** 🎯

