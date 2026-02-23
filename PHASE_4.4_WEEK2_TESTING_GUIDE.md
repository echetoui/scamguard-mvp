# 🧪 Phase 4.4 Week 2 - Backend Testing Guide

**Date:** 23 février 2026
**Status:** Backend Testing Phase
**Branch:** feature/phase-4.4
**Target:** 90%+ Code Coverage

---

## 📋 Test Structure

```
backend/
├── lambda/
│   ├── sms_otp_handler.py       # Main handler (700+ lines)
│   └── requirements.txt           # Dependencies
└── tests/
    ├── test_sms_otp_handler.py   # Unit & integration tests (NEW)
    ├── test_phone_validation.py   # Phone validation tests (NEW)
    └── conftest.py                # Pytest fixtures (NEW)
```

---

## 🔧 Step 1: Setup Testing Environment

### 1.1 Install Testing Dependencies

```bash
# Install test dependencies
pip install pytest pytest-cov pytest-mock pytest-asyncio moto

# moto = Mock AWS services for testing
# pytest-mock = Mock external dependencies
# pytest-cov = Code coverage reports
```

### 1.2 Update requirements-dev.txt

```bash
# Create development requirements
cat > backend/requirements-dev.txt <<'EOF'
pytest==7.4.0
pytest-cov==4.1.0
pytest-mock==3.11.1
moto==4.1.14
boto3==1.34.0
requests==2.32.0
python-dotenv==1.0.1
pyotp==2.9.0
phonenumbers==8.13.34
EOF

# Install dev dependencies
pip install -r backend/requirements-dev.txt
```

---

## ✅ Step 2: Unit Tests for Phone Validation

Create `backend/tests/test_phone_validation.py`:

```python
"""Tests for phone number validation."""

import pytest
from sms_otp_handler import validate_phone_number


class TestPhoneValidation:
    """Test phone number validation."""

    def test_valid_e164_format(self):
        """Test valid E.164 format."""
        assert validate_phone_number("+15145551234") is True
        assert validate_phone_number("+33123456789") is True
        assert validate_phone_number("+447911123456") is True

    def test_invalid_format_no_plus(self):
        """Test invalid format without +."""
        assert validate_phone_number("15145551234") is False
        assert validate_phone_number("5145551234") is False

    def test_invalid_format_letters(self):
        """Test invalid format with letters."""
        assert validate_phone_number("+1514555ABCD") is False

    def test_invalid_length_too_short(self):
        """Test invalid length too short."""
        assert validate_phone_number("+1") is False
        assert validate_phone_number("+514") is False

    def test_invalid_length_too_long(self):
        """Test invalid length too long."""
        assert validate_phone_number("+151455512341234567890") is False

    def test_empty_string(self):
        """Test empty string."""
        assert validate_phone_number("") is False

    def test_none_value(self):
        """Test None value."""
        assert validate_phone_number(None) is False

    def test_special_characters(self):
        """Test format with spaces and dashes."""
        # Should only accept pure E.164
        assert validate_phone_number("+1 (514) 555-1234") is False
        assert validate_phone_number("+1-514-555-1234") is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

**Run tests:**
```bash
pytest backend/tests/test_phone_validation.py -v
```

**Expected output:**
```
test_phone_validation.py::TestPhoneValidation::test_valid_e164_format PASSED
test_phone_validation.py::TestPhoneValidation::test_invalid_format_no_plus PASSED
...
==================== 9 passed in 0.15s ====================
```

---

## ✅ Step 3: Unit Tests for OTP Generation

Add to `backend/tests/test_sms_otp_handler.py`:

```python
"""Tests for SMS OTP handler."""

import pytest
from unittest.mock import Mock, patch, MagicMock
from sms_otp_handler import (
    generate_otp,
    validate_phone_number,
    error_response,
    success_response
)


class TestOTPGeneration:
    """Test OTP generation."""

    def test_otp_format(self):
        """Test OTP is 6 digits."""
        otp = generate_otp()
        assert len(otp) == 6
        assert otp.isdigit()

    def test_otp_randomness(self):
        """Test OTP generation produces different values."""
        otps = [generate_otp() for _ in range(10)]
        # At least 8 unique values (very unlikely to be same)
        assert len(set(otps)) >= 8

    def test_otp_no_leading_zeros_allowed(self):
        """Test OTP can start with zeros (valid)."""
        # Run multiple times to catch edge case
        for _ in range(100):
            otp = generate_otp()
            assert len(otp) == 6
            assert otp.isdigit()


class TestResponseFormatting:
    """Test error and success response formatting."""

    def test_error_response_format(self):
        """Test error response structure."""
        response = error_response(400, "INVALID_PHONE", "Phone format error")

        assert response["statusCode"] == 400
        assert "error" in response["body"]
        assert response["headers"]["Content-Type"] == "application/json"

    def test_success_response_format(self):
        """Test success response structure."""
        data = {"message": "OTP sent"}
        response = success_response(200, data)

        assert response["statusCode"] == 200
        assert "data" in response["body"]
        assert response["headers"]["Content-Type"] == "application/json"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

---

## ✅ Step 4: Integration Tests - Request OTP

Add to `backend/tests/test_sms_otp_handler.py`:

```python
"""Integration tests for request_otp endpoint."""

import json
from unittest.mock import patch, MagicMock
import pytest
from sms_otp_handler import request_otp


class TestRequestOTP:
    """Test POST /auth/request-sms-otp endpoint."""

    @patch('sms_otp_handler.cognito_client')
    @patch('sms_otp_handler.send_sms_otp')
    @patch('sms_otp_handler.store_otp')
    def test_request_otp_success(self, mock_store, mock_send_sms, mock_cognito):
        """Test successful OTP request."""
        # Setup mocks
        mock_store.return_value = True
        mock_send_sms.return_value = True
        mock_cognito.sign_up.return_value = {"UserSub": "user-123"}

        # Create event
        event = {
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "password": "TestPass123!"
            })
        }

        # Call handler
        response = request_otp(event, None)

        # Assert
        assert response["statusCode"] == 200
        assert "data" in json.loads(response["body"])
        data = json.loads(response["body"])["data"]
        assert "message" in data
        assert "expires_in" in data
        assert "phone_masked" in data
        assert data["phone_masked"] == "+1514****1234"

    @patch('sms_otp_handler.store_otp')
    def test_request_otp_invalid_phone(self, mock_store):
        """Test OTP request with invalid phone format."""
        event = {
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "514-555-1234",  # Invalid format
                "password": "TestPass123!"
            })
        }

        response = request_otp(event, None)

        assert response["statusCode"] == 400
        data = json.loads(response["body"])
        assert data["error"]["code"] == "INVALID_PHONE"

    def test_request_otp_missing_fields(self):
        """Test OTP request with missing fields."""
        event = {
            "body": json.dumps({
                "email": "test@example.com"
                # Missing phone and password
            })
        }

        response = request_otp(event, None)

        assert response["statusCode"] == 400
        data = json.loads(response["body"])
        assert data["error"]["code"] == "MISSING_FIELDS"

    @patch('sms_otp_handler.cognito_client')
    @patch('sms_otp_handler.send_sms_otp')
    @patch('sms_otp_handler.store_otp')
    def test_request_otp_sms_failure(self, mock_store, mock_send_sms, mock_cognito):
        """Test OTP request when SMS delivery fails."""
        mock_store.return_value = True
        mock_send_sms.return_value = False  # SMS delivery failed
        mock_cognito.sign_up.return_value = {"UserSub": "user-123"}

        event = {
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "password": "TestPass123!"
            })
        }

        response = request_otp(event, None)

        assert response["statusCode"] == 500
        data = json.loads(response["body"])
        assert data["error"]["code"] == "SMS_DELIVERY_ERROR"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

**Run tests:**
```bash
pytest backend/tests/test_sms_otp_handler.py::TestRequestOTP -v
```

---

## ✅ Step 5: Integration Tests - Verify OTP

Add to `backend/tests/test_sms_otp_handler.py`:

```python
"""Integration tests for verify_otp endpoint."""


class TestVerifyOTP:
    """Test POST /auth/verify-sms-otp endpoint."""

    @patch('sms_otp_handler.cognito_client')
    @patch('sms_otp_handler.dynamodb')
    def test_verify_otp_success(self, mock_dynamodb, mock_cognito):
        """Test successful OTP verification."""
        # Mock DynamoDB response
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {
            "Item": {
                "code": "123456",
                "expires_at": "2026-02-24T12:00:00",
                "locked": False,
                "attempts": 0
            }
        }

        # Mock Cognito responses
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

        # Create event
        event = {
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "code": "123456",
                "password": "TestPass123!"
            })
        }

        # Call handler
        from sms_otp_handler import verify_otp
        response = verify_otp(event, None)

        # Assert
        assert response["statusCode"] == 200
        data = json.loads(response["body"])["data"]
        assert data["status"] == "VERIFIED"
        assert "id_token" in data
        assert "access_token" in data
        assert "refresh_token" in data

    @patch('sms_otp_handler.dynamodb')
    def test_verify_otp_invalid_code(self, mock_dynamodb):
        """Test OTP verification with wrong code."""
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {
            "Item": {
                "code": "123456",
                "expires_at": "2026-02-24T12:00:00",
                "locked": False,
                "attempts": 0
            }
        }

        event = {
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "code": "000000",  # Wrong code
                "password": "TestPass123!"
            })
        }

        from sms_otp_handler import verify_otp
        response = verify_otp(event, None)

        assert response["statusCode"] == 400
        data = json.loads(response["body"])
        assert data["error"]["code"] == "WRONG_CODE"

    @patch('sms_otp_handler.dynamodb')
    def test_verify_otp_rate_limiting(self, mock_dynamodb):
        """Test account lockout after max attempts."""
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {
            "Item": {
                "code": "123456",
                "expires_at": "2026-02-24T12:00:00",
                "locked": False,
                "attempts": 3  # Already 3 failed attempts
            }
        }

        event = {
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "code": "000000",  # Wrong code (4th attempt)
                "password": "TestPass123!"
            })
        }

        from sms_otp_handler import verify_otp
        response = verify_otp(event, None)

        # Should lock after attempt 3 (>=MAX_ATTEMPTS which is 3)
        assert response["statusCode"] == 429
        data = json.loads(response["body"])
        assert data["error"]["code"] == "ACCOUNT_LOCKED"

    @patch('sms_otp_handler.dynamodb')
    def test_verify_otp_expired(self, mock_dynamodb):
        """Test OTP verification with expired code."""
        from datetime import datetime, timedelta

        # Set expiry in the past
        past_time = (datetime.utcnow() - timedelta(minutes=15)).isoformat()

        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {
            "Item": {
                "code": "123456",
                "expires_at": past_time,
                "locked": False,
                "attempts": 0
            }
        }

        event = {
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "code": "123456",
                "password": "TestPass123!"
            })
        }

        from sms_otp_handler import verify_otp
        response = verify_otp(event, None)

        assert response["statusCode"] == 400
        data = json.loads(response["body"])
        assert data["error"]["code"] == "OTP_EXPIRED"

    @patch('sms_otp_handler.dynamodb')
    def test_verify_otp_account_locked(self, mock_dynamodb):
        """Test OTP verification with locked account."""
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {
            "Item": {
                "code": "123456",
                "expires_at": "2026-02-24T12:00:00",
                "locked": True,  # Account is locked
                "lock_until": "2026-02-23T22:15:00"
            }
        }

        event = {
            "body": json.dumps({
                "email": "test@example.com",
                "phone": "+15145551234",
                "code": "123456",
                "password": "TestPass123!"
            })
        }

        from sms_otp_handler import verify_otp
        response = verify_otp(event, None)

        assert response["statusCode"] == 429
        data = json.loads(response["body"])
        assert data["error"]["code"] == "ACCOUNT_LOCKED"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

---

## ✅ Step 6: Run All Tests with Coverage

```bash
# Run all tests with coverage report
pytest backend/tests/ -v --cov=backend/lambda/sms_otp_handler --cov-report=html --cov-report=term

# Expected output:
# ============ test session starts ============
# collected 25 items
#
# test_phone_validation.py::... PASSED                   [36%]
# test_sms_otp_handler.py::... PASSED                    [72%]
# ...
# ============ 25 passed in 1.23s ============
#
# Name                      Stmts   Miss  Cover
# -----------------------------------------------
# sms_otp_handler.py         312    28   91%
```

---

## 🎯 Coverage Targets

| Function | Target Coverage | Notes |
|----------|-----------------|-------|
| `validate_phone_number` | 100% | All edge cases tested |
| `generate_otp` | 100% | Randomness verified |
| `send_sms_otp` | 85% | AWS SDK mocked |
| `store_otp` | 90% | DynamoDB mocked |
| `request_otp` | 90% | All paths tested |
| `verify_otp` | 85% | Rate limiting tested |
| **Overall** | **90%** | Target for Phase 4.4 |

---

## 📊 Test Execution Checklist

- [ ] Test environment installed (pytest, moto, etc.)
- [ ] Phone validation tests pass (9/9)
- [ ] OTP generation tests pass (3/3)
- [ ] Response formatting tests pass (2/2)
- [ ] Request OTP tests pass (4/4)
- [ ] Verify OTP tests pass (5/5)
- [ ] Overall coverage >= 90%
- [ ] All error cases tested
- [ ] Rate limiting verified
- [ ] Audit logging verified

---

## 🐛 Common Test Issues

### Issue: Mock objects not working

```python
# ✅ Correct: Patch at usage point
@patch('sms_otp_handler.dynamodb')

# ❌ Wrong: Patch at import point
@patch('boto3.resource')
```

### Issue: datetime comparison fails

```python
# ✅ Correct: Use string ISO format
"expires_at": "2026-02-24T12:00:00"

# Then mock returns this without parsing
mock_table.get_item.return_value = {
    "Item": {
        "expires_at": "2026-02-24T12:00:00"
    }
}
```

### Issue: JSON parsing in event

```python
# ✅ Correct: Body is JSON string
event = {
    "body": json.dumps({...})
}

# Handler code expects:
body = json.loads(event.get("body", "{}"))
```

---

## 🚀 Run Tests in CI/CD

```bash
# For GitHub Actions or similar:
- name: Run SMS OTP Tests
  run: |
    cd backend
    pip install -r requirements-dev.txt
    pytest tests/ -v --cov=lambda/sms_otp_handler --cov-report=xml

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./backend/coverage.xml
```

---

## 📝 Next Steps

After testing is complete:

1. **Commit test code**
   ```bash
   git add backend/tests/
   git commit -m "test(phase-4.4): add SMS OTP backend unit and integration tests"
   ```

2. **Frontend integration** (Step 7)
   - Add SMSAuthScreen to App.jsx
   - Update routing
   - Test component render and OTP input

3. **End-to-end testing**
   - Test signup flow
   - Test login flow
   - Verify tokens stored
   - Check redirect behavior

---

**Status:** 🧪 Testing Phase Ready
**Created:** 23 février 2026
**Branch:** feature/phase-4.4

**Next:** Create test files and run pytest
