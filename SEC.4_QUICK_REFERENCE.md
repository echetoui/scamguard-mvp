# SEC.4 - Quick Reference Guide

## What Was Added

ScamGuard now has **5 security layers** protecting authentication:

1. **Rate Limiting** - Max 10 auth requests/minute per IP
2. **Account Lockout** - Lock after 5 failed attempts (30 min)
3. **IP Blacklisting** - Auto-block IP after rate limit violation (15 min)
4. **Secure Password Reset** - One-time, time-limited tokens
5. **Session Validation** - Track and validate user sessions

## For Frontend Developers

### Using Password Reset

```javascript
// Step 1: User enters phone number
const { requestPasswordReset } = useAuth();
const result = await requestPasswordReset('5551234567');

if (result.success) {
  // User receives reset token via SMS (in production)
  // Or see it in dev console
  navigate('/reset-password');
}
```

```javascript
// Step 2: User submits reset token + new password
const { resetPassword } = useAuth();
const result = await resetPassword(resetToken, newPassword);

if (result.success) {
  // Password reset complete
  navigate('/login');
}
```

### Using Session Validation

```javascript
// Check if current session is valid
const { validateSession } = useAuth();
const { valid, user } = await validateSession();

if (valid) {
  console.log('Session OK, user:', user.id);
} else {
  // Session expired, redirect to login
  navigate('/login');
}
```

### Handling Security Errors

```javascript
// API errors will have these codes
try {
  await verifyOTP(phone, code);
} catch (error) {
  if (error.data?.error?.code === 'ACCOUNT_LOCKED') {
    // Show: "Account temporarily locked. Try again in 30 minutes"
  }
  if (error.data?.error?.code === 'RATE_LIMIT_EXCEEDED') {
    // Show: "Too many attempts. Please try again later"
  }
  if (error.data?.error?.code === 'INVALID_RESET_TOKEN') {
    // Show: "Reset link expired or invalid"
  }
}
```

## For Backend Developers

### Adding Security to Endpoints

All auth endpoints are **automatically** protected by rate limiting middleware. New endpoints follow this pattern:

```javascript
app.post('/api/v1/auth/new-endpoint', (req, res) => {
  const clientIP = getClientIP(req);
  const { phone } = req.body;

  // Check for account lockout
  if (isAccountLocked(phone)) {
    return res.status(429).json({
      error: { code: 'ACCOUNT_LOCKED', message: '...' }
    });
  }

  // On failed attempt
  recordFailedAttempt(phone);
  
  // On success
  clearFailedAttempts(phone);
});
```

### Debugging Security Features

```javascript
// Check IP status (dev endpoint)
GET /api/v1/auth/security-status

// Returns
{
  "data": {
    "client_ip": "192.168.1.1",
    "is_whitelisted": false,
    "is_blacklisted": false,
    "total_sessions": 5,
    "total_failed_attempts": 2
  }
}
```

### IP Whitelisting (Future Use)

```javascript
// In production, whitelist trusted IPs
ipWhitelist.add('203.0.113.50'); // Office IP

// Whitelisted IPs bypass rate limiting
```

## Testing Locally

### Unit Tests
```bash
cd backend
npm test -- security.test.js
```

### Integration Tests
```bash
cd backend
npm test -- integration.security.test.js
```

### Manual Testing

**Test Rate Limiting:**
```bash
# Make 11 requests from same IP
for i in {1..11}; do
  curl -X POST http://localhost:3001/api/v1/auth/request-password-reset \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 192.168.1.100" \
    -d '{"phone": "5551234567"}'
done
# After 10 requests, request 11 will get 429 RATE_LIMIT_EXCEEDED
```

**Test Account Lockout:**
```bash
# Make 5 failed OTP attempts
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/v1/auth/verify-sms-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "5551234567", "code": "wrong"}'
done
# After 5 attempts, request 6 will get 429 ACCOUNT_LOCKED
```

**Test Password Reset:**
```bash
# Request reset token
curl -X POST http://localhost:3001/api/v1/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"phone": "5551234567"}'
# Returns: "reset_token": "abc123..."

# Use token to reset password
curl -X POST http://localhost:3001/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"reset_token": "abc123...", "new_password": "newpass123"}'
```

## Security Timings

| Feature | Duration | Notes |
|---------|----------|-------|
| OTP Expiry | 5 minutes | User has 5 min to verify code |
| OTP Attempts | 3 max | After 3 wrong attempts, must request new |
| Account Lockout | 30 minutes | Automatic unlock after time passes |
| Rate Limit Window | 1 minute | 10 requests per minute max |
| IP Blacklist | 15 minutes | Temporary block on rate limit violation |
| Password Reset Token | 15 minutes | Token valid for 15 min after request |
| Session Duration | 24 hours | Sessions valid for 24 hours |

## Common Errors

### "Account is temporarily locked"
- User made 5+ failed OTP attempts
- They must wait 30 minutes
- OR use password reset (which clears counter)

### "Too many authentication attempts"
- IP made 10+ auth requests in 1 minute
- That IP is blocked for 15 minutes
- Use a different IP or wait 15 minutes

### "Reset token is invalid or expired"
- Token was never sent
- Token is older than 15 minutes
- Token was already used once
- Solution: Request new password reset

### "INVALID_OTP" with 3+ attempts
- User entered wrong code multiple times
- They need to request new OTP
- Old OTP is discarded

## Production Deployment Checklist

- [ ] Enable HTTPS/TLS on all endpoints
- [ ] Hash passwords with bcrypt (don't store plaintext)
- [ ] Send reset tokens via SMS, not console
- [ ] Use DynamoDB for persistent storage
- [ ] Configure CloudWatch for monitoring
- [ ] Set up alerts for lockouts > 10/hour
- [ ] Implement token rotation for sessions
- [ ] Add IP reputation checks (future)
- [ ] Document admin account unlock process
- [ ] Test failover scenarios

## Support Links

- Full Documentation: `SEC.4_AUTHENTICATION_HARDENING.md`
- Code Location: `backend/dev-server.js` (lines 30-540)
- Tests: `backend/__tests__/security.test.js`
- Integration Tests: `backend/__tests__/integration.security.test.js`
