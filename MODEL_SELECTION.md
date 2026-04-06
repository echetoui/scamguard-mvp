---
name: Model Selection & Routing
description: Intelligent model selection (Haiku/Sonnet/Opus) based on task complexity
type: reference
---

# Model Selection & Routing

**Problem:** Using Haiku for all tasks = missing capability on complex work.
**Solution:** Route to optimal model (Haiku/Sonnet/Opus) based on task characteristics.

---

## Model Tiers

### Haiku (Default, Fast, Cheap)
**Token cost:** ~$0.0008/1K input, ~$0.004/1K output
**Speed:** Fastest
**Capability:** Good for focused, well-scoped tasks
**Use when:** Simple fixes, single concern, clear scope

**Good for:**
- Bug fixes (< 5 files)
- Single-domain changes
- Clear root cause
- Straightforward implementation
- Well-defined success criteria

**Not for:**
- Multi-domain architecture
- Novel/complex algorithms
- Code reviews
- Design decisions

### Sonnet (Balanced, Smart, Moderate Cost)
**Token cost:** ~$0.003/1K input, ~$0.015/1K output (~4x Haiku)
**Speed:** Fast
**Capability:** Good for moderate-to-complex tasks
**Use when:** Multi-step work, cross-domain, some uncertainty

**Good for:**
- Feature implementation (5-15 files)
- Refactoring (multi-file)
- Integration work
- Complex debugging
- Code review + suggestions
- Architecture questions
- Optimization work

**Not for:**
- Simple tasks (overkill)
- Mission-critical decisions (go to Opus)
- Novel algorithm design (Opus better)

### Opus (Powerful, Thorough, Most Expensive)
**Token cost:** ~$0.015/1K input, ~$0.075/1K output (~20x Haiku)
**Speed:** Slower
**Capability:** Best for complex reasoning
**Use when:** Critical decisions, novel work, major architecture

**Good for:**
- Major architecture decisions
- Novel algorithm design
- Security-critical code
- Complex refactors (100+ files)
- Research/investigation
- Design reviews
- Final approval on critical paths

---

## Decision Matrix

```
Task Characteristic                Decision
────────────────────────────────────────────

FILES AFFECTED:
  1-2 files                       → HAIKU
  3-5 files                       → HAIKU
  6-15 files                      → SONNET
  15+ files                       → SONNET/OPUS

COMPLEXITY:
  Clear root cause                → HAIKU
  Some investigation needed       → SONNET
  Novel/ambiguous problem         → SONNET/OPUS
  Research/exploration            → OPUS

DOMAIN SCOPE:
  Single domain (Frontend)        → HAIKU
  Two domains (Frontend + API)    → SONNET
  3+ domains (Full stack)         → SONNET/OPUS

RISK LEVEL:
  Low (user can fix easily)       → HAIKU
  Medium (affects users)          → SONNET
  High (security/data)            → OPUS

CRITICALITY:
  Nice-to-have feature            → HAIKU
  Important feature               → SONNET
  Mission-critical, blocking      → OPUS

TIME CONSTRAINT:
  No rush (can iterate)           → HAIKU
  Moderate urgency                → SONNET
  Urgent (high stakes)            → OPUS

TOKEN BUDGET (estimated):
  < 10K                           → HAIKU
  10-30K                          → SONNET
  30K+                            → OPUS/revisit scope

COST TOLERANCE:
  Low budget (free tier)          → HAIKU
  Moderate budget                 → SONNET
  High value task (worth cost)    → OPUS
```

---

## Decision Rules (In Order)

### Rule 1: Security/Compliance
```
If task touches:
  • Authentication
  • Encryption
  • Data protection
  • Compliance requirements
  
→ Escalate to SONNET minimum
   (Even simple changes need careful review)
```

### Rule 2: Multi-Domain
```
If task affects > 2 domains:
  • Domain 1: Frontend
  • Domain 2: Backend
  • Domain 3: Infrastructure
  
→ Escalate to SONNET
   (Coordination complexity increases)
```

### Rule 3: Architectural
```
If task requires:
  • Design decisions
  • Architecture impact
  • Breaking changes
  • Major refactoring
  
→ Escalate to SONNET/OPUS
   (Need stronger reasoning)
```

### Rule 4: Uncertainty
```
If:
  • Root cause unclear
  • Multiple solutions possible
  • Trade-offs to evaluate
  • Novel problem
  
→ Escalate to SONNET
   (Analysis capability matters)
```

### Rule 5: Criticality
```
If task is:
  • Blocking multiple teams
  • High-risk deployment
  • Security sensitive
  • Data-touching
  
→ Escalate to OPUS
   (Thoroughness worth the cost)
```

---

## Examples by Task

### ✅ HAIKU Examples (Simple, Focused)

```
TASK-102: Fix App.test.jsx React import
  Files: 2 (App.jsx, App.test.jsx)
  Complexity: Clear root cause (missing import)
  Domain: Frontend only
  Risk: Low (test file)
  
  DECISION: HAIKU ✓
  
  Reasoning:
    • Single concern
    • Clear fix (add import)
    • No cross-domain impact
    • Low risk
```

```
TASK-42: Add SMS OTP request handler
  Files: 2-3 (handler + route)
  Complexity: Clear spec (from DECISIONS.md)
  Domain: Backend only
  Risk: Medium (auth, but SMS is separate service)
  
  DECISION: HAIKU → SONNET (escalate for auth review)
  
  Reasoning:
    • Auth logic needs care
    • Single domain
    • Well-specified
    • Escalate to SONNET for security review
```

### 🟡 SONNET Examples (Moderate, Multi-step)

```
TASK-110: Integrate QuebecFraudAlerts API
  Files: 5-8 (handler, agent, components, tests, config)
  Complexity: Integration work (fetch, transform, display)
  Domain: Backend + Frontend
  Risk: Medium (external API, user-facing)
  
  DECISION: SONNET ✓
  
  Reasoning:
    • Multiple files touched
    • Cross-domain (API + UI)
    • Integration complexity
    • External dependency handling
```

```
TASK-150: Refactor authentication system
  Files: 12-15 (handlers, components, config, tests)
  Complexity: Multi-step (plan refactor)
  Domain: Frontend + Backend + Infrastructure
  Risk: High (auth is critical)
  
  DECISION: SONNET → OPUS (escalate for arch review)
  
  Reasoning:
    • Multi-domain refactor
    • Critical path
    • Affects architecture
    • Needs thorough design review
    • Escalate SONNET → OPUS for design
```

### 🔴 OPUS Examples (Complex, Critical)

```
TASK-200: Major security audit + remediation
  Files: Unknown (full codebase review)
  Complexity: Security analysis + fixes
  Domain: All domains
  Risk: Critical (security)
  
  DECISION: OPUS ✓
  
  Reasoning:
    • Security-critical
    • Novel threats
    • Full-codebase analysis needed
    • Needs expert reasoning
    • Cost justified by criticality
```

```
TASK-201: Design new microservices architecture
  Files: None yet (design phase)
  Complexity: Novel architecture
  Domain: Infrastructure (all)
  Risk: Critical (affects entire system)
  
  DECISION: OPUS ✓
  
  Reasoning:
    • Major architecture decision
    • Novel problem
    • Long-term impact
    • Needs deep reasoning
    • Cost of wrong decision >> model cost
```

---

## Cost Analysis

### Per-Task Model Cost

```
TASK-102 (Simple fix):
  Haiku: ~0.02 (10K tokens × $0.002/1K)
  Sonnet: ~0.08 (10K tokens × $0.008/1K)
  Opus: ~0.20 (10K tokens × $0.020/1K)
  
  Savings with Haiku: 0.06 per task

TASK-110 (Integration):
  Haiku: ~0.04 (20K tokens × $0.002/1K)
  Sonnet: ~0.16 (20K tokens × $0.008/1K)
  Opus: ~0.40 (20K tokens × $0.020/1K)
  
  Cost of Haiku: Might miss subtle issues
  Value of Sonnet: Better reasoning (+0.12)

TASK-200 (Security audit):
  Haiku: ~0.05 (25K tokens × $0.002/1K)
  Sonnet: ~0.20 (25K tokens × $0.008/1K)
  Opus: ~0.50 (25K tokens × $0.020/1K)
  
  Risk of Haiku: Miss security issue
  Value of Opus: Thorough analysis (+0.45)
  Risk mitigation: Worth it
```

### Monthly Breakdown (50 tasks/month)

```
Assumption:
  • 30 simple tasks (Haiku)
  • 15 moderate tasks (Sonnet)
  • 5 critical tasks (Opus)

Task 1 (Simple): 0.02 × 30 = $0.60
Task 2 (Moderate): 0.16 × 15 = $2.40
Task 3 (Critical): 0.50 × 5 = $2.50
─────────────────────────────────
Total monthly: $5.50

Breakdown:
  Haiku (60%): $0.60
  Sonnet (30%): $2.40
  Opus (10%): $2.50
  
Cost per task: $0.11 average
  (vs $0.20 if all Opus)
  (vs $0.02 if all Haiku, but risky)
```

---

## Integration with Orchestrator

### Orchestrator Decision Point

```
REQUEST RECEIVED
  ↓
ANALYZE TASK:
  ├─ Parse task file
  ├─ Count files
  ├─ Identify domain
  ├─ Assess risk
  └─ Check criticality
  ↓
SELECT MODEL:
  ├─ Apply decision matrix
  ├─ Check rules (security, multi-domain, etc.)
  └─ Determine: HAIKU | SONNET | OPUS
  ↓
ROUTE TO AGENTS:
  ├─ Search Agent: Use selected model
  ├─ Analysis Agent: Use selected model
  ├─ Code Agent: Use selected model
  ├─ Test Agent: Use selected model
  └─ Review Agent: May escalate if needed
  ↓
EXECUTE & TRACK:
  ├─ Run task with selected model
  ├─ Track actual token usage
  ├─ Compare vs estimate
  └─ Log decision + cost
```

### Example: Orchestrator Decision

```
Task: TASK-110 (Integrate QuebecFraudAlerts)

Analysis:
  Files affected: 6
  Domains: Backend + Frontend (2)
  Complexity: Integration
  Risk: Medium (external API)
  
Decision logic:
  Rule 1 (Security): Not auth → Continue
  Rule 2 (Multi-domain): 2 domains → SONNET
  Rule 3 (Architectural): Integration, not major arch → SONNET
  Rule 4 (Uncertainty): Spec is clear → HAIKU OK
  Rule 5 (Criticality): Important, not blocking → SONNET
  
Decision: SONNET (2 domains = escalate)

Instruction to agents:
  "Use Sonnet for this task (model: sonnet)"
  All agents route to Sonnet endpoint
  
Result:
  Execution time: ~15 min (slower than Haiku)
  Cost: ~$0.16 (higher than Haiku)
  Quality: Better reasoning on integration
  Confidence: Higher
```

---

## Model Switching During Task

### Escalation Pattern

```
Initial: HAIKU (assume simple)
  ↓
During Analysis:
  "This is more complex than expected"
  (More files affected, or domain crossing detected)
  ↓
ESCALATE TO SONNET:
  Analysis Agent signals: "Complexity unexpected"
  Orchestrator switches Code/Test to Sonnet
  ↓
Cost impact: +$0.08 (vs Haiku)
Benefit: Better implementation (avoids rework)
```

### No Downgrade

```
Rule: Never downgrade model during task

Reason:
  • Safety: Task may have constraints unknown upfront
  • Quality: Consistency important
  • Cost: Minimal (downgrade saves $0.02 max)
  
If started as Sonnet → Stay Sonnet
(Don't try to "save money" mid-task)
```

---

## Configuration

### settings.json

```json
{
  "modelSelection": {
    "enabled": true,
    "defaultModel": "haiku",
    "rules": {
      "security": {
        "trigger": ["auth", "encrypt", "compliance", "secrets"],
        "escalateTo": "sonnet"
      },
      "multiDomain": {
        "threshold": 2,
        "escalateTo": "sonnet"
      },
      "complexity": {
        "lowCertainty": "sonnet",
        "novel": "opus",
        "architectural": "sonnet"
      },
      "criticality": {
        "blocking": "opus",
        "highRisk": "opus",
        "dataTouching": "sonnet"
      }
    },
    "tokenBudgets": {
      "haiku": 10000,
      "sonnet": 30000,
      "opus": 50000
    },
    "costTracking": true,
    "monthlyBudget": 50
  }
}
```

---

## Monitoring & Optimization

### Track Decisions

```
Log every model selection:
  Task ID: TASK-110
  Selected model: SONNET
  Reason: Multi-domain (Backend + Frontend)
  Estimated cost: $0.16
  Actual cost: $0.14
  Quality score: 4.8/5
  Time: 15 min
  Escalation needed: No
```

### Monthly Analysis

```
Pattern analysis:
  • Haiku success rate: 98% (good for simple tasks)
  • Sonnet success rate: 99% (good for moderate)
  • Opus success rate: 100% (always good, expensive)
  
Optimization:
  • Move more tasks to Haiku if success rate high
  • Move complex tasks to Sonnet early (avoid rework)
  • Reserve Opus for critical path only
  
Cost trending:
  Month 1: $6.50 (learning)
  Month 2: $5.80 (optimized)
  Month 3: $5.50 (mature)
```

---

## Summary

**Simple heuristic:**

```
Haiku (fast, cheap)      → Single concern, clear scope
Sonnet (balanced)        → Multi-file, cross-domain
Opus (thorough, $$)      → Critical, novel, blocking

Decision made once per task (at start)
No mid-task changes (consistency > micro-savings)
Track actual vs estimated (learn over time)
```

**Default to Haiku, escalate when needed.**

Cost optimization = right tool for right job, not cheapest always.
