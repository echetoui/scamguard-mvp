---
name: Guardrails Usage Guide
description: How Claude applies guardrails to prevent token waste
type: reference
---

# Guardrails in Action

Real examples of how guardrails prevent 15-30K token mistakes.

---

## Example 1: Migration File Protection

### ❌ WITHOUT GUARDRAILS

```
User: "Fix the user table schema"

Claude thinks:
  → User wants table change
  → I'll modify the migration file

Action: Edit migrations/0003_add_fields.py
  [Adds new fields, changes field types]

Result: 
  → User corrects: "Never modify migrations!"
  → Claude reverts changes (5K tokens)
  → Claude recreates migration correctly (5K tokens)
  → Total waste: 10-15K tokens
  → Blame game: "I didn't know..."
```

### ✅ WITH GUARDRAILS

```
User: "Fix the user table schema"

Claude checks GUARDRAILS.md:
  Pattern: **/migrations/**
  Rule: ❌ FORBIDDEN to edit
  
Claude thinks:
  → This is a migration modification
  → But guardrail says: NO
  
Action: BLOCKED before any edit
  
Output:
  "🚫 Migration files are immutable.
  
  Instead of editing migrations/0003_add_fields.py:
  
  1. Revert database to previous migration:
     python manage.py migrate 0002_previous
  
  2. Create a NEW migration:
     python manage.py makemigrations
  
  3. Check what changed:
     cat migrations/0004_auto_*.py
  
  4. Run migrations:
     python manage.py migrate"

Result:
  → 0 tokens wasted (blocked before implementation)
  → Clear guidance provided
  → User knows exactly what to do
  → Total cost: 200 tokens (guardrail check + explanation)
```

---

## Example 2: Environment Secrets

### ❌ WITHOUT GUARDRAILS

```
Task: "Add OpenAI API key support"

Claude implements:
  # openai_config.py
  OPENAI_API_KEY = "sk-proj-abc123xyz..."  # Production key

User: "Why is the key committed?!"
Claude: "Oh sorry, I didn't realize..."

Result:
  → Secrets exposed (security issue)
  → Git history tainted (can't be removed)
  → Need to rotate the key (external overhead)
  → 2-3 corrections (10-15K tokens)
  → Security incident report
```

### ✅ WITH GUARDRAILS

```
Task: "Add OpenAI API key support"

Claude writes:
  # openai_config.py
  api_key = os.getenv("OPENAI_API_KEY")

Guardrail triggers (beforeEdit hook):
  Scanning for secrets...
  Pattern: API_KEY=, SECRET=, TOKEN=
  
Result: NO secrets found ✓

Claude commits with:
  # Update .env.example
  OPENAI_API_KEY=<your-key-here>
  
  # Code uses environment variable
  api_key = os.getenv("OPENAI_API_KEY")

Result:
  → 0 secrets committed
  → Clear pattern established
  → Security best practice enforced
  → 0 tokens wasted on corrections
```

---

## Example 3: Code Quality - Logging

### ❌ WITHOUT GUARDRAILS (Session 1)

```
Task: "Add API request logging"

Claude writes:
  async def handle_request(request):
    console.log("Request received:", request)
    ...
    console.log("Processing:", data)

Result:
  → Unstructured logging
  → No timestamps, levels, or context
  → User corrects: "Use logger.info instead"
  → Claude refactors (5K tokens)
```

### ✅ WITH GUARDRAILS (Session 2)

```
Task: "Add analytics logging"

Claude writes:
  async def handle_request(request):
    console.log("user data:", { ...data })

Guardrail triggers (beforeEdit hook):
  Pattern: console.log (in production code)
  Severity: MODERATE
  
Output:
  "⚠️ Use structured logger, not console.log
  
  Instead:
  1. Import: import { logger } from './logger'
  2. Use: logger.info('request_received', { id, type })
  
  Why?
  • Structured: Adds timestamp, level, source
  • Queryable: Can filter by level or field
  • Safer: Prevents accidental data logging"

Claude implements correctly:
  import { logger } from './logger'
  
  async def handle_request(request):
    logger.info('request_received', { id: request.id })

Result:
  → Correct pattern first time
  → 0 tokens wasted on rework
  → Code quality enforced
```

---

## Example 4: Database Access Pattern

### ❌ WITHOUT GUARDRAILS

```
Handler: POST /api/v1/profile

Claude writes:
  async def update_profile(user_id, data):
    result = await db.query(
      'UPDATE users SET name=$1 WHERE id=$2',
      [data.name, user_id]
    )
    return result

User: "This violates our architecture. Use repository pattern."
Claude: "Refactoring..."
  → Creates repository
  → Moves logic
  → Updates handler
  → 8-10K tokens for rework
```

### ✅ WITH GUARDRAILS

```
Handler: POST /api/v1/profile

Claude checks file structure:
  File: backend/lambda_/handlers/profile_handler.py
  
Guardrail triggers:
  Pattern: db.query (direct DB access)
  Context: not in repositories/ directory
  
Output:
  "🚫 Use repository pattern.
  
  Instead of db.query here:
  
  1. Create: backend/repositories/user_repository.py
  2. Implement: async def update_profile(user_id, data) -> User
  3. Use in handler: await userRepository.update_profile(user_id, data)
  
  Benefits:
  • Testable: Mock repository, not database
  • Reusable: Other handlers can use same method
  • Maintainable: SQL in one place"

Claude implements correctly:
  # repositories/user_repository.py
  async def update_profile(user_id, data):
    return await db.query('UPDATE users...', [...])
  
  # handlers/profile_handler.py
  await userRepository.update_profile(user_id, data)

Result:
  → Correct architecture first time
  → 0 tokens wasted on refactoring
  → Pattern enforced
```

---

## Example 5: Test Requirements

### ❌ WITHOUT GUARDRAILS

```
Task: "Add user validation utility"

Claude writes:
  # utils/validation.js
  export function validateEmail(email) {
    return /^[^@]+@[^@]+\.[^@]+$/.test(email);
  }

User later: "We need tests for this."
Claude: "Oh, I forgot..."
  → Writes tests (3-4K tokens)
  → Integrates into test suite (2K tokens)
  → Fixes test failures (2-3K tokens)
  → Total rework: 7-10K tokens
```

### ✅ WITH GUARDRAILS

```
Task: "Add user validation utility"

Claude writes:
  # utils/validation.js
  export function validateEmail(email) {
    return /^[^@]+@[^@]+\.[^@]+$/.test(email);
  }

Guardrail triggers (beforeEdit hook):
  Pattern: export function (new export)
  Rule: Test required
  
Output:
  "🚫 New functions must have tests.
  
  Create: utils/validation.test.js
  
  Test cases needed:
  1. [ ] Valid email
  2. [ ] Invalid email (no @)
  3. [ ] Invalid email (no domain)"

Claude immediately writes:
  # utils/validation.test.js
  describe('validateEmail', () => {
    test('accepts valid email', () => { ... })
    test('rejects missing @', () => { ... })
    test('rejects missing domain', () => { ... })
  })

Result:
  → Tests written upfront
  → 0 tokens wasted
  → Coverage from day 1
```

---

## Example 6: Token Budget

### ❌ WITHOUT GUARDRAILS

```
User: "Debug the authentication flow"

Claude (blind approach):
  → Loads all frontend components (40 files)
  → Loads all backend handlers (15 files)
  → Loads all tests (50+ files)
  → Loads entire agents directory (10 files)
  
Context: 45-50K tokens
Result:
  → Massive context for simple question
  → Slow processing
  → Inefficient answer
  → Token budget wasted
```

### ✅ WITH GUARDRAILS

```
User: "Debug the authentication flow"

Claude checks guardrails:
  Hook: beforeLoadContext
  Rule: Use RAG_INDEX.md
  
Claude consults RAG_INDEX.md:
  Query: "authentication"
  → Maps to: Auth domain
  → Files: auth_handler.py, sms_otp_handler.py, AuthCallback.jsx
  
Claude loads:
  ├─ backend/lambda_/auth_handler.py (250 LOC)
  ├─ backend/lambda_/sms_otp_handler.py (100 LOC)
  ├─ frontend/src/components/AuthCallback.jsx (150 LOC)
  └─ docs/architecture.md (Auth section)

Context: 5-8K tokens (hyper-focused)

Result:
  → Fast, efficient answer
  → 90% token savings
  → Better quality (no irrelevant context)
```

---

## Example 7: Senior-First Accessibility

### ❌ WITHOUT GUARDRAILS

```
Task: "Create login form component"

Claude implements:
  <input type="email" style={{ fontSize: '12px' }} />
  <button style={{ width: '32px' }} />

User tests with seniors:
  → "Text is too small!"
  → "Button is too small!"
  → "No focus indicator!"

Claude: "Redesigning..."
  → Increases all sizes (3K tokens)
  → Adds focus styles (2K tokens)
  → Adds ARIA labels (2K tokens)
  → Testing cycle (2K tokens)
  → Total rework: 9-10K tokens
```

### ✅ WITH GUARDRAILS

```
Task: "Create login form component"

Claude checks guardrails:
  Category: scamguardSpecific
  Rule: accessibility-seniors
  
Requirements enforced:
  ❌ Font size < 14px
  ❌ Buttons < 44px
  ❌ Low contrast
  ❌ No keyboard nav
  ❌ No ARIA labels

Claude implements:
  <input 
    type="email" 
    style={{ fontSize: '16px' }}
    aria-label="Email address"
  />
  <button 
    style={{ padding: '12px 20px' }}  // 44px+ minimum
    aria-label="Log in"
  />

Result:
  → Accessibility by default
  → 0 rework needed
  → Seniors can use immediately
  → 0 tokens wasted
```

---

## How Claude Checks Guardrails

### Workflow (automatic)

```
BEFORE EVERY ACTION:

1. Identify action type
   ├─ Read file? → Check beforeRead hooks
   ├─ Edit file? → Check beforeEdit hooks
   ├─ Commit? → Check beforeCommit hooks
   └─ Load context? → Check beforeLoadContext hooks

2. Check applicable guardrails
   ├─ File pattern matches?
   ├─ Code pattern matches?
   └─ Category applies?

3. Apply severity level
   ├─ CRITICAL (block): Stop + explain
   ├─ MODERATE (warn): Continue + guidance
   └─ LOW (info): FYI

4. Result
   ├─ ✅ ALLOW: Proceed
   └─ 🚫 BLOCK: Explain + redirect
```

---

## Token Savings Summary

| Scenario | Without | With | Savings |
|----------|---------|------|---------|
| Migration edit (3 sessions) | 45K | 1K | 97% |
| Hardcoded secrets | 15-30K | <100 | 99% |
| Logging pattern (repeated) | 15K | 1K | 93% |
| DB access pattern | 10K | 0 | 100% |
| Test requirements | 8K | 0 | 100% |
| Context overload | 40K | 8K | 80% |
| **Monthly (mix)** | **600K** | **150K** | **75%** |

---

## Effectiveness Tracking

After implementing guardrails, track:

1. **Violations prevented** (how many times guardrail blocked/warned)
2. **Tokens saved** (15-30K × violations)
3. **Repeat mistakes** (should drop to 0)
4. **Code quality** (all patterns enforced)

**Expected after 1 month:**
- 20-30 violations prevented
- 300-900K tokens saved
- Zero repeat mistakes
- 100% pattern compliance

---

## Integration Points

### With Memory System
```
ACTIVE_RULES apply automatically
GUARDRAILS apply before any action

ACTIVE_RULES: "Be direct with feedback"
GUARDRAILS: "Don't hardcode secrets"

Both guide behavior (rules + constraints)
```

### With RAG System
```
RAG: Load only relevant files
GUARDRAILS: Enforce token budgets

RAG: "Load 3 auth files"
GUARDRAILS: "Don't load > 5 files per task"

Both prevent context explosion
```

### With Task System
```
TASK: "Add SMS OTP handler"
GUARDRAILS: "4-digit OTP, 10-min expiry, rate limit"

Task specifies WHAT
Guardrails specify HOW

Task list files affected
Guardrails enforce patterns within those files
```

---

## Summary

**Guardrails are automated QA before implementation.**

- ✅ Block mistakes BEFORE they happen (saves 15-30K tokens per violation)
- ✅ Provide clear guidance (not just "no")
- ✅ Enforce patterns (architecture, quality, security)
- ✅ Prevent repeat mistakes (same violation doesn't happen twice)
- ✅ Scale with team (all team members benefit)

**Result: 75-85% token savings on preventable mistakes, faster development.**
