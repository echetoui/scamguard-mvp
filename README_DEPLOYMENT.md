# 🚀 ScamGuard MVP - Deployment Guide

**ScamGuard** is a scam detection and awareness training platform specifically designed for elderly users (65+).

## Quick Start (3 Commands)

```bash
# 1. Navigate to project
cd /Users/echetoui/scamguard-mvp

# 2. Run interactive deployment
./START_DEPLOYMENT.sh

# 3. Choose option 1 to configure AWS
# Then choose option 3 to deploy
```

## What Is ScamGuard?

ScamGuard helps elderly users:
- 📚 **Learn** to identify scam indicators (urgency, authority, fear)
- 🔍 **Analyze** suspicious images and messages using AI
- 💡 **Get coached** with personalized security advice
- 📊 **Track** learning progress with analytics

**Key Features:**
- Vision analysis using GPT-4o-mini
- Scenario generation using Gemini 1.5 Flash
- Email verification with Cognito
- FDP Platform compliance patterns
- Elder-specific data protection
- Automatic data deletion (24h for images, 90d for audit logs)
- GDPR-compliant audit logging

## Architecture

```
📱 Frontend (User's Browser)
        ↓
🔐 API Gateway + Cognito Auth
        ↓
⚡ Lambda Functions (1536 MB, 60s timeout)
   ├─ scamguard-handler (API)
   └─ scamguard-auth (Authentication)
        ↓
💾 DynamoDB Tables (25 RCU/WCU)
   ├─ ScamGuardData (Sessions, profiles, analytics)
   └─ ScamGuardAudit (Compliance logs, 90-day TTL)
        ↓
🤖 AI APIs
   ├─ OpenAI GPT-4o-mini (Vision analysis)
   └─ Google Gemini 1.5 Flash (Scenario generation)
        ↓
📊 Monitoring
   ├─ CloudWatch Logs
   ├─ CloudWatch Alarms
   └─ X-Ray Distributed Tracing
```

## Deployment Options

### Option 1: Interactive Menu (Recommended)

```bash
./START_DEPLOYMENT.sh
```

Choose from menu:
1. Configure AWS credentials
2. View installation guide
3. Deploy to AWS
4. Test deployment
5. View deployment status
6. Cleanup

### Option 2: Step-by-Step (Manual)

```bash
# Configure credentials
aws configure

# Deploy
./deploy.sh
```

### Option 3: Detailed Control

See `backend/AWS_DEPLOYMENT.md` for complete SAM/CloudFormation control.

## Prerequisites

Install on macOS:
```bash
brew install awscli aws-sam-cli docker python3
```

You'll need:
- ✅ AWS Account (free tier eligible)
- ✅ Access Key ID & Secret Access Key
- ✅ OpenAI API Key (free trial available)
- ✅ Google Gemini API Key (free tier)

## File Structure

```
scamguard-mvp/
├── 📄 START_DEPLOYMENT.sh          ← Run this first!
├── 📄 CREDENTIALS_SETUP.sh         ← Configure AWS credentials
├── 📄 deploy.sh                    ← Main deployment script
├── 📄 DEPLOY_SETUP.md              ← AWS credentials guide
├── 📄 DEPLOY_QUICKSTART.md         ← Quick 3-command guide
├── 📄 README_DEPLOYMENT.md         ← This file
│
├── backend/
│   ├── 📄 template.yaml            ← CloudFormation IaC
│   ├── 📄 samconfig.toml           ← SAM configuration
│   ├── 📄 requirements.txt         ← Python dependencies
│   ├── 📄 AWS_DEPLOYMENT.md        ← Detailed AWS guide
│   ├── 📄 API_DESIGN.md            ← API v1 specification
│   ├── 📄 COMPLIANCE.md            ← FDP + Elder protection
│   │
│   ├── lambda/
│   │   ├── handler.py              ← Main API handler
│   │   ├── auth_handler.py         ← Authentication
│   │   ├── agents/                 ← AI agents (4 files)
│   │   ├── compliance/             ← FDP compliance (4 files)
│   │   └── utils/                  ← Helpers & utilities
│   │
│   └── tests/
│       ├── test_compliance_*.py    ← Compliance tests
│       ├── test_agents_*.py        ← Agent tests
│       ├── test_elder_protection.py ← Elder protection tests
│       ├── load_test.py            ← Load testing
│       └── test_auth_handler.py    ← Auth tests
│
└── .github/
    └── workflows/
        ├── test.yml               ← Run tests
        └── security.yml           ← Security scanning
```

## Costs

| Resource | Monthly Cost |
|----------|------------|
| Lambda | $45 |
| DynamoDB | $25 |
| API Gateway | $3.50 |
| CloudWatch Logs | $50 |
| Secrets Manager | $0.40 |
| **TOTAL** | **~$124** |

AWS Free Tier covers part of this for 12 months!

## Deployment Timeline

| Step | Duration |
|------|----------|
| Prerequisites | 5-10 min |
| Configure AWS | 5 min |
| Build & Deploy | 15-20 min |
| Test | 5 min |
| **Total** | **30-40 min** |

## After Deployment

### 1. Get Your API Endpoint

```bash
aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --query 'Stacks[0].Outputs' \
  --output table
```

### 2. Create Test User

```bash
# Get User Pool ID
POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

# Create user
aws cognito-idp admin-create-user \
  --user-pool-id $POOL_ID \
  --username test@example.com \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $POOL_ID \
  --username test@example.com \
  --password SecurePassword123!@# \
  --permanent

# Verify email
aws cognito-idp admin-update-user-attributes \
  --user-pool-id $POOL_ID \
  --username test@example.com \
  --user-attributes Name=email_verified,Value=true
```

### 3. View Logs

```bash
# Live logs
sam logs -n scamguard-handler-dev --stack-name scamguard-mvp --tail

# Or in console
# https://console.aws.amazon.com/cloudwatch/
```

### 4. Monitor

```
CloudWatch: https://console.aws.amazon.com/cloudwatch/
X-Ray: https://console.aws.amazon.com/xray/
API Gateway: https://console.aws.amazon.com/apigateway/
Lambda: https://console.aws.amazon.com/lambda/
DynamoDB: https://console.aws.amazon.com/dynamodb/
Cognito: https://console.aws.amazon.com/cognito/
```

## Project Status

```
✅ Phase 1: Core Agents & Handlers (7 commits)
✅ Phase 2: Modern API Design (1 commit)
✅ Phase 3: Email Verification & CI/CD (1 commit)
✅ Phase 4: FDP Compliance Integration (2 commits)
✅ Phase 4b: Elder Protection (1 commit)
✅ AWS Deployment: CloudFormation + SAM (1 commit)
✅ Interactive Deployment Scripts (1 commit)

Total: 14 commits, ~8,500 LOC
```

## Troubleshooting

### AWS Credentials Not Found
```bash
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)
```

### SAM Build Fails
```bash
cd backend
pip install -r requirements.txt
cd ..
./deploy.sh
```

### Lambda Timeout (45-55s)
This is normal for vision analysis. Increase timeout in `backend/template.yaml`:
```yaml
Timeout: 90  # instead of 60
```

### DynamoDB Throttling
Increase capacity:
```bash
aws dynamodb update-table \
  --table-name ScamGuardData-dev \
  --provisioned-throughput ReadCapacityUnits=50,WriteCapacityUnits=50
```

## Next Steps (Phase 5)

- [ ] GDPR right to delete endpoint
- [ ] GDPR right to export endpoint
- [ ] Family member notifications
- [ ] Compliance dashboard UI
- [ ] Async processing with SQS
- [ ] Multi-region deployment
- [ ] Custom domain (HTTPS)
- [ ] Load testing at scale

## Support

📚 **Documentation:**
- API Design: `backend/API_DESIGN.md`
- Compliance: `backend/COMPLIANCE.md`
- AWS Deployment: `backend/AWS_DEPLOYMENT.md`
- CI/CD Setup: `backend/CI_CD.md`

🔗 **External Resources:**
- AWS Lambda: https://docs.aws.amazon.com/lambda/
- SAM: https://docs.aws.amazon.com/serverless-application-model/
- Cognito: https://docs.aws.amazon.com/cognito/
- DynamoDB: https://docs.aws.amazon.com/dynamodb/

## Security Notes

- ✅ API keys stored in AWS Secrets Manager (encrypted)
- ✅ Cognito handles user authentication & authorization
- ✅ DynamoDB encryption at rest
- ✅ Lambda execution roles (least privilege)
- ✅ X-Ray tracing for debugging
- ✅ CloudWatch logs with retention policies
- ✅ Audit logging for compliance (90-day retention)
- ✅ Elder protection: Auto-delete images after 24h

## License

MIT License - See LICENSE file

---

**Ready to deploy?**

```bash
./START_DEPLOYMENT.sh
```

Let me know if you need help! 🚀
