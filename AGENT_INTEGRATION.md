---
name: Agent Integration Guide
description: How multi-agent system integrates with existing systems
type: reference
---

# Multi-Agent Integration

How the new multi-agent architecture works with caching, RAG, tasks, guardrails, and memory.

---

## System Layers

```
┌─────────────────────────────────────────────────┐
│          MULTI-AGENT ORCHESTRATION              │
│  (Orchestrator routes to 5 specialized agents)  │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┬─────────┬────────┬──────────┐
        ↓                 ↓         ↓        ↓          ↓
    ┌────────┐    ┌────────┐  ┌────────┐ ┌─────┐  ┌──────┐
    │ SEARCH │    │ANALYSIS│  │ CODE   │ │TEST │  │REVIEW│
    │ AGENT  │    │ AGENT  │  │ AGENT  │ │AGENT│  │AGENT │
    └────┬───┘    └────┬───┘  └────┬───┘ └──┬──┘  └───┬──┘
         │             │           │        │         │
         └─────────────┴───────────┴────────┴─────────┘
                       ↓
        ┌──────────────────────────────────┐
        │      GUARDRAILS LAYER            │
        │  (All agents apply guardrails)   │
        └────────┬─────────────────────────┘
                 │
        ┌────────┴──────────────────────────┐
        │   TASK DECOMPOSITION SYSTEM       │
        │  (Tasks define scope/files)       │
        └────────┬──────────────────────────┘
                 │
        ┌────────┴──────────────────────────┐
        │     RAG INDEXING SYSTEM           │
        │  (Search Agent uses RAG_INDEX)    │
        └────────┬──────────────────────────┘
                 │
        ┌────────┴──────────────────────────┐
        │    MEMORY SYSTEM (Rules)          │
        │  (All agents respect rules)       │
        └────────┬──────────────────────────┘
                 │
        ┌────────┴──────────────────────────┐
        │   CACHING LAYER                   │
        │  (Stable context cached)          │
        └──────────────────────────────────┘
```

---

## Integration Points

### 1. With Task System

**Task file specifies scope:**
```markdown
### TASK-102: Fix OTP timeout
- Domain: Backend
- Files: 2 (sms_otp_handler.py, scamguard_stack.py)
- Tokens: 3.5K
- Success criteria:
  1. [ ] OTP expires after 600 seconds
  2. [ ] Tests pass
```

**Orchestrator uses task definition:**
```
1. Parse task
   ├─ Files: [sms_otp_handler.py, scamguard_stack.py]
   └─ Success criteria: 2 items

2. Route to Search Agent
   ├─ "Find files for TASK-102"
   └─ Expected: sms_otp_handler.py, scamguard_stack.py

3. Route to Code Agent
   ├─ "Only modify these 2 files"
   └─ Constraint enforced

4. Route to Test Agent
   ├─ Success criteria from task
   └─ "All must pass"
```

**Result:** Agents constrained by task scope, no context explosion.

---

### 2. With RAG Index

**Search Agent uses RAG_INDEX.md:**
```
Request: "Fix OTP timeout"

Search Agent:
  1. Parse keywords: OTP, timeout
  2. Consult RAG_INDEX.md → Auth domain
  3. Lookup: "Authentication queries"
  4. Return: Exact file paths from RAG
  
Output:
  Files:
    - backend/lambda_/sms_otp_handler.py
    - backend/lambda_/verify_otp_handler.py
    - ...
```

**Analysis Agent uses RAG for architecture:**
```
Understanding file relationships:
  
From RAG_INDEX.md:
  "sms_otp_handler.py" is under Backend/Auth
  "scamguard_stack.py" is Infrastructure/CDK
  
Implication:
  Handler implements business logic
  Stack defines infrastructure
  Both need to be consistent
```

**Result:** Agents understand file organization, can reason about architecture.

---

### 3. With Guardrails

**All agents apply guardrails:**

```
Code Agent before implementing:
  1. Check GUARDRAILS.md for patterns
  2. Identified rules:
     ├─ "No hardcoded secrets" ✓
     ├─ "Structured logging only" ✓
     ├─ "Repository pattern for DB access" ✓
     └─ "Type hints required (Python)" ✓
  3. Implement following all rules

Test Agent after implementation:
  1. Check code against guardrails
  2. Verify no violations:
     ├─ console.log? No ✓
     ├─ Hardcoded secrets? No ✓
     ├─ Type hints? Yes ✓
     └─ DB pattern? Yes ✓
```

**Result:** Violations caught before deployment, not in production.

---

### 4. With Memory System

**All agents aware of ACTIVE_RULES:**

```
Rule 1: "Direct, honest feedback"
  → Code Agent implements feedback mechanisms

Rule 2: "Read code first"
  → Analysis Agent reads full context before analyzing
  
Project-specific rules (future):
  → SMS OTP: 4-digit, 10-min, Canadian format
  → Accessibility: 16px+ fonts, 48px buttons
```

**All agents respect DECISIONS.md:**

```
DECISIONS.md#2: "SMS OTP = 10 minutes"
  
When Code Agent changes OTP TTL:
  ✓ Checks DECISIONS.md#2
  ✓ Ensures 600-second constant
  ✓ Documents reasoning

When Analysis Agent understands problem:
  ✓ Notes decision constraint
  ✓ Confirms fix is compliant
```

**Result:** All agents maintain architectural consistency.

---

### 5. With Caching

**Stable context cached once, used by all agents:**

```
Session 1 (new):
  Caching layer:
    Load CLAUDE.md (2K) → write to cache
    Load MEMORY.md (1K) → write to cache
    Load ACTIVE_RULES (1.5K) → write to cache
  
  All agents access:
    From cache (no token cost)

Sessions 2-7 (same 7-day period):
  All agents access:
    From cache (1K tokens per session, not 4.5K)
  
Session 8 (cache expires):
  Cache refreshed (write new)
```

**Result:** Stable context shared, no duplication, 90% savings.

---

## Complete Workflow: OTP Timeout Fix

### Step 0: Request Received

```
User: "Fix OTP timeout - should be 10 minutes, but users report 8"
Task: TASK-102 (from BACKLOG.md)
Token budget: 3.5K for Code Agent
```

### Step 1: Orchestrator Receives & Decomposes

```
Orchestrator (2K tokens):
  Input: Task TASK-102
  
  Decomposition:
    1. SEARCH: Find OTP-related files
    2. ANALYSIS: Identify timeout issue
    3. CODE: Fix timeout to 600s
    4. TEST: Verify fix + guardrails
    5. REVIEW: Final approval
  
  Execution plan: Sequential (each step depends on previous)
  
  Status: Ready to delegate
```

### Step 2: Search Agent Finds Files

```
Search Agent (2K tokens):
  Input: "OTP timeout files for TASK-102"
  
  Process:
    1. Task says: "2 files max"
    2. Keywords: OTP, timeout
    3. Consult RAG_INDEX → Auth domain
    4. Found: sms_otp_handler.py, verify_otp_handler.py
    5. Also needs: scamguard_stack.py (CDK config)
    
  Output:
    Files for TASK-102:
      - backend/lambda_/sms_otp_handler.py
      - backend/cdk/stacks/scamguard_stack.py
      - (Task spec: 2 files, found 2) ✓
```

### Step 3: Analysis Agent Understands Problem

```
Analysis Agent (1.5K tokens):
  Input: Files + request
  
  Process:
    1. Read sms_otp_handler.py → Generate logic
    2. Read scamguard_stack.py → DynamoDB config
    3. Find: time_to_live_seconds=480 (should be 600)
    4. Check DECISIONS.md#2 → Confirms 10-minute requirement
    5. Root cause: Milliseconds vs seconds confusion
    
  Output:
    Root cause: TTL in DynamoDB is 480000ms (8 min)
    Required: 600000ms (10 min) per DECISIONS.md#2
    Location: scamguard_stack.py line 42
    Fix: Change constant 480000 → 600000
```

### Step 4: Code Agent Implements

```
Code Agent (3.5K tokens):
  Input: Analysis results + current code
  
  Process:
    1. Read scamguard_stack.py
    2. Find line: time_to_live_seconds=480000
    3. Change to: time_to_live_seconds=600000
    4. Check guardrails:
       ✓ No secrets
       ✓ No console.log
       ✓ Single concern (TTL only)
       ✓ Architecture respected
    5. Generate commit message
    
  Output:
    Modified code:
      time_to_live_seconds=600000  # 10 minutes
    
    Guardrails: All passed ✓
    Commit: "fix(auth): Update OTP TTL to 600 seconds"
```

### Step 5: Test Agent Validates

```
Test Agent (2K tokens):
  Input: Modified code + success criteria
  
  Process:
    1. Success criteria from TASK-102:
       ✓ OTP expires after 600 seconds
       ✓ No guardrail violations
    2. Run tests:
       ✓ Unit: TTL = 600000ms ✓
       ✓ Integration: DynamoDB TTL works ✓
       ✓ Guardrails: No violations ✓
    3. Results: All pass
    
  Output:
    Tests: 3/3 passed ✓
    Success criteria: Met ✓
    Ready for merge: YES ✓
```

### Step 6: Review Agent Approves

```
Review Agent (1.5K tokens):
  Input: Full context + test results
  
  Process:
    1. Verify: Matches original request ✓
    2. Architecture: Follows DECISIONS.md ✓
    3. Edge cases: Noted (old OTPs expire normally) ✓
    4. Ready: YES ✓
    
  Output:
    Status: APPROVED
    Confidence: 99%
```

### Step 7: Orchestrator Combines Results

```
Orchestrator Final Output (2K tokens):
  
  Task Complete: ✅ TASK-102
  
  Summary:
    Request: Fix OTP timeout (8→10 minutes)
    Changes: scamguard_stack.py (480000 → 600000)
    Tests: 3/3 passed
    Review: Approved
    
  Token usage:
    Orchestrator: 2K
    Search: 2K
    Analysis: 1.5K
    Code: 3.5K
    Test: 2K
    Review: 1.5K
    ─────────
    Total: 13.5K tokens
    
  Savings: 50K blind approach → 13.5K focused (73% reduction)
  
  Status: Ready for deployment
```

---

## Agent Interaction Matrix

| From | To | Purpose | Token Cost |
|------|-----|---------|------------|
| User | Orchestrator | Submit task | 0 (user message) |
| Orchestrator | Search | Find files | 200 |
| Search | Orchestrator | Return file list | 500 |
| Orchestrator | Analysis | Analyze problem | 200 |
| Analysis | Orchestrator | Report findings | 800 |
| Orchestrator | Code | Implement fix | 300 |
| Code | Orchestrator | Return modified code | 1800 |
| Orchestrator | Test | Validate solution | 200 |
| Test | Orchestrator | Report test results | 1000 |
| Orchestrator | Review | Final review | 200 |
| Review | Orchestrator | Approval | 800 |
| Orchestrator | User | Task complete | 500 |
| **Total** | | | **~8.5K** |

---

## Scaling Example

### Adding New Agent (Documentation)

**Scenario:** Need to automatically generate docs

```
1. Create: documentation_agent_spec.json
   ├─ Input: Modified code + analysis
   ├─ Output: Generated documentation
   └─ Token budget: 2K

2. Add to orchestrator route:
   └─ After Code Agent, before Test Agent

3. Guardrails apply:
   └─ No hardcoded examples, no confidential info

4. Integration automatic:
   ├─ Uses same communication protocol
   ├─ Respects task scope
   ├─ Follows memory system rules
   └─ No context explosion
```

**Result:** Documentation generated without bloating other agents' context.

---

## Performance Implications

### Time Complexity
```
Sequential (current):
  Orchestrator → Search → Analysis → Code → Test → Review
  Time: T1 + T2 + T3 + T4 + T5 + T6 = ~10 minutes

Future (with parallelization):
  Orchestrator → [Search + Analysis parallel] → Code → Test + Review parallel
  Time: Could be ~5 minutes (if independent tasks)
```

### Space Complexity (Token Usage)
```
Single agent (no specialization):
  Context: 50K+ tokens
  
Multi-agent (specialized):
  Sum: 2K + 2K + 1.5K + 3.5K + 2K + 1.5K = 13.5K tokens
  
Efficiency: 73% reduction
```

---

## Error Handling

### Agent Failure

```
If Code Agent fails:
  1. Error reported to Orchestrator
  2. Orchestrator:
     ├─ Collects error details
     ├─ May ask Analysis for clarification
     ├─ May retry Code Agent with more context
     └─ Or escalate to user
  3. User notified with clear error message
```

### Guardrail Violation

```
If Code Agent violates guardrail:
  1. Guardrail blocks edit
  2. Clear message: "❌ No hardcoded secrets"
  3. Guidance: "Use .env.local instead"
  4. Agent redesigns approach
  5. Retry with correct pattern
```

---

## Summary

**Multi-agent system integrates seamlessly:**

- ✅ Task system: Agents respect scope boundaries
- ✅ RAG system: Search Agent uses RAG_INDEX
- ✅ Guardrails: All agents apply safety rules
- ✅ Memory system: All agents respect ACTIVE_RULES
- ✅ Caching: Stable context shared by all agents

**Result: Modular, scalable, efficient, maintainable.**

Each agent is a specialist that can be improved/tested independently.
Communication is clear and structured.
No context explosion as system grows.
