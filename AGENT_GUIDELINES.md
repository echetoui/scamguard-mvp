# ScamGuard MVP - Agent Development Guidelines

**Last Updated:** March 16, 2026
**Purpose:** Ensure consistency and prevent breaking changes when agents modify the codebase
**Target Audience:** AI Agents (Claude, Gemini, etc.)

---

## 🚫 CRITICAL CONSTRAINTS - DO NOT BREAK

These constraints are **load-bearing**. Violating them will break the application in production.

### 1. **Infrastructure Source of Truth: SAM (NOT CDK)**

**Current State:** `backend/template.yaml` is the **single source of truth** for all AWS infrastructure.

**What This Means:**
- All DynamoDB tables are defined in `template.yaml` (lines 172+)
- All Lambda functions are defined in `template.yaml`
- All API Gateway routes are defined in `template.yaml`
- CDK (`backend/cdk/`) is used ONLY for features not supported by SAM (e.g., Step Functions orchestration)

**DO NOT:**
- ❌ Add DynamoDB tables to CDK expecting them to deploy
- ❌ Define Lambda functions in CDK's main stack (use for Agents stack ONLY)
- ❌ Create redundant infrastructure definitions (SAM + CDK for same resource)
- ❌ Modify `backend/cdk/app.py` to instantiate infrastructure stacks like `ThreatsStack`

**CORRECT APPROACH:**
- Add new tables/functions to `template.yaml`
- Use CDK ONLY for orchestration stacks (`AgentsStack` in `cdk/agents_stack.py`)
- Keep `cdk/app.py` minimal (only instantiate ScamGuardStack + AgentsStack)

---

### 2. **Lambda Memory & Timeout - Vision Analysis Requirements**

**Current Specs:**
- Memory: **1536 MB minimum** (was 512MB - caused vision analysis failures)
- Timeout: **60 seconds minimum** (was 30s - caused vision timeouts)

**Why This Matters:**
- Vision analysis (GPT-4o-mini) requires ~1200MB+ memory
- Vision API calls take 20-40 seconds
- Production will fail silently if you reduce these

**DO NOT:**
- ❌ Lower Lambda memory below 1536 MB
- ❌ Lower Lambda timeout below 60 seconds
- ❌ Move to lightweight models without re-testing vision endpoints

**If Vision Stops Working:**
1. Check `template.yaml` Lambda properties (lines ~620-650)
2. Verify MemorySize and Timeout are still >= specified values
3. DO NOT reduce them as a "cost optimization" without load testing

---

### 3. **DynamoDB Billing Mode: Provisioned (Free Tier)**

**Current Configuration:**
```yaml
BillingMode: PROVISIONED
WriteCapacityUnits: 25
ReadCapacityUnits: 25
```

**Why This Matters:**
- Free tier covers 25 RCU + 25 WCU
- Previous attempt to switch to PAY_PER_REQUEST costs 5-10x more
- Provisioned capacity is sufficient for current load

**DO NOT:**
- ❌ Switch to `BillingMode: PAY_PER_REQUEST` (will triple monthly AWS costs)
- ❌ Reduce RCU/WCU below 25 (free tier won't cover)
- ❌ Add unlimited capacity without capacity planning first

---

### 4. **Cognito Email Verification - Security Requirement**

**Current Configuration:**
```yaml
UserAttributeUpdateSettings:
  AttributesRequireVerificationBeforeUpdate:
    - email
AutoVerifiedAttributes:
  - email  # FALSE - requires manual confirmation
```

**Why This Matters:**
- Email takeover vulnerability: if `AutoVerifiedAttributes: [email]` is enabled, attackers can take over accounts
- GDPR/compliance requires confirmed email addresses
- This was a **critical security fix** from v5.0 → v5.1

**DO NOT:**
- ❌ Enable `AutoVerifiedAttributes: [email]`
- ❌ Remove email verification requirement
- ❌ Auto-confirm user accounts without email proof

---

### 5. **API Gateway Throttling - User Protection**

**Current Configuration:**
```yaml
ThrottlingBurstLimit: 5000   # Global
ThrottlingRateLimit: 2000    # Per second
```

**Additional:**
- Custom throttling: 10 requests per user per day (API Gateway stage level)
- Rejection happens BEFORE Lambda invocation (cost-effective)

**DO NOT:**
- ❌ Remove throttling (will enable DDoS)
- ❌ Increase per-user limit without load testing
- ❌ Move throttling logic to Lambda (wastes invocations)

---

## ✅ REQUIRED PATTERNS - MAINTAIN CONSISTENCY

### 1. **Error Response Format**

All Lambda handlers must return this exact structure:

```python
def error_response(message: str, status_code: int) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps({'error': message})
    }

def success_response(data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps(data)
    }
```

**DO NOT:**
- ❌ Return error messages without proper CORS headers
- ❌ Wrap responses in a `data` field (breaks clients)
- ❌ Return raw exceptions or stack traces to client
- ❌ Forget `json.dumps()` (Lambda doesn't auto-serialize)

---

### 2. **CORS Headers - Must Be Consistent**

All endpoints must include:

```python
CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': os.environ.get('ALLOWED_ORIGIN', '*'),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

**DO NOT:**
- ❌ Hardcode `*` for `Access-Control-Allow-Origin` in production
- ❌ Forget to handle OPTIONS preflight requests
- ❌ Return CORS headers only from success responses

**Correct OPTIONS Handler:**
```python
if http_method == 'OPTIONS':
    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': ''
    }
```

---

### 3. **DynamoDB Decimal Conversion**

DynamoDB returns numbers as `Decimal` type. You MUST convert before JSON serialization:

```python
from decimal import Decimal

def convert_decimal(obj: Any) -> Any:
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj) if obj % 1 else int(obj)
    return obj
```

**DO NOT:**
- ❌ Return DynamoDB Decimal objects directly (breaks JSON serialization)
- ❌ Convert using `float(Decimal)` without checking for integers
- ❌ Skip conversion "for simple endpoints"

---

### 4. **Event Routing Pattern**

All handlers must follow this pattern:

```python
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '')

        # Route to specific handlers
        if '/endpoint/path' in path and http_method == 'POST':
            return handle_specific_feature(event)
        elif '/other/path' in path and http_method == 'GET':
            return handle_other_feature(event)
        elif http_method == 'OPTIONS':
            return { 'statusCode': 200, 'headers': CORS_HEADERS, 'body': '' }
        else:
            return error_response('Not Found', 404)

    except Exception as e:
        logger.exception(f"Error in handler: {str(e)}")
        return error_response(f'Internal Server Error: {str(e)}', 500)
```

**DO NOT:**
- ❌ Forget to check `http_method` before routing
- ❌ Catch generic Exception without logging
- ❌ Return error without proper status codes

---

### 5. **Environment Variables - Consistent Naming**

All tables/configs should be passed via environment variables:

```python
# In template.yaml
Environment:
  Variables:
    THREATS_TABLE: !Sub 'ScamGuardThreats-${Environment}'
    USER_THREATS_TABLE: !Sub 'ScamGuardThreatInteractions-${Environment}'
    ENVIRONMENT: !Ref Environment
    ALLOWED_ORIGIN: !Ref AllowedOrigin

# In Lambda handler
threats_table = dynamodb.Table(os.environ.get('THREATS_TABLE', 'threats'))
```

**DO NOT:**
- ❌ Hardcode table names in Lambda code
- ❌ Skip providing defaults (breaks local development)
- ❌ Mix environment-specific logic in handler code

---

## 📋 TESTING REQUIREMENTS - MANDATORY

### Every New Lambda Handler Must Have:

1. **Unit Tests** (minimum 30 tests for complex handlers)
   - Test each endpoint separately
   - Mock DynamoDB with `unittest.mock.MagicMock`
   - Test error cases (invalid input, missing fields, DB errors)

2. **Test File Location:**
   ```
   backend/lambda_/test_<handler_name>.py
   ```

3. **Test Execution:**
   ```bash
   python3 -m pytest lambda_/test_<handler_name>.py -v
   ```

4. **Example Test Structure:**
   ```python
   import pytest
   from unittest.mock import patch, MagicMock
   import json

   class TestHandlerRouting:
       @patch('handler.dynamodb')
       def test_get_request_routes_correctly(self, mock_dynamodb):
           event = {'httpMethod': 'GET', 'path': '/api/endpoint'}
           result = lambda_handler(event, None)

           assert result['statusCode'] == 200
           body = json.loads(result['body'])
           assert 'data' in body or result is not empty
   ```

**DO NOT:**
- ❌ Deploy Lambda handlers without tests
- ❌ Test only the "happy path"
- ❌ Use real DynamoDB in unit tests (use mocks)
- ❌ Commit with failing tests

---

## 🏗️ PROJECT STRUCTURE - MAINTAIN IT

**Critical File Organization:**

```
backend/
├── template.yaml                 # ✅ SAM Infrastructure (SOURCE OF TRUTH)
├── lambda_/
│   ├── threats_handler.py        # Handler implementation
│   ├── test_threats_handler.py   # Unit tests (REQUIRED)
│   └── lambda_package/           # Dependencies (auto-deployed by SAM)
└── cdk/
    ├── app.py                    # CDK entry point
    ├── stacks/
    │   ├── scamguard_stack.py    # Main infrastructure (CloudFormation wrapper)
    │   └── agents_stack.py       # Agent orchestration (Step Functions)
    └── requirements.txt
```

**DO NOT:**
- ❌ Create new infrastructure files outside `template.yaml`
- ❌ Move Lambda handlers to different directories
- ❌ Put handlers in `cdk/` (breaks SAM build)
- ❌ Delete `template.yaml` or convert to CDK

---

## 🧪 CODE REVIEW CHECKLIST - BEFORE COMMITTING

When you modify code, verify:

- [ ] All Lambda handlers return proper JSON response structure
- [ ] All responses include CORS headers
- [ ] DynamoDB Decimals are converted before JSON serialization
- [ ] Error handling wraps all database operations
- [ ] Environment variables are used (no hardcoded values)
- [ ] Unit tests exist for new handlers (40+ tests)
- [ ] Tests mock DynamoDB (not real database)
- [ ] OPTIONS preflight requests are handled
- [ ] Table names match `template.yaml` definitions
- [ ] Query/Scan operations use correct indexes
- [ ] No changes to `template.yaml` Lambda memory/timeout
- [ ] No changes to DynamoDB billing mode
- [ ] Commit message explains what changed and why

---

## 🚀 DEPLOYMENT CHECKLIST - BEFORE AWS PUSH

- [ ] Run all tests locally: `pytest lambda_/ -v`
- [ ] All 44+ tests passing
- [ ] No new test warnings (except coverage - mocked code won't be covered)
- [ ] `sam build` completes without errors
- [ ] `sam local start-api` works on port 3001
- [ ] Manual test all endpoints via `curl` or Postman
- [ ] Commit messages reference task/sprint
- [ ] Code follows existing patterns (no new conventions)

---

## ⚠️ COMMON MISTAKES - AVOID THESE

| Mistake | Why It Breaks | How to Fix |
|---------|---------------|-----------|
| ❌ Adding table to CDK | Deploys nowhere (SAM is source of truth) | Add to `template.yaml` |
| ❌ Returning `{'data': {...}}` | Clients expect flat structure | Return `{...}` directly |
| ❌ Missing CORS headers | Browser blocks response (CORS error) | Include in ALL responses |
| ❌ DynamoDB Decimal in JSON | `decimal.Decimal not JSON serializable` | Use `convert_decimal()` |
| ❌ Lowering Lambda memory | Vision analysis fails silently in prod | Keep at 1536MB minimum |
| ❌ Removing email verification | Account takeover vulnerability | Keep verification enabled |
| ❌ No unit tests | Regressions go to production | Write 40+ tests per handler |
| ❌ Hardcoded table names | Fails in different environments | Use `os.environ.get()` |
| ❌ Forgetting OPTIONS handler | Mobile apps get CORS errors | Add OPTIONS route |
| ❌ Mixing SAM + CDK for same service | Conflicts and deployments fail | Choose ONE source |

---

## 📞 WHEN IN DOUBT

1. **Check existing handlers first** - look at `threats_handler.py` as the reference implementation
2. **Read the error message** - AWS errors are usually precise about what's wrong
3. **Run tests locally** - catch issues before they reach AWS
4. **Check `template.yaml`** - the configuration is the source of truth, not assumptions
5. **Review git commits** - see why previous decisions were made

---

## 🔄 VERSION HISTORY

| Version | Date | Key Changes |
|---------|------|-------------|
| 5.1 | Mar 2026 | Lambda 1536MB, 60s timeout, email verification required |
| 5.0 | Earlier | Initial architecture |

---

**AGENT ACKNOWLEDGMENT:**

Before modifying the codebase, AI agents should:
1. Read this document entirely
2. Check the relevant section for the task at hand
3. Review the code review checklist
4. Verify all patterns match existing code

Violation of these guidelines will result in:
- ❌ Tests failing
- ❌ Deployments blocking
- ❌ Security vulnerabilities
- ❌ User-facing outages
- ❌ Wasted development time
