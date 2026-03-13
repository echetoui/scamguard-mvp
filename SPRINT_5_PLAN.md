# 🚀 Sprint 5: SMS Simulation & Real Threats

**Duration:** April 2026 (2-3 weeks)
**Status:** READY TO START
**Effort:** 4 FTE (Backend, Frontend, Content, UX)
**Target Tests:** 200+ new tests

---

## 📋 Features Overview

### 1. SMS Simulator - Real threat training (50+ messages)
**Owner:** Backend Dev (1 FTE) + Frontend Dev (0.5 FTE) + QA (0.5 FTE)
**Timeline:** Week 1-2

**What to build:**
- DynamoDB table for SMS messages
- SMS collection UI (admin only)
- SMS randomizer + daily SMS selection
- User interaction tracking (click/delete decision)
- Score calculation + immediate feedback
- Difficulty levels (Easy → Hard)

**Key files to create:**
- `backend/sms_simulator/model.py` - SMS DynamoDB schema
- `backend/sms_simulator/service.py` - Simulator logic
- `frontend/src/components/SMSSimulator.jsx` - UI component
- `frontend/src/components/__tests__/SMSSimulator.test.jsx` - Tests
- `frontend/src/styles/SMSSimulator.css` - Styling

**Test targets:**
- 40+ unit tests (SMSSimulator component)
- 20+ backend service tests
- Integration tests (E2E)

---

### 2. Interactive Quizzes - 5 themed quiz modules
**Owner:** Content Creator (1 FTE) + Frontend Dev (0.5 FTE) + UX Designer (0.5 FTE)
**Timeline:** Week 2-3

**5 Quizzes to implement:**
1. "Arnaque des Grands-Parents" (5 Q, 2 min)
2. "Faux SMS Bancaires" (5 Q, 2 min)
3. "Usurpation d'Identité en Ligne" (5 Q, 2 min)
4. "Arnaque au Paiement Amazon/Apple" (5 Q, 2 min)
5. "Phishing & Faux Liens" (5 Q, 2 min)

**What to build:**
- Quiz engine (randomize questions, shuffle answers)
- Progress tracking (completed/in-progress)
- Badge system (unlock on completion)
- Certificate PDF generation (100% score)
- Score sharing (optional social)
- Analytics (accuracy tracking)

**Key files to create:**
- `frontend/src/data/quizzes.js` - Quiz definitions
- `frontend/src/components/QuizEngine.jsx` - Quiz player
- `frontend/src/components/QuizProgress.jsx` - Progress tracker
- `frontend/src/components/BadgeSystem.jsx` - Badge display
- `frontend/src/utils/certificateGenerator.js` - PDF generation
- `frontend/src/components/__tests__/QuizEngine.test.jsx` - Tests

**Test targets:**
- 50+ quiz engine tests
- 30+ badge system tests
- 20+ certificate generation tests

---

### 3. Weekly Alerts - Push notifications system
**Owner:** Backend Dev (0.5 FTE) + Frontend Dev (0.5 FTE)
**Timeline:** Week 3

**What to build:**
- Firebase Cloud Messaging integration
- Notification scheduler (Monday 9 AM)
- Smart alert targeting (personalization)
- Email digest option (Thursday)
- In-app notification center
- Notification preferences UI

**Key files to create:**
- `backend/notifications/scheduler.py` - Weekly scheduler
- `backend/notifications/targeting.py` - Personalization logic
- `frontend/src/components/NotificationCenter.jsx` - Inbox UI
- `frontend/src/components/AlertCard.jsx` - Alert display
- `frontend/src/utils/notificationPreferences.js` - User settings
- `frontend/src/components/__tests__/NotificationCenter.test.jsx` - Tests

**Test targets:**
- 25+ notification scheduler tests
- 20+ targeting logic tests
- 35+ UI component tests

---

## 📂 Project Structure Changes

```
frontend/
├── src/
│   ├── components/
│   │   ├── SMSSimulator.jsx (NEW)
│   │   ├── QuizEngine.jsx (NEW)
│   │   ├── QuizProgress.jsx (NEW)
│   │   ├── BadgeSystem.jsx (NEW)
│   │   ├── NotificationCenter.jsx (NEW)
│   │   ├── AlertCard.jsx (NEW)
│   │   └── __tests__/ (expanded with 200+ new tests)
│   ├── data/
│   │   └── quizzes.js (NEW)
│   ├── styles/
│   │   ├── SMSSimulator.css (NEW)
│   │   ├── QuizEngine.css (NEW)
│   │   └── NotificationCenter.css (NEW)
│   └── utils/
│       ├── certificateGenerator.js (NEW)
│       ├── notificationPreferences.js (NEW)
│       └── notificationService.js (MODIFY)
│
backend/
├── sms_simulator/ (NEW)
│   ├── model.py
│   ├── service.py
│   ├── routes.py
│   └── test_simulator.py
└── notifications/ (NEW)
    ├── scheduler.py
    ├── targeting.py
    ├── routes.py
    └── test_notifications.py
```

---

## 🎯 Data Models

### SMS Message (DynamoDB)
```python
{
  "id": "sms-001",
  "original_text": "Click here to verify Desjardins account",
  "anonymized_text": "Click here to verify [BANK] account",
  "source": "SQ",  # SQ, CAFC, User
  "category": "banking",  # banking, telecom, gov, ecommerce
  "threat_level": 8,  # 1-10
  "correct_response": "Je supprime",  # "Je clique" or "Je supprime"
  "red_flags": ["Urgency", "Click link", "Verify account"],
  "explanation": "This is a classic phishing attempt because...",
  "created_at": "2026-02-01",
  "usage_count": 145,
  "avg_accuracy": 0.82,
  "difficulty": "hard"  # easy, medium, hard
}
```

### Quiz Definition
```python
{
  "id": "quiz-grandparent-scam",
  "title": "Arnaque des Grands-Parents",
  "description": "Learn to spot the grandparent scam",
  "duration_minutes": 2,
  "xp_reward": 25,
  "badge": "Familial",
  "difficulty": "easy",
  "questions": [
    {
      "id": "q1",
      "text": "📞 Vous recevez un appel d'un jeune homme...",
      "options": [
        {"text": "A) Raccrochez et rappelez", "correct": True},
        {"text": "B) Envoyez l'argent immédiatement", "correct": False}
      ],
      "explanation": "Scammers often impersonate family members..."
    }
  ]
}
```

---

## 🧪 Testing Strategy

**Target: 200+ new tests**
- SMS Simulator: 40 unit + 20 backend + 15 integration = 75 tests
- Quiz Engine: 50 unit + 20 integration = 70 tests
- Notifications: 20 scheduler + 15 targeting + 25 UI = 60 tests
- E2E: 20+ tests
- **Total:** 225+ new tests (>60% coverage)

---

## 📅 Weekly Breakdown

### Week 1: SMS Simulator
- Day 1-2: Backend SMS model + service (16h)
- Day 3-4: Frontend component + styling (12h)
- Day 5: Testing + refinement (8h)
- **Deliverable:** SMS simulator with 50 test messages

### Week 2: Interactive Quizzes
- Day 1-2: Quiz data + engine (16h)
- Day 3: Frontend quiz component (8h)
- Day 4: Badge system (8h)
- Day 5: Certificate generation (8h)
- **Deliverable:** 5 playable quizzes with badges + certs

### Week 3: Alerts + Polish
- Day 1-2: Notification scheduler (12h)
- Day 3: Targeting personalization (8h)
- Day 4: In-app notification center (8h)
- Day 5: Testing + final refinement (8h)
- **Deliverable:** Weekly alerts working + preferences configured

---

## ✅ Definition of Done

- [ ] 225+ tests passing (>60% coverage)
- [ ] SMS Simulator with 50+ messages functional
- [ ] 5 Quizzes fully playable with content
- [ ] Badge system complete
- [ ] Certificate PDF generation working
- [ ] Weekly notification scheduler operational
- [ ] Notification center functional
- [ ] Build passes without errors
- [ ] WCAG AAA accessibility maintained
- [ ] Mobile responsive verified
- [ ] Code reviewed & approved
- [ ] Documentation updated

---

## 📊 Success Metrics

- Quiz completion rate: >70%
- Badge unlock rate: >60% of users
- Notification engagement: >40%
- SMS accuracy: >80%
- Performance: Quiz <200ms, SMS <100ms

---

## 👥 Team

- Backend Dev (1 FTE)
- Frontend Dev (1 FTE)
- Content Creator (0.5 FTE)
- UX Designer (0.5 FTE)
- QA/Testing (1 FTE)
- **Total: 4 FTE**

---

## 🔗 Dependencies

**Requires:** Phase 1 ✅ (Complete)
**Blocks:** Phase 2.2 (Dashboard redesign)
**Integrates with:** NotificationService, QuizAcademie, AuthService

---

**Ready to start? Let's go! 🚀**
