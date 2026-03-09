# Phase 5C Outils Tab - Action Items & Issues

## BLOCKER ISSUES (Must fix before production)

### 1. Frontend Fetch Timeout Missing
**Priority:** CRITICAL  
**Severity:** HIGH  
**File:** `/Users/echetoui/scamguard-mvp/frontend/src/components/ToolsTab.jsx`  
**Lines:** 37-66 (handleCheckEmail), 69-101 (handleCheckAdvisor)

**Problem:**
```javascript
const response = await fetch(`${API_BASE_URL}/tools/check-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: emailInput }),
  // NO TIMEOUT - could hang forever!
});
```

**Impact:**
- User stuck in loading state indefinitely on slow networks
- No error message shown
- Bad mobile experience
- Server keeps connection open unnecessarily

**Solution:**
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
try {
  const response = await fetch(url, { 
    ...options, 
    signal: controller.signal 
  });
  clearTimeout(timeoutId);
  // handle response
} catch (err) {
  if (err.name === 'AbortError') {
    // Handle timeout
  }
}
```

**Estimate:** 30 minutes  
**Status:** TODO

---

### 2. Silent Error Logging in LLM Parsing
**Priority:** CRITICAL  
**Severity:** HIGH  
**File:** `/Users/echetoui/scamguard-mvp/backend/lambda_/tools_handler.py`  
**Lines:** 265-275 (query_openai), 310-318 (query_gemini)

**Problem:**
```python
# Lines 265-275
try:
    if '{' in content and '}' in content:
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        json_str = content[json_start:json_end]
        return json.loads(json_str)
except:  # ← BARE EXCEPT WITH PASS!
    pass

return None
```

**Impact:**
- No logging of what failed
- Impossible to debug in production
- No metrics on failure rates
- Can't distinguish between different failure modes
- Returns None for timeout vs parsing error vs other errors

**Solution:**
```python
except Exception as e:
    print(f"Error parsing JSON from LLM response: {type(e).__name__}: {e}")
    print(f"Content was: {content[:500]}")  # Log first 500 chars
    return None
```

**Estimate:** 15 minutes  
**Status:** TODO

---

### 3. Missing Authentication Tokens
**Priority:** CRITICAL  
**Severity:** MEDIUM  
**File:** `/Users/echetoui/scamguard-mvp/frontend/src/components/ToolsTab.jsx`  
**Lines:** 37-66 (handleCheckEmail), 69-101 (handleCheckAdvisor)

**Problem:**
```javascript
const response = await fetch(`${API_BASE_URL}/tools/check-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Missing Authorization header!
  },
  body: JSON.stringify({ email: emailInput }),
});
```

**Impact:**
- All requests are anonymous
- Can't track user behavior
- Can't implement per-user quotas
- No way to distinguish premium vs free users
- Backend can't enforce usage limits

**Solution:**
Get token from storage:
```javascript
import { getAuthToken } from '../services/api';

const token = getAuthToken();
const headers = { 'Content-Type': 'application/json' };
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

**Estimate:** 20 minutes  
**Status:** TODO

---

## HIGH PRIORITY ISSUES (Fix in next sprint)

### 4. Unused Centralized API Service
**Priority:** HIGH  
**Severity:** MEDIUM  
**File:** `/Users/echetoui/scamguard-mvp/frontend/src/services/api.js` (lines 285-301)  
**File:** `/Users/echetoui/scamguard-mvp/frontend/src/components/ToolsTab.jsx` (lines 45, 77)

**Problem:**
- toolsAPI defined but never used
- Direct fetch calls miss error handling
- No token refresh handling
- Inconsistent with rest of app

**Solution:**
Import and use toolsAPI:
```javascript
import api from '../services/api';

// Instead of:
const response = await fetch(...);

// Use:
const result = await api.toolsAPI.checkEmailBreach(emailInput);
```

**Estimate:** 45 minutes  
**Status:** TODO

---

### 5. No Fallback Indicator Flag
**Priority:** HIGH  
**Severity:** MEDIUM  
**File:** `/Users/echetoui/scamguard-mvp/backend/lambda_/tools_handler.py`  
**Lines:** 80-93, 108-119, 156-166 (email endpoint), 224-226 (advisor fallback)

**Problem:**
```python
# Returns 200 with fallback data, but no flag
return success_response(200, {
    "breached": None,
    "breach_count": 0,
    "sources": [],
    "message": "⚠️ Service indisponible",
    "fallback_url": "https://haveibeenpwned.com"
    # Missing: "is_fallback": true
})
```

**Impact:**
- Frontend can't distinguish real data from fallback
- Metrics impossible (how many fallbacks were served?)
- User doesn't know they got incomplete data
- Advisor results shown as if they're real analysis

**Solution:**
Add flag to all fallback responses:
```python
return success_response(200, {
    "is_fallback": True,  # ← ADD THIS
    "breached": None,
    "breach_count": 0,
    "sources": [],
    "message": "⚠️ Service indisponible",
    "fallback_url": "https://haveibeenpwned.com"
})
```

**Estimate:** 45 minutes (test updates needed)  
**Status:** TODO

---

## MEDIUM PRIORITY ISSUES

### 6. No Retry Logic for Transient Errors
**Priority:** MEDIUM  
**Severity:** MEDIUM  
**File:** `/Users/echetoui/scamguard-mvp/frontend/src/components/ToolsTab.jsx`

**Problem:**
- Network timeouts not retried
- 503 Service Unavailable not retried
- User must manually retry
- No exponential backoff

**Solution:**
Implement retry wrapper:
```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000)
      });
      if (response.ok) return response;
      if (response.status >= 500 && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        continue;
      }
      return response;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

**Estimate:** 1.5 hours  
**Status:** TODO

---

### 7. Missing Test Coverage for Critical Paths
**Priority:** MEDIUM  
**Severity:** MEDIUM  
**File:** `/Users/echetoui/scamguard-mvp/backend/lambda_/tests/test_tools_handler.py`

**Current Coverage:** 48%  
**Target Coverage:** 80%+  
**Tests to Add:** 8

**Missing Tests:**

1. **Email Breach - Found Multiple Sources**
   ```python
   def test_email_breach_found_multiple_sources(self):
       """Should parse BreachDirectory response with multiple breaches"""
       # Mock BreachDirectory API returning found > 0
       # Verify sources list is populated
   ```

2. **Email Breach - No Breach**
   ```python
   def test_email_breach_not_found(self):
       """Should return safe status when no breach found"""
       # Mock BreachDirectory API returning found = 0
       # Verify breached=False
   ```

3. **Email Breach - API Returns success=false**
   ```python
   def test_email_breach_api_success_false(self):
       """Should handle API returning success=false"""
       # Mock BreachDirectory returning {"success": false}
   ```

4. **Advisor - OpenAI Success**
   ```python
   def test_advisor_openai_success(self, mock_get_param):
       """Should parse valid OpenAI JSON response"""
       # Mock requests.post for OpenAI
       # Verify risk_level and registries returned
   ```

5. **Advisor - Gemini Success**
   ```python
   def test_advisor_gemini_success(self, mock_get_param):
       """Should parse valid Gemini JSON response"""
       # Mock requests.post for Gemini
   ```

6. **Advisor - OpenAI Timeout**
   ```python
   def test_advisor_openai_timeout(self, mock_get_param):
       """Should fall back to Gemini on OpenAI timeout"""
       # Mock OpenAI timeout
       # Verify Gemini is called
   ```

7. **Advisor - Gemini Timeout**
   ```python
   def test_advisor_gemini_timeout(self, mock_get_param):
       """Should return fallback on Gemini timeout"""
       # Mock Gemini timeout
       # Verify static response returned
   ```

8. **Advisor - JSON Parsing Error**
   ```python
   def test_advisor_malformed_json_from_llm(self, mock_get_param):
       """Should handle malformed JSON from OpenAI"""
       # Mock OpenAI returning invalid JSON
       # Verify fallback response returned
   ```

**Estimate:** 3 hours  
**Status:** TODO

---

## LOW PRIORITY IMPROVEMENTS

### 8. Add Monitoring Metrics
**Priority:** LOW  
**Severity:** LOW

**What to track:**
- Fallback usage rate (breaches detected via fallback vs real API)
- API error rates (by service: BreachDirectory, OpenAI, Gemini)
- Request latency (p50, p95, p99)
- Timeout frequency
- Success rate by endpoint

**Estimate:** 4 hours  
**Status:** TODO (Phase 5D)

---

### 9. Implement Request Deduplication
**Priority:** LOW  
**Severity:** LOW

**What to prevent:**
- User clicking "Check" button twice
- Multiple requests for same email in short time
- Duplicate API calls to expensive services

**Estimate:** 1 hour  
**Status:** DONE (button disabled during loading)

---

### 10. Add Circuit Breaker for LLM APIs
**Priority:** LOW  
**Severity:** LOW

**What to implement:**
- Track failures for OpenAI and Gemini
- After N failures in time window, skip to fallback
- Exponential backoff before retrying
- Alert when circuit is open

**Estimate:** 2 hours  
**Status:** TODO (Phase 5D)

---

## IMPLEMENTATION PLAN

### Phase 1: Blockers (MUST DO BEFORE PRODUCTION)
1. Add frontend timeout (30 min)
2. Add error logging (15 min)
3. Add authentication (20 min)
4. Use toolsAPI service (45 min)
5. Add fallback indicator (45 min)
**Total:** ~2.75 hours

### Phase 2: Coverage (MUST DO BEFORE PROD LAUNCH)
1. Add 8 missing tests (3 hours)
**Total:** 3 hours

### Phase 3: Reliability (First sprint)
1. Add retry logic (1.5 hours)
2. Add metrics/monitoring (4 hours)
3. Add circuit breaker (2 hours)
**Total:** 7.5 hours

### Phase 4: Optimization (Future)
1. Caching for advisor checks
2. Per-user rate limiting
3. Analytics dashboard
4. Batch operations

---

## VALIDATION CHECKLIST

Once fixes are implemented:

- [ ] All 14 existing tests still pass
- [ ] 8 new tests added and passing
- [ ] Code coverage > 80%
- [ ] Frontend timeout works (test with network throttling)
- [ ] Error logging captures real failures
- [ ] Authorization headers sent with requests
- [ ] toolsAPI used instead of direct fetch
- [ ] is_fallback flag present in responses
- [ ] Retry logic works for 503 errors
- [ ] Mobile testing on slow networks
- [ ] Staging deployment successful
- [ ] Production deployment approved

---

## FILES TO MODIFY

**Critical (must modify):**
1. `/Users/echetoui/scamguard-mvp/frontend/src/components/ToolsTab.jsx`
   - Add timeout handling
   - Add authentication token
   - Use toolsAPI service
   - Add retry logic

2. `/Users/echetoui/scamguard-mvp/backend/lambda_/tools_handler.py`
   - Add error logging
   - Add is_fallback flag
   - Improve error handling

3. `/Users/echetoui/scamguard-mvp/backend/lambda_/tests/test_tools_handler.py`
   - Add 8 new test cases
   - Improve coverage to 80%+

**High priority (should modify):**
4. `/Users/echetoui/scamguard-mvp/frontend/src/services/api.js`
   - Update toolsAPI to match actual implementation
   - Add timeout options

---

**Status:** Action items created  
**Date:** March 9, 2026  
**Total Effort:** ~13.25 hours (Blockers + Coverage + Reliability)
