# ScamGuard - Guide de Déploiement

## 🔧 Prérequis

### Outils Requis
```bash
# AWS CLI configuré avec credentials
aws --version

# Node.js et npm
node --version      # >= 16.x
npm --version       # >= 8.x

# AWS CDK
npm install -g aws-cdk
cdk --version       # >= 2.x

# Python
python3 --version   # >= 3.12
pip3 --version
```

### Credentials AWS

```bash
# Vérifier les credentials
aws sts get-caller-identity

# Pour déployer, vous avez besoin d'accès root au compte AWS
# Utilisateur scamguard-dev a les permissions limitées
```

---

## 📦 Structure des Fichiers

```
scamguard-mvp/
├── frontend/                    # App React
│   ├── src/
│   │   ├── App.jsx             # Composant principal
│   │   ├── App.css             # Styles accessibles
│   │   └── index.jsx           # Entry point React
│   ├── public/
│   │   └── index.html          # HTML template
│   ├── package.json            # Dépendances NPM
│   ├── .env                    # Config environment
│   └── build/                  # BUILD OUTPUT
│
├── backend/
│   ├── cdk/                    # Infrastructure as Code
│   │   ├── app.py              # CDK App
│   │   ├── stacks/
│   │   │   └── scamguard_stack.py  # Stack définition
│   │   └── requirements.txt    # CDK deps
│   │
│   └── lambda/                 # Lambda Functions
│       ├── index.py            # Entry point
│       ├── handler_llm.py      # Logique principale
│       ├── lambda_requirements.txt
│       └── agents/             # Agent modules
│
├── PROJECT_STATUS.md           # État du projet
├── DEPLOYMENT_GUIDE.md         # Ce fichier
└── .git/                       # Repo Git
```

---

## 🚀 Déploiement Complet (0 à Production)

### Étape 1: Préparation

```bash
cd /Users/echetoui/scamguard-mvp

# Vérifier l'état Git
git status
git log --oneline -5

# Installer dépendances
pip3 install -r backend/cdk/requirements.txt
cd frontend && npm install
```

### Étape 2: Déploiement Infrastructure (CDK)

```bash
cd backend/cdk

# Synthétiser et voir les changements
cdk synth -c account=034362029181 -c region=us-east-1

# Déployer la stack
cdk deploy \
  --require-approval never \
  -c account=034362029181 \
  -c region=us-east-1

# Capture les outputs (vous en aurez besoin)
# Exemple outputs:
#   APIEndpoint = https://k4jjgkz8xj...
#   FrontendBucketName = scamguardstack-...
#   CloudFrontURL = https://dv04w7vjfnkg5.cloudfront.net
```

### Étape 3: Configuration Secrets AWS

```bash
# Créer ou mettre à jour les secrets
aws secretsmanager put-secret-value \
  --secret-id scamguard/openai-key \
  --secret-string "sk-..."

aws secretsmanager put-secret-value \
  --secret-id scamguard/gemini-key \
  --secret-string "AIza..."
```

### Étape 4: Build & Deploy Frontend

```bash
cd frontend

# Build production
npm run build

# Récupérer le bucket S3 depuis CDK outputs
BUCKET="scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw"

# Sync vers S3
aws s3 sync build/ s3://$BUCKET/ --delete

# Invalider CloudFront cache
DIST_ID="E1C54UEBEPD83U"
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/*"
```

### Étape 5: Vérification

```bash
# Tester l'API
curl -X POST https://k4jjgkz8xj.execute-api.us-east-1.amazonaws.com/analyze \
  -H "Content-Type: application/json" \
  -d '{"action":"analyze","userResponse":"Je supprime","userId":"test"}'

# Visiter le site
# https://dv04w7vjfnkg5.cloudfront.net
```

---

## 🔄 Mise à Jour du Frontend

### Après modification des fichiers

```bash
cd frontend

# 1. Rebuild
npm run build

# 2. Deploy à S3
BUCKET="scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw"
aws s3 sync build/ s3://$BUCKET/ --delete

# 3. Invalider cache
DIST_ID="E1C54UEBEPD83U"
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

# ⏱️ Attendre ~30-60 secondes pour que le CDN se mette à jour
```

---

## 🔄 Mise à Jour du Backend

### Après modification de Lambda

```bash
cd backend/cdk

# 1. CDK redéploiera automatiquement la Lambda
cdk deploy \
  --require-approval never \
  -c account=034362029181 \
  -c region=us-east-1

# 2. Vérifier les logs
aws logs tail /aws/lambda/ScamGuardStack-LambdaFunctionXXX --follow
```

### Tester localement (optionnel)

```bash
cd backend
python3 -m pytest tests/test_handler.py -v
```

---

## 📊 Monitoring & Logs

### CloudWatch Logs

```bash
# Voir les logs Lambda en temps réel
aws logs tail /aws/lambda/ScamGuardStack-LambdaFunctionXXX --follow

# Rechercher les erreurs
aws logs filter-log-events \
  --log-group-name /aws/lambda/ScamGuardStack-LambdaFunctionXXX \
  --filter-pattern "ERROR"
```

### CloudWatch Metrics

```bash
# Voir les invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --start-time 2026-02-17T00:00:00Z \
  --end-time 2026-02-17T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### S3 & CloudFront

```bash
# Vérifier les fichiers dans S3
aws s3 ls s3://scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw/ --recursive

# Voir le status CloudFront
aws cloudfront get-distribution-config --id E1C54UEBEPD83U
```

---

## 🔐 Sécurité

### Secrets Manager

```bash
# Lister les secrets
aws secretsmanager list-secrets

# Récupérer un secret
aws secretsmanager get-secret-value --secret-id scamguard/openai-key

# Mettre à jour un secret
aws secretsmanager update-secret \
  --secret-id scamguard/openai-key \
  --secret-string "sk-..."
```

### Credentials Git

⚠️ **IMPORTANT:** Ne jamais commiter
```
- .env files
- AWS credentials
- API keys
```

Vérifier `.gitignore`:
```bash
cat .gitignore
# Doit inclure: .env, *.pem, etc.
```

---

## 🧪 Tests

### Frontend

```bash
cd frontend

# Tests unitaires (si configurés)
npm test

# Tests de performance
npm run build  # Voir les bundle sizes
```

### Backend

```bash
cd backend

# Tests Lambda
python3 -m pytest tests/ -v

# Tests spécifiques
pytest tests/test_handler.py::test_analyze -v
```

---

## 🚨 Rollback & Récupération

### Rollback Frontend

```bash
# S3 a la versioning, récupérer une version antérieure
aws s3api list-object-versions \
  --bucket scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw

# Restaurer une ancienne version
aws s3api get-object \
  --bucket scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw \
  --key index.html \
  --version-id VERSION_ID \
  index.html

# Re-upload
aws s3 cp index.html s3://scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw/
```

### Rollback Infrastructure (CDK)

```bash
# Voir l'historique des stacks
aws cloudformation list-stacks \
  --query 'StackSummaries[?StackName==`ScamGuardStack`]'

# Pour un vrai rollback, faut refaire le CDK
# avec une version antérieure du code
git log --oneline backend/cdk/stacks/
git checkout COMMIT_HASH backend/cdk/
cdk deploy --require-approval never
```

---

## 💾 Backup & Disaster Recovery

### DynamoDB Backup

```bash
# Créer un backup manuel
aws dynamodb create-backup \
  --table-name ScamGuardStack-DataTable447BC44E-1BID2SBGQEELH \
  --backup-name backup-$(date +%s)

# Lister les backups
aws dynamodb list-backups \
  --table-name ScamGuardStack-DataTable447BC44E-1BID2SBGQEELH
```

### Export des données

```bash
# Exporter DynamoDB vers S3
aws dynamodb export-table-to-point-in-time \
  --table-arn arn:aws:dynamodb:us-east-1:034362029181:table/ScamGuardStack-DataTable447BC44E-1BID2SBGQEELH \
  --s3-bucket scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw \
  --s3-prefix exports/
```

---

## 📱 Local Development

### Frontend

```bash
cd frontend

# Mode développement (hot reload)
npm start

# Ouvre http://localhost:3000
# Les changements se reloadent automatiquement
```

### Backend (Simulation)

```bash
# Pour tester Lambda localement (optionnel)
cd backend
sam local start-api

# Ou utiliser AWS Lambda Runtime Local
docker run -p 9000:8080 \
  -e LAMBDA_TASK_ROOT=/var/task \
  -v /Users/echetoui/scamguard-mvp/backend/lambda:/var/task \
  public.ecr.aws/lambda/python:3.12
```

---

## 🎯 Checklist Déploiement

### Avant de déployer en production

- [ ] Git commit les changements (`git status` = clean)
- [ ] Tests passent (`npm test`, `pytest tests/`)
- [ ] Build réussit (`npm run build`)
- [ ] Pas de console.log/debug en code production
- [ ] Variables d'environnement correctes
- [ ] Secrets AWS actualisés
- [ ] CDK synth ne montre pas d'erreurs
- [ ] URL de l'API correcte dans .env

### Après déploiement

- [ ] Frontend accessible sur https://dv04w7vjfnkg5.cloudfront.net
- [ ] API répond sur https://k4jjgkz8xj.execute-api.us-east-1.amazonaws.com
- [ ] Pas d'erreurs CloudWatch
- [ ] Cache CloudFront invalidé
- [ ] Test utilisateur basique fonctionne

---

## 🆘 Troubleshooting

### "Unable to import module 'index'"

```
Solution: Vérifier que index.py existe et importe handler_llm
```

### "Module not found: 'aws_cdk'"

```bash
pip3 install -r backend/cdk/requirements.txt
```

### CloudFront montre une ancienne version

```bash
# Invalider le cache
aws cloudfront create-invalidation \
  --distribution-id E1C54UEBEPD83U \
  --paths "/*"

# Attendre 30-60 secondes
# Puis vider le cache browser (Ctrl+F5 / Cmd+Shift+R)
```

### Lambda timeout

```
Solution: Augmenter le timeout ou optimiser la fonction
- Voir CloudWatch Logs pour identifier le goulot
- Réduire la taille du code
- Faire des appels API non-bloquants
```

### S3 bucket access denied

```bash
# Vérifier les permissions IAM
aws iam get-user-policy --user-name scamguard-dev --policy-name XXX

# Vous avez besoin du rôle root ou IAM admin
```

---

## 📚 Références

- [AWS CDK Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)
- [Lambda Python Handler](https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html)
- [React Deployment](https://create-react-app.dev/deployment/)
- [CloudFront Caching](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/caching.html)

---

**Dernière mise à jour:** 17 février 2026
**Responsable:** @echetoui
