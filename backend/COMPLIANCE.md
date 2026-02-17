# ScamGuard FDP Platform Compliance Integration

## Overview

ScamGuard implements FDP (Federated Data Platform) compliance patterns to ensure adherence to GDPR, data protection regulations, and security best practices. All AI agents are wrapped with compliance validators, audit loggers, and data handling checks.

## Architecture

### Compliance Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Lambda Handlers                       │
├─────────────────────────────────────────────────────────┤
│  POST /scenarios │ POST /analysis │ GET /profile │ ... │
├─────────────────────────────────────────────────────────┤
│            Compliance-Wrapped AI Agents                  │
│  • ScenarioAgentWithCompliance                          │
│  • DetectionAgentWithCompliance                         │
│  • CoachingAgentWithCompliance                          │
│  • AnalyticsAgentWithCompliance                         │
├─────────────────────────────────────────────────────────┤
│              Compliance Module                           │
│  ┌──────────────┬──────────────────┬──────────────────┐ │
│  │ Validator    │ Rules            │ AuditLogger      │ │
│  │ • validate_  │ • 11 compliance  │ • log_action()   │ │
│  │   user()     │   rules          │ • log_data_      │ │
│  │ • validate_  │ • 4 critical     │   access()       │ │
│  │   operation()│ • 2 GDPR rules   │ • log_security_  │ │
│  │ • validate_  │                  │   event()        │ │
│  │   data_      │                  │ • get_audit_     │ │
│  │   handling() │                  │   trail()        │ │
│  └──────────────┴──────────────────┴──────────────────┘ │
├─────────────────────────────────────────────────────────┤
│              AWS Infrastructure                          │
│  • DynamoDB ScamGuardAudit (TTL: 90 days)              │
│  • AWS X-Ray (Compliance annotations)                   │
│  • Cognito (Identity verification)                      │
└─────────────────────────────────────────────────────────┘
```

## Compliance Rules

### 11 Core Rules

| Code | Level | Category | Check | Remediation |
|------|-------|----------|-------|-------------|
| `IDENTITY_VERIFIED` | 🔴 CRITICAL | Authentication | `email_verified == True` | Send email verification |
| `AGE_CONSENT` | 🔴 CRITICAL | Legal | `age_verified && terms_accepted` | Request age + terms |
| `DATA_CONSENT` | 🟠 ERROR | Privacy | `data_consent == True` | Show privacy policy |
| `MFA_AVAILABLE` | 🟡 WARNING | Security | `mfa_enabled or can_enable_mfa` | Offer MFA setup |
| `DATA_MINIMIZATION` | 🟡 WARNING | Privacy | `field_count <= 50` | Remove unused fields |
| `DATA_RETENTION` | 🟠 ERROR | Privacy | `has ttl or retention_days` | Set TTL on data |
| `ENCRYPTION` | 🔴 CRITICAL | Security | `encrypted == True` | Enable encryption |
| `AUDIT_LOGGING` | 🟠 ERROR | Audit | `has timestamp && user_id` | Log all actions |
| `GDPR_DELETE` | 🔴 CRITICAL | Privacy | `supports_deletion == True` | Implement delete endpoint |
| `GDPR_EXPORT` | 🔴 CRITICAL | Privacy | `supports_export == True` | Implement export endpoint |
| `RATE_LIMITING` | 🟠 ERROR | Security | `rate_limit_per_user != null` | Set 10 req/user/day limit |

## Compliance Validator

### Validation Flows

#### 1. User Validation
```python
from compliance.validator import ComplianceValidator

validator = ComplianceValidator()

# Validate user data from Cognito
user = {
    "user_id": "user123",
    "email_verified": True,
    "age_verified": True,
    "terms_accepted": True,
    "data_consent": True,
    "mfa_enabled": True,
}

is_compliant, issues = validator.validate_user(user)
# Returns: (True, [])  if all rules pass
#          (False, [...issues...]) if critical rules fail
```

#### 2. Operation Validation
```python
# Block non-compliant users from operations
is_allowed, issues = validator.validate_operation(
    operation="analyze_image",
    user_id="user123",
    data={"image_url": "https://..."}
)

if not is_allowed:
    # Compliance check failed - block operation
    return {"error": "Compliance check failed", "issues": issues}
```

#### 3. Data Handling Validation
```python
# Ensure sensitive data meets compliance
data = {
    "user_id": "user123",
    "timestamp": "2026-02-16T10:00:00",
    "encrypted": True,  # REQUIRED for sensitive data
    "ttl": 604800,      # REQUIRED (in seconds, e.g., 7 days)
    "analysis_result": {...}
}

is_compliant, issues = validator.validate_data_handling(data)
# Checks for:
# - Encryption on sensitive fields
# - TTL/retention policy present
# - Audit fields (timestamp, user_id)
```

## Audit Logger

### Action Logging

```python
from compliance.audit_logger import AuditLogger

logger = AuditLogger()

# Log user action
logger.log_action(
    user_id="user123",
    action="analyze_image",
    resource="image",
    status="success",
    details={
        "risk_level": "high",
        "confidence": 0.95,
        "image_size": "2.5MB"
    }
)
```

### Data Access Logging (GDPR)

```python
# Log data access for GDPR right to access
logger.log_data_access(
    user_id="user123",
    data_type="user_data",
    operation="read",
    data_count=1
)

# Log GDPR right to be forgotten
logger.log_data_access(
    user_id="user123",
    data_type="user_data",
    operation="delete",
    data_count=50
)
```

### Security Event Logging

```python
# Log security incidents
logger.log_security_event(
    user_id="user123",
    event_type="failed_login",
    severity="high",
    description="5 failed login attempts in 1 minute"
)
```

### Audit Trail Retrieval

```python
# Get user's complete audit history
trail = logger.get_user_audit_trail(user_id="user123", days=30)

# Generate compliance report
report = logger.get_compliance_report(days=30)
# Returns: {
#   "total_actions": 1250,
#   "actions_by_type": {...},
#   "actions_by_status": {...},
#   "security_events": [...],
#   "data_access_events": [...],
#   "period_days": 30,
#   "generated_at": "2026-02-16T10:00:00"
# }
```

## Compliance-Wrapped Agents

All four AI agents are wrapped with compliance checks. They follow a consistent pattern:

### Pattern: Agent with Compliance

```python
class AgentWithCompliance(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.validator = ComplianceValidator()
        self.audit_logger = AuditLogger()

    def method_compliant(self, ...args, user_id=None):
        # 1. Check user compliance before operation
        is_compliant, issues = self.validator.validate_operation(
            operation="method_name",
            user_id=user_id,
            data={...}
        )

        if not is_compliant:
            self.audit_logger.log_action(...status="blocked"...)
            return {"error": "Compliance check failed", "issues": issues}

        # 2. Run base operation
        result = self.method(...args, user_id)

        # 3. Validate result data compliance
        is_data_compliant, data_issues = self.validator.validate_data_handling(result)

        # 4. Audit log the action
        self.audit_logger.log_action(...status="success"...)

        # 5. Add compliance metadata
        result["compliance"] = {
            "compliant": is_data_compliant,
            "issues": data_issues,
        }

        return result
```

### Agent Methods

#### ScenarioAgentWithCompliance
```python
# Generate learning scenarios with compliance
scenario = scenario_agent.generate_compliant(
    difficulty="medium",
    user_id="user123"
)
# Returns: {
#   "id": "scenario_123",
#   "difficulty": "medium",
#   "scenario": "...",
#   "indicators": [...],
#   "tactics": [...],
#   "compliance": {
#     "compliant": True,
#     "issues": []
#   }
# }
```

#### DetectionAgentWithCompliance
```python
# Analyze images/messages with compliance
result = detection_agent.analyze_image_compliant(
    image_url="https://...",
    message="Verify your account",
    user_id="user123"
)
# Returns: {
#   "risk_level": "high",
#   "confidence": 0.95,
#   "indicators": [...],
#   "explanation": "...",
#   "red_flags": [...],
#   "compliance": {
#     "compliant": True,
#     "issues": []
#   }
# }
```

#### CoachingAgentWithCompliance
```python
# Generate coaching with compliance
coaching = coaching_agent.generate_coaching_compliant(
    risk_level="high",
    indicators=["urgency", "authority"],
    explanation="...",
    user_id="user123"
)
# Returns: {
#   "advice": [...],
#   "do_not_do": [...],
#   "real_world_example": "...",
#   "safety_tips": [...],
#   "tone": "encouraging",
#   "compliance": {
#     "compliant": True,
#     "issues": []
#   }
# }
```

#### AnalyticsAgentWithCompliance
```python
# Get analytics with compliance checks
analytics = analytics_agent.get_user_analytics_compliant("user123")
# Returns: {
#   "user_id": "user123",
#   "total_scenarios": 10,
#   "total_analyses": 25,
#   "accuracy_score": 0.85,
#   "learning_streak": 3,
#   "compliance": {
#     "compliant": True,
#     "issues": []
#   }
# }

# Update analytics with compliance
analytics = analytics_agent.update_analytics_compliant(
    user_id="user123",
    analysis_result={"risk_level": "high"}
)
# Returns: {...updated analytics with compliance metadata...}
```

## Data Storage & Retention

### DynamoDB Tables

#### ScamGuardAudit
- **Purpose**: Store all audit logs for compliance
- **TTL**: 90 days (auto-delete old records)
- **Keys**:
  - PK: `AUDIT#{timestamp}`
  - SK: `USER#{user_id}#ACTION#{action}`
- **Attributes**:
  - `user_id`: User performing action
  - `action`: Type of action (analyze_image, generate_scenario, etc.)
  - `resource`: Resource affected (image, scenario, coaching, analytics)
  - `status`: success | failed | blocked
  - `timestamp`: ISO 8601 format
  - `details`: JSON-encoded details
  - `error`: Error message if failed
  - `ttl`: Unix timestamp for auto-deletion

#### ScamGuardData
- **Purpose**: Store user sessions, profiles, analytics
- **TTL**: Varies by record type (7 days for sessions, 90 days for analytics)
- **Encryption**: At-rest encryption enabled
- **Backup**: Daily snapshots to S3

## GDPR Compliance Features

### Right to Access
Users can request their personal data via:
```python
# Retrieve complete audit trail
audit_trail = audit_logger.get_user_audit_trail("user_id", days=365)

# Retrieve all user data
user_data = dynamodb.query(
    KeyConditionExpression="PK = :pk",
    ExpressionAttributeValues={":pk": f"USER#{user_id}"}
)
```

### Right to Erasure (Deletion)
```python
# Log deletion request
audit_logger.log_data_access(
    user_id="user123",
    data_type="user_data",
    operation="delete",
    data_count=50
)

# Implement deletion endpoint (Phase 5)
def delete_user_data(user_id):
    # Delete from DynamoDB
    # Delete from S3 (if any files)
    # Delete from Cognito
    pass
```

### Right to Portability (Export)
```python
# Log export request
audit_logger.log_data_access(
    user_id="user123",
    data_type="user_data",
    operation="export",
    data_count=50
)

# Implement export endpoint (Phase 5)
def export_user_data(user_id):
    # Gather all user data
    # Encrypt and sign export
    # Return downloadable JSON
    pass
```

## X-Ray Integration

Compliance events are tracked in AWS X-Ray:

```python
# Annotations added by compliance modules
xray_recorder.put_annotation("analysis_compliant", "true")
xray_recorder.put_annotation("compliance_failed_IDENTITY_VERIFIED", "true")
xray_recorder.put_annotation("operation_blocked", "true")
xray_recorder.put_annotation("audit_logged", "true")
```

Query compliance metrics:
```
Filter: annotation.analysis_compliant = "true" AND annotation.response.status >= 200
Groups: service_name, annotation.compliance_failed_*
```

## Configuration

### Environment Variables

```bash
# DynamoDB
export DYNAMODB_TABLE=ScamGuardData
export DYNAMODB_AUDIT_TABLE=ScamGuardAudit

# Compliance Rules
export COMPLIANCE_CRITICAL_ONLY=false  # Check all rules or just critical
export DATA_RETENTION_DAYS=7           # Default TTL for sessions

# Audit
export AUDIT_RETENTION_DAYS=90         # Audit log retention period
```

### Runtime Configuration

```python
# Custom compliance configuration
from compliance.validator import ComplianceValidator
from compliance.rules import ComplianceLevel

validator = ComplianceValidator()

# Get only critical rules
critical_rules = validator.rules.get_critical_rules()

# Get report of all rules
report = validator.get_compliance_report()
```

## Testing

### Run Compliance Tests

```bash
# All compliance tests
pytest backend/tests/test_compliance_*.py -v

# Specific test file
pytest backend/tests/test_compliance_validator.py -v

# With coverage
pytest backend/tests/test_compliance_*.py --cov=compliance --cov-report=html
```

### Test Files

- `test_compliance_rules.py` - Test 11 compliance rules
- `test_compliance_validator.py` - Test validator logic
- `test_audit_logger.py` - Test audit logging
- `test_agents_with_compliance.py` - Test wrapped agents

## Deployment Checklist

- [ ] DynamoDB table `ScamGuardAudit` created with TTL
- [ ] Cognito email verification enabled
- [ ] X-Ray service map enabled for compliance tracking
- [ ] IAM role allows PutItem on audit table
- [ ] Secrets Manager contains API keys
- [ ] CloudWatch alarms for compliance violations
- [ ] Audit log S3 backup enabled (Phase 5)
- [ ] GDPR delete/export endpoints implemented (Phase 5)

## Monitoring & Alerts

### CloudWatch Alarms

```python
# Alert on compliance violations
alarm: compliance_violations_high
metric: count of records with operation_blocked = true
threshold: > 5 in 5 minutes
action: SNS notification to security team

# Alert on audit logger failures
alarm: audit_logger_failures
metric: count of log_action returns False
threshold: > 10 in 5 minutes
action: SNS notification to DevOps
```

### Dashboard Metrics

```
Compliance Dashboard:
├─ Compliance Check Pass Rate (%)
├─ Operations Blocked (24h)
├─ Critical Issues Detected (24h)
├─ Audit Log Success Rate (%)
└─ Data Retention Violations (24h)

Security Dashboard:
├─ Failed Logins (24h)
├─ Rate Limit Violations (24h)
└─ Data Access Events (24h)
```

## References

- [FDP Platform Documentation](https://fdp.example.com/docs)
- [GDPR Article 6-10 (Lawful Basis)](https://gdpr-info.eu/)
- [AWS Data Protection Best Practices](https://aws.amazon.com/compliance/)
- [OWASP Data Protection Cheat Sheet](https://cheatsheetseries.owasp.org/)

## Future Enhancements (Phase 5)

- [ ] Implement GDPR right to erasure endpoint
- [ ] Implement GDPR right to portability endpoint
- [ ] Add data anonymization for analytics
- [ ] Implement consent withdrawal handling
- [ ] Add audit log archival to S3 Glacier
- [ ] Implement fine-grained access control (FGAC)
- [ ] Add compliance dashboard UI
- [ ] Implement automated compliance scanning
