---
name: Compaction Integration
description: How automatic context compaction integrates with caching, RAG, and task systems
type: reference
---

# Compaction System Integration

**Layer 8 of the 7-layer architecture:** Context compaction completes the system.

```
┌─────────────────────────────────────────────┐
│   INTELLIGENT MODEL SELECTION (Layer 7)     │
│  (Route Haiku/Sonnet/Opus by task complexity) │
└────────┬────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────┐
│  AUTOMATIC CONTEXT COMPACTION (Layer 8)     │ ← NEW
│  (Compress old sessions, preserve patterns) │
└────────┬────────────────────────────────────┘
         │
        ↓ (below existing layers)
┌──────────────────────────────────────────────┐
│   MULTI-AGENT ORCHESTRATION (Layer 6)       │
│  (5 specialized agents, 73% token savings)  │
└──────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────┐
│   GUARDRAILS & SAFETY (Layer 5)              │
│  (50+ rules, prevent violations before code) │
└──────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────┐
│   TASK DECOMPOSITION (Layer 4)               │
│  (Atomic tasks, max 5 files, 2-8K tokens)   │
└──────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────┐
│   RAG RETRIEVAL (Layer 3)                    │
│  (Load only 2-5 relevant files, 80-90% save) │
└──────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────┐
│   ACTIVE RULE LEARNING (Layer 2)             │
│  (Observations become rules, CLAUDE.md style)│
└──────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────┐
│   PROMPT CACHING (Layer 1)                   │
│  (7-day TTL, 8 stable files, 90% savings)   │
└──────────────────────────────────────────────┘
```

---

## Integration Points

### 1. With Prompt Caching

**Caching stores:** CLAUDE.md, MEMORY.md, ACTIVE_RULES.md (8 files, 7-day TTL)

**Compaction complements caching by:**
- Archiving old observations that don't escalate to rules
- Preserving cache consistency (rules never change, observations do)
- Reducing old context that would bloat cached stable files

**Workflow:**
```
Session 1:
  ├─ Load cached ACTIVE_RULES (2K, no charge)
  ├─ Accumulate observations (from work)
  └─ At 100K tokens: COMPRESS & ARCHIVE

Session 2:
  ├─ Load cached ACTIVE_RULES (2K, no charge)
  ├─ Load archived observations (reference only)
  ├─ New observations (if any)
  └─ Continue...
```

### 2. With RAG Retrieval

**RAG_INDEX.md:** Maps files to domains, helps Search Agent find relevant code

**Compaction integrates by:**
- Updating RAG_INDEX when observations reveal new domain patterns
- Archiving old RAG queries that no longer apply
- Preserving domain boundaries in compressed summaries

**Workflow:**
```
Old RAG pattern discovered:
  - Observation: "Always check auth middleware first"
  - Confirmations: 5
  - Action: Add to RAG_INDEX rule for Backend domain
  - Archive: Remove from OBSERVATIONS.md

Next session:
  - RAG_INDEX suggests auth middleware proactively
  - Reduces search time, improves accuracy
```

### 3. With Task Decomposition

**Task system:** Max 5 files, 2-8K tokens per task, clear success criteria

**Compaction helps by:**
- Archiving completed tasks to keep DONE.md lean
- Extracting task patterns for better estimation
- Preserving task history for reference

**Workflow:**
```
After TASK-110 is completed:
  ├─ Keep in DONE.md (last 10 tasks)
  ├─ Extract pattern: "Integration tasks = 3.5K avg"
  ├─ When TASK-150 (similar) arrives:
  │  └─ Estimate: 3.5K (based on archived pattern)
  └─ Archive older task to TASK_ARCHIVE.md
```

### 4. With Active Rule Learning

**ACTIVE_RULES.md:** Confirmed patterns (10/10 confidence)

**Compaction enables escalation:**
```
OBSERVATIONS.md Pattern:
  "User reads code before modifying" (8 confirmations)
  ↓
Automatic escalation:
  - Move to ACTIVE_RULES.md as Rule #4
  - Archive from OBSERVATIONS.md
  - Update MEMORY.md index
  ↓
Next session:
  - Rule #4 is in cached context (no token cost)
  - Applied automatically
```

### 5. With Multi-Agent System

**Orchestrator:** Routes to 5 agents (Search, Analysis, Code, Test, Review)

**Compaction helps agents by:**
- Giving Search Agent clean context (no old clutter)
- Providing Analysis Agent with escalated rules (not messy observations)
- Keeping Code Agent focused (no historical exploration)

**Workflow:**
```
Session 1:
  - 5 agents each use compressed context
  - Each saves 70-85% tokens
  - Observations accumulated

Session 2:
  - Compaction triggered at 100K tokens
  - Observations escalated/archived
  - Agents get fresher, cleaner context
  - More efficient multi-agent calls
```

### 6. With Model Selection

**Model routing:** Haiku/Sonnet/Opus based on task complexity

**Compaction improves routing by:**
- Providing historical token data (for estimation)
- Showing which tasks can use Haiku vs. Sonnet
- Identifying patterns that require Opus

**Workflow:**
```
Archive contains:
  - TASK-42: 2.8K actual tokens (estimated 3.5K)
  - TASK-102: 1.2K actual tokens (estimated 2K)
  - TASK-104: 1.5K actual tokens (estimated 4K)

New task similar to TASK-102:
  - Historical data: Haiku sufficient
  - Estimate: 1.5K tokens
  - Route: Haiku (save cost)
```

### 7. With Guardrails

**Guardrails:** 50+ rules preventing violations before code written

**Compaction helps by:**
- Archiving old guardrail violations
- Identifying patterns in violations
- Updating guardrail severity based on historical impact

**Workflow:**
```
Violation logged: "Hardcoded secret in auth handler"
  - Severity: CRITICAL
  - Session: 2026-03-22
  - Archived to violation log
  
Monthly review:
  - Found 3 similar violations (all critical)
  - Recommend: Add pre-commit hook
  - Action: Escalate to guardrails severity level
```

---

## Automatic Compression Workflow

### Full Example: Long Session

```
User: "Work on TASK-105 through TASK-110"
     ↓
Claude Code starts session
     ↓
Loads cached context (2K tokens, no charge)
- CLAUDE.md (1K)
- ACTIVE_RULES.md (0.5K)
- MEMORY.md index (0.5K)
     ↓
TASK-105: SMS scoring (7K tokens)
  Status: 9K tokens used
     ↓
TASK-106: Quebec alerts integration (12K tokens)
  Status: 21K tokens used
     ↓
TASK-107: Alert display component (10K tokens)
  Status: 31K tokens used
     ↓
TASK-108: Mobile responsive layout (8K tokens)
  Status: 39K tokens used
     ↓
TASK-109: Performance optimization (15K tokens)
  Status: 54K tokens used
     ↓
TASK-110: Testing & validation (18K tokens)
  Status: 72K tokens used
     ↓
TASK-111 starting...
  Status: 85K tokens used
     ↓
TASK-111 (12K tokens)
  Status: 97K tokens used
     ↓
Starting TASK-112... → Would exceed 100K

🚨 COMPACTION TRIGGERED 🚨

1. Pause before next API call
2. Inject: "Summarize session progress"
3. Claude generates summary:
   ```
   <summary>
   Completed Tasks:
   - TASK-105: SMS scoring ✓
   - TASK-106: Quebec alerts ✓
   - TASK-107: Alert UI ✓
   - TASK-108: Mobile layout ✓
   - TASK-109: Performance ✓
   - TASK-110: Testing ✓
   - TASK-111: Validation ✓
   
   In Progress: TASK-112 (auth system)
   
   Key decisions: Use Haiku for all, 5 files max/task
   Next: Finish TASK-112, start TASK-113
   </summary>
   ```
4. Archive original transcript
5. Replace with summary in context
6. Continue with clean 4K token context

TASK-112 now has 96K token capacity (room for 4 more tasks)
     ↓
TASK-112: Auth system (6K tokens)
  Status: 10K tokens used
     ↓
... continue normally
```

---

## Cost Impact

### Without Compaction (Single Session)
```
Tasks processed: 10
Tokens used: 250K (avg per task: 25K)
Cost: $0.75

Context becomes bloated:
- Old tool results
- Completed task details
- Exploration paths
- Test output
```

### With Compaction (Same Session)
```
Tasks processed: 10
Tokens used: 65K (avg per task: 6.5K, + 4K compressed summary)
Cost: $0.20

Context stays clean:
- Only active work
- Archived old details
- Compressed summaries
- Clean slate per compaction
```

**Savings:** 74% token reduction, 73% cost reduction

---

## Operational Checklist

### Session Setup
- [ ] Load cached stable context (CLAUDE.md, ACTIVE_RULES.md, MEMORY.md)
- [ ] Check settings.json compaction config (enabled, thresholds)
- [ ] Initialize token counter

### During Session
- [ ] Track token usage after each major operation
- [ ] Monitor for approaching thresholds (approaching 100K?)
- [ ] Watch for observation confirmations (5+ confirmations?)
- [ ] Check task completion (moving to archive?)

### Compaction Trigger (100K tokens)
- [ ] Pause before next API call
- [ ] Generate session summary
- [ ] Archive transcript
- [ ] Clear old context
- [ ] Continue with clean slate

### Post-Compaction
- [ ] Verify token count reset (4K-15K range)
- [ ] Verify summary accuracy (can resume work)
- [ ] Note compression ratio for metrics
- [ ] Continue work

### Session Completion
- [ ] Update DONE.md with completed tasks
- [ ] Move old tasks to TASK_ARCHIVE.md (if >10)
- [ ] Check observations for escalation
- [ ] Update CONTEXT_ARCHIVE.md with session summary
- [ ] Generate compaction report (if monthly)

---

## Monitoring Dashboard (Mental Model)

```
Session Metrics                    Compaction Status
───────────────────────────────    ──────────────────
Tokens used:        95K / 100K     ⚠️  Near threshold
Tasks completed:    7              ✓  On track
Observations:       3              ✓  Being tracked
In DONE.md:         4              ✓  Under limit
In archive:         0              —  Will start soon

Next Actions:
1. Complete TASK-105 (7K tokens)
2. COMPACTION TRIGGER
3. Continue with TASK-106+
```

---

## Related Documentation

- **COMPACTION.md** - System documentation
- **CONTEXT_ARCHIVE.md** - Session transcript index
- **OBSERVATION_ARCHIVE.md** - Archived observations
- **TASK_ARCHIVE.md** - Archived completed tasks
- **settings.json** - Compaction configuration
- **utils/compress-context.js** - Implementation utilities
