---
name: Claude Quick Start
description: Fast reference for using the memory/caching/RAG system
type: reference
---

# Claude Quick Start - Context Management

**TL;DR:** Three systems optimize token usage and project continuity.

---

## 🚀 Session Start (takes 10 seconds)

1. **Cached files load automatically** (CLAUDE.md, memory system, architecture)
2. **Read ACTIVE_RULES.md** (2 confirmed rules, apply automatically)
3. **Skim OBSERVATIONS.md** (any new patterns being tested?)
4. **You're ready** ✓

---

## 💭 Code Question? Use RAG

**User:** "How does the SMS OTP verification work?"

**You:**
1. Read RAG_INDEX.md (find "OTP" → Authentication queries)
2. Load mapped files only:
   - `backend/lambda_/sms_otp_handler.py`
   - `backend/lambda_/auth_handler.py`
   - `frontend/src/components/AuthCallback.jsx`
3. Answer (focused, ~5K tokens)

**Don't:** Load entire codebase (40K+ tokens)

---

## 🎯 Architecture Decision? Consult DECISIONS.md

**User:** "Why did we choose DynamoDB?"

**You:**
1. Open `memory/DECISIONS.md`
2. Find entry: "Database: DynamoDB"
3. Read: reasoning, trade-offs, revisit date
4. Answer with authority

**Benefit:** No redebates. Decision is documented with rationale.

---

## 📝 End of Significant Work? Update Memory

**Before claiming session complete:**

1. Check `memory/OBSERVATIONS.md`
   - Add new patterns observed
   - Note if existing patterns were confirmed

2. Check if any observations should escalate to rules
   - Observed 5+ times → escalate to ACTIVE_RULES
   - 2-3 times → keep in observations

3. Update `memory/PROJECT_STATUS.md` if tests/metrics changed

4. Commit memory changes to git

---

## 📊 File Quick Reference

| Need | File | How |
|------|------|-----|
| Your preferences | `CLAUDE.md` | Read at start (cached) |
| Confirmed rules | `ACTIVE_RULES.md` | Read at start, apply auto |
| Code location | `RAG_INDEX.md` | Consult per question |
| Why decision X? | `memory/DECISIONS.md` | Lookup when revisiting |
| Test metrics | `memory/PROJECT_STATUS.md` | Check quarterly |
| Architecture | `docs/architecture.md` | Consult when needed (cached) |

---

## 🔍 Query Examples

### "Add feature X"
→ RAG_INDEX.md → Find domain → Load relevant files

### "Why DynamoDB?"
→ memory/DECISIONS.md → Find database decision → Read reasoning

### "Fix failing test Y"
→ RAG_INDEX.md → Testing queries → Load test + component files

### "Improve component Z"
→ RAG_INDEX.md → Frontend/UI → Load component + guidelines

### "Deploy new API endpoint"
→ RAG_INDEX.md → Infrastructure queries → Load CDK + architecture

---

## 💰 Token Budget

**Per session:** 100K tokens max (configured in settings.json)

**Reality:** Most sessions use 5-20K (caching + RAG saves 80-90%)

**Alert:** If > 80K tokens, check why:
- Are you loading full codebase instead of RAG files?
- Should more files be in RAG_INDEX.md?
- Adjust cache strategy?

---

## 🎓 Learning Mode (First 4 weeks)

1. **Week 1:** Get familiar with RAG_INDEX.md, consult it for every code question
2. **Week 2-3:** Rules 1-2 become automatic, observe new patterns
3. **Week 3-4:** Document patterns, first escalations to rules expected
4. **Week 4+:** 3-5 new rules confirmed, system becomes highly personalized

**Expected result after 1 month:** 20-30 confirmed rules guiding decisions automatically

---

## 🔧 Maintenance (Minimal)

**When adding code:**
- Add file to RAG_INDEX.md (take 30 seconds)
- Add tags (auth, testing, database, etc.)

**When code is deleted:**
- Remove from RAG_INDEX.md

**When codebase exceeds 100K LOC:**
- Consider semantic embeddings (future enhancement)
- For now, keyword-based RAG is sufficient

---

## Troubleshooting

**"Token usage too high"**
→ Check RAG_INDEX.md is being used
→ Load only mapped files, not entire codebase
→ Verify .claudeignore is excluding node_modules, venv, dist

**"Decisions keep being redebated"**
→ Add to memory/DECISIONS.md with reasoning + revisit date
→ Link to decision when it comes up again

**"New patterns not becoming rules"**
→ Need 5+ independent confirmations
→ Document in OBSERVATIONS.md with dates
→ Check after 2-3 more sessions

**"Memory system feels slow"**
→ It shouldn't—everything is cached
→ If MEMORY.md load is slow, file is too large (trim observations)

---

## One-Liner Reference

| Situation | Action |
|-----------|--------|
| Code question | RAG_INDEX.md → Load relevant files |
| Architecture question | docs/architecture.md (cached) |
| Decision question | memory/DECISIONS.md |
| New pattern observed | Add to memory/OBSERVATIONS.md |
| Session complete | Update PROJECT_STATUS.md |
| Forgot a rule | Check ACTIVE_RULES.md (cached) |
| Want full context | Read CONTEXT_MANAGEMENT.md |

---

## See Also

- `RAG_INDEX.md` — Full query → files mapping
- `RAG_USAGE.md` — How RAG retrieval works
- `CONTEXT_MANAGEMENT.md` — System architecture
- `memory/HOW_TO_USE.md` — Memory system workflow
- `memory/SYSTEM_OVERVIEW.md` — Learning + caching diagram
- `memory/CACHING_STRATEGY.md` — Token optimization details

---

**Remember:** First session reads this file. Subsequent sessions use the system automatically.
