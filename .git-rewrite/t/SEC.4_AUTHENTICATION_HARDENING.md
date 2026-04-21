# SEC.4 - Authentication Hardening Implementation

**Status:** Complete  
**Effort:** 6 hours  
**Date Completed:** 2026-04-16

## Overview

SEC.4 implements comprehensive authentication security hardening for ScamGuard MVP, protecting against brute force attacks, account takeover, and credential compromise.

## Features Implemented

### 1. IP Whitelist/Blacklist System

**Location:** `/backend/dev-server.js` (lines 41-42)

```javascript
const ipWhitelist = new Set(); // Whitelisted IPs
const ipBlacklist = new Set(); // Blacklisted IPs (temporary bans)
```

**Functionality:**
- Track client IP from request headers (handles X-Forwarded-For proxies)
- Blacklist IPs temporarily (15 minutes) after exceeding rate limits
- Optional whitelist for trusted IPs

**Helper Functions:**
- `getClientIP(req)` - Extract IP from request
- `isIPWhitelisted(ip)` - Check if IP is whitelisted
- `isIPBlacklisted(ip)` - Check if IP is blacklisted (with expiry)
- `blacklistIP(ip)` - Temporarily block IP for 15 minutes

**Middleware Application:**
```javascript
app.use((req, res, next) => {
  const clientIP = getClientIP(req);
  
  if (isIPBlacklisted(clientIP)) {
    return res.status(429).json({
      error: { code: 'IP_BLOCKED', message: '...' }
    });
  }
  next();
});
```

### 2. Account Lockout System

**Location:** `/backend/dev-server.js` (lines 43, 138-178)

```javascript
const failedAttempts = new Map(); // phone -> { count, lastAttempt, locked }
```

**Security Policy:**
- Track failed authentication attempts per phone number
- Lock account after **5 failed attempts**
- Lockout duration: **30 minutes**
- Automatically unlock when time expires
- Clear counters on successful authentication

**Helper Functions:**
- `recordFailedAttempt(phone)` - Track failed login attempt
- `isAccountLocked(phone)` - Check if account is locked
- `clearFailedAttempts(phone)` - Reset counter on success

**Endpoint Protection:**
- `/auth/request-sms-otp` - Checks account lock before OTP generation
- `/auth/verify-sms-otp` - Checks account lock, tracks failed attempts

**Example Flow:**
```
Attempt 1-4: Failed OTP entry → Counter increments
Attempt 5: Failed OTP entry → Account locked for 30 min
Request 6+: "Account is temporarily locked..." → HTTP 429
Attempt after 30 min: Account automatically unlocked
Successful verify: Counter reset to 0
```

### 3. Rate Limiting on Auth Endpoints

**Location:** `/backend/dev-server.js` (lines 70-82)

**Configuration:**
- Max 10 requests per minute per IP
- Applies to all `/api/v1/auth/*` endpoints
- Automatic IP blacklist on violation (15 minutes)

**Implementation:**
```javascript
function checkRateLimit(ip, maxAttempts = 10, windowMs = 60000) {
  const now = Date.now();
  let record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: 9 };
  }
  
  record.count++;
  if (record.count > maxAttempts) {
    blacklistIP(ip); // 15-minute block
    return { allowed: false };
  }
  return { allowed: true, remaining: maxAttempts - record.count };
}
```

**Response Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
```

### 4. Secure Password Reset Mechanism

**Location:** `/backend/dev-server.js` (lines 180-216, endpoints at lines 371-457)

**Security Properties:**
- One-time use tokens (32 bytes, 64 hex characters)
- 15-minute expiration
- Non-reusable (marked as used after first use)
- Requires valid phone number
- Clears failed authentication counters on success

**Endpoints:**

#### POST /api/v1/auth/request-password-reset
Request a password reset token (sent via SMS in production)

```javascript
POST /api/v1/auth/request-password-reset
{
  "phone": "5551234567"
}

Response:
{
  "data": {
    "message": "Password reset link sent...",
    "phone_masked": "***4567",
    "reset_token": "token_hex..." // Dev only, production sends via SMS
  }
}
```

#### POST /api/v1/auth/reset-password
Complete the password reset with the token

```javascript
POST /api/v1/auth/reset-password
{
  "reset_token": "token_hex...",
  "new_password": "new_secure_password"
}

Response:
{
  "data": {
    "message": "Password has been reset successfully.",
    "user_id": "user_123"
  }
}
```

**Token Lifecycle:**
1. User requests reset → Token generated, stored with 15-min expiry
2. User receives token via SMS (production)
3. User submits token + new password → Token validated
4. Password updated → Token marked as used
5. Token reuse attempt → Rejected with 400 error

### 5. Session Validation & Token Refresh

**Location:** `/backend/dev-server.js` (lines 217-246, endpoints at lines 459-537)

**Session Token Properties:**
- 32-byte random tokens (crypto.randomBytes)
- 24-hour expiration
- Tracked per user
- IP change detection
- Last activity tracking

**Session Storage:**
```javascript
sessionTokens.set(token, {
  userId: 'user_123',
  phone: '5551234567',
  createdAt: Date.now(),
  lastActivity: Date.now(),
  expiresAt: Date.now() + (24 * 60 * 60 * 1000),
  ip: '192.168.1.1' // Track session IP
});
```

**Endpoints:**

#### POST /api/v1/auth/validate-session
Validate current session and detect IP changes

```javascript
POST /api/v1/auth/validate-session
{
  "session_token": "token_hex..."
}

Response:
{
  "data": {
    "valid": true,
    "user_id": "user_123",
    "phone": "5551234567",
    "last_activity": 1713274800000,
    "expires_at": 1713361200000
  }
}
```

#### POST /api/v1/auth/refresh-session
Extend session expiry by 24 hours

```javascript
POST /api/v1/auth/refresh-session
{
  "session_token": "token_hex..."
}

Response:
{
  "data": {
    "message": "Session refreshed successfully.",
    "expires_at": 1713534000000
  }
}
```

**Verification Flow:**
```
1. User logs in → Session token created, stored
2. User makes API request → Session validated on each request
3. Session IP differs → Logged (optional re-auth required)
4. 24 hours elapse → Session expires, user must login again
5. Before expiry → Client calls refresh-session to extend
```

### 6. Session Creation on Successful Login

**Location:** `/backend/dev-server.js` (lines 322-328, 341-362)

On successful SMS OTP verification:
- Generate secure session token
- Store session with metadata
- Return session_token to client
- Client stores session_token for future API calls

**Response:**
```javascript
{
  "data": {
    "user_id": "user_abc123",
    "phone_number": "5551234567",
    "token": "base64_token",
    "session_token": "session_abc...", // NEW: For session validation
    "message": "SMS OTP verified successfully."
  }
}
```

## Frontend Integration

### API Service Updates

**File:** `/frontend/src/services/api.js`

New endpoints added:
```javascript
authAPI.requestPasswordReset(phone)
authAPI.resetPassword(resetToken, newPassword)
authAPI.validateSession(sessionToken)
authAPI.refreshSession(sessionToken)
authAPI.getSecurityStatus() // Dev only
```

### useAuth Hook Updates

**File:** `/frontend/src/hooks/useAuth.js`

New methods:
```javascript
const {
  // Existing
  login, logout, signup, verifyEmail,
  
  // SEC.4 New
  requestPasswordReset,    // Request reset token
  resetPassword,            // Reset with token
  validateSession,          // Check session validity
} = useAuth();
```

**Session Token Storage:**
```javascript
// loginWithToken now accepts session token
loginWithToken(userInfo, token, sessionToken)

// Stored in auth storage
{
  id_token: "...",
  session_token: "...", // NEW
  expires_in: 3600
}
```

## Testing

### Backend Tests

**File:** `/backend/__tests__/security.test.js`

Test coverage:
- Rate limiting (allows under limit, blocks over limit, blacklists IP)
- Account lockout (allows 4 attempts, locks on 5th, auto-unlocks)
- Password reset (token generation, one-time use, expiry)
- Input validation (missing fields)
- Session management (token storage, IP tracking)

**Run Tests:**
```bash
cd backend
npm install jest supertest
npm test
```

### Frontend Tests

**File:** `/frontend/src/hooks/__tests__/useAuth.security.test.js`

Test coverage:
- Password reset request
- Password reset with token
- Invalid token handling
- Token reuse prevention
- Session validation
- Session token storage
- Loading/error states

**Run Tests:**
```bash
cd frontend
npm test -- useAuth.security
```

### Integration Tests

**File:** `/backend/__tests__/integration.security.test.js`

End-to-end scenarios:
- Complete OTP → session flow
- Account lockout → recovery via password reset
- Rate limit → IP blacklist
- Password reset → account unlock

## Security Checklist

- [x] IP tracking via X-Forwarded-For headers
- [x] Temporary IP blacklisting (15 min) on rate limit violation
- [x] Account lockout after 5 failed attempts (30 min)
- [x] Rate limiting: 10 requests/minute per IP
- [x] Secure password reset tokens (32-byte crypto)
- [x] One-time use tokens (marked as used)
- [x] 15-minute token expiration
- [x] Session token generation on successful login
- [x] 24-hour session expiration
- [x] IP change detection in sessions
- [x] Failed attempt counter reset on success
- [x] Response headers for rate limit info (X-RateLimit-*)

## Production Considerations

### Before Deployment

1. **Password Hashing:**
   - Dev server stores passwords plaintext
   - Production must use bcrypt/scrypt with salt

2. **SMS Delivery:**
   - Dev server logs reset tokens to console
   - Production sends via AWS SNS

3. **Database:**
   - Dev server uses in-memory Map
   - Production needs DynamoDB/RDS:
     - `failed_attempts` table
     - `password_reset_tokens` table
     - `session_tokens` table
     - Index on expiry for cleanup

4. **HTTPS/TLS:**
   - All auth endpoints must use HTTPS
   - Session tokens in HTTPS-only cookies

5. **Token Rotation:**
   - Consider refresh token rotation
   - Implement token revocation on logout

6. **Monitoring & Alerting:**
   - Alert on repeated lockouts
   - Alert on IP blacklist activations
   - Log all authentication events

7. **Admin Functions:**
   - Unlock account manually
   - View session list
   - Revoke sessions
   - IP whitelist management

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `ACCOUNT_LOCKED` | 429 | Account locked after failed attempts |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests in time window |
| `IP_BLOCKED` | 429 | IP temporarily blocked |
| `INVALID_OTP` | 400 | Wrong OTP code |
| `OTP_NOT_FOUND` | 400 | OTP expired or not requested |
| `OTP_EXPIRED` | 400 | OTP time window passed |
| `INVALID_RESET_TOKEN` | 400 | Reset token invalid/expired |
| `TOKEN_ALREADY_USED` | 400 | Password reset token reused |

## Files Modified

```
backend/
├── dev-server.js                         (+340 lines: helpers, endpoints)
├── package.json                          (added jest, supertest)
└── __tests__/
    ├── security.test.js                  (new: 360 lines)
    └── integration.security.test.js      (new: 275 lines)

frontend/
├── src/services/api.js                   (+45 lines: new endpoints)
├── src/hooks/useAuth.js                  (+85 lines: new methods)
└── src/hooks/__tests__/
    └── useAuth.security.test.js          (new: 245 lines)
```

## Summary

SEC.4 provides **defense-in-depth** authentication security:
1. **Rate limiting** stops automated attacks at network layer
2. **Account lockout** prevents brute force at application layer
3. **Secure reset** allows recovery without compromising security
4. **Session validation** ensures ongoing session integrity
5. **IP tracking** enables anomaly detection

This implementation aligns with OWASP authentication guidelines and provides foundational security for the ScamGuard MVP before more advanced features (MFA, OAuth) are added.
