# API Layer Serverless Migration: Express.js → Lambda + API Gateway
**Date:** April 16, 2026  
**Current Status:** Express.js running in dev-server.js (needs serverless conversion)  
**Target:** Lambda + API Gateway (HTTP v2) - Zero-cost at startup scale  

---

## Current Situation: Express.js Is Not Serverless

Your existing `dev-server.js` runs Express.js, which means:
- ❌ Needs always-running container or EC2
- ❌ Fixed cost ~$10-20/month for basic tier
- ❌ Manual scaling required at 100+ users
- ❌ Cold start delays (not for real-time apps, but adds latency)

**New situation with Lambda:**
- ✅ Zero infrastructure cost (<1M requests/month free)
- ✅ Auto-scales from 1 to 10,000 concurrent requests
- ✅ Pay only for actual usage ($0.000002 per request)
- ✅ Fully serverless (no EC2, no containers)

---

## Why Lambda Makes Sense for ScamGuard

### Current Load Profile (MVP)
```
10 users × 1000 requests/month = 10,000 requests/month
- Far below 1M free tier threshold
- Cost: $0 (completely free)
- EC2 equivalent: $10-20/month (even for smallest instance)

Result: Lambda saves 100% of API server costs
```

### Growth Scenario (200 users)
```
200 users × 1000 requests/month = 200,000 requests/month
- Still below 1M free tier
- Cost: $0 (still free!)
- Lambda free tier covers at 5x growth

At 1000 users (5M requests/month):
- Exceeds free tier by 4M requests
- Cost: 4M × $0.000002 = $8/month
- EC2 equivalent: Still need $20+/month
Result: Lambda pays for itself at scale
```

### Cost Comparison: Lambda vs EC2

```
SCENARIO          LAMBDA        EC2 (t3.micro)    t4g.small
──────────────────────────────────────────────────────────────
10 users          $0            $10/month         N/A
100 users         $0            $10/month         N/A
500 users         $0            $15/month         N/A
1,000 users       $8            $20/month         $15/month
2,000 users       $15           $30/month         $20/month
5,000 users       $40           $50/month         $30/month
10,000 users      $75           $100+/month       $60/month
```

**Lambda Advantage:**
- Months 1-6: Save $10-15/month
- Months 6-12: Savings grow as users scale
- Year 2: Lambda 30-50% cheaper than EC2
- Infrastructure: Zero (AWS manages everything)

---

## Migration Path: Express.js Code → Lambda Handler

### Step 1: Convert Express Routes to Lambda Handler Format

**Before (Express in dev-server.js):**
```javascript
// dev-server.js
const express = require('express');
const app = express();

app.post('/api/v1/analyze', (req, res) => {
  const { action, scenario, userResponse, imageBase64 } = req.body;
  // Process analysis
  res.json({ detection: { score }, coaching: { feedback } });
});

app.listen(3000, () => console.log('Server running'));
```

**After (Lambda Handler):**
```javascript
// lambda/handler.js
exports.handler = async (event, context) => {
  // API Gateway passes request as `event`
  const body = JSON.parse(event.body);
  const { action, scenario, userResponse, imageBase64 } = body;
  
  // Same analysis logic
  const result = { detection: { score }, coaching: { feedback } };
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  };
};
```

**Key Changes:**
- No `app.listen()` (Lambda handles HTTP automatically)
- HTTP method + path parsed from `event.httpMethod` and `event.path`
- Return object instead of `res.json()`
- Async function (native support for Promise-based handlers)

### Step 2: API Gateway Routes Configuration

API Gateway maps HTTP requests to Lambda:

```
POST /api/v1/analyze          → handler.js (analyzeMessage)
POST /api/v1/scenarios        → handler.js (generateScenario)
GET  /api/v1/profile          → handler.js (getProfile)
POST /api/v1/notifications/preferences → handler.js (setPreferences)
GET  /api/v1/notifications/preferences → handler.js (getPreferences)
```

**Configuration (as code):**
```python
# CDK (Python)
from aws_cdk import (
    aws_apigatewayv2 as apigatewayv2,
    aws_lambda as lambda_,
)

# Create Lambda function
handler = lambda_.Function(
    self, "ScamGuardHandler",
    runtime=lambda_.Runtime.PYTHON_3_12,
    handler="handler.main",
    code=lambda_.Code.from_asset("backend/lambda")
)

# Create HTTP API
api = apigatewayv2.HttpApi(
    self, "ScamGuardAPI",
    default_integration=apigatewayv2.HttpLambdaIntegration(
        "LambdaIntegration",
        handler
    )
)

# Routes
api.add_routes(
    path="/api/v1/analyze",
    methods=[apigatewayv2.HttpMethod.POST],
    integration=apigatewayv2.HttpLambdaIntegration(..., handler)
)
```

### Step 3: Authentication & Authorization

**Current:** Cognito authorizer already in place (good!)

```javascript
// Lambda receives authenticated claims
const userId = event.requestContext.authorizer.claims.sub;
const email = event.requestContext.authorizer.claims.email;

// Use these for authorization
if (!userId) {
  return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
}
```

### Step 4: Migration Checklist

```
Phase 1: Preparation
├─ [ ] Review all Express routes in dev-server.js
├─ [ ] List all endpoints needing Lambda conversion
├─ [ ] Test Express routes locally (document behavior)
└─ [ ] Create Lambda skeleton with route dispatcher

Phase 2: Lambda Implementation
├─ [ ] Convert each route to Lambda handler pattern
├─ [ ] Handle event.body parsing (Express auto-parses)
├─ [ ] Implement error handling (return proper status codes)
├─ [ ] Add CloudWatch logging (replaces console.log)
└─ [ ] Test each endpoint locally with sam cli

Phase 3: API Gateway Configuration
├─ [ ] Create HTTP v2 API
├─ [ ] Set up routes (POST /api/v1/analyze, etc.)
├─ [ ] Attach Cognito authorizer
├─ [ ] Configure CORS (if frontend on different domain)
└─ [ ] Set up request validation (schema)

Phase 4: Deployment
├─ [ ] Deploy Lambda function via CDK
├─ [ ] Update frontend API endpoints (from dev-server to API Gateway URL)
├─ [ ] Test all endpoints against deployed Lambda
├─ [ ] Monitor CloudWatch logs for errors
└─ [ ] Keep dev-server.js for local testing (optional)

Phase 5: Cleanup
├─ [ ] Remove dev-server.js Express.js dependencies
├─ [ ] Keep dev-server for integration testing (or switch to SAM local)
└─ [ ] Document new API Gateway URL for team
```

---

## Why HTTP v2 API (Not REST API)

**Comparison:**

```
FEATURE              REST API         HTTP v2          RECOMMENDATION
─────────────────────────────────────────────────────────────────────
Pricing              $3.50/M reqs     $1.00/M reqs     HTTP v2 (70% cheaper)
Startup              Designed 2015    Modern 2022      HTTP v2 (better)
Cold start latency   150-300ms        50-100ms         HTTP v2 (faster)
Payload size         10MB             10MB             Same
Authorization        Supports OAuth   Supports OAuth   Same
CORS setup           Complex          Simple           HTTP v2 (easier)
Deployment           CloudFormation   CDK/SAM          Both work
─────────────────────────────────────────────────────────────────────
VERDICT              Legacy           Modern Standard  Use HTTP v2
```

**Cost Difference at Scale:**
```
1M requests/month:
- REST API:  $3.50
- HTTP v2:   $1.00
- Savings:   $2.50/month

5M requests/month:
- REST API:  $17.50
- HTTP v2:   $5.00
- Savings:   $12.50/month

The current project uses REST API (older). Switch to HTTP v2 for new features.
```

---

## Lambda Function Specifications for ScamGuard

### Memory & Timeout

```
Memory:  1536 MB (same as current architecture)
Timeout: 60 seconds (same as current)
Reason:  Vision analysis (GPT-4o-mini) needs 8-15 seconds
         + Agent processing needs 5-10 seconds
         = Total 15-30s typical, 60s max safe
```

### Concurrency

```
Unreserved concurrency: Scales automatically (1 to 1,000+ parallel)

At 10 users with 1,000 requests/month:
- Distributed across 30 days = ~33 requests/day
- Avg ~1.5 concurrent requests
- Lambda handles effortlessly

At 100 users with 100,000 requests/month:
- Distributed across 30 days = ~3,300 requests/day
- Avg ~138 concurrent requests
- Lambda scales automatically, no config needed

At 1,000 users with 1M requests/month:
- Distributed across 30 days = ~33,000 requests/day
- Avg ~1,375 concurrent requests
- Lambda can handle up to 1,000 concurrent by default
- Action: Reserve 1,000 concurrency (+$0.015/month per unit = $15)
```

### Environment Variables

```python
# Lambda receives these from Secrets Manager (via CDK)
OPENAI_API_KEY      # From Secrets Manager
GEMINI_API_KEY      # From Secrets Manager
DYNAMODB_TABLE      # Or PostgreSQL connection string for Aurora
DATABASE_URL        # "postgresql://user:pass@host/scamguard"
```

---

## Deployment: Development vs Production

### Local Development (SAM CLI)

```bash
# Test Lambda locally before deployment
sam local start-api

# This runs API Gateway + Lambda on localhost:3000
# Same as dev-server.js but cleaner separation

curl -X POST http://localhost:3000/api/v1/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"action":"analyze"}'
```

### Production Deployment (CDK)

```bash
# Deploy to AWS
cdk deploy

# Output:
# ✅ API Endpoint: https://abc123.execute-api.us-east-1.amazonaws.com
# ✅ Lambda Function: arn:aws:lambda:us-east-1:123456:function:scamguard-handler
```

---

## Code Migration: Practical Example

### Example 1: Analyze Message Endpoint

**Current Express Version:**
```javascript
// dev-server.js
app.post('/api/v1/analyze', async (req, res) => {
  const { action, scenario, userResponse, imageBase64 } = req.body;
  
  try {
    // Call analysis logic
    const result = await analyzeMessage(scenario, userResponse, imageBase64);
    
    res.status(200).json({
      detection: { score: result.score },
      coaching: { feedback: result.feedback }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Lambda Version:**
```javascript
// lambda/handler.js
exports.analyzeMessage = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const { action, scenario, userResponse, imageBase64 } = body;
    
    // Same logic
    const result = await analyzeMessage(scenario, userResponse, imageBase64);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        detection: { score: result.score },
        coaching: { feedback: result.feedback }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

**Changes:**
- ✅ Core logic identical (can be imported from shared module)
- ✅ Error handling same pattern
- ✅ Request body parsed explicitly (not auto by Express)
- ✅ Response wrapped in statusCode/headers/body object

### Example 2: Get Profile Endpoint

**Current Express:**
```javascript
app.get('/api/v1/profile', async (req, res) => {
  const userId = req.user.id;  // From Cognito middleware
  const profile = await getProfile(userId);
  res.json(profile);
});
```

**Lambda:**
```javascript
exports.getProfile = async (event, context) => {
  const userId = event.requestContext.authorizer.claims.sub;  // From Cognito
  const profile = await getProfile(userId);
  
  return {
    statusCode: 200,
    body: JSON.stringify(profile)
  };
};
```

**Changes:**
- ✅ User ID extracted from `event.requestContext` instead of `req.user`
- ✅ Response wrapped in Lambda return format

---

## Integration with Existing Services

### DynamoDB Integration (No Changes)

```javascript
// Lambda can use existing DynamoDB code
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Same as Express version
const result = await dynamodb.query({
  TableName: 'ScamGuardData',
  KeyConditionExpression: 'user_id = :id',
  ExpressionAttributeValues: { ':id': userId }
}).promise();
```

### PostgreSQL Integration (If choosing Aurora)

```javascript
// Lambda with PostgreSQL
const { Client } = require('pg');

const client = new Client({
  host: process.env.DATABASE_URL.split('//')[1].split(':')[0],
  // Use connection pool for better performance
});

await client.connect();
const result = await client.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
await client.end();
```

**Better approach (use connection pooling):**
```javascript
// Use pg.Pool or RDS Proxy for connection reuse
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
```

### S3 Integration (No Changes)

```javascript
// Existing S3 code works in Lambda
const s3 = new AWS.S3();
const uploadResult = await s3.putObject({
  Bucket: 'scamguard-uploads',
  Key: `${userId}/image.jpg`,
  Body: imageBuffer
}).promise();
```

### SNS Integration (No Changes)

```javascript
// Existing SNS code works in Lambda
const sns = new AWS.SNS();
await sns.publish({
  TopicArn: 'arn:aws:sns:us-east-1:123456:scamguard-alerts',
  Message: `Alert for user ${userId}`
}).promise();
```

---

## Testing Lambda Locally

### Setup SAM CLI

```bash
# Install SAM
brew install aws-sam-cli

# In your project root
cd backend/lambda

# Create template.yaml for SAM
cat > template.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2010-05-13

Globals:
  Function:
    Timeout: 60
    MemorySize: 1536

Resources:
  ScamGuardFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: .
      Handler: handler.main
      Runtime: python3.12
      Environment:
        Variables:
          OPENAI_API_KEY: !Sub '{{resolve:secretsmanager:scamguard/openai-key}}'
          GEMINI_API_KEY: !Sub '{{resolve:secretsmanager:scamguard/gemini-key}}'
          DYNAMODB_TABLE: ScamGuardData

  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: dev
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: arn:aws:cognito-idp:us-east-1:123456:userpool/us-east-1_xyz
EOF

# Start local API
sam local start-api

# Test endpoint
curl -X POST http://localhost:3000/api/v1/analyze \
  -H "Authorization: Bearer $COGNITO_TOKEN" \
  -d '{"action":"analyze"}'
```

### Local Testing Without Cognito Token (Dev Only)

```bash
# Skip auth for dev testing
sam local start-api --debug

# Add temporary bypass in handler
if os.environ.get('SAM_LOCAL'):
    # Local testing - skip auth
    user_id = 'test-user-123'
else:
    # Production - require auth
    user_id = event['requestContext']['authorizer']['claims']['sub']
```

---

## Migration Timeline & Effort

### Phase 1: Preparation (1-2 days)
- Audit all Express routes
- Document each endpoint's behavior
- Plan Lambda structure

### Phase 2: Lambda Development (3-5 days)
- Convert routes to Lambda handlers
- Test each endpoint locally
- Set up route dispatcher (simple if/elif for path matching)

### Phase 3: API Gateway Setup (1-2 days)
- Create HTTP v2 API in CDK
- Configure routes and Cognito auth
- Test API Gateway integration

### Phase 4: Deployment (1 day)
- Deploy to AWS
- Update frontend API URLs
- Smoke testing against deployed API

### Phase 5: Cleanup (1 day)
- Remove Express.js dependencies
- Optimize Lambda code
- Document new architecture

**Total Effort:** 7-11 days (~1-2 weeks)
**Cost Impact:** -$10-15/month immediately

---

## FAQ: Lambda vs Express.js

**Q: Will Lambda be slower than Express.js?**
A: No. Lambda cold starts (100-500ms) only happen once per day. After that, warm instances are <50ms. Express.js on t3.micro often slower due to shared resources.

**Q: What if we need background jobs?**
A: Lambda can still do this via:
- EventBridge (cron schedules) → Lambda
- SQS → Lambda (async queue processing)
- Step Functions (orchestration)

**Q: Can we rollback if Lambda doesn't work?**
A: Yes. Keep dev-server.js as fallback. Update frontend to API Gateway URL. If issues, point frontend back to Express.js (1 minute change).

**Q: Will monitoring/logging work the same?**
A: Better. CloudWatch Logs capture all Lambda output automatically. X-Ray integration built-in. No need for separate logging infrastructure.

---

## Revised Architecture: Serverless Complete

After migrations:

```
CURRENT (Mixed Serverless/Traditional):
┌─────────────────────────────────────┐
│ Frontend (S3 + CloudFront)          │ ✅ Serverless
├─────────────────────────────────────┤
│ API (Express.js on EC2/Docker)      │ ❌ NOT Serverless
├─────────────────────────────────────┤
│ Database (DynamoDB or Aurora)       │ ✅ Serverless
├─────────────────────────────────────┤
│ Notifications (SNS + SES)           │ ✅ Serverless
└─────────────────────────────────────┘

AFTER MIGRATION (100% Serverless):
┌─────────────────────────────────────┐
│ Frontend (S3 + CloudFront)          │ ✅ Serverless
├─────────────────────────────────────┤
│ API (Lambda + API Gateway v2)       │ ✅ Serverless
├─────────────────────────────────────┤
│ Database (Aurora Serverless v2)     │ ✅ Serverless
├─────────────────────────────────────┤
│ Notifications (SNS + SES)           │ ✅ Serverless
├─────────────────────────────────────┤
│ Async Jobs (EventBridge → Lambda)   │ ✅ Serverless
└─────────────────────────────────────┘

Cost Comparison (100 users):
- Current:  $46 (Aurora) + $10 (EC2) + $6 (SNS/SES) = $62/month
- After:    $61 (Aurora) + $0 (Lambda) + $0 (SNS/SES) = $61/month
- Result:   Same cost, better performance, zero infrastructure management
```

---

## Recommendation: Start Lambda Migration Now

**Timeline:** Complete before Phase 6

**Justification:**
1. Free tier covers all MVP growth (10-500 users)
2. Infrastructure cost drops to zero
3. Scales automatically (no management needed)
4. Better monitoring than Express.js
5. Industry standard for modern APIs
6. Easy rollback if needed

**Next Steps:**
1. Set up SAM CLI for local testing
2. Convert first 2-3 routes as proof of concept
3. Deploy to staging API Gateway
4. Test with frontend
5. Full migration in 2 weeks

---

**Architecture Decision:** 100% Serverless Stack  
**Cost Impact:** -$10-15/month  
**Timeline:** 1-2 weeks  
**Risk:** Very low (can rollback to Express.js)
