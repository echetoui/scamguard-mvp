# 🚀 Phase 4.4 - Phase 1 Quick Start

**Status:** ✅ Ready to Deploy
**Time:** 2-3 hours
**Branch:** feature/phase-4.4

---

## 🎯 Two Options: Choose Your Path

### Option 1: 🤖 Automated Deployment (Recommended - 15 minutes)

**Best for:** Quick deployment without manual steps

```bash
# Prerequisites check
aws --version              # AWS CLI installed?
sam --version              # SAM CLI installed?
aws configure --profile scamguard  # Configure credentials if needed

# Run deployment
chmod +x deploy-phase1.sh
./deploy-phase1.sh

# Wait 5-10 minutes...
# ✅ Done! Outputs saved to .env.deployment
```

**What it does automatically:**
- ✅ Verifies AWS credentials
- ✅ Creates Pinpoint project
- ✅ Enables SMS channel
- ✅ Validates SAM template
- ✅ Builds and deploys infrastructure
- ✅ Captures outputs to .env.deployment

**Then test SMS delivery** (manual):
```bash
source .env.deployment
curl -X POST "${API_ENDPOINT}api/v1/auth/request-sms-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phone":"+1514555XXXX","password":"TestPass123!"}'
```

---

### Option 2: 📖 Manual Deployment (Step-by-Step)

**Best for:** Learning or troubleshooting

**Follow this guide:**
```
PHASE_4.4_DEPLOYMENT_CHECKLIST.md
├─ Section: PREREQUISITES (Step 1)
├─ Section: PHASE 1 INFRASTRUCTURE DEPLOYMENT (Steps 2-10)
└─ Section: TEST SMS DELIVERY (Steps 11-13)
```

**Time breakdown:**
- Step 1 (Configure AWS): 5 minutes
- Steps 2-4 (Pinpoint setup): 10 minutes
- Steps 5-8 (SAM deploy): 15 minutes (mostly waiting)
- Steps 9-10 (Verify): 5 minutes
- Steps 11-13 (Test SMS): 10 minutes
- **Total: ~45 minutes**

---

## ⚠️ Prerequisites (Required for Both Options)

### 1. Install AWS CLI

```bash
# Check if installed
aws --version

# If not installed:
# macOS: brew install awscli
# Linux: curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
```

### 2. Install SAM CLI

```bash
# Check if installed
sam --version

# If not installed:
# macOS: brew install aws-sam-cli
# Linux: pip install aws-sam-cli
```

### 3. Get AWS Credentials

You need:
- **AWS Access Key ID**
- **AWS Secret Access Key**

From your AWS account:
1. Go to: https://console.aws.amazon.com/iam/
2. Click: Users → Your User → Security Credentials
3. Generate new access key if needed
4. **SAVE SAFELY** - You'll only see it once!

### 4. Configure AWS Profile

```bash
aws configure --profile scamguard

# You'll be prompted:
# AWS Access Key ID: [paste your key]
# AWS Secret Access Key: [paste your secret]
# Default region: us-east-1
# Default output format: json

# Verify it works:
aws sts get-caller-identity --profile scamguard
```

---

## 🚀 Executing Phase 1

### If you chose Option 1 (Automated):

```bash
# 1. Make script executable (already done)
chmod +x deploy-phase1.sh

# 2. Run deployment
./deploy-phase1.sh

# 3. Wait for completion (5-10 minutes)

# 4. Check outputs
cat .env.deployment

# 5. Test SMS (see Testing section below)
```

### If you chose Option 2 (Manual):

```bash
# 1. Open the deployment checklist
open PHASE_4.4_DEPLOYMENT_CHECKLIST.md

# 2. Follow steps 1-13 in order
# (Copy/paste commands as needed)

# 3. Save outputs for later reference

# 4. Test SMS (see Testing section below)
```

---

## 📱 Testing SMS Delivery

**Regardless of which option you choose, you must test SMS:**

### Step 1: Get Your Pinpoint Project ID

If automated:
```bash
grep PINPOINT_PROJECT_ID .env.deployment
```

If manual:
- You saved this in Step 2

### Step 2: Get Your API Endpoint

If automated:
```bash
grep API_ENDPOINT .env.deployment
```

If manual:
- You saved this in Step 9

### Step 3: Request OTP with Your Real Phone

⚠️ **IMPORTANT: Use YOUR actual phone number**

```bash
# Set variables
export API_ENDPOINT="https://xxx.execute-api.us-east-1.amazonaws.com/dev/"  # From above
export TEST_PHONE="+1514555XXXX"  # YOUR PHONE - E.164 format
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
```

**Expected response:**
```json
{
  "data": {
    "message": "Code de vérification envoyé à +1514****XXXX",
    "expires_in": 600,
    "phone_masked": "+1514****XXXX"
  }
}
```

### Step 4: Check Your Phone

**Look for SMS from AWS Pinpoint:**
```
ScamGuard - Votre code de vérification: 123456 (valide 10 minutes)
```

**Save the 6-digit code** - you'll need it next

### Step 5: Verify the Code

```bash
# Set the code you received
export OTP_CODE="123456"

# Verify it
curl -X POST "${API_ENDPOINT}api/v1/auth/verify-sms-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"$TEST_PHONE\",
    \"code\": \"$OTP_CODE\",
    \"password\": \"$TEST_PASSWORD\"
  }"
```

**Expected response (SUCCESS):**
```json
{
  "data": {
    "status": "VERIFIED",
    "id_token": "eyJhbG...",
    "access_token": "eyJhbG...",
    "refresh_token": "...",
    "expires_in": 3600,
    "user": {
      "sub": "user-uuid",
      "email": "test@example.com",
      "phone_number": "+1514555XXXX"
    }
  }
}
```

✅ **If you got VERIFIED, SMS OTP is working!**

---

## ✅ Phase 1 Success Criteria

- [ ] AWS credentials configured
- [ ] Pinpoint project created
- [ ] SMS channel enabled
- [ ] samconfig.toml updated with Project ID
- [ ] SAM template validated
- [ ] CloudFormation stack deployed
- [ ] Stack outputs captured
- [ ] DynamoDB table verified
- [ ] Lambda function verified
- [ ] API routes verified
- [ ] SMS delivered to real phone
- [ ] Code verification successful

---

## 🚨 If Something Goes Wrong

### SMS Not Received

1. **Check Pinpoint is enabled:**
   ```bash
   aws pinpoint get-sms-channel \
     --application-id $PINPOINT_PROJECT_ID \
     --region us-east-1 \
     --profile scamguard
   ```
   Should show: `"Enabled": true`

2. **Check phone number format:**
   - Must be E.164: `+1XXXXXXXXXX`
   - Example: `+15145551234`
   - No spaces or special characters

3. **Check Lambda logs:**
   ```bash
   aws logs tail /aws/lambda/scamguard-sms-otp-dev \
     --follow \
     --region us-east-1 \
     --profile scamguard
   ```

4. **Request SMS spending increase:**
   If new account, may be limited to $1/day:
   https://console.aws.amazon.com/support/home?region=us-east-1#/case/create?issueType=service-limit-increase

### Deployment Failed

1. **Check stack status:**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name scamguard-mvp \
     --region us-east-1 \
     --profile scamguard
   ```

2. **Rollback and retry:**
   ```bash
   aws cloudformation delete-stack \
     --stack-name scamguard-mvp \
     --region us-east-1 \
     --profile scamguard

   # Wait 5 minutes...
   ./deploy-phase1.sh  # Or retry manual steps
   ```

### API Endpoint Not Found

Make sure you waited for all outputs to be available:
```bash
sleep 10

aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --region us-east-1 \
  --profile scamguard \
  --query "Stacks[0].Outputs"
```

---

## 📊 Cost Check

Monitor costs during testing:

```bash
# Current AWS bill (may take 24 hours to update)
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region us-east-1 \
  --profile scamguard
```

**Expected cost:** $1-3/month for testing

---

## 🎯 What's Next (After Phase 1)

Once Phase 1 is complete:

1. **Phase 2: Backend Testing** (2-3 hours)
   - Guide: `PHASE_4.4_WEEK2_TESTING_GUIDE.md`
   - Create pytest test files
   - Run: `pytest backend/tests/ -v --cov`

2. **Phase 3: Frontend Integration** (2-3 hours)
   - Guide: `PHASE_4.4_WEEK2_FRONTEND_INTEGRATION.md`
   - Update App.jsx
   - Test: `npm test`

3. **Phase 4: E2E Testing** (2-3 hours)
   - Load testing
   - Error scenarios
   - Staging deployment

---

## 📞 Need Help?

### Quick Reference

| Issue | Solution |
|-------|----------|
| Credentials not found | Run `aws configure --profile scamguard` |
| SMS not received | Check Pinpoint enabled + phone format |
| Deployment takes too long | Normal - CloudFormation can take 10 minutes |
| API endpoint not available | Wait 2 more minutes, then retry |
| Want to start over | Delete stack, fix issue, redeploy |

### Documentation

- **Detailed troubleshooting:** `PHASE_4.4_DEPLOYMENT_CHECKLIST.md`
- **Complete manual guide:** `PHASE_4.4_DEPLOYMENT_CHECKLIST.md`
- **Architecture details:** `PHASE_4.4_MODERN_AUTH_ARCHITECTURE.md`

---

## 🚀 Ready?

### Choose your path:

**🤖 Fast (Automated):**
```bash
./deploy-phase1.sh
```

**📖 Learning (Manual):**
```bash
open PHASE_4.4_DEPLOYMENT_CHECKLIST.md
```

---

**Status:** ✅ Phase 1 Ready to Execute

**Commit:** fd60256 (Phase 1 checklist and script)

**Estimated Time:** 45 minutes - 2 hours

**Next Report:** Phase 1 Completion Status

Let's deploy! 🚀
