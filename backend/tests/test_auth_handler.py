"""Tests for authentication handlers (signup, verify, login)."""

import json
import pytest
from unittest.mock import patch, MagicMock
from lambda_.auth_handler import (
    post_signup,
    post_verify_email,
    post_resend_code,
    post_login,
    post_logout,
)


@pytest.fixture
def lambda_context():
    """Mock Lambda context."""
    context = MagicMock()
    context.aws_request_id = "test-trace-id"
    return context


@pytest.fixture
def auth_event_base():
    """Base authentication event."""
    return {
        "requestContext": {
            "authorizer": {
                "claims": {
                    "sub": "test-user-id"
                }
            }
        },
        "headers": {"X-Request-ID": "req-123"},
        "body": "{}",
    }


class TestSignup:
    """Test signup handler."""

    def test_signup_success(self, lambda_context):
        """Test successful signup."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "test@example.com",
                "password": "SecurePass123!",
            }),
        }

        with patch("lambda_.auth_handler.cognito_client") as mock_cognito:
            with patch("lambda_.auth_handler.table") as mock_table:
                mock_cognito.sign_up.return_value = {"UserSub": "user-123"}

                response = post_signup(event, lambda_context)

                assert response["statusCode"] == 201
                body = json.loads(response["body"])
                assert body["data"]["user_id"] == "user-123"
                assert body["data"]["status"] == "PENDING_VERIFICATION"

    def test_signup_invalid_email(self, lambda_context):
        """Test signup with invalid email."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "invalid-email",
                "password": "SecurePass123!",
            }),
        }

        response = post_signup(event, lambda_context)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "INVALID_EMAIL"

    def test_signup_weak_password(self, lambda_context):
        """Test signup with weak password."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "test@example.com",
                "password": "weak",
            }),
        }

        response = post_signup(event, lambda_context)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "WEAK_PASSWORD"

    def test_signup_email_exists(self, lambda_context):
        """Test signup with existing email."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "existing@example.com",
                "password": "SecurePass123!",
            }),
        }

        with patch("lambda_.auth_handler.cognito_client") as mock_cognito:
            mock_cognito.sign_up.side_effect = (
                mock_cognito.exceptions.UsernameExistsException()
            )

            response = post_signup(event, lambda_context)

            assert response["statusCode"] == 400
            body = json.loads(response["body"])
            assert body["error"]["code"] == "EMAIL_EXISTS"


class TestVerifyEmail:
    """Test email verification handler."""

    def test_verify_email_success(self, lambda_context):
        """Test successful email verification."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "test@example.com",
                "code": "123456",
            }),
        }

        with patch("lambda_.auth_handler.cognito_client") as mock_cognito:
            with patch("lambda_.auth_handler.table") as mock_table:
                mock_cognito.admin_get_user.return_value = {
                    "Username": "user-123"
                }

                response = post_verify_email(event, lambda_context)

                assert response["statusCode"] == 200
                body = json.loads(response["body"])
                assert body["data"]["status"] == "VERIFIED"

    def test_verify_email_invalid_code(self, lambda_context):
        """Test verification with invalid code."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "test@example.com",
                "code": "wrong-code",
            }),
        }

        with patch("lambda_.auth_handler.cognito_client") as mock_cognito:
            mock_cognito.confirm_sign_up.side_effect = (
                mock_cognito.exceptions.CodeMismatchException()
            )

            response = post_verify_email(event, lambda_context)

            assert response["statusCode"] == 400
            body = json.loads(response["body"])
            assert body["error"]["code"] == "CODE_INVALID"

    def test_verify_email_expired_code(self, lambda_context):
        """Test verification with expired code."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "test@example.com",
                "code": "expired-code",
            }),
        }

        with patch("lambda_.auth_handler.cognito_client") as mock_cognito:
            mock_cognito.confirm_sign_up.side_effect = (
                mock_cognito.exceptions.ExpiredCodeException()
            )

            response = post_verify_email(event, lambda_context)

            assert response["statusCode"] == 400
            body = json.loads(response["body"])
            assert body["error"]["code"] == "CODE_EXPIRED"


class TestResendCode:
    """Test resend verification code handler."""

    def test_resend_code_success(self, lambda_context):
        """Test successful code resend."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "test@example.com",
            }),
        }

        with patch("lambda_.auth_handler.cognito_client") as mock_cognito:
            response = post_resend_code(event, lambda_context)

            assert response["statusCode"] == 200
            body = json.loads(response["body"])
            assert "Verification code sent" in body["data"]["message"]

    def test_resend_code_rate_limited(self, lambda_context):
        """Test resend with rate limiting."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "test@example.com",
            }),
        }

        with patch("lambda_.auth_handler.cognito_client") as mock_cognito:
            mock_cognito.resend_confirmation_code.side_effect = (
                mock_cognito.exceptions.TooManyRequestsException()
            )

            response = post_resend_code(event, lambda_context)

            assert response["statusCode"] == 429


class TestLogin:
    """Test login handler."""

    def test_login_success(self, lambda_context):
        """Test successful login."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "test@example.com",
                "password": "SecurePass123!",
            }),
        }

        with patch("lambda_.auth_handler.cognito_client") as mock_cognito:
            mock_cognito.initiate_auth.return_value = {
                "AuthenticationResult": {
                    "IdToken": "id-token-123",
                    "AccessToken": "access-token-123",
                    "RefreshToken": "refresh-token-123",
                    "ExpiresIn": 3600,
                }
            }
            mock_cognito.admin_get_user.return_value = {
                "UserAttributes": [
                    {"Name": "email_verified", "Value": "true"}
                ]
            }

            response = post_login(event, lambda_context)

            assert response["statusCode"] == 200
            body = json.loads(response["body"])
            assert "id_token" in body["data"]
            assert "access_token" in body["data"]

    def test_login_email_not_verified(self, lambda_context):
        """Test login with unverified email."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "test@example.com",
                "password": "SecurePass123!",
            }),
        }

        with patch("lambda_.auth_handler.cognito_client") as mock_cognito:
            mock_cognito.initiate_auth.return_value = {
                "AuthenticationResult": {
                    "IdToken": "id-token-123",
                    "AccessToken": "access-token-123",
                    "ExpiresIn": 3600,
                }
            }
            mock_cognito.admin_get_user.return_value = {
                "UserAttributes": [
                    {"Name": "email_verified", "Value": "false"}
                ]
            }

            response = post_login(event, lambda_context)

            assert response["statusCode"] == 400
            body = json.loads(response["body"])
            assert body["error"]["code"] == "COGNITO_EMAIL_NOT_VERIFIED"

    def test_login_invalid_credentials(self, lambda_context):
        """Test login with invalid credentials."""
        event = {
            "headers": {"X-Request-ID": "req-123"},
            "body": json.dumps({
                "email": "test@example.com",
                "password": "wrong-password",
            }),
        }

        with patch("lambda_.auth_handler.cognito_client") as mock_cognito:
            mock_cognito.initiate_auth.side_effect = (
                mock_cognito.exceptions.NotAuthorizedException()
            )

            response = post_login(event, lambda_context)

            assert response["statusCode"] == 400
            body = json.loads(response["body"])
            assert body["error"]["code"] == "INVALID_CREDENTIALS"


class TestLogout:
    """Test logout handler."""

    def test_logout_success(self, lambda_context, auth_event_base):
        """Test successful logout."""
        response = post_logout(auth_event_base, lambda_context)

        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert "Logged out successfully" in body["data"]["message"]

    def test_logout_unauthorized(self, lambda_context):
        """Test logout without authentication."""
        event = {
            "requestContext": {},
            "headers": {"X-Request-ID": "req-123"},
        }

        response = post_logout(event, lambda_context)

        assert response["statusCode"] == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
