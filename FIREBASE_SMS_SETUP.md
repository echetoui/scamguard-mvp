# Firebase SMS OTP Setup Guide

## Overview
ScamGuard now uses **Firebase Cloud Messaging (FCM)** for SMS OTP instead of deprecated AWS Pinpoint.

## Prerequisites
- Firebase Project (free tier supports SMS)
- Firebase Authentication enabled
- Phone number verification enabled

## Setup Steps

### 1. Create Firebase Project
```bash
# Go to Firebase Console
https://console.firebase.google.com/

# Create new project or use existing one
# Enable Google Analytics (optional but recommended)
```

### 2. Enable Phone Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Phone** provider
3. Add phone numbers to test list (for development)
   - Add your test phone numbers (e.g., +14388313122)

### 3. Get Firebase API Key
1. Go to **Project Settings** → **Service Accounts**
2. Copy the **API Key** from the Web API key section
3. Or go to **Project Settings** → **General** → scroll to "Your apps"
4. Select Web app → copy API Key from Firebase config

### 4. Configure Environment Variables

**For Lambda/Production:**
```bash
export FIREBASE_API_KEY="AIzaSy..." # Your Firebase API Key
export FIREBASE_PROJECT_ID="scamguard-12345" # Your Firebase Project ID
```

**For Local Development (.env):**
```
FIREBASE_API_KEY=AIzaSy...
FIREBASE_PROJECT_ID=scamguard-12345
```

### 5. Update Lambda Environment
In CDK stack or AWS Console:
```
Environment Variables:
  FIREBASE_API_KEY: <your-api-key>
  FIREBASE_PROJECT_ID: <your-project-id>
```

### 6. Test Firebase SMS

**Local Test:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/request-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14388313122"}'
```

**Production Test:**
```bash
curl -X POST https://your-api.com/api/v1/auth/request-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14388313122"}'
```

## SMS Message Format

The SMS sent to users will be:
```
ScamGuard - Votre code de vérification: 123456 (valide 10 minutes)
```

## Pricing
- Firebase SMS: ~$0.10 per message (varies by region)
- Free tier: 300 SMS/month
- See: https://firebase.google.com/pricing

## Testing

### Test with Mock Server (Development)
```bash
node /Users/echetoui/scamguard-mvp/mock-server.js
# OTP logged to console - check server logs
```

### Test with Real Firebase
1. Add your phone number to Firebase test list
2. Request OTP → SMS arrives in seconds
3. Enter code to verify

## Troubleshooting

### "Firebase API Key not set"
- Check environment variables are loaded
- Verify key in Firebase Console

### "SMS delivery failed"
- Ensure phone is in E.164 format: +1-514-831-3122
- For dev: add phone to test list in Firebase Console
- Check Firebase project has billing enabled

### "Authentication requires phone number"
- User must complete phone verification in Firebase
- SMS code must match what Firebase generated

## Migration from AWS Pinpoint
- ✅ Same OTP length (6 digits)
- ✅ Same expiration (10 minutes)
- ✅ Same rate limiting & brute force protection
- ✅ Same audit logging

## References
- Firebase SMS: https://firebase.google.com/docs/auth/web/phone-auth
- Firebase API: https://firebase.google.com/docs/reference/rest/auth
- Phone authentication: https://firebase.google.com/docs/auth/web/start#set_up_sign-in_with_phone
