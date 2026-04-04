---
name: RAG Usage Guide
description: How Claude uses RAG_INDEX.md for smart context retrieval
type: reference
---

# RAG Usage - Smart Context Retrieval

When codebase is too large, use RAG_INDEX.md to retrieve only relevant files instead of loading entire repo.

---

## The Problem RAG Solves

**Without RAG:**
```
User: "Fix the SMS OTP timeout issue"
↓
Claude: Loads entire codebase
  ├─ frontend/src (all 40+ components)
  ├─ backend/lambda_ (all 15+ handlers)
  ├─ backend/agents (all 10+ agents)
  └─ backend/cdk (infrastructure)
↓
Result: 50K+ tokens of irrelevant context for a 200-line change
```

**With RAG:**
```
User: "Fix the SMS OTP timeout issue"
↓
Claude: Consults RAG_INDEX.md
  ├─ Query keywords: "SMS", "OTP", "timeout"
  └─ Maps to: Authentication queries
↓
Claude: Loads only
  ├─ sms_otp_handler.py (100 LOC)
  ├─ auth_handler.py (250 LOC)
  └─ architecture.md (Auth section)
↓
Result: 5K tokens of hyper-relevant context
```

**Savings: 10x reduction in context overhead**

---

## How Claude Uses RAG

### Step 1: Parse Query
User: "I need to add rate limiting to the login endpoint"

Keywords identified: "rate", "login", "endpoint"

### Step 2: Consult RAG_INDEX.md
Look up "Authentication queries" section:
```
Load files:
├─ backend/lambda_/auth_handler.py
├─ backend/lambda_/sms_otp_handler.py
├─ backend/API_DESIGN.md
└─ docs/architecture.md (API section)
```

### Step 3: Retrieve Files
Load ONLY those files (not entire codebase)

### Step 4: Provide Context
Answer is now hyper-focused with minimal token waste

---

## Query Patterns

### Frontend Component Question
**Query:** "The QuizModule test is failing. What's wrong?"

**RAG_INDEX lookup:** "test", "QuizModule" → Frontend/UI queries
**Retrieve:**
```
frontend/src/components/QuizModule.jsx
frontend/src/components/__tests__/QuizModule.test.jsx
vitest.config.js
TESTING_REPORT_PHASE3.md
```

### Backend API Question
**Query:** "How does the analysis endpoint handle image uploads?"

**RAG_INDEX lookup:** "image", "analysis", "endpoint" → Backend/API queries
**Retrieve:**
```
backend/lambda_/analysis_handler.py
backend/API_DESIGN.md
docs/architecture.md (API section)
backend/lambda_/base_agents.py (for LLM calls)
```

### Database Question
**Query:** "What fields does the OTP table store?"

**RAG_INDEX lookup:** "OTP", "table", "database" → Database queries
**Retrieve:**
```
backend/cdk/stacks/scamguard_stack.py (OTP table definition)
docs/architecture.md (DynamoDB schema)
backend/lambda_/sms_otp_handler.py (usage example)
```

### Agent/LLM Question
**Query:** "How do I make the scenario agent more creative?"

**RAG_INDEX lookup:** "agent", "scenario", "LLM" → Agent/LLM queries
**Retrieve:**
```
backend/agents/scenario_agent_with_compliance.py
backend/agents/base_agents.py
backend/LLM_INTEGRATION.md
memory/DECISIONS.md (decision 5: LLM strategy)
```

### Architecture Question
**Query:** "Why did we choose DynamoDB over PostgreSQL?"

**RAG_INDEX lookup:** "why", "database" → Decision/Architecture queries
**Retrieve:**
```
memory/DECISIONS.md (decision 1: Database)
docs/architecture.md (DynamoDB section)
IMPLEMENTATION_STATUS.md
```

---

## When RAG Kicks In

### Always use RAG when:
- ✅ Asking about a specific feature/component
- ✅ Debugging a particular flow
- ✅ Modifying code in a specific domain
- ✅ Understanding architectural decisions

### Don't need RAG when:
- ❌ Asking about memory/rules (cached, not code)
- ❌ Asking conceptual questions about the project
- ❌ Reviewing entire feature (then load explicitly requested files)

---

## RAG Maintenance

### When files are added:
1. Add to RAG_INDEX.md under appropriate Domain
2. Add tags (auth, testing, database, etc.)
3. Update Query → Files mapping if new query pattern emerges

### When files are deleted:
1. Remove from RAG_INDEX.md
2. Update mappings

### When new feature is built:
1. Document in RAG_INDEX.md
2. Add query keywords
3. Map to retrieval files

---

## Token Budget Impact

**Without RAG:**
- Every question loads ~30-40K tokens of context
- Query-irrelevant code bloats response tokens

**With RAG:**
- Query loads only 5-10K tokens of relevant files
- Response token efficiency: 3-5x better

**Scaling:**
| Codebase Size | Without RAG | With RAG | Savings |
|---------------|------------|----------|---------|
| 10K LOC | 20K tokens | 5K tokens | 75% |
| 50K LOC | 40K tokens | 5K tokens | 87% |
| 100K LOC | 80K tokens | 5K tokens | 93% |

As codebase grows, RAG savings compound (context stays constant, codebase grows).

---

## Example: Real Query Flow

**Session: User asks "I need to debug the OTP verification flow"**

1. **I read RAG_INDEX.md** (cached, free)
2. **I identify:** Keywords = "OTP", "verification" → Authentication queries
3. **I retrieve:** sms_otp_handler.py, auth_handler.py, AuthCallback.jsx
4. **I load:** ~350 total LOC (vs 6500 if whole codebase)
5. **I answer:** 5K tokens of relevant context (vs 40K+ irrelevant)

**Result:** 8x token savings, better answer quality (context is focused)

---

## RAG + Caching Synergy

**Caching (files that NEVER change):**
- CLAUDE.md
- MEMORY.md
- ACTIVE_RULES.md
- Architecture standards

**RAG (files FREQUENTLY used together):**
- Auth handlers + auth tests
- Components + component tests
- Agents + agent tests

**Combined effect:**
- Caching eliminates context overhead (once per 7 days)
- RAG eliminates irrelevant code (per query)
- Together: 90%+ token savings vs baseline

---

## Next Phase: Semantic Search

If RAG_INDEX.md keyword matching becomes insufficient (>100K LOC codebase):

1. Add embeddings index (simple vector DB)
2. Convert code snippets to embeddings
3. Query-based semantic search instead of keyword matching
4. Even smarter retrieval

For now, **keyword + manual tagging** is sufficient and requires zero dependencies.
