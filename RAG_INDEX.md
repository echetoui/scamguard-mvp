---
name: Codebase RAG Index
description: Semantic index for retrieval-augmented context loading
type: reference
---

# RAG Index - ScamGuard MVP

Maps queries to relevant files. Use this to retrieve context instead of loading entire codebase.

---

## 🗂️ Domain Organization

### FRONTEND (React + Vite + Testing)
**Files:** `frontend/src/` (React components, tests, styles)

**Key components:**
| Component | Files | Purpose | When to load |
|-----------|-------|---------|--------------|
| **Dashboard** | Dashboard.jsx, Dashboard.test.jsx | Main UI | "show dashboard code" |
| **Auth** | AuthCallback.jsx, LoginFlow.jsx, OTP*.jsx | SMS OTP flows | "auth flow", "SMS verification" |
| **Quiz** | QuizModule.jsx, QuizModule.test.jsx | Training scenarios | "quiz", "training module" |
| **Admin** | AdminDashboard.jsx, UserManagement.jsx | Admin panel | "admin", "user management" |
| **Onboarding** | OnboardingWizard.jsx | First-run setup | "onboarding" |
| **Threats** | ThreatsHandler.jsx, SMSSimulator.jsx | Threat display | "threats", "SMS simulator" |
| **Tests** | src/**/__tests__/*.test.jsx | Unit tests | "tests", "coverage" |

**Config files:**
- `vite.config.js` — Build configuration
- `package.json` — Dependencies (React 18, Vite, Vitest, Playwright)
- `vitest.config.js` — Test runner config
- `playwright.config.js` — E2E test config

**When to load:**
- "Fix component rendering" → Load component + .test.jsx
- "Debug test failures" → Load test file + component
- "Check styling" → Load component CSS + ACCESSIBILITY_GUIDELINES.md
- "Improve UI" → Load component + BRAND_GUIDELINES.md

---

### BACKEND (Python Lambda + Agents)
**Files:** `backend/lambda_/` (HTTP handlers), `backend/agents/` (LLM agents)

**Core handlers:**
| Handler | File | Purpose | When to load |
|---------|------|---------|--------------|
| **Auth** | auth_handler.py | SMS OTP, signup, login | "authentication", "SMS OTP" |
| **SMS OTP** | sms_otp_handler.py, verify_otp_handler.py | OTP request/verify | "OTP flow", "SMS verification" |
| **Scenario** | scenario_handler.py | Training scenarios | "scenarios", "training" |
| **Analysis** | analysis_handler.py | Image vision analysis | "image analysis", "vision" |
| **Threats** | threats_handler.py | Threat data | "threats", "fraud alerts" |
| **Analytics** | analytics_handler.py | User analytics | "analytics", "user stats" |

**LLM Agents:**
| Agent | File | Purpose | When to load |
|-------|------|---------|--------------|
| **ScenarioAgent** | scenario_agent_with_compliance.py | Generate training scenarios | "scenario generation" |
| **AnalyticsAgent** | analytics_agent_with_compliance.py | Analyze user behavior | "analytics", "user insights" |
| **CoachingAgent** | coaching_agent_with_compliance.py | Personalized feedback | "coaching", "recommendations" |
| **DetectionAgent** | detection_agent_with_compliance.py | Scam detection logic | "detection", "analysis" |
| **ThreatAnalyst** | threat_analyst.py | Threat intelligence | "threats", "fraud" |

**Base utilities:**
- `base_agents.py` — LLM SDK wrappers, error handling
- `handler_llm.py` — Lambda entry point, routing
- `utils/` — Helper functions

**When to load:**
- "Fix OTP flow" → Load auth_handler.py + sms_otp_handler.py
- "Improve scenario generation" → Load scenario_agent_with_compliance.py
- "Debug image analysis" → Load analysis_handler.py + base_agents.py
- "Add new agent" → Load base_agents.py, existing agent (ex: scenario_agent), study pattern

---

### INFRASTRUCTURE (AWS CDK)
**Files:** `backend/cdk/` (Infrastructure as Code)

**Core stacks:**
| Stack | File | Purpose | When to load |
|-------|------|---------|--------------|
| **ScamGuardStack** | stacks/scamguard_stack.py | Main resources (Lambda, DynamoDB, S3, API Gateway) | "infrastructure", "deployment", "AWS setup" |
| **AgentsStack** | stacks/agents_stack.py | Agent layer, orchestration | "agents infrastructure" |

**Config:**
- `app.py` — CDK app entry point
- `requirements.txt` — Backend dependencies (boto3, openai, google-generativeai)

**When to load:**
- "Deploy new resource" → Load scamguard_stack.py
- "Add Lambda function" → Load scamguard_stack.py, check pattern
- "Change DynamoDB" → Load scamguard_stack.py (search for DynamoDB table)
- "Modify API routes" → Load scamguard_stack.py (search for API Gateway)

---

### DATABASE (DynamoDB)
**Schema location:** `docs/architecture.md` (section "DYNAMODB TABLE")

**Tables:**
- **ScamGuardData** (main) — Users, profiles, analytics
- **ScamGuardOTP** (TTL) — OTP tokens, auto-expire after 10 min

**When to load:**
- "Query schema" → Load docs/architecture.md
- "Change table structure" → Load scamguard_stack.py + docs/architecture.md
- "Debug DynamoDB issue" → Load handler + scamguard_stack.py

---

### DOCUMENTATION (Architecture, Decisions, Guides)
**Files:** `docs/`, `README.md`, decision journal

**Key docs:**
| Doc | File | When to load |
|-----|------|--------------|
| Architecture | docs/architecture.md | "How does the system work?" |
| API Design | backend/API_DESIGN.md | "API endpoints", "request format" |
| Compliance | backend/COMPLIANCE.md | "GDPR", "privacy", "data handling" |
| LLM Integration | backend/LLM_INTEGRATION.md | "LLM setup", "API keys" |
| Performance | backend/PERFORMANCE.md | "Optimization", "benchmarks" |
| Accessibility | frontend/src/accessibility/ACCESSIBILITY_GUIDELINES.md | "Accessibility", "seniors UX" |

---

## 🔍 Query → Files Mapping

### Authentication queries
**Query keywords:** "auth", "login", "SMS", "OTP", "signup", "email verification"

**Load files:**
```
backend/lambda_/auth_handler.py
backend/lambda_/sms_otp_handler.py
backend/lambda_/verify_otp_handler.py
frontend/src/components/AuthCallback.jsx
frontend/src/components/LoginFlow.jsx
docs/architecture.md (Auth section)
```

### Frontend/UI queries
**Query keywords:** "component", "rendering", "UI", "style", "accessibility", "test"

**Load files:**
```
frontend/src/components/[ComponentName].jsx
frontend/src/components/__tests__/[ComponentName].test.jsx
frontend/src/styles/COLOR_TYPOGRAPHY_STANDARD.md
frontend/src/accessibility/ACCESSIBILITY_GUIDELINES.md
BRAND_GUIDELINES.md
```

### Backend/API queries
**Query keywords:** "endpoint", "handler", "API", "request", "response", "Lambda"

**Load files:**
```
backend/lambda_/[handler_name].py
backend/API_DESIGN.md
docs/architecture.md (API section)
backend/README.md
```

### Agent/LLM queries
**Query keywords:** "agent", "LLM", "scenario", "analysis", "coaching", "detection"

**Load files:**
```
backend/agents/[agent_name].py
backend/agents/base_agents.py
backend/LLM_INTEGRATION.md
DECISIONS.md (decision 5: LLM strategy)
```

### Database queries
**Query keywords:** "database", "DynamoDB", "table", "schema", "query"

**Load files:**
```
backend/cdk/stacks/scamguard_stack.py
docs/architecture.md (DynamoDB section)
backend/README.md (data model)
```

### Infrastructure/Deployment queries
**Query keywords:** "deploy", "AWS", "CDK", "infrastructure", "stack", "config"

**Load files:**
```
backend/cdk/stacks/scamguard_stack.py
backend/cdk/stacks/agents_stack.py
backend/cdk/app.py
docs/architecture.md
DECISIONS.md (decision 6: AWS)
```

### Testing queries
**Query keywords:** "test", "coverage", "E2E", "unit test", "Vitest", "Playwright"

**Load files:**
```
frontend/src/__tests__/[ComponentName].test.jsx
frontend/tests/e2e/
vitest.config.js
playwright.config.js
TESTING_REPORT_PHASE3.md
```

### Decision/Architecture queries
**Query keywords:** "why", "decision", "trade-off", "choice", "architecture", "design"

**Load files:**
```
DECISIONS.md
docs/architecture.md
IMPLEMENTATION_STATUS.md
memory/DECISIONS.md
```

---

## 🎯 RAG Workflow

1. **User query:** "How do I add a new SMS validation step?"

2. **Map to domain:**
   - Keywords: "SMS", "validation" → Auth domain
   - Secondary: "add" → Code change needed

3. **Retrieve files:**
   - `backend/lambda_/auth_handler.py`
   - `backend/lambda_/sms_otp_handler.py`
   - `frontend/src/components/AuthCallback.jsx`
   - `docs/architecture.md` (Auth section)

4. **Load only what's needed** (not entire codebase)

5. **Provide targeted context** for the question

---

## 📊 File Metadata

**For each file Claude needs:**
- **Size:** LOC (use to decide if entire file fits in context)
- **Frequency:** How often queried (cache hot files)
- **Category:** Frontend/Backend/Infrastructure/Docs
- **Tags:** Semantic labels for search

| File | Lines | Category | Tags | Notes |
|------|-------|----------|------|-------|
| auth_handler.py | 250+ | Backend | auth, signup, OTP | Core auth logic |
| sms_otp_handler.py | 100+ | Backend | auth, SMS, OTP | OTP generation |
| scenario_agent_with_compliance.py | 200+ | Backend | agent, LLM, scenarios | Scenario generation |
| AuthCallback.jsx | 150+ | Frontend | auth, component, test | SMS OTP UI |
| QuizModule.jsx | 400+ | Frontend | component, test, quiz | Training module |
| scamguard_stack.py | 300+ | Infrastructure | CDK, Lambda, DynamoDB | Main infrastructure |
| architecture.md | 500+ | Documentation | architecture, design | System overview |

---

## 🚀 How to Use This Index

**When asking for code help:**

Instead of: "Show me the auth code"
Use: "I need to modify the SMS OTP timeout logic"

**I will:**
1. Read this RAG_INDEX.md
2. Find "OTP" keyword → "Authentication queries"
3. Load only: sms_otp_handler.py + auth_handler.py
4. Provide focused help

**Benefits:**
- ✅ 80% less context overhead (load only relevant files)
- ✅ Faster responses (fewer tokens to process)
- ✅ Better precision (context is directly relevant)
- ✅ Scales with codebase growth (index grows, not context window)

---

## Maintenance

**When adding new files/features:**
1. Add file to appropriate Domain section
2. Add tags
3. Update Query → Files mapping if new query pattern

**When files are deleted/renamed:**
1. Remove from index
2. Update Query → Files mappings

Keep this index current so RAG retrieval stays accurate.
