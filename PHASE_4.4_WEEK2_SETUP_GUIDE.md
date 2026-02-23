# 🚀 Phase 4.4 Week 2 - Infrastructure Setup Guide

**Date:** 23 février 2026
**Status:** Week 2 Infrastructure Setup
**Branch:** feature/phase-4.4
**Focus:** Deploy SMS OTP Backend Infrastructure

---

## 📋 Prerequisites

Before starting, ensure you have:

```bash
# AWS CLI v2 installed and configured
aws --version
aws sts get-caller-identity

# SAM CLI installed
sam --version

# Git branch ready
git status  # Should show feature/phase-4.4
```

---

## 🔧 Step 1: Create AWS Pinpoint Project (If Not Exists)

### 1.1 Check if Pinpoint Project Exists

```bash
# List existing Pinpoint applications
aws pinpoint list-apps --region us-east-1

# If you have a project ID, note it for later (format: 12345a67b8c9d0e1f2g3h4i5)
```

### 1.2 Create New Pinpoint Project (If Needed)

```bash
# Create a new Pinpoint application for SMS
aws pinpoint create-app \
  --region us-east-1 \
  --create-application-request \
    Name="ScamGuard-SMS",QuietTime='{Start=22:00,End=08:00}'

# Note the ApplicationId from response (this is your PINPOINT_PROJECT_ID)
# Example: a1b2c3d4e5f6g7h8i9j0k1l2
```

### 1.3 Enable SMS Channel in Pinpoint

```bash
# Set variables for easier reuse
PINPOINT_PROJECT_ID="your-project-id-here"  # Replace with actual ID
REGION="us-east-1"

# Update SMS channel configuration
aws pinpoint update-sms-channel \
  --application-id "$PINPOINT_PROJECT_ID" \
  --region "$REGION" \
  --sms-channel-request Enabled=true

# Verify SMS channel is enabled
aws pinpoint get-sms-channel \
  --application-id "$PINPOINT_PROJECT_ID" \
  --region "$REGION"
```

### 1.4 Request SMS Spending Limit (If New Account)

For new AWS accounts, you may need to request SMS spending limit increase:

```bash
# Check current SMS spending limit
aws pinpoint get-account-sms-attributes --region "$REGION"

# If limited, request increase at:
# https://console.aws.amazon.com/support/home?region=us-east-1#/case/create?issueType=service-limit-increase
```

---

## 📦 Step 2: Update samconfig.toml with Pinpoint Project ID

Update the file with your actual Pinpoint Project ID:

```toml
parameter_overrides = [
  "Environment=dev",
  "ImageRepoUri=public.ecr.aws/lambda/python:3.12",
  "DynamoDBTableName=ScamGuardData",
  "AuditTableName=ScamGuardAudit",
  "OTPTableName=ScamGuardOTP",
  "PinpointProjectId=a1b2c3d4e5f6g7h8i9j0k1l2"  # Replace with your ID
]
```

---

## 🚀 Step 3: Deploy Infrastructure with SAM

### 3.1 Validate Template

```bash
# Validate CloudFormation template
sam validate --region us-east-1

# Expected output: template.yaml is valid
```

### 3.2 Build

```bash
# Build SAM project (installs Python dependencies)
sam build --region us-east-1

# This creates .aws-sam/build/ directory with:
# - Lambda functions
# - Layers
# - DynamoDB table definitions
```

### 3.3 Deploy

```bash
# First deployment (interactive)
sam deploy --guided --region us-east-1

# Or if samconfig.toml is properly configured:
sam deploy --region us-east-1

# This will:
# ✅ Create DynamoDB OTPTable-dev with TTL enabled
# ✅ Create SMSOTPHandler Lambda function
# ✅ Create API Gateway endpoints
# ✅ Set up IAM policies
# ✅ Output CloudFormation stack outputs
```

### 3.4 Capture Stack Outputs

After deployment, note these values:

```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'

# You'll see outputs like:
# - ApiEndpoint: https://xxx.execute-api.us-east-1.amazonaws.com/dev/
# - UserPoolId: us-east-1_xxxxxxxx
# - UserPoolClientId: xxxxxxxxxxxxxxxx
# - OTPTableName: ScamGuardOTP-dev
# - SMSOTPHandlerArn: arn:aws:lambda:...
```

---

## ✅ Step 4: Verify Infrastructure

### 4.1 Check DynamoDB OTP Table

```bash
# Describe OTP table
aws dynamodb describe-table \
  --table-name ScamGuardOTP-dev \
  --region us-east-1

# Verify:
# - BillingMode: PAY_PER_REQUEST (on-demand)
# - TTL: Enabled with attribute 'ttl'
# - Key schema: PK (HASH), SK (RANGE)
```

### 4.2 Check Lambda Function

```bash
# Get SMS OTP Handler details
aws lambda get-function \
  --function-name scamguard-sms-otp-dev \
  --region us-east-1

# Check environment variables
aws lambda get-function-configuration \
  --function-name scamguard-sms-otp-dev \
  --region us-east-1 \
  --query 'Environment.Variables'
```

### 4.3 Check API Gateway Routes

```bash
# List API Gateway resources
REST_API_ID=$(aws apigateway get-rest-apis \
  --region us-east-1 \
  --query "items[?name=='scamguard-api-dev'].id" \
  --output text)

aws apigateway get-resources \
  --rest-api-id "$REST_API_ID" \
  --region us-east-1 \
  --query 'items[?path==`/auth/request-sms-otp` || path==`/auth/verify-sms-otp`]'

# Verify routes exist:
# - POST /api/v1/auth/request-sms-otp
# - POST /api/v1/auth/verify-sms-otp
```

### 4.4 Check Pinpoint Configuration

```bash
# Verify SMS channel is still enabled
aws pinpoint get-sms-channel \
  --application-id "$PINPOINT_PROJECT_ID" \
  --region "$REGION"

# Response should show:
# "Enabled": true
```

---

## 🧪 Step 5: Test SMS Delivery

### 5.1 Test with Real Phone Number

```bash
# Set your phone number (in E.164 format)
TEST_PHONE="+15145551234"  # Replace with YOUR phone number
TEST_EMAIL="test@example.com"
TEST_PASSWORD="TestPass123!"

# Get API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

# Request SMS OTP
curl -X POST "${API_ENDPOINT}api/v1/auth/request-sms-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"$TEST_PHONE\",
    \"password\": \"$TEST_PASSWORD\"
  }"

# Expected response:
# {
#   "data": {
#     "message": "Code de vérification envoyé à +1514****1234",
#     "expires_in": 600,
#     "phone_masked": "+1514****1234"
#   }
# }
```

### 5.2 Verify SMS Received

- Check your phone for SMS from AWS Pinpoint
- Message format: `ScamGuard - Votre code de vérification: XXXXXX (valide 10 minutes)`

### 5.3 Verify the Code

```bash
# Replace with the code you received
OTP_CODE="123456"

curl -X POST "${API_ENDPOINT}api/v1/auth/verify-sms-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"$TEST_PHONE\",
    \"code\": \"$OTP_CODE\",
    \"password\": \"$TEST_PASSWORD\"
  }"

# Expected response (on success):
# {
#   "data": {
#     "status": "VERIFIED",
#     "id_token": "eyJhbG...",
#     "access_token": "eyJhbG...",
#     "refresh_token": "...",
#     "expires_in": 3600,
#     "user": {
#       "sub": "user-uuid",
#       "email": "test@example.com",
#       "phone_number": "+15145551234"
#     }
#   }
# }
```

### 5.4 Test Rate Limiting

```bash
# Make 3 requests with wrong codes (should succeed until rate limit)
for i in {1..3}; do
  curl -X POST "${API_ENDPOINT}api/v1/auth/verify-sms-otp" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$TEST_EMAIL\",
      \"phone\": \"$TEST_PHONE\",
      \"code\": \"000000\",
      \"password\": \"$TEST_PASSWORD\"
    }"
  echo "Attempt $i"
done

# 4th attempt should fail with ACCOUNT_LOCKED
# (Locked for 15 minutes)
```

---

## 📝 Step 6: Test Error Handling

### 6.1 Invalid Phone Format

```bash
curl -X POST "${API_ENDPOINT}api/v1/auth/request-sms-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@example.com\",
    \"phone\": \"514-555-1234\",
    \"password\": \"TestPass123!\"
  }"

# Expected: 400 INVALID_PHONE
# "Phone must be in E.164 format (e.g., +15145551234)"
```

### 6.2 Missing Fields

```bash
curl -X POST "${API_ENDPOINT}api/v1/auth/request-sms-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@example.com\"
  }"

# Expected: 400 MISSING_FIELDS
# "Email, phone, and password required."
```

### 6.3 Expired OTP (Wait 10+ minutes)

```bash
# After 10+ minutes, try to verify old OTP
curl -X POST "${API_ENDPOINT}api/v1/auth/verify-sms-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"$TEST_PHONE\",
    \"code\": \"123456\",
    \"password\": \"$TEST_PASSWORD\"
  }"

# Expected: 400 OTP_EXPIRED
# "Code has expired. Request a new one."
```

---

## 🔍 Step 7: Check CloudWatch Logs

### 7.1 View Lambda Logs

```bash
# Get recent logs from SMS OTP Handler
aws logs tail /aws/lambda/scamguard-sms-otp-dev --follow --region us-east-1

# Watch real-time logs during testing
```

### 7.2 Check Audit Logs in DynamoDB

```bash
# Scan audit table for SMS OTP requests
aws dynamodb scan \
  --table-name ScamGuardAudit-dev \
  --filter-expression "attribute_exists(#act) AND #act = :action" \
  --expression-attribute-names '{"#act":"action"}' \
  --expression-attribute-values '{":action":{"S":"REQUEST_OTP"}}' \
  --region us-east-1

# Shows all SMS OTP requests with timestamps
```

---

## 📊 Cost Estimation

Current setup costs (US-East-1, dev environment):

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| DynamoDB (OTP Table) | $0.25 - $1 | On-demand, low volume |
| Lambda | $0.20 - $1 | SMS OTP requests only |
| Pinpoint SMS | $0.0075 per SMS | ~$1 for 133 tests |
| **Total** | **$1.50 - $3/month** | For development |

Production estimates (10x load):
- DynamoDB: $5-10/month
- Lambda: $2-5/month
- Pinpoint SMS: $75/month (10,000 SMS)
- **Total: $80-90/month**

---

## ✨ Deployment Checklist

- [ ] AWS credentials configured (`aws sts get-caller-identity`)
- [ ] SAM CLI installed (`sam --version`)
- [ ] Pinpoint project created (have PROJECT_ID)
- [ ] SMS channel enabled in Pinpoint
- [ ] samconfig.toml updated with PinpointProjectId
- [ ] template.yaml validated (`sam validate`)
- [ ] Infrastructure deployed (`sam deploy`)
- [ ] Stack outputs captured
- [ ] DynamoDB OTP table created and verified
- [ ] Lambda function created and verified
- [ ] API Gateway routes created and verified
- [ ] SMS delivery tested with real phone
- [ ] Rate limiting tested (3+ attempts)
- [ ] Error handling tested (invalid phone, expired OTP)
- [ ] CloudWatch logs verified
- [ ] Audit logs in DynamoDB verified

---

## 🚨 Troubleshooting

### SMS Not Received

1. **Check Pinpoint SMS channel**
   ```bash
   aws pinpoint get-sms-channel \
     --application-id "$PINPOINT_PROJECT_ID" \
     --region us-east-1
   ```
   Ensure `"Enabled": true`

2. **Check SMS spending limit**
   ```bash
   aws pinpoint get-account-sms-attributes --region us-east-1
   ```
   May need to request increase for new accounts

3. **Check CloudWatch logs**
   ```bash
   aws logs tail /aws/lambda/scamguard-sms-otp-dev --follow
   ```
   Look for error messages from `send_sms_otp()`

4. **Verify phone number format**
   - Must be E.164: `+1XXXXXXXXXX`
   - Must be valid and reachable
   - Some carriers may block 2FA SMS

### DynamoDB Errors

1. **Table doesn't exist**
   ```bash
   aws dynamodb describe-table --table-name ScamGuardOTP-dev
   ```
   If error, re-deploy SAM template

2. **TTL not working**
   ```bash
   aws dynamodb describe-ttl --table-name ScamGuardOTP-dev
   ```
   Should show TimeToLiveDescription with Status: "ENABLED"

### Lambda Errors

1. **Environment variables not set**
   ```bash
   aws lambda get-function-configuration \
     --function-name scamguard-sms-otp-dev \
     --query 'Environment.Variables'
   ```
   Verify all variables present

2. **Permission denied for Pinpoint**
   - Check IAM policy allows `pinpoint:SendMessages`
   - Verify ARN includes correct project ID

---

## 🎯 Next Steps (After Infrastructure)

Once infrastructure is deployed:

1. **Week 2 Backend Testing**
   - Write unit tests for sms_otp_handler.py
   - Write integration tests for OTP flow
   - Test error cases and rate limiting
   - Achieve 90%+ code coverage

2. **Week 2 Frontend Integration**
   - Add SMSAuthScreen to App.jsx
   - Update routing configuration
   - Test OTP input and auto-advance
   - Accessibility audit (WCAG AA)

3. **Week 3 Deployment**
   - Staging environment setup
   - End-to-end testing
   - Load testing (100+ req/s)
   - Production rollout (10% → 50% → 100%)

---

## 📞 Support

If you encounter issues:

1. **Check AWS CloudWatch logs**
2. **Review SAM template outputs**
3. **Test with AWS CLI directly**
4. **Check Pinpoint SMS channel status**
5. **Verify IAM permissions**

---

**Status:** 🚀 Ready for Infrastructure Setup
**Created:** 23 février 2026
**Branch:** feature/phase-4.4

**Next:** Run `sam build && sam deploy`
