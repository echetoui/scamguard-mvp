# Phase 2 Sprint 5 - Deployment Guide

**Status:** Ready for Production
**Date:** March 14, 2026
**Environment:** AWS (us-east-1)

---

## 📋 Pre-Deployment Checklist

- [ ] AWS credentials configured (`aws configure`)
- [ ] AWS CDK installed (`npm install -g aws-cdk`)
- [ ] Node.js 16+ installed
- [ ] Python 3.12 installed
- [ ] Git changes committed
- [ ] Tests passing (2,290/2,373)
- [ ] Environment variables configured

---

## 🚀 Deployment Steps

### Step 1: Deploy DynamoDB Infrastructure

```bash
# Navigate to CDK directory
cd backend/cdk

# Install dependencies
npm install

# Synthesize CloudFormation template
cdk synth

# Deploy the Threats stack
cdk deploy ThreatsStack --require-approval never

# Verify deployment
aws dynamodb list-tables --region us-east-1
```

**Expected Output:**
```
Threats table created
UserThreats table created
ThreatScenarios table created
CloudFormation stack deployed successfully
```

---

### Step 2: Prepare Lambda Package

```bash
# Navigate to Lambda directory
cd backend/lambda_

# Create deployment package
mkdir -p lambda_package
cp *.py lambda_package/
cp -r requirements.txt lambda_package/

# Install dependencies
cd lambda_package
pip install -r requirements.txt -t .

# Create zip file
zip -r ../threats-lambda.zip .

# Clean up
cd ..
rm -rf lambda_package
```

**Expected Output:**
```
threats-lambda.zip created (~50-60 MB)
```

---

### Step 3: Upload Lambda Functions

#### Option A: Using AWS CLI

```bash
# Create Lambda function - threats_handler
aws lambda create-function \
  --function-name scamguard-threats-api \
  --runtime python3.12 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-role \
  --handler index.handler \
  --zip-file fileb://threats-lambda.zip \
  --environment Variables='{
    THREATS_TABLE=threats,
    USER_THREATS_TABLE=user_threats,
    ALLOWED_ORIGIN=https://yourdomain.com
  }' \
  --timeout 60 \
  --memory-size 512 \
  --region us-east-1

# Create Lambda function - threat_sources (scheduled)
aws lambda create-function \
  --function-name scamguard-threat-sources \
  --runtime python3.12 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-role \
  --handler threat_sources.lambda_handler \
  --zip-file fileb://threats-lambda.zip \
  --environment Variables='{
    THREATS_TABLE=threats,
    SQ_API_URL=https://api.sq.qc.ca/threats,
    SQ_API_KEY=YOUR_API_KEY,
    CAFC_CSV_URL=https://www.antifraudcentre.ca/threats.csv,
    CAFC_BUCKET=scamguard-cafc-data
  }' \
  --timeout 300 \
  --memory-size 1024 \
  --region us-east-1
```

#### Option B: Using AWS Console

1. Go to Lambda → Create Function
2. Upload `threats-lambda.zip`
3. Set handler: `index.handler` (threats API)
4. Configure environment variables
5. Set timeout and memory
6. Click Deploy

---

### Step 4: Configure CloudWatch Scheduled Events

#### SQ API Polling (Every 4 hours)

```bash
# Create EventBridge rule
aws events put-rule \
  --name scamguard-sq-polling \
  --schedule-expression 'rate(4 hours)' \
  --state ENABLED

# Add Lambda as target
aws events put-targets \
  --rule scamguard-sq-polling \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:scamguard-threat-sources","Input"='{"source":"sq"}'

# Grant Lambda permission
aws lambda add-permission \
  --function-name scamguard-threat-sources \
  --statement-id AllowEventBridgeInvoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:YOUR_ACCOUNT_ID:rule/scamguard-sq-polling
```

#### CAFC CSV Import (Daily at 2 AM)

```bash
# Create EventBridge rule
aws events put-rule \
  --name scamguard-cafc-import \
  --schedule-expression 'cron(0 2 * * ? *)' \
  --state ENABLED

# Add Lambda as target
aws events put-targets \
  --rule scamguard-cafc-import \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:scamguard-threat-sources","Input"='{"source":"cafc"}'

# Grant Lambda permission
aws lambda add-permission \
  --function-name scamguard-threat-sources \
  --statement-id AllowEventBridgeInvokeCAFC \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:YOUR_ACCOUNT_ID:rule/scamguard-cafc-import
```

---

### Step 5: Configure API Gateway

```bash
# Create HTTP API
aws apigatewayv2 create-api \
  --name scamguard-threats-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:scamguard-threats-api

# Create integration
aws apigatewayv2 create-integration \
  --api-id YOUR_API_ID \
  --integration-type AWS_PROXY \
  --integration-method POST \
  --payload-format-version 2.0 \
  --target-arn arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:scamguard-threats-api

# Create route
aws apigatewayv2 create-route \
  --api-id YOUR_API_ID \
  --route-key 'ANY /api/threats/{proxy+}' \
  --target integrations/YOUR_INTEGRATION_ID

# Deploy stage
aws apigatewayv2 create-stage \
  --api-id YOUR_API_ID \
  --stage-name dev \
  --auto-deploy
```

---

### Step 6: Deploy Frontend

```bash
# Build frontend
cd frontend
npm run build

# Deploy to CloudFront/S3
aws s3 sync build/ s3://scamguard-frontend-bucket/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

### Step 7: Verify Deployment

```bash
# Test API endpoints
curl https://your-api-gateway-url/dev/api/threats

# Check Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `threats`)]'

# Verify DynamoDB tables
aws dynamodb describe-table --table-name threats

# Check CloudWatch logs
aws logs tail /aws/lambda/scamguard-threats-api --follow
```

---

## 🔧 Environment Variables

### Lambda: threats_handler

```
THREATS_TABLE=threats
USER_THREATS_TABLE=user_threats
ALLOWED_ORIGIN=https://yourdomain.com
```

### Lambda: threat_sources

```
THREATS_TABLE=threats
SQ_API_URL=https://api.sq.qc.ca/threats
SQ_API_KEY=YOUR_SQ_API_KEY
CAFC_CSV_URL=https://www.antifraudcentre-centreantifraude.ca/threats.csv
CAFC_BUCKET=scamguard-cafc-data
```

---

## 🔐 IAM Permissions

### Lambda Execution Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/threats",
        "arn:aws:dynamodb:us-east-1:*:table/user_threats",
        "arn:aws:dynamodb:us-east-1:*:table/threat_scenarios"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::scamguard-cafc-data/*"
    }
  ]
}
```

---

## 📊 Post-Deployment Validation

### 1. Test API Endpoints

```bash
# List threats
curl -X GET \
  https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/api/threats \
  -H "Content-Type: application/json"

# Get specific threat
curl -X GET \
  https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/api/threats/SQ-2026-001

# Match user to threats
curl -X POST \
  https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/api/threats/match \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test@example.com",
    "institutions": ["Desjardins"],
    "regions": ["Montreal"]
  }'

# Get weekly digest
curl -X GET \
  https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/api/threats/feed
```

### 2. Check CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/scamguard-threats-api --follow

# View threat sources logs
aws logs tail /aws/lambda/scamguard-threat-sources --follow
```

### 3. Verify DynamoDB Operations

```bash
# Get item count
aws dynamodb scan --table-name threats --select COUNT_ITEMS

# Get specific threat
aws dynamodb get-item \
  --table-name threats \
  --key '{"threat_id": {"S": "SQ-2026-001"}, "date_detected": {"S": "2026-03-14T10:00:00Z"}}'
```

### 4. Test Frontend Integration

```bash
# Build and test locally
cd frontend
npm run build
npm run preview

# Test API calls from frontend
# Open browser console and test:
fetch('/api/threats').then(r => r.json()).then(d => console.log(d))
```

---

## 🚨 Troubleshooting

### Issue: Lambda timeout

**Solution:** Increase timeout in Lambda configuration
```bash
aws lambda update-function-configuration \
  --function-name scamguard-threats-api \
  --timeout 120
```

### Issue: DynamoDB capacity exceeded

**Solution:** DynamoDB is on-demand (auto-scaling)
- No action needed, charges scale with usage

### Issue: API Gateway 502 error

**Solution:** Check Lambda logs
```bash
aws logs tail /aws/lambda/scamguard-threats-api --follow
```

### Issue: SQ API not updating

**Solution:** Check EventBridge rule
```bash
aws events describe-rule --name scamguard-sq-polling
aws events list-targets-by-rule --rule scamguard-sq-polling
```

---

## 📈 Monitoring

### CloudWatch Metrics

```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=scamguard-threats-api \
  --start-time 2026-03-14T00:00:00Z \
  --end-time 2026-03-15T00:00:00Z \
  --period 3600 \
  --statistics Sum

# DynamoDB read/write capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedWriteCapacityUnits \
  --dimensions Name=TableName,Value=threats \
  --start-time 2026-03-14T00:00:00Z \
  --end-time 2026-03-15T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

---

## ✅ Deployment Checklist

- [ ] DynamoDB tables created
- [ ] Lambda functions deployed
- [ ] Lambda environment variables configured
- [ ] API Gateway configured
- [ ] CloudWatch rules created (SQ 4h, CAFC daily)
- [ ] IAM roles configured
- [ ] Frontend built and deployed
- [ ] API endpoints tested
- [ ] Lambda logs verified
- [ ] DynamoDB operations verified
- [ ] Monitoring configured
- [ ] DNS updated (if applicable)

---

## 🎉 Post-Deployment

Once deployed:
1. Test all API endpoints
2. Monitor CloudWatch logs for 24 hours
3. Verify SQ API polling (4 hours)
4. Verify CAFC import (daily at 2 AM)
5. Test frontend integration
6. Enable production monitoring
7. Document any issues in GitHub Issues

---

**Deployment Ready:** ✅
**Estimated Time:** 30-45 minutes
**Support:** Check GitHub Issues or contact @echetoui

