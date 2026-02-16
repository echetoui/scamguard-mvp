"""Pytest configuration and fixtures."""

import os
import sys
import pytest
from unittest.mock import MagicMock

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture
def mock_dynamodb():
    """Mock DynamoDB table."""
    table = MagicMock()
    table.get_item.return_value = {"Item": {}}
    table.put_item.return_value = {}
    table.update_item.return_value = {}
    table.query.return_value = {"Items": []}
    return table


@pytest.fixture
def mock_secrets():
    """Mock Secrets Manager."""
    mock = MagicMock()
    mock.get_secret_value.return_value = {"SecretString": '{"api_key": "mock_key"}'}
    return mock


@pytest.fixture
def mock_s3():
    """Mock S3 client."""
    mock = MagicMock()
    mock.get_object.return_value = {"Body": MagicMock()}
    return mock


@pytest.fixture
def aws_credentials(monkeypatch):
    """Mock AWS credentials."""
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")


@pytest.fixture
def dynamodb_table(aws_credentials, mock_dynamodb):
    """DynamoDB table for tests."""
    return mock_dynamodb


@pytest.fixture
def api_gateway_event():
    """Sample API Gateway event."""
    return {
        "rawPath": "/api/v1/test",
        "requestContext": {
            "http": {"method": "POST"},
            "authorizer": {"claims": {"sub": "test-user-id"}},
        },
        "headers": {
            "X-Request-ID": "test-request-id",
            "Content-Type": "application/json",
        },
        "body": "{}",
    }


@pytest.fixture
def lambda_context():
    """Lambda context."""
    context = MagicMock()
    context.aws_request_id = "test-trace-id"
    context.function_name = "test-function"
    context.memory_limit_in_mb = 1536
    context.invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:test"
    return context


# Pytest configuration
def pytest_configure(config):
    """Configure pytest."""
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line("markers", "unit: mark test as a unit test")
    config.addinivalue_line("markers", "slow: mark test as slow")
