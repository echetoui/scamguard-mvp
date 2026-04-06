# Task Management System

Constraint-based task decomposition: **Clear scope → Minimal context → Verifiable completion**

---

## Files

| File | Purpose |
|------|---------|
| `TASK_DECOMPOSITION.md` | System design, principles, examples, anti-patterns |
| `BACKLOG.md` | Unstarted tasks (ordered by dependency) |
| `IN_PROGRESS.md` | Current work (start here each session) |
| `DONE.md` | Completed tasks + estimation accuracy |
| `BLOCKED.md` | Tasks waiting on dependencies |
| `README.md` | This file |

---

## Quick Workflow

### 1. Start Session

```
Read: IN_PROGRESS.md
  ├─ If tasks listed → Resume work
  └─ If empty → Pick top task from BACKLOG.md

Move task: BACKLOG.md → IN_PROGRESS.md
  ├─ Add start date
  ├─ Add "🚀" emoji
  └─ Update progress as you work
```

### 2. Work on Task

```
Task template tells you:
  ├─ **Scope:** What changes (1 sentence)
  ├─ **Files:** Exactly 2-5 files affected
  ├─ **Tokens:** Context budget (2-8K typically)
  ├─ **Success criteria:** Testable conditions
  └─ **Notes:** Gotchas, edge cases

Your approach:
  ├─ Consult RAG_INDEX.md → Load only listed files
  ├─ Make changes to complete success criteria
  ├─ Test (vitest for frontend, pytest for backend)
  └─ Verify all criteria met
```

### 3. Complete Task

```
Move task: IN_PROGRESS.md → DONE.md
  ├─ Add completion date
  ├─ Add commit SHA
  ├─ Record actual tokens used (vs estimate)
  ├─ Record actual LOC changed (vs estimate)
  └─ Add notes (what went well, what surprised you)

Check blockers:
  └─ If BLOCKED.md lists tasks waiting on this → Move them back to BACKLOG
```

### 4. Pick Next Task

```
Read: BACKLOG.md (top item)
  ├─ Verify no dependencies (Blocked by: None)
  └─ If blocked → Choose next unblocked task

Repeat from step 1
```

---

## Key Constraints

### Rule 1: Only 2-5 files per task
**Why:** Smaller context = faster execution = fewer tokens

If task requires > 5 files → **Decompose further**

### Rule 2: One concern per task
**Why:** Single responsibility makes testing/verification clear

If task has "and" → **Break into separate tasks**

Example:
- ❌ "Add OTP handler AND retry logic AND tests"
- ✅ Three tasks: Add handler, Add retry, Add tests

### Rule 3: Token budget < 10K (target 3-8K)
**Why:** Fits in RAG context window, leaves room for response

Estimate: `files × avg_LOC ÷ 4 = tokens`

If > 10K → **Decompose**

### Rule 4: Clear success criteria
**Why:** Verification is testable, not subjective

Bad: "Make it work"
Good: "All 3 handler tests pass, endpoint returns 200"

### Rule 5: Minimal dependencies
**Why:** Parallel execution, clear order

If task depends on > 2 others → **Reorder or parallelize**

---

## Examples

### ✅ GOOD Task (TASK-102)

```markdown
### TASK-102: Fix App.test.jsx React import issue
- **Files:** 2 (App.jsx, App.test.jsx)
- **LOC:** ~20
- **Tokens:** 2K ✓
- **Success Criteria:**
  1. [ ] All 54 tests pass
  2. [ ] React imported correctly
  3. [ ] No other breakage
```

**Why good:**
- Scope is clear (one import issue)
- Touches only 2 files (minimal context)
- Testable (tests pass = done)
- Low token budget (2K)

### ❌ BAD Task

```markdown
### TASK-X: Implement authentication
- **Files:** (Unknown, could be 50+)
- **Scope:** Users can sign up and login
- **Success Criteria:** "It works"
```

**Why bad:**
- Vague scope (could be 10 tasks)
- Unknown files (context explosion)
- Untestable criteria ("it works" = subjective)
- Would require 40K+ tokens

---

## Integration with RAG

**When you start a task:**

1. Read task file → List of 2-5 files
2. Look up in RAG_INDEX.md → Get file paths + domain
3. Load only those files
4. Use context efficiently (tokens ∝ files affected)

Example:
```
TASK-102: Fix App.test.jsx

Files listed: App.jsx, App.test.jsx

RAG_INDEX lookup:
  → "App" in Frontend → Load these files

Result: ~2K tokens (vs 40K if loading entire frontend)
```

---

## Estimation Accuracy

Track over time to improve estimates:

| After Tasks | Token Accuracy | LOC Accuracy |
|-----------|-----------------|-------------|
| 3 tasks | 96% | 93% |
| 10 tasks | 98% | 95% |
| 20 tasks | 99% | 97% |

As you get more data, estimates become tighter.

---

## Commands (When Ready)

Future: Could automate with CLI:

```bash
# Start a task
task start TASK-102
  ├─ Moves to IN_PROGRESS
  ├─ Loads files listed in task
  └─ Opens RAG_INDEX for context

# Complete a task
task complete TASK-102 --commit abc123
  ├─ Moves to DONE
  ├─ Records metrics
  └─ Checks for newly unblocked tasks

# List tasks
task list --status backlog
task list --blocked
task list --in-progress
```

For now: Manual file management (fine for 5-20 tasks).

---

## Anti-Patterns to Avoid

| Don't | Do |
|------|-----|
| "Add feature X" (vague) | "Add OTP request handler" (specific) |
| 10+ files per task | 2-5 files max |
| Compound ("and") tasks | Separate tasks with clear order |
| Token budget > 15K | Target 3-8K |
| No success criteria | Testable, measurable criteria |
| "Improve performance" | "Reduce OTP latency to < 100ms" |
| Circular dependencies | Linear dependency order |

---

## Tips

1. **Decompose upfront** — Vague request → Decompose to 5-7 tasks BEFORE starting
2. **Order by dependency** — Top of BACKLOG should have no blockers
3. **Estimate conservatively** — 10% buffer on token budget
4. **Track actuals** — Every completed task → Record real tokens, LOC, time
5. **Reuse estimates** — Similar tasks should have similar budgets

---

## See Also

- `TASK_DECOMPOSITION.md` — Full system design
- `RAG_INDEX.md` — Find files for each task
- `MEMORY.md` → `DECISIONS.md` — Decisions affecting task scope
- `CONTEXT_MANAGEMENT.md` — How context optimization works
