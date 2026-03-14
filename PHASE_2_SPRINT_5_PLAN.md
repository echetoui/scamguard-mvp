# Phase 2 Sprint 5: SMS Simulation & Real Threats
**Duration:** April 2026 (2 weeks)
**Status:** PLANNING
**Objective:** Integrate real SMS scam database and build interactive simulation interface

---

## 📋 Sprint Overview

### Goals
1. ✅ Integrate SQ (Sûreté du Québec) threat database
2. ✅ Integrate CAFC (Canadian Anti-Fraud Centre) database
3. ✅ Build SMS simulation interface
4. ✅ Create interactive threat scenarios
5. ✅ Implement user threat matching alerts

### Key Features
- Real threat database from official sources
- SMS simulation UI for interactive training
- Threat scenario library
- Weekly alert digest system
- User threat profile matching

---

## 🏗️ Architecture & Components

### 1. Threat Database Integration

#### 1.1 SQ API Integration
```
Endpoint: /api/threats/sq
Frequency: Poll every 4 hours
Format: JSON threat objects
Fields:
  - id: "SQ-2026-001"
  - type: "SMS|Email|Call|Phishing"
  - institution: "Desjardins|Hydro-Quebec|etc"
  - threat_level: "low|medium|high"
  - keywords: ["cliquer", "urgent", "verify"]
  - description_fr: French description
  - regions: ["Montreal", "Quebec City"]
  - date_detected: ISO timestamp
```

#### 1.2 CAFC Integration
```
Endpoint: /api/threats/cafc
Frequency: Daily update
Format: CSV → JSON conversion
Source: Canadian Anti-Fraud Centre
```

### 2. SMS Simulation Interface

#### 2.1 New Component: SMSSimulator.jsx
```
Features:
- Display simulated SMS messages
- User identifies if real/scam
- Reveals correct answer + explanation
- Tracks user score
- Shows threat indicators
```

#### 2.2 Threat Scenario Library
```
Structure:
scenarios/
  ├─ banking/
  │  ├─ desjardins_false_verify.json
  │  ├─ td_urgent_alert.json
  │  └─ ...
  ├─ utilities/
  │  ├─ hydro_payment_due.json
  │  └─ ...
  └─ other/
```

### 3. User Threat Matching

```
Logic:
1. Get user threat profile from profile page
2. Match against current threat database
3. If match found: Show "Alert for YOU" notification
4. Track matched threats
5. Send weekly digest
```

### 4. Alert System

#### 4.1 Push Notification
```
Title: "🚨 Nouvelle arnaque détectée au Québec"
Body: "Faux SMS Desjardins circulant..."
Action: Open threat details
```

#### 4.2 Weekly Digest
```
Day: Monday morning
Content:
  - New threats detected
  - Threats matching user profile
  - Statistics
  - Tips to stay safe
```

---

## 🛠️ Implementation Checklist

### Frontend (React)
- [ ] Create SMSSimulator.jsx component
- [ ] Create ThreatsSection.jsx (displays current threats)
- [ ] Create ThreatCard.jsx (individual threat display)
- [ ] Create SimulationQuestion component
- [ ] Add SMS simulation to QuizAcademie tab
- [ ] Create WeeklyDigest component
- [ ] Add threat matching logic to Dashboard

### Backend (Lambda/Python)
- [ ] Setup SQ API polling (Lambda scheduled event)
- [ ] Setup CAFC CSV parsing & import
- [ ] Create /api/threats endpoint
- [ ] Create /api/threats/{id} endpoint
- [ ] Create user threat matching algorithm
- [ ] Implement weekly digest scheduling
- [ ] Create threat notification service

### Database (DynamoDB)
- [ ] Create threats table
  ```
  - PK: threat_id (SQ-2026-001)
  - SK: date_detected
  - Attributes: type, institution, threat_level, etc
  ```
- [ ] Create user_threats table
  - Track which threats match user profile
- [ ] Create threat_scenarios table
  - Store SMS simulation scenarios

### Testing
- [ ] Unit tests for threat matching algorithm
- [ ] Unit tests for SMS simulator component
- [ ] Integration tests for API endpoints
- [ ] E2E tests for threat notification flow

---

## 📊 Success Criteria

- [ ] SQ API integration working (polls every 4h)
- [ ] CAFC database imported (daily)
- [ ] 20+ SMS scenarios in library
- [ ] SMS simulator component fully functional
- [ ] User threat matching 90%+ accurate
- [ ] Weekly digest sent to all users
- [ ] Test coverage > 85%
- [ ] Performance: API responses < 200ms

---

## 🎯 Deliverables

1. **SMSSimulator.jsx** (400+ lines)
   - Interactive SMS training interface
   - Score tracking
   - Detailed explanations

2. **ThreatsAPI** (Backend)
   - GET /api/threats (list all)
   - GET /api/threats/{id} (detail)
   - POST /api/threats/match (user matching)

3. **Database Schema**
   - threats table
   - user_threats table
   - threat_scenarios table

4. **Tests**
   - 40+ SMS simulator tests
   - 30+ threat matching tests
   - 20+ API integration tests

5. **Documentation**
   - Threat database schema
   - SMS simulation guide
   - Weekly digest format

---

## ⏰ Timeline

| Week | Task |
|------|------|
| Week 1 | API integration (SQ/CAFC) + SMS scenarios |
| Week 2 | UI components + threat matching + testing |

---

## 👥 Team & Resources

- Frontend: 1 developer
- Backend: 1 developer (can be same person)
- QA: 0.5 tester
- Total: 2-2.5 FTE

---

## 🔄 Dependencies

- Phase 1 complete ✅
- Test infrastructure ready ✅
- DynamoDB setup ✅
- Lambda deployment working ✅

---

## 🚀 Ready to Start!

This sprint is a major feature delivery that will significantly enhance user engagement and provide real, actionable threat intelligence from official Canadian sources.

**Estimated Impact:**
- +100-150 users can train with real threats
- +50% engagement with simulation features
- Real-time alerts increase security awareness

---

**Sprint Status:** Ready for implementation ✅
**Next:** Phase 2 Sprint 5 Implementation (Week 1-2 April)

