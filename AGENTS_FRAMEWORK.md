# ScamGuard MVP - Agent Orchestration Framework

## Architecture Overview

Two specialized agent units orchestrated via **AWS Step Functions**:

### Unit 1: Project Unit (The Factory) 🏭
**Mission:** Transform backlog into production-ready code (Zero Errors)

```
Feature Spec → [@ProjectOwner] → [@Architect] → [@Developer] → [@QA_Engineer] → Production
                  ✓ Validation      ✓ Design      ✓ Coding    ✓ Testing
```

### Unit 2: Product Unit (The Shield) 🛡️
**Mission:** Detect fraud and protect Quebec families

```
Scam Report → [@Triage_Agent] → [@Threat_Analyst] → [@Critic_Agent] → [@Family_Notifier] → Alert
              ✓ Anonymize      ✓ Score Threat     ✓ Reduce FP      ✓ Notify Family
```

---

## Agent Roles & Responsibilities

### PROJECT UNIT

#### 1. @ProjectOwner
**Role:** Feature validation and market compliance

- **Input:** Feature specification `{title, description}`
- **Process:**
  - Validate Quebec market relevance (seniors 65+)
  - Check compliance: Loi 25, WCAG 2.1 AA, PIPEDA
  - Define requirements
- **Output:** `{approved: bool, requirements: dict, risk_factors: list}`
- **Approval Criteria:** All compliance checks + Quebec focus
- **Lambda:** `backend/agents/project_owner.py`

#### 2. @Architect
**Role:** Infrastructure and data schema design

- **Input:** Feature spec + requirements from PO
- **Process:**
  - Design DynamoDB schema (PK, SK, GSI)
  - Plan Lambda architecture
  - Define API endpoints
  - Map data flow
- **Output:** `{design: dict, schema: dict, api_endpoints: list}`
- **Schema Template:** `USER#{user_id}` + `FEATURE#{name}#{timestamp}`
- **Lambda:** `backend/agents/architect.py`

#### 3. @Developer
**Role:** Production code implementation

- **Input:** Architecture + feature spec
- **Process:**
  - Generate Python Lambda code
  - Include error handling (try/catch)
  - Add CloudWatch logging
  - Implement security (Cognito, rate limiting)
- **Output:** `{code: str, file_structure: dict, testing_strategy: list}`
- **Code Quality:** >85/100 score required
- **Lambda:** `backend/agents/developer.py`

#### 4. @QA_Engineer
**Role:** Testing and security validation

- **Input:** Generated code
- **Process:**
  - Run unit tests (pytest)
  - Run E2E tests (Playwright)
  - Security scan (OWASP)
  - Accessibility audit (WCAG)
  - Performance benchmarks
- **Output:** `{passed: bool, test_results: dict, security_issues: list}`
- **Approval:** All tests passing + 0 critical security issues
- **Lambda:** `backend/agents/qa_engineer.py`

---

### PRODUCT UNIT

#### 1. @Triage_Agent
**Role:** Data cleaning and anonymization (Loi 25 compliant)

- **Input:** Raw scam report `{description, amount, platform, user_id}`
- **Process:**
  - Remove PII (phone, email, SIN, postal code)
  - Normalize data formats
  - Hash user identifier
  - Flag suspicious patterns
- **Output:** `{cleaned_data: dict, anonymization_level: str, warnings: list}`
- **Compliance:** 100% Loi 25 compliant
- **Lambda:** `backend/agents/triage_agent.py`

**PII Patterns Detected:**
- Phone: `\+?1?\s*\(?([0-9]{3})`
- Email: `[a-zA-Z0-9._%+-]+@...`
- SIN: `\d{3}-\d{3}-\d{3}`
- Credit Card: `\d{4}-\d{4}-\d{4}-\d{4}`
- Postal Code: `[A-Z]\d[A-Z]\s*\d[A-Z]\d`

#### 2. @Threat_Analyst
**Role:** Risk scoring and threat intelligence comparison

- **Input:** Cleaned data from Triage
- **Process:**
  - Calculate threat score (0-100)
  - Weight by scam type (phishing=85, fraud=80, etc.)
  - Cross-check against SQ/AMF databases
  - Identify known patterns
  - Flag emerging threats
- **Output:** `{threat_score: int, risk_level: str, risk_factors: list}`
- **Risk Levels:**
  - CRITICAL: 80-100
  - HIGH: 60-79
  - MODERATE: 40-59
  - LOW: 0-39
- **Lambda:** `backend/agents/threat_analyst.py`

#### 3. @Critic_Agent
**Role:** False positive reduction and logic audit

- **Input:** Threat score + risk factors from Analyst
- **Process:**
  - Validate scoring logic
  - Check for conflicting evidence
  - Compare against historical patterns
  - Calculate false positive likelihood
- **Output:** `{is_valid_threat: bool, threat_summary: dict, confidence: float}`
- **False Positive Threshold:** <15% likelihood required
- **Audit Trail:** All validation checks logged
- **Lambda:** `backend/agents/critic_agent.py`

#### 4. @Family_Notifier
**Role:** Alert management to family protectors

- **Input:** Validated threat from Critic
- **Process:**
  - Identify family members (protectors)
  - Generate alert message
  - Send via SMS/EMAIL/APP
  - Log delivery status
  - Create action dashboard link
- **Output:** `{notification_count: int, delivery_status: dict, action_url: str}`
- **Channels:** SMS (Pinpoint), EMAIL (SES), APP (Push)
- **Throttling:** 1 alert/hour per user (burst: 3)
- **Lambda:** `backend/agents/family_notifier.py`

---

## Workflow Execution

### Project Unit Workflow

**State Machine:** `scamguard-project-unit-workflow`
**Duration:** ~15 minutes
**Trigger:** API call via orchestrator

```bash
POST /orchestrate/project
{
  "feature_spec": {
    "title": "Phase 5B - Scam Reporting System",
    "description": "Image-based scam detection with threat creation"
  }
}
```

**Response:**
```json
{
  "workflow_id": "550e8400-e29b-41d4-a716-446655440000",
  "execution_arn": "arn:aws:states:us-east-1:...",
  "status": "RUNNING",
  "estimated_duration_minutes": 15
}
```

### Product Unit Workflow

**State Machine:** `scamguard-product-unit-workflow`
**Duration:** ~30 seconds
**Trigger:** User submits scam report via frontend

```bash
POST /orchestrate/product
{
  "scam_report": {
    "scam_type": "PHISHING",
    "description": "[PHONE_REDACTED] claiming to be from bank",
    "amount": 5000,
    "platform": "PHONE",
    "image_hash": "abc123def456"
  },
  "user_id": "USER#12345",
  "family_members": ["FAMILY#67890", "FAMILY#11111"]
}
```

**Response:**
```json
{
  "workflow_id": "660e8400-e29b-41d4-a716-446655440111",
  "execution_arn": "arn:aws:states:us-east-1:...",
  "status": "RUNNING",
  "estimated_duration_seconds": 30
}
```

---

## Data Flow & Storage

### DynamoDB Schema

All agent workflows use unified DynamoDB schema:

```
PK (Partition Key):  USER#{user_id} | WORKFLOW#{workflow_id}
SK (Sort Key):       FEATURE#{name}#{timestamp} | THREAT#{timestamp}

Attributes:
- workflow_id: Unique execution ID
- status: STARTED, RUNNING, COMPLETED, FAILED
- timestamp: ISO 8601 datetime
- data: JSON payload (agent-specific)
- execution_arn: Step Functions execution ARN
- TTL: 90 days (automatic cleanup)
```

### Audit Trail

Every workflow execution logged to `ScamGuardAudit-staging`:

```
{
  "PK": "USER#12345",
  "SK": "WORKFLOW#2026-03-06T14:30:00Z",
  "workflow_id": "...",
  "workflow_type": "PROJECT_UNIT" | "PRODUCT_UNIT",
  "status": "COMPLETED",
  "agents_executed": ["ProjectOwner", "Architect", "Developer", "QA"],
  "timestamp": "2026-03-06T14:30:00Z",
  "result": {...}
}
```

---

## Orchestrator Module

**File:** `backend/orchestrator.py`
**Class:** `AgentOrchestrator`

### API Endpoints (via Lambda + API Gateway)

```
POST /orchestrate/project
  Launch Project Unit workflow
  Returns: {workflow_id, execution_arn, status}

POST /orchestrate/product
  Launch Product Unit workflow
  Returns: {workflow_id, execution_arn, status}

GET /orchestrate/{execution_id}
  Get workflow status
  Returns: {status, start_date, stop_date, output, error}
```

### Python Usage

```python
from orchestrator import AgentOrchestrator

# Start project workflow
result = AgentOrchestrator.start_project_workflow({
    'title': 'Phase 5B',
    'description': 'Scam Reporting'
})

# Start product workflow
result = AgentOrchestrator.start_product_workflow(
    scam_report={...},
    user_id='USER#12345',
    family_members=['FAMILY#67890']
)

# Check status
status = AgentOrchestrator.get_workflow_status(
    execution_arn='arn:aws:states:...'
)
```

---

## Deployment

### CDK Deployment

```bash
cd backend/cdk

# Deploy both stacks
cdk deploy --require-approval never

# Or deploy agents stack only
cdk deploy ScamGuardAgentsStack
```

### CloudFormation Outputs

```
ProjectUnitWorkflowArn: arn:aws:states:us-east-1:...:stateMachine:scamguard-project-unit-workflow
ProductUnitWorkflowArn: arn:aws:states:us-east-1:...:stateMachine:scamguard-product-unit-workflow
OrchestratorLambdaArn: arn:aws:lambda:us-east-1:...:function:OrchestratorLambda
```

---

## Monitoring & Debugging

### CloudWatch Logs

All agent executions logged:
- Log Group: `/aws/lambda/ProjectOwnerLambda` (per agent)
- Retention: 7 days
- Tracing: X-Ray enabled (see service map)

### Step Functions Console

View workflow execution:
1. Go to AWS Step Functions console
2. Select state machine: `scamguard-project-unit-workflow` or `scamguard-product-unit-workflow`
3. Click execution
4. View input, output, execution history

### Metrics & Alarms

CloudWatch metrics:
- `AWS/States/ExecutionsStarted`
- `AWS/States/ExecutionsFailed`
- `AWS/States/ExecutionTime` (p99)
- `AWS/Lambda/Duration` (per agent)
- `AWS/Lambda/Errors` (per agent)

---

## Error Handling

### Retry Logic

- ProjectOwner: 2 retries, 2s backoff
- Architect: No retry (timeout: 300s)
- Developer: No retry (timeout: 600s)
- QA Engineer: No retry
- Triage Agent: 1 retry, 1s backoff
- Threat Analyst: No retry (timeout: 60s)
- Critic Agent: No retry
- Family Notifier: No retry

### Failure Modes

| Agent | Failure | Impact |
|-------|---------|--------|
| ProjectOwner | Feature rejected | Stop workflow, log rejection |
| Architect | Design fails | Notify dev, manual review |
| Developer | Code gen fails | Notify dev, rollback |
| QA Engineer | Tests fail | Require fixes, retry |
| Triage | Data uncleanable | Manual review flag |
| Threat Analyst | Score calculation error | Default to HIGH risk |
| Critic | Logic audit fails | Escalate to human reviewer |
| Notifier | SMS/EMAIL fails | Retry via SQS DLQ |

---

## Next Steps

1. **Deploy agents stack** → `cdk deploy ScamGuardAgentsStack`
2. **Test Project Unit** → Create feature spec, trigger workflow
3. **Test Product Unit** → Submit scam report via app
4. **Monitor execution** → Check CloudWatch logs + Step Functions console
5. **Phase 5B** → Implement image analysis in agent pipeline

---

## References

- **Architecture:** AWS Step Functions + Lambda
- **State Machine Definition:** JSON (CloudFormation-compatible)
- **Audit & Compliance:** Loi 25 + PIPEDA
- **Data Residency:** Canada (Ontario)
- **Encryption:** AES-256 at rest, TLS in transit
