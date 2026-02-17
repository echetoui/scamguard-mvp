# 🚀 ScamGuard - Guide de Déploiement AWS

## Étape 1: Obtenir les Credentials AWS

### Option A: AWS Console (Recommandé)

1. Allez à: https://console.aws.amazon.com/
2. Connectez-vous avec votre compte AWS
3. Cliquez sur votre nom en haut à droite → **My Security Credentials**
4. Allez à **Access Keys** → **Create New Access Key**
5. Téléchargez le fichier CSV (sauvegardez-le!)
6. Vous aurez:
   - `Access Key ID` (commence par AKIA...)
   - `Secret Access Key` (long texte aléatoire)

### Option B: Créer un compte AWS

Si vous n'avez pas de compte AWS:
1. Allez à: https://aws.amazon.com/free/
2. Cliquez sur **Create a Free Account**
3. Suivez les étapes
4. Puis procédez à l'Option A

## Étape 2: Configurer AWS CLI

```bash
# Configurez vos credentials
aws configure

# À chaque prompt, entrez:
AWS Access Key ID [None]: AKIA... (from Step 1)
AWS Secret Access Key [None]: wJalr... (from Step 1)
Default region name [None]: us-east-1
Default output format [None]: json

# Vérifiez la configuration
aws sts get-caller-identity

# Vous devriez voir:
# {
#     "UserId": "AIDAI...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/YourUsername"
# }
```

## Étape 3: Obtenez les Clés API

### OpenAI API Key (pour l'analyse d'images)

1. Allez à: https://platform.openai.com/api-keys
2. Cliquez sur **Create new secret key**
3. Copiez la clé (commence par `sk-...`)
4. Sauvegardez-la dans un fichier sécurisé

### Google Gemini API Key (pour générer des scénarios)

1. Allez à: https://aistudio.google.com/app/apikey
2. Cliquez sur **Create API Key**
3. Copiez la clé (commence par `AIza...`)
4. Sauvegardez-la dans un fichier sécurisé

## Étape 4: Lancer le Déploiement

```bash
# Naviguez au répertoire du projet
cd /Users/echetoui/scamguard-mvp

# Lancez le script de déploiement
chmod +x deploy.sh
./deploy.sh

# Le script vous posera:
# 1. Environment: dev (ou staging/prod)
# 2. OpenAI API Key: sk-...
# 3. Gemini API Key: AIza...
```

## Étape 5: Récupérez l'URL de l'API

Après le déploiement, vous verrez:

```
API Endpoint: https://abc123.execute-api.us-east-1.amazonaws.com/dev/

User Pool ID: us-east-1_aBc123XyZ
```

Sauvegardez ces valeurs!

## Étape 6: Testez l'API

```bash
# Obtenez l'endpoint de votre déploiement
API=$(aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text \
  --region us-east-1)

echo "API: $API"

# Testez un endpoint (si disponible)
curl -X GET "${API}api/v1/health"

# Vous devriez voir une réponse JSON
```

## Étape 7: Créer un Utilisateur de Test

```bash
# Récupérez l'ID du User Pool
POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name scamguard-mvp \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text \
  --region us-east-1)

# Créez un utilisateur de test
aws cognito-idp admin-create-user \
  --user-pool-id $POOL_ID \
  --username elderly.user@example.com \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS \
  --region us-east-1

# Définissez un mot de passe permanent
aws cognito-idp admin-set-user-password \
  --user-pool-id $POOL_ID \
  --username elderly.user@example.com \
  --password SecurePassword123!@# \
  --permanent \
  --region us-east-1

# Vérifiez l'email
aws cognito-idp admin-update-user-attributes \
  --user-pool-id $POOL_ID \
  --username elderly.user@example.com \
  --user-attributes Name=email_verified,Value=true \
  --region us-east-1

echo "Utilisateur de test créé!"
echo "Email: elderly.user@example.com"
echo "Mot de passe: SecurePassword123!@#"
```

## Étape 8: Monitoring et Logs

```bash
# Affichage des logs en direct
sam logs -n scamguard-handler-dev --stack-name scamguard-mvp --tail

# Accédez à CloudWatch
# https://console.aws.amazon.com/cloudwatch/

# Accédez à X-Ray pour le tracing
# https://console.aws.amazon.com/xray/
```

## Coûts Estimés

| Ressource | Coût Mensuel |
|-----------|------------|
| Lambda | $45 |
| DynamoDB | $25 |
| API Gateway | $3.50 |
| CloudWatch Logs | $50 |
| Secrets Manager | $0.40 |
| **TOTAL** | **~$124** |

💡 **Astuce**: La couche gratuite d'AWS couvre une partie de ces coûts les 12 premiers mois!

## Problèmes Courants

### Credentials Non Trouvées
```bash
aws sts get-caller-identity
# Si erreur, lancez:
aws configure
```

### S3 Bucket Déjà Existe
```bash
# Utilisez un nom différent:
export BUCKET_NAME="scamguard-artifacts-$(date +%s)"
```

### Lambda Timeout (45-55 secondes)
La première requête peut prendre du temps. C'est normal!

### Déploiement Échoue
```bash
# Vérifiez les logs CloudFormation:
aws cloudformation describe-stack-events \
  --stack-name scamguard-mvp \
  --region us-east-1

# Nettoyez et réessayez:
aws cloudformation delete-stack --stack-name scamguard-mvp
./deploy.sh
```

## Prochaines Étapes

1. ✅ Configurez AWS credentials (Étape 1-2)
2. ✅ Obtenez les clés API (Étape 3)
3. ✅ Lancez le déploiement (Étape 4)
4. ✅ Testez l'API (Étape 6)
5. ✅ Créez un utilisateur de test (Étape 7)
6. ✅ Monitorer les logs (Étape 8)

## Support

Pour plus d'infos:
- AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/
- SAM: https://docs.aws.amazon.com/serverless-application-model/
- CloudFormation: https://docs.aws.amazon.com/cloudformation/

---

**Prêt?** Exécutez:
```bash
aws configure
./deploy.sh
```
