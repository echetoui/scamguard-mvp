---
name: Task Decomposition System
description: Break vague requests into constrained, atomic tasks with minimal context
type: reference
---

# Task Decomposition System

**Problem:** "Add user authentication" loads 50K tokens, confuses scope. 
**Solution:** Force decomposition → "Request SMS OTP" (500 LOC, 2 files, 5K tokens).

---

## Core Principles

### 1. **Simple** (2-5 files maximum)
- Task touches only files needed for completion
- If > 5 files, task is too broad → decompose further
- Fewer files = less context = faster execution

### 2. **Local** (Single responsibility)
- One reason to change (SOLID principle)
- No hidden dependencies on other tasks
- Can be completed in isolation

### 3. **Addressable** (Verifiable completion)
- Task has clear "done" definition
- Not "improve auth" (vague)
- But "Add SMS OTP request handler" (testable)

### 4. **Minimal Context** (Only what's needed)
- List exact files required to complete task
- Don't load entire feature domain
- RAG_INDEX.md provides file locations

---

## Task Template

```markdown
# TASK-[NUMBER]: [Clear Scope]

## Context
- **Domain:** [Frontend/Backend/Infrastructure/Testing]
- **Files affected:** [List exactly 2-5 files]
- **LOC estimate:** [Rough lines to change]
- **Token budget:** [Estimated context needed]

## Scope
**Single concern:** [One sentence describing what changes]

Example GOOD: "Add SMS OTP request handler to Lambda"
Example BAD: "Implement authentication system"

## Success Criteria
1. [ ] [Specific, verifiable condition]
2. [ ] [Specific, verifiable condition]
3. [ ] [Specific, verifiable condition]

## Files Required
```
frontend/src/components/AuthCallback.jsx
backend/lambda_/sms_otp_handler.py
frontend/src/components/__tests__/AuthCallback.test.jsx
```

## Related Tasks
- Blocks: [Other tasks waiting on this]
- Blocked by: [Tasks that must complete first]
- Refs: [Related decision/architectural decision]

## Notes
- [Assumptions, gotchas, edge cases]
- [Links to relevant code sections]
- [Known issues/dependencies]
```

---

## Decomposition Rules

### Rule 1: One File Change = One Task (Usually)
If modifying component + its test + its styles + RAG_INDEX.md = 4 files → still one task (related changes)

But: If modifying component + separate API handler + separate agent = 3 separate tasks (different domains)

**Test:** Can someone complete this task without touching files you didn't list? 
- If yes → Good scope
- If no → Task is too vague, needs decomposition

### Rule 2: No "Everything Else" Tasks
**BAD:** "Fix remaining bugs" (vague, could touch anything)
**GOOD:** "Fix OTP verification timeout in sms_otp_handler.py" (specific)

**BAD:** "Clean up code" (too broad)
**GOOD:** "Remove dead imports from auth_handler.py" (specific file, specific action)

### Rule 3: If Task Has "And" = Decompose
**BAD:** "Add SMS OTP handler AND implement retry logic AND add tests" (3 tasks)
**GOOD:** Three separate tasks:
1. "Add SMS OTP handler (basic)"
2. "Implement retry logic in SMS OTP handler"
3. "Add tests for SMS OTP handler"

### Rule 4: Token Budget Check
Estimate tokens needed:
```
Files × avg LOC per file ÷ 4 = rough token estimate
(Python/JS: ~4 LOC per token)

Example:
3 files × 200 LOC avg = 600 LOC ÷ 4 = 150 tokens

If > 10,000 tokens: Task is too broad, decompose
If < 1,000 tokens: Task might be too small, consider combining
Target: 2,000-8,000 tokens per task
```

### Rule 5: Dependency Order
- Task A blocks Task B (B can't start until A done)
- Use this to create linearization
- Avoid circular dependencies

### Rule 6: Cross-Cutting Concerns (Architectural)
Some tasks ARE transversal (affect multiple domains):
- **Authentication system** (touches Frontend + Backend + Infrastructure)
- **Logging/Tracing** (touches everywhere)

For these:
1. Decompose by layer (Frontend auth + Backend auth + Infrastructure)
2. OR decompose by flow (OTP request → OTP verify → Session management)
3. List dependencies explicitly

---

## Examples

### ✅ GOOD Task

```markdown
# TASK-42: Request SMS OTP Handler

## Context
- **Domain:** Backend/Auth
- **Files affected:** sms_otp_handler.py, dynamodb_client.py (shared)
- **LOC estimate:** 80 new lines
- **Token budget:** 3K

## Scope
**Single concern:** Generate and store OTP, return to client

Not included: Verification, retry logic, rate limiting (separate tasks)

## Success Criteria
1. [ ] Lambda handler at POST /api/v1/auth/request-sms-otp
2. [ ] Validates Canadian phone number format
3. [ ] Generates 4-digit OTP code
4. [ ] Stores in DynamoDB with 10-minute TTL
5. [ ] Returns { otp_id, expires_at } to client
6. [ ] Logs request (not OTP value) for audit

## Files Required
backend/lambda_/sms_otp_handler.py (new file)
backend/lambda_/auth_handler.py (import OTP handler)
backend/cdk/stacks/scamguard_stack.py (add OTP table reference)

## Related Tasks
- Blocks: TASK-43 (Verify SMS OTP)
- Blocked by: TASK-40 (DynamoDB OTP table)
- Refs: DECISIONS.md#2 (SMS OTP strategy)

## Notes
- Phone validation: Canadian format (10+ digits)
- OTP must be numeric only (4 digits)
- TTL: 10 minutes (config in handler)
- No SMS sending in this task (Pinpoint integration separate)
```

### ❌ BAD Task

```markdown
# TASK-X: Implement Authentication

## Scope
Add user authentication system

## Files affected
(Not listed, too many)

## Success Criteria
- Users can sign up
- Users can login
- Passwords are secure
- Tokens are managed

(All vague, untestable)
```

**Problems:**
- "Implement Authentication" is 10 tasks minimum
- "Users can sign up" = multiple components (form, validation, API, storage)
- Files affected unknown (could be 50+)
- Would require 50K+ tokens to even understand scope

---

## Task Dependency Graph

```
┌─────────────────────────────────────────────────────┐
│  TASK-40: Create DynamoDB OTP Table                 │
│  (Infrastructure, 1 file)                           │
└────────────────────┬────────────────────────────────┘
                     │ Blocks
                     ▼
┌─────────────────────────────────────────────────────┐
│  TASK-41: Validate phone number utility             │
│  (Backend, 1 file)                                  │
└────────────────────┬────────────────────────────────┘
                     │ Blocks
                     ▼
┌─────────────────────────────────────────────────────┐
│  TASK-42: SMS OTP Request Handler                   │
│  (Backend, 2-3 files, 3K tokens)                    │
└────────────────────┬────────────────────────────────┘
                     │ Blocks
                     ▼
┌─────────────────────────────────────────────────────┐
│  TASK-43: SMS OTP Verify Handler                    │
│  (Backend, 2-3 files, 3K tokens)                    │
└────────────────────┬────────────────────────────────┘
                     │ Blocks
                     ▼
┌─────────────────────────────────────────────────────┐
│  TASK-44: AuthCallback React Component              │
│  (Frontend, 2 files, 2K tokens)                     │
└────────────────────┬────────────────────────────────┘
                     │ Blocks
                     ▼
┌─────────────────────────────────────────────────────┐
│  TASK-45: Auth tests (Vitest + Playwright)          │
│  (Testing, 2 files, 2K tokens)                      │
└─────────────────────────────────────────────────────┘
```

**Total:** ~15K tokens if done sequentially
**Without decomposition:** "Implement Auth" = 50K+ tokens in one go

---

## Storage & Tracking

### File Structure
```
scamguard-mvp/tasks/
├─ BACKLOG.md              ← All unstarted tasks
├─ IN_PROGRESS.md          ← Current work
├─ DONE.md                 ← Completed tasks
└─ BLOCKED.md              ← Waiting on dependencies

Each task is 1 entry in appropriate file
```

### Backlog Entry Format
```markdown
### TASK-NN: [Scope]
- **Domain:** [Frontend/Backend/Infrastructure/Testing]
- **Files:** [2-5 files]
- **LOC:** [rough estimate]
- **Tokens:** [context needed]
- **Blocked by:** TASK-XX, TASK-YY (if any)
- **Blocks:** TASK-ZZ (if any)
- **Description:** One-liner scope
```

### In-Progress Entry
```markdown
### TASK-NN: [Scope] 🚀
- **Started:** 2026-04-04
- **Assigned to:** Claude
- **Progress:** 40% (2 of 5 success criteria met)
- **ETA:** Today
```

### Done Entry
```markdown
### TASK-NN: [Scope] ✅
- **Completed:** 2026-04-04
- **Commit:** abc123def
- **Token actual:** 4.2K (vs 3K estimate)
- **Notes:** Retry logic took longer than expected
```

---

## Decomposition Workflow

### When you get vague request:

**User:** "Implement user profile management"

**Step 1: Identify domains**
- Frontend (profile UI, form)
- Backend (API endpoints, database)
- Infrastructure (DynamoDB table)
- Testing (unit + E2E tests)

**Step 2: Decompose by flow**
```
1. Backend: Create DynamoDB user_profile table
2. Backend: Add GET /profile endpoint
3. Backend: Add PUT /profile endpoint
4. Frontend: Build ProfileView component
5. Frontend: Build ProfileEdit component
6. Testing: Unit tests for components
7. Testing: E2E tests for flows
```

**Step 3: Check dependencies**
```
Flow:
  Step 1 → Step 2 → Step 4 → Step 6
          → Step 3 → Step 5 → Step 7
```

**Step 4: Create task file**
```
TASK-50: Create DynamoDB user_profile table
  - Files: scamguard_stack.py (add table)
  - Tokens: 2K
  - Blocks: TASK-51, TASK-52

TASK-51: Add GET /profile endpoint
  - Files: profile_handler.py (new), scamguard_stack.py (route)
  - Tokens: 3K
  - Blocked by: TASK-50
  - Blocks: TASK-54

... etc
```

**Step 5: Order in BACKLOG.md**
- Put TASK-50 first (no dependencies)
- Put TASK-51 after (depends on TASK-50)
- Put UI tasks after backend (frontend typically depends on API)

---

## Quality Checklist

For each task, verify:

- [ ] **Scope is clear** (could explain in 1 sentence)
- [ ] **Only 2-5 files** (if more, decompose)
- [ ] **One concern** (one reason to change)
- [ ] **Verifiable** (success criteria are testable)
- [ ] **Minimal context** (token budget < 10K)
- [ ] **No "and"** (decompose compound tasks)
- [ ] **Dependencies listed** (blocks/blocked_by)
- [ ] **Estimated tokens** (5K target)
- [ ] **LOC estimate provided** (helps scope)

---

## Anti-Patterns

| Anti-Pattern | Example | Fix |
|--------------|---------|-----|
| **Too vague** | "Improve authentication" | "Add rate limiting to login attempts" |
| **Too many files** | "Refactor entire auth system" | Break into TASK-A, TASK-B, TASK-C |
| **Compound ("and")** | "Add OTP handler AND retry AND tests" | Make 3 separate tasks |
| **No success criteria** | "Make it work" | Define exact acceptance tests |
| **Missing dependencies** | "Frontend auth" (ignores API dependency) | Add "Blocked by: TASK-42" |
| **Untestable scope** | "Improve performance" | "Reduce OTP verification latency to <100ms" |
| **Cross-cutting mess** | "Add logging everywhere" | "Add logging to sms_otp_handler.py" |

---

## Integration with RAG

**When starting task:**
1. **Read task file** → Files affected
2. **Cross-ref RAG_INDEX.md** → Get file locations
3. **Load only those files** → Minimal context
4. **Complete task** → Commit with TASK-NN reference

**Example:**
```
TASK-42: SMS OTP Request Handler

Files: sms_otp_handler.py, auth_handler.py, scamguard_stack.py

Claude:
1. Look up in RAG_INDEX.md → "OTP" → Authentication queries
2. Load: sms_otp_handler.py, auth_handler.py, API_DESIGN.md
3. Reference: scamguard_stack.py (for route setup)
4. Token budget: 3K (vs blind 40K load)
```

---

## Metrics & Monitoring

Track per task:
- **Estimated tokens** vs **Actual tokens** (tune estimates)
- **Estimated LOC** vs **Actual LOC** (improve accuracy)
- **Success criteria met** (audit quality)
- **Time to completion** (capacity planning)

Example after 10 tasks:
```
Estimate accuracy:
  Token budget: 85% accurate (avg error: ±15%)
  LOC estimate: 90% accurate (avg error: ±10%)
  
Success criteria:
  100% completed (zero partial tasks)
  
Time tracking:
  Avg 2-3 hours per task
  Fastest: 45 min (simple fix)
  Slowest: 6 hours (integration complexity)
```

Use this to improve future estimates.

---

## How Claude Uses This

### At Session Start
```
User: "I need to add user profile management"

Claude:
1. Don't start coding
2. Decompose → 7 tasks
3. Propose task breakdown
4. User approves/adjusts
5. Create TASK-50 through TASK-56
```

### During Task Execution
```
User asks for TASK-NN

Claude:
1. Read TASK-NN file → scope, files, success criteria
2. Consult RAG_INDEX.md → load relevant files only
3. Execute within constraints (2-5 files, 3-8K tokens)
4. Verify all success criteria met
5. Commit with TASK-NN reference
```

### After Task Completion
```
Claude:
1. Update task file (completed, commit SHA)
2. Move from IN_PROGRESS.md → DONE.md
3. Check if next tasks are unblocked
4. Propose next task
```

---

## Scaling with Codebase Growth

| Codebase Size | Avg Tasks/Feature | Avg Task Size | Total Time |
|---------------|------------------|---------------|-----------|
| 10K LOC | 5 tasks | 2K tokens | 10 hours |
| 50K LOC | 8 tasks | 2K tokens | 16 hours |
| 100K LOC | 10 tasks | 2K tokens | 20 hours |

**Key:** As codebase grows, we add MORE tasks, not bigger ones. Task size stays constant (2-5 files, 2-8K tokens).

---

## Summary

**Before:** "Implement auth" = 1 vague task = 50K tokens, context explosion
**After:** "Implement auth" = 7 constrained tasks = 5K tokens each, clear scope

**Result:**
- ✅ Each task is testable
- ✅ Each task is independent
- ✅ Each task has minimal context (RAG efficiency)
- ✅ Dependencies are explicit (no surprises)
- ✅ Quality is measurable (success criteria)
