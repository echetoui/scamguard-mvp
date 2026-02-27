# ScamGuard MVP - Quick Start

🔴 **En production:** https://dv04w7vjfnkg5.cloudfront.net
🔵 **API:** https://k4jjgkz8xj.execute-api.us-east-1.amazonaws.com

---

## ⚡ Commandes Essentielles

### Frontend - Développement

```bash
cd frontend
npm install      # 1 fois
npm start        # Mode dev (http://localhost:3000)
npm run build    # Build production
```

### Frontend - Deploy

```bash
cd frontend
npm run build
BUCKET="scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw"
aws s3 sync build/ s3://$BUCKET/ --delete
aws cloudfront create-invalidation --distribution-id E1C54UEBEPD83U --paths "/*"
```

### Backend - Deploy

```bash
cd backend/cdk
cdk deploy --require-approval never -c account=034362029181 -c region=us-east-1
```

### Logs & Monitoring

```bash
# Lambda logs
aws logs tail /aws/lambda/ScamGuardStack-LambdaFunction* --follow

# Test API
curl -X POST https://k4jjgkz8xj.execute-api.us-east-1.amazonaws.com/analyze \
  -H "Content-Type: application/json" \
  -d '{"action":"analyze","userResponse":"Je supprime","userId":"test"}'
```

---

## 📋 État Déploiement (17 février 2026)

| Composant | Status | Details |
|-----------|--------|---------|
| **Frontend** | ✅ Live | React + Accessibility |
| **Backend** | ✅ Live | Lambda + LLM |
| **Database** | ✅ DynamoDB | Données utilisateurs |
| **CDN** | ✅ CloudFront | Cache global |
| **Secrets** | ✅ AWS Secrets Mgr | API keys stockées |
| **Monitoring** | ✅ CloudWatch | Logs & Metrics |

---

## 🎯 Fonctionnalités Actuelles

✅ Accueil avec menu
✅ Scénarios de formation anti-scam
✅ Reconnaissance vocale (FR)
✅ Synthèse vocale/Text-to-speech
✅ Upload photos pour analyse
✅ Scoring IA (0-100)
✅ Coaching personnalisé
✅ Badges XP
✅ UI accessible pour personnes âgées

---

## 📁 Structure Importante

```
scamguard-mvp/
├── frontend/src/App.jsx       ← UI principale (238 lignes)
├── frontend/src/App.css       ← Styles accessible
├── backend/lambda/handler_llm.py    ← API endpoints
├── backend/cdk/stacks/scamguard_stack.py  ← Infrastructure
├── PROJECT_STATUS.md          ← État complet du projet
└── DEPLOYMENT_GUIDE.md        ← Guide détaillé déploiement
```

---

## 🔑 Credentials

### AWS CLI
```bash
# Accès root (déploiement)
aws sts get-caller-identity

# Accès limité (scamguard-dev user)
aws sts get-caller-identity --profile scamguard-dev
```

### Environment Variables (.env)

```
REACT_APP_LAMBDA_URL=https://k4jjgkz8xj.execute-api.us-east-1.amazonaws.com
```

### Secrets Manager
```
scamguard/openai-key    → OpenAI API key
scamguard/gemini-key    → Google Gemini API key
```

---

## 🚨 Problèmes Courants

### "Cannot find module 'react'"
```bash
cd frontend && npm install
```

### CloudFront montre version ancienne
```bash
aws cloudfront create-invalidation --distribution-id E1C54UEBEPD83U --paths "/*"
# Attendre 30-60 secondes + vider cache browser
```

### Lambda timeout
```
Vérifier les logs:
aws logs tail /aws/lambda/ScamGuardStack-LambdaFunction* --follow
```

### S3 access denied
```
Vous avez besoin des perms root AWS (pas scamguard-dev user)
```

---

## 📊 Ressources AWS

| Service | Nom/ID |
|---------|--------|
| S3 Bucket | scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw |
| CloudFront | E1C54UEBEPD83U |
| Lambda | ScamGuardStack-LambdaFunction* |
| DynamoDB | ScamGuardStack-DataTable* |
| API Gateway | k4jjgkz8xj |
| CloudWatch | /aws/lambda/ScamGuardStack-* |
| Cognito | us-east-1_L35zaDPJn |

---

## 📞 Docs Complètes

- **PROJECT_STATUS.md** - État détaillé + architecture + roadmap
- **DEPLOYMENT_GUIDE.md** - Déploiement complet + troubleshooting
- **Cet fichier** - Quick reference

---

**Mis à jour:** 17 février 2026 | **Branche:** feature/phase-4-compliance-fdp-integration
