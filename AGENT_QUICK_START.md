---
name: Multi-Agent Quick Start
description: How the multi-agent system works in practice (5-minute guide)
type: reference
---

# Multi-Agent System Quick Start

**TL;DR:** Request comes in → Orchestrator routes to 5 specialized agents → Each sees only their domain → Results combined.

---

## The 5 Agents

| Agent | Role | Sees | Tokens |
|-------|------|------|--------|
| **Search** | Find code files | RAG_INDEX.md, paths | 2K |
| **Analysis** | Understand problem | Code + DECISIONS.md | 1.5K |
| **Code** | Implement fix | Current code + guardrails | 3.5K |
| **Test** | Validate solution | Modified code + criteria | 2K |
| **Review** | Final approval | All results | 1.5K |

**Total:** 11.5K tokens (vs 50K blind approach = 77% savings)

---

## How It Works: User Request → Delivery

```
User: "Fix OTP timeout - should be 10 minutes"
         ↓
    ORCHESTRATOR receives
         ↓
    ├─→ SEARCH AGENT
    │   "Find OTP files"
    │   Returns: 2-3 file paths
    │
    ├─→ ANALYSIS AGENT
    │   "Why is timeout wrong?"
    │   Returns: Root cause analysis
    │
    ├─→ CODE AGENT
    │   "Fix the timeout"
    │   Returns: Modified code
    │
    ├─→ TEST AGENT
    │   "Does the fix work?"
    │   Returns: Test results
    │
    └─→ REVIEW AGENT
        "Ready for merge?"
        Returns: Approval
         ↓
    ORCHESTRATOR combines
    User gets: "✅ Task complete, 11.5K tokens"
```

---

## What Each Agent Sees

### Search Agent Vision
```
Input: "Find OTP files"

Sees:
  ✓ RAG_INDEX.md (file mappings)
  ✓ Request keywords
  
Cannot see:
  ✗ Code content
  ✗ Tests
  ✗ Other domains

Output: File paths only
  - backend/lambda_/sms_otp_handler.py
  - backend/cdk/stacks/scamguard_stack.py
```

### Analysis Agent Vision
```
Input: Files (from Search)

Sees:
  ✓ OTP implementation
  ✓ DECISIONS.md (constraints)
  ✓ GUARDRAILS.md (rules)
  
Cannot see:
  ✗ Tests
  ✗ Unrelated code
  ✗ Implementation (Code Agent handles)

Output: Problem analysis
  "TTL is 480000ms, should be 600000ms"
```

### Code Agent Vision
```
Input: Analysis (from Analysis Agent)

Sees:
  ✓ Current code
  ✓ What needs to change
  ✓ GUARDRAILS.md (patterns)
  
Cannot see:
  ✗ Unrelated code
  ✗ Tests
  ✗ Full codebase

Output: Modified code
  time_to_live_seconds=600000
```

### Test Agent Vision
```
Input: Modified code (from Code Agent)

Sees:
  ✓ Changed code
  ✓ Success criteria
  ✓ Test files
  
Cannot see:
  ✗ Unmodified code
  ✗ Other tests
  ✗ Implementation details

Output: Test results
  "3/3 tests pass ✓"
```

### Review Agent Vision
```
Input: All results (from Test Agent)

Sees:
  ✓ Original request
  ✓ Changes made
  ✓ Test results
  
Cannot see:
  ✗ Code (already tested)
  ✗ Full codebase

Output: Approval
  "APPROVED ✓"
```

---

## Token Budget Example

### Single Agent (No Specialization)
```
Claude loads:
  • All frontend components (40 files)
  • All backend handlers (15 files)
  • All tests (50+ files)
  • Entire infrastructure code
  
Context: 50K+ tokens
Result: Slow, expensive, context confusion
```

### Multi-Agent (Specialized)
```
Search Agent loads:
  RAG_INDEX.md (2K tokens)
  Returns: 2-3 file paths
  
Analysis Agent loads:
  The 2-3 files (1.5K tokens)
  Analyzes problem
  
Code Agent loads:
  The 2-3 files (3.5K tokens)
  Implements fix
  
Test Agent loads:
  Modified code + tests (2K tokens)
  Validates
  
Review Agent:
  Results only (1.5K tokens)
  
Total: 11.5K tokens (77% reduction)
```

---

## Integration with Existing Systems

### Task System
```
Task specifies: "Files: 2 max"

Search Agent respects: Returns only 2 files
Code Agent respects: Modifies only those 2 files
Test Agent verifies: Success criteria from task

Result: Agents constrained by task scope
```

### Guardrails
```
Code Agent checks: GUARDRAILS.md before implementing
  ✓ No hardcoded secrets?
  ✓ Structured logging?
  ✓ No console.log?
  
Test Agent verifies: Guardrails compliance

Result: Violations prevented before code written
```

### RAG System
```
Search Agent uses: RAG_INDEX.md
  Lookup: "OTP" → Auth domain → Get files
  
Analysis Agent uses: RAG understanding
  "These files are related architecturally"
  
Result: Agents understand file relationships
```

### Memory System
```
All agents aware of: ACTIVE_RULES
  "Read code first" → Agents read files
  "Direct feedback" → Clear error messages
  
All agents check: DECISIONS.md
  "SMS OTP = 10 minutes" → Code ensures this
  
Result: Consistent architectural decisions
```

---

## Error Handling

### Guardrail Violation

```
Code Agent tries to hardcode secret:

Guardrail blocks:
  "❌ No hardcoded secrets"
  
Suggestion:
  "Use .env.local:
   1. Add OPENAI_KEY to .env.local
   2. Access via process.env.OPENAI_KEY
   3. Document in README"

Code Agent redesigns and retries
```

### Test Failure

```
Test Agent finds:
  Success criteria: "OTP expires after 600 seconds"
  Actual: OTP expires after 480 seconds
  
Report:
  "❌ Test failed"
  "Expected: 600s, Got: 480s"

Orchestrator asks Code Agent to fix
Code Agent retries
Test Agent re-validates
```

---

## Scaling: Adding New Agents

### Adding Documentation Agent

```
1. Create: documentation_agent.json
2. Add to orchestrator pipeline
3. Agent receives: Modified code + analysis
4. Agent produces: API docs, guides
5. Guardrails apply: No confidential info
6. Context impact: +2K tokens (not 50K)
```

**Result:** New capability without bloating other agents.

---

## Real Example: "Fix App.test.jsx React Import"

### Step 1: Request
```
Task: TASK-102 (Fix App.test.jsx)
Files: App.jsx, App.test.jsx
```

### Step 2: Search (2K tokens)
```
Find: "React import error"
Return: [App.jsx, App.test.jsx]
```

### Step 3: Analysis (1.5K tokens)
```
Find: "React is not imported in App.jsx"
Root cause: Missing import statement
```

### Step 4: Code (3.5K tokens)
```
Add: import React from 'react';
Check: No guardrail violations
```

### Step 5: Test (2K tokens)
```
Success criteria:
  ✓ 54 tests pass
  ✓ React imported
  ✓ No other breakage
```

### Step 6: Review (1.5K tokens)
```
Check: Matches request ✓
Approve: YES ✓
```

### Final Report
```
✅ TASK-102 complete
   Total: 11.5K tokens (vs 30K single agent)
   Time: ~8 minutes
   Quality: All criteria met ✓
```

---

## When to Use Multi-Agent

### Good Use Cases
- ✅ Fixing bugs (search→analyze→fix→test)
- ✅ Adding features (same workflow)
- ✅ Refactoring (more analysis needed)
- ✅ Performance optimization
- ✅ Complex integrations

### Not Needed For
- ❌ Simple file edits (read → write)
- ❌ Single-line fixes
- ❌ Questions (no agent needed)

**Default:** Use multi-agent for any task that needs search + analysis + implementation + testing.

---

## Token Savings Summary

| Scenario | Single Agent | Multi-Agent | Savings |
|----------|------|------------|---------|
| Fix OTP timeout | 50K | 11.5K | 77% |
| Add feature | 45K | 12K | 73% |
| Refactor code | 55K | 14K | 75% |
| Debug issue | 40K | 10K | 75% |
| **Monthly (20 tasks)** | **900K** | **240K** | **73%** |

---

## Files to Read

- **MULTI_AGENT_ARCHITECTURE.md** — Full system design
- **AGENT_SPECIFICATIONS.md** — Each agent's contract
- **AGENT_INTEGRATION.md** — How agents work together
- **This file** — Quick reference

---

## Next Session

1. Task comes in (from BACKLOG.md)
2. Orchestrator automatically activates
3. Agents execute sequentially
4. Results combined and delivered
5. Full token usage tracked

Everything is automatic. The system is now multi-agent. 🚀
