# Migration vers SSM Parameter Store

## Changements effectués

1. **CDK Stack** : Remplacé AWS Secrets Manager par SSM Parameter Store
2. **Lambda Handler** : Modifié pour utiliser `ssm_client` au lieu de `secrets_client`
3. **Variables d'environnement** : Changé de `*_SECRET_ARN` vers `*_PARAM_NAME`

## Déploiement

### 1. Déployer la stack CDK mise à jour
```bash
cd backend/cdk
cdk deploy
```

### 2. Configurer les paramètres SSM
```bash
# Option 1: Utiliser le script automatique
./setup_ssm.sh

# Option 2: Manuellement via AWS CLI
aws ssm put-parameter --name "/scamguard/gemini-key" --value "VOTRE_CLE_GEMINI" --type "SecureString"
aws ssm put-parameter --name "/scamguard/openai-key" --value "VOTRE_CLE_OPENAI" --type "SecureString"
```

### 3. (Optionnel) Migrer depuis Secrets Manager
```bash
python migrate_to_ssm.py
```

## Avantages de SSM Parameter Store

- **Coût** : Gratuit pour les paramètres standard (jusqu'à 10 000)
- **Intégration** : Meilleure intégration avec les services AWS
- **Simplicité** : API plus simple pour les paramètres de configuration
- **Hiérarchie** : Organisation hiérarchique des paramètres avec `/`

## Vérification

Testez que les paramètres sont correctement configurés :
```bash
aws ssm get-parameter --name "/scamguard/gemini-key" --with-decryption
aws ssm get-parameter --name "/scamguard/openai-key" --with-decryption
```