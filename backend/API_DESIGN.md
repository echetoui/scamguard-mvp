# ScamGuard Modern API Design v5.2

## Overview

Modern RESTful API with versioning, standardized responses, and comprehensive error handling.

## Versioning Strategy

### Current Version
```
/api/v1/     ← All endpoints here
```

### Future Compatibility
```
/api/v1/      ← Stable (backwards compatible)
/api/v2/      ← New features (breaking changes only)
```

**Migration Path**: Client migrates on their schedule. Old version deprecated after 12 months.

## Endpoint Structure

All endpoints follow the pattern:
```
https://api.scamguard.com/api/v1/{resource}
```

### Available Endpoints

#### Scenarios
```
POST   /api/v1/scenarios              Generate learning scenario
```

#### Analysis
```
POST   /api/v1/analysis               Analyze message/image
```

#### Profile
```
GET    /api/v1/profile                Get user profile
```

#### Analytics
```
GET    /api/v1/analytics/summary      Get learning analytics
```

#### Documentation
```
GET    /api/docs                      Swagger UI
GET    /api/openapi.json              OpenAPI spec (JSON)
GET    /api/openapi.yaml              OpenAPI spec (YAML)
```

#### Health
```
GET    /health                        Health check
```

## Request Format

### Headers

**Required**:
```
Authorization: Bearer <cognito-id-token>
Content-Type: application/json
```

**Optional but Recommended**:
```
X-Request-ID: <uuid>                 ← Unique request identifier
```

### Body

```json
{
  "field1": "value1",
  "field2": 123
}
```

Example (POST /api/v1/scenarios):
```json
{
  "difficulty": "medium"
}
```

## Response Format

### Success Response (2xx)

```json
{
  "data": {
    "id": "scenario_123",
    "difficulty": "medium",
    "scenario": "You receive an email...",
    "indicators": ["indicator1", "indicator2"],
    "tactics": ["urgency", "authority"]
  },
  "meta": {
    "request_id": "req_abc123",
    "processed_at": "2026-02-16T10:30:45Z",
    "trace_id": "x-ray-trace-id"
  }
}
```

### Error Response (4xx, 5xx)

```json
{
  "error": {
    "code": "VISION_ANALYSIS_TIMEOUT",
    "message": "GPT-4o-mini analysis exceeded 60s timeout",
    "details": "Vision API call took too long",
    "trace_id": "x-ray-trace-id",
    "timestamp": "2026-02-16T10:30:45Z",
    "retry_after": 60
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-02-16T10:30:45Z"
  }
}
```

## Response Headers

### Success
```
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-ID: req_abc123
X-Trace-ID: x-ray-trace-id
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1708102800
```

### Rate Limit
```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1708102800
```

## Error Codes

### Vision Analysis Errors
- `VISION_ANALYSIS_TIMEOUT` - Analysis exceeded timeout (500)
- `VISION_API_ERROR` - GPT-4o-mini API error (500)
- `IMAGE_TOO_LARGE` - Image exceeds 20MB (400)
- `INVALID_IMAGE_FORMAT` - Not JPG/PNG (400)

### Scenario Errors
- `SCENARIO_GENERATION_FAILED` - Gemini API error (500)
- `GEMINI_FREE_TIER_EXCEEDED` - Daily quota exceeded (429)

### Authentication Errors
- `UNAUTHORIZED` - Invalid/missing token (401)
- `AUTH_EXPIRED` - Token expired (401)
- `COGNITO_EMAIL_NOT_VERIFIED` - Email not verified (401)

### Rate Limiting
- `RATE_LIMIT_EXCEEDED` - 10 requests/day limit hit (429)

### Database Errors
- `DB_QUERY_FAILED` - DynamoDB error (500)

### Validation Errors
- `INVALID_DIFFICULTY` - difficulty not easy/medium/hard (400)
- `MISSING_DATA` - Required field missing (400)

## Request Tracing

Every request gets a unique trace ID:

**Request**:
```
POST /api/v1/analysis
X-Request-ID: req_abc123
```

**Response**:
```
X-Request-ID: req_abc123       ← Echo back
X-Trace-ID: x-ray-xyz789       ← AWS X-Ray trace
```

**CloudWatch Logs**:
```
[req_abc123] User analysis started
[req_abc123] Calling GPT-4o-mini vision...
[req_abc123] Vision analysis completed (28.5s)
[req_abc123] DetectionAgent processing...
[req_abc123] Request complete
```

## Rate Limiting

### Limits
- **10 requests per user per day**
- Resets daily at midnight UTC
- Includes all endpoint types

### Headers
```
X-RateLimit-Limit: 10          ← Total limit
X-RateLimit-Remaining: 7       ← Requests left
X-RateLimit-Reset: 1708102800  ← Unix timestamp of reset
```

### When Limit Exceeded
```
HTTP/1.1 429 Too Many Requests
Retry-After: 86400

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 86400s",
    "retry_after": 86400
  }
}
```

## Request/Response Examples

### Example 1: Generate Scenario

**Request**:
```bash
curl -X POST https://api.scamguard.com/api/v1/scenarios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: req_user123_1" \
  -d '{"difficulty": "medium"}'
```

**Response (200)**:
```json
{
  "data": {
    "id": "scenario_user123_5678",
    "difficulty": "medium",
    "scenario": "You receive a call from someone claiming...",
    "indicators": ["Urgency", "Authority", "Personal info request"],
    "tactics": ["authority", "urgency", "fear"],
    "attempts": 1
  },
  "meta": {
    "request_id": "req_user123_1",
    "processed_at": "2026-02-16T10:30:45Z",
    "trace_id": "x-ray-abc-123-def"
  }
}
```

### Example 2: Analyze Message with Timeout

**Request**:
```bash
curl -X POST https://api.scamguard.com/api/v1/analysis \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://s3.amazonaws.com/...",
    "message": "Please verify your account"
  }'
```

**Response (500)** - After retries failed:
```json
{
  "error": {
    "code": "VISION_ANALYSIS_TIMEOUT",
    "message": "GPT-4o-mini analysis exceeded 60s timeout",
    "details": "Attempted 3 retries with exponential backoff",
    "trace_id": "x-ray-xyz-789",
    "timestamp": "2026-02-16T10:31:15Z",
    "retry_after": 120
  },
  "meta": {
    "request_id": "req_user123_2",
    "timestamp": "2026-02-16T10:31:15Z"
  }
}
```

### Example 3: Rate Limit Exceeded

**Response (429)**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 86400s",
    "trace_id": "x-ray-abc",
    "retry_after": 86400,
    "timestamp": "2026-02-16T10:32:00Z"
  },
  "meta": {
    "request_id": "req_user123_11",
    "timestamp": "2026-02-16T10:32:00Z"
  }
}
```

## Backward Compatibility

### Adding New Fields
✅ **SAFE**: Add optional `data` fields
```json
{
  "data": {
    "id": "...",
    "existing_field": "...",
    "new_optional_field": "..."
  }
}
```

❌ **NOT SAFE**: Remove or rename fields
❌ **NOT SAFE**: Change response status codes
❌ **NOT SAFE**: Add required fields without default

### Deprecation Process
1. **Month 1**: New endpoint at `/api/v2/`
2. **Month 2-12**: Both `/api/v1/` and `/api/v2/` work
3. **Month 12**: Announce deprecation
4. **Month 24**: Remove `/api/v1/`

## Testing

### Unit Tests
- Response builders (success, error, rate limit)
- Authentication extraction
- Permission checking

### Integration Tests
- End-to-end API flow
- Error scenarios
- Rate limiting
- Tracing

### Load Tests
- 10 concurrent users
- 100 requests/minute
- Measure latency, memory, errors

## Documentation

### Swagger UI
```
GET /api/docs
```

Opens interactive API documentation. Try-it-out functionality requires Bearer token in Authorization header.

### OpenAPI Spec
```
GET /api/openapi.json     (JSON)
GET /api/openapi.yaml     (YAML)
```

Full specification for code generation.

## Client SDK Generation

Generate SDKs from OpenAPI spec:

```bash
# TypeScript/JavaScript
npx openapi-generator-cli generate -i openapi.yaml -g typescript-axios -o ./sdk

# Python
openapi-generator-cli generate -i openapi.yaml -g python -o ./sdk

# Go
openapi-generator-cli generate -i openapi.yaml -g go -o ./sdk
```

## Monitoring

### Key Metrics
- Request count by endpoint
- P50/P99 latency per endpoint
- Error rate by error code
- Rate limit hits per user
- X-Ray service map

### CloudWatch Logs
```
[request_id] [user_id] [endpoint] [duration] [status] [error_code]
```

### Alarms
- Error rate > 1%
- P99 latency > 40s
- Rate limit errors > 10/min
- 5xx errors > 5/5min
