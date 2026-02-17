# AWS Deployment Guide - ScamGuard MVP

## Overview

This guide covers deploying ScamGuard to AWS Lambda using AWS Serverless Application Model (SAM) and CloudFormation.

**Architecture:**
- **Compute**: AWS Lambda (Python 3.12, 1536 MB)
- **Auth**: Amazon Cognito User Pool
- **Database**: DynamoDB (25 RCU/WCU provisioned)
- **Audit**: DynamoDB Audit Table (90-day TTL)
- **API**: API Gateway + Lambda
- **Monitoring**: CloudWatch + X-Ray
- **Secrets**: AWS Secrets Manager

## Prerequisites

### Required Tools

```bash
# AWS CLI v2+
aws --version

# AWS SAM CLI
sam --version

# Docker (for building Lambda layers)
docker --version

# Python 3.12+
python3 --version

# Git
git --version
```

### AWS Account Setup

1. **Create AWS Account** (if needed)
2. **Configure AWS Credentials**:
   ```bash
   aws configure
   # Enter: Access Key ID, Secret Access Key, Default region (us-east-1), Default format (json)
   ```

3. **Verify Access**:
   ```bash
   aws sts get-caller-identity
   # Should return AccountId, Arn, UserId
   ```

4. **Create S3 Bucket for Artifacts** (required by SAM):
   ```bash
   aws s3 mb s3://scamguard-deployment-artifacts-$(aws sts get-caller-identity --query Account --output text) --region us-east-1
   ```

## Deployment Steps

### 1. Prepare Dependencies Layer

```bash
cd backend

# Create layer directory structure
mkdir -p layers/python_dependencies/python/lib/python3.12/site-packages

# Install dependencies into layer
pip install -r requirements.txt -t layers/python_dependencies/python/lib/python3.12/site-packages/

# Verify installation
ls layers/python_dependencies/python/lib/python3.12/site-packages/ | head -10
# Should show: boto3, botocore, google, openai, aws_xray_sdk, etc.
```

### 2. Build Application

```bash
sam build --use-container

# Output: .aws-sam/build/
#   - ScamGuardFunction/
#   - AuthHandler/
#   - PythonDependenciesLayer/
```

### 3. Deploy to AWS

#### First Deployment (with prompts):
```bash
sam deploy --guided

# Prompts:
# Stack Name [sam-app]: scamguard-mvp
# Region [us-east-1]: us-east-1
# Parameter Environment [dev]: dev
# Parameter ReservedConcurrentExecutions [10]: 10
# Parameter OpenAIApiKeySecret [scamguard/openai-key]: scamguard/openai-key
# Parameter GeminiApiKeySecret [scamguard/gemini-key]: scamguard/gemini-key
# Confirm changes before deploy [y/N]: y
# Allow SAM CLI IAM role creation [Y/n]: Y
# Save parameters to samconfig.toml [Y/n]: Y
```

#### Subsequent Deployments:
```bash
sam deploy
# Uses saved parameters from samconfig.toml
```

### 4. Store API Keys in Secrets Manager

```bash
# Store OpenAI API Key
aws secretsmanager create-secret \
  --name scamguard/openai-key \
  --secret-string '{"api_key":"sk-..."}' \
  --region us-east-1

# Store Gemini API Key
aws secretsmanager create-secret \
  --name scamguard/gemini-key \
  --secret-string '{"api_key":"AIza..."}' \
  --region us-east-1

# Verify
aws secretsmanager get-secret-value --secret-id scamguard/openai-key --region us-east-1
```

### 5. Get Deployment Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --query 'Stacks[0].Outputs' \
  --output table

# Example Output:
# ╒════════════════════════════╤════════════════════════════════════╕
# │ OutputKey                  │ OutputValue                        │
# ╞════════════════════════════╪════════════════════════════════════╡
# │ ApiEndpoint                │ https://abc123.execute-api.us-e... │
# │ UserPoolId                 │ us-east-1_aBc123XyZ                │
# │ UserPoolClientId           │ 5abc123def456ghi789jkl             │
# │ DataTableName              │ ScamGuardData-dev                  │
# │ AuditTableName             │ ScamGuardAudit-dev                 │
# │ ScamGuardFunctionArn       │ arn:aws:lambda:us-east-1:...       │
# └────────────────────────────┴────────────────────────────────────┘
```

## Testing Deployment

### 1. Test API Endpoints

```bash
# Set variables
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

# Test health (if implemented)
curl -X GET "${API_ENDPOINT}api/v1/health"

# Expected: 200 OK
```

### 2. Test Authentication Flow

```bash
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

# Create test user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username test.elderly@example.com \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS \
  --region us-east-1

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username test.elderly@example.com \
  --password Password123!@# \
  --permanent \
  --region us-east-1

# Verify email
aws cognito-idp admin-update-user-attributes \
  --user-pool-id $USER_POOL_ID \
  --username test.elderly@example.com \
  --user-attributes Name=email_verified,Value=true \
  --region us-east-1
```

### 3. Test Lambda Function

```bash
# Invoke scenario generation
aws lambda invoke \
  --function-name scamguard-handler-dev \
  --payload '{"rawPath":"/api/v1/scenarios","requestContext":{"http":{"method":"POST"},"authorizer":{"claims":{"sub":"test-user-123"}}}}' \
  --region us-east-1 \
  response.json

cat response.json | python3 -m json.tool
```

### 4. Monitor Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/scamguard-handler-dev --follow

# View API Gateway logs
aws logs tail API-Gateway-Execution-Logs --follow

# View X-Ray service map
# Access AWS Console: https://console.aws.amazon.com/xray/
```

## Environment Management

### Dev Deployment

```bash
sam deploy --parameter-overrides Environment=dev
```

### Staging Deployment

```bash
sam deploy --parameter-overrides Environment=staging
```

### Production Deployment

```bash
sam deploy --parameter-overrides \
  Environment=prod \
  ReservedConcurrentExecutions=50 \
  --no-fail-on-empty-changeset
```

## Monitoring & Alerts

### CloudWatch Dashboard

```bash
aws cloudwatch put-dashboard \
  --dashboard-name ScamGuard-Dashboard \
  --dashboard-body file://monitoring/dashboard.json
```

### X-Ray Service Map

View distributed tracing:
```
AWS Console > X-Ray > Service Map
```

Compliance events are annotated:
- `analysis_compliant: true/false`
- `compliance_failed_*: true`
- `operation_blocked: true`

### CloudWatch Alarms

Automatically created:
- **Compliance Violations**: > 5 blocked operations in 5 min
- **Lambda Errors**: > 5 errors in 10 min
- **DynamoDB Throttling**: > 20 write capacity in 5 min

Configure SNS notifications:
```bash
aws sns create-topic --name scamguard-alerts

aws cloudwatch put-metric-alarm \
  --alarm-name scamguard-compliance-violations-dev \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:scamguard-alerts
```

## Cost Estimation

### Monthly Costs (Dev Environment)

| Service | Usage | Cost |
|---------|-------|------|
| Lambda | 1M requests × 60s × 1536MB | ~$45 |
| DynamoDB | 25 RCU/WCU | ~$25 |
| API Gateway | 1M requests | ~$3.50 |
| CloudWatch Logs | 100 GB/month | ~$50 |
| Secrets Manager | 1 secret | ~$0.40 |
| **Total** | | **~$124/month** |

### Cost Optimization

1. **Use On-Demand Pricing** (if traffic < 10K req/day):
   ```bash
   # Change DynamoDB BillingMode to PAY_PER_REQUEST in template.yaml
   ```

2. **Reserved Concurrency** (production only):
   - Dev: 10
   - Prod: 50-100

3. **Log Retention**:
   ```bash
   aws logs put-retention-policy \
     --log-group-name /aws/lambda/scamguard-handler-dev \
     --retention-in-days 14
   ```

## Troubleshooting

### Issue: "No such file or directory: requirements.txt"

```bash
cd backend
pip install -r requirements.txt
sam build --use-container
```

### Issue: Lambda Timeout (60s limit)

Vision analysis can take 45-55s. If timing out:
1. Increase timeout in template.yaml: `Timeout: 90`
2. Optimize image preprocessing
3. Use async processing (Phase 5)

### Issue: DynamoDB Throttling

Increase provisioned capacity:
```bash
aws dynamodb update-table \
  --table-name ScamGuardData-dev \
  --provisioned-throughput ReadCapacityUnits=50,WriteCapacityUnits=50
```

### Issue: API Gateway Authorization Failed

Verify Cognito setup:
```bash
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_aBc123XyZ \
  --query 'UserPool.Status'
```

### Issue: Secrets Manager Access Denied

Verify Lambda IAM role has access:
```bash
aws iam get-role-policy \
  --role-name scamguard-handler-dev-role \
  --policy-name secretsmanager-policy
```

## Cleanup

### Remove Deployment

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name scamguard-mvp

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name scamguard-mvp

# Delete S3 artifacts
aws s3 rm s3://scamguard-artifacts-ACCOUNT_ID-dev --recursive

# Delete Secrets Manager secrets
aws secretsmanager delete-secret --secret-id scamguard/openai-key --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id scamguard/gemini-key --force-delete-without-recovery
```

## Production Deployment Checklist

- [ ] API Gateway has custom domain (optional)
- [ ] WAF rules configured (optional)
- [ ] CloudWatch alarms configured with SNS
- [ ] Backup enabled for DynamoDB
- [ ] X-Ray sampling configured (Phase 5)
- [ ] Load testing completed (backend/tests/load_test.py)
- [ ] Security scanning passed (.github/workflows/security.yml)
- [ ] GDPR deletion endpoint implemented (Phase 5)
- [ ] GDPR export endpoint implemented (Phase 5)
- [ ] Compliance dashboard UI deployed (Phase 5)

## Advanced Configuration

### Custom Domain

```bash
aws apigateway create-domain-name \
  --domain-name api.scamguard.example.com \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/ID

aws apigateway create-base-path-mapping \
  --domain-name api.scamguard.example.com \
  --rest-api-id abc123 \
  --stage prod
```

### VPC Integration (Optional)

```yaml
# In template.yaml, add to ScamGuardFunction:
VpcConfig:
  SecurityGroupIds:
    - sg-xxxxxxxxx
  SubnetIds:
    - subnet-xxxxxxxxx
    - subnet-yyyyyyyyy
```

### Async Processing with SQS (Phase 5)

```yaml
ScenarioQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: scamguard-scenarios
    VisibilityTimeout: 300

ScenarioWorker:
  Type: AWS::Serverless::Function
  Properties:
    Handler: workers/scenario_worker.handler
    Events:
      SQSEvent:
        Type: SQS
        Properties:
          Queue: !GetAtt ScenarioQueue.Arn
          BatchSize: 10
```

## Support & Documentation

- AWS Lambda Best Practices: https://docs.aws.amazon.com/lambda/
- SAM Documentation: https://docs.aws.amazon.com/serverless-application-model/
- Cognito Developer Guide: https://docs.aws.amazon.com/cognito/
- DynamoDB Documentation: https://docs.aws.amazon.com/dynamodb/
- X-Ray Documentation: https://docs.aws.amazon.com/xray/

## Next Steps

1. **Deploy to dev environment** using guided SAM deploy
2. **Test all endpoints** with curl or Postman
3. **Monitor logs** in CloudWatch
4. **Load test** with backend/tests/load_test.py
5. **Deploy to staging** for integration testing
6. **Deploy to production** after security review

Estimated deployment time: **15-20 minutes**
