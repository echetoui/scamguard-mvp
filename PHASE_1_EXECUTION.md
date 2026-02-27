# 🚀 Phase 1 Execution - Step by Step

**Status:** Ready to Execute
**Date:** 23 février 2026
**Expected Duration:** 30-60 minutes
**Branch:** feature/phase-4.4

---

## 📋 EXECUTION PATH - Choose One

### Path A: 🤖 AUTOMATED (Fastest - 15 minutes)
Run one script that does everything automatically.

### Path B: 📖 MANUAL (Educational - 45 minutes)
Follow step-by-step commands to understand each part.

---

## 🚀 PATH A: AUTOMATED EXECUTION (Recommended)

### Step 1: Verify Prerequisites

```bash
# Check AWS CLI
aws --version
# Should show: aws-cli/2.x.x

# Check SAM CLI
sam --version
# Should show: SAM CLI, version x.x.x

# Check Python
python3 --version
# Should show: Python 3.x.x
```

**If any are missing:**
```bash
# macOS
brew install awscli aws-sam-cli

# Ubuntu/Debian
sudo apt-get install awscli
pip3 install aws-sam-cli
```

---

### Step 2: Configure AWS Credentials

```bash
# Configure your AWS profile
aws configure --profile scamguard

# You'll be prompted for:
# AWS Access Key ID: [paste your key from IAM]
# AWS Secret Access Key: [paste your secret from IAM]
# Default region: us-east-1
# Default output format: json
```

**Verify it works:**
```bash
aws sts get-caller-identity --profile scamguard

# Should output your account info:
# {
#     "UserId": "AIDXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-user"
# }
```

---

### Step 3: Run Automated Deployment

```bash
# Navigate to project root
cd /Users/echetoui/scamguard-mvp

# Make sure script is executable
chmod +x deploy-phase1.sh

# Run the automated deployment
./deploy-phase1.sh
```

**What happens:**
```
[10:00:00] Step 1/13: Verifying AWS Credentials...
✅ AWS credentials verified. Account: 123456789012

[10:00:05] Step 2/13: Creating AWS Pinpoint Project...
✅ Pinpoint Project ID: a1b2c3d4e5f6g7h8i9j0k1l2

[10:00:10] Step 3/13: Enabling SMS Channel in Pinpoint...
✅ SMS Channel enabled

[10:00:15] Step 4/13: Checking SMS Spending Limit...
✅ SMS Spending Limit: $200/month

[10:00:20] Step 5/13: Updating samconfig.toml...
✅ samconfig.toml updated with Pinpoint Project ID

[10:00:25] Step 6/13: Validating SAM Template...
✅ SAM template is valid

[10:00:30] Step 7/13: Building SAM Application...
✅ SAM build completed

[10:05:00] Step 8/13: Deploying CloudFormation Stack...
✅ CloudFormation stack deployed successfully

[10:10:00] Step 9/13: Capturing Stack Outputs...
✅ Stack outputs captured

[10:10:05] Step 10/13: Verifying Infrastructure...
✅ ✓ DynamoDB OTP table exists
✅ ✓ Lambda function deployed
✅ Infrastructure verification complete

Saving deployment outputs to: .env.deployment
✅ Deployment outputs saved to .env.deployment

╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     ✅ PHASE 1: INFRASTRUCTURE DEPLOYMENT COMPLETE       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

📊 DEPLOYMENT SUMMARY:
Pinpoint Project ID: a1b2c3d4e5f6g7h8i9j0k1l2
API Endpoint:        https://xxx.execute-api.us-east-1.amazonaws.com/dev/
OTP Table:           ScamGuardOTP-dev
Region:              us-east-1
Account:             123456789012
```

---

### Step 4: Verify Deployment

```bash
# Check that .env.deployment was created
cat .env.deployment

# Should show:
# PINPOINT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0k1l2
# API_ENDPOINT=https://xxx.execute-api.us-east-1.amazonaws.com/dev/
# OTP_TABLE_NAME=ScamGuardOTP-dev
# ... etc
```

---

### Step 5: Test SMS Delivery

```bash
# Load the deployment outputs
source .env.deployment

# Set your actual phone number (E.164 format)
export TEST_PHONE="+1514555XXXX"  # ← REPLACE WITH YOUR NUMBER

# Request an OTP
curl -X POST "${API_ENDPOINT}api/v1/auth/request-sms-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@example.com\",
    \"phone\": \"$TEST_PHONE\",
    \"password\": \"TestPass123!\"
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

---

### Step 6: Check Your Phone for SMS

**Look for this message:**
```
ScamGuard - Votre code de vérification: 123456 (valide 10 minutes)
```

**Save the 6-digit code** - you'll need it next

---

### Step 7: Verify the Code

```bash
# Set the code you received
export OTP_CODE="123456"  # Replace with actual code from SMS

# Verify it
curl -X POST "${API_ENDPOINT}api/v1/auth/verify-sms-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@example.com\",
    \"phone\": \"$TEST_PHONE\",
    \"code\": \"$OTP_CODE\",
    \"password\": \"TestPass123!\"
  }"

# Expected response:
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

✅ **If you got "status": "VERIFIED", SMS OTP is working!**

---

## 📖 PATH B: MANUAL EXECUTION (Educational)

If you prefer step-by-step manual control, follow the detailed guide:

```bash
open PHASE_4.4_DEPLOYMENT_CHECKLIST.md
```

Then execute steps 1-13 in order.

---

## ✅ SUCCESS CRITERIA

After Phase 1 execution, you should have:

### Infrastructure Created
- ✅ DynamoDB table: ScamGuardOTP-dev
- ✅ Lambda function: scamguard-sms-otp-dev
- ✅ API Gateway routes configured
- ✅ Pinpoint SMS enabled

### Verification Complete
- ✅ `.env.deployment` file created with outputs
- ✅ SMS delivered to your phone
- ✅ OTP verification returned VERIFIED status
- ✅ CloudWatch logs accessible

### Files Updated
- ✅ backend/samconfig.toml (with Pinpoint Project ID)
- ✅ backend/template.yaml (deployed)

---

## 🚨 TROUBLESHOOTING

### SMS Not Received

**Check 1: Phone format**
```bash
# Phone must be E.164 format
# Correct: +15145551234
# Wrong: 514-555-1234 or (514) 555-1234
```

**Check 2: Pinpoint enabled**
```bash
source .env.deployment
aws pinpoint get-sms-channel \
  --application-id $PINPOINT_PROJECT_ID \
  --region us-east-1 \
  --profile scamguard
# Should show: "Enabled": true
```

**Check 3: Lambda logs**
```bash
aws logs tail /aws/lambda/scamguard-sms-otp-dev \
  --follow \
  --region us-east-1 \
  --profile scamguard
# Look for error messages
```

**Check 4: SMS spending limit**
```bash
aws pinpoint get-account-sms-attributes \
  --region us-east-1 \
  --profile scamguard
# Check MonthlySpendLimit is set
```

---

### Deployment Failed

**Check CloudFormation events:**
```bash
aws cloudformation describe-stack-events \
  --stack-name scamguard-mvp \
  --region us-east-1 \
  --profile scamguard \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

**Rollback and retry:**
```bash
# Delete the failed stack
aws cloudformation delete-stack \
  --stack-name scamguard-mvp \
  --region us-east-1 \
  --profile scamguard

# Wait 5 minutes for deletion
sleep 300

# Retry deployment
./deploy-phase1.sh
```

---

### API Endpoint Not Responding

```bash
# Check if API is deployed
REST_API_ID=$(aws apigateway get-rest-apis \
  --region us-east-1 \
  --profile scamguard \
  --query "items[?name=='scamguard-api-dev'].id" \
  --output text)

# List resources
aws apigateway get-resources \
  --rest-api-id "$REST_API_ID" \
  --region us-east-1 \
  --profile scamguard \
  --query 'items[?contains(path, `auth`)]'
```

---

## 📊 MONITORING

After successful deployment, monitor your resources:

### CloudWatch Logs
```bash
# Watch Lambda logs in real-time
aws logs tail /aws/lambda/scamguard-sms-otp-dev \
  --follow \
  --region us-east-1 \
  --profile scamguard
```

### DynamoDB
```bash
# Check OTP table items
aws dynamodb scan \
  --table-name ScamGuardOTP-dev \
  --region us-east-1 \
  --profile scamguard
```

### Cost
```bash
# Check current spending
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region us-east-1 \
  --profile scamguard
```

---

## 🎯 COMPLETION CHECKLIST

- [ ] AWS credentials configured (`aws configure --profile scamguard`)
- [ ] AWS credentials verified (`aws sts get-caller-identity`)
- [ ] Automated deployment script executed (`./deploy-phase1.sh`)
- [ ] `.env.deployment` file created
- [ ] DynamoDB table verified
- [ ] Lambda function verified
- [ ] SMS request succeeds (200 response)
- [ ] SMS delivered to phone
- [ ] Code verification returns VERIFIED
- [ ] Stack outputs captured
- [ ] CloudWatch logs accessible

---

## 🚀 NEXT AFTER PHASE 1

Once Phase 1 is complete, move to:

**Phase 2: Backend Testing** (2-3 hours)
```bash
open PHASE_4.4_WEEK2_TESTING_GUIDE.md

# Create pytest test files
mkdir -p backend/tests
touch backend/tests/{__init__.py,test_sms_otp_handler.py,test_phone_validation.py}

# Install test dependencies
pip install pytest pytest-cov pytest-mock moto

# Run tests
pytest backend/tests/ -v --cov=backend/lambda/sms_otp_handler
```

---

## ⏱️ TIMING

| Step | Time | Status |
|------|------|--------|
| Prerequisites | 5 min | ⭕ Start here |
| AWS Credentials | 5 min | Follow Step 2 |
| Run Script | 15 min | Run ./deploy-phase1.sh |
| Test SMS | 10 min | Test delivery |
| Verify Success | 5 min | Check all items |
| **Total** | **~40 min** | 🎯 |

---

## 💾 SAVE YOUR OUTPUTS

After successful deployment:

```bash
# Backup your deployment outputs
cp .env.deployment .env.deployment.backup

# Save stack outputs to file
aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --region us-east-1 \
  --profile scamguard \
  > phase1_stack_outputs.json
```

---

## 📚 DOCUMENTATION REFERENCE

- Full deployment guide: `PHASE_4.4_DEPLOYMENT_CHECKLIST.md`
- Quick start guide: `PHASE_1_QUICKSTART.md`
- Architecture overview: `PHASE_4.4_MODERN_AUTH_ARCHITECTURE.md`
- Next phase: `PHASE_4.4_WEEK2_TESTING_GUIDE.md`

---

**Ready to execute Phase 1?**

**Choose your path:**
```bash
# Fast - Automated (15 min)
./deploy-phase1.sh

# Learning - Manual (45 min)
open PHASE_4.4_DEPLOYMENT_CHECKLIST.md
```

**Status:** ✅ Ready to Execute
**Time:** 30-60 minutes
**Next:** Phase 2 Backend Testing

Good luck! 🚀
