# Quick Start: ScamGuard Agent Framework

## 5-Minute Setup

### 1. Deploy Agents Stack

```bash
cd backend/cdk

# Install dependencies
pip3 install aws-cdk-lib constructs boto3

# Deploy
cdk deploy ScamGuardAgentsStack --require-approval never
```

### 2. Get Workflow ARNs

```bash
aws cloudformation describe-stacks \
  --stack-name ScamGuardAgentsStack \
  --region us-east-1 \
  --query "Stacks[0].Outputs"
```

Copy these values to `backend/.env`:
```
PROJECT_UNIT_WORKFLOW_ARN=arn:aws:states:us-east-1:...
PRODUCT_UNIT_WORKFLOW_ARN=arn:aws:states:us-east-1:...
```

### 3. Test Project Unit Workflow

```bash
curl -X POST http://localhost:3000/orchestrate/project \
  -H "Content-Type: application/json" \
  -d '{
    "feature_spec": {
      "title": "Phase 5B - Scam Reporting System",
      "description": "Image-based scam detection with threat creation"
    }
  }'
```

Expected response:
```json
{
  "workflow_id": "550e8400-e29b-41d4-a716-446655440000",
  "execution_arn": "arn:aws:states:us-east-1:...",
  "status": "RUNNING"
}
```

### 4. Test Product Unit Workflow

```bash
curl -X POST http://localhost:3000/orchestrate/product \
  -H "Content-Type: application/json" \
  -d '{
    "scam_report": {
      "scam_type": "PHISHING",
      "description": "I received a call claiming to be from my bank",
      "amount": 5000,
      "platform": "PHONE",
      "image_hash": "abc123def456"
    },
    "user_id": "USER#12345",
    "family_members": ["FAMILY#67890", "FAMILY#11111"]
  }'
```

### 5. Monitor Execution

```bash
# View real-time logs
aws logs tail /aws/lambda/ProjectOwnerLambda --follow

# Check execution status
aws stepfunctions describe-execution \
  --execution-arn arn:aws:states:us-east-1:...:execution:feature-550e8400-... \
  --region us-east-1
```

---

## Local Testing (Without AWS)

### Run Agent Functions Directly

```bash
cd backend

# Test ProjectOwner agent
python agents/project_owner.py

# Test Architect agent
python agents/architect.py

# Test ThreatAnalyst agent
python agents/threat_analyst.py
```

### Run Orchestrator

```bash
python orchestrator.py
```

---

## Common Tasks

### Add New Feature to Project Unit

```
1. Define spec: title, description, requirements
2. POST /orchestrate/project
3. Monitor: CloudWatch logs + Step Functions console
4. Result: Code generated, tested, ready to merge
```

### Submit Scam Report (Product Unit)

```
1. User reports scam via app (mobile/web)
2. Frontend calls: POST /orchestrate/product
3. Pipeline: Triage → Analysis → Critic → Notify
4. Family receives alert within 30 seconds
5. Audit trail logged for compliance
```

### Deploy to Production

```bash
cd backend/cdk

# Validate
cdk synth

# Deploy
cdk deploy --require-approval never

# Verify
aws stepfunctions list-state-machines --region us-east-1 | grep scamguard
```

---

## Troubleshooting

### Workflow Stuck in RUNNING

```bash
# Check latest events
aws stepfunctions get-execution-history \
  --execution-arn arn:aws:states:... \
  --region us-east-1 | tail -20
```

### Lambda Agent Failed

```bash
# Check logs
aws logs tail /aws/lambda/ArchitectLambda --follow

# Check DynamoDB permissions
aws iam get-role-policy \
  --role-name ArchitectLambda-ExecutionRole \
  --policy-name DynamoDBAccess
```

### CloudWatch No Logs

```bash
# Verify log groups exist
aws logs describe-log-groups --region us-east-1 | grep scamguard

# Check X-Ray service map
# Go to: CloudWatch → X-Ray → Service Map
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `backend/agents/project_owner.py` | Feature validation agent |
| `backend/agents/architect.py` | Infrastructure design agent |
| `backend/agents/developer.py` | Code generation agent |
| `backend/agents/qa_engineer.py` | Testing & security agent |
| `backend/agents/triage_agent.py` | Data anonymization agent |
| `backend/agents/threat_analyst.py` | Threat scoring agent |
| `backend/agents/critic_agent.py` | False positive filter agent |
| `backend/agents/family_notifier.py` | Alert delivery agent |
| `backend/orchestrator.py` | Orchestration entry point |
| `backend/cdk/stacks/agents_stack.py` | CDK stack definition |
| `AGENTS_FRAMEWORK.md` | Complete documentation |

---

## Next Phase (Phase 5B)

1. Implement image analysis in Developer agent
2. Add LLM-powered scam pattern detection
3. Create feedback loop for model improvement
4. Scale family protection to 100+ users

See: `AGENTS_FRAMEWORK.md` → Error Handling → False Positive Handling
