---
name: Agent Specifications
description: Detailed specifications for each specialized agent
type: reference
---

# Agent Specifications

Each agent has clear input/output contracts, domain boundaries, and token budgets.

---

## 1. ORCHESTRATOR AGENT

**Purpose:** Receive requests, decompose into tasks, coordinate agents, combine results.

### Input Contract
```
{
  "request": "User request or task description",
  "taskId": "TASK-102 (optional)",
  "context": {
    "domain": "Frontend|Backend|Infrastructure",
    "complexity": "simple|moderate|complex",
    "priority": "normal|urgent"
  }
}
```

### Processing
```
1. Parse request
   └─ Identify: Type (new feature/bug/refactor), domain, scope

2. Decompose
   ├─ Search task: Find relevant code
   ├─ Analysis task: Understand problem
   ├─ Code task: Implement solution
   ├─ Test task: Validate results
   └─ Review task: Final approval

3. Execute plan
   ├─ Sequential: Each step depends on previous
   ├─ Parallel: Independent steps run together
   └─ Wait points: Output → next agent input

4. Coordinate agents
   ├─ Route to specialists
   ├─ Collect results
   ├─ Handle errors/blockers
   └─ Escalate if needed

5. Combine results
   └─ Summary: What changed, tests passed, token usage
```

### Output Contract
```
{
  "taskComplete": true|false,
  "summary": "Human-readable summary",
  "changes": {
    "filesModified": ["file1.py", "file2.jsx"],
    "linesAdded": 45,
    "linesRemoved": 12
  },
  "validation": {
    "testsRun": 15,
    "testsPassed": 15,
    "guardrailsChecked": true,
    "guardrailsViolations": 0
  },
  "tokenUsage": {
    "orchestrator": 2000,
    "search": 2000,
    "analysis": 1500,
    "code": 3500,
    "test": 2000,
    "review": 1500,
    "total": 14000
  },
  "confidence": 0.95,
  "blockers": []
}
```

### Visibility Rules
```
✓ Can see:
  • Original request/task
  • Agent specifications
  • Task decomposition plans
  • Communication logs between agents
  • Summary results

✗ Cannot see:
  • Source code (agents retrieve as needed)
  • Test files
  • Full project structure
  • Implementation details
```

### Token Budget
```
Fixed: 2K tokens
Reason: Routing + coordination, minimal processing
```

---

## 2. SEARCH AGENT

**Purpose:** Find relevant code files using RAG_INDEX.md

### Input Contract
```
{
  "request": "User request or search query",
  "keywords": ["otp", "verify", "timeout"],
  "domain": "Backend|Frontend|Infrastructure",
  "maxFiles": 5,
  "taskId": "TASK-102"
}
```

### Processing
```
1. Parse request
   └─ Extract keywords, identify domain

2. Consult RAG_INDEX.md
   ├─ Look up domain
   ├─ Find matching query pattern
   └─ Get file mappings

3. Return file paths
   ├─ Exact paths (not content)
   ├─ Ordered by relevance
   └─ Max 5 files (task constraint)

4. Validate
   └─ Paths exist, files accessible
```

### Output Contract
```
{
  "foundFiles": [
    {
      "path": "backend/lambda_/sms_otp_handler.py",
      "purpose": "OTP generation and TTL management",
      "relevance": 0.95,
      "sizeLines": 120
    },
    {
      "path": "backend/lambda_/verify_otp_handler.py",
      "purpose": "OTP verification logic",
      "relevance": 0.90,
      "sizeLines": 85
    }
  ],
  "searchQuery": "OTP timeout verification",
  "domain": "Backend",
  "fileCount": 2,
  "confidence": 0.98,
  "ragIndexUsed": true
}
```

### Visibility Rules
```
✓ Can see:
  • RAG_INDEX.md (file mappings)
  • Request/keywords
  • File structure (paths only)

✗ Cannot see:
  • Actual code content
  • Implementation details
  • Other domains
  • Tests
```

### Token Budget
```
Target: 2K tokens
Breakdown:
  • Parse request: 200 tokens
  • RAG_INDEX lookup: 500 tokens
  • Validation: 500 tokens
  • Response: 800 tokens
```

---

## 3. ANALYSIS AGENT

**Purpose:** Understand problem, identify root cause, check constraints.

### Input Contract
```
{
  "request": "Problem description",
  "filePaths": ["file1.py", "file2.py"],
  "fileContents": {
    "file1.py": "... source code ...",
    "file2.py": "... source code ..."
  },
  "successCriteria": [
    "OTP expires after 600 seconds",
    "No console.log in production code"
  ]
}
```

### Processing
```
1. Read provided code
   └─ Understand current implementation

2. Identify issue
   ├─ What's wrong?
   ├─ What needs to change?
   └─ Root cause analysis

3. Check constraints
   ├─ DECISIONS.md (architectural decisions)
   ├─ GUARDRAILS.md (safety rules)
   └─ Task requirements

4. Document findings
   ├─ Current state
   ├─ Desired state
   ├─ Implementation approach
   └─ Any risks/concerns
```

### Output Contract
```
{
  "problemStatement": "OTP TTL is 480000ms, should be 600000ms",
  "rootCause": "TTL calculated in milliseconds, wrong constant used",
  "currentState": {
    "location": "scamguard_stack.py line 42",
    "code": "time_to_live_seconds=480"
  },
  "desiredState": {
    "requirement": "10-minute expiry per DECISIONS.md#2",
    "expectedValue": "600000ms"
  },
  "implementationApproach": "Change TTL constant in DynamoDB table config",
  "constraints": [
    "DECISIONS.md#2: SMS OTP = 10 minutes",
    "GUARDRAILS.md: Single concern per change"
  ],
  "risks": [
    "Existing OTP tokens won't be affected (created with old TTL)"
  ],
  "recommendation": "Update TTL constant, deploy immediately"
}
```

### Visibility Rules
```
✓ Can see:
  • Relevant code files (provided)
  • DECISIONS.md (architectural context)
  • GUARDRAILS.md (constraints)
  • Task success criteria

✗ Cannot see:
  • Unrelated files
  • Test infrastructure
  • Implementation (Code Agent handles)
  • Full codebase
```

### Token Budget
```
Target: 1.5K tokens
Breakdown:
  • Read code: 800 tokens
  • Analyze: 400 tokens
  • Check constraints: 200 tokens
  • Response: 100 tokens
```

---

## 4. CODE AGENT

**Purpose:** Implement fix/feature based on analysis.

### Input Contract
```
{
  "request": "Implement OTP TTL fix",
  "analysis": {
    "rootCause": "Wrong TTL constant",
    "location": "scamguard_stack.py",
    "change": "480000 → 600000"
  },
  "files": {
    "scamguard_stack.py": "... current code ..."
  },
  "guardrails": ["no-secrets", "structured-logging", "single-concern"],
  "constraints": ["Only modify specified files"]
}
```

### Processing
```
1. Understand requirements
   └─ What needs to change, where, why

2. Implement changes
   ├─ Modify only specified files
   ├─ Follow existing patterns
   ├─ Apply guardrails (no hardcodes, no console.log, etc.)
   └─ Maintain code quality

3. Check guardrails
   ├─ No secrets exposed?
   ├─ Architecture patterns followed?
   ├─ Single concern?
   ├─ Logging standards?
   └─ Tests required?

4. Generate output
   ├─ Modified code
   ├─ Summary of changes
   ├─ Commit message
   └─ Any concerns
```

### Output Contract
```
{
  "filesModified": [
    {
      "path": "backend/cdk/stacks/scamguard_stack.py",
      "changes": {
        "before": "time_to_live_seconds=480",
        "after": "time_to_live_seconds=600",
        "lineNumber": 42
      },
      "explanation": "Updated OTP TTL from 8 to 10 minutes per DECISIONS.md#2"
    }
  ],
  "guardrailsChecked": true,
  "guardrailsViolations": [],
  "commitMessage": "fix(auth): Update OTP TTL to 600 seconds (10 minutes)",
  "concerns": [],
  "testingNotes": "DynamoDB TTL attribute should be tested"
}
```

### Visibility Rules
```
✓ Can see:
  • Files to modify (provided)
  • Analysis/requirements
  • GUARDRAILS.md (patterns to follow)
  • Task constraints

✗ Cannot see:
  • Unrelated code
  • Test files
  • Full codebase
  • Other agents' work
```

### Token Budget
```
Target: 3.5K tokens
Breakdown:
  • Parse requirements: 300 tokens
  • Read current code: 1000 tokens
  • Implement fix: 1200 tokens
  • Check guardrails: 500 tokens
  • Generate output: 500 tokens
```

---

## 5. TEST AGENT

**Purpose:** Validate solution, ensure all success criteria met.

### Input Contract
```
{
  "request": "Test OTP TTL fix",
  "modifiedCode": {
    "scamguard_stack.py": "... modified code ..."
  },
  "successCriteria": [
    "OTP expires after exactly 600 seconds",
    "DynamoDB TTL attribute set correctly",
    "No breaking changes"
  ],
  "testFiles": ["tests/test_otp.py", "tests/test_dynamodb.py"]
}
```

### Processing
```
1. Read modified code
   └─ Understand what changed

2. Identify tests to run
   ├─ Unit tests (logic)
   ├─ Integration tests (databases)
   ├─ E2E tests (user flows)
   └─ Guardrails checks

3. Validate against success criteria
   ├─ Does TTL = 600?
   ├─ Is DynamoDB configured correctly?
   ├─ Are there breaking changes?
   └─ Do guardrails pass?

4. Report results
   └─ Which tests passed/failed
```

### Output Contract
```
{
  "testsRun": 8,
  "testsPassed": 8,
  "testsFailed": 0,
  "results": [
    {
      "testName": "test_otp_ttl_600s",
      "status": "PASSED",
      "assertion": "TTL value equals 600000ms"
    },
    {
      "testName": "test_dynamodb_ttl_attribute",
      "status": "PASSED",
      "assertion": "DynamoDB table has TTL enabled"
    }
  ],
  "successCriteriaMet": [
    "✓ OTP expires after exactly 600 seconds",
    "✓ DynamoDB TTL attribute set correctly",
    "✓ No breaking changes detected"
  ],
  "guardrailsCompliance": {
    "checked": true,
    "violations": 0,
    "status": "PASS"
  },
  "readyForMerge": true,
  "confidence": 0.98
}
```

### Visibility Rules
```
✓ Can see:
  • Modified code (from Code Agent)
  • Test files
  • Success criteria
  • GUARDRAILS.md

✗ Cannot see:
  • Unmodified files
  • Unrelated tests
  • Implementation details (already done)
  • Future requirements
```

### Token Budget
```
Target: 2K tokens
Breakdown:
  • Read modified code: 500 tokens
  • Run tests: 800 tokens
  • Check guardrails: 400 tokens
  • Report results: 300 tokens
```

---

## 6. REVIEW AGENT (Optional)

**Purpose:** Final code review, quality assurance, approval.

### Input Contract
```
{
  "request": "Review OTP TTL fix",
  "originalRequest": "Fix OTP timeout from 8 to 10 minutes",
  "analysis": { ... },
  "modifiedCode": { ... },
  "testResults": { ... }
}
```

### Processing
```
1. Verify changes match request
   └─ Did we fix what was asked?

2. Check architectural alignment
   ├─ DECISIONS.md compliance?
   ├─ Guardrails satisfied?
   └─ Patterns followed?

3. Review for edge cases
   ├─ What could go wrong?
   ├─ Are there mitigations?
   └─ Is documentation needed?

4. Final approval
   └─ Ready for merge?
```

### Output Contract
```
{
  "reviewStatus": "APPROVED",
  "matchesRequest": true,
  "architectureCompliance": {
    "decisionsFollowed": true,
    "guardrailsViolations": 0,
    "patternCompliance": "PASS"
  },
  "edgeCases": [
    {
      "case": "Existing OTP tokens created with old TTL",
      "impact": "Low (will expire after original TTL)",
      "mitigation": "Noted in deployment docs"
    }
  ],
  "recommendations": [
    "Deploy immediately to production",
    "Monitor DynamoDB metrics for first hour"
  ],
  "confidence": 0.99
}
```

### Token Budget
```
Target: 1.5K tokens
(Optional, only for complex changes)
```

---

## Agent Communication

### Standard Format
```json
{
  "from": "agent_name",
  "to": "orchestrator|agent_name",
  "timestamp": "ISO 8601",
  "messageType": "request|response|error",
  "taskId": "TASK-NN",
  "content": { ... },
  "metadata": {
    "tokenUsed": 2000,
    "executionTimeMs": 500,
    "success": true
  }
}
```

### Error Handling
```
If agent encounters issue:
  {
    "status": "ERROR",
    "error": "Description of problem",
    "blocker": true|false,
    "suggestion": "What to do instead"
  }
```

---

## Token Budgets Summary

| Agent | Budget | Use Case |
|-------|--------|----------|
| Orchestrator | 2K | Route + coordinate |
| Search | 2K | Find files (RAG) |
| Analysis | 1.5K | Understand problem |
| Code | 3.5K | Implement fix |
| Test | 2K | Validate solution |
| Review | 1.5K | Final approval |
| **Total** | **13.5K** | **Complete task** |

**vs Single Agent:** 50K+ tokens (75% savings)

---

## Guardrails Applied Per Agent

### Search Agent
```
✓ Must consult RAG_INDEX.md
✓ Cannot load content (only paths)
✓ Max 5 files returned
```

### Analysis Agent
```
✓ Must check DECISIONS.md
✓ Must acknowledge GUARDRAILS.md
✓ Cannot implement (that's Code Agent)
```

### Code Agent
```
✓ Must follow guardrails (no secrets, structured logging, etc.)
✓ Must not modify unspecified files
✓ Must ensure single concern
```

### Test Agent
```
✓ Must verify success criteria
✓ Must check guardrails compliance
✓ Cannot modify code (that's Code Agent)
```

### Review Agent
```
✓ Must verify architectural alignment
✓ Must identify edge cases
✓ Cannot force merge (decision is user's)
```

---

## Summary

Each agent:
- ✅ Has clear input/output contract
- ✅ Sees only its domain
- ✅ Respects token budget
- ✅ Applies guardrails
- ✅ Communicates with Orchestrator
- ✅ Returns actionable output

**Result: Modular, scalable, efficient multi-agent system.**
