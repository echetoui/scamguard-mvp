# Configuration Firebase - ScamGuard

## Credentials Fournis ✅
- **Project ID:** scamguard-c3e04
- **Project Number:** 621907828918
- **API Key:** BJ7nqu0Hg7XuR-6riO06tCfzy7JjSpmmjqhjHEgzeGv1Elryv_Gqg6z_1EMQuW0wtQPRMlOE7bBR4JYeXiVCt_k

## Étapes à Faire dans Firebase Console

### 1. Aller à Firebase Console
- https://console.firebase.google.com/project/scamguard-c3e04

### 2. Activer Phone Authentication
```
Authentication → Sign-in method → Phone → Enable
```

### 3. Ajouter numéros de test (Development)
```
Authentication → Phone providers → Add test phone numbers

Exemple:
  Phone: +14388313122
  Code: 123456  (or any 6-digit code)
```

### 4. Configurer Lambda/Backend

**Option A - Local Development (.env):**
```bash
export FIREBASE_API_KEY="BJ7nqu0Hg7XuR-6riO06tCfzy7JjSpmmjqhjHEgzeGv1Elryv_Gqg6z_1EMQuW0wtQPRMlOE7bBR4JYeXiVCt_k"
export FIREBASE_PROJECT_ID="scamguard-c3e04"
```

**Option B - AWS Lambda Environment (CDK):**
```typescript
new lambda.Function(this, 'SMSOTPHandler', {
  handler: 'index.request_otp',
  environment: {
    FIREBASE_API_KEY: 'BJ7nqu0Hg7XuR-6riO06...',
    FIREBASE_PROJECT_ID: 'scamguard-c3e04',
  }
});
```

### 5. Test SMS

**Local:**
```bash
# Mock server (no SMS sent, logged to console)
node mock-server.js

# Phone: +14388313122
# Code will be logged: "OTP for +14388313122: 123456"
```

**Production avec Firebase:**
```bash
# Phone number must be added to Firebase test list
# SMS arrives in 2-5 seconds
curl -X POST https://your-api/api/v1/auth/request-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14388313122"}'
```

## Prochaines Étapes

1. ✅ Credentials configurés dans ScamGuard
2. 🟡 Aller à Firebase Console → activer Phone Auth
3. 🟡 Ajouter numéros de test
4. 🟡 Déployer backend avec les variables d'environnement
5. ✅ Frontend local teste avec mock-server.js

## Support Firebase
- Phone Auth Docs: https://firebase.google.com/docs/auth/web/phone-auth
- SMS Troubleshooting: https://firebase.google.com/docs/auth/phone-questions
