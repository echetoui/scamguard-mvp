# Security Fix Checklist - tools_handler.py

## Critical Fixes (BLOCKER for production)

### [ ] Fix 1: CORS Origin Validation
- [ ] Read: Lines 23 and 42 in tools_handler.py
- [ ] Change: `"Access-Control-Allow-Origin": "*"` to specific domain
- [ ] Add: Environment variable `ALLOWED_ORIGINS`
- [ ] Update: Both `success_response()` and `error_response()` functions
- [ ] Deploy: Set env var in Lambda
- [ ] Test: Verify CORS requests from unauthorized origins are blocked
- **Time:** 30 min | **Complexity:** Trivial

### [ ] Fix 2: Rate Limiting Implementation
- [ ] Add: `RateLimiter` class to tools_handler.py
- [ ] Add: `get_client_ip()` helper function
- [ ] Update: `check_email_breach()` - add rate limit check at start
- [ ] Update: `check_financial_advisor()` - add rate limit check at start
- [ ] Configure: Max requests (5 per minute recommended)
- [ ] Test: Send 10 requests rapidly, verify 6th is blocked
- [ ] Test: Verify different IPs have separate limits
- **Time:** 2-4 hours | **Complexity:** Moderate

### [ ] Fix 3: Safe JSON Extraction from LLMs
- [ ] Add: `extract_json_from_response()` function
- [ ] Replace: JSON parsing in `query_openai()` (lines 265-275)
- [ ] Replace: JSON parsing in `query_gemini()` (lines 311-318)
- [ ] Add: Field validation (required fields check)
- [ ] Add: Type validation (risk_level must be low/medium/high/unknown)
- [ ] Test: Valid JSON extraction still works
- [ ] Test: Invalid/malformed JSON returns None gracefully
- **Time:** 1-2 hours | **Complexity:** Moderate

---

## High-Risk Fixes (Required for Phase 5C release)

### [ ] Fix 4: Input Sanitization for Prompt Injection
- [ ] Add: `sanitize_for_prompt()` function
- [ ] Update: `check_financial_advisor()` - sanitize inputs before use
- [ ] Update: `get_advisor_analysis_prompt()` - use sanitized inputs
- [ ] Test: Try to inject "\n[SYSTEM] override" - verify it's stripped
- [ ] Test: Newlines and control characters are removed
- **Time:** 1 hour | **Complexity:** Trivial

### [ ] Fix 5: Improve Exception Handling
- [ ] Replace: All bare `except:` clauses with specific exception types
- [ ] Line 272: Change `except:` to `except (json.JSONDecodeError, ValueError):`
- [ ] Line 317: Change `except:` to `except (json.JSONDecodeError, ValueError):`
- [ ] Add: `logger.exception()` for full stack traces
- [ ] Test: Verify stack traces appear in CloudWatch logs
- **Time:** 30 min | **Complexity:** Trivial

### [ ] Fix 6: Add Missing Security Headers
- [ ] Add to `success_response()`: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`
- [ ] Add to `error_response()`: Same headers
- [ ] Verify: All 3 headers present in every response
- **Time:** 15 min | **Complexity:** Trivial

---

## Medium-Risk Fixes (Recommended for Phase 5C)

### [ ] Fix 7: Fix Error Response Consistency
- [ ] Update: `check_email_breach()` - use 503 instead of 200 for API failures
- [ ] Update: `check_financial_advisor()` - use consistent error codes
- [ ] Test: Verify 503 responses when services unavailable
- **Time:** 30 min | **Complexity:** Trivial

### [ ] Fix 8: Add Proper Logging
- [ ] Add: `import logging` at top
- [ ] Add: `logger = logging.getLogger()`
- [ ] Replace: All `print()` statements with `logger.info()`, `logger.error()`, `logger.warning()`
- [ ] Add: `logger.exception()` in exception handlers for stack traces
- [ ] Test: Check CloudWatch Logs console shows structured logs
- **Time:** 30 min | **Complexity:** Trivial

### [ ] Fix 9: Input Length Validation
- [ ] Add: `if len(email) > 254:` check
- [ ] Add: `if len(advisor_name) > 256:` check
- [ ] Add: `if len(firm_name) > 256:` check
- [ ] Test: Reject very long inputs
- **Time:** 15 min | **Complexity:** Trivial

### [ ] Fix 10: Better SSM Error Handling
- [ ] Update: `get_parameter()` function
- [ ] Add: `from botocore.exceptions import ClientError`
- [ ] Differentiate: ParameterNotFound vs AccessDeniedException
- [ ] Log: Different messages for different error types
- **Time:** 30 min | **Complexity:** Trivial

### [ ] Fix 11: Add Retry Logic for External APIs
- [ ] Add: `call_breachdirectory_with_retry()` function
- [ ] Add: Exponential backoff (2^attempt seconds)
- [ ] Handle: 429 (rate limit), 5xx (server errors)
- [ ] Don't retry: 4xx client errors
- [ ] Test: Simulate API timeout, verify retry happens
- **Time:** 1 hour | **Complexity:** Moderate

---

## Testing Checklist

### Unit Tests
- [ ] Add test for rate limiter blocking
- [ ] Add test for JSON extraction with invalid data
- [ ] Add test for input sanitization removing newlines
- [ ] Run all tests: `pytest backend/lambda_/tests/test_tools_handler.py`
- [ ] Verify: All tests pass

### Integration Tests
- [ ] Test email breach endpoint with valid email
- [ ] Test email breach endpoint with invalid email
- [ ] Test advisor check endpoint with valid name
- [ ] Test advisor check endpoint with missing name
- [ ] Test CORS headers in responses
- [ ] Test rate limiting (5 rapid requests)

### Load Tests
- [ ] Send 100 requests/second for 10 seconds
- [ ] Verify: Rate limiting kicks in at 5/minute
- [ ] Verify: No 429 errors for legitimate requests
- [ ] Verify: Error response contains "Rate Limited"

### Security Tests
- [ ] Test CORS from unauthorized origin (should be blocked)
- [ ] Test prompt injection in advisor name (should be sanitized)
- [ ] Test malformed JSON from LLM (should fall back gracefully)
- [ ] Test missing SSM parameter (should return 503)

---

## Deployment Checklist

### Pre-Deployment
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Code review completed
- [ ] Security review findings addressed
- [ ] ALLOWED_ORIGINS environment variable configured

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Monitor CloudWatch logs for errors
- [ ] Verify rate limiting works
- [ ] Verify CORS headers correct

### Post-Deployment
- [ ] Check Lambda error rate (should be < 0.1%)
- [ ] Check average response time (should be < 500ms)
- [ ] Monitor CloudWatch logs for 24 hours
- [ ] Verify no 5xx errors
- [ ] Test rate limiting on production

---

## Priority & Time Estimates

| Priority | Fixes | Time | Total |
|----------|-------|------|-------|
| CRITICAL | 3 fixes | 4-6h | 4-6h |
| HIGH | 3 fixes | 1-2h | 5-8h |
| MEDIUM | 5 fixes | 2-2h | 7-10h |
| TESTING | Unit/Integration/Load | 2-3h | 9-13h |
| DEPLOYMENT | Staging + Prod | 1-2h | 10-15h |

**Total Effort: 10-15 hours**

---

## Sign-Off

Date Started: ___________
Date Completed: ___________

Critical Fixes Completed: YES [ ] NO [ ]
High Fixes Completed: YES [ ] NO [ ]
Medium Fixes Completed: YES [ ] NO [ ]
All Tests Passing: YES [ ] NO [ ]
Ready for Production: YES [ ] NO [ ]

Reviewed By: _________________
Deployed By: _________________

