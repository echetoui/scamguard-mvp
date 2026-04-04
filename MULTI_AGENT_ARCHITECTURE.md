---
name: Multi-Agent Architecture
description: Specialized agents, each seeing only their domain, coordinated by orchestrator
type: reference
---

# Multi-Agent Architecture

**Problem:** One agent seeing entire codebase = 50K+ token context per task.
**Solution:** 5 specialized agents, each seeing only relevant domain = 3-5K tokens per agent.

---

## System Overview

```
REQUEST (User or Task)
         ↓
┌─────────────────────────────────────────────┐
│         ORCHESTRATOR AGENT                  │
│  • Receives request                         │
│  • Decomposes into sub-tasks                │
│  • Routes to specialized agents             │
│  • Coordinates execution                    │
│  • Combines results                         │
└─────────┬───────────────────────────────────┘
          │
    ┌─────┴─────┬──────────┬──────────┬──────────┐
    ↓           ↓          ↓          ↓          ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ SEARCH │ │ANALYSIS│ │  CODE  │ │  TEST  │ │ REVIEW │
│ AGENT  │ │ AGENT  │ │ AGENT  │ │ AGENT  │ │ AGENT  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
   ↓          ↓          ↓          ↓          ↓
 Finds    Understands Implements  Validates  Ensures
 code     the issue    fix        solution   quality
   ↓          ↓          ↓          ↓          ↓
  2K        1.5K       3.5K       2K        1.5K
 tokens     tokens     tokens    tokens    tokens
────────────────────────────────────────────────────
                    TOTAL: 10K tokens
                    (vs 50K blind)
```

---

## Agent Hierarchy & Visibility

### Orchestrator Agent

**Role:** Decision-maker, coordinator, request router

**Sees:**
- Original request/task
- Agent specifications
- Task decomposition
- Communication logs

**Does NOT see:**
- Source code (agents retrieve as needed)
- Implementation details (agents handle)
- Test results (agents validate)

**Communication:** Routes to specialists, waits for results

**Token budget:** 1-2K

---

### Search Agent

**Role:** Find relevant code files using RAG

**Sees:**
- Request context
- RAG_INDEX.md (file mappings)
- File structure/paths only

**Does NOT see:**
- Actual code content (only paths)
- Implementation details
- Other domains

**Responsibility:**
1. Parse request keywords
2. Consult RAG_INDEX.md
3. Return: List of files + paths
4. Token budget: 2K

**Example:**
```
Request: "Fix OTP verification timeout"

Search Agent:
  Keywords: OTP, verify, timeout
  RAG lookup: Auth domain
  
Result:
  Files needed:
    - backend/lambda_/sms_otp_handler.py
    - backend/lambda_/verify_otp_handler.py
    - frontend/src/components/AuthCallback.jsx
    
  Token cost: 2K
```

---

### Analysis Agent

**Role:** Understand the problem, identify root cause

**Sees:**
- Request/task description
- Relevant code files (from Search Agent)
- DECISIONS.md (architectural context)
- GUARDRAILS.md (constraints)

**Does NOT see:**
- Unrelated domains
- Full codebase
- Test infrastructure (that's Test Agent)

**Responsibility:**
1. Read provided code
2. Identify issue/requirement
3. Check architectural constraints
4. Document assumptions

**Example:**
```
Analysis Agent receives:
  • Request: "Fix OTP timeout"
  • Files: sms_otp_handler.py, verify_otp_handler.py
  
Analysis:
  Current behavior: OTP expires after 10 minutes
  Issue: Some users report timeout at 8 minutes
  Root cause: Check TTL implementation
  Constraint: DECISIONS.md#2 requires 10-min expiry
  
Output: "TTL calculation error in DynamoDB query"

Token cost: 1.5K
```

---

### Code Agent

**Role:** Implement the fix/feature

**Sees:**
- Current code (from Search Agent)
- Issue analysis (from Analysis Agent)
- Specific files to modify
- GUARDRAILS.md (patterns to follow)

**Does NOT see:**
- Unrelated code
- Test files (Test Agent reviews)
- Entire project structure

**Responsibility:**
1. Receive code + analysis
2. Implement fix following guardrails
3. Ensure single responsibility
4. Return: Modified code + explanation

**Example:**
```
Code Agent receives:
  Analysis: "TTL calculation error"
  File: sms_otp_handler.py
  Current implementation
  
Implementation:
  - Fix TTL calculation
  - Follow logging standards (guardrail)
  - Single concern (OTP expiry only)
  
Output: Modified code + commit message

Token cost: 3.5K
```

---

### Test Agent

**Role:** Validate solution, ensure quality

**Sees:**
- Modified code (from Code Agent)
- Test files (test infrastructure)
- Success criteria (from task)
- GUARDRAILS.md (quality rules)

**Does NOT see:**
- Unmodified files
- Unrelated tests
- Implementation details (already done)

**Responsibility:**
1. Read modified code
2. Check guardrails compliance
3. Run relevant tests
4. Validate success criteria
5. Report results

**Example:**
```
Test Agent receives:
  Modified: sms_otp_handler.py
  Task criteria: Expiry is exactly 600 seconds
  
Tests:
  ✓ Unit test: TTL is 600s
  ✓ Integration test: DynamoDB TTL works
  ✓ Guardrail: Logging is structured
  ✓ No console.log (guardrail)
  
Result: All pass

Token cost: 2K
```

---

### Review Agent (Optional)

**Role:** Final code review, quality assurance

**Sees:**
- Original request
- Analysis summary
- Modified code
- Test results

**Does NOT see:**
- Full codebase
- Detailed implementations (already tested)

**Responsibility:**
1. Verify changes match request
2. Check for edge cases
3. Security review
4. Final approval

**Token budget:** 1.5K

---

## Token Budget Per Workflow

### Old Approach (Single Agent)
```
Claude sees everything:
  • Entire codebase (50K+ tokens)
  • All possible contexts
  • Everything unrelated to task
  
Result: Massive context, slow, expensive
```

### New Approach (Multi-Agent)
```
Orchestrator: Route request            1K
Search Agent: Find files               2K
Analysis Agent: Understand issue      1.5K
Code Agent: Implement fix             3.5K
Test Agent: Validate solution         2K
Review Agent: Final check             1.5K
────────────────────────────────
Total: ~11.5K tokens (vs 50K+ single agent)

Savings: 77-80% reduction in context
```

---

## Agent Communication Protocol

Agents communicate via structured messages:

### Message Format

```json
{
  "from": "agent_name",
  "to": "agent_name",
  "timestamp": "2026-04-05T10:30:00Z",
  "messageType": "request|response|status",
  "content": {
    "data": {...},
    "context": {...},
    "tokenBudget": 2500
  },
  "metadata": {
    "taskId": "TASK-102",
    "priority": "normal"
  }
}
```

### Example Flow

```
Orchestrator → Search:
  "Find files for: Fix OTP timeout"
  
Search → Orchestrator:
  "Files: [sms_otp_handler.py, verify_otp_handler.py, ...]"
  
Orchestrator → Analysis:
  "Analyze request + files"
  
Analysis → Orchestrator:
  "Root cause: TTL calculation error"
  
Orchestrator → Code:
  "Fix TTL in sms_otp_handler.py based on analysis"
  
Code → Orchestrator:
  "Modified code + changes summary"
  
Orchestrator → Test:
  "Validate modified code against success criteria"
  
Test → Orchestrator:
  "All tests pass ✓"
  
Orchestrator → User:
  "Task complete. Summary of changes."
```

---

## Agent Specialization Rules

### Each Agent Has:

1. **Domain Boundary** (what it can see)
   ```
   Code Agent:
     ✓ Can see: Files to modify, GUARDRAILS
     ✗ Cannot see: Unrelated code, test infrastructure
   ```

2. **Clear Input Contract** (what it receives)
   ```
   Code Agent input:
     - Current code (from Search)
     - Issue analysis (from Analysis)
     - Guardrails to follow
     - Task criteria
   ```

3. **Clear Output Contract** (what it produces)
   ```
   Code Agent output:
     - Modified code
     - Explanation of changes
     - Token usage
     - Any blockers/concerns
   ```

4. **Token Budget** (enforced)
   ```
   Code Agent: 3.5K max
   If exceeds: Return error, don't proceed
   ```

5. **Guardrails Applied** (prevents violations)
   ```
   Code Agent checks:
     ✓ No hardcoded secrets
     ✓ Structured logging only
     ✓ Tests required for exports
     ✓ Architecture patterns followed
   ```

---

## Agent Specialization Examples

### Search Agent Specialization

**Good request:**
```
"Find files related to SMS OTP handler"

Search Agent:
  1. Parse: "SMS", "OTP", "handler"
  2. Lookup RAG_INDEX → Auth domain
  3. Return: Exact file paths
  4. Done (2K tokens)
```

**Bad request (outside domain):**
```
"Understand why OTP verification fails"

Search Agent:
  ✗ Can't analyze (that's Analysis Agent job)
  → Respond: "I find files. For analysis, ask Analysis Agent."
  
Orchestrator routes to Analysis Agent instead
```

### Code Agent Specialization

**Good request:**
```
"Fix TTL in sms_otp_handler.py to 600s"
+ Current code provided
+ Issue analysis provided

Code Agent:
  1. Read code
  2. Identify TTL calculation
  3. Fix to 600s
  4. Apply guardrails
  5. Return: Modified code
  6. Done (3.5K tokens)
```

**Bad request (outside domain):**
```
"Write tests for the OTP handler"

Code Agent:
  ✗ Can't write tests (that's Test Agent job)
  → Respond: "I implement code. For tests, ask Test Agent."
  
Orchestrator routes to Test Agent
```

---

## Orchestrator Decision Logic

**When request comes in:**

```
1. Parse request
   ├─ Type: New feature? Bug fix? Refactor?
   ├─ Domain: Frontend? Backend? Infrastructure?
   └─ Complexity: Simple? Multi-step?

2. Decompose into agent tasks
   ├─ Search → Find relevant code
   ├─ Analysis → Understand issue
   ├─ Code → Implement fix
   ├─ Test → Validate
   └─ Review → Final approval

3. Execute sequentially or parallel
   ├─ Sequential: Simple fixes (A→B→C)
   ├─ Parallel: Independent tasks (A+B, then C)
   └─ Wait points: Output of one = input of next

4. Combine results
   ├─ Summary of changes
   ├─ Token usage per agent
   ├─ Any blockers/warnings
   └─ Confidence level

5. Deliver to user
   └─ "Task complete. X files modified, Y tests passed."
```

---

## Example: "Fix OTP Verification Timeout"

### Orchestrator Initial Analysis

```
Request: "Users report OTP timeout after 8 minutes, should be 10"

Decomposition:
  1. SEARCH: Find OTP-related files
  2. ANALYSIS: Identify timeout calculation
  3. CODE: Fix to 10 minutes
  4. TEST: Verify new timeout
  5. REVIEW: Check against DECISIONS.md#2

Execution: Sequential (each step depends on previous)
```

### Agent 1: Search Agent

```
Input: "Find OTP timeout related code"

Process:
  Keywords: OTP, timeout, TTL
  RAG lookup: Auth domain
  
Output:
  Files needed:
    - backend/lambda_/sms_otp_handler.py
    - backend/cdk/stacks/scamguard_stack.py (DynamoDB TTL config)
    - frontend/src/components/AuthCallback.jsx (UI timeout display)
  
Token: 2K
Status: ✓ Complete
```

### Agent 2: Analysis Agent

```
Input: Files + request context

Process:
  1. Read sms_otp_handler.py → Find OTP generation
  2. Read scamguard_stack.py → Find DynamoDB TTL
  3. Check: Where is timeout enforced?
  4. Analyze: 8-minute timeout despite 10-minute config
  
Output:
  Root cause: DynamoDB TTL calculated in milliseconds
  Current: 480000 (8 minutes) should be 600000 (10 minutes)
  Location: scamguard_stack.py, OTP table TTL attribute
  
Constraint: DECISIONS.md#2 specifies 10-minute requirement
  
Token: 1.5K
Status: ✓ Complete
```

### Agent 3: Code Agent

```
Input: Analysis results + code

Process:
  File: scamguard_stack.py
  Change: OTP table TTL = 600000ms (was 480000ms)
  
Check guardrails:
    ✓ No secrets exposed
    ✓ Pattern: Infrastructure code (CDK)
    ✓ Single concern (TTL only)
  
Output:
  Modified code:
    time_to_live_attribute="expiresAt",
    ttl_value=600000  # 10 minutes in milliseconds
  
  Explanation: 
    Changed OTP expiry from 8 to 10 minutes
    Calculation: 600,000ms = 600 seconds = 10 minutes
  
Token: 3.5K
Status: ✓ Complete
```

### Agent 4: Test Agent

```
Input: Modified code + success criteria

Process:
  Success criteria:
    [ ] OTP expires after exactly 600 seconds
    [ ] DynamoDB TTL attribute set correctly
    [ ] Frontend shows correct timeout message
  
  Tests run:
    ✓ Unit: TTL = 600000ms ✓
    ✓ Integration: DynamoDB creates items with correct expiry ✓
    ✓ E2E: User sees "10 minutes" timeout message ✓
  
Output:
  All success criteria met
  Test report: 3/3 passing
  
Token: 2K
Status: ✓ Complete
```

### Agent 5: Review Agent

```
Input: All changes + test results

Process:
  Review checklist:
    ✓ Changes match request (8→10 min) ✓
    ✓ Matches DECISIONS.md#2 (SMS OTP = 10 min) ✓
    ✓ No breaking changes ✓
    ✓ Tests all pass ✓
    ✓ No security issues ✓
  
Output:
  Final approval: APPROVED
  Confidence: 100%
  Recommendation: Merge

Token: 1.5K
Status: ✓ Complete
```

### Orchestrator Final Output

```
TASK COMPLETE ✅

Request: Fix OTP timeout (8→10 minutes)

Changes:
  • backend/cdk/stacks/scamguard_stack.py
    - OTP table TTL: 480000ms → 600000ms
    - Reason: Enforce DECISIONS.md#2 (10-minute requirement)

Tests:
  ✓ Unit: TTL verification (3/3 pass)
  ✓ Integration: DynamoDB expiry (2/2 pass)
  ✓ E2E: User experience (2/2 pass)

Review:
  ✓ Matches request
  ✓ Matches architecture decisions
  ✓ All guardrails satisfied
  ✓ APPROVED for merge

Token usage:
  Search: 2K
  Analysis: 1.5K
  Code: 3.5K
  Test: 2K
  Review: 1.5K
  ────────
  Total: 10K tokens (vs 50K+ blind approach)
  
Execution time: ~10 minutes (agents work sequentially)
```

---

## Advantages of Multi-Agent Architecture

| Aspect | Single Agent | Multi-Agent |
|--------|------|------------|
| **Context** | 50K+ tokens | 3-5K per agent |
| **Specialization** | Generalist | Deep experts |
| **Speed** | Slow (processes everything) | Fast (focused) |
| **Quality** | Variable | Consistent (domain experts) |
| **Error rate** | Higher (context confusion) | Lower (narrow scope) |
| **Scaling** | Difficult (more code = more context) | Easy (add agents per domain) |
| **Testability** | Hard (interdependencies) | Easy (clear contracts) |
| **Maintainability** | Low (monolithic) | High (modular) |

---

## Integration with Existing Systems

### With Task System
```
Task specifies: "Files: [file1, file2, file3]"

Search Agent:
  Validates search results match task specification
  Returns only files listed in task

Code Agent:
  Modifies only files in task list
  Respects task success criteria
```

### With Guardrails
```
Code Agent checks:
  ✓ Guardrails before implementing
  ✓ Prevents violations upfront
  ✓ Returns error if violation detected

Test Agent checks:
  ✓ Guardrails compliance in tests
  ✓ Code quality standards enforced
```

### With RAG_INDEX
```
Search Agent uses:
  RAG_INDEX.md → Domain mappings
  Returns: File paths only (not content)
  
Analysis Agent uses:
  RAG_INDEX.md → Architecture patterns
  Understands: How domains are organized
```

### With Memory System
```
Each agent aware of:
  ACTIVE_RULES: Applied to agent behavior
  DECISIONS.md: Architectural constraints
  OBSERVATIONS.md: Project patterns

All agents respect:
  DECISIONS.md (immutable decisions)
  GUARDRAILS.md (safety barriers)
  ACTIVE_RULES (learned patterns)
```

---

## Scalability

### Current (ScamGuard MVP)
```
Agents: 5 (Search, Analysis, Code, Test, Review)
Domains: 5 (Frontend, Backend, Infrastructure, Database, Testing)
Coverage: ~100%
```

### Future (Scaling)
```
Possible additions:
  • Documentation Agent (writes docs)
  • Performance Agent (optimizes code)
  • Security Agent (audits code)
  • DevOps Agent (infrastructure)
  • Analytics Agent (metrics)

Each new domain → New agent
Total context stays constant (agents don't see other domains)
```

---

## Summary

**Single Agent vs Multi-Agent**

| Single | Multi |
|--------|-------|
| Monolithic | Modular |
| 50K tokens | 3-5K per agent |
| Generalist | Specialists |
| Error-prone | Reliable |
| Doesn't scale | Scales linearly |

**Multi-agent is professional software architecture applied to Claude.**

Each specialist knows their domain deeply, communicates clearly, delivers fast.

No agent sees unnecessary information. No token waste on irrelevant context.
