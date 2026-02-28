# Load Testing Suite - Phase 4C

Comprehensive load testing suite for ScamGuard MVP using K6.

## Test Scenarios

### 1. Signup Load Test (`load-signups.js`)
**Purpose:** Test signup capacity under increasing load

**Ramp-up Profile:**
- 1 min: 50 users
- 2 min: 100 users
- 3 min: 500 users (peak)
- 2 min: 100 users (ramp down)
- 1 min: 0 users (cool down)

**Success Criteria:**
- 95th percentile response time < 1000ms
- 99th percentile response time < 2000ms
- Error rate < 10%

**Run:**
```bash
k6 run frontend/tests/load/load-signups.js
```

---

### 2. Login Load Test (`load-logins.js`)
**Purpose:** Test login capacity with existing user accounts

**Ramp-up Profile:**
- 1 min: 100 users
- 2 min: 500 users
- 3 min: 1000 users (peak)
- 2 min: 100 users (ramp down)
- 1 min: 0 users (cool down)

**Success Criteria:**
- 95th percentile response time < 1500ms
- 99th percentile response time < 3000ms
- Error rate < 10%

**Prerequisites:**
- Test users must be pre-created in Cognito
- Update TEST_USERS array in script with real credentials

**Run:**
```bash
k6 run frontend/tests/load/load-logins.js
```

---

### 3. Token Refresh Stress Test (`load-token-refresh.js`)
**Purpose:** Test token refresh endpoint performance and stability

**Ramp-up Profile:**
- 1 min: 100 concurrent refresh requests
- 2 min: 300 concurrent refresh requests
- 3 min: 500 concurrent refresh requests (peak)
- 2 min: 100 concurrent refresh requests (ramp down)
- 1 min: 0 requests (cool down)

**Success Criteria:**
- 95th percentile response time < 500ms
- 99th percentile response time < 1000ms
- Error rate < 5%

**Run:**
```bash
k6 run frontend/tests/load/load-token-refresh.js
```

---

### 4. Mixed Load Test (`load-mixed.js`)
**Purpose:** Simulate realistic user traffic distribution

**Traffic Distribution:**
- 30% Signup flow (email, password, phone, OTP verification)
- 50% Login flow (existing users)
- 20% Token refresh

**Ramp-up Profile:**
- 2 min: 100 concurrent users
- 5 min: 500 concurrent users (ramp up)
- 5 min: 500 concurrent users (sustain)
- 2 min: 100 concurrent users (ramp down)
- 1 min: 0 users (cool down)

**Success Criteria:**
- 90th percentile response time < 1000ms
- 95th percentile response time < 2000ms
- 99th percentile response time < 3000ms
- Error rate < 10%

**Run:**
```bash
k6 run frontend/tests/load/load-mixed.js
```

---

## Running All Tests

```bash
# Install K6
brew install k6

# Run individual test
k6 run frontend/tests/load/load-signups.js

# Run with custom base URL
BASE_URL=https://your-api.example.com k6 run frontend/tests/load/load-signups.js

# Run with output to JSON for analysis
k6 run frontend/tests/load/load-mixed.js -o json=results.json

# Run with detailed output
k6 run frontend/tests/load/load-mixed.js --vus 10 --duration 30s
```

---

## Custom Metrics

All tests capture these metrics:

- **Request Duration:** Histogram of response times
- **Success Count:** Number of successful requests
- **Failure Count:** Number of failed requests
- **Error Rate:** Percentage of requests that failed

### Analyzing Results

Results show percentiles:
- **p(50)** = Median response time
- **p(90)** = 90th percentile
- **p(95)** = 95th percentile
- **p(99)** = 99th percentile

---

## Environment Variables

```bash
BASE_URL=https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1
```

---

## Interpreting Results

### Green Results ✅
- All thresholds met
- Error rate < target
- Response times acceptable
- System is stable and performant

### Yellow Results ⚠️
- Some thresholds nearly violated
- Error rate approaching limits
- Response times increasing
- Monitor closely during production

### Red Results 🔴
- Thresholds exceeded
- High error rates (>10%)
- Slow response times
- System needs optimization

---

## Troubleshooting

### High Error Rate
1. Check API Gateway logs
2. Verify Lambda function limits
3. Check DynamoDB throttling
4. Examine CloudWatch metrics

### High Response Times
1. Check database query times
2. Verify Lambda cold starts
3. Check network latency
4. Profile Lambda execution

### Out of Memory Errors
1. Check Lambda memory allocation
2. Monitor DynamoDB usage
3. Check for connection leaks
4. Increase reserved concurrency

---

## Performance Benchmarks (Target)

| Metric | Target | Status |
|--------|--------|--------|
| Signup p(95) | <1000ms | ✅ Expected |
| Login p(95) | <1500ms | ✅ Expected |
| Refresh p(95) | <500ms | ✅ Expected |
| Mixed p(95) | <1000ms | ✅ Expected |
| Error Rate | <10% | ✅ Expected |

---

## Next Steps After Load Tests

1. ✅ **Analyze Results:** Review metrics and identify bottlenecks
2. **Optimize:** Fix identified performance issues
3. **Re-test:** Rerun scenarios after optimizations
4. **Staging E2E:** Ensure E2E tests still pass
5. **Production Deployment:** Deploy to production with monitoring

---

**Generated:** 28 février 2026
**Framework:** K6 v1.6.1
**Test Environment:** Staging (AWS)
