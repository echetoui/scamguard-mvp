# Performance Optimization Guide

## Lambda Configuration

**Memory**: 1536 MB (4 GB+ CPU allocation)
**Timeout**: 60 seconds
**Reserved Concurrency**: 10 (prevents throttling)

## Handler Performance Targets

### POST /api/v1/scenarios (ScenarioAgent)
```
Avg Duration: 8-10s
Max Duration: 15s
Memory Peak: 600MB
```

**Breakdown**:
- Gemini API call: 8-15s (can timeout at 60s)
- Cache write: <1s
- Response formatting: <1s

### POST /api/v1/analysis (DetectionAgent + CoachingAgent)
```
Avg Duration: 25-30s
Max Duration: 45s
Memory Peak: 900MB
```

**Breakdown**:
- GPT-4o-mini vision call: 8-15s (3 retries possible = 30s max)
- DetectionAgent processing: 2-3s
- CoachingAgent processing: 3-5s
- DynamoDB store: <2s
- Response formatting: <1s

### GET /api/v1/profile
```
Avg Duration: 1-2s
Max Duration: 5s
Memory Peak: 300MB
```

### GET /api/v1/analytics/summary
```
Avg Duration: 2-3s
Max Duration: 8s
Memory Peak: 400MB
```

## Optimization Techniques

### 1. Reuse Connections
```python
# ✅ GOOD: Initialize at module level (cold start only)
from openai import OpenAI
client = OpenAI()

# ❌ BAD: Create new client per invocation
def handler():
    client = OpenAI()  # Wasted overhead
```

### 2. Lazy Import Heavy Modules
```python
# ✅ GOOD: Import inside function if rarely used
def handler():
    import heavy_module  # Only if needed

# ❌ BAD: Import at module level if not always needed
import heavy_module
```

### 3. API Timeout Configuration
```python
# ✅ GOOD: Set timeout < Lambda timeout
response = client.chat.completions.create(
    timeout=55.0,  # 60s Lambda - 5s buffer
)

# ❌ BAD: Default timeout = 10s (retries can waste time)
response = client.chat.completions.create()
```

### 4. Monitoring with Decorators
```python
@monitor_performance
@timeout_guard(60)
def post_analysis(event, context):
    # Tracks: duration, memory usage, thresholds
```

## Retry Logic

### Exponential Backoff Schedule
```
Vision API (GPT-4o-mini):
  Attempt 1: Immediate
  Attempt 2: 1s delay (total: 1-16s)
  Attempt 3: 2s delay (total: 3-31s)
  Max total: ~45s

Gemini API:
  Attempt 1: Immediate
  Attempt 2: 0.5s delay (total: 0.5-8.5s)
  Attempt 3: 1s delay (total: 1.5-9.5s)
  Max total: ~15s
```

### Error Handling
```
Timeout (>55s) → Fallback
Rate Limit (429) → Retry
Invalid API Key (401) → Fallback
Network Error → Retry
```

## Memory Management

### Peak Usage by Handler
- scenarios: ~600MB
- analysis: ~900MB (most memory: agents + vision API response)
- profile: ~300MB
- analytics: ~400MB

**Buffer**: 1536MB - 900MB peak = 636MB headroom (40%)

### Memory Optimization Tips
1. Process images in chunks
2. Release large objects after use
3. Don't cache entire API responses
4. Stream responses to user when possible

## Cost Optimization

### Duration Billing
```
Billed in 100ms increments
Minimum 100ms charge

Example (post_analysis):
  Actual: 28.5s → Billed: 28.6s
  Cost: (28.6s × 1536MB / 1024) × $0.0000166667 ≈ $0.00007
```

### Cost Estimation (10 users, 10 req/day)
```
Scenarios (100/day):
  Avg 9s × 1536MB × 100 × $0.0000166667 ≈ $0.002/day

Analysis (100/day):
  Avg 28s × 1536MB × 100 × $0.0000166667 ≈ $0.007/day

Profile (50/day):
  Avg 1.5s × 1536MB × 50 × $0.0000166667 ≈ $0.0001/day

Analytics (10/day):
  Avg 2.5s × 1536MB × 10 × $0.0000166667 ≈ $0.00001/day

Total: ~$0.009/day = ~$0.27/month (Lambda only)
```

## Monitoring

### CloudWatch Metrics
```
- Invocations: Total requests
- Duration: Avg/Max/Min execution time
- Memory: Peak memory usage
- Errors: Failed invocations
- Throttles: Rate limit hits
```

### X-Ray Tracing
```
Query failed segments:
  aws xray get-trace-summaries --filter-expression "http.status >= 500"

Find slow requests:
  aws xray get-trace-summaries --filter-expression "duration > 30"

View service map:
  https://console.aws.amazon.com/xray/home#/service-map
```

### Custom Metrics
```
DynamoDB query latency
Vision API retry count
Memory usage over time
```

## Load Testing

### Expected Performance
```
10 concurrent users:
  P50 latency: 25-30s
  P99 latency: 35-40s
  Error rate: <1%

50 concurrent users:
  P50 latency: 30-35s (queue processing)
  P99 latency: 40-50s
  Error rate: <2%
```

### Scaling Triggers
```
At 50 users:
  Increase Lambda reserved concurrency to 20
  Monitor DynamoDB throttling

At 100 users:
  Consider Bedrock (managed LLM service)
  Consider async queue pattern

At 500+ users:
  Async architecture mandatory
  Separate Lambda functions per agent
```

## Performance Checklist

- [ ] Lambda memory: 1536 MB
- [ ] Lambda timeout: 60 seconds
- [ ] Reserved concurrency: 10
- [ ] API timeout: 55 seconds (< Lambda timeout)
- [ ] Retry logic: Exponential backoff
- [ ] Fallback scenarios: Hardcoded library
- [ ] Monitoring: @monitor_performance decorators
- [ ] X-Ray tracing: Enabled on all handlers
- [ ] CloudWatch alarms: Duration > 30s, Memory > 1200MB
- [ ] Load test: 10 concurrent users passing
- [ ] Memory leak test: Long-running steady state

## Common Issues & Solutions

### Issue: Timeout on first analysis
**Cause**: Vision API slow + retries
**Solution**: Increase timeout buffer, use async pattern

### Issue: Memory spike to 1400MB+
**Cause**: Large image processing or inefficient code
**Solution**: Process images in chunks, profile with CloudWatch

### Issue: High error rate at 50+ users
**Cause**: Lambda throttling or API rate limits
**Solution**: Increase reserved concurrency, add backoff jitter

### Issue: Cost explosion
**Cause**: Unnecessary retries or failed requests still billed
**Solution**: Implement better error handling, use fallbacks early
