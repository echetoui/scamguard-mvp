# Lambda Deployment Guide - Firebase SMS

## Current Configuration ✅

### CDK Stack Updated
- **Environment Variables:**
  - `FIREBASE_API_KEY`: BJ7nqu0Hg7XuR-6riO06tCfzy7JjSpmmjqhjHEgzeGv1Elryv_Gqg6z_1EMQuW0wtQPRMlOE7bBR4JYeXiVCt_k
  - `FIREBASE_PROJECT_ID`: scamguard-c3e04

### Lambda Routing
- SMS OTP endpoints routed to `sms_otp_handler.lambda_handler`
- Path: `/api/v1/auth/request-sms-otp` → Request OTP
- Path: `/api/v1/auth/verify-sms-otp` → Verify OTP

### Dependencies
✅ All Python dependencies included:
- boto3
- requests (for Firebase HTTP calls)
- pyotp
- phonenumbers
- google-generativeai

## Deploy to AWS

### Option 1: Using CDK (Recommended)

**Prerequisites:**
```bash
# Configure AWS credentials
aws configure

# Install CDK dependencies
cd backend/cdk
npm install
pip install -r requirements.txt
```

**Deploy:**
```bash
cd /Users/echetoui/scamguard-mvp/backend/cdk

# View what will be deployed
npx cdk diff ScamGuardStack

# Deploy
npx cdk deploy ScamGuardStack --require-approval never
```

### Option 2: Using AWS Console

1. Go to **Lambda** → **Functions**
2. Find or create: `ScamGuardStack-Handler...`
3. Go to **Configuration** → **Environment variables**
4. Add:
   ```
   FIREBASE_API_KEY = BJ7nqu0Hg7XuR-6riO06tCfzy7JjSpmmjqhjHEgzeGv1Elryv_Gqg6z_1EMQuW0wtQPRMlOE7bBR4JYeXiVCt_k
   FIREBASE_PROJECT_ID = scamguard-c3e04
   ```
5. Deploy code zip from `backend/lambda_deployment.zip`

## Test Lambda Deployment

### Get API Gateway URL
```bash
aws cloudformation describe-stacks \
  --stack-name ScamGuardStack \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text
```

### Test SMS OTP Request
```bash
# Replace with actual API Gateway URL
API_URL="https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod"

curl -X POST $API_URL/api/v1/auth/request-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14388313122"}'
```

### Expected Response
```json
{
  "data": {
    "message": "Code de vérification envoyé à +14388313122",
    "expires_in": 600,
    "phone_masked": "+14****3122"
  }
}
```

### Test SMS OTP Verification
```bash
curl -X POST $API_URL/api/v1/auth/verify-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14388313122","code":"123456"}'
```

## Troubleshooting

### "FIREBASE_API_KEY not set"
- Check Lambda environment variables are saved
- Verify CDK deployment completed successfully

### "SMS delivery failed"
- Ensure Firebase phone authentication is enabled
- Add test phone number to Firebase test list
- Check Firebase project has billing enabled

### "Cannot find module sms_otp_handler"
- Verify lambda_deployment.zip includes sms_otp_handler.py
- Check index.py is routing correctly
- Redeploy with: `cdk deploy --force`

## Monitoring

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/ScamGuardStack-Handler --follow
```

### Lambda Metrics
- Go to **CloudWatch** → **Metrics** → **Lambda**
- Monitor: Duration, Errors, Throttles

## Rollback

If something goes wrong:
```bash
# Destroy and redeploy
npx cdk destroy ScamGuardStack
npx cdk deploy ScamGuardStack --require-approval never
```

## Next Steps

1. ✅ CDK stack updated with Firebase env vars
2. ✅ index.py routing configured
3. 🟡 Deploy with: `cd backend/cdk && npx cdk deploy ScamGuardStack`
4. 🟡 Get API Gateway URL from CloudFormation outputs
5. 🟡 Test SMS OTP endpoints
