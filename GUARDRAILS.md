---
name: Guardrails & Safety Barriers
description: Preventive hooks to stop token-wasting mistakes before they happen
type: reference
---

# Guardrails & Safety Barriers

Prevent common mistakes that waste 15-30K tokens in rework. 
**Violations caught BEFORE execution** (not after fixing).

---

## How It Works

```
ACTION REQUESTED
  ↓
GUARD CHECK
  ├─ Is this action allowed?
  ├─ Does it violate constraints?
  └─ Is there a better way?
  ↓
  ├─ ✅ ALLOW → Continue
  └─ 🚫 BLOCK → Explain + redirect
```

**Result:** Zero token waste on forbidden patterns. Clear guidance instead.

---

## Category 1: Immutable Files (CRITICAL)

**These files MUST NEVER be edited directly.**

### Rule: Migration Files (Python/Database)
```
Path pattern: **/migrations/**

❌ FORBIDDEN:
  • Edit migration files
  • Modify migration content
  • Delete migrations
  • Rename migrations

✅ ALLOWED:
  • CREATE new migrations (via makemigrations)
  • Review migrations (read-only)
  • Understand migration intent

REDIRECT:
  If modifying existing migration:
  "Never edit migrations directly.
   Instead:
   1. Revert the database: python manage.py migrate [previous]
   2. Create new migration: python manage.py makemigrations
   3. Review the new migration
   4. Run: python manage.py migrate"
```

### Rule: Environment Files
```
Path pattern: .env*, *.env

❌ FORBIDDEN:
  • Edit .env files
  • Commit .env files
  • Add secrets to code

✅ ALLOWED:
  • Edit .env.example (template)
  • Edit .env.local (local development, never commit)
  • Review .env structure

REDIRECT:
  If trying to commit .env:
  "Never commit environment files.
   Instead:
   1. Add sensitive key to .env.local (gitignored)
   2. Update .env.example with KEY_NAME= (no value)
   3. Document in README how to set the key"
```

### Rule: Lock Files
```
Path pattern: package-lock.json, yarn.lock, pnpm-lock.yaml, requirements.lock

❌ FORBIDDEN:
  • Manually edit lock files
  • Revert to old lock file versions
  • Merge lock file conflicts by hand

✅ ALLOWED:
  • Generate via package managers (npm install, poetry lock)
  • Review for security updates
  • Read to understand dependencies

REDIRECT:
  If modifying lock file:
  "Never edit lock files directly.
   They're generated.
   Instead:
   1. Modify package.json (or pyproject.toml)
   2. Run: npm install (or poetry lock)
   3. Lock file auto-updates"
```

### Rule: Git History Files
```
Path pattern: .git/**, COMMIT_EDITMSG, HEAD, refs/heads/*

❌ FORBIDDEN:
  • Edit git internal files
  • Modify commit history (except via git commands)
  • Force push without explicit authorization

✅ ALLOWED:
  • Use git commands (git commit, git reset)
  • Read git logs
  • Reference commits

REDIRECT:
  If attempting git history edit:
  "Use git commands, not file edits.
   Instead:
   1. For amending: git commit --amend
   2. For resetting: git reset --hard [commit]
   3. For reverting: git revert [commit]"
```

---

## Category 2: Secrets & Credentials (CRITICAL)

### Rule: No Hardcoded Credentials
```
Patterns: API_KEY=, SECRET=, PASSWORD=, TOKEN=

❌ FORBIDDEN:
  • Hardcode API keys in code
  • Add AWS credentials to config
  • Store auth tokens in repositories

✅ ALLOWED:
  • Use environment variables (from .env)
  • Reference secret manager (AWS Secrets Manager)
  • Document how to obtain credentials

REDIRECT:
  If hardcoding secrets:
  "Never commit credentials.
   Instead:
   1. Add to .env.local (gitignored)
   2. Reference via process.env.API_KEY
   3. Document in README:
      'Set API_KEY in .env.local'"
```

### Rule: No Console Logging of Secrets
```
Pattern: console.log(apiKey), logger.info(password)

❌ FORBIDDEN:
  • Log sensitive data (keys, tokens, passwords)
  • Expose PII in logs

✅ ALLOWED:
  • Log action taken (info level)
  • Log error messages (sanitized)
  • Log non-sensitive data

REDIRECT:
  If logging secrets:
  "Never log sensitive data.
   Instead:
   1. Mask secrets: logger.info('API call', { status })
   2. Use separate secret logger (write to secure location)
   3. Document what data is logged"
```

---

## Category 3: Code Quality (MODERATE)

### Rule: Logging Standard (TypeScript/JavaScript)
```
Pattern: console.log vs logger

❌ FORBIDDEN (in production code):
  • console.log() (unstructured)
  • console.error() (to stderr)
  • console.warn()
  • debugger statements

✅ ALLOWED (in tests):
  • console.log in *.test.js, *.spec.js
  • console.log in test utilities

✅ ALLOWED (production):
  • import { logger } from './logger'
  • logger.info('message', { data })
  • logger.error('error', { error, context })

REDIRECT:
  If using console.log in production:
  "Use structured logger.
   Instead:
   1. Import: import { logger } from './logger'
   2. Use: logger.info('action', { key: value })
   3. Logger auto-adds timestamp, level, context"
```

### Rule: Type Hints (Python)
```
Pattern: Function definitions

❌ FORBIDDEN:
  • def process(data):  (no type hints)
  • def fetch_users(ids):
  • return value without typing

✅ ALLOWED:
  • def process(data: dict) -> Result:
  • def fetch_users(ids: list[int]) -> list[User]:
  • Type: Optional[str] for nullable

REDIRECT:
  If missing type hints:
  "All functions must have type hints.
   Instead:
   1. Add parameter types: def func(x: int, y: str)
   2. Add return type: -> bool
   3. Use Optional[] for nullable types"
```

### Rule: Database Access Pattern (Backend)
```
Pattern: Direct DB vs repository

❌ FORBIDDEN (in handlers):
  • Direct: await db.query('SELECT * FROM users')
  • Direct: dynamodb.get_item(Key={...})
  • Raw SQL in business logic

✅ ALLOWED (only in repositories):
  • backend/lambda_/repositories/user_repository.py
  • async def get_user(id: int) -> User:

✅ ALLOWED (in handlers):
  • await userRepository.get(id)
  • await userRepository.find(filters)

REDIRECT:
  If accessing DB directly:
  "Use repository pattern.
   Instead:
   1. Create: backend/lambda_/repositories/[entity]_repository.py
   2. Implement: async def find(id) -> [Entity]
   3. Use in handler: await repository.find(id)"
```

### Rule: Tests Required for New Functions
```
Pattern: export function vs test coverage

❌ FORBIDDEN:
  • export function myFunc(x) { ... } (no tests)
  • New public API without tests

✅ ALLOWED:
  • Private functions (no tests required)
  • Exported function WITH test file
  • Test file: same name + .test.jsx/.test.py

REDIRECT:
  If adding function without tests:
  "New functions must have tests.
   Instead:
   1. Create: [path]/[file].test.jsx
   2. Add test cases (at least 3)
   3. Run: npm test (all pass)"
```

---

## Category 4: Architecture Patterns (MODERATE)

### Rule: Singleton Pattern (Frontend State)
```
Pattern: Global state management

❌ FORBIDDEN:
  • window.globalState = { ... }
  • Global variables for shared state
  • Direct modifications to shared state

✅ ALLOWED:
  • useContext() for local state trees
  • Redux for complex global state
  • Immutable state updates

REDIRECT:
  If creating global state:
  "Use React context, not global variables.
   Instead:
   1. Create: src/context/[Feature]Context.jsx
   2. Use: const state = useContext(FeatureContext)
   3. Updates: dispatch(action)"
```

### Rule: Error Handling
```
Pattern: Try/catch, error boundaries

❌ FORBIDDEN:
  • Swallow errors silently (empty catch)
  • Ignore promise rejections
  • No error boundary in React

✅ ALLOWED:
  • Catch, log, and re-throw
  • Error boundaries at component level
  • Proper error messages to user

REDIRECT:
  If swallowing errors:
  "Always handle and log errors.
   Instead:
   1. Catch: catch (error) { logger.error(...) }
   2. Re-throw: throw error (to higher handler)
   3. Boundary: <ErrorBoundary><App/></ErrorBoundary>"
```

---

## Category 5: Project-Specific (ScamGuard)

### Rule: Senior-First UI (Accessibility)
```
Pattern: Component size, font size, contrast

❌ FORBIDDEN:
  • Font size < 14px
  • Buttons < 44px (touch target)
  • Low contrast text (< 4.5:1 ratio)
  • No keyboard navigation
  • No screen reader labels

✅ ALLOWED:
  • Font: 16px minimum body, 18px headings
  • Buttons: 48px × 48px minimum
  • Contrast: 4.5:1 (WCAG AA)
  • ARIA labels on interactive elements
  • Focus indicators visible

REDIRECT:
  If creating component without a11y:
  "All components must be accessible for seniors.
   Review:
   1. Font sizes: Check BRAND_GUIDELINES.md
   2. Contrast: Use contrast checker
   3. Labels: Add aria-label to interactive elements
   4. Keyboard: Test with Tab key only"
```

### Rule: SMS OTP Flow Constraints
```
Pattern: Authentication handlers

❌ FORBIDDEN:
  • Hardcode OTP in tests (use mocks)
  • Skip phone validation
  • OTP longer than 4 digits
  • OTP expiry > 10 minutes
  • No rate limiting

✅ ALLOWED:
  • Validate Canadian phone format
  • Generate 4-digit OTP
  • 10-minute TTL (DynamoDB)
  • Rate limit: 3 attempts/hour
  • Log attempts (not OTP value)

REDIRECT:
  If implementing OTP differently:
  "SMS OTP has constraints per DECISIONS.md#2
   Requirements:
   1. 4-digit code only
   2. 10-minute expiry
   3. Canadian format: 10+ digits
   4. Rate limit: 3 attempts/hour
   5. No logging of OTP values"
```

### Rule: LLM Integration (Agent Calls)
```
Pattern: OpenAI/Gemini API usage

❌ FORBIDDEN:
  • Direct API call (no error handling)
  • No timeout/retry logic
  • Hardcode model names
  • No fallback to secondary LLM

✅ ALLOWED:
  • Use base_agents.py wrapper
  • Retry logic: 3 attempts
  • Timeout: 30s per request
  • Fallback: OpenAI → Gemini

REDIRECT:
  If using LLM without base wrapper:
  "Use base_agents.py for LLM calls.
   Instead:
   1. Import: from agents.base_agents import BaseAgent
   2. Call: agent = BaseAgent('gpt-4o-mini')
   3. Execute: await agent.process(prompt)
   4. Fallback handled automatically"
```

---

## Category 6: Token Budget (CRITICAL)

### Rule: Context Loading
```
Pattern: File loading strategy

❌ FORBIDDEN:
  • Load entire codebase for single question
  • Load > 5 files per task
  • Ignore RAG_INDEX.md recommendations
  • Context window > 40K tokens

✅ ALLOWED:
  • Load only files from task specification
  • Consult RAG_INDEX.md for file locations
  • Load 2-5 files maximum per query
  • Target 3-8K tokens per task

REDIRECT:
  If loading too much context:
  "You're loading too much context.
   Instead:
   1. Check task file (lists exact files)
   2. Consult RAG_INDEX.md (find locations)
   3. Load only 2-5 files
   4. Token budget: 3-8K (now: ${currentTokens}K)"
```

---

## Category 7: Git Discipline (MODERATE)

### Rule: Commit Message Format
```
Pattern: git commit

❌ FORBIDDEN:
  • "fix", "update", "work in progress" (vague)
  • No context in message
  • Commits > 5 files with no explanation

✅ ALLOWED:
  • "fix(component): Fix React import in App.jsx"
  • "feat(auth): Add SMS OTP request handler"
  • "test: Add tests for QuizModule"
  • Conventional commits (feat, fix, test, docs, etc.)

REDIRECT:
  If vague commit message:
  "Use conventional commits with context.
   Format: [type]([scope]): [description]
   Examples:
   - feat(auth): Add SMS OTP handler
   - fix(tests): Fix React import in App
   - docs(api): Update endpoint documentation"
```

### Rule: Branch Protection
```
Pattern: Direct pushes to main/develop

❌ FORBIDDEN:
  • Force push to main (--force-push)
  • Pushing incomplete work to shared branch
  • Merging without tests passing

✅ ALLOWED:
  • Create feature branches (feature/[name])
  • Push to own branches
  • Merge after tests pass

REDIRECT:
  If force pushing:
  "Never force push to shared branches.
   Instead:
   1. Create branch: git checkout -b feature/[name]
   2. Work locally
   3. Push: git push -u origin feature/[name]
   4. Create PR for review"
```

---

## How Claude Uses Guardrails

### Before Every Action:

```
User: "Modify auth_handler.py"

Claude:
1. Check GUARDRAILS.md for [file] pattern
2. If migration file → 🚫 BLOCK + redirect
3. If .env file → 🚫 BLOCK + redirect
4. If hardcoded secret → 🚫 BLOCK + redirect
5. If no error handling → ⚠️ WARN + guidance
6. Otherwise → ✅ ALLOW + proceed
```

### Before Every Write:

```
Claude about to Edit file.py:

Checks:
  ✓ File immutable? No
  ✓ Will expose secrets? No
  ✓ Violates code quality? No
  ✓ Breaks architecture? No
  ✓ Missing tests? Check...
  
All passed → Write file
Otherwise → Block + explain
```

---

## Integration with Task System

**Each task can have guardrails:**

```markdown
### TASK-42: Add SMS OTP handler

Guardrails for this task:
  ❌ No hardcoded secrets
  ❌ Use base_agents.py (not direct API)
  ✅ 4-digit OTP only
  ✅ 10-minute expiry
  ✅ Rate limiting required

Claude checks before implementing:
  1. Read guardrails
  2. Design implementation
  3. Execute (barriers prevent violations)
  4. Tests pass (guardrails enforced)
```

---

## Integration with Settings.json

```json
{
  "guardrails": {
    "enabled": true,
    "strict": true,
    "categories": {
      "immutableFiles": {
        "enabled": true,
        "patterns": ["**/migrations/**", ".env*"]
      },
      "secrets": {
        "enabled": true,
        "patterns": ["API_KEY=", "PASSWORD="]
      },
      "codeQuality": {
        "enabled": true,
        "languages": ["javascript", "python"]
      },
      "tokenBudget": {
        "enabled": true,
        "maxContext": 40000,
        "maxFilesPerTask": 5
      },
      "projectSpecific": {
        "enabled": true,
        "scope": "scamguard"
      }
    }
  }
}
```

---

## Token Savings Calculation

### Without Guardrails:

```
Session 1: Claude modifies migration file
  → You correct (explain, restore, re-implement)
  → 15-30K tokens wasted

Session 2: Same mistake happens again
  → Another 15-30K tokens

Session 3: Still happening
  → Another 15-30K tokens

Monthly cost: 3-5 similar mistakes × 20K = 60-100K tokens wasted
Percentage: 10-25% of monthly budget
```

### With Guardrails:

```
Session 1: Claude tries to modify migration
  → Guardrail triggers immediately (< 100 tokens)
  → Clear error message explains redirect
  → No wasted implementation

Session 2: Claude remembers guardrail
  → Doesn't even attempt
  → 0 tokens wasted

Session 3+: No violations
  → All tokens spent on correct patterns

Monthly cost: 0 token waste on preventable mistakes
Savings: 15-25% of token budget
```

---

## Measuring Effectiveness

Track:
- **Violations prevented** (how many times guardrails blocked action)
- **Tokens saved** (estimated re-work avoided)
- **Quality improvement** (fewer mistakes, faster implementation)

After 1 month:
- Expected: 20-30 violations prevented
- Savings: 15-25% of token budget
- Time saved: 5-10 hours of rework

---

## Adding New Guardrails

1. **Identify the problem** (common mistake or violation)
2. **Write the rule** (clear ❌ FORBIDDEN vs ✅ ALLOWED)
3. **Provide redirect** (what to do instead)
4. **Add examples** (concrete code samples)
5. **Document integration** (where and when it applies)
6. **Add to settings.json** (activate globally or per project)

---

## Summary

**Guardrails are preventive, not corrective.**

- ✅ Block mistakes BEFORE they happen (not after fixing)
- ✅ Clear error messages with solutions (not just "no")
- ✅ Save 15-25% of tokens (avoid rework)
- ✅ Enforce architectural consistency (all code follows patterns)
- ✅ Reduce frustration (mistakes don't repeat)

Start with critical categories (immutable files, secrets).
Expand to code quality and project-specific rules.

**Result: Predictable, efficient development with Claude.**
