# Threats API Documentation

## Overview

Phase 2 Sprint 5 provides a comprehensive REST API for managing SMS scam threats and training simulations. The API integrates real-world threat data from Sûreté du Québec (SQ) and Canadian Anti-Fraud Centre (CAFC).

**Base URL:** `https://your-api-gateway-url/dev/api`
**Content-Type:** `application/json`

---

## API Endpoints

### 1. List Threats

**GET** `/threats`

Retrieve a paginated list of all threats with optional filtering.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `threat_level` | string | No | Filter by threat level: `high`, `medium`, `low` |
| `institution` | string | No | Filter by institution name |
| `limit` | integer | No | Max results per page (default: 100) |
| `offset` | integer | No | Pagination offset (default: 0) |

#### Response

```json
{
  "threats": [
    {
      "threat_id": "SQ-2026-001",
      "date_detected": "2026-03-14T10:00:00Z",
      "type": "SMS",
      "institution": "Desjardins",
      "threat_level": "high",
      "message": "Desjardins: Verify your account now...",
      "explanation_fr": "Les vraies banques ne demandent...",
      "keywords": ["verify", "account"],
      "regions": ["Montreal", "Quebec City"],
      "is_scam": true,
      "threat_indicators": ["suspicious link", "urgency"],
      "source": "SQ"
    }
  ],
  "count": 10,
  "total": 245,
  "limit": 100,
  "offset": 0
}
```

#### Error Responses

- `400` - Bad request (invalid query parameters)
- `500` - Internal server error

#### Examples

```bash
# Get all threats
curl https://api.example.com/dev/api/threats

# Get high-threat level items
curl https://api.example.com/dev/api/threats?threat_level=high

# Get threats for specific institution
curl https://api.example.com/dev/api/threats?institution=Desjardins&limit=50

# Pagination
curl https://api.example.com/dev/api/threats?limit=10&offset=20
```

---

### 2. Get Threat Details

**GET** `/threats/{threat_id}`

Retrieve detailed information about a specific threat.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `threat_id` | string | Threat identifier (e.g., `SQ-2026-001`) |

#### Response

```json
{
  "threat": {
    "threat_id": "SQ-2026-001",
    "date_detected": "2026-03-14T10:00:00Z",
    "type": "SMS",
    "institution": "Desjardins",
    "threat_level": "high",
    "message": "Desjardins: Verify your account now. Click here: https://fake-link.com",
    "explanation_fr": "Ceci est une arnaque par hameçonnage. Les vraies banques ne demandent jamais de vérification via des liens SMS.",
    "keywords": ["verify", "account", "click"],
    "regions": ["Montreal", "Quebec City"],
    "is_scam": true,
    "threat_indicators": [
      "suspicious link (fake-link.com)",
      "urgency simulée",
      "demande de vérification"
    ],
    "source": "SQ",
    "ttl_timestamp": 1747000000
  }
}
```

#### Error Responses

- `404` - Threat not found
- `500` - Internal server error

#### Example

```bash
curl https://api.example.com/dev/api/threats/SQ-2026-001
```

---

### 3. Match User to Threats

**POST** `/threats/match`

Find threats that match a user's profile (institutions they use).

#### Request Body

```json
{
  "user_id": "user@example.com",
  "institutions": ["Desjardins", "TD Bank"],
  "regions": ["Montreal", "Quebec City"]
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | ✓ | User identifier (email or Cognito ID) |
| `institutions` | array | ✓ | List of institutions user has accounts with |
| `regions` | array | No | List of regions for filtering |

#### Response

```json
{
  "user_id": "user@example.com",
  "matched_threats": [
    {
      "threat_id": "SQ-2026-001",
      "institution": "Desjardins",
      "threat_level": "high",
      "message": "Desjardins: Verify your account...",
      "date_detected": "2026-03-14T10:00:00Z"
    },
    {
      "threat_id": "SQ-2026-002",
      "institution": "TD Bank",
      "threat_level": "medium",
      "message": "TD: Payment verification needed...",
      "date_detected": "2026-03-13T15:30:00Z"
    }
  ],
  "count": 2
}
```

#### Side Effects

- Creates entries in `user_threats` table
- Sets `notification_sent: false` (notifications sent separately)
- Caches threat level and institution for quick filtering

#### Error Responses

- `400` - Missing required parameters
- `500` - Internal server error

#### Example

```bash
curl -X POST https://api.example.com/dev/api/threats/match \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "marie@example.com",
    "institutions": ["Desjardins", "Hydro-Quebec"],
    "regions": ["Montreal"]
  }'
```

---

### 4. Get Weekly Digest Feed

**GET** `/threats/feed`

Retrieve threats from the past 7 days for the weekly digest email/notification.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | No | If provided, returns only user's matched threats |

#### Response

```json
{
  "threats": [
    {
      "threat_id": "SQ-2026-001",
      "institution": "Desjardins",
      "threat_level": "high",
      "type": "SMS",
      "message": "Desjardins: Verify your account...",
      "date_detected": "2026-03-14T10:00:00Z"
    }
  ],
  "total_count": 24,
  "statistics": {
    "by_level": {
      "high": 8,
      "medium": 10,
      "low": 6
    },
    "by_type": {
      "SMS": 18,
      "Email": 5,
      "Call": 1
    }
  },
  "period": "last_7_days"
}
```

#### Error Responses

- `500` - Internal server error

#### Examples

```bash
# Get all threats from past 7 days
curl https://api.example.com/dev/api/threats/feed

# Get user's matched threats from past 7 days
curl https://api.example.com/dev/api/threats/feed?user_id=marie@example.com
```

---

## Data Models

### Threat Object

```json
{
  "threat_id": "string",           // SQ-2026-001 or CAFC-2026-001
  "type": "string",                 // SMS | Email | Call | Phishing
  "institution": "string",          // Desjardins, TD, RBC, etc.
  "threat_level": "string",         // high | medium | low
  "message": "string",              // Full threat message text
  "explanation_fr": "string",       // French explanation for users
  "keywords": ["string"],           // Search/matching keywords
  "regions": ["string"],            // Quebec regions (Montreal, Quebec City)
  "date_detected": "string",        // ISO 8601 timestamp
  "is_scam": "boolean",            // True if scam, false if legitimate
  "threat_indicators": ["string"],  // Warning signs in message
  "source": "string",               // SQ | CAFC | internal
  "ttl_timestamp": "number"         // Unix timestamp for auto-deletion
}
```

### User Threat Match Object

```json
{
  "user_id": "string",              // User identifier
  "threat_id": "string",            // Reference to threat
  "matched_at": "string",           // ISO 8601 timestamp
  "notification_sent": "boolean",   // Whether user was notified
  "user_saw_notification": "boolean", // Whether user read it
  "threat_level": "string",         // Cached threat level
  "institution": "string"           // Cached institution
}
```

---

## Error Handling

All endpoints return error responses in the following format:

```json
{
  "error": "Descriptive error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid parameters) |
| 404 | Not found (threat doesn't exist) |
| 500 | Internal server error |

---

## Authentication

Include AWS IAM credentials or API key in request headers:

```bash
# Using AWS SigV4
aws configure

# Using API key (if configured)
curl -H "x-api-key: YOUR_API_KEY" https://api.example.com/dev/api/threats
```

---

## Rate Limiting

- Default: 5 requests per minute per IP address
- Headers included in response:
  - `X-RateLimit-Limit`: 5
  - `X-RateLimit-Remaining`: requests left
  - `X-RateLimit-Reset`: Unix timestamp of reset

---

## CORS

The API includes CORS headers to allow cross-origin requests:

```
Access-Control-Allow-Origin: https://your-frontend-domain
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Best Practices

### 1. Pagination

Always use pagination for large datasets:
```bash
# Get first page
curl https://api.example.com/dev/api/threats?limit=50&offset=0

# Get next page
curl https://api.example.com/dev/api/threats?limit=50&offset=50
```

### 2. Caching

Consider caching responses:
- Threats list: Cache for 1 hour
- Specific threat: Cache for 24 hours
- User matches: Cache for 30 minutes

### 3. Error Handling

Always check response status and error messages:
```javascript
fetch('/api/threats')
  .then(res => {
    if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
    return res.json();
  })
  .catch(err => console.error('API error:', err));
```

### 4. User Privacy

- Don't expose threat IDs to users
- Use institutions and types instead of internal IDs
- Hash user_id before storing in logs

---

## Integration Examples

### React Component

```javascript
// Get threats for a user
const getMatchedThreats = async (userId, institutions) => {
  const response = await fetch('/api/threats/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, institutions })
  });
  return response.json();
};

// Get weekly digest
const getWeeklyDigest = async (userId) => {
  const response = await fetch(`/api/threats/feed?user_id=${userId}`);
  return response.json();
};
```

### Python Lambda

```python
import requests

def get_high_threats():
    response = requests.get(
        'https://api.example.com/dev/api/threats',
        params={'threat_level': 'high'}
    )
    return response.json()
```

---

## Changelog

### Version 1.0 (March 14, 2026)

- Initial API release
- 4 core endpoints
- SQ and CAFC integration
- User threat matching
- Weekly digest support

---

**Documentation Version:** 1.0
**Last Updated:** March 14, 2026
**Status:** Active
