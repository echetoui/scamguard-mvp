# CI/CD Pipeline for ScamGuard v5.2

## Overview

Automated testing, security scanning, and deployment pipeline using GitHub Actions.

## Workflows

### 1. Test & Coverage (.github/workflows/test.yml)

**Triggers**: Push to develop/main/feature/*, Pull requests

**Steps**:
1. **Setup**: Python 3.12
2. **Install dependencies**: pip install -r requirements.txt
3. **Lint**: flake8 (max line length 100)
4. **Format**: black (code style)
5. **Type checking**: mypy (ignore missing imports)
6. **Unit tests**: pytest with coverage
7. **Coverage threshold**: Enforce 80% minimum
8. **Upload**: Codecov artifact
9. **PR comment**: Coverage report

**Failure conditions**:
- Coverage < 80%
- flake8 violations
- black formatting issues

### 2. Security Scan (.github/workflows/security.yml)

**Triggers**: Push to develop/main, PRs, Daily schedule (2am UTC)

**Steps**:
1. **Bandit**: Python security audit
2. **Secrets detection**: detect-secrets
3. **Dependencies**: Safety + pip-audit
4. **SonarQube**: Code quality scanning
5. **PR comment**: Security status

**Reports**:
- bandit-report.json
- Security summary in PR

### 3. Load Testing (Manual trigger via CLI)

```bash
locust -f backend/tests/load_test.py \
  --host=https://api.scamguard.com \
  --users=10 \
  --spawn-rate=1 \
  --run-time=5m
```

**Scenarios**:
- 10 concurrent users
- Random scenario generation (difficulty mix)
- Message analysis requests
- Profile/analytics reads
- 5-minute test duration

**Metrics tracked**:
- P50/P99 latency
- Error rate
- Requests/sec
- Memory usage
- Lambda duration

## Local Development

### Run Tests Locally

```bash
# All tests
pytest backend/tests -v

# With coverage
pytest backend/tests -v --cov=lambda_ --cov-report=html

# Specific test file
pytest backend/tests/test_agents.py -v

# Watch mode (requires pytest-watch)
ptw backend/tests
```

### Run Linting

```bash
# Format code
black backend/lambda backend/tests

# Check formatting (no changes)
black --check backend/lambda backend/tests

# Lint
flake8 backend/lambda backend/tests

# Type check
mypy backend/lambda --ignore-missing-imports
```

### Security Checks

```bash
# Bandit security scan
bandit -r backend/lambda -f json -o bandit-report.json

# Detect secrets
detect-secrets scan backend/lambda --all-files

# Check dependencies
pip-audit
```

### Load Testing Locally

```bash
# Start Locust UI
locust -f backend/tests/load_test.py --host=http://localhost:8000

# Then open http://localhost:8089 in browser
# Configure users, spawn rate, duration
# Start test
```

Or headless:
```bash
locust -f backend/tests/load_test.py \
  --host=http://localhost:8000 \
  --users=10 \
  --spawn-rate=1 \
  --run-time=5m \
  --headless
```

## GitHub Secrets

Required secrets for CI/CD:

```
SONAR_TOKEN          # SonarQube authentication
AWS_ACCESS_KEY_ID    # For deployment (future)
AWS_SECRET_ACCESS_KEY # For deployment (future)
```

Set in: Settings → Secrets and variables → Actions

## Branch Protection

`develop` and `main` branches require:
- ✅ CI tests pass (80%+ coverage)
- ✅ No unresolved conversations
- ✅ At least 1 approval

Configure in: Settings → Branches → Branch protection rules

## Deployment Pipeline (Future)

### Deploy to Staging
```yaml
on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - Deploy Lambda to staging environment
      - Run smoke tests
      - Notify Slack
```

### Deploy to Production
```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:  # Manual trigger

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    steps:
      - Deploy Lambda to production
      - Run health checks
      - Rollback on failure
      - Update CloudFront
      - Notify team
```

## Performance Targets

### Unit Tests
- Duration: < 30 seconds
- Coverage: 80%+ required

### Integration Tests
- Duration: < 60 seconds
- Error rate: 0%

### Load Test (10 users, 5 min)
- P50 latency: < 5s
- P99 latency: < 10s
- Error rate: < 1%
- Throughput: > 100 req/min

## Monitoring

### CloudWatch Metrics
- Invocation count
- Duration (avg/max/min)
- Errors
- Memory usage
- Throttles

### X-Ray Traces
- Full request trace
- Service map
- Performance timeline

### Custom Metrics
- Vision API retry count
- Fallback usage rate
- Rate limit hits
- Cache hit rate

## Troubleshooting

### Coverage Below 80%
```bash
# Generate HTML report
pytest --cov=lambda_ --cov-report=html

# View in browser
open htmlcov/index.html

# Find uncovered lines
pytest --cov=lambda_ --cov-report=term-missing
```

### Flake8 Violations
```bash
# Show violations
flake8 backend/lambda

# Fix automatically with autopep8
autopep8 --in-place --aggressive backend/lambda/*.py
```

### Tests Failing Locally

```bash
# Run with verbose output
pytest -vv --tb=long backend/tests/test_agents.py

# Run with print statements
pytest -s backend/tests/test_agents.py

# Run specific test
pytest backend/tests/test_agents.py::TestScenarioAgent::test_generate_scenario_success -v
```

### Load Test High Latency

```bash
# Check Lambda CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=scamguard-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# View X-Ray traces
aws xray get-trace-summaries --start-time $(date -u -d '5 minutes ago' +%s)
```

## Best Practices

1. **Run tests locally before pushing**
   ```bash
   pytest --cov=lambda_ --cov-report=term-missing
   ```

2. **Keep test data small**
   - Use mocks instead of real API calls
   - Keep test files < 50KB

3. **Write tests for edge cases**
   - Timeouts
   - Rate limits
   - Invalid inputs
   - API failures

4. **Monitor CI/CD performance**
   - Target: < 5 min total
   - Optimize slow tests
   - Parallelize where possible

5. **Keep secrets secure**
   - Never commit secrets
   - Use GitHub secrets
   - Rotate regularly

## References

- GitHub Actions: https://docs.github.com/en/actions
- pytest: https://docs.pytest.org
- Locust: https://locust.io
- Bandit: https://bandit.readthedocs.io
