# Architecture AWS ScamGuard v5.0

## ⚠️ CRITICAL UPDATES (v5.1)

This version includes critical security & performance fixes from the previous architecture:

| Issue | Severity | Fixed | Status |
|-------|----------|-------|--------|
| Lambda 512MB too small for vision analysis | 🔴 Critical | 1536MB (4x increase) | ✅ Implemented |
| Lambda timeout 30s insufficient | 🔴 Critical | 60s (2x increase) | ✅ Implemented |
| Cognito auto-verify email (takeover risk) | 🔴 Critical | Requires email confirmation | ✅ Implemented |
| Rate limiting paid rejected requests | 🟡 High | Moved to API Gateway throttling | ✅ Implemented |
| DynamoDB On-Demand more expensive | 🟡 High | Switched to Provisioned free tier | ✅ Implemented |
| Secrets rotation 90 days too long | 🟡 Medium | Reduced to 30 days | ✅ Implemented |
| No WAF for seniors (phishing risk) | 🟡 Medium | CloudFront WAF enabled | ✅ Implemented |
| API Gateway REST (legacy) | 🟢 Low | Migration to HTTP v2 | ⏳ Pending |

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                         UTILISATEUR                          │
│                    (Seniors - Navigateur)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFRONT CDN                          │
│  • Cache statique                                            │
│  • HTTPS automatique                                         │
│  • Latence optimisée                                         │
│  • WAF (SQL injection, XSS protection)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    S3 FRONTEND BUCKET                        │
│  • React PWA (build/)                                        │
│  • Service Worker                                            │
│  • Assets statiques                                          │
└─────────────────────────────────────────────────────────────┘

                         │ API Calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY HTTP v2                       │
│  • CORS configuré                                            │
│  • Throttling: 10 req/user/jour (rejette avant Lambda)       │
│  • Cognito Authorizer                                        │
│  • Logging + X-Ray                                           │
│  ⚠️  NOTE: Migration depuis REST vers HTTP v2 (33% moins cher)│
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   COGNITO USER POOL                          │
│  • Authentification email                                    │
│  • Password policy (min 12 chars, uppercase, numbers)        │
│  • Email verification required (confirmation code)           │
│  • MFA optional pour utilisateurs                            │
└─────────────────────────────────────────────────────────────┘

                         │ Authorized
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    LAMBDA FUNCTION                           │
│  Runtime: Python 3.12                                        │
│  Memory: 1536 MB (vision analysis GPT-4o-mini)              │
│  Timeout: 60s (vision API calls + agents)                   │
│  Tracing: X-Ray enabled                                      │
│  Concurrency: Reserved 10 (scale at 100+ users)              │
│  Dead Letter Queue: SQS (failed invocations)                 │
│                                                              │
│  Handlers:                                                   │
│  • POST /scenario    → ScenarioAgent + Cache                │
│  • POST /analyze     → Vision (GPT-4o-mini) + Agents        │
│  • GET  /profile     → User profile                          │
│  • GET  /analytics   → AnalyticsAgent                        │
│                                                              │
│  ⚠️  CRITICAL: Memory/timeout MUST be >= current specs       │
│      or vision analysis will timeout in production           │
└──┬────────┬──────────┬──────────┬───────────────────────────┘
   │        │          │          │
   │        │          │          │
   ▼        ▼          ▼          ▼
┌────┐  ┌────┐    ┌────┐    ┌─────────┐
│ DB │  │ S3 │    │SEC │    │  LLMs   │
└────┘  └────┘    └────┘    └─────────┘

┌─────────────────────────────────────────────────────────────┐
│                      DYNAMODB TABLE                          │
│  Name: ScamGuardData                                         │
│  Mode: Provisioned (25 WCU / 25 RCU = free tier)            │
│  Backup: Point-in-time recovery (35 jours)                  │
│  TTL: SCENARIO#<id> expire after 7 days                      │
│                                                              │
│  Schema:                                                     │
│  PK: USER#<id>     SK: PROFILE                               │
│  PK: USER#<id>     SK: SESSION#<timestamp>                   │
│  PK: USER#<id>     SK: ANALYTICS                             │
│  PK: USER#<id>     SK: QUOTA#<date>                          │
│  PK: SCENARIO#<id> SK: METADATA                              │
│                                                              │
│  📊 Capacity: 10 users × 10 req/day = ~100 writes/day       │
│     Provisioned 25 WCU covers 2.1M writes/day = Free tier   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    S3 UPLOADS BUCKET                         │
│  • Images utilisateurs                                       │
│  • Encryption: S3-managed                                    │
│  • Lifecycle: 30 jours                                       │
│  • Private (presigned URLs)                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SECRETS MANAGER                           │
│  • scamguard/gemini-key  (rotation: 30 days)                 │
│  • scamguard/openai-key  (rotation: 30 days)                 │
│  • Encryption: KMS managed key                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      LLMs EXTERNES                           │
│  • Gemini 1.5 Flash (free tier 1.5K/jour)                    │
│  • GPT-4o-mini (vision + analytics)                          │
│  • Retry logic: 3 tentatives                                 │
│  • Fallback automatique                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   CLOUDWATCH MONITORING                      │
│  Alarms:                                                     │
│  • Lambda errors > 5/5min                                    │
│  • Lambda duration > 10s                                     │
│  • DynamoDB throttling                                       │
│  • SNS notifications                                         │
│                                                              │
│  Logs:                                                       │
│  • API Gateway logs                                          │
│  • Lambda logs (retention: 7 jours)                          │
│  • X-Ray traces                                              │
└─────────────────────────────────────────────────────────────┘
```

## API Design Moderne (v5.1)

### RESTful Endpoints with Versioning

```
BASE_URL: https://api.scamguard.com/api/v1

POST   /scenarios              Create learning scenario
POST   /analysis               Analyze message/image + get feedback
GET    /profile                Get user profile & stats
GET    /analytics/summary      Dashboard data (user progress)
DELETE /sessions/{id}          Clear session history

POST   /auth/login             Email login (Cognito)
POST   /auth/verify-email      Submit verification code
POST   /auth/logout            Sign out
```

### Standard Error Response

```json
{
  "error": {
    "code": "VISION_ANALYSIS_TIMEOUT",
    "message": "GPT-4o-mini analysis exceeded 60s timeout",
    "details": "Try again with smaller image (< 5MB)",
    "trace_id": "x-ray-1a2b3c4d5e6f",
    "timestamp": "2026-02-16T10:30:45Z",
    "retry_after": 120
  }
}
```

**Error Codes (standardized):**
- `VISION_API_TIMEOUT` - GPT-4o-mini slow response
- `GEMINI_FREE_TIER_EXCEEDED` - Scenario generation quota hit
- `RATE_LIMIT_EXCEEDED` - User exceeded 10 requests/day
- `INVALID_IMAGE_FORMAT` - Image not JPG/PNG
- `COGNITO_EMAIL_NOT_VERIFIED` - Email confirmation pending
- `AUTH_EXPIRED` - Cognito token expired
- `DB_QUERY_FAILED` - DynamoDB error

### Request/Response Headers

**All Requests:**
```
Authorization: Bearer <cognito-id-token>
Content-Type: application/json
X-Request-ID: <uuid>              ← Generated by client
User-Agent: ScamGuard-iOS/1.0
```

**All Responses:**
```
X-Request-ID: <uuid>              ← Echo back for tracing
X-Trace-ID: x-ray-abc123          ← AWS X-Ray trace
X-RateLimit-Remaining: 7          ← Requests left today
X-RateLimit-Reset: 1708102800     ← Unix timestamp
```

### Request Tracing (X-Ray)
```python
# Lambda Handler
import json
import uuid
from aws_xray_sdk.core import xray_recorder

@xray_recorder.capture('analyze_message')
def lambda_handler(event, context):
    request_id = event['headers'].get('X-Request-ID', str(uuid.uuid4()))
    xray_recorder.put_annotation('request_id', request_id)
    xray_recorder.put_annotation('user_id', event['requestContext']['authorizer']['claims']['sub'])

    # All subsequent calls auto-traced
    result = analyze_vision(request_id)

    return {
        'statusCode': 200,
        'headers': {
            'X-Request-ID': request_id,
            'X-Trace-ID': context.aws_request_id
        },
        'body': json.dumps(result)
    }
```

### Response Format (Standardized)

**Success (200):**
```json
{
  "data": {
    "scenario_id": "scen_abc123",
    "scenario": "You receive an email from 'Amazon Support'...",
    "difficulty": "easy"
  },
  "meta": {
    "request_id": "req_xyz789",
    "processed_at": "2026-02-16T10:30:45Z",
    "trace_id": "x-ray-1a2b3c4d5e6f"
  }
}
```

**Error (4xx/5xx):**
```json
{
  "error": { ... },
  "meta": {
    "request_id": "req_xyz789",
    "timestamp": "2026-02-16T10:30:45Z",
    "trace_id": "x-ray-1a2b3c4d5e6f"
  }
}
```

---

## Flux de données

### 1. Génération Scénario
```
User → CloudFront → API Gateway → Cognito → Lambda
                                              ↓
                                    Check cache DynamoDB
                                              ↓
                                    Cache miss → Gemini API
                                              ↓
                                    Store in DynamoDB (TTL 7j)
                                              ↓
                                    Return scenario
```

### 2. Analyse Message
```
User uploads image → S3 presigned URL → S3 Bucket
                                          ↓
User submits → API Gateway → Lambda → Get image from S3
                                          ↓
                                    GPT-4o-mini (vision)
                                          ↓
                                    DetectionAgent analysis
                                          ↓
                                    CoachingAgent feedback
                                          ↓
                                    Store session DynamoDB
                                          ↓
                                    Return results
```

### 3. Rate Limiting (Throttling at API Gateway)
```
Request → API Gateway Throttle
                    ↓
            User token tracked
                    ↓
            Count < 10/day? → Forward to Lambda
            Count >= 10/day? → Reject 429 (no Lambda invoke)
                    ↓
            Lambda executes (only if allowed)
```

**Implementation Details:**
- Throttling happens at API Gateway level (rejets before Lambda)
- Avoid paying for rejected requests
- Real-time tracking via X-Ray/CloudWatch

## Coûts mensuels (10 users)

| Service | Ancien | Nouveau | Notes |
|---------|--------|---------|-------|
| API Gateway HTTP v2 | - | $0 | REST→v2: 33% cheaper, same free tier |
| Lambda (1536 MB) | $0 | $0 | Within free tier (1M invokes/month) |
| DynamoDB Provisioned | $0 | $0 | 25 WCU/RCU free tier = 2.1M writes/day |
| DynamoDB Backup | $0.20 | $0.20 | Point-in-time recovery |
| Secrets Manager | $0.80 | $0.80 | 30-day rotation (updated from 90d) |
| KMS for Secrets | - | $1.00 | Encryption key (new) |
| S3 | $0.10 | $0.10 | Uploads + Frontend |
| CloudWatch | $0.50 | $0.50 | Logs + Alarms |
| CloudFront | $0 | $0 | Free tier |
| CloudFront WAF | - | $5.00 | **NEW**: SQL injection/XSS protection |
| Cognito | $0 | $0 | Free tier |
| Gemini API | $0 | $0 | Free tier 1.5K/day |
| GPT-4o-mini | $2-3 | $2-3 | Vision analysis (main cost) |
| SQS DLQ | - | $0 | Dead letter queue (free tier) |
| **TOTAL** | **$4-5** | **$10-11/mois** | +$6 for WAF (security investment) |

**Cost Analysis:**
- ✅ Lambda upgraded from 512MB → 1536MB (within free tier, no cost increase)
- ✅ DynamoDB: On-Demand → Provisioned free tier (no cost difference)
- ⚠️ WAF added: +$5/month (necessary for seniors, reduces XSS/injection risk)
- ℹ️ Secrets rotation: 90j → 30j (best practice, no cost change)

## Sécurité

### ✅ Implemented
- HTTPS partout (CloudFront + API Gateway + TLS 1.3)
- Secrets Manager avec rotation 30 jours (updated from 90d)
- Cognito authentication + email verification required (fixed: auto-verify removed)
- API Gateway throttling (10 req/user/day - rejects before Lambda)
- CORS configuré (specifique origins)
- S3 encryption at rest (S3-managed)
- DynamoDB encryption at rest
- KMS encryption for Secrets Manager (new)
- IAM least privilege (Lambda execution role)
- CloudWatch logging (7-day retention)
- X-Ray tracing
- WAF on CloudFront (SQL injection, XSS, bot protection)
- SQS Dead Letter Queue for Lambda failures (new)

### ⚠️ Security Notes
- **Email verification**: Must use confirmation code (not auto-verify)
- **MFA optional**: Recommend for sensitive scenarios
- **Password policy**: Minimum 12 chars (uppercase + numbers + special chars)
- **Rate limiting**: Enforced at API Gateway throttling (not Lambda)
- **Seniors risk**: Phishing vectors high - WAF + monitoring critical

## Scalabilité & Growth Path

| Users | Daily Requests | Actions | Timeline |
|-------|-----------------|---------|----------|
| **10** | ~100 | Current architecture OK | ✅ Ready |
| **50** | ~500 | Increase rate limit to 20/day; Monitor Lambda duration | 3-6 months |
| **100** | ~1K | Lambda reserved concurrency (10); DynamoDB → 100 WCU/RCU | 6-12 months |
| **500** | ~5K | Consider Bedrock for SLA; Migrate to multi-region DynamoDB | 12+ months |
| **1000+** | ~10K | Separate Lambda functions per agent; Queue-based async processing | 18+ months |

### Critical Limits
- **Lambda timeout**: Currently 60s - Vision analysis must complete within this
- **API Gateway**: Throttling 10/req/user/day - can be increased per tier
- **Gemini free tier**: 1.5K requests/day - sufficient until 150 users
- **GPT-4o-mini**: Costs scale linearly with vision requests (~$0.001 per request)

### Database Scaling
- 10-100 users: Provisioned 25 WCU/RCU (free tier)
- 100-500 users: Provisioned 100+ WCU/RCU (~$50-100/month)
- 500+ users: Consider DynamoDB Global Tables + Bedrock (AWS managed)

---

## Async Architecture (Post-100 users)

### Current Limitation (Sync)
```
User Request
    ↓
Lambda → GPT-4o-mini (8-15s) → Analysis (2-3s) → Return
    ↑ Client waiting ~20s total, 60s timeout risk
```

**Problem:** If vision API slow, user waits. If > 60s, timeout = failure.

### Modern Pattern (Async Queue)
```
User Request
    ↓
Lambda ① → Queue (SQS) → Return 202 Accepted + job_id
    ↓
Client gets response immediately

Background Processing:
    ↓
Lambda ② (from SQS) → GPT-4o-mini (vision) → Analysis → Store DB
    ↓
User polls /analysis/{job_id}/status or Websocket
```

### Implementation (When to Migrate)

**Timeline: When reaching 100+ users**

**New Architecture:**
```
┌────────────────────────────────────┐
│ POST /api/v1/analysis              │
│ (async endpoint)                   │
└────────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Lambda Orchestrator│
    │ • Validate input   │
    │ • Push to SQS      │
    │ • Return 202 + ID  │
    │ (< 1s)             │
    └────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ SQS Queue          │
    │ (Vision Jobs)      │
    └────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Lambda Worker      │
    │ • Get image S3     │
    │ • GPT-4o-mini      │
    │ • Agents analysis  │
    │ • Store results    │
    │ (30-60s)           │
    └────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ DynamoDB           │
    │ SESSION#async_123  │
    │ (status: done)     │
    └────────────────────┘

User polls: GET /api/v1/analysis/async_123/status
Response: {
  "status": "completed",
  "result": { ... },
  "completed_at": "2026-02-16T10:31:45Z"
}
```

### API Changes

**Current (Sync):**
```
POST /api/v1/analysis
Body: { image_url, message, ... }
Response: 200 {
  "analysis": { detection, coaching, ... }
}
```

**Future (Async):**
```
POST /api/v1/analysis?mode=async
Body: { image_url, message, ... }
Response: 202 Accepted {
  "job_id": "async_abc123",
  "status_url": "/api/v1/analysis/async_abc123/status",
  "eta_seconds": 45
}

GET /api/v1/analysis/async_abc123/status
Response: 200 {
  "status": "processing",
  "progress": 65
}
// or when done:
Response: 200 {
  "status": "completed",
  "result": { analysis, coaching, ... },
  "completed_at": "2026-02-16T10:31:45Z"
}
```

### Benefits
- ✅ No 60s timeout risk
- ✅ Horizontal scaling (multiple workers)
- ✅ Better user experience (return immediately)
- ✅ Cost optimization (pay only for processing time)

### Cost Impact
- Before (sync): 1 Lambda invoke per request (10-20s duration)
- After (async): 2 Lambda invokes (orchestrator 1s + worker 45s) + SQS (free tier)
- **Net:** Same or slightly cheaper due to concurrency gains

---

## Implementation Checklist

### Phase 1: CRITICAL FIXES (Do First)
- [ ] Lambda: Increase memory to 1536 MB (from 512 MB)
- [ ] Lambda: Increase timeout to 60s (from 30s)
- [ ] Cognito: Remove auto-verify email, require confirmation code
- [ ] Cognito: Add password policy (min 12 chars, uppercase, numbers)
- [ ] API Gateway: Implement request throttling (10 req/user/day) at gateway level
- [ ] DynamoDB: Switch from On-Demand to Provisioned (25 WCU/RCU free tier)

### Phase 2: SECURITY HARDENING & MODERN API (Do Next)
- [ ] CloudFront: Enable WAF (SQL injection, XSS, rate limiting rules)
- [ ] Secrets Manager: Update rotation policy 90j → 30j
- [ ] Secrets Manager: Enable KMS encryption for secrets
- [ ] Lambda: Create SQS Dead Letter Queue
- [ ] Lambda: Add reserved concurrency (10)
- [ ] API Gateway: Switch from REST to HTTP v2 (33% cost saving)

### Phase 2b: MODERN API DESIGN (Parallel)
- [ ] Add `/api/v1/` versioning to all endpoints (no breaking changes in future)
- [ ] Standardize error responses (code, message, trace_id, retry_after)
- [ ] Add request/response headers (X-Request-ID, X-RateLimit-*)
- [ ] Implement X-Ray tracing on all Lambda handlers
- [ ] Add trace_id to all log entries
- [ ] Document API endpoints in OpenAPI 3.0 spec
- [ ] Test error scenarios (timeout, invalid input, rate limit)

### Phase 3: MONITORING & TESTING
- [ ] CloudWatch: Set up alarms (Lambda errors, duration, DynamoDB throttling)
- [ ] X-Ray: Verify tracing captures vision analysis flow
- [ ] Load test: Simulate 10 users × 10 requests/day
- [ ] Performance test: Vision analysis must complete within 60s
- [ ] Security test: WAF rules blocking SQL injection payloads

### Phase 4: DEPLOYMENT
- [ ] Test in staging environment first
- [ ] Deploy updates to production
- [ ] Monitor CloudWatch for 24 hours
- [ ] Document all configuration changes
- [ ] Brief support team on new email verification flow

---

## Troubleshooting

### API Design & Modern Standards

**Request Tracing:**
- Every request must have `X-Request-ID` header
- Lambda logs must include trace_id for correlation
- CloudWatch Insights: `fields @timestamp, trace_id, @message | stats count() by trace_id`

**Error Response Validation:**
- All errors return JSON with `error.code`, `error.message`, `trace_id`
- Never return generic 500 errors - always specific error codes
- Include `retry_after` header for rate limits

**Version Compatibility:**
- All endpoints use `/api/v1/` prefix
- When breaking change needed: introduce `/api/v2/` (keep v1)
- Use `X-API-Version` response header to indicate version

---

### Lambda Timeout (>60s)
- Check vision API response time (GPT-4o-mini)
- Monitor CloudWatch logs for slow agent processing
- If consistent, increase timeout further or split agents to parallel Lambda calls

### Rate Limit Errors (429)
- Check if user legitimately exceeded quota
- Verify API Gateway throttling is configured correctly
- Use CloudWatch to inspect request pattern

### Vision Analysis Failures
- Check Secrets Manager has valid OpenAI API key
- Verify image format (JPG/PNG) and size (<20MB)
- Monitor GPT-4o-mini API status on OpenAI dashboard

### Cognito Email Verification
- Check email confirmation code validity (default 24h)
- Verify SES has adequate sending quota
- Monitor CloudWatch for email delivery failures

---

**Last Updated:** February 16, 2026
**Version:** 5.2 (Modern API Design + Async Architecture)
**Status:** Ready for production (after Phase 1 & 2 implementation)

### What's New in v5.2
- ✅ Versioned API endpoints (`/api/v1/`)
- ✅ Standardized error responses with trace IDs
- ✅ Request/Response headers for tracing
- ✅ X-Ray distributed tracing integration
- ✅ Async architecture pattern (for 100+ users)
- ✅ OpenAPI 3.0 ready structure

### Next Review
- Post-Phase 2: Verify all endpoints return standardized format
- At 50 users: Monitor timeout patterns, plan Phase 3
- At 100 users: Evaluate async queue migration
