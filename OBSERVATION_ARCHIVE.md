---
name: Observation Archive
description: Archived observations and escalated patterns to ACTIVE_RULES
type: reference
---

# Observation Archive

**Purpose:** Observations with <5 confirmations or >4 weeks old are archived here.

**Escalation Rule:** When an observation reaches 5 confirmations, it becomes an ACTIVE_RULE. See ACTIVE_RULES.md for confirmed rules.

---

## Escalated to ACTIVE_RULES

### Rule #1: Direct, Honest Feedback
**Original Observation:** User values direct, candid feedback over polite hedging  
**Confirmations:** 10 (across 8 sessions)  
**Escalated:** 2026-04-04  
**Evidence:** Multiple instances where user corrected over-explanatory responses  
**Current Status:** Active in ACTIVE_RULES.md

### Rule #2: Read Code First
**Original Observation:** Always read the file before suggesting modifications  
**Confirmations:** 8 (across 6 sessions)  
**Escalated:** 2026-04-04  
**Evidence:** Pattern of user feedback when Claude suggests changes without reading  
**Current Status:** Active in ACTIVE_RULES.md

---

## Legacy Observations (Not Escalated)

These observations have fewer than 5 confirmations or are older than 4 weeks without escalating:

### Observation: User Prefers Architecture Before Implementation
**Dates Created:** 2026-03-25  
**Confirmations:** 2  
**Last Confirmed:** 2026-04-02  
**Reason Not Escalated:** Insufficient confirmations (need 5)  
**Evidence:**
- 2026-03-28: User asked to plan before coding (CLAUDE.md creation)
- 2026-04-02: User approved planning approach for multi-agent system

**Status:** Still under observation. Promote to ACTIVE_RULES if 3 more confirmations occur.

### Observation: Pragmatism Over Completeness
**Date Created:** 2026-04-04  
**Confirmations:** 1  
**Last Confirmed:** 2026-04-04  
**Reason Not Escalated:** New observation, tracking early  
**Evidence:**
- User chose to implement model selection without exhaustive testing framework

**Status:** Early-stage pattern. Monitor in next 3 sessions.

---

## Archive Maintenance Log

| Date | Action | Observation | Confirmations |
|------|--------|-------------|---------------|
| 2026-04-04 | Escalated | Direct, Honest Feedback | 10 → ACTIVE_RULES #1 |
| 2026-04-04 | Escalated | Read Code First | 8 → ACTIVE_RULES #2 |
| 2026-04-04 | Monitored | Architecture Before Implementation | 2 (ongoing) |
| 2026-04-04 | Created | Pragmatism Over Completeness | 1 (new) |

---

## Escalation Criteria

**Automatic escalation occurs when:**
1. Observation receives 5+ confirmations across sessions
2. Pattern is actionable (applicable to future work)
3. User behavior is consistent (not a one-time preference)

**Manual escalation can occur when:**
1. Pattern is critical to project success
2. Early confirmations strongly indicate the pattern
3. User explicitly requests escalation

---

## When to Create Observations

→ See OBSERVATIONS.md in memory system for how observations are created and tracked.

---

## Related Documentation

- **ACTIVE_RULES.md** - Currently active confirmed rules (10/10 confidence)
- **OBSERVATIONS.md** - Active observations being tracked (tracking mode)
- **MEMORY.md** - Overall memory system index
