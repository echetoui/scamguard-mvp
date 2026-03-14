# DynamoDB Schema - Phase 2 Sprint 5

## Overview

Three DynamoDB tables support the Phase 2 Sprint 5 threats infrastructure:
1. **threats** - Real threat data from SQ/CAFC
2. **user_threats** - User-threat matching and notifications
3. **threat_scenarios** - Quiz training scenarios

---

## 1. Threats Table

Stores threat objects from Sûreté du Québec (SQ) and Canadian Anti-Fraud Centre (CAFC).

### Primary Key
- **PK (Partition Key):** `threat_id` (String)
  - Format: `SQ-2026-001` or `CAFC-2026-001`
- **SK (Sort Key):** `date_detected` (ISO 8601 timestamp)

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| threat_id | String | ✓ | Unique threat identifier |
| date_detected | String | ✓ | ISO 8601 timestamp |
| type | String | ✓ | SMS \| Email \| Call \| Phishing |
| institution | String | ✓ | Target institution (Desjardins, Hydro-Quebec, etc.) |
| threat_level | String | ✓ | high \| medium \| low |
| message | String | ✓ | Full SMS/email/call text |
| explanation_fr | String | ✓ | French explanation for users |
| keywords | StringSet | ✓ | Threat keywords for matching |
| regions | StringSet | ✓ | Quebec regions (Montreal, Quebec City, etc.) |
| source | String | ✓ | SQ \| CAFC \| internal |
| is_scam | Boolean | ✓ | True if scam, false if legitimate |
| threat_indicators | StringSet | ✓ | List of warning signs |
| ttl_timestamp | Number | ✓ | Unix timestamp (90 days from creation) |

### Indexes

**Global Secondary Index: threat_level_index**
- PK: `threat_level`
- SK: `date_detected`
- Use: Query threats by level (high/medium/low)

**Global Secondary Index: institution_index**
- PK: `institution`
- SK: `date_detected`
- Use: Query threats by target institution

### TTL Configuration
- Attribute: `ttl_timestamp`
- Purpose: Auto-delete threats after 90 days

### Example Item

```json
{
  "threat_id": "SQ-2026-001",
  "date_detected": "2026-03-14T10:00:00Z",
  "type": "SMS",
  "institution": "Desjardins",
  "threat_level": "high",
  "message": "Desjardins: Verify your account now...",
  "explanation_fr": "Les vraies banques ne demandent...",
  "keywords": ["verify", "account", "urgent"],
  "regions": ["Montreal", "Quebec City"],
  "source": "SQ",
  "is_scam": true,
  "threat_indicators": ["suspicious link", "urgency"],
  "ttl_timestamp": 1747000000
}
```

---

## 2. User Threats Table

Tracks which threats match each user's profile (institutions they use).

### Primary Key
- **PK (Partition Key):** `user_id` (String)
  - Cognito user ID (email or UUID)
- **SK (Sort Key):** `threat_id` (String)

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | String | ✓ | Cognito user identifier |
| threat_id | String | ✓ | Reference to threats table |
| matched_at | String | ✓ | ISO 8601 timestamp when matched |
| notification_sent | Boolean | ✓ | Whether user was notified |
| user_saw_notification | Boolean | ✓ | Whether user read notification |
| threat_level | String | ✓ | Cached threat level for quick filtering |
| institution | String | ✓ | Cached institution for quick filtering |

### Indexes

**Global Secondary Index: user_date_index**
- PK: `user_id`
- SK: `matched_at`
- Use: Get user's matched threats ordered by date

### Example Item

```json
{
  "user_id": "user-123@example.com",
  "threat_id": "SQ-2026-001",
  "matched_at": "2026-03-14T10:05:00Z",
  "notification_sent": true,
  "user_saw_notification": true,
  "threat_level": "high",
  "institution": "Desjardins"
}
```

---

## 3. Threat Scenarios Table

Stores SMS training scenarios for the quiz simulator.

### Primary Key
- **PK (Partition Key):** `scenario_id` (String)
  - Format: `banking-001`, `utility-001`, `other-001`
- **SK (Sort Key):** `version` (String)
  - Format: `v1`, `v2`, etc.

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| scenario_id | String | ✓ | Unique scenario identifier |
| version | String | ✓ | Scenario version |
| type | String | ✓ | SMS \| Email \| Call |
| institution | String | ✓ | Institution being impersonated |
| category | String | ✓ | banking \| utilities \| other |
| message | String | ✓ | The SMS/email message |
| is_scam | Boolean | ✓ | True if it's a scam |
| explanation_fr | String | ✓ | Why it's scam/legitimate |
| threat_indicators | StringSet | ✓ | Warning signs in message |
| difficulty | String | ✓ | easy \| medium \| hard |
| created_at | String | ✓ | ISO 8601 creation timestamp |

### Indexes

**Global Secondary Index: category_index**
- PK: `category`
- SK: `scenario_id`
- Use: Get all scenarios in a category

### Example Item

```json
{
  "scenario_id": "banking-001",
  "version": "v1",
  "type": "SMS",
  "institution": "Desjardins",
  "category": "banking",
  "message": "Desjardins: Verify your account...",
  "is_scam": true,
  "explanation_fr": "Banks never ask to verify via SMS links",
  "threat_indicators": ["fake link", "urgency"],
  "difficulty": "easy",
  "created_at": "2026-03-14T09:00:00Z"
}
```

---

## Deployment

### Using AWS CDK

```bash
# Deploy the stack
cd backend/cdk
cdk deploy ThreatsStack

# Verify tables were created
aws dynamodb list-tables --region us-east-1
```

### Manual AWS CLI

```bash
# Create threats table
aws dynamodb create-table \
  --table-name threats \
  --attribute-definitions \
    AttributeName=threat_id,AttributeType=S \
    AttributeName=date_detected,AttributeType=S \
  --key-schema \
    AttributeName=threat_id,KeyType=HASH \
    AttributeName=date_detected,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Similar for other tables...
```

---

## Querying Examples

### Get all threats from past 7 days
```python
import boto3
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('threats')

seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()

response = table.query(
    IndexName='date_detected_index',
    KeyConditionExpression='date_detected > :date',
    ExpressionAttributeValues={
        ':date': seven_days_ago
    }
)
```

### Get threats for specific institution
```python
response = table.query(
    IndexName='institution_index',
    KeyConditionExpression='institution = :inst',
    ExpressionAttributeValues={
        ':inst': 'Desjardins'
    }
)
```

### Get all matched threats for user
```python
table = dynamodb.Table('user_threats')
response = table.query(
    IndexName='user_date_index',
    KeyConditionExpression='user_id = :uid',
    ExpressionAttributeValues={
        ':uid': 'user@example.com'
    },
    ScanIndexForward=False  # Most recent first
)
```

---

## Performance Considerations

1. **On-Demand Billing:** All tables use PAY_PER_REQUEST for predictable costs
2. **TTL:** Threats auto-delete after 90 days (configurable)
3. **Streams:** All tables have DynamoDB Streams enabled for real-time processing
4. **PITR:** Point-in-time recovery enabled for disaster recovery
5. **Indexes:** Multiple GSIs for flexible querying without table scans

---

## Security

- ✅ VPC Endpoint configured for private access
- ✅ IAM policies restrict Lambda function access
- ✅ Encryption at rest (AWS managed keys)
- ✅ PITR enabled for data recovery
- ✅ Access logging configured

---

**Last Updated:** March 14, 2026
**Version:** 1.0
**Status:** Ready for deployment
