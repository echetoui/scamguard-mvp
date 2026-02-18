# 🔐 Connexion AWS CLI v2 avec identifiants Console (sans Access Keys)

Ce guide utilise **AWS CLI v2** et le login SSO pour réutiliser vos identifiants de console existants.

Prérequis:
- Vous avez déjà un accès à la console AWS (IAM Identity Center / SSO)
- MFA est activé côté console

---

## Étape 1: Installer ou vérifier AWS CLI v2

```bash
# macOS
brew install awscli

# Vérifier la version (doit être v2)
aws --version
```

---

## Étape 2: Configurer un profil SSO

```bash
# Créer un profil CLI lié à votre accès console
aws configure sso --profile scamguard
```

Renseigner les informations demandées:
- `SSO start URL`: URL de votre portail AWS Access
- `SSO region`: ex. `us-east-1`
- `SSO account`: votre compte AWS
- `SSO role`: rôle autorisé (ex. `AdministratorAccess`)
- `Default region`: ex. `us-east-1`
- `Default output`: `json`

---

## Étape 3: Se connecter avec vos identifiants console

```bash
# Commande standard AWS CLI v2
aws sso login --profile scamguard
```

Note compatibilité:
- Certaines documentations parlent de `aws login`.
- Sur AWS CLI `2.30.2`, la commande valide est `aws sso login`.

---

## Étape 4: Utilisation quotidienne

```bash
# Option 1: Export du profil
export AWS_PROFILE=scamguard
aws sts get-caller-identity

# Option 2: Avec --profile
aws s3 ls --profile scamguard
```

Quand la session expire, relancer:

```bash
aws sso login --profile scamguard
```

---

## Étape 5: Déployer ScamGuard

```bash
export AWS_PROFILE=scamguard

cd backend/cdk
cdk bootstrap
cdk deploy
```

---

## 🆘 Troubleshooting

### Erreur: "Unable to locate credentials"

```bash
aws configure list --profile scamguard
aws configure sso --profile scamguard
```

### Erreur: "Token has expired"

```bash
aws sso login --profile scamguard
```

### Erreur de navigateur / terminal distant

```bash
aws sso login --profile scamguard --no-browser --use-device-code
```

---

## 📋 Checklist rapide

- [ ] AWS CLI v2 installé
- [ ] Profil SSO créé (`aws configure sso --profile scamguard`)
- [ ] Login effectué (`aws sso login --profile scamguard`)
- [ ] Identité vérifiée (`aws sts get-caller-identity --profile scamguard`)
- [ ] Déploiement CDK validé
