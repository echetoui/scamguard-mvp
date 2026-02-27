# ScamGuard Backend

Python Lambda backend for ScamGuard v5.2 - Senior-friendly scam detection and learning.

## Structure

```
backend/
├── lambda/
│   ├── agents/              # AI agents
│   │   ├── scenario_agent.py
│   │   ├── detection_agent.py
│   │   ├── coaching_agent.py
│   │   └── analytics_agent.py
│   └── handler.py          # Main Lambda handler
├── tests/                   # Unit & integration tests
├── cdk/                     # AWS CDK infrastructure
├── requirements.txt        # Python dependencies
└── pytest.ini             # Pytest configuration
```

## Setup

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Environment Variables

Create `.env` file:

```bash
DYNAMODB_TABLE=ScamGuardData
AWS_REGION=us-east-1
```

## Development

### Run Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=lambda_ --cov-report=html

# Specific test file
pytest tests/test_agents.py -v

# Specific test
pytest tests/test_agents.py::TestScenarioAgent::test_generate_scenario_success -v
```

### Code Quality

```bash
# Format code
black lambda_ tests

# Lint
flake8 lambda_ tests

# Type checking
mypy lambda_

# Security check
bandit -r lambda_
```

### Local Lambda Testing

```bash
# Run handler locally
python -c "
from lambda_.handler import lambda_handler
import json

event = {
    'rawPath': '/api/v1/scenarios',
    'requestContext': {
        'http': {'method': 'POST'},
        'authorizer': {'claims': {'sub': 'test-user'}}
    },
    'headers': {'X-Request-ID': 'test'},
    'body': json.dumps({'difficulty': 'medium'})
}

class Context:
    aws_request_id = 'test-trace'

result = lambda_handler(event, Context())
print(json.dumps(json.loads(result['body']), indent=2))
"
```

## Agents

### ScenarioAgent
- Generates realistic scam scenarios using Gemini 1.5 Flash
- Fallback: Library of hardcoded scenarios
- Caches results for 7 days

### DetectionAgent
- Analyzes messages/images using GPT-4o-mini vision
- Returns risk_level, indicators, explanation
- Retry logic with exponential backoff

### CoachingAgent
- Provides personalized learning feedback
- Friendly, actionable advice for seniors
- Based on detection results

### AnalyticsAgent
- Tracks user learning progress
- Computes accuracy, learning streaks
- Queries DynamoDB for analytics

## API Endpoints

All endpoints are versioned at `/api/v1/`:

```
POST   /api/v1/scenarios      - Generate learning scenario
POST   /api/v1/analysis       - Analyze message/image
GET    /api/v1/profile        - Get user profile
GET    /api/v1/analytics/summary - Get analytics
```

See [Architecture](../docs/architecture.md) for full API spec.

## Error Handling

All errors return standardized format:

```json
{
  "error": {
    "code": "VISION_ANALYSIS_TIMEOUT",
    "message": "GPT-4o-mini analysis exceeded 60s timeout",
    "trace_id": "x-ray-abc123",
    "timestamp": "2026-02-16T10:30:45Z"
  }
}
```

## Monitoring

- X-Ray tracing on all Lambda handlers
- CloudWatch logs with trace_id correlation
- CloudWatch alarms for errors, timeouts

View traces:
```bash
# Get trace summary
aws xray get-trace-summaries --start-time $(date -u -d '1 hour ago' +%s)
```

## Deployment

Via CDK in `backend/cdk/`:

```bash
cd cdk
cdk deploy
```

## Phase 1 Tasks

- [x] Create agent classes (ScenarioAgent, DetectionAgent, CoachingAgent, AnalyticsAgent)
- [x] Implement Lambda handler with modern API responses
- [x] Add X-Ray tracing annotations
- [x] Create test suite (unit + integration)
- [ ] Optimize for 1536MB memory, 60s timeout
- [ ] Implement retry logic with exponential backoff
- [ ] Add email verification flow (Cognito)
- [ ] Update Lambda deployment for new memory/timeout

See [GitHub Issues](https://github.com/echetoui/scamguard-mvp/issues) for full roadmap.
