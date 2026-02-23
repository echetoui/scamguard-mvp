# 🚀 Phase 4.4 Deployment Checklist - LIVE EXECUTION

**Date:** 23 février 2026
**Time:** NOW
**Status:** 🟢 STARTING PHASE 1 INFRASTRUCTURE DEPLOYMENT
**Estimated Duration:** 2-3 hours

---

## ⚠️ PREREQUISITES - MUST COMPLETE FIRST

### Step 1: Configure AWS Credentials

**You need:**
- AWS Account with admin access
- AWS Access Key ID
- AWS Secret Access Key

**To configure:**

```bash
# Run AWS configuration
aws configure --profile scamguard

# You'll be prompted for:
# AWS Access Key ID: [enter your key]
# AWS Secret Access Key: [enter your secret]
# Default region: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity --profile scamguard

# Expected output:
# {
#     "UserId": "AIDXXXXXXXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-username"
# }
```

**⚠️ STOP HERE - Configure credentials before proceeding**

---

## 🎯 PHASE 1: INFRASTRUCTURE DEPLOYMENT

### Step 2: Create AWS Pinpoint Project

Once credentials are configured:

```bash
# Export variables for reuse
export AWS_PROFILE=scamguard
export REGION=us-east-1
export APP_NAME="ScamGuard-SMS"

# Create Pinpoint application
aws pinpoint create-app \
  --profile $AWS_PROFILE \
  --region $REGION \
  --create-application-request Name="$APP_NAME",QuietTime='{Start=22:00,End=08:00}'

# SAVE THIS OUTPUT - You'll need the ApplicationId
# Look for: "Id": "a1b2c3d4e5f6g7h8i9j0k1l2"
```

**Expected Response:**
```json
{
    "ApplicationResponse": {
        "Arn": "arn:aws:pinpoint:us-east-1:123456789012:app/a1b2c3d4e5f6g7h8i9j0k1l2",
        "Id": "a1b2c3d4e5f6g7h8i9j0k1l2",
        "Name": "ScamGuard-SMS",
        ...
    }
}
```

**📌 SAVE THIS: Your Pinpoint Project ID** (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2`)

---

### Step 3: Enable SMS Channel in Pinpoint

```bash
# Set your Project ID from Step 2
export PINPOINT_PROJECT_ID="YOUR_PROJECT_ID_HERE"

# Enable SMS channel
aws pinpoint update-sms-channel \
  --profile $AWS_PROFILE \
  --application-id "$PINPOINT_PROJECT_ID" \
  --region $REGION \
  --sms-channel-request Enabled=true

# Verify SMS is enabled
aws pinpoint get-sms-channel \
  --profile $AWS_PROFILE \
  --application-id "$PINPOINT_PROJECT_ID" \
  --region $REGION

# Expected output should show:
# "Enabled": true
```

---

### Step 4: Check SMS Spending Limit

```bash
# Check current SMS spending limit
aws pinpoint get-account-sms-attributes \
  --profile $AWS_PROFILE \
  --region $REGION

# Look for: "MonthlySpendLimit": <number>
# If not set or too low, request increase via:
# https://console.aws.amazon.com/support/home?region=us-east-1#/case/create?issueType=service-limit-increase
```

---

### Step 5: Update samconfig.toml with Pinpoint Project ID

Edit `backend/samconfig.toml`:

```bash
# Open the file
cat backend/samconfig.toml
```

**Update the `parameter_overrides` section:**

```toml
parameter_overrides = [
  "Environment=dev",
  "ImageRepoUri=public.ecr.aws/lambda/python:3.12",
  "DynamoDBTableName=ScamGuardData",
  "AuditTableName=ScamGuardAudit",
  "OTPTableName=ScamGuardOTP",
  "PinpointProjectId=YOUR_PROJECT_ID_HERE"  # ← REPLACE WITH YOUR PROJECT ID
]
```

**To update via command line:**

```bash
# Replace YOUR_PROJECT_ID_HERE with your actual Pinpoint Project ID
sed -i '' 's/PinpointProjectId=/PinpointProjectId=a1b2c3d4e5f6g7h8i9j0k1l2/g' backend/samconfig.toml

# Verify it was updated
grep PinpointProjectId backend/samconfig.toml
```

---

### Step 6: Validate SAM Template

```bash
# Validate the CloudFormation template
sam validate \
  --template backend/template.yaml \
  --region $REGION \
  --profile $AWS_PROFILE

# Expected output:
# template.yaml is valid
```

---

### Step 7: Build SAM Application

```bash
# Navigate to backend directory
cd backend

# Build the SAM application
sam build \
  --region $REGION \
  --profile $AWS_PROFILE

# Expected output:
# Successfully packaged artifacts and wrote output template to file .aws-sam/build/template.yaml
# Execute the following command to deploy the packaged template
# sam deploy --template-file .aws-sam/build/template.yaml --stack-name <stack-name> ...
```

---

### Step 8: Deploy SAM Stack

```bash
# Deploy with guided mode (asks questions)
sam deploy \
  --region $REGION \
  --profile $AWS_PROFILE \
  --guided

# For the questions, use defaults from samconfig.toml:
# Stack Name: scamguard-mvp
# Capabilities: CAPABILITY_NAMED_IAM (type: y)
# Save parameters to samconfig.toml: y
```

**OR use existing configuration:**

```bash
# If samconfig.toml is already configured correctly
sam deploy \
  --region $REGION \
  --profile $AWS_PROFILE

# This will use settings from samconfig.toml without prompts
```

**⏳ WAIT** - Deployment takes 5-10 minutes...

---

### Step 9: Capture Stack Outputs

After deployment completes, save these outputs:

```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --region $REGION \
  --profile $AWS_PROFILE \
  --query 'Stacks[0].Outputs' \
  --output table

# You should see outputs like:
# ┌─────────────────────┬──────────────────────────────────┐
# │ OutputKey           │ OutputValue                      │
# ├─────────────────────┼──────────────────────────────────┤
# │ ApiEndpoint         │ https://xxx.execute-api...       │
# │ OTPTableName        │ ScamGuardOTP-dev                 │
# │ SMSOTPHandlerArn    │ arn:aws:lambda:...               │
# │ UserPoolClientId    │ xxxxxxxxxxxxxxxx                 │
# │ UserPoolId          │ us-east-1_xxxxxxxx               │
# └─────────────────────┴──────────────────────────────────┘
```

**📌 SAVE THESE OUTPUTS:**
```
API_ENDPOINT=https://xxx.execute-api.us-east-1.amazonaws.com/dev/
OTP_TABLE_NAME=ScamGuardOTP-dev
LAMBDA_ARN=arn:aws:lambda:...
USER_POOL_ID=us-east-1_xxxxxxxx
USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxx
```

---

### Step 10: Verify Infrastructure

```bash
# Check DynamoDB OTP Table
aws dynamodb describe-table \
  --table-name ScamGuardOTP-dev \
  --region $REGION \
  --profile $AWS_PROFILE \
  --output table

# Should show: BillingMode: PAY_PER_REQUEST, Status: ACTIVE

# Check Lambda Function
aws lambda get-function \
  --function-name scamguard-sms-otp-dev \
  --region $REGION \
  --profile $AWS_PROFILE \
  --output table

# Should show: FunctionName, Runtime: python3.12, Status: Active

# Check API Gateway Routes
REST_API_ID=$(aws apigateway get-rest-apis \
  --region $REGION \
  --profile $AWS_PROFILE \
  --query "items[?name=='scamguard-api-dev'].id" \
  --output text)

aws apigateway get-resources \
  --rest-api-id "$REST_API_ID" \
  --region $REGION \
  --profile $AWS_PROFILE \
  --query 'items[?contains(path, `auth`)].[path, id]' \
  --output table

# Should show routes including:
# /api/v1/auth/request-sms-otp
# /api/v1/auth/verify-sms-otp
```

---

## 🧪 TEST SMS DELIVERY

### Step 11: Request OTP with Your Phone

**⚠️ IMPORTANT: Use YOUR actual phone number in E.164 format**
- Example for Montreal: `+15145551234`
- Format: `+1` + area code + number (North America)

```bash
# Set variables
export API_ENDPOINT="https://xxx.execute-api.us-east-1.amazonaws.com/dev/"  # From Step 9
export TEST_PHONE="+1514555XXXX"  # ← REPLACE WITH YOUR PHONE
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="TestPass123!"

# Request OTP
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
#     "message": "Code de vérification envoyé à +1514****XXXX",
#     "expires_in": 600,
#     "phone_masked": "+1514****XXXX"
#   }
# }
```

**⏳ WAIT FOR SMS** - Should arrive within 5 seconds

---

### Step 12: Check Your SMS

**Look for message:** `ScamGuard - Votre code de vérification: XXXXXX (valide 10 minutes)`

**📌 SAVE THIS CODE:** (6 digits)

---

### Step 13: Verify the Code

```bash
# Replace XXXXXX with the code you received
export OTP_CODE="XXXXXX"

curl -X POST "${API_ENDPOINT}api/v1/auth/verify-sms-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"$TEST_PHONE\",
    \"code\": \"$OTP_CODE\",
    \"password\": \"$TEST_PASSWORD\"
  }"

# Expected response (SUCCESS):
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
#       "phone_number": "+1514555XXXX"
#     }
#   }
# }
```

✅ **If you got a VERIFIED response, SMS OTP is working!**

---

## ✅ PHASE 1 COMPLETION CHECKLIST

- [ ] AWS credentials configured (`aws configure`)
- [ ] AWS account identity verified (`aws sts get-caller-identity`)
- [ ] Pinpoint project created
- [ ] Pinpoint Project ID saved: `_________________`
- [ ] SMS channel enabled in Pinpoint
- [ ] samconfig.toml updated with Project ID
- [ ] template.yaml validated (`sam validate` passed)
- [ ] SAM application built (`sam build` passed)
- [ ] CloudFormation stack deployed (`sam deploy` completed)
- [ ] Stack outputs captured and saved
- [ ] DynamoDB OTP table verified
- [ ] Lambda function verified
- [ ] API Gateway routes verified
- [ ] SMS delivered to real phone (Step 11)
- [ ] OTP code received (Step 12)
- [ ] Code verification successful (Step 13)

---

## 🎯 WHAT TO DO IF SOMETHING FAILS

### SMS Not Received

**Check 1: Pinpoint SMS Channel**
```bash
aws pinpoint get-sms-channel \
  --application-id "$PINPOINT_PROJECT_ID" \
  --region $REGION \
  --profile $AWS_PROFILE
```
Must show: `"Enabled": true`

**Check 2: Lambda Logs**
```bash
aws logs tail /aws/lambda/scamguard-sms-otp-dev \
  --follow \
  --region $REGION \
  --profile $AWS_PROFILE
```

**Check 3: SMS Spending Limit**
```bash
aws pinpoint get-account-sms-attributes \
  --region $REGION \
  --profile $AWS_PROFILE
```

**Check 4: Phone Number Format**
- Must be E.164: `+1XXXXXXXXXX`
- Cannot have spaces or dashes
- Must start with country code

### Deployment Failed

**Rollback:**
```bash
aws cloudformation delete-stack \
  --stack-name scamguard-mvp \
  --region $REGION \
  --profile $AWS_PROFILE

# Wait for deletion (5 minutes)
# Then retry: sam deploy
```

### Lambda Permission Error

```bash
# Check Lambda IAM role permissions
aws lambda get-policy \
  --function-name scamguard-sms-otp-dev \
  --region $REGION \
  --profile $AWS_PROFILE
```

---

## 📊 COST CHECK

After deployment, check estimated costs:

```bash
# DynamoDB on-demand costs
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter file://filter.json \
  --region $REGION \
  --profile $AWS_PROFILE

# Expected: ~$1-2/month for dev environment
```

---

## 🚀 NEXT STEPS (AFTER PHASE 1)

Once Phase 1 is complete:

1. **Phase 2: Backend Testing** (2-3 hours)
   - Create pytest tests
   - Achieve 90%+ coverage
   - Run: `pytest backend/tests/ -v --cov`

2. **Phase 3: Frontend Integration** (2-3 hours)
   - Update App.jsx
   - Test signup flow
   - Run accessibility audit

3. **Phase 4: E2E Testing** (2-3 hours)
   - Load testing
   - Error scenario testing
   - Staging deployment

---

## 📝 EXECUTION LOG

Use this section to track your progress:

```
Step 1 (Configure credentials): [ ] Not Started [ ] In Progress [✓] Complete
Step 2 (Create Pinpoint): [ ] Not Started [ ] In Progress [ ] Complete
Step 3 (Enable SMS): [ ] Not Started [ ] In Progress [ ] Complete
Step 4 (Check spending): [ ] Not Started [ ] In Progress [ ] Complete
Step 5 (Update config): [ ] Not Started [ ] In Progress [ ] Complete
Step 6 (Validate): [ ] Not Started [ ] In Progress [ ] Complete
Step 7 (Build): [ ] Not Started [ ] In Progress [ ] Complete
Step 8 (Deploy): [ ] Not Started [ ] In Progress [ ] Complete
Step 9 (Outputs): [ ] Not Started [ ] In Progress [ ] Complete
Step 10 (Verify): [ ] Not Started [ ] In Progress [ ] Complete
Step 11 (Request OTP): [ ] Not Started [ ] In Progress [ ] Complete
Step 12 (Check SMS): [ ] Not Started [ ] In Progress [ ] Complete
Step 13 (Verify code): [ ] Not Started [ ] In Progress [ ] Complete

Phase 1 Status: ⭕ READY TO START
```

---

## 💡 HELPFUL TIPS

1. **Save outputs in a file:**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name scamguard-mvp \
     --region us-east-1 \
     --profile scamguard > phase1_outputs.json
   ```

2. **Create a .env file for later:**
   ```bash
   cat > .env.deployment <<'EOF'
   PINPOINT_PROJECT_ID=your-project-id
   API_ENDPOINT=https://xxx.execute-api.us-east-1.amazonaws.com/dev/
   OTP_TABLE_NAME=ScamGuardOTP-dev
   AWS_PROFILE=scamguard
   AWS_REGION=us-east-1
   EOF
   ```

3. **Monitor deployment in console:**
   - CloudFormation: https://console.aws.amazon.com/cloudformation/
   - Lambda: https://console.aws.amazon.com/lambda/
   - Pinpoint: https://console.aws.amazon.com/pinpoint/

---

**Status:** 🟢 PHASE 1 READY TO EXECUTE
**Time Estimate:** 2-3 hours total
**Next:** Run Step 1 - Configure AWS Credentials

**Contact:** If stuck on any step, refer to troubleshooting section above.
