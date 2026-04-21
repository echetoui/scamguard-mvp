# Guide de Déploiement ScamGuard v5.0

## Prérequis

- AWS Account
- AWS CLI configuré
- Node.js 18+
- Python 3.12+
- CDK CLI

## Étape 1: Setup Initial

```bash
# Cloner le repo
git clone https://github.com/echetoui/scamguard-mvp.git
cd scamguard-mvp

# Exécuter le setup
./scripts/setup.sh
```

Le script va:
- Installer AWS CLI, CDK, Node.js
- Configurer AWS credentials
- Créer les secrets (Gemini + OpenAI keys)
- Installer les dépendances Python

## Étape 2: Créer les Secrets

Si non fait par le script:

```bash
# Gemini API Key
aws secretsmanager create-secret \
  --name scamguard/gemini-key \
  --secret-string "YOUR_GEMINI_KEY"

# OpenAI API Key
aws secretsmanager create-secret \
  --name scamguard/openai-key \
  --secret-string "YOUR_OPENAI_KEY"
```

## Étape 3: Bootstrap CDK

Première fois seulement:

```bash
cd backend/cdk
cdk bootstrap
```

## Étape 4: Deploy Infrastructure

```bash
# Option 1: Script automatique
./scripts/deploy.sh

# Option 2: Manuel
cd backend/cdk
source .venv/bin/activate
cdk deploy
```

## Étape 5: Récupérer les Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name ScamGuardStack \
  --query 'Stacks[0].Outputs' \
  --output table
```

Outputs importants:
- `APIEndpoint`: URL de l'API
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito Client ID
- `CloudFrontURL`: URL du frontend
- `FrontendBucket`: Nom du bucket S3

## Étape 6: Deploy Frontend

```bash
cd frontend

# Créer .env avec les outputs
cat > .env << EOF
REACT_APP_API_URL=<APIEndpoint>
REACT_APP_USER_POOL_ID=<UserPoolId>
REACT_APP_USER_POOL_CLIENT_ID=<UserPoolClientId>
EOF

# Build
npm install
npm run build

# Deploy vers S3
aws s3 sync dist/ s3://<FrontendBucket>/
```

## Étape 7: Tester

```bash
# Ouvrir l'URL CloudFront
open <CloudFrontURL>

# Créer un compte test
# Tester les fonctionnalités
```

## Étape 8: Monitoring

```bash
# Voir les logs Lambda
aws logs tail /aws/lambda/ScamGuardStack-APILambda --follow

# Voir les métriques
aws cloudwatch get-dashboard --dashboard-name ScamGuard
```

## Rollback

```bash
# Détruire le stack
cdk destroy

# Ou rollback vers version précédente
aws cloudformation rollback-stack --stack-name ScamGuardStack
```

## Troubleshooting

### Erreur: Secret not found
```bash
# Vérifier les secrets
aws secretsmanager list-secrets
```

### Erreur: CDK bootstrap required
```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### Erreur: Lambda timeout
```bash
# Augmenter le timeout dans scamguard_stack.py
timeout=Duration.seconds(60)
```

## Coûts

Vérifier les coûts:
```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-03-01,End=2025-03-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```
