# GitHub Webhook Configuration - Live Settings

## Deployment Status
✅ **Deployment Complete** (2026-03-12)

### AWS Infrastructure
- **Webhook API Endpoint:** https://q83a9xbdxj.execute-api.us-east-1.amazonaws.com/prod/webhook/github
- **Lambda Function:** AgentsStack-GitHubTriggerLambda1FFB2E30-QShKp9BNdMWK
- **Data Table:** ScamGuardStack-DataTable447BC44E-1AY6QZXNSPP8
- **Webhook Secret:** Stored in AWS Secrets Manager (scamguard/github-webhook-secret)

---

## GitHub Webhook Configuration (REQUIRED)

Go to your repository's **Settings → Webhooks → Add webhook** and enter:

| Field | Value |
|-------|-------|
| **Payload URL** | `https://q83a9xbdxj.execute-api.us-east-1.amazonaws.com/prod/webhook/github` |
| **Content type** | `application/json` |
| **Secret** | `oV-cMwpK8Ee-R_IEx1wkPtqIRA92GNl8UaPW9QKV89k` |
| **Which events?** | ✅ Pull requests<br>✅ Issues |
| **Active** | ✅ Checked |

Then click **Add webhook**

---

## What Triggers UserResearcher

The webhook automatically invokes UserResearcher when:

### Pull Requests
- ✅ Label: `feature` or `enhancement`
- ✅ Title contains: "feature" or "enhancement"

### Issues
- ✅ Label: `feature request` or `enhancement`
- ✅ Title contains: "feature"

---

## Auto-Detected Focus Areas

UserResearcher categorizes research by focus:
- **authentication** - keywords: auth, login, otp, password, jwt
- **family** - keywords: family, family members, parents, guardian
- **tools** - keywords: tools, check, verify
- **security** - keywords: security, scam, threat, fraud
- **general** - everything else

---

## Test the Automation

### Step 1: Create Feature Branch
```bash
git checkout -b feature/test-webhook
git commit --allow-empty -m "Test: Trigger UserResearcher webhook"
git push origin feature/test-webhook
```

### Step 2: Create Pull Request on GitHub
1. Go to repository on GitHub
2. Create Pull Request from `feature/test-webhook` → `develop`
3. Add label: **feature**
4. Click **Create pull request**

### Step 3: Monitor Execution
```bash
# Watch GitHub trigger Lambda
aws logs tail /aws/lambda/AgentsStack-GitHubTriggerLambda1FFB2E30-QShKp9BNdMWK --follow

# You should see:
# ✅ GitHub webhook received
# ✅ Feature PR detected
# ✅ UserResearcher invoked
```

### Step 4: Verify in DynamoDB
```bash
# Check trigger was recorded
aws dynamodb scan \
  --table-name ScamGuardStack-DataTable447BC44E-1AY6QZXNSPP8 \
  --filter-expression "begins_with(pk, :pk)" \
  --expression-attribute-values '{":pk":{"S":"RESEARCH_TRIGGER"}}' \
  --max-items 5
```

Expected output: Item with `status: triggered` and your PR number

---

## Troubleshooting

### Webhook not triggering
1. Go to repo **Settings → Webhooks → Recent Deliveries**
2. Look for your event
3. If red ✗: Check "Response" tab for error message
4. Verify payload URL is exactly: `https://q83a9xbdxj.execute-api.us-east-1.amazonaws.com/prod/webhook/github`

### Wrong focus area detected
Edit `extract_focus_area()` in `backend/cdk/agents/github_trigger.py` to customize keywords

### Lambda not responding
- Check function permissions (should have invoke access to UserResearcherLambda)
- Verify environment variables: `GITHUB_WEBHOOK_SECRET`, `TABLE_NAME`, `RESEARCHER_FUNCTION`
- Check CloudWatch logs for errors

---

## Next: View Research Results

When UserResearcher completes (typically 30-60 seconds):

```bash
# List all research findings
aws dynamodb query \
  --table-name ScamGuardStack-DataTable447BC44E-1AY6QZXNSPP8 \
  --key-condition-expression "begins_with(pk, :pk)" \
  --expression-attribute-values '{":pk":{"S":"RESEARCH#"}}' \
  --scan-index-forward false \
  --limit 10
```

Results will include:
- Pain points (ranked by frequency/severity)
- User segments affected
- Jobs-to-be-Done insights
- Product recommendations
- Research gaps to investigate

---

## Workflow Status

✅ **Phase 1:** GitHub automation deployed
⏳ **Phase 2:** Configure GitHub webhook (DO THIS NEXT)
⏳ **Phase 3:** Test with feature PR
⏳ **Phase 4:** View research results
⏳ **Phase 5:** Integrate findings into development cycle

