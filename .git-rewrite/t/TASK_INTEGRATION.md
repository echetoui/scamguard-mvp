---
name: Task System Integration
description: How task decomposition works with caching, RAG, and memory
type: reference
---

# Task Decomposition + Caching + RAG Integration

Three systems work together to minimize context and enforce clear scope.

---

## System Interaction Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      SESSION START                           │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  CACHING LAYER      │  (4KB cached context)
        │  Load stable files  │
        │  CLAUDE.md, etc.    │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  MEMORY SYSTEM      │  (Apply ACTIVE_RULES)
        │  ACTIVE_RULES.md    │
        │  OBSERVATIONS.md    │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  READ TASK FILE     │  (From tasks/)
        │  ├─ Scope           │
        │  ├─ Files (2-5)     │
        │  ├─ Success criteria│
        │  └─ Notes           │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  RAG_INDEX LOOKUP   │  (Find files)
        │  Query keywords     │
        │  ├─ auth → files    │
        │  ├─ otp → files     │
        │  └─ ...             │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  LOAD 2-5 FILES     │  (3-8K tokens)
        │  ├─ Only relevant   │
        │  ├─ No entire repo  │
        │  └─ Execute task    │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  VERIFY SUCCESS     │  (All criteria met?)
        │  Criteria 1: [ ]    │
        │  Criteria 2: [ ]    │
        │  Criteria 3: [ ]    │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  COMPLETE TASK      │  (Move to DONE)
        │  ├─ Commit SHA      │
        │  ├─ Actual tokens   │
        │  ├─ Lessons learned │
        │  └─ Next task?      │
        └─────────────────────┘
```

---

## Example: TASK-102 Execution

**Task: Fix App.test.jsx React import issue**

### Step 1: Load Cached Context
```
Caching layer activates:
  ├─ Load CLAUDE.md (2K tokens, cached)
  ├─ Load MEMORY.md (300B, cached)
  ├─ Load ACTIVE_RULES.md (1.2K, cached)
  └─ Total: 1K tokens (replayed, not transmitted)

Memory system applies:
  ├─ Rule 1: "Direct feedback" → Honest review of code quality
  └─ Rule 2: "Read code first" → Read files before suggesting changes
```

### Step 2: Read Task File
```
tasks/BACKLOG.md → TASK-102

Extracted:
  • Scope: "Fix React is not defined in App.jsx"
  • Files: [App.jsx, App.test.jsx]
  • LOC: ~20
  • Tokens: 2K
  • Success criteria: 3 testable conditions
```

### Step 3: Consult RAG_INDEX.md
```
RAG lookup: "React import issue" → "App component"

Result:
  Domain: Frontend/Testing
  Files:
    - frontend/src/App.jsx
    - frontend/src/__tests__/App.test.jsx

Load these files (and ONLY these)
```

### Step 4: Load Files via RAG
```
Claude loads:
  ├─ App.jsx (~50 LOC)
  ├─ App.test.jsx (~100 LOC)
  └─ ERROR: "React is not defined"
  
Total: 150 LOC ÷ 4 = ~38 tokens (vs 40K+ if loading entire frontend)
```

### Step 5: Execute Task
```
Observation: import React is missing from App.jsx

Change:
  + import React from 'react';
    
Test: npm --prefix frontend run test:unit
Result: ✅ 54 App.test.jsx tests now passing
```

### Step 6: Verify Success Criteria
```
Success criteria (from task file):
  1. [✅] All 54 App.test.jsx tests pass
  2. [✅] React imported correctly in App.jsx
  3. [✅] No other component tests broken

All criteria met → Task complete
```

### Step 7: Complete Task
```
Move: tasks/BACKLOG.md → tasks/DONE.md

Record:
  • Completed: 2026-04-05
  • Commit: abc123def456
  • Token estimate: 2K → Actual: 1.8K ✓
  • LOC estimate: 20 → Actual: 15 ✓
  • Notes: Simple fix, tests passed immediately

Check BLOCKED.md:
  └─ TASK-103 (error boundary tests) was blocked by this
  └─ Move TASK-103 → BACKLOG.md (now unblocked)

Suggest next task:
  └─ "TASK-103 is now unblocked, ready to start"
```

---

## Token Budget Breakdown

### Without Task Decomposition
```
User: "Fix the failing tests"

Claude:
  1. Loads entire frontend (40+ components) → 25K tokens
  2. Loads entire backend (15+ handlers) → 15K tokens
  3. Searches codebase for failing tests → 5K tokens
  └─ Total: 45K tokens for context
  
Result: Confused scope, inefficient, wastes tokens
```

### With Task Decomposition + RAG
```
User: Start TASK-102

Claude:
  1. Read task file → scope clear (fix React import)
  2. Consult RAG_INDEX.md → get 2 files
  3. Load only: App.jsx, App.test.jsx → 1.8K tokens
  └─ Total: 2K tokens for context
  
Result: Clear scope, efficient, 22x token savings
```

---

## Dependency Chain Example

**User request:** "Implement complete SMS OTP flow"

### Bad approach (no decomposition)
```
One giant task:
  • Files: 20+ (frontend + backend + infrastructure)
  • Tokens: 50K+
  • Scope: Vague (what's complete?)
  • Success criteria: Unclear (works = done?)
  
Result: Context explosion, stuck in middle
```

### Good approach (with decomposition)
```
Chain of 7 tasks (ordered by dependency):

1. TASK-40: Create DynamoDB OTP table
   Files: scamguard_stack.py | Tokens: 2K

2. TASK-41: Phone number validation utility
   Files: auth_handler.py | Tokens: 1.5K
   Blocked by: TASK-40

3. TASK-42: Request SMS OTP handler
   Files: sms_otp_handler.py | Tokens: 3K
   Blocked by: TASK-40, TASK-41

4. TASK-43: Verify SMS OTP handler
   Files: sms_otp_handler.py | Tokens: 2.5K
   Blocked by: TASK-42

5. TASK-44: AuthCallback React component
   Files: AuthCallback.jsx | Tokens: 2.5K
   Blocked by: TASK-43

6. TASK-45: OTP tests (Vitest)
   Files: *.test.jsx | Tokens: 3K
   Blocked by: TASK-44

7. TASK-46: E2E tests (Playwright)
   Files: auth.e2e.js | Tokens: 2K
   Blocked by: TASK-45

Total: 7 × 2.5K avg = 17.5K tokens (vs 50K+ without decomposition)
```

**Execution flow:**
```
Session 1: TASK-40 (infrastructure)
Session 2: TASK-41, TASK-42 (backend handlers, parallel)
Session 3: TASK-43, TASK-44 (verify handler, frontend component)
Session 4: TASK-45, TASK-46 (tests, parallel)
```

Each session: 2-3K tokens used (for 1-2 tasks)
Total: 8 sessions × 3K avg = 24K tokens (realistic with overhead)

---

## Integration Checklist

When starting a task:

- [ ] Read task file from `tasks/BACKLOG.md`
  - [ ] Scope is clear (1 sentence)
  - [ ] Files are 2-5 max
  - [ ] Success criteria are testable
  
- [ ] Consult `RAG_INDEX.md`
  - [ ] Find relevant domain
  - [ ] Get exact file paths
  - [ ] Verify files match task description
  
- [ ] Load files via RAG (not blind)
  - [ ] Only load listed files
  - [ ] Check token estimate (2-8K)
  - [ ] Verify no context explosion
  
- [ ] Apply ACTIVE_RULES
  - [ ] Rule 1: Direct feedback (code quality)
  - [ ] Rule 2: Read code first (don't guess)
  
- [ ] Execute task
  - [ ] Make changes to meet success criteria
  - [ ] Test (vitest/pytest)
  - [ ] Verify all criteria met
  
- [ ] Complete task
  - [ ] Move to `tasks/DONE.md`
  - [ ] Record actual tokens (vs estimate)
  - [ ] Note estimation accuracy
  - [ ] Check for unblocked tasks
  - [ ] Propose next task from BACKLOG

---

## System Strengths

| System | Benefit | Task Integration |
|--------|---------|------------------|
| **Caching** | 90% savings on stable context | Cached before task loads |
| **RAG** | 80% savings on code retrieval | Task files list → RAG lookup → load files |
| **Memory** | Confirmed rules applied auto | ACTIVE_RULES guide task execution |
| **Task Decomp** | Clear scope, minimal context | 2-5 files per task, 2-8K tokens |

**Combined effect:** 95% token savings on common operations

---

## Metrics to Track

After each task completion:

```
TASK-NNN metrics:
  • Token estimate: 3K
  • Token actual: 2.8K ✓ (93% accurate)
  
  • LOC estimate: 80
  • LOC actual: 75 ✓ (94% accurate)
  
  • Time estimate: 1 hour
  • Time actual: 45 min (on track)
  
  • Success criteria: 3/3 met ✓
  
  • Quality: Code review passed ✓
```

Over 10 tasks, estimates improve to 95%+ accuracy.

---

## Scaling Strategy

| Codebase | Avg Tasks | Task Size | Token/Task | Scaling Notes |
|----------|-----------|-----------|-----------|--------------|
| 10K LOC | 5/feature | 2K LOC | 2.5K | Keywords enough |
| 50K LOC | 8/feature | 2K LOC | 2.5K | Still keyword-based |
| 100K LOC | 10/feature | 2K LOC | 2.5K | May add semantic search |
| 200K+ LOC | 15/feature | 2K LOC | 2.5K | Semantic embeddings |

**Key:** As codebase grows, we add MORE tasks, not bigger ones.

Task size stays constant (2-5 files, 2-8K tokens).

RAG_INDEX.md grows to match, but lookup time is still O(1) for keyword matching.

---

## When to Decompose Further

If task has:
- [ ] More than 5 files → Decompose
- [ ] "And" in description → Decompose
- [ ] Token budget > 10K → Decompose
- [ ] More than 3 dependencies → Reorder or decompose
- [ ] Unclear success criteria → Decompose into simpler tasks

---

## Example: Decomposition Decision Tree

**User: "Add user profile management"**

```
1. Count files affected: 8 (too many!)
2. Can this be split into frontend/backend? YES
3. Can backend be split by endpoint? YES
4. Can frontend be split by component? YES

Result:
├─ TASK-A: DynamoDB profile table (1 file)
├─ TASK-B: GET /profile endpoint (2 files)
├─ TASK-C: PUT /profile endpoint (2 files)
├─ TASK-D: Profile view component (2 files)
├─ TASK-E: Profile edit component (2 files)
├─ TASK-F: Component tests (2 files)
└─ TASK-G: E2E tests (2 files)

Each task: 2-3 files, 2.5K tokens avg
Total: 7 × 2.5K = 17.5K (vs 50K+ if done as 1 task)
```

---

## Summary

**Task decomposition + RAG + Caching = System that scales**

- ✅ Clear scope (task file)
- ✅ Minimal context (2-5 files via RAG)
- ✅ Efficient tokens (2-8K per task)
- ✅ Verifiable completion (success criteria)
- ✅ Explicit dependencies (clear ordering)
- ✅ Accurate estimation (track and improve)

This is professional software development discipline applied to Claude context management.
