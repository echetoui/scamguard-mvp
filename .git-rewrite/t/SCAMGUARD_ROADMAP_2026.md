# ScamGuard MVP - Product Roadmap 2026

**Planning Period:** Q2-Q3 2026 (6 months)
**Last Updated:** 12 mars 2026
**Status:** Active

---

## 📋 Context

### Strategic Priorities (from Analysis)
- **Primary:** Dominate senior-focused scam detection market (65-85 age group)
- **Secondary:** Build institutional B2B partnerships (Desjardins, healthcare)
- **Tertiary:** Create viral growth via family network effects

### Current Position
- **MVP Status:** Phase 1 Complete (analysis, voice, training, family dashboard)
- **User Base:** ~5,000 users (target)
- **Market Gap:** Only accessible scam detector for seniors
- **Competitive Moat:** 18-24 months (accessibility barrier)

### Key Constraints
- **Team Capacity:** TBD (assume 4-6 engineers, 1 PM, 1 designer)
- **Budget:** TBD
- **Timeline:** 6 months to 50K users + 3 institutional partners

---

## 🎯 Business Objectives

### Objective #1: Growth & User Acquisition
**Goal:** Reach 50,000 active users by end of Q3 2026
**Source:** Market analysis (330K SAM, realistic capture 15-20%)
**Key Metrics:**
- DAU: 5K → 25K
- Retention Day-30: 20% → 50%
- CAC (Cost of Acquisition): $5-10 per user via organic + family referral

**Why This Matters:**
- Validates product-market fit
- Builds network effects (family feature)
- Attracts institutional partners

---

### Objective #2: Institutional Revenue
**Goal:** Secure 3-5 institutional partners (banks, healthcare) by Q3 2026
**Source:** Competitive analysis (B2B = $1-2M revenue potential)
**Key Metrics:**
- Institutional users: 0 → 50K
- ARR from partnerships: $0 → $200K

**Why This Matters:**
- Diversifies revenue (not just freemium)
- Scales impact (10K users per institution)
- Builds credibility (Desjardins endorsement)

---

### Objective #3: Product Quality & Safety
**Goal:** Maintain <5% false positive rate + 95%+ user satisfaction
**Source:** Trust requirement for seniors
**Key Metrics:**
- False positive rate: Measure weekly
- NPS: 40+
- Bug resolution time: <24 hours critical

**Why This Matters:**
- Senior users need trust (one false positive = app deleted)
- Institutional partners require SLA agreements
- Regulatory compliance (Loi 25)

---

## 📊 Leading Product Outcomes

### Product Outcome #1: Increase User Engagement
**Drives Objective:** Growth & User Acquisition
**Rationale:** Higher engagement = longer retention = more referrals

| Outcome | Current | Target | Timeline |
|---------|---------|--------|----------|
| Analyses per user per month | 2-3 | 8-10 | Q3 |
| Quiz completion rate | 15% | 50% | Q3 |
| Return rate (7-day) | 20% | 50% | Q3 |
| Training scenario completion | 30% | 70% | Q2 |

---

### Product Outcome #2: Enable Institutional Adoption
**Drives Objective:** Institutional Revenue
**Rationale:** Institutions need admin dashboard, reporting, compliance

| Outcome | Current | Target | Timeline |
|---------|---------|--------|----------|
| Admin dashboard completeness | 0% | 100% | Q2 |
| API readiness | 0% | 100% | Q2 |
| Compliance reporting | 0% | GDPR-ready | Q2 |
| White-label capability | 0% | Full | Q3 |
| Data residency (Canada) | No | Yes | Q2 |

---

### Product Outcome #3: Expand Feature Accessibility
**Drives Objective:** Growth (accessibility moat) + Product Quality
**Rationale:** Larger addressable market if offline-capable, lower-bandwidth

| Outcome | Current | Target | Timeline |
|---------|---------|--------|----------|
| Offline mode coverage | 0% | 60% (core features) | Q3 |
| Bandwidth optimization | Standard | <1MB per analysis | Q2 |
| Language support | French only | French + English | Q3 |

---

### Product Outcome #4: Strengthen Family Network Effects
**Drives Objective:** Growth (viral loop)
**Rationale:** Family referrals create sustainable growth

| Outcome | Current | Target | Timeline |
|---------|---------|--------|----------|
| Family member invitations | <5% | 30% of seniors | Q3 |
| Family engagement rate | TBD | 40% of family members active | Q3 |
| Shared protection incidents | Manual | Automated alerts | Q2 |

---

## 🚀 NOW (Weeks 1-4)
**Status:** Starting immediately | Completion: Early April 2026

### Initiative #1: Admin Dashboard v1
**Drives Outcome:** Enable Institutional Adoption
**Owner:** Backend team (2 engineers) + PM
**Dependencies:** None (can build in parallel)
**Effort:** 40 story points

#### What We're Building:
```
Dashboard Features:
├─ User management (view, suspend, export)
├─ Analytics dashboard (DAU, analyses, threats)
├─ Bulk actions (send alerts, manage cohorts)
├─ Basic reporting (CSV export)
├─ Audit logs (who did what, when)
└─ Settings (API keys, webhooks, branding)
```

#### Success Criteria:
- Dashboard deployed and tested
- API keys generated and documented
- First partner (pilot) onboarded
- <1s load time for 100K user dashboard

#### Risks:
- ⚠️ **Database scale** - Current DB may not handle institutional queries efficiently
  - Mitigation: Pre-build indexes, test with 500K synthetic records
  - Owner: Backend lead

---

### Initiative #2: Quiz Module (MVP)
**Drives Outcome:** Increase User Engagement
**Owner:** Frontend team (1 engineer) + Product
**Dependencies:** None
**Effort:** 20 story points

#### What We're Building:
```
Quiz System:
├─ 3 modules (10 questions each):
│  ├─ Module 1: Basics (SMS, email)
│  ├─ Module 2: Advanced (phishing, social eng)
│  └─ Module 3: Verification tools
├─ Scoring & badges
├─ Leaderboard (optional, privacy-safe)
└─ Retry mechanism (learn from mistakes)
```

#### Success Criteria:
- 50% of active users try at least 1 quiz (Month 1)
- Average score: 65/100
- Completion rate: 70% (start to finish)
- User sentiment: "I learned something" (+4/5 rating)

#### Risks:
- ⚠️ **Question quality** - Bad questions = poor learning + low engagement
  - Mitigation: Expert review (fraud specialist, educator)
  - Owner: Product

---

### Initiative #3: Push Notifications (Basic)
**Drives Outcome:** Increase User Engagement + Strengthen Family Alerts
**Owner:** Mobile/Backend (1 engineer)
**Dependencies:** Firebase setup (if not done)
**Effort:** 15 story points

#### What We're Building:
```
Notification Types:
├─ Analysis results ("We detected an arnaque!")
├─ Family alerts ("Maman received suspicious email")
├─ Daily tips ("Scam of the day")
├─ Achievement badges ("You completed Quiz Module 1!")
└─ Opt-out option (user control = trust)
```

#### Success Criteria:
- Opt-in rate: 50% (not forced)
- Click-through rate: 30%+
- No complaints about spam (NPS impact <5pts)
- Family alerts sent within 5 seconds of detection

---

## ⏳ NEXT (Weeks 5-12)
**Status:** Pending completion of NOW | Completion: Late May 2026

### Initiative #4: Analysis History & Export
**Drives Outcome:** Increase User Engagement + Enable Institutional Adoption
**Owner:** Full-stack team (2 engineers)
**Dependencies:** Completes NOW phase
**Effort:** 25 story points

#### What We're Building:
```
History Features:
├─ Timeline view (all analyses)
├─ Search & filter (by date, type, score)
├─ Export (PDF, CSV)
├─ Sharing with family (opt-in)
├─ Analytics (trends, patterns)
└─ Institutional reporting (aggregated, anonymized)
```

#### Success Criteria:
- Users return to history: 40% DAU
- Export used: 15% of analyses
- Institutional partners use reporting: 100%

---

### Initiative #5: White-Label Infrastructure
**Drives Outcome:** Enable Institutional Adoption
**Owner:** Backend lead + DevOps (2 engineers)
**Dependencies:** Admin dashboard v1 complete
**Effort:** 35 story points

#### What We're Building:
```
White-Label Components:
├─ Customizable branding (logo, colors, domain)
├─ Custom theming engine
├─ Data residency options (Canada-only)
├─ API versioning (backward compatible)
├─ SLA monitoring & alerts
└─ DPA agreements (GDPR/HIPAA-ready)
```

#### Success Criteria:
- Desjardins pilot deployment (branded version)
- Custom domain working
- <99.5% uptime SLA met
- Compliance docs complete

---

### Initiative #6: Mobile Optimization (Phase 1)
**Drives Outcome:** Expand Feature Accessibility
**Owner:** Frontend (1 engineer)
**Dependencies:** None (can do in parallel)
**Effort:** 20 story points

#### What We're Building:
```
Mobile Improvements:
├─ Responsive design (480px-1200px)
├─ Touch optimization (60px buttons)
├─ Offline mode (core features)
├─ Bandwidth optimization (<1MB per analysis)
├─ Accessibility (WCAG AAA on mobile)
└─ Performance (Lighthouse 85+)
```

#### Success Criteria:
- Mobile DAU: 70% of total DAU
- Bounce rate: <20%
- Offline usage: 10% of analyses
- Performance score: 85+

---

### Initiative #7: Educational Content (Blocking)
**Drives Outcome:** Increase User Engagement
**Owner:** Content + Backend (1 person + engineer)
**Dependencies:** Quiz complete
**Effort:** 15 story points

#### What We're Building:
```
Content Library:
├─ 15 articles (fraud types, prevention)
├─ 5 short videos (2-3 min each)
├─ Downloadable guides (PDF)
├─ Links to gov resources
└─ Monthly updates (new threats)
```

#### Success Criteria:
- Content viewed: 30% of DAU
- Time spent: 3+ minutes average
- Share rate: 20% via family
- User feedback: "Very helpful" (4/5)

---

## 📅 LATER (Q4 2026+)
**Status:** Important but deferred | Rationale: Requires institutional success first

### Initiative #8: Mobile Apps (iOS/Android)
**Drives Outcome:** Expand Feature Accessibility
**Owner:** TBD (native mobile team)
**Dependencies:** White-label, mobile optimization complete
**Effort:** 60+ story points
**Timeline:** Q4 2026

**Why Later:** 
- Web-responsive sufficient for MVP growth
- Native apps require app store review (Apple, Google)
- ROI justified only after 50K+ web users

---

### Initiative #9: ML-Based Threat Scoring
**Drives Outcome:** Product Quality & Safety
**Owner:** Data scientist + Backend
**Dependencies:** Analysis history, institutional data
**Effort:** 50+ story points
**Timeline:** Q4 2026+

**Why Later:**
- Current rule-based scoring (95% accuracy) sufficient
- ML requires labeled training data (need 10K+ examples)
- Can collect training data during NOW/NEXT phases

---

### Initiative #10: Multi-Language Support (Full)
**Drives Outcome:** Expand Feature Accessibility
**Owner:** Frontend + Content
**Dependencies:** Core features stable
**Effort:** 20 story points per language
**Timeline:** Q4 2026+

**Why Later:**
- French (Quebec) is 100% of current TAM
- English Canada is future TAM (smaller, lower priority)
- Requires content translation + QA per language

---

### Initiative #11: Advanced Family Features
**Drives Outcome:** Strengthen Family Network Effects
**Owner:** Product + Backend (2 engineers)
**Dependencies:** Basic family features proven, push notifications stable
**Effort:** 25 story points
**Timeline:** Q4 2026+

**Examples:**
- Family group chats (discuss threats together)
- Shared learning (family quiz competitions)
- Family safety scoreboard (privacy-safe)

**Why Later:**
- Basic dashboard sufficient for 50K users
- Advanced features can wait for engagement validation

---

## 🚨 Dependencies & Risks

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|-----------|-------|
| **Database scales poorly with 50K users** | HIGH | MEDIUM | Load test now, pre-build indexes, migrate to RDS if needed | Backend |
| **Institutional partner demands custom features** | HIGH | HIGH | Scope white-label strictly, build partner roadmap separately | PM |
| **False positive rate >5% breaks trust** | CRITICAL | MEDIUM | Test with 100+ real scam examples, get fraud expert to review | Product |
| **Family opt-in rate <10%** | MEDIUM | MEDIUM | A/B test messaging, simplify invitation flow | Frontend |
| **Push notification fatigue causes churn** | MEDIUM | HIGH | Aggressive frequency testing, respect user preferences | Product |
| **Institutional privacy concerns (GDPR)** | HIGH | HIGH | Complete DPA templates NOW, hire compliance consultant | Legal |

### Critical Dependencies (blocking order):

```
1. Admin Dashboard v1 (blocks institutional pilots)
   ↓
2. White-Label Infrastructure (blocks Desjardins partnership)
   ↓
3. Compliance/DPA Agreements (blocks enterprise contracts)
   ↓
4. Revenue Recognition & Billing
```

---

## ✅ Not This Period

| Item | Rationale | Revisit When |
|------|-----------|--------------|
| **Mobile apps (iOS/Android)** | Web-responsive sufficient; app store review delays | 50K+ users validated |
| **Advanced ML scoring** | Rule-based currently 95% accurate; need data | 10K+ analyses collected |
| **Multi-language (English)** | Focus on French TAM first | Institutional demand for EN |
| **SMS-to-phone verification** | Out of scope; Firebase OTP sufficient | User requests for SMS-only |
| **Premium tier** | Too early; focus on free growth | 100K+ users, retention stable |
| **Voice generation (TTS)** | Web Speech API sufficient for MVP | Accessibility audit requests |

---

## 📊 Success Metrics (by Initiative)

### Overall Health Metrics
| Metric | Current | Target (Q3) | How We Measure |
|--------|---------|------------|----------------|
| **DAU** | 5K | 25K | Analytics |
| **7-day retention** | 20% | 50% | Cohort analysis |
| **NPS** | TBD | 40+ | Quarterly survey |
| **False positive rate** | <5% | <3% | Manual validation |
| **Institutional ARR** | $0 | $50K+ | Revenue tracking |

### Per-Initiative Metrics

#### Admin Dashboard
- Dashboard load time: <1s
- User admin actions: 50%+ of institutional users
- Error rate: <0.5%

#### Quiz Module
- Completion rate: 70%
- Avg score: 65/100
- Retry rate: 60% (learning mindset)

#### Push Notifications
- Opt-in rate: 50%
- CTR: 30%+
- Churn impact: 0 (no negative correlation)

#### History & Export
- History views: 40% DAU
- Export rate: 15% of analyses
- Institutional reporting usage: 100%

#### White-Label
- Desjardins deployment: Live
- Custom domain working: 100%
- Uptime SLA: >99.5%

---

## 👥 Team Assignments

| Role | Owner | Capacity | NOW | NEXT |
|------|-------|----------|-----|------|
| **Backend Lead** | TBD | 1 FTE | Admin Dashboard | White-Label |
| **Frontend Lead** | TBD | 1 FTE | Push Notifications | Mobile Optimization |
| **Product Manager** | TBD | 1 FTE | All initiatives | Trade-off calls |
| **Designer** | TBD | 0.5 FTE | Quiz UI, Notifications | Reporting UX |
| **Content/QA** | TBD | 0.5 FTE | Content library | Compliance testing |

---

## 🔄 Review Cadence

- **Weekly:** Team standup (Monday) - blockers, progress
- **Bi-weekly:** Metrics review - DAU, retention, quality
- **Monthly:** Stakeholder sync - exec update, priority adjustment
- **End of Phase (May):** NOW retrospective + NEXT kickoff

---

## 💡 Assumptions to Validate

- ⚠️ **Institutional partnerships will generate ARR** - Validate with Desjardins LOI
- ⚠️ **Family referral creates 50% retention** - Validate in NOW phase
- ⚠️ **Quiz engagement will increase DAU 3x** - Validate with A/B test
- ⚠️ **False positive rate will remain <3%** - Monitor weekly, escalate if >5%
- ⚠️ **Database scales to 50K users without migration** - Load test by end of April
- ⚠️ **Team capacity is 4-6 engineers** - Confirm headcount plan

---

## 📈 What Success Looks Like

### By End of Q2 (May 2026)
✅ Admin dashboard deployed and piloted with Desjardins
✅ Quiz module launched with 50% completion rate
✅ Push notifications live with 50% opt-in
✅ White-label infrastructure ready for partnership
✅ Database scaling validated

### By End of Q3 (August 2026)
✅ 25K DAU with 50% 7-day retention
✅ 3+ institutional partnerships signed
✅ $50K+ ARR from institutions
✅ <3% false positive rate maintained
✅ NPS 40+

### By End of 2026 (December)
✅ 50K DAU with strong retention
✅ $200K+ ARR (3-5 institutional partners)
✅ Platform readiness for mobile apps (Q1 2027)
✅ Competitive moat (accessibility) still intact
✅ Family network effects measurable (30% of users have family members)

---

**Document Status:** Ready for review and approval
**Next Steps:** Validate assumptions with stakeholders, confirm team capacity, finalize sprint planning

