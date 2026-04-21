# SMS OTP Testing Guide - Firebase Integration

## Quick Reference

| Endpoint | URL | Test Phone | Test Code | Uses |
|----------|-----|-----------|-----------|------|
| **Mock Server** | `http://localhost:3001/api/v1` | Any | Returned in response | Local development |
| **Lambda/Firebase** | `https://528szyyu3k.execute-api.us-east-1.amazonaws.com/prod/api/v1` | +14388313122 | **123456** | Firebase SMS |

---

## Testing with Mock Server (Local Development)

### 1. Start Mock Server
```bash
node mock-server.js
```
Output: `🚀 Mock API Server running on http://localhost:3001`

### 2. Request OTP
```bash
curl -X POST http://localhost:3001/api/v1/auth/request-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14388313122"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Code envoyé à +14388313122",
    "expires_in": 600,
    "phone_masked": "+14****3122",
    "otp": "238231"  ← Use this code
  }
}
```

### 3. Verify OTP
Copy the `otp` value from response and verify:

```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14388313122","code":"238231"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_token": "mock-id-token-...",
    "access_token": "mock-access-token-...",
    "refresh_token": "mock-refresh-token-...",
    "expires_in": 3600,
    "user": { "email": "...", "phone": "..." }
  }
}
```

---

## Testing with Lambda/Firebase (Production)

### Phone Number: +14388313122
### Test Code: 123456

### 1. Request OTP
```bash
curl -X POST https://528szyyu3k.execute-api.us-east-1.amazonaws.com/prod/api/v1/auth/request-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14388313122"}'
```

**Response:**
```json
{
  "data": {
    "message": "Code de vérification envoyé à +14388313122",
    "expires_in": 600,
    "phone_masked": "+14****3122"
  }
}
```

### 2. Verify with Test Code
```bash
curl -X POST https://528szyyu3k.execute-api.us-east-1.amazonaws.com/prod/api/v1/auth/verify-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14388313122","code":"123456"}'
```

**Response:**
```json
{
  "data": {
    "status": "VERIFIED",
    "id_token": "firebase-id-...",
    "access_token": "firebase-access-...",
    "refresh_token": "firebase-refresh-...",
    "expires_in": 3600,
    "user": {
      "sub": "...",
      "email": "phone-+14388313122@scamguard.internal",
      "phone_number": "+14388313122"
    }
  }
}
```

---

## Frontend Testing

### Option 1: Mock Server (Local Development)
```bash
cd frontend
npm run dev
# Frontend uses: http://localhost:3001/api/v1 (default)
```

Then:
1. Request OTP → Code shown in Network tab
2. Enter code in form
3. Click Verify

### Option 2: Lambda/Firebase (Production)
```bash
cd frontend
REACT_APP_API_URL=https://528szyyu3k.execute-api.us-east-1.amazonaws.com/prod/api/v1 npm run dev
```

Then:
1. Request OTP with phone +14388313122
2. Enter test code: **123456**
3. Click Verify

---

## Architecture

### Request Flow
```
Frontend (React)
    ↓
API URL (Mock or Lambda)
    ↓
[Mock Server] OR [API Gateway] → [Lambda Handler] → [sms_otp_handler]
    ↓
Response with tokens
```

### Firebase SMS Details
- **Credentials:** Configured in Lambda environment variables
  - `FIREBASE_API_KEY`: [configured]
  - `FIREBASE_PROJECT_ID`: scamguard-c3e04
- **Test Phone:** +14388313122
- **Test Code:** 123456 (configured in Firebase Console)

---

## Troubleshooting

### 400 Bad Request on verify-sms-otp
- **Cause:** Wrong code or missing fields
- **Fix:** Use correct code (mock: from response, Firebase: 123456)

### WebSocket error ws://localhost:8081/
- **Cause:** Vite HMR (development only)
- **Impact:** None (just console warning)
- **Fix:** Ignore, not critical

### "Code de vérification envoyé à undefined"
- **Cause:** Phone validation failed
- **Fix:** Use E.164 format: +1XXXXXXXXXX

---

## Status ✅

- ✅ Mock Server: Working (localhost:3001)
- ✅ Lambda Routing: Fixed and tested
- ✅ Firebase SMS: Integrated (test code 123456)
- ✅ Both endpoints: Production ready
