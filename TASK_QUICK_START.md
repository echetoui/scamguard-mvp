---
name: Task System Quick Start
description: How to use the task decomposition system (5-minute guide)
type: reference
---

# Task System Quick Start

**TL;DR:** Break vague requests into 2-5 file tasks, execute with RAG, track completion.

---

## Three Files You Need

| File | Check When |
|------|-----------|
| `tasks/BACKLOG.md` | Starting work (pick top task) |
| `tasks/IN_PROGRESS.md` | Resuming session (any active work?) |
| `tasks/DONE.md` | After completing task (record metrics) |

---

## Workflow (5 Steps)

### Step 1: Check In Progress
```
Open: tasks/IN_PROGRESS.md

If empty:
  → Proceed to step 2

If tasks listed:
  → Resume that task (update progress)
```

### Step 2: Pick Next Task
```
Open: tasks/BACKLOG.md

Pick top task that says:
  Blocked by: None

Move to IN_PROGRESS:
  ### TASK-NNN: [Scope] 🚀
  - Started: [Today's date]
  - Progress: 0%
```

### Step 3: Load Task Files
```
Task file tells you:
  Files: [list of 2-5 files]

Consult RAG_INDEX.md:
  → Find those files
  → Load only those files (not entire codebase)

Expected context: 2-8K tokens (not 40K+)
```

### Step 4: Execute Task
```
Task success criteria:
  1. [ ] [Testable condition]
  2. [ ] [Testable condition]
  3. [ ] [Testable condition]

Make changes to meet all criteria.
Test (npm test or pytest).
Verify all criteria met.
```

### Step 5: Complete Task
```
Move task: IN_PROGRESS → DONE

Record:
  • Completion date
  • Commit SHA
  • Actual tokens used (vs estimate)
  • Any notes

Check BLOCKED.md:
  → Are any tasks now unblocked?
  → Move them to BACKLOG

Propose next task:
  "TASK-NNN is next (top of BACKLOG)"
```

---

## Task Template (What You'll See)

```markdown
### TASK-102: Fix App.test.jsx React import issue
- **Domain:** Frontend/Testing
- **Files:** 2 (App.jsx, App.test.jsx)
- **LOC:** ~20
- **Tokens:** 2K
- **Blocked by:** None
- **Blocks:** TASK-103
- **Description:** Fix "React is not defined" error
- **Files affected:**
  ```
  frontend/src/App.jsx
  frontend/src/__tests__/App.test.jsx
  ```
- **Success Criteria:**
  1. [ ] All 54 tests pass
  2. [ ] React imported correctly
  3. [ ] No other breakage
- **Notes:** Simple import fix, should take < 1 hour
```

---

## Key Rules

| Rule | Example |
|------|---------|
| **Max 5 files** | If > 5 → Task is too big, decompose |
| **Clear scope** | "Add OTP handler" ✅ not "Improve auth" ❌ |
| **Testable criteria** | "Tests pass" ✅ not "It works" ❌ |
| **Token budget** | Target 3-8K (max 10K) |
| **Single concern** | One reason to change |
| **No "and"** | "Add handler, retry, tests" = 3 tasks |

---

## When Task Is Too Big

**Example:** "Implement authentication"

**Symptoms:**
- > 5 files affected
- Token estimate > 10K
- Multiple success criteria that seem unrelated
- You say "and" when describing scope

**Solution:** Break into smaller tasks

```
WRONG: 1 task "Implement auth" (50K tokens)

RIGHT: 7 tasks
  1. DynamoDB table
  2. Phone validation
  3. Request OTP handler
  4. Verify OTP handler
  5. Frontend login component
  6. Tests
  7. E2E tests
```

---

## Integration with RAG_INDEX.md

**When you have task:** "TASK-102: Fix App.test.jsx"

**You do:**
1. Task says: Files = [App.jsx, App.test.jsx]
2. Open RAG_INDEX.md
3. Search: "React", "App", "Frontend"
4. Find: "Files affected: frontend/src/App.jsx, frontend/src/__tests__/App.test.jsx"
5. Load those files (and only those)
6. Context = 2K tokens (vs 40K blind load)

---

## Token Budget Explanation

```
Rough formula: Files × 200 LOC avg ÷ 4 = tokens

Example:
  2 files × 200 LOC = 400 LOC
  400 ÷ 4 = 100 tokens

But task is 2K?
  → Yes, because RAG context + metadata adds ~1.9K
  → Total: ~2K tokens
```

If estimate > 10K → Task is too big

---

## Session Template

```
SESSION START:
  1. Check IN_PROGRESS.md (any active work?)
  2. Check BACKLOG.md (pick top unblocked task)
  3. Move to IN_PROGRESS
  4. Read task file (scope, files, criteria)
  5. Consult RAG_INDEX.md (find files)
  6. Load files (2-5 only)
  7. Execute task (meet all criteria)

TASK COMPLETE:
  1. Verify all success criteria met
  2. Move to DONE.md
  3. Record actual tokens used
  4. Check for unblocked tasks
  5. Propose next task
  
SESSION END:
  1. Update OBSERVATIONS.md if new patterns
  2. Commit all changes
  3. Note any blockers for next session
```

---

## Examples: Good vs Bad Tasks

### ✅ GOOD Task
```
### TASK-42: Add SMS OTP request handler
- Files: 2 (sms_otp_handler.py, auth_handler.py)
- Tokens: 3K
- Success Criteria:
  1. [ ] POST /api/v1/auth/request-sms-otp works
  2. [ ] OTP stored in DynamoDB
  3. [ ] Tests pass
```

Why: Clear scope, small files, testable

### ❌ BAD Task
```
### TASK-X: Implement authentication system
- Files: (unknown)
- Scope: Users can sign up and login
- Success Criteria: It works
```

Why: Vague, unknown files, untestable

---

## Metrics

After completing each task, record:

```
Estimate vs Actual:
  Tokens: 3K estimate → 2.8K actual ✓
  LOC: 80 estimate → 75 actual ✓
  Time: 1 hour estimate → 45 min ✓

Quality:
  Success criteria: 3/3 met ✓
  Tests: All passed ✓
  Code review: Approved ✓
```

After 10 tasks, you'll have accurate estimates.

---

## Command Reference (Manual)

When starting task:
```
1. Open tasks/BACKLOG.md
2. Find task (top item, Blocked by: None)
3. Copy task block
4. Open tasks/IN_PROGRESS.md
5. Paste, add date, add 🚀
6. Read task file for scope + files
7. Start work
```

When completing task:
```
1. Verify all success criteria [ ] → [✅]
2. Commit code: git commit -m "Implement TASK-NNN: [scope]"
3. Copy completed task block
4. Remove from IN_PROGRESS.md
5. Open tasks/DONE.md
6. Paste, add completion date, add commit SHA
7. Record actual tokens + LOC
```

---

## Files Structure

```
scamguard-mvp/tasks/
├─ README.md                    ← Overview
├─ BACKLOG.md                   ← Unstarted tasks (ordered)
├─ IN_PROGRESS.md               ← Current work
├─ DONE.md                      ← Completed + metrics
└─ BLOCKED.md                   ← Waiting on dependencies

scamguard-mvp/
├─ TASK_DECOMPOSITION.md        ← System design (detailed)
├─ TASK_INTEGRATION.md          ← How it works with RAG/caching
└─ TASK_QUICK_START.md          ← This file
```

---

## First Task: TASK-101

From BACKLOG.md:

```
### TASK-101: Clean up TASK_*.md files
- Domain: Repository maintenance
- Files: (deletion only)
- Tokens: 1K
- Blocked by: None

Files to delete:
  TASK_1_1_EXECUTION.md
  TASK_1_AUTH_TESTING_REPORT.md
  ... (all TASK_*.md files)
  
Success Criteria:
  1. [ ] All TASK_*.md files deleted from git
  2. [ ] No broken references in docs
  3. [ ] Clean repo status
```

This is a good first task (simple, clear, verifiable).

---

## When You Get Lost

Read this file again (it's only 3KB, 5 minutes):
- Steps 1-5 show exact workflow
- Rules show constraints
- Examples show good vs bad
- Use as checklist

If still unclear:
→ Read `TASK_DECOMPOSITION.md` (detailed system)
→ Read `TASK_INTEGRATION.md` (how RAG + caching work)

---

## Remember

**Before:** "Add feature X" = 1 vague task = 50K tokens, stuck
**After:** "Add feature X" = 7 clear tasks = 3K tokens each, fast

Task system is not optional. It's how we keep context small even as codebase grows.

---

**Start with top task in BACKLOG.md. Follow 5-step workflow. Success.**
