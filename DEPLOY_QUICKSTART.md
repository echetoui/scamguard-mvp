# 🚀 ScamGuard AWS Deployment - Quick Start

Deploy ScamGuard to AWS Lambda in 5 minutes!

## Prerequisites

1. **AWS Account** - [Create one](https://aws.amazon.com/free/)
2. **AWS CLI** - `brew install awscli` (macOS) or [install guide](https://aws.amazon.com/cli/)
3. **SAM CLI** - `brew install aws-sam-cli` (macOS) or [install guide](https://docs.aws.amazon.com/serverless-application-model/)
4. **Docker** - [Download](https://www.docker.com/products/docker-desktop)
5. **API Keys**:
   - OpenAI: https://platform.openai.com/api-keys
   - Google Gemini: https://aistudio.google.com/app/apikey

## Quick Deploy (3 Commands)

```bash
# 1. Configure AWS credentials
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)

# 2. Run deployment script
chmod +x deploy.sh
./deploy.sh

# 3. Follow prompts to enter:
#    - Environment: dev (or staging/prod)
#    - OpenAI API Key
#    - Gemini API Key
```

That's it! ✅

## What Gets Deployed

```
AWS Deployment Architecture:
├── Lambda Functions (1536 MB, 60s timeout)
│   ├── scamguard-handler-dev (Main API)
│   └── scamguard-auth-dev (Authentication)
├── Cognito User Pool (Email-only auth)
├── DynamoDB Tables (25 RCU/WCU)
│   ├── ScamGuardData (User sessions, profiles)
│   └── ScamGuardAudit (Compliance logs, 90-day TTL)
├── API Gateway (REST API v1)
├── CloudWatch Logs (14-day retention)
├── CloudWatch Alarms (Compliance violations, errors)
├── X-Ray (Distributed tracing)
└── Secrets Manager (API keys)
```

## Test Your Deployment

```bash
# Get API endpoint
API=$(aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

echo "API Endpoint: $API"

# Test API
curl -X GET "${API}api/v1/health"
# Expected: 200 OK or your API response
```

## View Logs

```bash
# Live logs
sam logs -n scamguard-handler-dev --stack-name scamguard-mvp --tail

# Or in CloudWatch Console
# https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:
```

## Monitor Compliance

```bash
# View X-Ray service map
# https://console.aws.amazon.com/xray/home?region=us-east-1#/service-map

# Compliance annotations:
# - analysis_compliant: true/false
# - operation_blocked: true (when user fails compliance)
# - audit_logged: true
```

## Costs

| Monthly | Estimate |
|---------|----------|
| Lambda | ~$45 |
| DynamoDB | ~$25 |
| API Gateway | ~$3.50 |
| CloudWatch Logs | ~$50 |
| **Total** | **~$124** |

💡 **Tip**: Use `--parameter-overrides "DynamoDBBillingMode=PAY_PER_REQUEST"` for variable traffic

## Troubleshooting

### SAM Build Fails
```bash
cd backend
pip install -r requirements.txt
cd ..
./deploy.sh
```

### AWS Credentials Not Found
```bash
aws configure
# Fill in: Access Key ID, Secret Access Key, Default region, Default format
```

### Lambda Timeout (45-55s for vision analysis)
```bash
# Increase timeout to 90s in template.yaml:
# Timeout: 90
./deploy.sh
```

### DynamoDB Throttling
```bash
# Increase capacity:
aws dynamodb update-table \
  --table-name ScamGuardData-dev \
  --provisioned-throughput ReadCapacityUnits=50,WriteCapacityUnits=50
```

## Next Steps

1. ✅ Deploy (you are here)
2. Create test users in Cognito
3. Test all API endpoints
4. Run load tests: `pytest backend/tests/load_test.py`
5. Deploy to staging for integration testing
6. Deploy to production

## Documentation

- **Full Guide**: See `backend/AWS_DEPLOYMENT.md`
- **Architecture**: See `architecture.md`
- **API Design**: See `backend/API_DESIGN.md`
- **Compliance**: See `backend/COMPLIANCE.md`

## Cleanup (Delete Everything)

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name scamguard-mvp
aws cloudformation wait stack-delete-complete --stack-name scamguard-mvp

# Delete S3 artifacts
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws s3 rm s3://scamguard-deployment-artifacts-${ACCOUNT_ID} --recursive

# Delete Secrets Manager
aws secretsmanager delete-secret --secret-id scamguard/openai-key --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id scamguard/gemini-key --force-delete-without-recovery
```

---

**Questions?** Check `backend/AWS_DEPLOYMENT.md` for detailed troubleshooting and advanced configuration.

**Ready?** Run: `./deploy.sh` 🚀
