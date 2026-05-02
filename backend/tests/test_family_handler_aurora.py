"""Unit tests for Aurora-backed family_handler in lambda_/handlers/family_handler.py"""

import os
import sys
import json
import base64
from datetime import datetime
from unittest.mock import MagicMock, patch
import pytest
import importlib

# Setup path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Mock environment variables before importing
os.environ['DYNAMODB_TABLE'] = 'ScamGuardData-dev'
os.environ['COGNODB_USER_POOL_ID'] = 'test-pool'
os.environ['COGNITO_CLIENT_ID'] = 'test-client'
os.environ['AURORA_SECRET_ARN'] = 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test'
os.environ['AURORA_DATABASE'] = 'scamguard'


class TestFamilyHandlerAurora:
    """Test suite for Aurora-backed family_handler.py"""

    @pytest.fixture(autouse=True)
    def setup_mocks(self):
        """Setup mocks for each test."""
        # Create mocks for db module functions
        self.mock_db = MagicMock()

        # Define response helper functions matching actual signature
        CORS_HEADERS = {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }

        def ok_response(data, status=200):
            return {
                "statusCode": status,
                "headers": CORS_HEADERS,
                "body": json.dumps({"data": data}, default=str),
            }

        def created_response(data):
            return ok_response(data, 201)

        def error_response(status, code, message):
            return {
                "statusCode": status,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": {"code": code, "message": message}}),
            }

        def bad_request_response(message, code="BAD_REQUEST"):
            return error_response(400, code, message)

        def unauthorized_response(message="Authentication required"):
            return error_response(401, "UNAUTHORIZED", message)

        def not_found_response(resource="Resource"):
            return error_response(404, "NOT_FOUND", f"{resource} not found")

        def internal_response(e):
            return error_response(500, "INTERNAL_ERROR", str(e))

        def cors_preflight_response():
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

        def get_method(event):
            rc = event.get("requestContext", {})
            method = rc.get("http", {}).get("method", "")
            if not method:
                method = event.get("httpMethod", "GET")
            return method.upper()

        def get_path(event):
            path = event.get("rawPath") or event.get("path") or ""
            return path.rstrip("/")

        def extract_user_id(event):
            rc = event.get("requestContext", {})
            jwt_claims = rc.get("authorizer", {}).get("jwt", {}).get("claims", {})
            if jwt_claims.get("sub"):
                return jwt_claims["sub"]
            claims = rc.get("authorizer", {}).get("claims", {})
            if claims.get("sub"):
                return claims["sub"]
            return None

        def parse_body(event):
            body = event.get("body") or "{}"
            if isinstance(body, str):
                try:
                    return json.loads(body)
                except (json.JSONDecodeError, ValueError):
                    return {}
            if isinstance(body, dict):
                return body
            return {}

        # Patch the db and response modules
        with patch.dict('sys.modules', {'db': self.mock_db}):
            # Create a mock response module with the functions
            self.mock_response = MagicMock()
            self.mock_response.ok = ok_response
            self.mock_response.created = created_response
            self.mock_response.bad_request = bad_request_response
            self.mock_response.not_found = not_found_response
            self.mock_response.unauthorized = unauthorized_response
            self.mock_response.internal = internal_response
            self.mock_response.cors_preflight = cors_preflight_response
            self.mock_response.get_method = get_method
            self.mock_response.get_path = get_path
            self.mock_response.extract_user_id = extract_user_id
            self.mock_response.parse_body = parse_body

            with patch.dict('sys.modules', {'response': self.mock_response}):
                # Reload the family_handler module for this test
                if 'lambda_.handlers.family_handler' in sys.modules:
                    from lambda_.handlers import family_handler
                    importlib.reload(family_handler)
                else:
                    from lambda_.handlers import family_handler

                # Patch db functions in the handler module
                family_handler.db = self.mock_db
                family_handler.ok = ok_response
                family_handler.created = created_response
                family_handler.bad_request = bad_request_response
                family_handler.not_found = not_found_response
                family_handler.unauthorized = unauthorized_response
                family_handler.internal = internal_response
                family_handler.cors_preflight = cors_preflight_response
                family_handler.get_method = get_method
                family_handler.get_path = get_path
                family_handler.extract_user_id = extract_user_id
                family_handler.parse_body = parse_body

                self.handler = family_handler
                yield

    def create_http_v2_event(self, method, path, user_id=None, body=None):
        """Create an HTTP v2 API Gateway event."""
        event = {
            "rawPath": path,
            "rawQueryString": "",
            "headers": {},
            "requestContext": {
                "http": {
                    "method": method,
                    "path": path
                },
                "authorizer": {}
            }
        }

        if user_id:
            event["requestContext"]["authorizer"]["jwt"] = {
                "claims": {"sub": user_id}
            }

        if body:
            event["body"] = json.dumps(body)

        return event

    # ========================================================================
    # Test: GET /api/v1/family/dashboard
    # ========================================================================

    def test_dashboard_success(self):
        """Test successful family dashboard retrieval."""
        user_id = "user-123"
        family_id = "fam-456"

        # Mock db calls
        self.mock_db.execute_one.side_effect = [
            {"user_id": "internal-user-123", "email": "test@example.com"},  # user lookup
            {"family_id": family_id, "role": "family"},  # membership lookup
            {"family_id": family_id, "name": "Ma Famille", "invite_code": "ABC123", "created_at": "2026-04-24"},  # family lookup
        ]

        self.mock_db.execute.side_effect = [
            [  # members query
                {"user_id": "internal-user-123", "email": "test@example.com", "role": "family", "joined_at": "2026-04-24"},
            ],
        ]

        event = self.create_http_v2_event("GET", "/api/v1/family/dashboard", user_id=user_id)
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert "data" in body
        assert body["data"]["familyName"] == "Ma Famille"

    def test_dashboard_no_family(self):
        """Test dashboard when user has no family."""
        user_id = "solo-user"

        # Mock db calls
        self.mock_db.execute_one.side_effect = [
            {"user_id": "internal-user-456", "email": "solo@example.com"},  # user lookup
            None,  # membership lookup (no family)
        ]

        event = self.create_http_v2_event("GET", "/api/v1/family/dashboard", user_id=user_id)
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 404
        body = json.loads(response["body"])
        assert body["error"]["code"] == "NOT_FOUND"

    def test_dashboard_missing_auth(self):
        """Test dashboard without authentication."""
        event = self.create_http_v2_event("GET", "/api/v1/family/dashboard")
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 401

    # ========================================================================
    # Test: POST /api/v1/family/create
    # ========================================================================

    def test_create_family_success(self):
        """Test successful family creation."""
        user_id = "user-789"

        # Mock db calls
        self.mock_db.execute_one.side_effect = [
            {"user_id": "internal-user-789"},  # user lookup
            None,  # check if already in family
        ]

        self.mock_db.execute_write = MagicMock()

        event = self.create_http_v2_event(
            "POST",
            "/api/v1/family/create",
            user_id=user_id,
            body={"familyName": "Famille Martin"}
        )
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 201
        body = json.loads(response["body"])
        assert "data" in body
        assert "familyId" in body["data"]
        assert "inviteCode" in body["data"]
        assert self.mock_db.execute_write.call_count == 2

    def test_create_family_already_in_family(self):
        """Test create family when user already has one."""
        user_id = "user-with-family"

        # Mock db calls
        self.mock_db.execute_one.side_effect = [
            {"user_id": "internal-user-111"},  # user lookup
            {"family_id": "existing-family"},  # user already in family
        ]

        event = self.create_http_v2_event(
            "POST",
            "/api/v1/family/create",
            user_id=user_id,
            body={"familyName": "Test"}
        )
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "ALREADY_IN_FAMILY"

    # ========================================================================
    # Test: POST /api/v1/family/join
    # ========================================================================

    def test_join_family_success(self):
        """Test successfully joining a family."""
        user_id = "new-member"
        family_id = "fam-999"
        invite_code = "XYZ789"

        # Mock db calls
        self.mock_db.execute_one.side_effect = [
            {"user_id": "internal-user-222"},  # user lookup
            None,  # check if already in family
            {"family_id": family_id},  # find family by invite code
        ]

        self.mock_db.execute_write = MagicMock()

        event = self.create_http_v2_event(
            "POST",
            "/api/v1/family/join",
            user_id=user_id,
            body={"inviteCode": invite_code}
        )
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert "data" in body
        assert "familyId" in body["data"]
        assert self.mock_db.execute_write.call_count == 1

    def test_join_family_missing_code(self):
        """Test joining without invite code."""
        user_id = "test-user"

        event = self.create_http_v2_event(
            "POST",
            "/api/v1/family/join",
            user_id=user_id,
            body={}
        )
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "MISSING_INVITE_CODE"

    def test_join_family_invalid_code(self):
        """Test joining with non-existent invite code."""
        user_id = "test-user"

        # Mock db calls
        self.mock_db.execute_one.side_effect = [
            {"user_id": "internal-user-333"},  # user lookup
            None,  # check if already in family
            None,  # family not found by invite code
        ]

        event = self.create_http_v2_event(
            "POST",
            "/api/v1/family/join",
            user_id=user_id,
            body={"inviteCode": "BADCODE"}
        )
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 404
        body = json.loads(response["body"])
        assert body["error"]["code"] == "NOT_FOUND"

    def test_join_family_already_in_family(self):
        """Test join when user already in a family."""
        user_id = "member-user"

        # Mock db calls
        self.mock_db.execute_one.side_effect = [
            {"user_id": "internal-user-444"},  # user lookup
            {"family_id": "existing-family"},  # already in family
        ]

        event = self.create_http_v2_event(
            "POST",
            "/api/v1/family/join",
            user_id=user_id,
            body={"inviteCode": "ABC123"}
        )
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "ALREADY_IN_FAMILY"

    # ========================================================================
    # Test: CORS and Routing
    # ========================================================================

    def test_cors_preflight(self):
        """Test OPTIONS preflight request."""
        event = self.create_http_v2_event("OPTIONS", "/api/v1/family/dashboard")
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 200
        assert "Access-Control-Allow-Origin" in response.get("headers", {})

    def test_not_found_endpoint(self):
        """Test requesting non-existent endpoint."""
        user_id = "test-user"
        event = self.create_http_v2_event("GET", "/api/v1/family/nonexistent", user_id=user_id)
        response = self.handler.lambda_handler(event, None)

        # Should return 404 or similar
        assert response["statusCode"] in [404, 405]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
