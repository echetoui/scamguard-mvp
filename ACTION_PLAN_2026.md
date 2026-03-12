# ScamGuard MVP - Plan d'Action Détaillé 2026

**Période:** Q2 2026 (6-8 semaines)
**Préparé:** 12 mars 2026
**Statut:** À approuver

---

## 📅 TIMELINE GLOBALE

```
Semaine 1-2 (13-24 mars):   SPRINT 1 - Planification + Démarrage
Semaine 3-4 (27 mars-7 avril): SPRINT 2 - Admin Dashboard (core)
Semaine 5-6 (10-21 avril):  SPRINT 3 - Quiz + Notifications
Semaine 7-8 (24 avril-5 mai): SPRINT 4 - Intégration + Testing
Semaine 9-12 (8 mai-2 juin): SPRINT 5-6 - NEXT Phase + Institutional
```

---

## 🎯 SPRINT 1 - Planification & Démarrage (13-24 Mars)

**Goal:** Infrastructure prête, équipe alignée, développement commencé

### Tâches Critiques

#### **Tâche 1.1: Architecture Review & Database Scaling** (Owner: Backend Lead)
- **Effort:** 2 days
- **Deadline:** 14 mars
- **Liverable:** Architecture document (5 pages)

```
Checklist:
- [ ] Audit base de données actuelle
- [ ] Identifier bottlenecks (indexes manquants, requêtes lentes)
- [ ] Créer plan de migration (DynamoDB → RDS si nécessaire)
- [ ] Load test avec 500K utilisateurs synthétiques
- [ ] Document: "Database Scaling Plan for 50K Users"
```

**Success Criteria:**
- Load test résultats documentés
- Migration path clear (if needed)
- Team confident on scaling
- Approuvé par CTO/Backend lead

---

#### **Tâche 1.2: Institutional Requirements Gathering** (Owner: Product Manager)
- **Effort:** 3 days
- **Deadline:** 17 mars
- **Liverable:** Requirements document (10 pages)

```
Interviews à faire:
- [ ] Desjardins (banking use case)
- [ ] Healthcare partner (if identified)
- [ ] Internal compliance team
```

**Document Requirements:**
- Admin dashboard features (must-have vs nice-to-have)
- Data residency requirements (Canada-only? Quebec-only?)
- API specifications (auth, rate limits, versioning)
- Compliance needs (GDPR, HIPAA, Loi 25)
- SLA expectations (uptime, performance)
- Pricing model (per-user? flat-fee? hybrid?)

**Success Criteria:**
- Document reviewed by 3+ stakeholders
- Sign-off from legal on DPA structure
- Clear scope for white-label MVP

---

#### **Tâche 1.3: Team Alignment Workshop** (Owner: PM + Tech Lead)
- **Effort:** 1 day (4 hours meeting)
- **Deadline:** 21 mars
- **Attendees:** Full tech team + PM + Designer

```
Agenda:
1. Roadmap walkthrough (30 min)
2. NOW phase details (30 min)
3. Dependencies & risks (30 min)
4. Q&A + assumptions validation (30 min)
5. Sprint planning for Sprint 2 (60 min)
```

**Outcomes:**
- Everyone understands "why" behind priorities
- Team commits to targets (DAU 25K, retention 50%)
- Risks identified and owners assigned
- Capacity confirmed (4-6 engineers? confirm now)

---

#### **Tâche 1.4: Design System Audit** (Owner: Designer)
- **Effort:** 1 day
- **Deadline:** 20 mars
- **Deliverable:** Design system update (if needed)

```
Review:
- [ ] Component library current? (Figma, Storybook)
- [ ] Accessibility (WCAG AAA) maintained?
- [ ] Responsive design patterns documented?
- [ ] New components needed for admin dashboard?
- [ ] Design tokens finalized (colors, fonts, spacing)?
```

**Output:**
- Design system ready for Admin Dashboard
- Figma file updated
- Developers can build without blockers

---

#### **Tâche 1.5: Development Environment Setup** (Owner: Backend Lead)
- **Effort:** 2 days
- **Deadline:** 17 mars
- **Deliverable:** Dev setup docs

```
Setup checklist:
- [ ] RDS database (staging environment)
- [ ] Redis cache (if needed)
- [ ] API Gateway endpoints
- [ ] CI/CD pipeline (GitHub Actions ready?)
- [ ] Docker containers standardized
- [ ] Monitoring/logging (CloudWatch)
- [ ] Feature flags (for admin dashboard)
```

**Success Criteria:**
- Developer can "git clone + npm install + npm run dev" in 15 min
- All tests pass locally
- Staging environment matches production (data, config)

---

### SPRINT 1 Summary

| Tâche | Owner | Effort | Status |
|-------|-------|--------|--------|
| Database Scaling Review | Backend | 2d | TBD |
| Institutional Requirements | PM | 3d | TBD |
| Team Alignment | PM+Tech | 1d | TBD |
| Design System Audit | Designer | 1d | TBD |
| Dev Environment | Backend | 2d | TBD |
| **TOTAL** | — | **9 days** | — |

**Blockers? Escalate immediately.**

---

## 🚀 SPRINT 2 - Admin Dashboard Core (27 Mars - 7 Avril)

**Goal:** Admin dashboard MVP deployable, tested, documented

### Feature Scope

#### **Feature 2.1: User Management** (10 story points)

```
What users can do:
├─ View all users (name, email, last activity, status)
├─ Search & filter (by date range, activity level)
├─ Suspend/reactivate users
├─ Bulk export (CSV, JSON)
├─ User detail view (analyses, alerts, family members)
└─ Audit log (who accessed what, when)
```

**API Endpoints Needed:**
```
GET    /api/v1/admin/users          (list all users)
GET    /api/v1/admin/users/{id}     (user detail)
PATCH  /api/v1/admin/users/{id}     (update user status)
POST   /api/v1/admin/users/export   (bulk export)
GET    /api/v1/admin/audit-logs     (action history)
```

**Frontend Screens:**
- Users list (table, sortable, searchable)
- User detail modal
- Bulk action toolbar
- Export dialog

**Tests Required:**
- Unit tests (API endpoints) - 90% coverage
- Integration tests (database queries)
- E2E tests (happy path + edge cases)
- Performance tests (load with 100K users)

**Acceptance Criteria:**
✅ All CRUD operations working
✅ Export produces valid CSV
✅ Audit logs complete
✅ Queries <500ms even with 100K users
✅ Mobile responsive

---

#### **Feature 2.2: Analytics Dashboard** (8 story points)

```
Metrics displayed:
├─ DAU (last 7/30 days with trend)
├─ Analyses performed (count, breakdown by type)
├─ Detection accuracy (true positives, false positives)
├─ Family invitations (count, success rate)
├─ User retention (D1, D7, D30)
├─ Top threats detected (ranking)
└─ User demographics (age, region)
```

**Charts needed:**
- Line graph (DAU trend)
- Bar chart (analyses by type)
- Pie chart (threat types)
- Table (retention cohorts)

**Libraries:**
- Use Recharts or similar (avoid Chart.js, it's heavier)
- Ensure accessibility (alt text for charts)

**Data sources:**
- Pull from DynamoDB aggregates
- Cache in Redis (update every hour)
- Real-time for last 24h

**Acceptance Criteria:**
✅ All metrics display correctly
✅ Charts render in <2s
✅ Data refreshes automatically
✅ Mobile responsive
✅ Print-friendly (for reports)

---

#### **Feature 2.3: API Key Management** (5 story points)

```
What partner admins can do:
├─ Generate API keys
├─ View active keys (with last-used date)
├─ Revoke keys
├─ Set rate limits per key
├─ View usage logs
└─ Regenerate keys (if compromised)
```

**API Endpoints:**
```
POST   /api/v1/admin/api-keys              (create)
GET    /api/v1/admin/api-keys              (list)
DELETE /api/v1/admin/api-keys/{key-id}     (revoke)
POST   /api/v1/admin/api-keys/{key-id}/regenerate
GET    /api/v1/admin/api-keys/{key-id}/usage
```

**Security:**
- Keys hashed in database (never stored plaintext)
- Shown only once at creation (user must copy)
- Rate limiting per key
- Rotation recommended every 90 days

**Acceptance Criteria:**
✅ Keys generated securely
✅ Can revoke anytime
✅ Usage tracked
✅ No security issues (pen test)

---

#### **Feature 2.4: Settings & Branding** (7 story points)

```
What institutional partners can customize:
├─ Logo upload (PNG, SVG)
├─ Brand colors (primary, secondary, accent)
├─ Custom domain (if applicable)
├─ Email sender name & address
├─ Terms of service (white-label)
├─ Support email
└─ Feature flags (enable/disable modules)
```

**Files needed:**
- Logo storage (S3 with CDN)
- Theme engine (CSS variables)
- Settings form with preview

**Acceptance Criteria:**
✅ Logo displays correctly
✅ Colors applied globally
✅ Settings persist
✅ Performance not impacted

---

### SPRINT 2 Detailed Tasks

| Feature | Subtasks | Owner | Points | Days |
|---------|----------|-------|--------|------|
| **User Mgmt** | API endpoints | Backend | 6 | 2 |
| | Frontend UI | Frontend | 4 | 1.5 |
| **Analytics** | Metrics aggregation | Backend | 4 | 1.5 |
| | Charts & visualization | Frontend | 4 | 1.5 |
| **API Keys** | Key generation/storage | Backend | 3 | 1 |
| | Settings UI | Frontend | 2 | 0.5 |
| **Settings** | Branding system | Frontend | 4 | 1 |
| | Logo/asset management | Backend | 3 | 1 |
| **Testing** | Unit + E2E tests | QA | 5 | 2 |
| **Documentation** | API docs, admin guide | Tech Writer | 5 | 1.5 |
| **TOTAL** | — | — | **40 pts** | **12 days** |

**Timeline:** 10 working days (need efficient execution)

---

## 🎓 SPRINT 3 - Quiz + Notifications (10-21 Avril)

**Goal:** Quiz module & push notifications live with users engaged

### Feature 3.1: Quiz Module (20 story points)

```
Module 1: Basics (SMS & Email Scams)
├─ Question 1-10 (multiple choice)
├─ Difficulty: Easy-Medium
├─ Examples: Real SMS/email snippets
└─ Avg time: 5-7 minutes

Module 2: Advanced (Phishing & Social Eng)
├─ Question 1-10
├─ Difficulty: Medium-Hard
├─ Scenarios: Photo + text analysis
└─ Avg time: 8-10 minutes

Module 3: Verification Tools
├─ Question 1-10
├─ Practical: "Use email checker to verify..."
└─ Real tools integration
```

**Database schema:**
```
Quiz
├─ id (UUID)
├─ module_id (1, 2, 3)
├─ questions[] (array)
├─ user_responses[] (array)
├─ score (0-100)
├─ completed_at (timestamp)
└─ passed (boolean, >70 = pass)
```

**Frontend screens:**
- Module selection
- Question display (with timer)
- Score display
- Badge unlock (if passed)
- Retry option

**Analytics to track:**
- Completion rate
- Average score
- Time per question
- Repeat rate
- Module difficulty assessment

**Acceptance Criteria:**
✅ All 30 questions in database
✅ Scoring algorithm correct
✅ Badges award properly
✅ Questions expert-reviewed
✅ Mobile-friendly
✅ Offline capable (download questions)

---

### Feature 3.2: Push Notifications (15 story points)

```
Notification types:
1. Analysis Result
   "📊 Analysis complete: This is likely a phishing scam"
   → Action: Tap to view analysis

2. Family Alert
   "👨‍👩‍👧 Your mother received a suspicious email"
   → Action: View & help

3. Daily Tip
   "💡 Tip: Banks never ask for passwords via SMS"
   → Action: Learn more

4. Achievement
   "🎉 You completed Quiz Module 1!"
   → Action: View badge

5. Threat Alert (Institution-specific)
   "⚠️ New phishing campaign detected in your area"
   → Action: View details
```

**Technical setup:**
- Firebase Cloud Messaging (FCM)
- Scheduled notifications (daily tip at 9am)
- User preference center (opt-in/out per type)
- Delivery tracking
- A/B testing (different messages)

**User preferences:**
- Notify me about my analyses? (toggle)
- Notify me about family alerts? (toggle)
- Daily tips? (toggle + time selector)
- Notify about achievements? (toggle)
- Do Not Disturb hours (9pm-7am default)

**Acceptance Criteria:**
✅ Notifications delivered within 5 seconds
✅ User preferences respected
✅ No unsubscribe spam
✅ Opt-in rate 50%+
✅ Click-through rate 30%+

---

### SPRINT 3 Detailed Tasks

| Feature | Subtasks | Owner | Points | Days |
|---------|----------|-------|--------|------|
| **Quiz** | Question design & review | Product | 4 | 2 |
| | Database + API | Backend | 6 | 2 |
| | Frontend UI | Frontend | 6 | 2 |
| | Scoring algorithm | Backend | 4 | 1 |
| **Notifications** | Firebase setup | Backend | 3 | 1 |
| | Notification system | Backend | 6 | 2 |
| | Preference center | Frontend | 4 | 1.5 |
| | A/B testing | Product | 2 | 0.5 |
| **Testing** | E2E tests | QA | 4 | 1 |
| **TOTAL** | — | — | **35 pts** | **13 days** |

---

## 🧪 SPRINT 4 - Integration & Testing (24 Avril - 5 Mai)

**Goal:** Everything integrated, tested, production-ready

### Testing Checklist

#### **Performance Testing**
```
Load Test:
- [ ] 100K concurrent users
- [ ] Admin dashboard queries <1s
- [ ] API latency <200ms
- [ ] Database connection pool sized correctly

Stress Test:
- [ ] 500K users (simulate peak)
- [ ] Identify breaking point
- [ ] Scaling plan if needed

Soak Test:
- [ ] 24h continuous load
- [ ] Memory leaks detected?
- [ ] Connection stability?
```

#### **Security Testing**
```
- [ ] OWASP top 10 scan
- [ ] SQL injection tests
- [ ] XSS prevention verified
- [ ] API authentication working
- [ ] Rate limiting effective
- [ ] Data encryption at rest + transit
```

#### **Accessibility Testing**
```
- [ ] WCAG AAA compliance (admin dashboard)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast ratio
- [ ] Font sizes readable (14px min)
```

#### **Browser/Device Testing**
```
Desktop:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Mobile:
- [ ] iOS (14+)
- [ ] Android (10+)
- [ ] Tablet (iPad, Galaxy Tab)

Responsive:
- [ ] 480px (small phone)
- [ ] 768px (tablet)
- [ ] 1200px (desktop)
```

#### **Data Integrity Testing**
```
- [ ] Export CSV accuracy
- [ ] Database backup/restore
- [ ] Data migration (if from old DB)
- [ ] Audit logs complete
- [ ] No data loss on deployment
```

#### **User Acceptance Testing (UAT)**
```
With Desjardins:
- [ ] Admin can manage users
- [ ] Analytics accurate
- [ ] API keys work
- [ ] Branding displays correctly
- [ ] Export works as expected
```

### Release Checklist

```
Before Go-Live:
- [ ] All 35 user stories completed
- [ ] All tests pass (unit, E2E, performance)
- [ ] Documentation complete (API, admin guide)
- [ ] Security review completed
- [ ] Staging environment matches production
- [ ] Monitoring/alerting configured
- [ ] Runbook written (deployment, rollback)
- [ ] On-call schedule set up
- [ ] Customer communication ready

Deployment Day:
- [ ] Blue-green deployment (zero downtime)
- [ ] Canary release (10% traffic first)
- [ ] Monitor error rates, latency, DAU
- [ ] Be ready to rollback within 5 min

Post-Deployment:
- [ ] Verify all features working
- [ ] Monitor for 24 hours
- [ ] Communicate status to stakeholders
- [ ] Begin collecting metrics (DAU, retention, engagement)
```

---

## 📊 METRICS TO MONITOR (Throughout All Sprints)

### Real-Time Dashboards (Update every hour)

```
Team Dashboard:
├─ Sprint velocity (actual vs planned)
├─ Bugs opened/closed (trend)
├─ Test coverage (target: 85%+)
├─ Deployment frequency
└─ Build time (CI/CD health)

Product Dashboard:
├─ DAU (tracking toward 25K)
├─ Quiz completion rate
├─ Notification opt-in rate
├─ API errors (if live)
└─ Performance metrics
```

### Weekly Metrics Review

Every Friday:
1. **Velocity:** Did we complete planned story points?
2. **Quality:** Bug escape rate, test coverage
3. **Engagement:** Users trying new features
4. **Risks:** Any blockers emerging?
5. **Retrospective:** What went well? What to improve?

---

## 👥 Team Roles & Responsibilities

### Backend Lead
**Sprints:** 1, 2, 3, 4
**Main tasks:**
- Database scaling & optimization
- Admin dashboard API
- Push notification system
- Infrastructure setup
- Code review (backend)

**Time commitment:** 100% (all 4 sprints)

### Frontend Lead
**Sprints:** 2, 3, 4
**Main tasks:**
- Admin dashboard UI
- Quiz module
- Notification preference center
- Performance optimization
- Code review (frontend)

**Time commitment:** 100%

### Product Manager
**Sprints:** 1-4 (continuous)
**Main tasks:**
- Requirements gathering
- Institutional alignment
- Feature prioritization
- Team coordination
- Stakeholder communication

**Time commitment:** 100%

### Designer
**Sprints:** 1-3
**Main tasks:**
- Design system maintenance
- Admin dashboard designs
- Quiz UI/UX
- Icon design
- Accessibility audit

**Time commitment:** 50% (shared with other projects)

### QA Engineer
**Sprints:** 2-4
**Main tasks:**
- Test plan creation
- Manual testing
- Automation (E2E tests)
- Performance testing
- Security testing

**Time commitment:** 75% (ramping up in later sprints)

---

## 🚨 Risk Management

### Risk #1: Database Scaling Failure
**Probability:** Medium | **Impact:** Critical

**Mitigation:**
- Sprint 1: Load test immediately
- Sprint 2: Have migration plan ready
- Sprint 3: Pre-stage RDS (if needed)
- Contingency: Can delay admin dashboard if needed

**Owner:** Backend Lead
**Escalation:** CTO if database >80% capacity

---

### Risk #2: Feature Creep (Institution Demands)
**Probability:** High | **Impact:** High

**Mitigation:**
- Sprint 1: Scope admin dashboard strictly (MVP = user mgmt, analytics, API keys)
- Document "future roadmap" items
- Create separate "partner roadmap" (not shared in NOW phase)

**Owner:** PM
**Escalation:** If Desjardins demands >10% extra features, escalate to CEO

---

### Risk #3: Low Quiz Engagement
**Probability:** Medium | **Impact:** Medium

**Mitigation:**
- Sprint 2: Expert review questions (fraud specialist)
- Sprint 3: A/B test different question styles
- Sprint 4: Launch with incentive (badge = unlock achievement)
- Fallback: Can pivot to simpler "tips" instead of full quiz

**Owner:** Product
**Success measure:** 50% completion rate by end of Sprint 3

---

### Risk #4: Push Notification Spam = Churn
**Probability:** High | **Impact:** High

**Mitigation:**
- Sprint 1: Design aggressive frequency testing
- Sprint 3: Start conservative (1 per day max)
- Monitor daily: Churn rate vs previous week
- Rollback strategy: Can disable notifications completely

**Owner:** Product
**Success measure:** Churn rate not >5% correlated with notifications

---

## ✅ Sign-Off Checklist (for Executives)

Before starting development:

```
[ ] Database scaling plan approved by CTO
[ ] Institutional requirements signed off by Desjardins
[ ] Team capacity confirmed (4-6 engineers?)
[ ] Budget approved ($X allocation for Sprint 1-4)
[ ] Risk mitigation plans agreed
[ ] Success metrics baselined
[ ] Timeline realistic? (6-8 weeks for NOW phase)
[ ] Dependencies on other teams identified

Executive sign-off:
- Approved by: _________________
- Date: _________________
- Budget: _________________
- Team capacity: _________________
```

---

## 📋 Next Steps (Immediate)

1. **Week of March 13:**
   - [ ] Approve this action plan
   - [ ] Confirm team capacity
   - [ ] Schedule requirements gathering with Desjardins
   - [ ] Create Jira/Monday epics for all sprints

2. **Week of March 20:**
   - [ ] Complete architecture review
   - [ ] Team alignment workshop
   - [ ] Begin Sprint 1 work
   - [ ] Set up monitoring/dashboards

3. **Week of March 27:**
   - [ ] Begin Sprint 2 (Admin Dashboard)
   - [ ] Weekly metrics reviews start
   - [ ] Risk monitoring begins

---

**Document Status:** Ready for review and executive approval
**Last Updated:** 12 mars 2026
**Next Review:** After Week 1 (20 mars)

