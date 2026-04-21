# AWS API Gateway Migration Guide

## ARCH.5 → Phase 6: Migration from Express to AWS API Gateway

This guide outlines how to migrate from the current Node.js Express-based API Gateway to AWS API Gateway for production deployment.

### Current State (ARCH.5)

```
Local Development:
Express.js Gateway (Port 8000)
├── Request ID injection (UUID)
├── CORS middleware
├── Input sanitization (DOMPurify)
├── JSON Schema validation (AJV)
├── Request logging (console)
├── Error handler (standardized)
├── Webhook router
└── Health check endpoint

Data Flow:
Vite Frontend (localhost:5173)
  ↓ (proxies /api/v1)
Express Dev Server (localhost:8000)
  ├── /api/v1/auth/*
  ├── /api/v1/family/*
  ├── /api/v1/webhooks/*
  └── /api/v1/tools/*
```

### Target State (Phase 6)

```
Production Deployment:
AWS Architecture:
CloudFront (CDN)
  ↓
API Gateway
  ├── Request validation (Models)
  ├── CORS configuration
  ├── Request/response mapping
  ├── Stage variables
  ├── CloudWatch logs
  ├── WAF integration
  └── Throttling/quotas
     ↓
ALB/NLB (Load Balancer)
  ↓
Lambda Functions (or ECS/EC2)
  ├── AuthHandler
  ├── FamilyHandler
  ├── ScamReportsHandler
  ├── ToolsHandler
  └── WebhookHandler
     ↓
DynamoDB (Data Layer)
```

### Migration Phases

#### Phase 6.1: Infrastructure Setup
- [ ] Create AWS API Gateway
- [ ] Configure CloudWatch Logs
- [ ] Set up Lambda execution roles
- [ ] Create DynamoDB tables
- [ ] Configure VPC endpoints

#### Phase 6.2: Model & Validation Migration
- [ ] Create API Models from JSON Schema
- [ ] Define request validators
- [ ] Map validation errors to responses
- [ ] Test request/response models

#### Phase 6.3: Lambda Handler Migration
- [ ] Extract business logic from Express routes
- [ ] Create individual Lambda functions
- [ ] Implement Lambda-to-API Gateway adapters
- [ ] Test Lambda execution

#### Phase 6.4: Logging & Monitoring
- [ ] Configure CloudWatch logging
- [ ] Create CloudWatch alarms
- [ ] Set up X-Ray tracing
- [ ] Implement request ID propagation

#### Phase 6.5: Webhook Processing
- [ ] Configure SNS/SQS for async processing
- [ ] Create webhook processor Lambda
- [ ] Set up DLQ for failed events
- [ ] Implement retry logic

#### Phase 6.6: Cutover
- [ ] Point DNS to API Gateway
- [ ] Run parallel testing
- [ ] Monitor metrics
- [ ] Rollback plan

### Component Mapping

#### 1. Request ID Tracking

**Current (Express):**
```javascript
router.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.set('X-Request-ID', req.id);
  next();
});
```

**Target (AWS API Gateway):**
```javascript
// Option 1: Use API Gateway request ID
const requestId = context.requestId;
context.succeed({
  statusCode: 200,
  headers: { 'X-Request-ID': requestId },
  body: JSON.stringify({ requestId })
});

// Option 2: Generate custom ID in Lambda
const requestId = uuid.v4();
context.succeed({
  statusCode: 200,
  headers: { 'X-Request-ID': requestId },
  body: JSON.stringify({ requestId })
});
```

**CloudWatch Integration:**
```javascript
// Log with request ID
console.log(`[${requestId}] Processing request`);

// CloudWatch Logs Insights query:
fields @timestamp, requestId, statusCode, latency
| filter requestId = "550e8400-e29b-41d4-a716-446655440000"
| stats count() by statusCode
```

#### 2. Input Validation

**Current (Express with AJV):**
```javascript
const schemaV1 = {
  'POST:/api/v1/auth/request-sms-otp': {
    type: 'object',
    properties: {
      phone: { type: 'string', minLength: 10 }
    },
    required: ['phone']
  }
};
```

**Target (API Gateway Models):**
```yaml
# CloudFormation/SAM
PhoneOTPSchema:
  type: object
  required:
    - phone
  properties:
    phone:
      type: string
      minLength: 10
      maxLength: 15
      pattern: '^\d{10,15}$'
  additionalProperties: false

# In API Gateway Resource Method:
RequestModels:
  application/json: PhoneOTPSchema
RequestValidatorId: !Ref RequestValidator
```

**API Gateway Models (AWS Console):**
```json
{
  "type": "object",
  "required": ["phone"],
  "properties": {
    "phone": {
      "type": "string",
      "minLength": 10,
      "maxLength": 15
    }
  }
}
```

#### 3. Input Sanitization

**Current (Express with DOMPurify):**
```javascript
router.use(inputSanitizer.middleware());
// Removes XSS, SQL injection, control chars
```

**Target (AWS WAF + Lambda):**
```javascript
// Option 1: AWS WAF Rules (managed)
- AWS-managed XSS rule
- AWS-managed SQL injection rule
- Custom rules for pattern matching

// Option 2: Lambda sanitization (before business logic)
const sanitizeInput = (event) => {
  const body = JSON.parse(event.body);
  return sanitizeObject(body);
};

// Option 3: API Gateway Request Transformer
ResponseTemplates:
  application/json: |
    {
      "body": $input.json('$.body'),
      "sanitized": true
    }
```

**AWS WAF Implementation:**
```yaml
WebACL:
  Name: ScamGuard-API-WAF
  Rules:
    - AWSManagedRulesCommonRuleSet
    - AWSManagedRulesSQLiRuleSet
    - AWSManagedRulesKnownBadInputsRuleSet
  DefaultAction: Allow
  VisibilityConfig:
    SampledRequestsEnabled: true
    MetricName: ScamGuardWAFMetrics
```

#### 4. CORS Configuration

**Current (Express with cors package):**
```javascript
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));
```

**Target (API Gateway):**
```yaml
# In API Gateway Resource
CORS:
  AllowedHeaders:
    - Content-Type
    - Authorization
    - X-Request-ID
  AllowedMethods:
    - GET
    - POST
    - PUT
    - DELETE
    - OPTIONS
  AllowedOrigins:
    - http://localhost:5173
    - http://localhost:3000
    - https://app.scamguard.io
  ExposeHeaders:
    - X-Request-ID
    - X-Response-Time
  MaxAge: 86400

# Enable CORS in API Gateway console:
1. Select resource
2. Click CORS
3. Configure allowed origins/headers/methods
4. Deploy API
```

**Programmatic Configuration (CDK/CloudFormation):**
```typescript
// CDK example
const api = new apigateway.RestApi(this, 'ScamGuardAPI');
api.root.addMethod('OPTIONS', new apigateway.MockIntegration({
  integrationResponses: [{
    statusCode: '200',
    responseParameters: {
      'method.response.header.Access-Control-Allow-Origin': "'*'",
      'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE'"
    }
  }]
}));
```

#### 5. Error Handling

**Current (Express global error handler):**
```javascript
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message,
      requestId: req.id
    }
  });
});
```

**Target (Lambda error handling):**
```javascript
// In Lambda handler
exports.handler = async (event, context) => {
  try {
    // Business logic
    return {
      statusCode: 200,
      body: JSON.stringify({ data })
    };
  } catch (error) {
    console.error('Error:', error);
    
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'SERVER_ERROR';
    
    return {
      statusCode,
      body: JSON.stringify({
        error: {
          code: errorCode,
          message: error.message,
          requestId: context.requestId
        }
      })
    };
  }
};

// Gateway Response Mapping (for non-200 responses)
ExceptionResponses:
  default:
    StatusCode: 500
    ResponseTemplates:
      application/json: |
        {
          "error": {
            "code": "GATEWAY_ERROR",
            "message": "Internal server error"
          }
        }
```

#### 6. Request Logging

**Current (Express console logging):**
```javascript
const logEntry = {
  requestId, method, path, statusCode, latency,
  clientIP, userAgent, timestamp
};
console.log(logEntry);
```

**Target (CloudWatch Logs):**
```javascript
// CloudWatch Logs integration
console.log(JSON.stringify({
  requestId: context.requestId,
  method: event.httpMethod,
  path: event.path,
  statusCode: response.statusCode,
  latency: Date.now() - startTime,
  clientIP: event.requestContext.identity.sourceIp,
  userAgent: event.headers['User-Agent'],
  timestamp: new Date().toISOString()
}));

// Enable in API Gateway:
// Execution Logs → Full request/response data
// Access Logs → CLF or custom format

// CloudWatch Logs Insights queries:
fields @timestamp, requestId, statusCode
| stats count() as requests, avg(latency) as avgLatency by statusCode

fields @timestamp, requestId, statusCode, @duration
| filter statusCode >= 400
| sort @timestamp desc
| limit 100
```

**API Gateway Logging Configuration:**
```yaml
MethodLogging:
  DataTraceEnabled: true
  LoggingLevel: INFO
  MetricsEnabled: true

LogGroup: /aws/apigateway/scamguard-api

CloudWatchMetrics:
  - Count
  - Duration
  - 4XX Errors
  - 5XX Errors
  - CacheHitCount
  - CacheMissCount
```

#### 7. Webhook Processing

**Current (Express webhook router + in-memory queue):**
```javascript
// Sync: Receive webhook → validate → queue
app.post('/webhooks/scam-reports', async (req, res) => {
  // Validate signature
  // Queue event
  res.status(202).json({ status: 'queued' });
});

// Async: Process queue every 5 seconds
setInterval(async () => {
  const events = eventQueue.filter(e => e.status === 'pending');
  // Process events
}, 5000);
```

**Target (Lambda + SNS/SQS):**
```javascript
// Webhook Receiver Lambda
exports.webhookReceiver = async (event, context) => {
  const body = JSON.parse(event.body);
  
  // Validate signature
  const isValid = validateWebhookSignature(body, headers);
  if (!isValid) return { statusCode: 401 };
  
  // Publish to SNS
  await sns.publish({
    TopicArn: process.env.WEBHOOK_TOPIC_ARN,
    Message: JSON.stringify(body),
    MessageAttributes: {
      requestId: { DataType: 'String', StringValue: context.requestId }
    }
  }).promise();
  
  return {
    statusCode: 202,
    body: JSON.stringify({ status: 'queued' })
  };
};

// Webhook Processor Lambda (triggered by SQS)
exports.webhookProcessor = async (event, context) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    try {
      // Process webhook
      await processScamReport(message);
      // Delete from queue (implicit with SQS)
    } catch (error) {
      // Move to DLQ (configured in SQS)
      throw error;
    }
  }
};
```

**Architecture:**
```
Webhook Receiver
  ↓
SNS Topic
  ├→ SQS Queue (main)
  └→ SQS DLQ (dead-letter)
     ↓
Lambda Processor (concurrent, max retry 3)
  ├→ Success: Delete from queue
  └→ Failure: Move to DLQ
```

#### 8. Health Check

**Current (Express endpoint):**
```javascript
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development'
  });
});
```

**Target (API Gateway + Lambda):**
```javascript
// Lambda health check
exports.healthCheck = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'production',
      requestId: context.requestId
    })
  };
};

// API Gateway integration:
// 1. Create /health resource
// 2. Attach GET method to health check Lambda
// 3. Configure CloudWatch Alarms on this endpoint
```

### Deployment Architecture

#### Current (Development)
```
Vite (port 5173)
  ↓ proxies /api/v1
Express Dev Server (port 8000)
  ↓
In-memory stores
```

#### Target (Production)
```
CloudFront Distribution
  ↓
API Gateway (managed, auto-scaling)
  ├── Request validation
  ├── CORS
  ├── CloudWatch logging
  ├── CloudWatch metrics
  └── X-Ray tracing
     ↓
Network Load Balancer
  ├── Health checks
  ├── Auto-scaling
  └── Cross-AZ distribution
     ↓
Lambda Auto Scaling Group
  ├── Warm starts
  ├── Concurrent execution limit
  ├── Reserved concurrency
  └── Dedicated VPC (optional)
     ↓
DynamoDB Global Secondary Indexes
  ├── User table (phone → userId)
  ├── Family table (familyId → members)
  ├── Reports table (reportId → data)
  ├── Webhooks table (eventId → status)
  └── Sessions table (sessionToken → user)
```

### Cost Optimization

#### Current (Express)
```
EC2 Instance: ~$10-20/month
Load Balancer: ~$15/month
Total: ~$25-35/month
(Underutilized for most of the day)
```

#### Optimized (Serverless)
```
API Gateway: Pay per 1M requests (~$3.50)
Lambda: Pay per execution + duration
DynamoDB: Pay per request or provisioned
CloudWatch: ~$5-10/month
CloudFront: ~$0.085 per GB

Advantages:
- No idle costs
- Auto-scales with demand
- Built-in redundancy
- Managed security
- Cost predictable
```

**Example Calculation (100K requests/month):**
```
API Gateway: $0.35
Lambda (128MB, 100ms avg): ~$0.20
DynamoDB: ~$1-2 (depends on read/write)
Total: ~$2-3/month for API Gateway + Lambda
```

### Rollback Plan

If API Gateway migration fails:

1. **DNS Failover**
   ```bash
   # Revert DNS to point to Express load balancer
   # TTL already reduced (5 minutes)
   # Takes ~5 minutes for propagation
   ```

2. **API Gateway Throttling**
   ```bash
   # If issues arise, set very low throttling
   # (before complete rollback)
   RateLimit: 1 request/sec
   BurstLimit: 0
   # Gracefully rejects new requests while maintaining connections
   ```

3. **Parallel Running**
   ```
   During migration:
   
   Old API (Express): 90% traffic
   New API (API GW): 10% traffic (canary)
     ↓
   Monitor metrics and errors
     ↓
   Gradually shift traffic (10% → 50% → 90% → 100%)
     ↓
   Decommission old API after 1 week
   ```

### Monitoring & Alarms

**Key Metrics to Monitor:**
```yaml
API Gateway:
  - 4XX Errors: Alert if > 1%
  - 5XX Errors: Alert if > 0.1%
  - Latency: Alert if p99 > 1000ms
  - Throttled requests: Alert if > 0
  - Cache hit rate: Track >= 80%

Lambda:
  - Duration: Track p99
  - Errors: Alert if > 0.1%
  - Throttles: Alert if > 0
  - Cold starts: Monitor but expect initial traffic spike
  - Concurrent executions: Reserve capacity

DynamoDB:
  - Consumed capacity: Track growth
  - Throttled requests: Alert if > 0
  - Latency: Monitor p99
  - Hot partitions: Monitor key distribution

CloudWatch:
  - Log group size: Monitor growth
  - Query performance: Track frequent queries
  - Cost: Monitor monthly charges
```

**Example CloudWatch Alarms:**
```typescript
// CDK
new cloudwatch.Alarm(this, 'APIGateway5XXErrors', {
  metric: api.metricServerError(),
  threshold: 10,
  evaluationPeriods: 5,
  period: Duration.minutes(1),
  alarmDescription: 'Alert on 5XX errors from API Gateway'
});

new cloudwatch.Alarm(this, 'LambdaErrors', {
  metric: lambda.metricErrors(),
  threshold: 1,
  evaluationPeriods: 1,
  period: Duration.minutes(1),
  alarmDescription: 'Alert on Lambda function errors'
});
```

### Testing Strategy

1. **Unit Testing**
   - Test Lambda handlers independently
   - Mock AWS services (DynamoDB, SNS, etc.)
   - Use AWS SDK mocks

2. **Integration Testing**
   - Test Lambda + DynamoDB interactions
   - Use localstack for local development
   - Test webhook flow end-to-end

3. **Staging Deployment**
   - Deploy to staging API Gateway
   - Run full test suite
   - Smoke test critical paths

4. **Canary Deployment**
   - Route 10% traffic to new API
   - Monitor metrics and errors
   - Gradually increase traffic

5. **Stress Testing**
   - Load test with expected peak traffic
   - Test auto-scaling behavior
   - Verify DynamoDB throttling handling

### Timeline

```
Week 1: Infrastructure setup
- Set up API Gateway, Lambda execution roles
- Configure DynamoDB
- Set up CloudWatch logs

Week 2: Model & Validation Migration
- Create API Gateway models from schemas
- Test request validators
- Document mapping

Week 3: Lambda Migration
- Migrate business logic to Lambda
- Test individual handlers
- Integration testing

Week 4: Webhook Processing
- Set up SNS/SQS
- Create webhook processor Lambda
- Test retry logic

Week 5: Logging & Monitoring
- Configure CloudWatch logging
- Set up alarms
- Create dashboards

Week 6: UAT & Testing
- Run parallel testing
- Validate error handling
- Performance testing

Week 7: Cutover
- Run canary deployment (10% → 50%)
- Monitor for issues
- Increase to 100%

Week 8: Monitoring
- Continue monitoring metrics
- Optimize costs
- Document lessons learned
```

### References

- [AWS API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Design Patterns](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [AWS WAF Rules](https://docs.aws.amazon.com/waf/latest/developerguide/)
- [CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)
