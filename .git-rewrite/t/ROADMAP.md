# ScamGuard MVP — Roadmap Produit & Backlog

**Version:** 1.0  
**Date:** 16 avril 2026  
**État:** Phase 5A ✅ LIVE | Phase 5B 🔄 EN COURS

---

## 📊 État Global

| Métrique | Valeur | Cible |
|----------|--------|-------|
| **Tests Passing** | 2021 ✅ | 2500+ |
| **Coverage** | 80.83% | 95%+ |
| **Components** | 36 | 50+ |
| **Mobile Ready** | 60% | 100% |
| **Accessibility** | WCAG AAA (partiel) | 100% AAA |

---

## 🚀 Roadmap par Phase

### ✅ Phase 5A — Family Protection (LIVE)
**Statut:** COMPLÈTE  
**Livraison:** 7 avril 2026

#### Délivrables
- ✅ Family Dashboard (dashboard/profile)
- ✅ Guardian Angel Panel (seniors monitoring)
- ✅ Role-based UI (senior/family/individual)
- ✅ Dev-server family endpoints
- ✅ Invite code generation & sharing
- ✅ All 2019+ tests passing

#### Fichiers clés
- `FamilyDashboard.jsx` (49 tests)
- `GuardianAngelPanel.jsx` (full WCAG AAA)
- `FamilyDashboard.test.jsx` (comprehensive)

---

### 🔄 Phase 5B — Scam Reporting System (CURRENT)
**Statut:** PARTIAL (Component ready, tests missing)  
**Durée estimée:** 1-2 semaines  
**Dépendances:** Backend API `/api/v1/reports`

#### Délivrables
- ScamReportingSystem.jsx (component ✅, tests ❌)
- useScamReport hook (partial, API integration needed)
- 3-step stepper UI (senior-first design)
- Screenshot upload & validation
- Success/error handling

#### Points d'entrée
- App.jsx Tab 8: "Signaler" (Scam Reporting)
- Menu Outils → Signaler un Arnaque

---

## 📋 BACKLOG PAR SPÉCIALITÉ

---

## 🔧 DEV — Développement Backend & Frontend

### P0 — CRITIQUE (Semaines 1-2)

#### 5B.1 — ScamReportingSystem API Integration
**Effort:** 8h | **Owner:** Backend  
**Dépend de:** Backend API endpoint

**Tasks:**
- [ ] Implémenter `POST /api/v1/reports` (backend)
- [ ] Ajouter validation scamType (enum: phishing, vishing, email, SMS, etc.)
- [ ] Gérer upload fichier image (validation MIME type, max 5MB)
- [ ] Implémenter file storage (S3 ou local)
- [ ] Ajouter rate limiting (max 10 reports/user/jour)
- [ ] Implémenter retry logic (upload failed)
- [ ] Log reports pour analytics

**Acceptance Criteria:**
- POST retourne `{ success: true, reportId, timestamp }`
- Erreurs: 400 (validation), 413 (fichier trop gros), 429 (rate limit)
- Screenshots stockés avec access log

---

#### 5B.2 — useScamReport Hook Completion
**Effort:** 4h | **Owner:** Frontend  
**Dépend de:** 5B.1

**Tasks:**
- [ ] Implémenter submitReport async function
- [ ] Ajouter error handling avec retry
- [ ] Implémenter loading state management
- [ ] Ajouter success/error messages
- [ ] Persister formData en localStorage (draft mode)
- [ ] Cleanup URLs après upload

**Code:**
```javascript
const useScamReport = () => {
  const submitReport = async (formData) => {
    // FormData API pour multipart/form-data
    const fd = new FormData();
    fd.append('scamType', formData.scamType);
    fd.append('description', formData.description);
    if (formData.rawFile) fd.append('screenshot', formData.rawFile);
    
    // POST avec retry
    return retryFetch('/api/v1/reports', { method: 'POST', body: fd });
  };
  return { submitReport, isLoading, error };
};
```

---

#### 5B.3 — Admin Reporting Dashboard
**Effort:** 12h | **Owner:** Backend + Frontend  
**Sprint:** Phase 5C (future)

**Tasks:**
- [ ] Créer Admin > Reports module
- [ ] GET `/api/v1/admin/reports?page=1&status=pending`
- [ ] Dashboard: list reports, filter by type/status/date
- [ ] UI: detail modal, action buttons (approve/reject/flag)
- [ ] Implémenter auto-flagging (ML model ou heuristics)
- [ ] Bulk actions (export CSV, mark as verified)

**UI Components:**
- ReportsList.jsx
- ReportDetail.jsx  
- BulkActionsToolbar.jsx

---

### P1 — HIGH (Semaines 3-4)

#### ARCH.1 — App.jsx Coverage Gap
**Effort:** 6h | **Owner:** Frontend  
**Coverage actuel:** 34.58% → **Target:** 90%+

**What's missing:**
- Main routing logic (lines 248, 254, 269-439)
- Theme toggle paths
- Tab switching logic
- Error boundaries

**Tests needed:**
- Tab navigation (all 8 tabs)
- Theme persistence
- Auth state changes
- Mobile responsive behavior

---

#### ARCH.2 — useAuth.js Branch Coverage
**Effort:** 8h | **Owner:** Frontend  
**Coverage actuel:** 44.23% branches → **Target:** 85%+

**What's missing:**
- Token refresh flow (lines 231-233)
- Logout edge cases (lines 318-347)
- Session expiry handling
- Network error scenarios

**Tests needed:**
- Token validation & refresh
- Concurrent auth requests
- localStorage corruption
- Network timeouts

---

#### DESIGN.1 — Mobile Responsiveness Pass
**Effort:** 10h | **Owner:** Frontend + Design  
**Current:** 60% mobile ready → **Target:** 95%+

**Components to optimize:**
- ScamReportingSystem (file upload on mobile)
- FamilyDashboard (card layouts)
- QuizModule (question display)
- EmergencyPanel (button sizes per WCAG 2.5.8)

**Tests:**
- Viewport: 360px, 480px, 768px, 1024px
- Touch targets: min 44px × 44px
- Orientation changes (portrait ↔ landscape)

---

### P2 — MEDIUM (Semaines 5-6)

#### TEST.1 — Admin Module Test Coverage
**Effort:** 16h | **Owner:** QA/Frontend  
**Current:** ~50% → **Target:** 95%+

**Modules (test counts):**
- AnalyticsDashboard: 0 tests → 30+ needed
- UserManagement: partial → 25+ needed
- SettingsBranding: partial → 20+ needed  
- APIKeyManagement: partial → 25+ needed

**Test focus:**
- CRUD operations
- Permissions/authorization
- Form validation
- Error states
- Success/confirmation flows

---

#### SEC.1 — Security Hardening
**Effort:** 12h | **Owner:** Backend + DevOps  

**Tasks:**
- [ ] Add CSRF protection (tokens)
- [ ] Implement rate limiting (global + per-endpoint)
- [ ] Add helmet.js security headers
- [ ] Validate file uploads (MIME type, size, content)
- [ ] Add input sanitization (DOMPurify)
- [ ] Implement API request signing
- [ ] Add audit logs for sensitive operations

**Endpoints to protect:**
- POST /api/v1/reports (file upload)
- POST /api/v1/family/create (PII)
- POST /api/v1/family/join (invite codes)
- DELETE /api/v1/user/* (account deletion)

---

#### MOBILE.1 — Responsive Image Optimization
**Effort:** 6h | **Owner:** Frontend  

**Tasks:**
- [ ] Convert PNG → WebP with fallbacks
- [ ] Implement responsive img srcset
- [ ] Add lazy loading (Intersection Observer)
- [ ] Optimize bundle size (tree-shake unused CSS)
- [ ] Profile Performance (Lighthouse → 90+ core web vitals)

---

---

## 🧪 TEST — Test Coverage & Quality

### P0 — CRITIQUE (Now)

#### TEST.2 — ScamReportingSystem Test Suite
**Effort:** 10h | **Owner:** QA  
**Target:** 50+ tests, 95% coverage

**Test categories:**
1. **Rendering (5 tests)**
   - Component mounts
   - Stepper displays correctly
   - Form fields render

2. **Navigation (6 tests)**
   - Next/Prev buttons work
   - Step state updates
   - Validation prevents advance

3. **Form Handling (8 tests)**
   - Input changes
   - Form data persists
   - Validation messages show

4. **File Upload (8 tests)**
   - File selection
   - File validation (MIME type, size)
   - Preview displays
   - Error handling

5. **Submission (8 tests)**
   - Success flow
   - Error handling
   - Loading state
   - Reset after submit

6. **Accessibility (8 tests)**
   - Keyboard navigation
   - ARIA labels
   - Screen reader compat
   - Focus management

---

#### TEST.3 — Critical Coverage Gaps
**Effort:** 12h | **Owner:** QA  
**Target:** Close top 5 gaps to 85%+

**Gaps (Priority):**
1. App.jsx: 34.58% → Tests for routing, tab logic
2. useAuth.js: 44.23% branches → Token & session tests
3. design-tokens.js: 54.54% → Token value tests
4. QuizAcademie.jsx: 45.55% → Quiz flow tests
5. QuebecFraudAlerts.jsx: 64.7% branches → Error state tests

---

### P1 — HIGH

#### TEST.4 — Integration Test Suite
**Effort:** 16h | **Owner:** QA  
**Target:** 30+ e2e tests

**User flows to test:**
- Auth signup → Family creation → Report scam
- Family join with invite code
- Guardian monitoring + alert analysis
- Quiz academy complete module
- Admin report review workflow

**Tool:** Playwright (already configured)

---

#### TEST.5 — Performance Baseline
**Effort:** 6h | **Owner:** DevOps + QA  

**Metrics:**
- Bundle size: <500KB gzipped
- FCP (First Contentful Paint): <2s
- LCP (Largest Contentful Paint): <2.5s
- CLS (Cumulative Layout Shift): <0.1
- Component render time: <100ms average

**Tools:** Lighthouse, WebPageTest, Performance API

---

---

## 🏗️ ARCH — Architecture & Infrastructure

### P0 — CRITIQUE

#### ARCH.3 — File Upload Architecture
**Effort:** 8h | **Owner:** Backend + DevOps  

**Current:** In-memory storage  
**Target:** Persistent storage with S3 or local disk

**Design:**
```
Frontend (multipart/form-data)
    ↓
Express middleware (busboy)
    ↓
S3 uploader (signed URLs) OR local disk
    ↓
DB: store fileUrl + metadata
```

**Tasks:**
- [ ] Choose: AWS S3 vs local disk storage
- [ ] Implement signed URLs (S3)
- [ ] Add virus scanning (ClamAV integration)
- [ ] Setup file retention policy (90 days)
- [ ] Add file access audit logging

---

#### ARCH.4 — Database Schema Update
**Effort:** 6h | **Owner:** Backend  

**New tables/attributes:**
```javascript
reports {
  id, userId, scamType, description, 
  screenshotUrl, status, flaggedReason,
  createdAt, updatedAt, verifiedAt
}

report_analytics {
  reportId, viewCount, actionTaken,
  timeTaken (seconds), reporterId
}
```

---

### P1 — HIGH

#### ARCH.5 — API Gateway Setup
**Effort:** 10h | **Owner:** DevOps  
**Sprint:** Phase 6 (future)

**Tasks:**
- [ ] Setup API Gateway (AWS or Node.js gateway)
- [ ] Implement request throttling
- [ ] Add request logging/monitoring
- [ ] Setup webhook notifications
- [ ] Implement request signing

---

#### ARCH.6 — SMS/Email Notification Service
**Effort:** 12h | **Owner:** Backend  
**Sprint:** Phase 6

**Features:**
- Send SMS on high-risk scam report
- Email admin when report flagged
- Daily summary digest
- Alert subscriptions (by family members)

**Tool:** Twilio or AWS SNS

---

### P0.5 — INFRASTRUCTURE MIGRATION (Serverless Architecture)

#### ARCH.7 — Full Serverless Migration
**Effort:** 40h total | **Owner:** Backend + DevOps  
**Sprint:** Weeks of Apr 21 - May 12 (4 weeks parallel to Phase 5B)  
**Decision:** Aurora Serverless v2 + Lambda + API Gateway v2

**Architecture:**
```
Frontend (S3 + CloudFront) ✅ Already serverless
    ↓
Lambda API Layer (express handler) → NEW
    ↓
API Gateway v2 (request routing) → NEW
    ↓
Aurora Serverless v2 PostgreSQL (RDS) → NEW
    ↓
S3 + SNS (notifications) ✅ Already serverless
```

**Cost Impact:**
- Current: ~$26-36/month (Express.js on EC2 + PostgreSQL RDS)
- Serverless: ~$16.38/month (Aurora Serverless v2 + Lambda + API Gateway)
- Savings at scale: 30-50% reduction at 500+ users
- Break-even: Month 18 with Phase 6 analytics

---

#### ARCH.7.1 — Aurora Serverless v2 Setup & Migration
**Effort:** 12h | **Owner:** Backend + DevOps  
**Week:** Apr 21-27

**Tasks:**
- [ ] Create Aurora Serverless v2 cluster (us-east-1)
- [ ] Setup database schema from PostgreSQL dump
- [ ] Migrate in-memory stores → Aurora (users, reports, rate_limit_tracker)
- [ ] Update dev-server.js to use Aurora connection
- [ ] Test queries against Aurora (report history, user lookups, rate limiting)
- [ ] Setup auto-scaling (0.5 - 2 ACU)
- [ ] Configure automated backups (7-day retention)
- [ ] Create RDS proxy for connection pooling

**Success Criteria:**
- All 2021+ tests pass against Aurora
- Query performance < 100ms for typical operations
- Zero data loss from migration
- Connection pooling working

**Cost:** $15-20/month (starts at 0.5 ACU = $262/month... actually ~$15/month for minimal tier)

---

#### ARCH.7.2 — Database Schema & Query Optimization
**Effort:** 8h | **Owner:** Backend  
**Week:** Apr 28-May 4

**Tasks:**
- [ ] Create indexes for Phase 6 analytics (scam_type, created_at, user_id)
- [ ] Design report_analytics table (for Phase 6)
- [ ] Optimize user report history query (`reports WHERE user_id = ? ORDER BY created_at DESC`)
- [ ] Test concurrent rate limit checks (no deadlocks)
- [ ] Migrate all DynamoDB-style queries to SQL
- [ ] Setup connection monitoring

**Success Criteria:**
- All 20+ queries optimized
- Analytics queries ready for Phase 6
- No N+1 query problems
- Connection pool stable under load

---

#### ARCH.7.3 — Express.js → Lambda Handler Conversion
**Effort:** 12h | **Owner:** Backend  
**Week:** May 5-11

**Tasks:**
- [ ] Install serverless framework + plugins
- [ ] Convert dev-server.js Express app → Lambda handler (aws-lambda-express)
- [ ] Update environment variables (Aurora connection, S3 bucket)
- [ ] Test locally with SAM CLI
- [ ] Create API Gateway v2 HTTP API (replaces ALB)
- [ ] Setup request/response transformation
- [ ] Configure Lambda function (256MB → 512MB memory)
- [ ] Test all endpoints (GET, POST, PUT, DELETE)
- [ ] Validate multipart file upload through Lambda

**Success Criteria:**
- Express middleware works under Lambda
- File upload still works (busboy + S3)
- Rate limiting works
- All 2021+ tests pass in Lambda environment
- Cold start < 2s, warm start < 100ms

**Code Pattern:**
```javascript
// serverless.yml
service: scamguard-api
functions:
  api:
    handler: backend/lambda-handler.js
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
    environment:
      DATABASE_URL: ${env:AURORA_CONNECTION_STRING}
      S3_BUCKET: ${env:S3_BUCKET}
      NODE_ENV: production
```

---

#### ARCH.7.4 — Deployment, Testing & Cutover
**Effort:** 8h | **Owner:** DevOps  
**Week:** May 12-18

**Tasks:**
- [ ] Deploy Aurora Serverless v2 to production
- [ ] Deploy Lambda function + API Gateway
- [ ] Run full integration tests (frontend ↔ serverless backend)
- [ ] Load test (1000 concurrent users, 1000 req/s)
- [ ] Monitor Lambda metrics (duration, errors, cold starts)
- [ ] Cutover: DNS switch from EC2 to API Gateway
- [ ] Monitor errors for 24 hours
- [ ] Rollback plan ready (switch back to EC2 in < 5 min)
- [ ] Document architecture & deployment process

**Success Criteria:**
- Zero downtime during cutover
- Error rate < 0.1%
- P95 latency < 200ms
- All alerts configured
- Team trained on new infrastructure

**Monitoring Setup:**
- CloudWatch: Lambda duration, errors, memory usage
- X-Ray: Trace requests end-to-end
- RDS Insights: Query performance
- Cost alerts: Budget $50/month max

---

#### ARCH.7.5 — Infrastructure Documentation
**Effort:** 4h | **Owner:** DevOps  
**Week:** May 18-25

**Deliverables:**
- [ ] Architecture diagram (C4 model)
- [ ] Deployment runbook (manual + automated)
- [ ] Troubleshooting guide (Lambda errors, Aurora issues)
- [ ] Cost monitoring dashboard
- [ ] Disaster recovery plan
- [ ] Capacity planning guide (when to scale)

---

---

---

## 🎨 DESIGN — UI/UX & Accessibility

### P0 — CRITIQUE

#### DESIGN.2 — ScamReportingSystem Polish
**Effort:** 6h | **Owner:** Design + Frontend  

**Tasks:**
- [ ] Visual feedback for file upload (progress bar)
- [ ] Drag-and-drop zone styling
- [ ] Success animation (confetti or checkmark)
- [ ] Error message styling (senior-friendly)
- [ ] Dark mode compatibility
- [ ] Print-friendly report confirmation

**Figma:** Update component library with new states

---

#### DESIGN.3 — Senior-First UX Audit
**Effort:** 8h | **Owner:** Design + QA  
**Current:** Partial WCAG AAA → **Target:** 100% AAA

**Audit checklist:**
- Font sizes: min 18px body, 24px headings
- Color contrast: min 7:1 (AAA)
- Line height: 1.5 minimum
- Touch targets: 44×44px minimum
- Icons + text labels (no icons alone)
- Clear error messages (avoid jargon)
- Sufficient white space

**Components to audit:**
- All 8 main tabs
- Forms (signup, family join, report)
- Modals (admin actions)
- Mobile layouts

---

### P1 — HIGH

#### DESIGN.4 — Dark Mode Implementation
**Effort:** 8h | **Owner:** Design + Frontend  

**Tasks:**
- [ ] Design dark palette
- [ ] Update design tokens
- [ ] Test contrast ratios (dark mode)
- [ ] Add system preference detection
- [ ] Implement toggle switch
- [ ] Test on iOS/Android

---

#### DESIGN.5 — Component Library Expansion
**Effort:** 10h | **Owner:** Design  
**Sprint:** Phase 6

**New components:**
- DatePicker (accessible)
- MultiSelect (dropdown)
- RichTextEditor (for admin)
- DataTable (with sort/filter)
- Notification Stack
- Toast Queue

---

---

## 📱 MOBILE — Mobile-First Features

### P0 — CRITICAL

#### MOBILE.2 — Mobile Form Optimization
**Effort:** 8h | **Owner:** Frontend  

**Issues to fix:**
- File input doesn't open camera on mobile
- Number inputs trigger zoom on iOS
- Touch keyboard covers form fields
- Submit button not always visible

**Solutions:**
- Use `input type="file" accept="image/*" capture="environment"`
- Add inputmode="numeric" (not type="number")
- Implement keyboard-aware scrolling
- Make buttons sticky or floating

---

#### MOBILE.3 — PWA Features
**Effort:** 12h | **Owner:** DevOps + Frontend  
**Sprint:** Phase 6

**Tasks:**
- [ ] Add manifest.json
- [ ] Implement service worker
- [ ] Enable offline caching
- [ ] Add "Add to Home Screen" button
- [ ] Setup push notifications
- [ ] Test on iOS & Android

---

### P1 — HIGH

#### MOBILE.4 — Responsive Admin Dashboard
**Effort:** 10h | **Owner:** Frontend  
**Current:** Desktop-only → **Target:** Mobile + tablet

**Breakpoints:**
- 360px (mobile)
- 768px (tablet)
- 1024px (desktop)

**Layout strategy:**
- Collapse admin sidebar (mobile)
- Use bottom tab bar
- Horizontal tables → vertical cards
- Modal forms instead of inline

---

---

## 🔒 SEC — Sécurité & Compliance

### P0 — CRITICAL (Must-Have)

#### SEC.2 — Input Validation & Sanitization
**Effort:** 8h | **Owner:** Backend + Frontend  

**Tasks:**
- [ ] Add schema validation (Zod or Joi)
- [ ] Sanitize all text inputs (DOMPurify)
- [ ] Validate file uploads (magic bytes, not just extension)
- [ ] Prevent XSS in description field
- [ ] Prevent SQL injection in all queries
- [ ] Rate limit auth endpoints

**Test:** OWASP Top 10 scenarios

---

#### SEC.4 — Authentication Hardening
**Effort:** 6h | **Owner:** Backend  

**Tasks:**
- [ ] Add 2FA support (TOTP, SMS)
- [ ] Implement session invalidation
- [ ] Add IP whitelist option
- [ ] Implement account lockout (5 failed attempts)
- [ ] Add password reset security
- [ ] Test account takeover scenarios

---

### P1 — HIGH

#### SEC.5 — API Security
**Effort:** 12h | **Owner:** Backend  

**Tasks:**
- [ ] Add request signing (HMAC)
- [ ] Implement API versioning
- [ ] Add rate limiting (Redis-backed)
- [ ] Setup WAF rules (AWS WAF)
- [ ] Enable HTTPS everywhere
- [ ] Implement CORS properly

---

#### SEC.6 — Secrets Management
**Effort:** 4h | **Owner:** DevOps  

**Tasks:**
- [ ] Remove hardcoded secrets (env vars)
- [ ] Use AWS Secrets Manager or HashiCorp Vault
- [ ] Rotate API keys quarterly
- [ ] Add secret scanning (pre-commit hooks)

---

### P3 — LOW (Phase 6+)

#### SEC.3 — Data Privacy & GDPR
**Effort:** 10h | **Owner:** Backend + Legal  
**Status:** DEFERRED (not urgent)

**Tasks:**
- [ ] Implement user data export (GET /api/v1/user/export)
- [ ] Implement account deletion (cascade delete)
- [ ] Add data retention policies (logs: 30d, reports: 90d)
- [ ] Document privacy policy (current: missing)
- [ ] Add consent flow for reports (PII)
- [ ] Implement audit logs

**Compliance:**
- ✅ PIPEDA (Canadian personal data)
- ⚠️ GDPR (if EU users)
- ⚠️ CCPA (if California users)

---

---

## 🎯 Summary: Timeline

### Current Sprint (Week 1-2: Apr 16-29)
- ✅ **Complete Phase 5A tests** (all 2021 passing)
- 🔄 **Phase 5B ScamReportingSystem** (tests + API)
  - TEST.2: ScamReportingSystem test suite (50+ tests)
  - DEV.5B.2: useScamReport hook completion
  - DEV.5B.1: Backend API endpoint
- 🚀 **ARCH.7.1: Aurora Serverless v2 Setup** (parallel start)

**Exit Criteria:** 
- ScamReportingSystem: 95% coverage
- All tests passing
- API integration working end-to-end
- Aurora cluster ready for migration

---

### Sprint 2 (Week 3-4: Apr 30-May 13)
- ARCH.1: App.jsx coverage
- ARCH.2: useAuth.js branches
- TEST.3: Critical coverage gaps
- DESIGN.2: ScamReportingSystem polish
- MOBILE.2: File upload mobile fix
- 🚀 **ARCH.7.2-3: Database Migration + Lambda Conversion** (parallel)

**Exit Criteria:** 
- 85%+ coverage across all critical files
- Mobile file upload working
- Aurora migration complete
- Lambda handler ready for testing
- Admin reporting dashboard ready for Phase 5C

---

### Sprint 3 (Week 5-6: May 14-27)
- DESIGN.3: Senior-first UX audit
- SEC.2-4: Security hardening
- TEST.4: Integration test suite
- ARCH.3: File upload architecture (S3 integration)
- MOBILE.3: PWA features (background)
- 🚀 **ARCH.7.4-5: Serverless Deployment + Cutover** (Week 5)

**Exit Criteria:**
- 100% WCAG AAA on critical flows
- All OWASP Top 10 scenarios tested
- File storage production-ready (S3)
- Serverless infrastructure live in production
- Zero downtime cutover complete

---

### Phase 6 (Week 7+: June onwards)
- Admin Reports Dashboard (5B.3)
- Analytics Dashboard (DESIGN.4 + TEST.1)
- Mobile PWA (MOBILE.3)
- API Gateway (ARCH.5)
- Email/SMS notifications (ARCH.6)

---

## 📊 Resource Allocation

| Rôle | Load | Semaines |
|------|------|----------|
| **Frontend** | 60h | 6 weeks |
| **Backend** | 40h | 6 weeks |
| **QA/Testing** | 50h | 6 weeks |
| **Design** | 30h | 6 weeks |
| **DevOps** | 20h | 6 weeks |
| **TOTAL** | **200h** | **6 weeks** |

---

## 🚨 Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Backend API not ready for 5B | HIGH | Start dev in parallel, mock endpoints |
| Mobile file upload (camera) | MEDIUM | Test on device early, use fallback |
| File storage decision (S3 vs local) | MEDIUM | POC both, decide by week 2 |
| GDPR compliance (if needed) | HIGH | Legal review early, budget 2 weeks |
| Senior UX validation | MEDIUM | User testing with 50+ seniors (phase 6) |

---

## ✅ Success Metrics

- **Code Quality:** 95%+ coverage, 0 critical bugs
- **Performance:** Lighthouse 90+, <2s FCP
- **Accessibility:** 100% WCAG AAA (critical flows)
- **Mobile:** 95%+ responsive, <50KB JS bundle
- **Security:** All OWASP Top 10 passing
- **User Satisfaction:** 4.5+/5 on features

---

**Prepared by:** PM Agent  
**Next review:** 23 avril 2026 (end of sprint 1)
