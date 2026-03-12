# Deployment Quickstart - GitHub Automation

**Implement UserResearcher Auto-Trigger in 5 Minutes** ⚡

---

## Step 1: Deploy CDK Stack (2 min)

```bash
cd backend/cdk

# Deploy with GitHub automation included
npx cdk deploy ScamGuardStack AgentsStack --require-approval never
```

**Output:** You'll see CloudFormation outputs including:
```
WebhookEndpoint = https://xyz123.execute-api.us-east-1.amazonaws.com/prod/webhook/github
```

**Copy this URL** - you'll need it in Step 4

---

## Step 2: Store GitHub Secret (1 min)

```bash
# Generate a random secret
GITHUB_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
echo "Your webhook secret: $GITHUB_SECRET"

# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name scamguard/github-webhook-secret \
  --secret-string "$GITHUB_SECRET"

# Update Lambda environment
aws lambda update-function-configuration \
  --function-name GitHubTriggerLambda \
  --environment "Variables={GITHUB_WEBHOOK_SECRET=$GITHUB_SECRET}"
```

---

## Step 3: Get Webhook URL (30 sec)

```bash
# From CloudFormation outputs above, or:
aws cloudformation describe-stacks \
  --stack-name AgentsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`WebhookEndpoint`].OutputValue' \
  --output text
```

Example:
```
https://xyz123.execute-api.us-east-1.amazonaws.com/prod/webhook/github
```

---

## Step 4: Configure GitHub Webhook (1.5 min)

1. Go to your repo: **Settings → Webhooks → Add webhook**
2. Fill in:
   - **Payload URL:** Paste the URL from Step 3
   - **Content type:** `application/json`
   - **Secret:** Paste the secret from Step 2
   - **Which events?** Select:
     - ✅ Pull requests
     - ✅ Issues
3. **Active:** ✅ Checked
4. Click **Add webhook**

**Test:** GitHub will send a test event - should see green checkmark ✅

---

## Step 5: Test It! (30 sec)

Create a test PR:
```bash
git checkout -b feature/test-automation
git commit --allow-empty -m "Test: Trigger UserResearcher automation"
git push origin feature/test-automation
```

Then on GitHub:
1. Create Pull Request
2. Add label: **feature**
3. Open PR

**Watch the magic:**
```bash
# Monitor Lambda logs
aws logs tail /aws/lambda/GitHubTriggerLambda --follow

# You should see:
# ✅ GitHub webhook received
# ✅ Feature PR detected
# ✅ UserResearcher invoked (RequestId: ...)
```

---

## Verify It Worked

### Check DynamoDB

```bash
aws dynamodb query \
  --table-name ScamGuardData \
  --key-condition-expression "begins_with(pk, :pk)" \
  --expression-attribute-values '{":pk":{"S":"RESEARCH_TRIGGER"}}' \
  --max-items 5
```

You should see your trigger recorded with status: `triggered`

### Check Lambda Metrics

```bash
# CloudWatch → Metrics → Lambda
# Look for GitHubTriggerLambda invocations
```

---

## What Now Works Automatically

| Event | Trigger | Result |
|-------|---------|--------|
| PR opened with `feature` label | ✅ Auto | UserResearcher analyzes |
| Issue opened with `feature request` label | ✅ Auto | UserResearcher analyzes |
| PR title contains "feature" | ✅ Auto | UserResearcher analyzes |
| PR title contains "enhancement" | ✅ Auto | UserResearcher analyzes |
| Regular PR/issue (no feature label) | ❌ Ignored | Nothing happens |

---

## Next: See Research Results

UserResearcher runs async and stores results in DynamoDB.

To retrieve:
```bash
# List all research
aws dynamodb query \
  --table-name ScamGuardData \
  --key-condition-expression "begins_with(pk, :pk)" \
  --expression-attribute-values '{":pk":{"S":"RESEARCH#"}}' \
  --scan-index-forward false \
  --limit 10
```

Future: Add dashboard to visualize research findings!

---

## Troubleshooting

### Webhook shows red X (failed delivery)

1. Check API Gateway endpoint is accessible
2. Verify payload URL is correct
3. Check GitHub webhook logs (Settings → Webhooks → Recent Deliveries)
4. Look for error message

### Lambda not invoked

- Check CloudWatch logs for errors
- Verify IAM permissions (Lambda needs to invoke UserResearcher)
- Check Lambda execution role

### Wrong focus area detected

Edit `extract_focus_area()` in `github_trigger.py` to add more keywords

---

## Architecture Diagram

```
┌──────────────────┐
│  GitHub.com      │
│  (Feature PR)    │
└────────┬─────────┘
         │ webhook
         ↓
┌──────────────────┐
│  API Gateway     │
│  /webhook/github │
└────────┬─────────┘
         │ POST
         ↓
┌──────────────────┐         ┌──────────────────┐
│ GitHubTrigger    │────────→│ UserResearcher   │
│ Lambda           │ invoke  │ Lambda (Async)   │
└────────┬─────────┘         └────────┬─────────┘
         │ store                       │
         ↓                             ↓
┌──────────────────────────────────────────────┐
│ DynamoDB (ScamGuardData)                     │
│ - RESEARCH_TRIGGER records                   │
│ - RESEARCH# analysis results                 │
└──────────────────────────────────────────────┘
```

---

## Cost Estimate

- **API Gateway:** ~$0.35/1M calls
- **Lambda:** ~$0.20/1M invocations
- **DynamoDB:** ~$0.001 per write

**Total:** <$1/month for typical usage

---

## Timeline

✅ Agents implemented (3 agents)
✅ GitHub automation implemented
⏳ Deploy (2-3 min)
⏳ Configure webhook (1-2 min)
✅ Test
✅ Done!

**Total time to production:** ~10 minutes 🚀

---

## Success! 🎉

You now have:
- ✅ 11 agents (8 existing + 3 new)
- ✅ 2 workflows (Project + Product)
- ✅ Auto-triggering on GitHub events
- ✅ Research findings in database

Next features:
- [ ] Email notifications when research completes
- [ ] Post findings as PR comments
- [ ] Auto-trigger Engineer + Executive agents
- [ ] Dashboard showing all research
