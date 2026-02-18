# Phase 1 Task Dashboard
## Infrastructure & Conformité (Feb-Mar 2026)

**Status:** Week 1 Starting
**Timeline:** 8 weeks (8 Feb - 31 Mar 2026)
**Budget:** ~$1,200 (your time) + $50-100 (AWS)
**Progress:** 0% → Target 100%

---

## 📅 This Week (Week 1: Feb 17-23)

### ✅ Task 1.1: DynamoDB TTL & Anonymisation
- **ID:** INFRA-001
- **Priority:** P0 (Critical)
- **Assignee:** Claude Sonnet (AI)
- **Validation:** Gemini Flash (AI)
- **Your Review:** 60 min
- **Status:** 🟡 Ready to Execute
- **Deliverable:** `anonymization.py`, `handler_llm.py` (modified), `migration_script.py`, tests
- **API Cost:** ~$0.15
- **Timeline:** 30 min Claude + 15 min Gemini + 60 min you = 105 minutes
- **Guide:** See TASK_1_1_EXECUTION.md ← **START HERE**

### 🟰 Task 1.2: Consent Banner (UI-001)
- **ID:** UI-001
- **Priority:** P0 (Critical)
- **Assignee:** Claude Haiku (AI)
- **Validation:** Gemini Flash (AI)
- **Your Review:** 60 min
- **Status:** ⏳ Blocked by Task 1.1 (start after 1.1 review)
- **Deliverable:** `ConsentBanner.jsx`, `ConsentBanner.css`, tests
- **API Cost:** ~$0.08
- **Timeline:** 30 min Claude + 15 min Gemini + 60 min you
- **Note:** Tasks can overlap - start 1.2 while reviewing 1.1

---

## 📅 Week 2 (Feb 24 - Mar 2)

### 🟰 Task 2.1: Quebec AI Expert System Prompt (AI-001)
- **ID:** AI-001
- **Priority:** P0 (Critical)
- **Assignee:** Claude Opus (AI)
- **Validation:** Manual review by you
- **Your Review:** 30 min
- **Status:** ⏳ Waiting for Week 2
- **Deliverable:** `system_prompt_quebec_expert.txt` (500+ lines)
- **API Cost:** ~$0.12
- **Dependencies:** None (can start parallel to 1.1 & 1.2)

### 🟰 Task 2.2: SQ/CAFC Alerts Integration (ALERTS-001)
- **ID:** ALERTS-001
- **Priority:** P0 (Critical)
- **Assignee:** Claude Sonnet (AI)
- **Validation:** Gemini Pro (AI)
- **Your Review:** 45 min
- **Status:** ⏳ Waiting for Week 2
- **Deliverable:** `alerts_poller.py`, SQ/CAFC webhook handler, tests
- **API Cost:** ~$0.18
- **Dependencies:** Task 2.1 (needs Quebec institutions DB)

---

## 📅 Week 3-4 (Mar 3-16)

### 🟰 Additional Phase 1 Tasks
- Guardian Link Backend (GUARDIAN-001)
- Notification System (NOTIFICATIONS-001)
- Lambda Layer Setup
- DynamoDB Stream Triggers
- CloudWatch Monitoring

---

## 🎯 Phase 1 Success Criteria

✅ **Infrastructure Ready**
- DynamoDB TTL + anonymization working
- Secrets Manager configured
- Migration script tested

✅ **Compliance Achieved**
- Loi 25 compliant (pseudonymization + auto-delete)
- Consent banner implemented
- DPO-ready logging

✅ **Alerts Working**
- SQ/CAFC feeds integrated
- Quebec institutions database loaded
- Real-time alert system functional

✅ **Code Quality**
- Unit tests: 95%+ coverage
- All code reviewed by Gemini
- Zero security issues

---

## 📊 Progress Tracking

```
Week 1:
└─ Task 1.1: ░░░░░░░░░░ 0%
└─ Task 1.2: ░░░░░░░░░░ 0%

Week 2:
└─ Task 2.1: ░░░░░░░░░░ 0%
└─ Task 2.2: ░░░░░░░░░░ 0%

Week 3-4:
└─ Remaining: ░░░░░░░░░░ 0%

Overall: 0 / 8 tasks (0%)
```

---

## 💾 Repository Structure

```
backend/
├─ lambda/
│  ├─ utils/
│  │  └─ anonymization.py ← Task 1.1
│  ├─ handler_llm.py (modified)
│  ├─ migration_script.py ← Task 1.1
│  ├─ alerts_poller.py ← Task 2.2
│  └─ tests/
│     ├─ test_anonymization.py ← Task 1.1
│     └─ test_alerts.py ← Task 2.2
├─ cdk/
│  └─ lib/stack.py (DynamoDB TTL config)
└─ template.yaml (Lambda config)

frontend/
├─ src/
│  ├─ components/
│  │  └─ ConsentBanner.jsx ← Task 1.2
│  └─ utils/
│     └─ consentManager.js ← Task 1.2
└─ tests/
   └─ ConsentBanner.test.js ← Task 1.2
```

---

## 🚀 Quick Start Commands

### Run Task 1.1
```bash
# 1. Copy prompt from TASK_1_1_EXECUTION.md
# 2. Paste into Claude Sonnet
# 3. Get generated code
# 4. Place files in backend/lambda/
# 5. Run tests:
pytest backend/lambda/tests/test_anonymization.py -v

# 6. Commit
git add backend/lambda/utils/anonymization.py
git commit -m "feat(privacy): DynamoDB TTL and anonymization (Loi 25)"
```

### Track Progress
```bash
# See what tasks are done
git log --oneline | grep "feat\|fix"

# Check test coverage
pytest backend/lambda/tests/ --cov=backend/lambda --cov-report=term-missing
```

---

## 📈 Budget Tracking

| Task | Claude API | Gemini API | Your Time | Total |
|------|-----------|-----------|-----------|--------|
| 1.1  | $0.10     | $0.05     | $22.50    | $22.65 |
| 1.2  | $0.06     | $0.02     | $22.50    | $22.58 |
| 2.1  | $0.10     | $0.02     | $15.00    | $15.12 |
| 2.2  | $0.12     | $0.06     | $22.50    | $22.68 |
| Rest | TBD       | TBD       | $100.00   | TBD    |
| **Phase 1 Total** | **~$0.40** | **~$0.20** | **~$1,200** | **~$1,200** |

**Budget Status:** On track ✓

---

## 🔗 Key Documents

- 📋 **TASK_1_1_EXECUTION.md** ← Start here for Task 1.1
- 📋 **AGENT_TASKS_PROMPTS.md** ← All prompts for all tasks
- 📋 **ROADMAP_COMPLETE.md** ← Phase specs & requirements
- 📊 **PROJECT_STATUS.md** ← Architecture overview
- 💰 **FINAL_BUDGET_SUBSCRIPTION_MODEL.md** ← Budget & ROI

---

## ✨ What's Next After Phase 1?

**Phase 2 (Apr-Jul): Advanced Features**
- Guardian system (family linking)
- SMS simulator (50+ realistic scam messages)
- 5 learning quizzes with XP badges
- Emergency numbers integration (30+ Quebec)
- Dashboard refactor with haptic feedback

**Phase 3 (Aug-Sep): UX/UI & WCAG AAA**
- "Cœur de Sécurité" dashboard
- Bottom navigation redesign
- Full accessibility audit
- Emotional design for seniors

**Phase 4 (Oct+): Vision AI**
- Mail photo analyzer (GPT-4V)
- Call monitoring assistant

---

**Last Updated:** Feb 17, 2026
**Next Update:** After Task 1.1 completion
**Status:** Ready to start! 🚀
