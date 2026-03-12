"""Unit tests for family_handler.py - Family Protection API endpoints."""

import os
import sys
import json
import base64
from datetime import datetime
from unittest.mock import MagicMock, patch
import pytest

# Setup path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Mock environment variables before importing
os.environ['DYNAMODB_TABLE'] = 'ScamGuardData-dev'
os.environ['COGNODB_USER_POOL_ID'] = 'test-pool'
os.environ['COGNITO_CLIENT_ID'] = 'test-client'


class TestFamilyHandler:
    """Test suite for family_handler.py"""

    @pytest.fixture(autouse=True)
    def setup_mocks(self):
        """Setup mocks for each test."""
        self.mock_table = MagicMock()
        self.mock_cognito = MagicMock()

        # Patch boto3 before importing family_handler
        with patch('boto3.resource') as mock_dynamodb:
            with patch('boto3.client') as mock_boto_client:
                mock_dynamodb.return_value.Table.return_value = self.mock_table
                mock_boto_client.return_value = self.mock_cognito

                # Now import family_handler with mocks active
                from lambda_ import family_handler
                self.handler = family_handler

    def encode_jwt_payload(self, user_id):
        """Helper to encode JWT payload."""
        payload = {
            "sub": user_id,
            "email": f"{user_id}@example.com",
            "email_verified": True
        }
        payload_str = json.dumps(payload)
        encoded = base64.urlsafe_b64encode(payload_str.encode()).decode()
        # Remove padding for realistic JWT
        return encoded.rstrip('=')

    def create_jwt_token(self, user_id):
        """Helper to create a mock JWT token."""
        header = base64.urlsafe_b64encode(b'{"alg":"HS256"}').decode().rstrip('=')
        payload = self.encode_jwt_payload(user_id)
        signature = base64.urlsafe_b64encode(b'signature').decode().rstrip('=')
        return f"{header}.{payload}.{signature}"

    def create_auth_event(self, user_id, path="/api/v1/family/dashboard", method="GET", body=None):
        """Helper to create API Gateway event with auth."""
        token = self.create_jwt_token(user_id)
        event = {
            "path": path,
            "httpMethod": method,
            "headers": {
                "Authorization": f"Bearer {token}"
            }
        }
        if body:
            event["body"] = json.dumps(body)
        return event

    # ========================================================================
    # Test: GET /api/v1/family/dashboard
    # ========================================================================

    def test_get_family_dashboard_success(self):
        """Test successful family dashboard retrieval."""
        user_id = "test-user-123"
        family_id = "family-456"

        def get_item_side_effect(Key):
            """Mock get_item by Key."""
            pk = Key.get("PK")
            sk = Key.get("SK")

            if pk == f"USER#{user_id}" and sk == "PROFILE":
                return {
                    "Item": {
                        "PK": f"USER#{user_id}",
                        "SK": "PROFILE",
                        "email": "test@example.com",
                        "familyId": family_id
                    }
                }
            elif pk == f"FAMILY#{family_id}" and sk == "METADATA":
                return {
                    "Item": {
                        "PK": f"FAMILY#{family_id}",
                        "SK": "METADATA",
                        "familyName": "Mon Groupe Familial",
                        "inviteCode": "ABC123"
                    }
                }
            return {}

        self.mock_table.get_item.side_effect = get_item_side_effect

        # Mock query for members
        def query_side_effect(**kwargs):
            pk_value = kwargs.get("ExpressionAttributeValues", {}).get(":pk")

            if ":sk_prefix" in kwargs.get("ExpressionAttributeValues", {}) and "MEMBER#" in kwargs.get("ExpressionAttributeValues", {}).get(":sk_prefix", ""):
                return {
                    "Items": [
                        {
                            "email": "parent@example.com",
                            "role": "family",
                            "joinedAt": "2026-03-01T10:00:00Z",
                            "lastActive": "2026-03-06T09:00:00Z"
                        },
                        {
                            "email": "senior@example.com",
                            "role": "senior",
                            "joinedAt": "2026-03-02T10:00:00Z",
                            "lastActive": "2026-03-06T08:00:00Z"
                        }
                    ]
                }
            elif ":sk_prefix" in kwargs.get("ExpressionAttributeValues", {}) and "THREAT#" in kwargs.get("ExpressionAttributeValues", {}).get(":sk_prefix", ""):
                return {
                    "Items": [
                        {
                            "scamType": "Phishing SMS",
                            "severity": "HIGH",
                            "content": "Suspicious message",
                            "reportedBy": "parent@example.com",
                            "reportedAt": "2026-03-06T07:00:00Z"
                        }
                    ]
                }
            return {"Items": []}

        self.mock_table.query.side_effect = query_side_effect

        event = self.create_auth_event(user_id)
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert "data" in body
        assert body["data"]["familyName"] == "Mon Groupe Familial"
        assert len(body["data"]["members"]) == 2
        assert len(body["data"]["threats"]) == 1

    def test_get_family_dashboard_no_family(self):
        """Test dashboard retrieval when user has no family."""
        user_id = "solo-user"

        self.mock_table.get_item.return_value = {
            "Item": {
                "PK": f"USER#{user_id}",
                "SK": "PROFILE",
                "email": "solo@example.com"
                # No familyId
            }
        }

        event = self.create_auth_event(user_id)
        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 404
        body = json.loads(response["body"])
        assert body["error"]["code"] == "NO_FAMILY"

    def test_get_family_dashboard_missing_auth(self):
        """Test dashboard retrieval without authorization."""
        event = {
            "path": "/api/v1/family/dashboard",
            "httpMethod": "GET",
            "headers": {}
        }

        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 401
        body = json.loads(response["body"])
        assert body["error"]["code"] == "INVALID_TOKEN"

    def test_get_family_dashboard_invalid_token(self):
        """Test dashboard with invalid token format."""
        event = {
            "path": "/api/v1/family/dashboard",
            "httpMethod": "GET",
            "headers": {
                "Authorization": "Bearer invalid.token"  # Too few parts
            }
        }

        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 401
        body = json.loads(response["body"])
        assert body["error"]["code"] == "INVALID_TOKEN"

    # ========================================================================
    # Test: POST /api/v1/family/join
    # ========================================================================

    def test_join_family_success(self):
        """Test successfully joining a family."""
        user_id = "new-member"
        family_id = "family-789"
        invite_code = "DEF456"

        # Mock get_item for user profile
        self.mock_table.get_item.return_value = {
            "Item": {
                "PK": f"USER#{user_id}",
                "SK": "PROFILE",
                "email": "newmember@example.com"
            }
        }

        # Mock scan for finding family
        self.mock_table.scan.return_value = {
            "Items": [
                {
                    "PK": f"FAMILY#{family_id}",
                    "SK": "METADATA",
                    "familyName": "Famille Martin",
                    "inviteCode": invite_code
                }
            ]
        }

        event = self.create_auth_event(
            user_id,
            path="/api/v1/family/join",
            method="POST",
            body={"inviteCode": invite_code}
        )

        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["data"]["message"] == "Successfully joined family"
        assert body["data"]["familyId"] == family_id
        assert body["data"]["familyName"] == "Famille Martin"

        # Verify put_item was called twice (member + profile update)
        assert self.mock_table.put_item.call_count == 2

    def test_join_family_missing_code(self):
        """Test joining family without invite code."""
        user_id = "test-user"

        # Mock get_item for user profile
        self.mock_table.get_item.return_value = {
            "Item": {
                "PK": f"USER#{user_id}",
                "SK": "PROFILE",
                "email": "test@example.com"
            }
        }

        event = self.create_auth_event(
            user_id,
            path="/api/v1/family/join",
            method="POST",
            body={}
        )

        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "MISSING_CODE"

    def test_join_family_invalid_code(self):
        """Test joining family with non-existent invite code."""
        user_id = "test-user"
        invalid_code = "BADCODE"

        # Mock get_item for user profile
        self.mock_table.get_item.return_value = {
            "Item": {
                "PK": f"USER#{user_id}",
                "SK": "PROFILE",
                "email": "test@example.com"
            }
        }

        # Mock scan - no families found
        self.mock_table.scan.return_value = {
            "Items": []
        }

        event = self.create_auth_event(
            user_id,
            path="/api/v1/family/join",
            method="POST",
            body={"inviteCode": invalid_code}
        )

        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 404
        body = json.loads(response["body"])
        assert body["error"]["code"] == "INVALID_CODE"

    def test_join_family_invalid_json(self):
        """Test joining family with invalid JSON body."""
        user_id = "test-user"

        event = self.create_auth_event(
            user_id,
            path="/api/v1/family/join",
            method="POST"
        )
        event["body"] = "{ invalid json"

        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "INVALID_JSON"

    # ========================================================================
    # Test: CORS and Routing
    # ========================================================================

    def test_options_preflight(self):
        """Test OPTIONS preflight request."""
        event = {
            "path": "/api/v1/family/dashboard",
            "httpMethod": "OPTIONS"
        }

        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 200
        assert "Access-Control-Allow-Origin" in response["headers"]

    def test_not_found_endpoint(self):
        """Test requesting non-existent endpoint."""
        event = {
            "path": "/api/v1/family/nonexistent",
            "httpMethod": "GET",
            "headers": {
                "Authorization": f"Bearer {self.create_jwt_token('test')}"
            }
        }

        response = self.handler.lambda_handler(event, None)

        assert response["statusCode"] == 404
        body = json.loads(response["body"])
        assert body["error"]["code"] == "NOT_FOUND"

    # ========================================================================
    # Test: Response Format
    # ========================================================================

    def test_response_cors_headers(self):
        """Test that all responses include CORS headers."""
        event = {
            "path": "/api/v1/family/dashboard",
            "httpMethod": "GET",
            "headers": {}
        }

        response = self.handler.lambda_handler(event, None)

        assert "Access-Control-Allow-Origin" in response["headers"]
        assert response["headers"]["Content-Type"] == "application/json"
        assert "Access-Control-Allow-Methods" in response["headers"]

    def test_error_response_format(self):
        """Test error response format."""
        event = {
            "path": "/api/v1/family/dashboard",
            "httpMethod": "GET",
            "headers": {}
        }

        response = self.handler.lambda_handler(event, None)
        body = json.loads(response["body"])

        assert "error" in body
        assert "code" in body["error"]
        assert "message" in body["error"]

    def test_success_response_format(self):
        """Test success response format."""
        user_id = "test-user"
        family_id = "family-123"

        self.mock_table.get_item.side_effect = [
            {
                "Item": {
                    "PK": f"USER#{user_id}",
                    "SK": "PROFILE",
                    "familyId": family_id
                }
            },
            {
                "Item": {
                    "PK": f"FAMILY#{family_id}",
                    "SK": "METADATA",
                    "familyName": "Test Family",
                    "inviteCode": "XYZ789"
                }
            }
        ]

        self.mock_table.query.side_effect = [
            {"Items": []},
            {"Items": []}
        ]

        event = self.create_auth_event(user_id)
        response = self.handler.lambda_handler(event, None)
        body = json.loads(response["body"])

        assert "data" in body
        assert "error" not in body


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
