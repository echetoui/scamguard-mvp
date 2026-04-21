# SEC.4 - API Endpoints Reference

## Modified Endpoints

### POST /api/v1/auth/request-sms-otp
**Changes:** Added IP tracking, account lockout check

```
Request:
  POST /api/v1/auth/request-sms-otp
  Content-Type: application/json
  
  {
    "phone": "5551234567"
  }

Response (200):
  {
    "data": {
      "message": "OTP sent to your phone number.",
      "phone_masked": "***4567",
      "otp": "1234",           // Dev only
      "sms_sent": true
    }
  }

Response (429 - Account Locked):
  {
    "error": {
      "code": "ACCOUNT_LOCKED",
      "message": "Account is temporarily locked due to too many failed attempts. Try again in 30 minutes."
    }
  }

New Header:
  X-RateLimit-Limit: 10
  X-RateLimit-Remaining: 9
```

**Security:**
- Account lockout check (max 5 failed attempts in 30 min)
- IP tracking for debugging
- Rate limiting: 10 requests/minute per IP

---

### POST /api/v1/auth/verify-sms-otp
**Changes:** Added failed attempt tracking, session token creation

```
Request:
  POST /api/v1/auth/verify-sms-otp
  Content-Type: application/json
  
  {
    "phone": "5551234567",
    "code": "1234"
  }

Response (200):
  {
    "data": {
      "user_id": "user_abc123",
      "phone_number": "5551234567",
      "token": "base64_encoded_token",
      "session_token": "hex_session_token_32_bytes",  // NEW
      "message": "SMS OTP verified successfully."
    }
  }

Response (429 - Account Locked):
  {
    "error": {
      "code": "ACCOUNT_LOCKED",
      "message": "Account is temporarily locked..."
    }
  }

Response (429 - Too Many Attempts):
  {
    "error": {
      "code": "TOO_MANY_ATTEMPTS",
      "message": "Too many failed attempts. Please request a new code."
    }
  }

Response (400 - Invalid OTP):
  {
    "error": {
      "code": "INVALID_OTP",
      "message": "Incorrect OTP code."
    }
  }
```

**Security:**
- Tracks failed attempts (max 3 per OTP)
- Records failed login attempts (max 5 in 30 min triggers lockout)
- Clears failed attempts on success
- Creates session token valid for 24 hours
- Returns session_token for all future authenticated requests

---

## New Endpoints

### POST /api/v1/auth/request-password-reset
**Purpose:** Request a password reset token

```
Request:
  POST /api/v1/auth/request-password-reset
  Content-Type: application/json
  
  {
    "phone": "5551234567"
  }

Response (200):
  {
    "data": {
      "message": "If an account with this phone number exists, a password reset link will be sent.",
      "phone_masked": "***4567",
      "reset_token": "a1b2c3d4..."  // Dev only, production sends via SMS
    }
  }

Response (400):
  {
    "error": {
      "code": "INVALID_PHONE",
      "message": "Valid phone number is required."
    }
  }
```

**Security:**
- Doesn't reveal if account exists (prevents account enumeration)
- Token expires in 15 minutes
- Token is single-use
- Rate limited: 10 requests/minute
- IP tracked

---

### POST /api/v1/auth/reset-password
**Purpose:** Reset password using token

```
Request:
  POST /api/v1/auth/reset-password
  Content-Type: application/json
  
  {
    "reset_token": "a1b2c3d4...",
    "new_password": "secure_password_123"
  }

Response (200):
  {
    "data": {
      "message": "Password has been reset successfully.",
      "user_id": "user_abc123"
    }
  }

Response (400 - Invalid Token):
  {
    "error": {
      "code": "INVALID_RESET_TOKEN",
      "message": "Token not found"
    }
  }

Response (400 - Expired Token):
  {
    "error": {
      "code": "INVALID_RESET_TOKEN",
      "message": "Token expired"
    }
  }

Response (400 - Reused Token):
  {
    "error": {
      "code": "INVALID_RESET_TOKEN",
      "message": "Token already used"
    }
  }
```

**Security:**
- One-time use only
- 15-minute expiration
- Clears failed login attempts on success
- Rate limited: 10 requests/minute
- Prevents token reuse

---

### POST /api/v1/auth/validate-session
**Purpose:** Validate current session and check for IP changes

```
Request:
  POST /api/v1/auth/validate-session
  Content-Type: application/json
  
  {
    "session_token": "hex_session_token..."
  }

Response (200):
  {
    "data": {
      "valid": true,
      "user_id": "user_abc123",
      "phone": "5551234567",
      "last_activity": 1713274800000,
      "expires_at": 1713361200000,
      "user": {
        "id": "user_abc123",
        "phone": "5551234567",
        "verified": true,
        "createdAt": "2026-04-16T12:00:00.000Z"
      }
    }
  }

Response (401 - Invalid Session):
  {
    "error": {
      "code": "INVALID_SESSION",
      "message": "Session is invalid or expired."
    }
  }
```

**Security:**
- Validates token signature and expiry
- Updates last activity timestamp
- Detects IP changes (logs but doesn't block)
- Used to enforce session lifetime
- Rate limited: 10 requests/minute

---

### POST /api/v1/auth/refresh-session
**Purpose:** Extend session validity by 24 hours

```
Request:
  POST /api/v1/auth/refresh-session
  Content-Type: application/json
  
  {
    "session_token": "hex_session_token..."
  }

Response (200):
  {
    "data": {
      "message": "Session refreshed successfully.",
      "expires_at": 1713534000000
    }
  }

Response (401):
  {
    "error": {
      "code": "INVALID_SESSION",
      "message": "Session not found."
    }
  }
```

**Security:**
- Extends session validity (prevents forced logout)
- Only works with valid tokens
- Rate limited: 10 requests/minute
- Client should call before session expires

---

### GET /api/v1/auth/security-status
**Purpose:** Development endpoint - check security status

```
Request:
  GET /api/v1/auth/security-status

Response (200):
  {
    "data": {
      "client_ip": "192.168.1.1",
      "is_whitelisted": false,
      "is_blacklisted": false,
      "total_sessions": 5,
      "total_failed_attempts": 2,
      "message": "Security status retrieved (development only)"
    }
  }
```

**Note:** This endpoint should be removed or secured in production.

---

## Rate Limiting Headers

All auth endpoints include these headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
```

When limit exceeded (HTTP 429):
- IP is blacklisted for 15 minutes
- All auth requests from that IP are rejected
- Return code: `RATE_LIMIT_EXCEEDED`

---

## HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Operation completed |
| 400 | Bad Request | Invalid input, expired/invalid token |
| 401 | Unauthorized | Invalid/expired session |
| 429 | Too Many Requests | Rate limit exceeded OR account locked |
| 500 | Server Error | Internal error |

---

## Client Implementation Guide

### Frontend API Calls

```javascript
// 1. Request OTP
const otpResponse = await authAPI.requestSmsOtp(email, phone, password);
// Check for ACCOUNT_LOCKED error

// 2. Verify OTP
const verifyResponse = await authAPI.verifySmsOtp(email, phone, code, password);
// Returns: { user_id, session_token, token }
// Store session_token in localStorage

// 3. Use session_token for authenticated requests
const headers = {
  'Authorization': `Bearer ${sessionToken}`
};

// 4. Validate session before action
const sessionValid = await authAPI.validateSession(sessionToken);
if (!sessionValid.valid) {
  // Redirect to login
}

// 5. Refresh session before expiry
await authAPI.refreshSession(sessionToken);

// Password Reset
const resetResponse = await authAPI.requestPasswordReset(phone);
const resetToken = resetResponse.reset_token; // Dev only

const resetComplete = await authAPI.resetPassword(resetToken, newPassword);
```

---

## Error Handling

```javascript
try {
  await verifyOTP(phone, code);
} catch (error) {
  const code = error.data?.error?.code;
  
  if (code === 'ACCOUNT_LOCKED') {
    showError('Account locked. Try again in 30 minutes.');
  } else if (code === 'RATE_LIMIT_EXCEEDED') {
    showError('Too many attempts. Try again later.');
  } else if (code === 'INVALID_OTP') {
    showError('Wrong code. Try again.');
  } else if (code === 'TOO_MANY_ATTEMPTS') {
    showError('Too many wrong attempts. Request new OTP.');
  }
}
```

---

## Environment Variables

No new environment variables required for SEC.4 features.

Existing variables used:
- `SNS_TOPIC_ARN` - For SMS delivery
- `NODE_ENV` - For dev/prod mode detection

---

## Backward Compatibility

All existing endpoints remain unchanged in functionality. New security features are additive:
- Session token is optional for existing clients
- Failed attempt tracking is automatic
- Rate limiting applies to all auth endpoints

---

## Testing Endpoints

Use these test commands to verify endpoints:

```bash
# Test rate limiting
for i in {1..11}; do
  curl -X POST http://localhost:3001/api/v1/auth/request-password-reset \
    -H "X-Forwarded-For: 192.168.1.100" \
    -d '{"phone": "5551234567"}'
done
# Last request returns 429

# Test password reset flow
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/request-password-reset \
  -d '{"phone": "5551234567"}' | jq '.data.reset_token')

curl -X POST http://localhost:3001/api/v1/auth/reset-password \
  -d "{\"reset_token\": \"$TOKEN\", \"new_password\": \"newpass\"}"
# Returns 200

# Test reusing token
curl -X POST http://localhost:3001/api/v1/auth/reset-password \
  -d "{\"reset_token\": \"$TOKEN\", \"new_password\": \"another\"}"
# Returns 400 TOKEN_ALREADY_USED
```
