# GitHub Automation Setup
**Auto-trigger UserResearcher on Feature PRs**

---

## How It Works

```
GitHub PR Created with "feature" label
        ↓
GitHub Webhook (Event)
        ↓
API Gateway Endpoint
        ↓
Lambda: github_trigger
        ↓
Verify Signature + Parse PR
        ↓
Is Feature PR? (labels/title)
        ↓ YES
Invoke UserResearcher (Async)
        ↓
Store Trigger Info (DynamoDB)
        ↓
✅ Done - Researcher analyzing in background
```

---

## Setup Instructions

### Step 1: Deploy Lambda Function

The `github_trigger.py` function is already created. Now deploy it:

```bash
cd backend/cdk

# Update stacks to include API Gateway + github_trigger Lambda
npx cdk deploy ScamGuardStack --require-approval never
```

### Step 2: Get API Gateway URL

```bash
aws cloudformation describe-stacks \
  --stack-name ScamGuardStack \
  --query 'Stacks[0].Outputs[?OutputKey==`WebhookEndpoint`].OutputValue' \
  --output text
```

Example output:
```
https://xyz123.execute-api.us-east-1.amazonaws.com/prod/webhook/github
```

### Step 3: Configure GitHub Webhook

1. Go to your repository settings
2. Click **Webhooks** → **Add webhook**
3. Fill in:
   - **Payload URL:** `https://xyz123.execute-api.us-east-1.amazonaws.com/prod/webhook/github`
   - **Content type:** `application/json`
   - **Secret:** Generate a strong secret (store in AWS Secrets Manager)
   - **Events:** Select:
     - ✅ Pull requests
     - ✅ Issues
   - **Active:** ✅ Checked

### Step 4: Store GitHub Secret in AWS

```bash
aws secretsmanager create-secret \
  --name scamguard/github-webhook-secret \
  --secret-string "your-webhook-secret-here"

# Update Lambda environment variable
aws lambda update-function-configuration \
  --function-name GitHubTriggerLambda \
  --environment Variables={GITHUB_WEBHOOK_SECRET=your-webhook-secret-here}
```

---

## What Happens Automatically

### When Feature PR is Opened

```
1. ✅ GitHub sends webhook event
2. ✅ Lambda verifies signature
3. ✅ Lambda detects "feature" label/title
4. ✅ Invokes UserResearcher asynchronously
5. ✅ Stores trigger info in DynamoDB

Result: PR author gets notified that research is running
```

### Feature Detection

Auto-triggers UserResearcher when:
- ✅ Label: `feature` or `enhancement`
- ✅ Title contains: "feature", "enhancement"
- ✅ Issue type: "Feature request"

### Focus Area Detection

Automatically categorizes:
- **authentication** → "auth", "login", "otp"
- **family** → "family", "family members"
- **tools** → "tools", "check", "verify"
- **security** → "security", "scam", "threat"
- **general** → everything else

---

## Example Workflow

### Day 1: Developer creates Feature PR
```
Title: "Feature: Improve SMS OTP UX for seniors"
Labels: feature, senior-friendly
Body: "Implement 300ms redirect, larger buttons..."

↓ Webhook fires
↓ github_trigger Lambda invoked
↓ UserResearcher triggered async
```

### Day 2: Research Complete
```
UserResearcher outputs:
{
  "pain_points": [
    {
      "type": "usability",
      "description": "Code entry too slow",
      "frequency": 8,
      "severity": "high"
    }
  ],
  "recommendations": [
    "Add auto-verify after 6 digits",
    "Increase button size for seniors"
  ]
}

Research stored in DynamoDB
Can be viewed in dashboard
```

### Day 3+: Development
- Developer reads research findings
- Architect incorporates recommendations
- Engineer validates feasibility

---

## Monitoring

### Check Trigger Status

```bash
# List all research triggers
aws dynamodb query \
  --table-name ScamGuardData \
  --key-condition-expression "pk = :pk" \
  --expression-attribute-values '{":pk":{"S":"RESEARCH_TRIGGER#pr#123"}}'
```

### CloudWatch Logs

```bash
# Watch github_trigger logs
aws logs tail /aws/lambda/GitHubTriggerLambda --follow

# Watch UserResearcher logs
aws logs tail /aws/lambda/UserResearcherLambda --follow
```

### Lambda Metrics

```
CloudWatch → Metrics → Lambda
- Invocations (should see spike when PRs opened)
- Duration
- Errors
```

---

## Next: Engineer & Executive Automation

After UserResearcher is working, we can also auto-trigger:

### Engineer Auto-Trigger
```
Feature PR opened
  → UserResearcher runs
  → Engineer reviews spec (async)
  → Results posted to PR comment
```

### Executive Auto-Trigger
```
Feature merged to main
  → Executive creates summary
  → Slack notification sent
  → Business metrics tracked
```

---

## Troubleshooting

### Webhook not firing
- Check GitHub webhook delivery (Settings → Webhooks → Recent Deliveries)
- Verify payload URL is accessible
- Check HTTP status codes (should be 200)

### UserResearcher not triggered
- Check Lambda permissions (needs to invoke UserResearcherLambda)
- Verify GITHUB_WEBHOOK_SECRET is set correctly
- Check CloudWatch logs for signature verification failures

### Wrong focus area detected
- Customize focus area detection in `extract_focus_area()`
- Add more keywords for your use case

---

## Costs

- **API Gateway:** ~$0.35/million calls
- **Lambda invocations:** ~$0.20 per 1M invocations
- **DynamoDB:** Write 1 item per trigger (~$0.001 per trigger)

**Total:** <$1/month for typical usage

---

## Security

✅ GitHub signature verification enabled
✅ Webhook secret stored in AWS Secrets Manager
✅ Lambda has minimal IAM permissions
✅ DynamoDB items have TTL (90 days auto-delete)

---

## Demo

### Test Webhook Locally

```bash
# Create test payload
PAYLOAD='{
  "action": "opened",
  "pull_request": {
    "number": 999,
    "title": "Feature: Improve SMS OTP UX",
    "body": "Add research insights...",
    "labels": [{"name": "feature"}],
    "html_url": "https://github.com/...",
    "user": {"login": "developer"},
    "head": {"ref": "feature/sms-otp-ux"}
  },
  "repository": {
    "full_name": "myorg/scamguard"
  }
}'

# Invoke Lambda with test
aws lambda invoke \
  --function-name GitHubTriggerLambda \
  --payload "$PAYLOAD" \
  response.json
```

---

## Status

- ✅ github_trigger.py created
- ⏳ Lambda deployment pending
- ⏳ API Gateway setup pending
- ⏳ GitHub webhook configuration pending

**Next:** Deploy updated CDK stack with API Gateway + Lambda
