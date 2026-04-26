"""Unit tests for lambda_/handlers/verify_otp_handler.py"""

import json
import os
import sys
import time
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch, call
import pytest
import importlib

# Ensure backend is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("AURORA_SECRET_ARN", "arn:aws:secretsmanager:us-east-1:123:secret:test")
os.environ.setdefault("AURORA_DATABASE", "scamguard")
os.environ["JWT_SECRET"] = "test-secret-for-unit-tests"
os.environ.pop("JWT_SECRET_PARAM", None)  # force env-var path


# ---------------------------------------------------------------------------
# Helpers to build HTTP v2 events
# ---------------------------------------------------------------------------

def _make_event(method: str, path: str, body: dict | None = None) -> dict:
    event = {
        "rawPath": path,
        "requestContext": {
            "http": {"method": method, "path": path},
            "authorizer": {},
        },
        "headers": {},
    }
    if body is not None:
        event["body"] = json.dumps(body)
    return event


# ---------------------------------------------------------------------------
# Shared fixture: mock db + response module
# ---------------------------------------------------------------------------

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def _ok(data, status=200):
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps({"data": data}, default=str)}


def _error(status, code, message):
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps({"error": {"code": code, "message": message}})}


def _bad_request(message, code="BAD_REQUEST"):
    return _error(400, code, message)


def _unauthorized(message="Authentication required"):
    return _error(401, "UNAUTHORIZED", message)


def _internal(e):
    return _error(500, "INTERNAL_ERROR", str(e))


def _cors_preflight():
    return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}


def _get_method(event):
    rc = event.get("requestContext", {})
    m = rc.get("http", {}).get("method", "")
    return (m or event.get("httpMethod", "GET")).upper()


def _get_path(event):
    return (event.get("rawPath") or event.get("path") or "").rstrip("/")


def _parse_body(event):
    body = event.get("body") or "{}"
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, ValueError):
            return {}
    return body if isinstance(body, dict) else {}


def _not_found(resource="Resource"):
    return _error(404, "NOT_FOUND", f"{resource} not found")


@pytest.fixture()
def handler_module():
    """Load verify_otp_handler with db and response mocked."""
    mock_db = MagicMock()

    mock_response = MagicMock()
    mock_response.ok = _ok
    mock_response.bad_request = _bad_request
    mock_response.unauthorized = _unauthorized
    mock_response.internal = _internal
    mock_response.cors_preflight = _cors_preflight
    mock_response.get_method = _get_method
    mock_response.get_path = _get_path
    mock_response.parse_body = _parse_body
    mock_response.not_found = _not_found

    with patch.dict("sys.modules", {"db": mock_db, "response": mock_response}):
        # Remove cached module so patches apply cleanly
        for key in list(sys.modules.keys()):
            if "verify_otp_handler" in key and "lambda_.handlers" in key:
                del sys.modules[key]

        from lambda_.handlers import verify_otp_handler

        # Inject mocks into already-imported module namespace
        verify_otp_handler.db = mock_db
        verify_otp_handler.ok = _ok
        verify_otp_handler.bad_request = _bad_request
        verify_otp_handler.unauthorized = _unauthorized
        verify_otp_handler.internal = _internal
        verify_otp_handler.cors_preflight = _cors_preflight
        verify_otp_handler.get_method = _get_method
        verify_otp_handler.get_path = _get_path
        verify_otp_handler.parse_body = _parse_body
        verify_otp_handler.not_found = _not_found

        yield verify_otp_handler, mock_db


# ---------------------------------------------------------------------------
# Valid OTP helper
# ---------------------------------------------------------------------------

def _future_expires_at():
    return datetime.now(timezone.utc) + timedelta(minutes=5)


def _expired_at():
    return datetime.now(timezone.utc) - timedelta(minutes=1)


# ===========================================================================
# Test: generate_jwt  (pure logic — no mocks needed)
# ===========================================================================

class TestGenerateJWT:

    def test_jwt_structure(self, handler_module):
        mod, _ = handler_module
        token = mod.generate_jwt("user-1", "fam-1", "family")
        parts = token.split(".")
        assert len(parts) == 3, "JWT must be header.payload.sig"

    def test_jwt_payload_claims(self, handler_module):
        mod, _ = handler_module
        user_id = "user-abc"
        family_id = "fam-xyz"
        role = "senior"
        token = mod.generate_jwt(user_id, family_id, role)
        payload = mod.verify_jwt(token)
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["family_id"] == family_id
        assert payload["role"] == role
        assert "exp" in payload
        assert "iat" in payload

    def test_jwt_verify_invalid_signature(self, handler_module):
        mod, _ = handler_module
        token = mod.generate_jwt("u", "f", "family")
        # Tamper with the signature
        parts = token.split(".")
        tampered = parts[0] + "." + parts[1] + ".badsig"
        assert mod.verify_jwt(tampered) is None

    def test_jwt_verify_expired(self, handler_module):
        mod, _ = handler_module
        # Build a token whose exp is in the past.
        # JWT_EXPIRY_HOURS is 24h, so issue the token 25 hours ago so exp < now.
        past = int(time.time()) - (25 * 3600)
        with patch(f"{mod.__name__}.time") as mock_time:
            mock_time.time.return_value = past
            token = mod.generate_jwt("u", None, None)
        # Verify against real current time — exp (past + 24h) is now in the past
        assert mod.verify_jwt(token) is None

    def test_jwt_null_family_allowed(self, handler_module):
        mod, _ = handler_module
        token = mod.generate_jwt("user-no-family", None, None)
        payload = mod.verify_jwt(token)
        assert payload is not None
        assert payload["family_id"] is None
        assert payload["role"] is None


# ===========================================================================
# Test: Valid OTP → JWT returned
# ===========================================================================

class TestHandleVerifyOTP:

    def test_valid_otp_returns_jwt(self, handler_module):
        mod, mock_db = handler_module
        user_id = "user-111"

        mock_db.execute_one.side_effect = [
            # _get_otp
            {"code": "1234", "expires_at": _future_expires_at(), "attempts": 0},
            # _get_user_and_family → user lookup
            {"user_id": user_id},
            # _get_user_and_family → family lookup
            {"family_id": "fam-001", "role": "family"},
        ]
        mock_db.execute_write = MagicMock()

        event = _make_event("POST", "/api/v1/auth/verify-otp", {"phone": "5141234567", "code": "1234"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert "token" in body["data"]
        assert body["data"]["user_id"] == user_id
        assert body["data"]["family_id"] == "fam-001"
        assert body["data"]["role"] == "family"

        # Token should be verifiable
        payload = mod.verify_jwt(body["data"]["token"])
        assert payload is not None
        assert payload["sub"] == user_id

    def test_valid_otp_user_not_in_family(self, handler_module):
        mod, mock_db = handler_module
        user_id = "user-222"

        mock_db.execute_one.side_effect = [
            {"code": "9999", "expires_at": _future_expires_at(), "attempts": 0},
            {"user_id": user_id},
            None,  # no family membership
        ]
        mock_db.execute_write = MagicMock()

        event = _make_event("POST", "/api/v1/auth/verify-otp", {"phone": "5141234568", "code": "9999"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["data"]["family_id"] is None
        assert body["data"]["role"] is None

    def test_valid_otp_new_user_provisioned(self, handler_module):
        mod, mock_db = handler_module

        mock_db.execute_one.side_effect = [
            {"code": "5678", "expires_at": _future_expires_at(), "attempts": 0},
            None,   # user not found → provision
            None,   # no family membership
        ]
        mock_db.execute_write = MagicMock()

        event = _make_event("POST", "/api/v1/auth/verify-otp", {"phone": "5141239999", "code": "5678"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["data"]["user_id"] is not None
        # execute_write called at least once (INSERT users + delete OTP)
        assert mock_db.execute_write.call_count >= 2

    def test_verify_sms_otp_alias_works(self, handler_module):
        """POST /api/v1/auth/verify-sms-otp should also work."""
        mod, mock_db = handler_module
        mock_db.execute_one.side_effect = [
            {"code": "1111", "expires_at": _future_expires_at(), "attempts": 0},
            {"user_id": "user-alias"},
            None,
        ]
        mock_db.execute_write = MagicMock()

        event = _make_event("POST", "/api/v1/auth/verify-sms-otp", {"phone": "5140000001", "code": "1111"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 200


# ===========================================================================
# Test: Invalid OTP → 401 Unauthorized
# ===========================================================================

class TestInvalidOTP:

    def test_wrong_code_returns_401(self, handler_module):
        mod, mock_db = handler_module

        mock_db.execute_one.side_effect = [
            {"code": "1234", "expires_at": _future_expires_at(), "attempts": 0},
        ]
        mock_db.execute_write = MagicMock()

        event = _make_event("POST", "/api/v1/auth/verify-otp", {"phone": "5141230000", "code": "9999"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 401

    def test_wrong_code_increments_attempts(self, handler_module):
        mod, mock_db = handler_module

        mock_db.execute_one.return_value = {"code": "1234", "expires_at": _future_expires_at(), "attempts": 0}
        mock_db.execute_write = MagicMock()

        event = _make_event("POST", "/api/v1/auth/verify-otp", {"phone": "5141230001", "code": "0000"})
        mod.lambda_handler(event, None)

        # execute_write should be called for incrementing attempts
        mock_db.execute_write.assert_called()

    def test_expired_otp_returns_400(self, handler_module):
        mod, mock_db = handler_module

        mock_db.execute_one.return_value = {"code": "1234", "expires_at": _expired_at(), "attempts": 0}
        mock_db.execute_write = MagicMock()

        event = _make_event("POST", "/api/v1/auth/verify-otp", {"phone": "5141230002", "code": "1234"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert body["error"]["code"] == "OTP_EXPIRED"

    def test_too_many_attempts_returns_400(self, handler_module):
        mod, mock_db = handler_module

        mock_db.execute_one.return_value = {
            "code": "1234",
            "expires_at": _future_expires_at(),
            "attempts": 3,  # at the limit
        }
        mock_db.execute_write = MagicMock()

        event = _make_event("POST", "/api/v1/auth/verify-otp", {"phone": "5141230003", "code": "1234"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert body["error"]["code"] == "TOO_MANY_ATTEMPTS"

    def test_no_otp_record_returns_400(self, handler_module):
        mod, mock_db = handler_module

        mock_db.execute_one.return_value = None  # no OTP found

        event = _make_event("POST", "/api/v1/auth/verify-otp", {"phone": "5141230004", "code": "1234"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert body["error"]["code"] == "OTP_NOT_FOUND"


# ===========================================================================
# Test: Missing/invalid inputs → 400 Bad Request
# ===========================================================================

class TestMissingInputs:

    def test_missing_family_id_is_ok(self, handler_module):
        """family_id is optional — handler should succeed without it."""
        mod, mock_db = handler_module

        mock_db.execute_one.side_effect = [
            {"code": "1234", "expires_at": _future_expires_at(), "attempts": 0},
            {"user_id": "user-333"},
            None,  # no family
        ]
        mock_db.execute_write = MagicMock()

        # No family_id in body
        event = _make_event("POST", "/api/v1/auth/verify-otp", {"phone": "5141230005", "code": "1234"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["data"]["family_id"] is None

    def test_missing_phone_returns_400(self, handler_module):
        mod, _ = handler_module

        event = _make_event("POST", "/api/v1/auth/verify-otp", {"code": "1234"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert body["error"]["code"] == "MISSING_PHONE"

    def test_missing_code_returns_400(self, handler_module):
        mod, _ = handler_module

        event = _make_event("POST", "/api/v1/auth/verify-otp", {"phone": "5141230006"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert body["error"]["code"] == "MISSING_CODE"

    def test_invalid_phone_format_returns_400(self, handler_module):
        mod, _ = handler_module

        event = _make_event("POST", "/api/v1/auth/verify-otp", {"phone": "123", "code": "1234"})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert body["error"]["code"] == "INVALID_PHONE"

    def test_empty_body_returns_400(self, handler_module):
        mod, _ = handler_module

        event = _make_event("POST", "/api/v1/auth/verify-otp", {})
        resp = mod.lambda_handler(event, None)

        assert resp["statusCode"] == 400


# ===========================================================================
# Test: CORS
# ===========================================================================

class TestCORS:

    def test_options_preflight_returns_200(self, handler_module):
        mod, _ = handler_module
        event = _make_event("OPTIONS", "/api/v1/auth/verify-otp")
        resp = mod.lambda_handler(event, None)
        assert resp["statusCode"] == 200
        assert "Access-Control-Allow-Origin" in resp.get("headers", {})

    def test_unknown_route_returns_404(self, handler_module):
        mod, _ = handler_module
        event = _make_event("GET", "/api/v1/auth/verify-otp")
        resp = mod.lambda_handler(event, None)
        assert resp["statusCode"] == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
