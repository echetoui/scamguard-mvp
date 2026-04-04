# Task Backlog

Unstarted tasks, ordered by dependency. Start with top item.

---

## Phase 2 - Sprint 1: SMS OTP Complete (April 2026)

### TASK-101: Clean up TASK_*.md files from git
- **Domain:** Repository maintenance
- **Files:** (deletion only)
- **LOC:** 0 (deletes 15+ files)
- **Tokens:** 1K
- **Blocked by:** None
- **Blocks:** None
- **Description:** Remove obsolete TASK_*.md, DEPLOYMENT_*.md, *_REPORT.md files (use .claudeignore instead)
- **Files to delete:**
  ```
  TASK_1_1_EXECUTION.md
  TASK_1_AUTH_TESTING_REPORT.md
  TASK_2_1_2_STATUS.md
  ... (all TASK_*.md and report files)
  ```

### TASK-102: Fix App.test.jsx React import issue
- **Domain:** Frontend/Testing
- **Files:** 2
- **LOC:** ~20
- **Tokens:** 2K
- **Blocked by:** None
- **Blocks:** None
- **Description:** Fix "React is not defined" error in App.jsx (54 failing tests)
- **Files affected:**
  ```
  frontend/src/App.jsx
  frontend/src/__tests__/App.test.jsx
  ```
- **Success Criteria:**
  1. [ ] All 54 App.test.jsx tests pass
  2. [ ] React import correctly added to App.jsx
  3. [ ] No other component imports broken
  4. [ ] Test count: 2223+ passing

### TASK-103: Add error boundary tests
- **Domain:** Frontend/Testing
- **Files:** 2
- **LOC:** ~80
- **Tokens:** 3K
- **Blocked by:** TASK-102
- **Blocks:** None
- **Description:** Expand ErrorBoundary test coverage (currently minimal)
- **Files affected:**
  ```
  frontend/src/components/ErrorBoundary.jsx
  frontend/src/components/__tests__/ErrorBoundary.test.jsx
  ```
- **Success Criteria:**
  1. [ ] Test coverage for error state rendering
  2. [ ] Test fallback UI display
  3. [ ] Test recovery mechanism
  4. [ ] Vitest passes all tests

### TASK-104: Extend SMS Simulator training scenarios
- **Domain:** Frontend
- **Files:** 3
- **LOC:** ~150
- **Tokens:** 4K
- **Blocked by:** None
- **Blocks:** TASK-105
- **Description:** Add 5 new SMS scam scenarios to training module (currently 3)
- **Files affected:**
  ```
  frontend/src/components/SMSSimulator.jsx
  frontend/src/data/sms_scenarios.json (new)
  frontend/src/components/__tests__/SMSSimulator.test.jsx
  ```
- **Success Criteria:**
  1. [ ] 8 total scenarios (5 new + 3 existing)
  2. [ ] Scenarios cover: phishing, urgency, authority, fake offers
  3. [ ] Tests verify all scenarios render correctly
  4. [ ] SMSSimulator.test.jsx passes

### TASK-105: Add scoring/analytics to SMS Simulator
- **Domain:** Frontend
- **Files:** 3
- **LOC:** ~120
- **Tokens:** 4K
- **Blocked by:** TASK-104
- **Blocks:** None
- **Description:** Track user performance in simulator, show score/feedback
- **Files affected:**
  ```
  frontend/src/components/SMSSimulator.jsx (modify)
  frontend/src/hooks/useSimulatorScore.js (new)
  frontend/src/components/__tests__/SMSSimulator.test.jsx
  ```
- **Success Criteria:**
  1. [ ] Score calculation logic (correct/incorrect detection)
  2. [ ] Feedback shown after each scenario
  3. [ ] Final score displayed
  4. [ ] Test coverage for scoring logic

---

## Phase 2 - Sprint 2: Real Fraud Alerts (May 2026)

### TASK-110: Integrate QuebecFraudAlerts API
- **Domain:** Backend
- **Files:** 3
- **LOC:** ~100
- **Tokens:** 3K
- **Blocked by:** None
- **Blocks:** TASK-111
- **Description:** Create Lambda handler for Quebec fraud alerts API
- **Files affected:**
  ```
  backend/lambda_/threats_handler.py (modify)
  backend/agents/threat_analyst.py (modify)
  backend/cdk/stacks/scamguard_stack.py (add route)
  ```
- **Success Criteria:**
  1. [ ] GET /api/v1/threats/quebec endpoint
  2. [ ] Real fraud alerts fetched from Quebec source
  3. [ ] Errors handled gracefully (fallback to cache)
  4. [ ] Logging enabled

### TASK-111: Display Quebec alerts in ThreatsHandler
- **Domain:** Frontend
- **Files:** 3
- **LOC:** ~80
- **Tokens:** 3K
- **Blocked by:** TASK-110
- **Blocks:** None
- **Description:** Render Quebec fraud alerts in threats feed
- **Files affected:**
  ```
  frontend/src/components/ThreatsHandler.jsx (modify)
  frontend/src/components/QuebecFraudAlerts.jsx (modify)
  frontend/src/components/__tests__/ThreatsHandler.test.jsx
  ```
- **Success Criteria:**
  1. [ ] Quebec alerts display in main feed
  2. [ ] Alert cards show: source, scam type, risk level
  3. [ ] Sorting by date/severity
  4. [ ] Responsive on mobile

---

## Maintenance & Cleanup

### TASK-200: Update RAG_INDEX.md with new files
- **Domain:** Documentation
- **Files:** 1
- **LOC:** ~50
- **Tokens:** 2K
- **Blocked by:** None
- **Blocks:** None
- **Description:** Add new components/handlers to RAG_INDEX.md as features are added
- **Notes:** Do this quarterly or when new domains emerge

### TASK-201: Archive old OBSERVATIONS.md entries
- **Domain:** Memory system
- **Files:** 1
- **LOC:** ~20
- **Tokens:** 1K
- **Blocked by:** None
- **Blocks:** None
- **Description:** Move 4-week-old observations to archive, keep only current
- **Notes:** Monthly maintenance to keep memory system lean

---

## Template for New Tasks

When creating task, use this format:

```markdown
### TASK-NNN: [Clear Scope]
- **Domain:** [Frontend/Backend/Infrastructure/Testing]
- **Files:** [Count]
- **LOC:** [Estimate]
- **Tokens:** [Budget estimate]
- **Blocked by:** [TASK-XX or "None"]
- **Blocks:** [TASK-YY or "None"]
- **Description:** [One sentence what changes]
- **Files affected:**
  ```
  file1.py
  file2.jsx
  file3.test.jsx
  ```
- **Success Criteria:**
  1. [ ] [Testable condition]
  2. [ ] [Testable condition]
  3. [ ] [Testable condition]
- **Notes:** [Gotchas, assumptions, edge cases]
```

---

## Backlog Rules

1. **Order matters** — Top tasks have no dependencies
2. **Dependencies flow down** — TASK-104 depends on TASK-103, etc.
3. **No vague tasks** — Every task must have clear scope + success criteria
4. **Max 5 files per task** — Decompose if larger
5. **Token budget 2-8K** — Estimate required context

---

## Adding New Tasks

When adding to backlog:
1. Find appropriate phase/sprint
2. Check dependencies (Blocked by/Blocks)
3. Estimate LOC, Tokens, Files
4. Add success criteria (testable)
5. Insert in dependency order

When task is started:
1. Move to IN_PROGRESS.md
2. Add start date
3. Add estimated completion

When task is done:
1. Move to DONE.md
2. Add completion date + commit SHA
3. Note actual tokens used (vs estimate)
