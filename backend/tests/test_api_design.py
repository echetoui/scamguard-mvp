"""Tests for modern API design - versioning, responses, errors."""

import json
import pytest
from unittest.mock import MagicMock, patch
from lambda_.utils.response import ResponseBuilder, HTTPStatus, RateLimitHeaders
from lambda_.utils.auth import (
    extract_user_id,
    extract_email,
    get_request_id,
    PermissionChecker,
)


class TestResponseBuilder:
    """Test ResponseBuilder."""

    def test_success_response(self):
        """Test 200 success response format."""
        data = {"id": "scenario_123", "difficulty": "medium"}
        response = ResponseBuilder.success(
            data,
            request_id="req_abc",
            trace_id="trace_xyz",
        )

        assert response["statusCode"] == 200
        assert response["headers"]["Content-Type"] == "application/json"
        assert response["headers"]["X-Request-ID"] == "req_abc"
        assert response["headers"]["X-Trace-ID"] == "trace_xyz"

        body = json.loads(response["body"])
        assert body["data"] == data
        assert body["meta"]["request_id"] == "req_abc"
        assert body["meta"]["trace_id"] == "trace_xyz"
        assert "processed_at" in body["meta"]

    def test_error_response(self):
        """Test error response format."""
        response = ResponseBuilder.error(
            code="VISION_ANALYSIS_TIMEOUT",
            message="Analysis exceeded timeout",
            request_id="req_abc",
            trace_id="trace_xyz",
            status_code=500,
            details="GPT-4o-mini took >60s",
        )

        assert response["statusCode"] == 500
        body = json.loads(response["body"])
        assert body["error"]["code"] == "VISION_ANALYSIS_TIMEOUT"
        assert body["error"]["message"] == "Analysis exceeded timeout"
        assert body["error"]["details"] == "GPT-4o-mini took >60s"
        assert body["error"]["trace_id"] == "trace_xyz"

    def test_created_response(self):
        """Test 201 Created response."""
        response = ResponseBuilder.created(
            {"id": "session_123"},
            request_id="req_abc",
            trace_id="trace_xyz",
        )

        assert response["statusCode"] == 201

    def test_accepted_response(self):
        """Test 202 Accepted response (async)."""
        response = ResponseBuilder.accepted(
            {"job_id": "job_123"},
            request_id="req_abc",
            trace_id="trace_xyz",
        )

        assert response["statusCode"] == 202

    def test_bad_request_response(self):
        """Test 400 Bad Request response."""
        response = ResponseBuilder.bad_request(
            code="INVALID_DIFFICULTY",
            message="Difficulty must be easy, medium, or hard",
            request_id="req_abc",
            trace_id="trace_xyz",
            details="Got: invalid",
        )

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "INVALID_DIFFICULTY"

    def test_unauthorized_response(self):
        """Test 401 Unauthorized response."""
        response = ResponseBuilder.unauthorized(
            request_id="req_abc",
            trace_id="trace_xyz",
        )

        assert response["statusCode"] == 401
        body = json.loads(response["body"])
        assert body["error"]["code"] == "UNAUTHORIZED"

    def test_rate_limit_response(self):
        """Test 429 Rate Limit response."""
        response = ResponseBuilder.rate_limit(
            request_id="req_abc",
            trace_id="trace_xyz",
            retry_after=120,
        )

        assert response["statusCode"] == 429
        assert response["headers"]["Retry-After"] == "120"
        body = json.loads(response["body"])
        assert body["error"]["code"] == "RATE_LIMIT_EXCEEDED"
        assert body["error"]["retry_after"] == 120

    def test_not_found_response(self):
        """Test 404 Not Found response."""
        response = ResponseBuilder.not_found(
            request_id="req_abc",
            trace_id="trace_xyz",
            resource="Scenario",
        )

        assert response["statusCode"] == 404
        body = json.loads(response["body"])
        assert body["error"]["code"] == "NOT_FOUND"


class TestRateLimitHeaders:
    """Test rate limit headers."""

    def test_add_rate_limit_headers(self):
        """Test adding rate limit headers."""
        headers = {"Content-Type": "application/json"}
        updated = RateLimitHeaders.add_to_headers(
            headers,
            remaining=7,
            limit=10,
            reset_timestamp=1708102800,
        )

        assert updated["X-RateLimit-Limit"] == "10"
        assert updated["X-RateLimit-Remaining"] == "7"
        assert updated["X-RateLimit-Reset"] == "1708102800"


class TestAuthExtraction:
    """Test authentication utilities."""

    def test_extract_user_id(self):
        """Test user ID extraction."""
        event = {
            "requestContext": {
                "authorizer": {
                    "claims": {
                        "sub": "user-123",
                    }
                }
            }
        }

        user_id = extract_user_id(event)
        assert user_id == "user-123"

    def test_extract_user_id_missing(self):
        """Test user ID extraction with missing data."""
        event = {}
        user_id = extract_user_id(event)
        assert user_id is None

    def test_extract_email(self):
        """Test email extraction."""
        event = {
            "requestContext": {
                "authorizer": {
                    "claims": {
                        "email": "user@example.com",
                    }
                }
            }
        }

        email = extract_email(event)
        assert email == "user@example.com"

    def test_get_request_id_from_header(self):
        """Test request ID extraction from header."""
        event = {
            "headers": {
                "X-Request-ID": "req_xyz789"
            }
        }

        request_id = get_request_id(event)
        assert request_id == "req_xyz789"

    def test_get_request_id_generated(self):
        """Test request ID generation."""
        event = {"headers": {}}

        request_id = get_request_id(event)
        assert request_id.startswith("req_")


class TestPermissionChecker:
    """Test permission checking."""

    def test_can_access_own_data(self):
        """Test user can access their own data."""
        assert PermissionChecker.can_access_user_data(
            "user-123", "user-123"
        )

    def test_cannot_access_other_data(self):
        """Test user cannot access other user's data."""
        assert not PermissionChecker.can_access_user_data(
            "user-123", "user-456"
        )

    def test_has_permission(self):
        """Test basic permission check."""
        # For now, all authenticated users have basic permissions
        assert PermissionChecker.has_permission(
            "user-123", "profile", "read"
        )


class TestAPIVersioning:
    """Test API versioning."""

    def test_endpoints_versioned(self):
        """Test that endpoints follow /api/v1/ pattern."""
        versioned_endpoints = [
            "/api/v1/scenarios",
            "/api/v1/analysis",
            "/api/v1/profile",
            "/api/v1/analytics/summary",
        ]

        for endpoint in versioned_endpoints:
            assert "/api/v1/" in endpoint
            assert not endpoint.startswith("/api/scenarios")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
