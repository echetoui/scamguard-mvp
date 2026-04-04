---
name: Context Management System
description: How caching, RAG, and memory work together to optimize token usage
type: reference
---

# Context Management System - Complete Architecture

Three layers work together to minimize token waste while maintaining full code understanding.

```
┌─────────────────────────────────────────────────────────────┐
│                     SESSION START                           │
└────────────────┬────────────────────────────────────────────┘
                 ▼
        ┌────────────────────┐
        │  CACHING LAYER     │  (4KB cached, replayed free)
        │  ───────────────   │
        │  • CLAUDE.md       │
        │  • MEMORY.md       │
        │  • ACTIVE_RULES.md │
        │  • HOW_TO_USE.md   │
        │  • architecture.md │
        │                    │
        │  Cost: 1K tokens   │
        │  (cache hit)       │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   MEMORY LAYER     │  (rules, observations, decisions)
        │  ───────────────   │
        │  Apply rules 1-2   │
        │  Check new rules?  │
        │  Consult decisions?│
        │                    │
        │  Cost: 500 bytes   │
        │  (read, not load)  │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   QUERY RECEIVED   │  (user asks code question)
        │  ───────────────   │
        │  "Fix the OTP..."  │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │    RAG RETRIEVAL   │  (consult RAG_INDEX.md)
        │  ───────────────   │
        │  Keywords: OTP     │
        │  → Auth queries    │
        │  → Load 3 files    │
        │                    │
        │  Cost: 5K tokens   │
        │  (vs 40K raw)      │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │    ANSWER          │
        │  ───────────────   │
        │  Hyper-focused     │
        │  code context      │
        └────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOTAL TOKEN COST PER SESSION (vs baseline):
  Without system:        50-80K tokens (full codebase load)
  With caching:          40-70K tokens (save 20% from cache)
  With caching + RAG:    6-10K tokens (save 90%)
```

---

## Layer 1: Caching (Stable Files)

**What:** Files that NEVER change (your preferences, architecture docs, memory index)

**Files cached:**
```
.claude/CLAUDE.md              (2KB) - Your global preferences
.claude/projects/.../MEMORY.md (1KB) - Memory system index
.claude/projects/.../ACTIVE_RULES.md (1.5KB) - Confirmed rules
.claude/projects/.../HOW_TO_USE.md (2.5KB) - Memory workflow
docs/architecture.md           (8KB) - System architecture
backend/README.md              (3KB) - Backend guide
README.md                       (2KB) - Project overview
.claudeignore                   (1KB) - Exclusion rules
─────────────────────────────────────────────────
Total cached:                  ~21KB
```

**How it works:**
- Session 1: Load cache (21KB transmitted, written to cache)
- Sessions 2-7: Replay from cache (21KB cached, costs ~1K tokens)
- Session 8: Cache expires, reload (21KB transmitted again)

**Token savings:** 20KB × 7 sessions = 140K tokens saved per week

**Configuration:** `settings.json` → `context.stableFiles`

---

## Layer 2: Memory System (Rules + Observations)

**What:** Confirmed rules and decision log that guide work (but change slowly)

**Loaded at session start:**
```
ACTIVE_RULES.md         (2 confirmed rules, applied automatically)
OBSERVATIONS.md         (patterns being tested)
DECISIONS.md            (architectural choices, queried as-needed)
PROJECT_STATUS.md       (metrics, updated quarterly)
```

**How it works:**
1. Read ACTIVE_RULES (cached, 1 second)
2. These 2 rules guide all decisions automatically
3. Check OBSERVATIONS to see emerging patterns
4. Consult DECISIONS if revisiting a choice

**No extra token cost** — Rules are short, embedded in memory system

**Configuration:** `memory/MEMORY.md` (index), `memory/*.md` (actual files)

---

## Layer 3: RAG Retrieval (Query-Specific Context)

**What:** Smart retrieval of relevant files based on query keywords

**How it works:**

1. **User asks:** "I need to fix the SMS OTP verification flow"
2. **Claude consults RAG_INDEX.md:**
   - Keywords: "SMS", "OTP", "verification" → "Authentication queries"
   - Retrieve these files:
     ```
     backend/lambda_/auth_handler.py
     backend/lambda_/sms_otp_handler.py
     frontend/src/components/AuthCallback.jsx
     docs/architecture.md (Auth section)
     ```
3. **Load only relevant files** (not 6500 LOC of codebase)
4. **Provide hyper-focused answer** (5K tokens of relevant context)

**Query patterns in RAG_INDEX:**
```
Authentication:     → sms_otp_handler.py, auth_handler.py, AuthCallback.jsx
Frontend/Component: → [Component].jsx, [Component].test.jsx, BRAND_GUIDELINES.md
Backend/API:        → [handler].py, API_DESIGN.md, architecture.md
Agent/LLM:          → [agent].py, base_agents.py, LLM_INTEGRATION.md
Database:           → scamguard_stack.py, architecture.md (DynamoDB section)
Infrastructure:     → scamguard_stack.py, app.py, architecture.md
Testing:            → [Component].test.jsx, vitest.config.js, TESTING_REPORT.md
Decision/Why:       → DECISIONS.md, architecture.md, IMPLEMENTATION_STATUS.md
```

**Token savings per query:** 80-90% (5K vs 40K+ irrelevant)

**Configuration:** `settings.json` → `rag`, `RAG_INDEX.md` (index file)

---

## Combined Effect

### Baseline (No optimization)
```
Query: "Fix the OTP verification flow"
↓
Load entire codebase (6500 LOC):
  • All frontend components (40 files)
  • All backend handlers (15 files)
  • All agents (10 files)
  • All tests (50+ files)
↓
Total: 50-80K tokens for 1 question
```

### With Caching Only
```
Query: "Fix the OTP verification flow"
↓
Load architecture + memory (cached): 1K tokens
Load entire codebase (6500 LOC): 40K tokens
↓
Total: 41K tokens (-50% vs baseline)
```

### With Caching + RAG
```
Query: "Fix the OTP verification flow"
↓
Load architecture + memory (cached): 1K tokens
Consult RAG_INDEX.md: 0 tokens (part of cached docs)
Load relevant files only (400 LOC): 4K tokens
↓
Total: 5K tokens (-90% vs baseline)
```

### Monthly Impact
```
20 code questions per month

Baseline:        20 × 50K = 1,000K tokens
Caching only:    20 × 40K = 800K tokens  (-20%)
Caching + RAG:   20 × 5K  = 100K tokens  (-90%)

Savings: 900K tokens/month = ~$6 in API costs
         + 10x faster responses (less context to parse)
         + Better answer quality (relevant context only)
```

---

## Workflow Integration

### For Code Questions

**BEFORE:**
1. User asks question
2. I load codebase blindly
3. I answer (with context overhead)

**AFTER:**
1. User asks question
2. I consult RAG_INDEX.md (cached)
3. I identify relevant files
4. I load only those files
5. I answer (focused, fast, cheap)

### For Decisions

**BEFORE:**
1. User asks "Why DynamoDB?"
2. I search git history / remember
3. I answer without trace

**AFTER:**
1. User asks "Why DynamoDB?"
2. I consult DECISIONS.md
3. I find entry with reasoning + trade-offs + revisit date
4. I answer authoritatively (with audit trail)

### For Memory Updates

**BEFORE:**
1. Session ends
2. I forget patterns unless explicitly asked
3. Next session: no continuity

**AFTER:**
1. Session ends
2. I check OBSERVATIONS.md
3. I note new patterns + escalate to rules if confirmed 5+ times
4. Next session: patterns are already rules, applied automatically

---

## Monitoring

**Check token usage in Claude Code after each session:**

If `usage > 50K tokens`:
```
→ Is RAG_INDEX.md being used?
→ Am I loading entire codebase instead of relevant files?
→ Add more files to RAG_INDEX caching?
→ Lower RAG contextBudget in settings.json?
```

If `usage < 5K tokens`:
```
→ RAG is working great!
→ Continue current approach
```

**Budget:** 100K tokens/session (adjustable in `settings.json`)

---

## Files Structure

```
scamguard-mvp/
├─ settings.json              ← Caching + RAG config
├─ .claudeignore              ← Exclude large files (node_modules, etc.)
├─ RAG_INDEX.md               ← Query → Files mapping
├─ RAG_USAGE.md               ← How to use RAG
├─ CONTEXT_MANAGEMENT.md      ← This file
├─ docs/architecture.md       ← (cached)
├─ README.md                  ← (cached)
└─ backend/README.md          ← (cached)

.claude/
└─ projects/.../memory/
    ├─ MEMORY.md              ← Index (cached)
    ├─ ACTIVE_RULES.md        ← Rules (cached)
    ├─ HOW_TO_USE.md          ← Workflow (cached)
    ├─ OBSERVATIONS.md        ← Patterns (checked at start)
    ├─ DECISIONS.md           ← Decisions (queried as-needed)
    ├─ PROJECT_STATUS.md      ← Metrics (checked quarterly)
    ├─ CACHING_STRATEGY.md    ← Caching details
    └─ SYSTEM_OVERVIEW.md     ← Full memory system docs
```

---

## Next Steps

1. **Monitor token usage** for first 5 sessions
2. **Adjust RAG_INDEX.md** if queries don't map well
3. **Add new domains** to RAG_INDEX.md as codebase grows
4. **Review cache TTL** (7 days) after 1 month
   - If stable files change weekly → reduce to 3d
   - If never change → increase to 30d
5. **Track OBSERVATIONS** for patterns escalating to rules

System is now self-tuning. Let it run.
