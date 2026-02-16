# ✅ Architecture AWS ScamGuard v5.0 - PRÊTE

## 📦 Fichiers créés

```
backend/cdk/
├── app.py                      # Point d'entrée CDK
├── cdk.json                    # Configuration CDK
├── requirements.txt            # Dépendances Python
├── .gitignore                  # Ignorer venv et cdk.out
├── README.md                   # Documentation CDK
└── stacks/
    ├── __init__.py
    └── scamguard_stack.py      # Stack principal (500 lignes)

scripts/
├── setup.sh                    # Setup initial (exécutable)
└── deploy.sh                   # Déploiement (exécutable)

docs/
├── architecture.md             # Diagramme architecture
├── deployment.md               # Guide déploiement
└── ROADMAP_v5.md              # Roadmap complète

.env.example                    # Template variables
```

## 🏗️ Services AWS déployés

### 1. **API Gateway REST API**
- CORS configuré
- Rate limiting: 10 req/user/jour
- Cognito Authorizer
- X-Ray tracing
- Routes:
  - `POST /scenario`
  - `POST /analyze`
  - `GET /profile`
  - `PUT /profile`
  - `DELETE /profile`
  - `GET /analytics`

### 2. **Lambda Function**
- Runtime: Python 3.12
- Memory: 512 MB
- Timeout: 30s
- X-Ray enabled
- Variables d'environnement:
  - `TABLE_NAME`
  - `UPLOADS_BUCKET`
  - `GEMINI_SECRET_ARN`
  - `OPENAI_SECRET_ARN`

### 3. **DynamoDB Table**
- Mode: On-Demand (pay-per-request)
- Point-in-time recovery: Activé
- TTL: Activé
- Schema:
  ```
  PK: USER#<id>     SK: PROFILE
  PK: USER#<id>     SK: SESSION#<timestamp>
  PK: USER#<id>     SK: ANALYTICS
  PK: USER#<id>     SK: QUOTA#<date>
  PK: SCENARIO#<id> SK: METADATA
  ```

### 4. **Cognito User Pool**
- Sign-in: Email
- Auto-verify: Email
- Password policy: 8+ chars, uppercase, lowercase, digits
- Account recovery: Email

### 5. **S3 Buckets**
- **Uploads Bucket:**
  - Encryption: S3-managed
  - Private (presigned URLs)
  - Lifecycle: 30 jours
- **Frontend Bucket:**
  - Website hosting
  - Public read
  - Error document: index.html

### 6. **CloudFront Distribution**
- Origin: S3 Frontend Bucket
- HTTPS redirect
- Cache optimized
- Error handling: SPA routing

### 7. **Secrets Manager**
- `scamguard/gemini-key`
- `scamguard/openai-key`
- Rotation: Manuelle (90 jours recommandé)

### 8. **CloudWatch Monitoring**
- **Alarms:**
  - Lambda errors > 5/5min
  - Lambda duration > 10s
  - DynamoDB throttling
- **Logs:**
  - API Gateway logs
  - Lambda logs (retention: 7 jours)
- **SNS Topic:** Notifications alarms

## 💰 Coûts estimés

| Service | Coût/mois |
|---------|-----------|
| API Gateway | $0 (free tier) |
| Lambda | $0 (free tier) |
| DynamoDB | $0 (free tier) |
| DynamoDB Backup | $0.20 |
| Secrets Manager | $0.80 |
| S3 | $0.10 |
| CloudWatch | $0.50 |
| CloudFront | $0 (free tier) |
| Cognito | $0 (free tier) |
| **Total AWS** | **$1.60/mois** |
| Gemini API | $0 (free tier) |
| GPT-4o-mini | $2-3 |
| **TOTAL** | **$4-5/mois** |

## 🚀 Déploiement

### Option 1: Script automatique

```bash
# Setup initial (première fois)
./scripts/setup.sh

# Déployer
./scripts/deploy.sh
```

### Option 2: Manuel

```bash
# 1. Créer secrets
aws secretsmanager create-secret \
  --name scamguard/gemini-key \
  --secret-string "YOUR_KEY"

aws secretsmanager create-secret \
  --name scamguard/openai-key \
  --secret-string "YOUR_KEY"

# 2. Installer dépendances
cd backend/cdk
pip install -r requirements.txt

# 3. Bootstrap CDK (première fois)
cdk bootstrap

# 4. Déployer
cdk deploy
```

## 📊 Outputs du déploiement

Après `cdk deploy`, vous obtiendrez:

```
ScamGuardStack.APIEndpoint = https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/
ScamGuardStack.UserPoolId = us-east-1_xxxxx
ScamGuardStack.UserPoolClientId = xxxxx
ScamGuardStack.CloudFrontURL = https://xxxxx.cloudfront.net
ScamGuardStack.FrontendBucket = scamguardstack-frontendbucket-xxxxx
ScamGuardStack.TableName = ScamGuardStack-DataTable-xxxxx
ScamGuardStack.AlarmTopicArn = arn:aws:sns:us-east-1:xxxxx:ScamGuardStack-AlarmTopic
```

## 🔒 Sécurité

✅ **Implémenté:**
- HTTPS partout
- Secrets Manager (pas hardcodé)
- Cognito authentication
- Rate limiting
- CORS configuré
- Encryption at rest (S3 + DynamoDB)
- IAM least privilege
- CloudWatch logging
- X-Ray tracing
- Point-in-time recovery

## 📝 Prochaines étapes

### Jour 1: ✅ TERMINÉ
- [x] Structure CDK
- [x] Stack principal
- [x] Scripts déploiement
- [x] Documentation

### Jour 2: À faire
- [ ] Implémenter Lambda handler
- [ ] LLMRouter avec retry logic
- [ ] Rate limiting logic
- [ ] Tests unitaires

### Jour 3-4: Backend
- [ ] 4 agents IA
- [ ] Cache DynamoDB
- [ ] Error handling

## 🆘 Troubleshooting

### Erreur: Secret not found
```bash
aws secretsmanager list-secrets
```

### Erreur: CDK bootstrap required
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

### Voir les logs
```bash
aws logs tail /aws/lambda/ScamGuardStack-APILambda --follow
```

### Détruire le stack
```bash
cdk destroy
```

## ✅ Checklist déploiement

- [ ] AWS CLI configuré
- [ ] Secrets créés (Gemini + OpenAI)
- [ ] CDK bootstrapped
- [ ] Stack déployé
- [ ] Outputs récupérés
- [ ] Alarms configurées
- [ ] Tests smoke passés

---

**Status:** ✅ Architecture AWS prête pour Jour 2  
**Prochaine étape:** Implémenter Lambda handler + agents IA
