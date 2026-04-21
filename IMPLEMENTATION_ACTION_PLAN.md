# Serverless Architecture Implementation Action Plan
**Date:** April 16, 2026  
**Decision:** Aurora Serverless v2 + Lambda (100% serverless)  
**Timeline:** 4 weeks to production  
**Owner:** Backend Engineering Team  

---

## Phase 1: Preparation (Week 1)

### Day 1-2: Team Alignment
- [ ] Review all 4 architecture decision documents with team
- [ ] Approve budget: +$45/month for Aurora (Q1-Q3)
- [ ] Assign roles:
  - Lead: Database migration (Aurora setup, PostgreSQL schema)
  - Engineer 1: Lambda conversion (Express routes → Lambda)
  - Engineer 2: Testing + API Gateway configuration
  - QA: End-to-end testing, rollback drills

### Day 3: Development Environment Setup
```bash
# Engineer 1: Set up Aurora locally
cd /Users/echetoui/scamguard-mvp
git checkout -b feature/serverless-architecture

# Create new CDK stack for Aurora
cat > backend/cdk/aurora_stack.py << 'ENDSTACK'
from aws_cdk import (
    aws_rds as rds,
    aws_ec2 as ec2,
)

class AuroraStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        vpc = ec2.Vpc.from_lookup(self, "VPC", ...)
        
        # Aurora Serverless v2
        cluster = rds.DatabaseCluster(
            self, "ScamGuardDB",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_4
            ),
            cluster_identifier="scamguard-dev",
            writer=rds.ClusterInstance.serverless_v2("writer"),
            readers=[
                rds.ClusterInstance.serverless_v2("reader", scale_with_writer=True)
            ],
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2,
            vpc=vpc,
        )
ENDSTACK

# Deploy to dev environment (not production yet)
cdk deploy --profile dev-account
```

### Day 4: Lambda Setup
```bash
# Engineer 2: Create Lambda SAM template
cd backend/lambda
sam init --runtime python3.12 --name scamguard-handler

# Update template.yaml with API Gateway + Cognito
```

### Day 5: Migration Planning
```bash
# Lead: Document current DynamoDB schema
aws dynamodb describe-table --table-name ScamGuardData

# Create PostgreSQL schema mapping
cat > backend/db/schema_migration_plan.md << 'ENDSCHEMA'
## DynamoDB → PostgreSQL Schema Mapping

### Current DynamoDB Structure
- Table: ScamGuardData
- PK: userId
- SK: timestamp

### New PostgreSQL Tables
- users (user_id, email, created_at)
- sessions (session_id, user_id, scenario_id, detection_score)
- profiles (user_id, experience_level, xp)
- threat_reports (report_id, user_id, threat_type, region)
ENDSCHEMA
```

---

## Phase 2: Database Migration (Week 2)

### Day 6-7: PostgreSQL Schema Creation
```bash
# Lead: Create PostgreSQL schema
psql -h <aurora-endpoint> -U admin -d scamguard << 'ENDSQL'

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    cognito_sub VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Profiles table  
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(user_id),
    experience_level INT DEFAULT 0,
    xp_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    scenario_id VARCHAR,
    user_response TEXT,
    detection_score FLOAT,
    xp_earned INT,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_date (user_id, created_at)
);

-- Threat reports (for Phase 6)
CREATE TABLE threat_reports (
    report_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    threat_type VARCHAR,
    region VARCHAR,
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_threat_date (threat_type, created_at)
);

-- Notification preferences
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(user_id),
    sms_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    preferences JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);

ENDSQL
```

### Day 8-9: ETL Migration Script
```bash
# Lead: Create Python script to migrate DynamoDB → PostgreSQL
cat > backend/scripts/migrate_dynamodb_to_aurora.py << 'ENDPYTHON'
import boto3
import psycopg2
import json
from datetime import datetime

# Read from DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ScamGuardData')

# Write to PostgreSQL
conn = psycopg2.connect(
    host=os.environ['AURORA_ENDPOINT'],
    database='scamguard',
    user='admin',
    password=os.environ['AURORA_PASSWORD']
)

cursor = conn.cursor()

# Scan DynamoDB
response = table.scan()
for item in response['Items']:
    # Transform item to PostgreSQL format
    # DynamoDB: { userId: "123", timestamp: "...", scenario: "..." }
    # PostgreSQL: INSERT INTO sessions (user_id, scenario_id, ...)
    
    cursor.execute(
        "INSERT INTO sessions (session_id, user_id, scenario_id, detection_score, created_at) "
        "VALUES (%s, %s, %s, %s, %s)",
        (item['sessionId'], item['userId'], item['scenario'], item['score'], item['timestamp'])
    )

conn.commit()
cursor.close()
conn.close()
print(f"Migrated {response['Count']} items")
ENDPYTHON

# Run migration (test on dev first)
python backend/scripts/migrate_dynamodb_to_aurora.py
```

### Day 10: Verify Data Integrity
```bash
# Lead: Compare record counts
aws dynamodb scan --table-name ScamGuardData --select COUNT_ITEMS
# Result: X items

psql -h aurora-endpoint -U admin -d scamguard -c "SELECT COUNT(*) FROM sessions;"
# Result: Should match X items
```

---

## Phase 3: Lambda Migration (Week 3)

### Day 11-12: Convert Express Routes
```bash
# Engineer 1: Audit current Express.js routes
grep -n "app\.\(post\|get\|put\|delete\)" backend/dev-server.js | head -20

# Create list of endpoints:
# POST /api/v1/analyze
# POST /api/v1/scenarios  
# GET /api/v1/profile
# GET /api/v1/notifications/preferences
# PUT /api/v1/notifications/preferences
# etc.
```

### Day 13-15: Lambda Handler Implementation
```bash
# Engineer 1: Create Lambda handler
cat > backend/lambda/handler.py << 'ENDHANDLER'
import json
import os
import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.data_classes.api_gateway_event import APIGatewayEventAuthorizer

logger = Logger()
tracer = Tracer()

# Import existing analysis logic (reuse, don't rewrite)
from backend.agents.analysis_agent import AnalysisAgent
from backend.services.scenario_service import ScenarioService

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event, context):
    """
    Route incoming requests to appropriate handlers
    event: API Gateway event
    context: Lambda context
    """
    
    # Extract path and method
    path = event.get('rawPath', '')
    method = event.get('requestContext', {}).get('http', {}).get('method', '')
    
    # Extract authenticated user
    authorizer = event.get('requestContext', {}).get('authorizer', {})
    user_id = authorizer.get('claims', {}).get('sub')
    
    if not user_id:
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
    except:
        body = {}
    
    # Route requests
    if path == '/api/v1/analyze' and method == 'POST':
        return handle_analyze(user_id, body)
    elif path == '/api/v1/scenarios' and method == 'POST':
        return handle_generate_scenario(user_id, body)
    elif path == '/api/v1/profile' and method == 'GET':
        return handle_get_profile(user_id)
    else:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Not Found'})
        }

def handle_analyze(user_id, body):
    try:
        agent = AnalysisAgent()
        result = agent.analyze(
            user_id=user_id,
            scenario=body.get('scenario'),
            user_response=body.get('userResponse'),
            image_base64=body.get('imageBase64')
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(result)
        }
    except Exception as e:
        logger.exception(f"Analysis failed for user {user_id}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def handle_generate_scenario(user_id, body):
    try:
        service = ScenarioService()
        result = service.generate(user_id=user_id)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(result)
        }
    except Exception as e:
        logger.exception(f"Scenario generation failed for user {user_id}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def handle_get_profile(user_id):
    try:
        # Query PostgreSQL (new)
        import psycopg2
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT user_id, xp_earned, experience_level FROM user_profiles WHERE user_id = %s",
            (user_id,)
        )
        profile = cursor.fetchone()
        
        if profile:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'user_id': profile[0],
                    'xp_earned': profile[1],
                    'experience_level': profile[2]
                })
            }
        else:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Profile not found'})
            }
    except Exception as e:
        logger.exception(f"Profile lookup failed for user {user_id}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
ENDHANDLER

# Update requirements.txt for Lambda
cat >> backend/lambda/requirements.txt << 'ENDREQS'
psycopg2-binary
aws-lambda-powertools
ENDREQS
```

### Day 16-17: Local Testing with SAM
```bash
# Engineer 2: Test Lambda locally
cd backend/lambda
sam local start-api

# In another terminal, test endpoints
curl -X POST http://localhost:3000/api/v1/analyze \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"action": "analyze"}'

# Check logs
sam local logs
```

---

## Phase 4: API Gateway Setup (Week 3-4)

### Day 18-19: HTTP v2 API Configuration
```bash
# Engineer 2: Create HTTP v2 API in CDK
cat > backend/cdk/api_gateway_stack.py << 'ENDAPI'
from aws_cdk import (
    aws_apigatewayv2 as apigatewayv2,
    aws_apigatewayv2_integrations as integrations,
    aws_lambda as lambda_,
)

class APIGatewayStack(Stack):
    def __init__(self, scope, id, lambda_function, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # Create HTTP v2 API
        api = apigatewayv2.HttpApi(
            self, "ScamGuardAPI",
            cors_preflight=apigatewayv2.CorsPreflightOptions(
                allow_methods=[
                    apigatewayv2.HttpMethod.GET,
                    apigatewayv2.HttpMethod.POST,
                    apigatewayv2.HttpMethod.PUT,
                    apigatewayv2.HttpMethod.DELETE,
                ],
                allow_origins=["*"],
                allow_headers=["*"]
            )
        )
        
        # Add routes
        api.add_routes(
            path="/api/v1/{proxy+}",
            methods=[apigatewayv2.HttpMethod.ANY],
            integration=integrations.HttpLambdaIntegration(
                "LambdaIntegration",
                lambda_function
            )
        )
ENDAPI

# Deploy
cdk deploy --profile dev-account
```

### Day 20: Test Against Deployed API
```bash
# Engineer 2: Get API endpoint from CDK outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name ScamGuardAPIStack \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text)

# Test endpoint
curl -X POST $API_ENDPOINT/api/v1/analyze \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"action": "analyze"}'

# Check CloudWatch logs
aws logs tail /aws/lambda/scamguard-handler --follow
```

---

## Phase 5: Deployment (Week 4)

### Day 21: Frontend URL Update
```bash
# Engineer: Update frontend API endpoint
cat > frontend/.env.production << 'ENDENV'
REACT_APP_LAMBDA_URL=$API_ENDPOINT/api/v1
ENDENV

# Rebuild frontend
cd frontend
npm run build

# Deploy to S3
aws s3 sync build/ s3://scamguard-frontend/
aws cloudfront create-invalidation --distribution-id E1C54UEBEPD83U --paths "/*"
```

### Day 22-23: Smoke Testing
```bash
# QA: Test all critical flows
- [ ] User signup/login (Cognito)
- [ ] Scenario generation
- [ ] Message analysis
- [ ] Profile viewing
- [ ] Notification preferences
- [ ] End-to-end: Upload image → Analyze → Get results

# Monitor
- CloudWatch Logs (Lambda errors?)
- CloudWatch Metrics (Lambda duration, errors)
- X-Ray Traces (request flow)
```

### Day 24: Cutover
```bash
# Engineer: Final switch
# Option 1: Blue-green (if API Gateway already points to Lambda)
#   → Already done in API Gateway setup

# Option 2: If still using Express.js:
#   → Update APIGW integration from Express.js to Lambda
#   → Monitor for 24 hours
#   → Keep Express.js running as fallback

# Rollback plan: If critical issue
#   → Point API Gateway back to dev-server.js Express.js
#   → Time: <5 minutes
```

---

## Phase 6: Cleanup (Week 4)

### Day 25: Decommission Old Infrastructure
```bash
# Engineer: Once stable (48+ hours of prod traffic)
# 1. Verify no Express.js traffic still active
# 2. Delete dev-server.js (or keep for local testing)
# 3. Note: Keep DynamoDB temporarily (7-day retention as backup)
# 4. After 7 days, can decommission DynamoDB

# Optional: Keep dev-server.js for local development
#   → npm start still works locally
#   → Frontend dev points to localhost:3000
#   → Backend dev can still use Express.js patterns
```

### Day 26-28: Documentation + Knowledge Transfer
```bash
# Engineer: Document new architecture
- [ ] Update architecture diagrams (replace Express.js → Lambda)
- [ ] Document API Gateway endpoints
- [ ] Document Lambda function structure
- [ ] Record runbook: "If Lambda errors, what to check?"
- [ ] Record rollback procedure
```

---

## Success Criteria

### Each Phase Must Pass:

**Phase 1: Preparation**
- [ ] Team aligned on decision
- [ ] Budget approved
- [ ] Dev environment ready
- [ ] Migration plan documented

**Phase 2: Database**
- [ ] Aurora cluster created
- [ ] PostgreSQL schema matches DynamoDB structure
- [ ] ETL script migrates all records
- [ ] Data integrity verified (count matches)

**Phase 3: Lambda**
- [ ] All Express.js routes converted to Lambda
- [ ] SAM local testing passes
- [ ] No changes to business logic (same code reused)

**Phase 4: API Gateway**
- [ ] HTTP v2 API created
- [ ] Routes configured
- [ ] Cognito authorization working
- [ ] API endpoint deployed

**Phase 5: Deployment**
- [ ] Frontend updated with new API endpoint
- [ ] Smoke tests pass (all critical flows work)
- [ ] CloudWatch shows healthy metrics
- [ ] No errors in logs

**Phase 6: Cleanup**
- [ ] Old infrastructure decommissioned
- [ ] Documentation updated
- [ ] Team trained on new architecture

---

## Risk Mitigation

### Risk 1: Data Loss During Migration
**Mitigation:**
- [ ] Backup DynamoDB before starting (AWS native backup)
- [ ] Keep DynamoDB for 7 days after migration
- [ ] Verify data integrity at each step
- [ ] Have rollback procedure ready

### Risk 2: Lambda Cold Start Issues
**Mitigation:**
- [ ] Use 1536 MB memory (reduces cold start to 100-300ms)
- [ ] Keep warm instances (Lambda Concurrency)
- [ ] Accept first request might be slow (acceptable for MVP)

### Risk 3: Cognito Auth Broken
**Mitigation:**
- [ ] Test Cognito + Lambda integration day 1
- [ ] Keep dev-server.js as fallback
- [ ] Have Cognito team on standby

### Risk 4: PostgreSQL Connection Issues
**Mitigation:**
- [ ] Use AWS RDS Proxy for connection pooling
- [ ] Implement retry logic in Lambda
- [ ] Monitor connection pool metrics
- [ ] Have fallback to DynamoDB read replica

---

## Budget

```
Service              Current    Post-Migration    Change
─────────────────────────────────────────────────────────
S3 + CloudFront      $1.38      $1.38             $0
Lambda               Included   $0-2              $0
API Gateway          $0         $0-1              $0
Aurora Serverless    $0         $46-50            +$46
SNS/SES              $0.50      $0.50             $0
─────────────────────────────────────────────────────────
TOTAL                $1.88      $48-53            +$45-50

Cost approved as part of "Serverless Migration Initiative"
Duration: Q1-Q3 (3 months) while scaling to 500+ users
Break-even: Month 18 (when DynamoDB would cost more)
```

---

## Sign-Off

- [ ] Engineering Lead approves timeline
- [ ] Finance approves budget (+$45/month)
- [ ] Product confirms Phase 6 enablement critical
- [ ] QA confirms test plan

**Approved by:** ________________  
**Date:** ________________  
**Timeline:** Weeks of April 21 - May 12, 2026

---

**Next Step:** Start Phase 1 (Preparation) on Monday, April 21, 2026

