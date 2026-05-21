# Product Analytics: Essential Terms & Concepts

**Understand these 15 terms and you can speak fluently about product analytics in any interview.**

---

## 1. 🔀 FUNNEL (Most Important)

**Definition**: A step-by-step user journey showing where users drop off.

**Visual**:
```
100% Start
  ↓
 80% Step 2 (20% dropped)
  ↓
 65% Step 3 (15% dropped)
  ↓
 50% Step 4 (15% dropped)
```

**ContractIntel Example**:
```
Upload Funnel:
dashboard_viewed (1,000 users)
  ↓ 28% clicked upload button
dashboard_upload_cta_clicked (280 users)
  ↓ 95% started upload
upload_started (266 users)
  ↓ 90% completed
upload_completed (239 users)
```

**What It Tells You**: 
- Step 1→2 loses 72% of users = upload button not visible/compelling
- Step 3→4 loses only 10% = backend is reliable
- Biggest leak: getting users to *try* uploading

**Interview Use**: "Our upload funnel shows 95% conversion from start to completion, but only 28% of dashboard users even try uploading. That's the real problem to solve."

---

## 2. 📊 CONVERSION RATE

**Definition**: Percentage of users who complete a desired action.

**Formula**: `(Users who completed action / Total users) × 100`

**Examples**:
```
Conversion rate = 28%
↓
28 out of 100 users who see dashboard upload button actually click it

Auth conversion rate = 80%
↓
80 out of 100 people who start login process actually succeed
```

**ContractIntel Example**:
- Dashboard → Upload: 28% conversion (room to improve)
- Upload → Completion: 90% conversion (very good)
- Login → Dashboard: 93% conversion (excellent onboarding)

**Why It Matters**: Small improvements compound.
- If you improve 28% → 35% upload rate: +25% more uploads = more revenue
- If you improve 90% → 95% completion rate: +5.5% more completed analysis

**Interview Use**: "Our upload conversion is 90%, but the bigger lever is the 28% of users who even *try* uploading. That's where the growth is."

---

## 3. 👥 COHORT / COHORT ANALYSIS

**Definition**: A group of users who share a common characteristic or experience within a time period.

**Types**:
```
Time Cohort:
- Users who signed up in May 2026
- Users who signed up in June 2026
→ Compare which cohort is more engaged

Behavior Cohort:
- Users who uploaded contracts (vs. never uploaded)
- Users who visited playbook (vs. never visited)
→ Compare engagement patterns

Segment Cohort:
- Enterprise customers (100+ contracts)
- SMB customers (<10 contracts)
→ Compare feature adoption, churn
```

**ContractIntel Example**:
```
Cohort 1: Uploaded contract (August)
- Avg daily active: 4.2 days/month
- Feature adoption: 68% use portfolio, 34% use playbook
- Churn: 2.1%/month

Cohort 2: Never uploaded (August)
- Avg daily active: 0.8 days/month
- Feature adoption: 12% use portfolio, 3% use playbook
- Churn: 18%/month

Insight: Uploading is the gateway to engagement. 
Action: Make upload experience frictionless.
```

**Interview Use**: "We use cohort analysis to track that users who upload have 10x lower churn than those who don't. That's our north star behavior."

---

## 4. 🔄 RETENTION & CHURN

**Definition**:
- **Retention**: % of users still active after N days
- **Churn**: % of users who stop using the product

**Formula**:
```
Day 7 Retention = 68%
→ 68% of users return within 7 days
→ 32% never come back (churned)

Monthly Churn Rate = 5.2%
→ Each month, ~5% of active users cancel/stop engaging
```

**ContractIntel Example**:
```
Week 1 Retention: 85% (15% churn in first week)
Week 4 Retention: 62% (38% haven't returned in 4 weeks)
Month 3 Retention: 48% (52% haven't used it in 3 months)

Insight: Big drop at weeks 1-2. Onboarding friction?
Action: Improve first-upload experience.
```

**Why It Matters**: Easier to retain than acquire.
- 50% reduction in churn = same revenue impact as 100% growth in new users
- For $50/user/month: 5.2% → 3.8% churn = $120K/year saved

**Interview Use**: "Our monthly churn is 5.2%, but users who upload have 2.1% churn. That's the signal: uploading is the aha moment."

---

## 5. 🎯 FEATURE ADOPTION / FEATURE STICKINESS

**Definition**: % of users who use a feature at least once; or regularly use it.

**Metrics**:
```
Feature Adoption = (Users who used feature / Total users) × 100

Portfolio feature:
- Adoption: 68% of users view portfolio
- Weekly: 45% use it weekly (stickier)
- Daily: 22% use it daily (very sticky)

Playbook feature:
- Adoption: 34% of users visit
- Weekly: 8%
- Daily: 1%

Insight: Playbook is adopted but not sticky. Either unclear value or niche use.
```

**ContractIntel Example**:
```
Upload Feature:
- Overall adoption: 76% (most users try it)
- Weekly active: 52% (use it regularly)
- Stickiness: High ✓

Playbook Comparison:
- Overall adoption: 34%
- Weekly active: 8%
- Stickiness: Low ✗

Decision: Playbook needs work OR it's a niche feature for power users.
```

**Interview Use**: "Portfolio adoption is 68%, but playbook is only 34%. Both have excellent onboarding, so the gap reflects real demand difference. Portfolio is a core feature; playbook is advanced."

---

## 6. 📈 EVENT / CUSTOM EVENT

**Definition**: A tracked user action that tells you what users are doing.

**Types**:
```
Pageview Event:
- User navigated to /dashboard
- Auto-captured by PostHog

Click Event:
- User clicked upload button
- Usually auto-captured

Custom Event (You Define):
- dashboard_upload_cta_clicked (which CTA source)
- upload_completed (with duration in payload)
- recent_contract_clicked (with risk level)
```

**ContractIntel Events**:
```
✓ dashboard_viewed
✓ dashboard_kpi_hovered
✓ dashboard_upload_cta_clicked
✓ recent_contract_clicked
✓ urgent_renewal_clicked
✓ upload_started
✓ upload_completed
✓ auth_login_succeeded
```

**Why Custom Events Matter**:
- "User clicked button" is useful
- "User clicked upload button from top nav" is actionable
  - Tells you CTA placement matters
  - Reveals which sources convert best

**Interview Use**: "We track 17 custom events that give us visibility into exactly where users engage and where they drop off."

---

## 7. 💾 PAYLOAD (Event Data)

**Definition**: The details attached to an event that explain *what* happened and *context*.

**Structure**:
```
Event: dashboard_upload_cta_clicked

Payload (attached data):
{
  source: "top_nav"        ← Which CTA was clicked?
  timestamp: 1716249600    ← When?
  user_id: "user_123"      ← Who?
  session_id: "sess_456"   ← Which session?
}
```

**ContractIntel Example**:
```
Event: recent_contract_clicked
Payload:
{
  position: 0,                    ← 1st contract or 3rd?
  risk_bucket: "high",            ← Is it a risky contract?
  contract_id: "doc_789"          ← Which contract?
}

This tells you: 
- User clicked the 1st recent contract
- It was a high-risk contract
- Helps understand if risk influences clicks
```

**Why It Matters**: Event alone is useless. Payload is the insight.
- "Button clicked" 🤷
- "Upload button from top nav clicked 340 times; from greeting clicked 89 times" ✅

**Interview Use**: "Our events include payload that gives us context — we know not just that a contract was clicked, but its risk level and position in the list."

---

## 8. 🎲 A/B TEST / EXPERIMENT

**Definition**: Split users randomly into two groups (A and B) to compare which version works better.

**Structure**:
```
Group A (Control): See green upload button
- 500 users see it
- 140 click it
- Conversion: 28%

Group B (Test): See blue upload button
- 500 users see it
- 165 click it
- Conversion: 33%

Result: Blue wins by 5 percentage points
→ Ship blue to everyone
```

**ContractIntel Example**:
```
Test: Does "Where to start" card increase uploads?

Control (50% users): Dashboard without card
- Upload rate: 18%

Test (50% users): Dashboard with card
- Upload rate: 28%

Result: Card drives 10pp improvement
→ Keep card permanently
```

**Why It Matters**: Opinion vs. data.
- Designer: "I think blue is better"
- Analytics: "Blue lifts conversion 5pp"
- Winning move: Trust data

**Interview Use**: "We don't argue about design; we A/B test it. Our green vs. blue test showed blue lifts conversion by 5 percentage points, so we shipped blue."

---

## 9. 📊 METRIC / KPI (Key Performance Indicator)

**Definition**: A measurable value that shows how well something is working.

**Types**:
```
Business Metrics:
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn Rate

Product Metrics:
- Conversion Rate
- Feature Adoption
- Session Duration
- Retention Rate
- Daily Active Users (DAU)

Technical Metrics:
- Page Load Time
- Error Rate
- Uptime
```

**ContractIntel Key Metrics**:
```
North Star: Upload Completion Rate (90%)
→ Primary measure of product value

Supporting Metrics:
- Upload CTA Click Rate: 28%
- Dashboard Engagement: % who interact with KPIs
- Churn Rate: 5.2% monthly
- Feature Adoption: Portfolio 68%, Playbook 34%
```

**Why It Matters**: Gives you one number to optimize for.
- Without metric: "Is the product good?" 🤷
- With metric: "Upload completion is 90%. How do we get to 95%?" ✓

**Interview Use**: "Our north star metric is upload completion rate. Everything we do should improve that metric or unlock new use cases."

---

## 10. 📉 COHORT RETENTION (Cohort Retention Chart)

**Definition**: Shows whether users from different signup periods stick around.

**Visual**:
```
             Week 1  Week 2  Week 4  Month 3
May Cohort:  100%    85%     68%     52%
June Cohort: 100%    82%     64%     48%
July Cohort: 100%    88%     71%     55%

Insight: July cohort retains better
→ Product improvements in June/July are working
```

**ContractIntel Example**:
```
Users who uploaded immediately: 85% Week 1 retention
Users who never uploaded: 18% Week 1 retention

Insight: Upload in first week is critical to retention
Action: Make upload easier/faster in onboarding
```

**Why It Matters**: Tells you if product is getting better over time.
- Retention dropping? Product degrading.
- Retention improving? Changes working.

**Interview Use**: "Our cohort retention chart shows users from July cohort retain 7% better than May cohort. That's because we improved the upload flow in June."

---

## 11. 🔗 NORTH STAR METRIC

**Definition**: Single most important metric that defines product-market fit and growth.

**Good North Star Metrics**:
```
Slack: Daily Active Users
→ If people use it every day, it's valuable

Dropbox: Files Saved
→ File storage only works if users actually store files

Spotify: Hours Listened
→ If people listen more, they stay

Notion: Pages Created
→ Database works if people create content
```

**ContractIntel North Star**:
```
Most likely: Upload Completion Rate
→ If users complete uploading contracts, platform delivers value
→ Uploading → analysis → risk insights → retention

Alternative: Risk Flags Reviewed
→ Uploads are step 1; value is in reviewing flags
```

**Why It Matters**: Focuses entire team on one number.
- Product: How do we get more uploads?
- Engineering: How do we make uploading faster?
- Sales: How do we help customers upload?
- All aligned on same goal

**Interview Use**: "Our north star is upload completion rate. We believe once users experience the value of contract analysis, they'll stay. Everything we measure maps back to that."

---

## 12. 🚪 ACTIVATION / AHA MOMENT

**Definition**: The moment when a user realizes your product's value.

**Pattern**:
```
User Signup
  ↓
Onboarding (they're trying to understand value)
  ↓
[AHA MOMENT] (they see the value)
  ↓
Retained User (likely to stick around)
```

**ContractIntel Example**:
```
Signup
  ↓
Explore dashboard (what am I looking at?)
  ↓
[AHA] Click "Upload contract" → See analysis results
  ↓
"Oh! This automatically finds risk issues in my contracts!"
  ↓
High retention user
```

**Analytics Tell You**:
- When is the aha moment? (which event predicts retention)
- How many users reach it? (activation rate)
- How long does it take? (time to value)

**ContractIntel Data**:
```
Users who upload in Week 1:
- Week 4 retention: 68%
- Activation rate: 76%

Users who never upload:
- Week 4 retention: 18%
- Activation rate: 0%

Insight: Upload = activation. Uploading in Week 1 predicts stickiness.
```

**Interview Use**: "Our data shows that users who upload a contract in their first week have 68% retention vs. 18% for those who don't. That's our aha moment — we need to get users uploading ASAP."

---

## 13. 📍 ATTRIBUTION / TOUCH POINT

**Definition**: Understanding which action/touchpoint led to a desired outcome.

**Example**:
```
User Journey:
1. Saw LinkedIn post about ContractIntel
2. Visited website
3. Read pricing page
4. Clicked "Sign Up"
5. Uploaded first contract (aha moment!)
6. Became paying customer

Attribution Question: Which step led to signup?
- LinkedIn post? Website copy? Pricing transparency?
```

**ContractIntel Example**:
```
CTA Attribution:
- User sees "Where to start" card on dashboard
- User clicks "Upload contract"
- User completes upload
- User views results
- User becomes engaged

Which touchpoint mattered most?
- The card (dashboard_upload_cta_hovered event)
- The button click (dashboard_upload_cta_clicked)
- The completion (upload_completed)

Multi-touch: All three together created the path to activation
```

**Why It Matters**: Tells you which features drive value.
- Remove bad touchpoints
- Double down on good ones
- Optimize the path to aha

**Interview Use**: "Our attribution analysis shows the 'Where to start' card is the primary touchpoint for uploads. Users who hover it are 5x more likely to upload than those who don't see it."

---

## 14. 📊 DAILY ACTIVE USERS (DAU) / MONTHLY ACTIVE USERS (MAU)

**Definition**: Number of unique users who use the product on a given day/month.

**Metrics**:
```
DAU: Daily Active Users
- Day 1: 234 unique users
- Day 2: 218 unique users
- DAU trend: Stable ✓

MAU: Monthly Active Users
- May: 3,400 total unique users
- June: 3,680 total unique users
- MAU trend: Growing ✓

DAU/MAU Ratio:
- DAU 250 / MAU 3,500 = 7.1%
- Only 7% of monthly users come back each day
- Insight: Users use it, but not daily (maybe weekly)
```

**ContractIntel Example**:
```
DAU: 200 (users uploading/reviewing contracts today)
MAU: 2,800 (total active last 30 days)
DAU/MAU ratio: 7.1%

Insight: Average user checks in ~7 times/month
- That's healthy for async contract work
- Not a daily-use app (and shouldn't be)
- Monthly engagement is the right metric
```

**Why It Matters**: Shows product stickiness and health.
- DAU rising = engagement improving
- DAU flat while MAU growing = casual users, not daily
- DAU declining = problem

**Interview Use**: "Our DAU is 200 and MAU is 2,800, which gives us a 7% DAU/MAU ratio. For an async product like contract management, that's healthy — it means users check in ~7 times a month."

---

## 15. 🎯 SEGMENTATION

**Definition**: Dividing users into groups by shared characteristics to analyze differently.

**Segmentation Axes**:
```
By Company Size:
- Enterprise (100+ contracts)
- Mid-market (10-100)
- SMB (<10)

By Feature Usage:
- Power users (use 5+ features)
- Core users (use 2-3 features)
- Minimal users (use 1 feature)

By Behavior:
- Uploaders (uploaded at least once)
- Explorers (viewed portfolio, never uploaded)
- Lurkers (logged in, minimal interaction)

By Risk Profile:
- High-risk portfolios (avg score 70+)
- Medium-risk (40-70)
- Low-risk (<40)
```

**ContractIntel Example**:
```
Enterprise (100+ contracts):
- Upload rate: 94%
- Portfolio adoption: 92%
- Playbook adoption: 68%
- Churn: 0.8%/month

SMB (<10 contracts):
- Upload rate: 42%
- Portfolio adoption: 45%
- Playbook adoption: 3%
- Churn: 12%/month

Insight: Enterprise loves the product. SMB struggles.
Action: SMB pricing/onboarding need work, OR SMB isn't right market.
```

**Why It Matters**: One-size-fits-all metrics hide problems.
- Overall upload rate: 65%
- But enterprise uploads 94%, SMB uploads 42%
- Two different problems need two different solutions

**Interview Use**: "When we segment by company size, we see enterprise customers upload 94% of contracts vs. SMB at 42%. That's not a product problem — that's a segment fit problem. Enterprise needs compliance; SMB needs ease of use."

---

## 🎓 Bonus: How to Use These Terms in Interview Answers

### **Question: "How would you measure product success?"**

**Answer Using Terms**:
> "I'd start with a north star metric — for ContractIntel, that's upload completion rate. Then I'd build a supporting funnel: signup → dashboard_viewed → upload_attempted → upload_completed. I'd track cohort retention to see if recent users stick better (implying product improvements work). I'd segment by company size because enterprise and SMB behave completely differently. Finally, I'd set up A/B tests on key flows like upload CTA placement — our data shows top nav gets 3.8x more clicks than the greeting area. All of this combines into actionable, data-driven product development."

### **Question: "What's the most important metric?"**

**Answer Using Terms**:
> "The north star is upload completion (90%), but the real lever is activation. Users who upload in their first week have 68% retention vs. 18% for those who never upload. That's a 3.7x difference. So even though completion rate is high, the limiting factor is getting users to attempt uploading in the first place. Our funnel shows 28% of dashboard users click upload — that's the lever to pull. If we improve that to 40%, we'd see 40% more activated users, which compounds into retention, churn reduction, and revenue."

### **Question: "How would you fix low adoption of a feature?"**

**Answer Using Terms**:
> "First, I'd measure actual adoption rate — what % of users even know the feature exists? Let's say it's 34%. Then I'd do cohort analysis on those 34%: are they more engaged than users who don't use it? If yes, it's valuable but hard to discover. If no, it's neither valuable nor discoverable. Then I'd analyze the event funnel leading to the feature to find where users drop off. Finally, I'd A/B test different ways to surface the feature — different CTA placement, messaging, tutorial. I'd use the metrics to validate each change. This is how we'd go from 34% adoption to 50%+."

---

## 📋 Quick Reference: 15 Essential Terms

| Term | Definition | ContractIntel Example |
|------|-----------|----------------------|
| **Funnel** | Step-by-step drop-off | Upload: 100% → 80% → 65% → 50% |
| **Conversion Rate** | % who complete action | 28% of users click upload CTA |
| **Cohort** | Users with shared trait | Users who uploaded; users who didn't |
| **Retention** | % still active after N days | 68% return within 7 days |
| **Churn** | % who stop using | 5.2% monthly churn |
| **Feature Adoption** | % who use a feature | 68% use portfolio; 34% use playbook |
| **Event** | Tracked user action | `upload_completed`, `dashboard_viewed` |
| **Payload** | Data attached to event | `{position: 0, risk_bucket: 'high'}` |
| **A/B Test** | Compare two versions | Green vs. blue button; 33% vs. 28% |
| **Metric** | Measurable value | Upload completion rate (90%) |
| **Cohort Retention** | Retention over time | July cohort retains 7% better |
| **North Star** | Single most important metric | Upload completion rate |
| **Activation** | User realizes value | User completes first upload |
| **DAU/MAU** | Daily/monthly active users | 200 DAU, 2,800 MAU |
| **Segmentation** | Divide users into groups | Enterprise vs. SMB vs. SMB |

---

## 💡 Use These Phrases in Interviews

✅ **"Our funnel shows..." → [describes drop-offs and patterns]**

✅ **"Cohort analysis reveals..." → [different segments behave differently]**

✅ **"The activation moment is when..." → [users realize value]**

✅ **"We measure with the metric..." → [single north star]**

✅ **"Our A/B test proved..." → [data beats opinion]**

✅ **"Segmentation by [dimension] shows..." → [one-size-fits-all fails]**

✅ **"The event tells us..." → [what happened and context]**

✅ **"Churn correlates with..." → [retention signal]**

---

## 🚀 You Now Speak Product Analytics Fluently!

Understand these 15 terms + how to use them, and you can discuss analytics with confidence.

**Pro Tip for Interviews**: Don't just use the terms. Give examples. Show you understand *why* each metric matters. Frame everything around business impact (revenue, retention, churn prevention).

**Example**:
- ❌ Weak: "We track funnel metrics."
- ✅ Strong: "Our upload funnel shows 95% of users who start uploading finish successfully, but only 28% of dashboard users even try. That's where the leverage is — if we improve the CTA, we could see 25-40% more uploads. At $50 per contract, that's $12K+ monthly revenue."

That's the interview answer that wins.
