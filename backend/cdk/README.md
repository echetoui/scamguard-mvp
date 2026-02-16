# ScamGuard CDK Infrastructure

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy
cdk deploy

# Destroy
cdk destroy
```

## Architecture

- API Gateway REST API
- Lambda (Python 3.12)
- DynamoDB (single table)
- Cognito User Pool
- S3 (uploads + frontend)
- CloudFront
- Secrets Manager
- CloudWatch Alarms
