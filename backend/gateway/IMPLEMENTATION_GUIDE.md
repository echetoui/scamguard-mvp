# API Gateway Implementation Guide

## ARCH.5: API Gateway Setup - Complete Implementation

This document provides comprehensive implementation details for the ScamGuard API Gateway layer.

### Overview

The API Gateway provides a centralized request/response middleware layer that handles:
- Request ID generation & distributed logging
- Input validation & sanitization
- CORS configuration
- API versioning support
- Webhook processing
- Error handling & standardized responses
- Health monitoring
- OpenAPI documentation

### Architecture

```
Request Flow:
1. Request ID Injection (X-Request-ID generation/tracking)
2. CORS Middleware (origin validation)
3. Body Parsing (Express built-in)
4. Input Sanitization (XSS, SQL injection prevention)
5. Request Validation (JSON Schema validation)
6. Request Logging (latency, size, IP tracking)
7. Route Handlers
8. Error Handler (global exception handler)
```

### Components

#### 1. Gateway Core (`apiGateway.js`)

Main entry point that orchestrates all middleware:

```javascript
const { createAPIGateway } = require('./gateway/apiGateway');

const gateway = createAPIGateway({
  corsOrigin: 'http://localhost:5173',
  environment: 'development',
  logger: console
});

app.use('/api/v1', gateway.router);
app.use(gateway.errorHandler);
```

**Features:**
- Request ID injection via UUID
- CORS configuration
- Health check endpoint (`GET /health`)
- Middleware pipeline management
- OpenAPI spec generation

#### 2. Request Logger (`middleware/requestLogger.js`)

Logs all API requests with detailed metrics:

```
Log Entry Structure:
{
  requestId: string,          // Unique identifier
  method: string,             // HTTP method
  path: string,               // Request path
  statusCode: number,         // Response status
  latency: number,            // Response time in ms
  requestSize: number,        // Request body size
  responseSize: number,       // Response body size
  clientIP: string,           // Client IP (handles proxies)
  userAgent: string,          // User-Agent header
  timestamp: string,          // ISO 8601 timestamp
  query: object,              // Query parameters
  error: string               // Error message (if any)
}
```

**Usage:**
- Enables request tracing across distributed systems
- Monitors API performance (latency tracking)
- Tracks data transfer sizes
- Identifies client information

#### 3. Input Sanitizer (`middleware/inputSanitizer.js`)

Sanitizes all incoming requests to prevent attacks:

```javascript
// Prevents:
// - XSS attacks (HTML/JS injection)
// - SQL injection
// - NoSQL injection
// - Directory traversal
// - Control character injection
```

**Applied to:**
- Request body (JSON)
- Query parameters
- URL paths (selective)
- Object keys (rejects `__proto__`, `constructor`)

**Limits (DoS prevention):**
- Max array size: 1000 items
- Max object keys: 100
- Max string length: unlimited (but trimmed)
- Max recursion depth: 10 levels

#### 4. Request Validator (`middleware/requestValidator.js`)

Validates all requests against JSON Schema:

```javascript
// Example Schema Definition:
'POST:/api/v1/auth/request-sms-otp': {
  type: 'object',
  properties: {
    phone: { type: 'string', minLength: 10, maxLength: 15 }
  },
  required: ['phone'],
  additionalProperties: false
}
```

**Capabilities:**
- Type validation (string, number, boolean, object, array)
- Format validation (email, date-time, uuid, etc.)
- Range validation (min/max, pattern)
- Enum validation
- Required field enforcement
- Additional property rejection (security)

**Added Schemas:**
- Auth endpoints (SMS OTP, password reset, session validation)
- Family endpoints (create, join)
- Scam reports
- Tool endpoints (check-email, check-advisor)
- Notification endpoints
- Webhook endpoints

#### 5. CORS Configuration (`middleware/corsConfig.js`)

Configures Cross-Origin Resource Sharing:

```javascript
Allowed Origins:
- http://localhost:5173 (Vite frontend)
- http://localhost:3000 (Alternative frontend)
- http://localhost:8000 (Same-origin)
- Custom CORS_ORIGIN env var

Allowed Methods:
- GET, POST, PUT, DELETE, PATCH, OPTIONS

Allowed Headers:
- Content-Type
- Authorization
- X-Request-ID
- X-API-Key
- Accept

Exposed Headers:
- X-Request-ID
- X-Response-Time
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset

Max Age: 86400s (24 hours)
Credentials: Allowed
```

#### 6. Error Handler (`middleware/errorHandler.js`)

Global error handler with standardized responses:

```javascript
Error Codes:
- VALIDATION_ERROR (400)
- UNAUTHORIZED (401)
- FORBIDDEN (403)
- NOT_FOUND (404)
- CONFLICT (409)
- RATE_LIMITED (429)
- SERVER_ERROR (500)
- GATEWAY_ERROR (502)
- SERVICE_UNAVAILABLE (503)

Response Format:
{
  error: {
    code: string,           // Error code
    message: string,        // User-friendly message
    details: object,        // Dev mode only
    timestamp: string,      // ISO 8601
    requestId: string       // Request ID for tracking
  }
}
```

#### 7. Webhook Router (`webhooks/webhookRouter.js`)

Handles incoming webhook requests:

**Endpoints:**

1. `POST /webhooks/scam-reports`
   - Accepts incoming scam reports from external systems
   - Validates signature (HMAC-SHA256)
   - Returns: 202 Accepted (async processing)

2. `GET /webhooks/events`
   - Lists webhook events and metrics
   - Returns: Event metrics and recent events

3. `GET /webhooks/events/:eventId`
   - Get specific event status
   - Returns: Event details

4. `POST /webhooks/events/:eventId/retry`
   - Manually retry failed event
   - Returns: Queued for retry

5. `POST /webhooks/events/:eventId/acknowledge`
   - Mark event as processed
   - Returns: Processed status

**Expected Webhook Payload:**
```javascript
{
  reportId: string,                    // External report ID
  scamType: enum,                      // PHISHING|MALWARE|FRAUD|SOCIAL_ENGINEERING|OTHER
  description: string,                 // Detailed description
  evidence: object,                    // Optional evidence
  reportedAt: string,                  // ISO 8601 timestamp
  source: string                       // External system name
}
```

#### 8. Webhook Validator (`webhooks/webhookValidator.js`)

Validates webhook signatures using HMAC-SHA256:

```javascript
Signature Generation:
message = `${timestamp}.${JSON.stringify(payload)}`
signature = base64(HMAC-SHA256(message, WEBHOOK_SECRET))

Verification:
- Check X-Webhook-Signature header
- Check X-Webhook-Timestamp header
- Verify timestamp is within 5 minutes (replay attack prevention)
- Compare signatures using constant-time comparison
```

**Environment Variable:**
```bash
WEBHOOK_SECRET=your-webhook-secret-key-here
```

#### 9. Webhook Queue (`webhooks/webhookQueue.js`)

In-memory event queue with retry logic:

```javascript
Features:
- Event queueing with pending status
- Exponential backoff retry (2^attempt * 5s)
- Max 3 retry attempts
- Dead-letter queue for failed events
- Queue statistics and metrics
- Event processing status tracking

Queue States:
pending -> processing -> processed (success)
pending -> processing -> pending (retry)
pending -> processing -> failed -> dead-letter (max retries exceeded)
```

#### 10. OpenAPI Specification (`openapi/openApiSpec.js`)

Generates OpenAPI 3.0 specification:

```javascript
Includes:
- All endpoints with detailed descriptions
- Request/response schemas
- Parameter definitions
- Security schemes (Bearer auth)
- Error response definitions
- Example values

Usage:
const spec = gateway.getOpenAPISpec('http://localhost:8000');
// Can be served via: /api/v1/docs/openapi.json
```

### Integration

#### With Dev Server

```javascript
const { createAPIGateway } = require('./gateway/apiGateway');

// In dev-server.js:
const gateway = createAPIGateway({
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  environment: process.env.NODE_ENV || 'development'
});

// Use gateway router
app.use('/api/v1', gateway.router);

// Register error handler LAST
app.use(gateway.errorHandler);

// 404 handler
app.use(errorHandler.notFoundHandler());
```

#### With Express App

```javascript
const express = require('express');
const { createAPIGateway } = require('./gateway/apiGateway');

const app = express();

// Body parser MUST be before gateway
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize gateway
const gateway = createAPIGateway();

// Mount gateway
app.use('/api', gateway.router);

// Mount error handler LAST
app.use(gateway.errorHandler);
```

### Request ID Tracking

Every request gets a unique ID for distributed logging:

```
Header: X-Request-ID
Value: UUID v4 (or provided value)

Propagation:
1. Generated/extracted at gateway
2. Added to response header
3. Included in all logs
4. Used for error tracking
5. Can be passed downstream to microservices

Example:
Request:  GET /api/v1/health
Response: X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
Log:      requestId: "550e8400-e29b-41d4-a716-446655440000"
```

### Validation Schema Management

Schemas are defined per endpoint and method:

```javascript
// Add new schema:
schemaV1['POST:/api/v2/new-endpoint'] = {
  type: 'object',
  properties: {
    field1: { type: 'string', minLength: 1 },
    field2: { type: 'number', minimum: 0 }
  },
  required: ['field1'],
  additionalProperties: false
};

// Compile schema (done automatically)
compiledSchemas[key] = ajv.compile(schema);

// Validation runs automatically in middleware
```

### Testing

Run test suite:

```bash
# All tests
npm test

# API Gateway tests
npm test -- __tests__/apigateway.test.js

# Webhook tests
npm test -- __tests__/webhooks.test.js

# Coverage report
npm test -- --coverage
```

**Test Coverage:**
- Request ID generation (uniqueness, custom headers)
- Input sanitization (XSS, SQL injection, control chars)
- Request validation (all endpoint schemas)
- CORS configuration
- Health check endpoint
- Error handling (all error types)
- Request logging (metadata capture)
- OpenAPI spec generation
- Webhook signature validation
- Webhook queue management
- Complete request lifecycle

### Performance Considerations

#### Request Logging Overhead
- ~1-2ms per request for logging
- Latency tracked and reported in response header
- Stored in memory (replace with database for production)

#### Validation Overhead
- ~0.5-1ms per request for schema validation
- Schemas pre-compiled for performance
- AJV optimized with `coerceTypes: true`

#### Sanitization Overhead
- ~2-5ms per request (depends on payload size)
- DOMPurify used for XSS protection
- Recursive sanitization limited to depth 10

#### Queue Processing
- Webhook events processed every 5 seconds
- Exponential backoff for retries
- Dead-letter queue for unprocessable events

### Security Considerations

#### Input Validation
- JSON Schema enforces structure
- Type coercion prevents type confusion attacks
- Additional properties rejected (prevents pollution)

#### Input Sanitization
- XSS protection via DOMPurify
- Control character removal
- SQL injection pattern detection
- Prototype pollution prevention (`__proto__`, `constructor`)
- Array/object size limits (DoS prevention)

#### CORS
- Origin whitelist (localhost:5173, localhost:3000, localhost:8000)
- Credentials allowed (same-origin requests)
- Preflight requests handled
- Expose headers limited

#### Webhook Security
- HMAC-SHA256 signature validation
- Timestamp verification (5-minute window, replay attack prevention)
- Constant-time signature comparison
- Event queue with retry and DLQ

#### Error Handling
- Detailed errors in development only
- Stack traces hidden in production
- Consistent error response format
- Request ID in all errors for tracking

### Migration to AWS API Gateway (Phase 6)

The current implementation prepares for AWS API Gateway migration:

```
Current: Node.js Express Gateway
├── Request ID injection
├── Validation (AJV)
├── Sanitization (DOMPurify)
├── Logging (Console)
└── Error handling

AWS Phase 6:
├── AWS API Gateway (replaces Express gateway)
├── CloudWatch Logs (replaces console)
├── API Gateway Models (replaces AJV)
├── AWS WAF (replaces sanitizer)
├── ALB/NLB (load balancing)
└── Lambda handlers (replaces Express routes)

Compatibility:
✓ Request/Response format unchanged
✓ Error codes compatible
✓ Validation rules can be migrated to API Gateway Models
✓ Logging pattern compatible with CloudWatch
✓ OpenAPI spec usable in API Gateway
```

### Environment Variables

```bash
# CORS
CORS_ORIGIN=http://localhost:5173

# Environment
NODE_ENV=development

# Webhooks
WEBHOOK_SECRET=your-secret-key-change-in-production

# Logging (future)
LOG_LEVEL=info
LOG_DESTINATION=console
```

### Monitoring & Debugging

#### View API Gateway Health
```bash
curl http://localhost:8000/api/v1/health

# Response:
{
  "status": "healthy",
  "timestamp": "2026-04-16T12:00:00.000Z",
  "uptime": 1234.56,
  "environment": "development",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Monitor Webhook Events
```bash
curl http://localhost:8000/api/v1/webhooks/events

# Response includes:
{
  "metrics": {
    "received": 10,
    "processed": 8,
    "failed": 0,
    "lastProcessed": "2026-04-16T12:00:00.000Z"
  },
  "events": [...]
}
```

#### View Webhook Event Details
```bash
curl http://localhost:8000/api/v1/webhooks/events/webhook_abc123

# Response:
{
  "id": "webhook_abc123",
  "reportId": "ext-123",
  "status": "processed",
  "scamType": "PHISHING",
  "receivedAt": "2026-04-16T12:00:00.000Z"
}
```

### Troubleshooting

#### Validation Errors
Check request schema matches defined schema in `requestValidator.js`
- All required fields present
- Fields match expected types
- String lengths within bounds
- Enum values are valid

#### Sanitization Issues
If legitimate content is being sanitized:
- Check DOMPurify sanitization rules in `inputSanitizer.js`
- May need to adjust for specific use cases
- SQL injection detection patterns may be too strict

#### Webhook Signature Failures
- Verify `WEBHOOK_SECRET` matches sender's key
- Check timestamp is current (not >5 minutes old)
- Ensure payload hasn't been modified
- Use `generateWebhookSignature` for testing

#### CORS Issues
- Check `corsOrigin` environment variable
- Verify origin is in allowed list
- Check preflight requests are returning 200

### Future Enhancements

1. **Rate Limiting**: Implement per-endpoint rate limits
2. **Caching**: Add response caching for GET requests
3. **Request Signing**: Add client certificate support
4. **API Keys**: Implement API key management
5. **Analytics**: Add detailed performance analytics
6. **Circuit Breaker**: Implement for downstream services
7. **Request Deduplication**: Prevent duplicate processing
8. **Metrics**: Prometheus/CloudWatch metrics export

### References

- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.0)
- [AJV JSON Schema Validator](https://ajv.js.org/)
- [DOMPurify Sanitization](https://github.com/cure53/DOMPurify)
- [HMAC-SHA256 Signatures](https://tools.ietf.org/html/rfc4868)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
