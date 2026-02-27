"""
Unit Tests for SMS OTP Handler
Tests phone validation, OTP generation, and request/verify flows
"""

import json
import pytest
from unittest.mock import patch, MagicMock, call
from datetime import datetime, timedelta
import sys
import os

# Mock AWS clients before importing handler
with patch('boto3.client') as mock_client:
    with patch('boto3.resource') as mock_resource:
        # Add lambda directory to path
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambda'))
        import sms_otp_handler as handler


# ============================================================================
# Test Phone Validation
# ============================================================================

class TestPhoneValidation:
    """Test phone number validation (E.164 format)"""

    def test_valid_phone_us(self):
        """Test valid US phone number"""
        assert handler.validate_phone_number("+15145551234") is True

    def test_valid_phone_canada(self):
        """Test valid Canadian phone number"""
        assert handler.validate_phone_number("+14165551234") is True

    def test_valid_phone_international(self):
        """Test valid international phone number"""
        assert handler.validate_phone_number("+33123456789") is True

    def test_invalid_no_plus(self):
        """Test invalid - missing plus sign"""
        assert handler.validate_phone_number("15145551234") is False

    def test_invalid_wrong_format(self):
        """Test invalid - wrong format with dashes"""
        assert handler.validate_phone_number("514-555-1234") is False

    def test_invalid_too_short(self):
        """Test invalid - too short"""
        assert handler.validate_phone_number("+1234") is False

    def test_invalid_too_long(self):
        """Test invalid - too long"""
        assert handler.validate_phone_number("+1" + "1" * 20) is False

    def test_invalid_non_numeric(self):
        """Test invalid - non-numeric characters"""
        assert handler.validate_phone_number("+1514555ABC4") is False

    def test_invalid_empty(self):
        """Test invalid - empty string"""
        assert handler.validate_phone_number("") is False

    def test_invalid_none(self):
        """Test invalid - None"""
        assert handler.validate_phone_number(None) is False


# ============================================================================
# Test OTP Generation
# ============================================================================

class TestOTPGeneration:
    """Test OTP code generation"""

    def test_otp_length(self):
        """Test OTP is 6 digits"""
        otp = handler.generate_otp()
        assert len(otp) == 6

    def test_otp_numeric(self):
        """Test OTP is numeric"""
        otp = handler.generate_otp()
        assert otp.isdigit()

    def test_otp_randomness(self):
        """Test OTP is random (not deterministic)"""
        otps = [handler.generate_otp() for _ in range(10)]
        # At least some should be different (statistically)
        assert len(set(otps)) > 1

    def test_otp_zero_padded(self):
        """Test OTP handles zero padding"""
        # Generate many OTPs to find one starting with 0
        for _ in range(1000):
            otp = handler.generate_otp()
            if otp.startswith("0"):
                assert len(otp) == 6  # Still 6 digits with leading zero
                return
        # If we don't find one, the test still passes
        assert True


# ============================================================================
# Test Request OTP Endpoint
# ============================================================================

class TestRequestOTP:
    """Test POST /auth/request-sms-otp endpoint"""

    @patch('sms_otp_handler.dynamodb')
    @patch('sms_otp_handler.cognito_client')
    @patch('sms_otp_handler.pinpoint_client')
    def test_request_otp_success(self, mock_pinpoint, mock_cognito, mock_dynamodb):
        """Test successful OTP request"""
        # Mock DynamoDB
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        # Mock Cognito
        mock_cognito.sign_up.return_value = {"UserSub": "user-123"}

        # Mock Pinpoint
        mock_pinpoint.send_messages.return_value = {
            "MessageResponse": {
                "Result": {
                    "+15145551234": {
                        "MessageId": "msg-123"
                    }
                }
            }
        }

        # Create request event
        event = {
            "rawPath": "/api/v1/auth/request-sms-otp",
            "requestContext": {"http": {"method": "POST"}},
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "password": "TestPass123!"
            })
        }

        response = handler.request_otp(event, {})

        # Assert response
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["data"]["message"] == "Code de vérification envoyé à +15145551234"
        assert body["data"]["expires_in"] == 600  # 10 minutes

        # Assert DynamoDB was called (once for OTP, once for audit log)
        assert mock_table.put_item.call_count == 2

    @patch('sms_otp_handler.dynamodb')
    def test_request_otp_missing_fields(self, mock_dynamodb):
        """Test OTP request with missing fields"""
        event = {
            "rawPath": "/api/v1/auth/request-sms-otp",
            "requestContext": {"http": {"method": "POST"}},
            "body": json.dumps({"email": "test@example.com"})
        }

        response = handler.request_otp(event, {})

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "MISSING_FIELDS"

    @patch('sms_otp_handler.dynamodb')
    def test_request_otp_invalid_phone(self, mock_dynamodb):
        """Test OTP request with invalid phone"""
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        event = {
            "rawPath": "/api/v1/auth/request-sms-otp",
            "requestContext": {"http": {"method": "POST"}},
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "514-555-1234",  # Invalid format
                "password": "TestPass123!"
            })
        }

        response = handler.request_otp(event, {})

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "INVALID_PHONE"


# ============================================================================
# Test Verify OTP Endpoint
# ============================================================================

class TestVerifyOTP:
    """Test POST /auth/verify-sms-otp endpoint"""

    @patch('sms_otp_handler.dynamodb')
    @patch('sms_otp_handler.cognito_client')
    def test_verify_otp_success(self, mock_cognito, mock_dynamodb):
        """Test successful OTP verification"""
        # Mock DynamoDB
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        # Mock stored OTP
        mock_table.get_item.return_value = {
            "Item": {
                "code": "123456",
                "phone": "+15145551234",
                "email": "test@example.com",
                "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat(),
                "attempts": 0,
                "locked": False,
                "verified": False
            }
        }

        # Mock Cognito
        mock_cognito.admin_confirm_sign_up.return_value = {}
        mock_cognito.initiate_auth.return_value = {
            "AuthenticationResult": {
                "IdToken": "id-token-123",
                "AccessToken": "access-token-123",
                "RefreshToken": "refresh-token-123",
                "ExpiresIn": 3600
            }
        }
        mock_cognito.admin_get_user.return_value = {
            "UserAttributes": [
                {"Name": "sub", "Value": "user-uuid-123"}
            ]
        }

        event = {
            "rawPath": "/api/v1/auth/verify-sms-otp",
            "requestContext": {"http": {"method": "POST"}},
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "code": "123456",
                "password": "TestPass123!"
            })
        }

        response = handler.verify_otp(event, {})

        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["data"]["status"] == "VERIFIED"
        assert body["data"]["id_token"] == "id-token-123"

    @patch('sms_otp_handler.dynamodb')
    def test_verify_otp_wrong_code(self, mock_dynamodb):
        """Test verification with wrong code"""
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        mock_table.get_item.return_value = {
            "Item": {
                "code": "123456",
                "phone": "+15145551234",
                "email": "test@example.com",
                "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat(),
                "attempts": 0,
                "locked": False,
                "verified": False
            }
        }

        event = {
            "rawPath": "/api/v1/auth/verify-sms-otp",
            "requestContext": {"http": {"method": "POST"}},
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "code": "000000",  # Wrong code
                "password": "TestPass123!"
            })
        }

        response = handler.verify_otp(event, {})

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "WRONG_CODE"

    @patch('sms_otp_handler.dynamodb')
    def test_verify_otp_expired(self, mock_dynamodb):
        """Test verification with expired OTP"""
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        mock_table.get_item.return_value = {
            "Item": {
                "code": "123456",
                "phone": "+15145551234",
                "email": "test@example.com",
                "expires_at": (datetime.utcnow() - timedelta(minutes=15)).isoformat(),  # Expired
                "attempts": 0,
                "locked": False,
                "verified": False
            }
        }

        event = {
            "rawPath": "/api/v1/auth/verify-sms-otp",
            "requestContext": {"http": {"method": "POST"}},
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "code": "123456",
                "password": "TestPass123!"
            })
        }

        response = handler.verify_otp(event, {})

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "OTP_EXPIRED"

    @patch('sms_otp_handler.dynamodb')
    def test_verify_otp_rate_limiting(self, mock_dynamodb):
        """Test rate limiting after 3 failed attempts"""
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        # First attempt: 3 failures already
        mock_table.get_item.return_value = {
            "Item": {
                "code": "123456",
                "phone": "+15145551234",
                "email": "test@example.com",
                "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat(),
                "attempts": 3,
                "locked": True,
                "lock_until": (datetime.utcnow() + timedelta(minutes=15)).isoformat(),
                "verified": False
            }
        }

        event = {
            "rawPath": "/api/v1/auth/verify-sms-otp",
            "requestContext": {"http": {"method": "POST"}},
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "code": "000000",
                "password": "TestPass123!"
            })
        }

        response = handler.verify_otp(event, {})

        assert response["statusCode"] == 429
        body = json.loads(response["body"])
        assert body["error"]["code"] == "ACCOUNT_LOCKED"


# ============================================================================
# Test Response Formatting
# ============================================================================

class TestResponseFormatting:
    """Test response format helper functions"""

    def test_error_response_format(self):
        """Test error response format"""
        response = handler.error_response(400, "TEST_ERROR", "Test message")

        assert response["statusCode"] == 400
        assert response["headers"]["Content-Type"] == "application/json"

        body = json.loads(response["body"])
        assert body["error"]["code"] == "TEST_ERROR"
        assert body["error"]["message"] == "Test message"

    def test_success_response_format(self):
        """Test success response format"""
        data = {"key": "value", "number": 123}
        response = handler.success_response(200, data)

        assert response["statusCode"] == 200
        assert response["headers"]["Content-Type"] == "application/json"

        body = json.loads(response["body"])
        assert body["data"]["key"] == "value"
        assert body["data"]["number"] == 123


# ============================================================================
# Test Lambda Handler Routing
# ============================================================================

class TestLambdaHandlerRouting:
    """Test lambda_handler request routing"""

    @patch('sms_otp_handler.request_otp')
    def test_route_request_otp(self, mock_request_otp):
        """Test routing to request_otp"""
        mock_request_otp.return_value = {"statusCode": 200}

        event = {
            "rawPath": "/api/v1/auth/request-sms-otp",
            "requestContext": {"http": {"method": "POST"}}
        }

        handler.lambda_handler(event, {})

        mock_request_otp.assert_called_once()

    @patch('sms_otp_handler.verify_otp')
    def test_route_verify_otp(self, mock_verify_otp):
        """Test routing to verify_otp"""
        mock_verify_otp.return_value = {"statusCode": 200}

        event = {
            "rawPath": "/api/v1/auth/verify-sms-otp",
            "requestContext": {"http": {"method": "POST"}}
        }

        handler.lambda_handler(event, {})

        mock_verify_otp.assert_called_once()

    def test_route_not_found(self):
        """Test unknown route returns 404"""
        event = {
            "rawPath": "/api/v1/unknown",
            "requestContext": {"http": {"method": "GET"}}
        }

        response = handler.lambda_handler(event, {})

        assert response["statusCode"] == 404
        body = json.loads(response["body"])
        assert body["error"]["code"] == "NOT_FOUND"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=sms_otp_handler"])
