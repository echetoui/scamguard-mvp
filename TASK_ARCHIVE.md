---
name: Task Archive
description: Archived completed tasks (summary format for long-term reference)
type: reference
---

# Task Archive - Completed Items

**Purpose:** When DONE.md exceeds 10 completed tasks, older tasks are archived here in summarized format.

**Retention:** Last 10 tasks stay in DONE.md (detailed). Older tasks archived here (summary only).

---

## Current Status

**Total Completed Tasks:** 4  
**In DONE.md (detailed):** 4  
**In TASK_ARCHIVE (summary):** 0  

*Archive will start populating after 10+ completed tasks.*

---

## Archive Policy

### Detailed Tasks (DONE.md)
Keep last 10 completed tasks with full information:
- Task ID and title
- Completion date
- Files modified (list)
- Token estimate vs. actual
- Commit SHAs
- Notes on issues/gotchas

### Archived Tasks (This File)
Summarized to single-line entries:
- Task ID and title
- Completion date
- Files count
- Tokens (actual)
- Pattern/category

**Example:**
```
| TASK-42 | 2026-03-15 | 3 files | 2.8K | asyncauth ✓ |
```

---

## Archive Entries

*Currently empty. First archival will occur after task #11 is completed.*

---

## Task Patterns Extracted

When tasks are archived, patterns are extracted and tracked:

| Pattern | Example Tasks | Confidence |
|---------|--------------|-----------|
| **Backend/Auth** | TASK-42 (SMS OTP) | 1/10 |
| **Frontend/UI** | TASK-102 (React fix) | 1/10 |
| **Testing** | TASK-103 (ErrorBoundary) | 1/10 |
| **Data/Content** | TASK-104 (SMS scenarios) | 1/10 |

*More patterns will emerge as archive grows.*

---

## Monthly Archive Reports

### April 2026 (Week 1)

| Metric | Value |
|--------|-------|
| Tasks completed | 4 |
| Files modified | 12 |
| Total tokens | 5.5K |
| Avg tokens per task | 1.4K |
| Commit count | 3 |
| Test coverage | 95%+ |

---

## Archive Maintenance

### Weekly Scan
- Check if DONE.md > 10 tasks
- Move older tasks to archive
- Extract patterns

### Monthly Review
- Generate archive report
- Identify common patterns
- Update task categories

### Quarterly Cleanup
- Compress old archives
- Extract long-term patterns
- Update planning templates based on learnings

---

## Task Categories

Tasks are categorized for pattern tracking:

- **Backend** - Lambda handlers, CDK stacks, APIs
- **Frontend** - Components, styling, interactions
- **Testing** - Test coverage, test utilities
- **Data/Content** - Scenarios, configuration, docs
- **DevOps** - Deployment, CI/CD, infrastructure
- **Refactor** - Code cleanup, improvements
- **Bug Fix** - Issues, error handling
- **Integration** - Connecting systems

---

## Estimating from Archived Tasks

Once enough tasks are archived, Claude Code can use historical data to estimate:

```
New task similar to archived TASK-42:
  - Pattern: Backend/Auth
  - Historical avg tokens: 2.8K
  - Historical avg time: 45 minutes
  - Historical success rate: 100%
  
Estimate for new task: 2.5K tokens, 45 minutes
```

---

## Related Files

- **DONE.md** - Currently active completed tasks (detailed, last 10)
- **BACKLOG.md** - Tasks to be started
- **IN_PROGRESS.md** - Current task being worked on
- **MEMORY.md** - Memory system index
