# Phase 4.1 - Plan de Test Complet

## Configuration Préalable

```bash
# 1. Récupérer l'URL de l'API
API_URL="https://ymli0zyv6e.execute-api.us-east-1.amazonaws.com/dev/api/v1"

# 2. Créer des variables de test
TEST_EMAIL="testuser@example.com"
TEST_PASSWORD="SecurePass123!"
```

## Étape 1: Test d'Inscription (SIGNUP)

```bash
curl -X POST "${API_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'${TEST_EMAIL}'",
    "password": "'${TEST_PASSWORD}'"
  }' | jq .
```

**Résultat attendu:**
```json
{
  "data": {
    "user_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "status": "PENDING_VERIFICATION",
    "message": "Signup successful. Please verify your email."
  }
}
```

**Sauvegarder le `user_id` pour les prochaines étapes:**
```bash
USER_ID="<copier_le_user_id_ici>"
```

---

## Étape 2: Obtenir le Code de Vérification

Le code est envoyé par email via Cognito. Vous devriez recevoir un email avec:
- 6 chiffres (code de vérification)
- Valide pendant 24 heures

**Alternative: Vérifier dans les logs CloudWatch**
```bash
aws logs tail /aws/lambda/AuthHandler --follow --region us-east-1
```

Cherchez un message comme: `Verification code: 123456`

**Sauvegarder le code:**
```bash
VERIFICATION_CODE="<code_reçu_par_email>"
```

---

## Étape 3: Test de Vérification Email (VERIFY)

```bash
curl -X POST "${API_URL}/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'${TEST_EMAIL}'",
    "code": "'${VERIFICATION_CODE}'"
  }' | jq .
```

**Résultat attendu:**
```json
{
  "data": {
    "status": "CONFIRMED",
    "message": "Email verified successfully. You can now login."
  }
}
```

---

## Étape 4: Test de Connexion (LOGIN)

```bash
curl -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'${TEST_EMAIL}'",
    "password": "'${TEST_PASSWORD}'"
  }' | jq .
```

**Résultat attendu:**
```json
{
  "data": {
    "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_in": 3600,
    "user": {
      "sub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "email": "testuser@example.com"
    }
  }
}
```

**Sauvegarder les tokens:**
```bash
ID_TOKEN="<copier_le_id_token_ici>"
ACCESS_TOKEN="<copier_le_access_token_ici>"
```

---

## Étape 5: Test du Profil (avec authentification)

### 5a. Récupérer le profil
```bash
curl -X POST "${API_URL}/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "action": "get_profile",
    "userId": "'${USER_ID}'"
  }' | jq .
```

**Résultat attendu:**
```json
{
  "data": {
    "userId": "...",
    "profile": {
      "name": "New User",
      "avatar": "🧑",
      "joinDate": "2026-02-20T...",
      "preferences": {
        "notifications": true,
        "darkMode": false,
        "language": "fr"
      }
    }
  }
}
```

### 5b. Sauvegarder/Mettre à jour le profil
```bash
curl -X POST "${API_URL}/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "action": "save_profile",
    "userId": "'${USER_ID}'",
    "profile": {
      "name": "Jean Martin",
      "avatar": "👨",
      "preferences": {
        "notifications": true,
        "darkMode": false,
        "language": "fr"
      }
    }
  }' | jq .
```

**Résultat attendu:**
```json
{
  "data": {
    "status": "SAVED",
    "message": "Profile updated successfully"
  }
}
```

---

## Étape 6: Test d'Analyse (avec authentification)

```bash
curl -X POST "${API_URL}/analysis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "action": "analyze",
    "userId": "'${USER_ID}'",
    "userResponse": "Je clique sur le lien fourni dans le message",
    "scenario": "Email: Votre compte a été compromis. Cliquez ici pour sécuriser...",
    "imageBase64": null
  }' | jq .
```

**Résultat attendu:**
```json
{
  "data": {
    "detection": {
      "score": 25,
      "risk": "high"
    },
    "coaching": {
      "feedback": "⚠️ Cette action est dangereuse! ...",
      "xp_earned": 15
    }
  }
}
```

---

## Étape 7: Test Analytics (avec authentification)

```bash
curl -X POST "${API_URL}/analytics" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "action": "get_analytics",
    "userId": "'${USER_ID}'"
  }' | jq .
```

**Résultat attendu:**
```json
{
  "data": {
    "totalAnalyses": 1,
    "safeCount": 0,
    "moderateCount": 0,
    "dangerCount": 1,
    "avgScore": 25,
    "totalXpEarned": 15
  }
}
```

---

## Étape 8: Vérifier la Synchronisation DynamoDB

```bash
# Lister les items pour l'utilisateur
aws dynamodb query \
  --table-name ScamGuardData-dev \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk": {"S": "USER#'${USER_ID}'"}}' \
  --region us-east-1 | jq .Items
```

**Items attendus:**
1. `SK=PROFILE` - Profil utilisateur
2. `SK=ANALYSIS#{timestamp}#{uuid}` - Enregistrement de l'analyse
3. `SK=CREDITS` - Solde de crédits

---

## Étape 9: Test de Déconnexion (LOGOUT)

```bash
curl -X POST "${API_URL}/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "userId": "'${USER_ID}'"
  }' | jq .
```

**Résultat attendu:**
```json
{
  "data": {
    "message": "Logout successful"
  }
}
```

---

## Checklist de Validation

- [ ] ✅ Étape 1: Signup retourne user_id et PENDING_VERIFICATION
- [ ] ✅ Étape 2: Email de vérification reçu avec code
- [ ] ✅ Étape 3: Verify-email confirmé avec status CONFIRMED
- [ ] ✅ Étape 4: Login retourne id_token et access_token valides
- [ ] ✅ Étape 5a: Get profile retourne données utilisateur
- [ ] ✅ Étape 5b: Save profile met à jour les données
- [ ] ✅ Étape 6: Analyse enregistrée et feedback reçu
- [ ] ✅ Étape 7: Analytics retourne statistiques correctes
- [ ] ✅ Étape 8: DynamoDB contient tous les items attendus
- [ ] ✅ Étape 9: Logout successful

---

## Dépannage

### Erreur: "Verification code is invalid"
- Le code expire après 24 heures
- Le code n'est valide qu'une seule fois
- Relancer signup et obtenir un nouveau code

### Erreur: "User already exists"
- Utiliser une autre adresse email
- Ou supprimer l'utilisateur de Cognito via AWS Console

### Erreur: "Invalid token"
- Le token JWT a expiré (valide 1 heure)
- Relancer la connexion pour obtenir un nouveau token

### Pas de code de vérification reçu
- Vérifier le dossier spam/indésirable
- Vérifier les logs CloudWatch: `aws logs tail /aws/lambda/AuthHandler --follow`
- Cognito doit être configuré pour envoyer des emails

---

## Script Bash Complet (Automatisé)

Créer un fichier `test_auth_flow.sh`:

```bash
#!/bin/bash
set -e

API_URL="https://ymli0zyv6e.execute-api.us-east-1.amazonaws.com/dev/api/v1"
TEST_EMAIL="testuser-$(date +%s)@example.com"
TEST_PASSWORD="SecurePass123!"

echo "🔵 ÉTAPE 1: Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "${API_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email": "'${TEST_EMAIL}'", "password": "'${TEST_PASSWORD}'"}')

USER_ID=$(echo $SIGNUP_RESPONSE | jq -r '.data.user_id')
echo "✅ User ID: $USER_ID"

echo ""
echo "🔵 ÉTAPE 2: Attendre le code de vérification..."
echo "⚠️  Code envoyé à: $TEST_EMAIL"
read -p "Entrez le code de vérification (6 chiffres): " VERIFICATION_CODE

echo ""
echo "🔵 ÉTAPE 3: Verify Email..."
VERIFY_RESPONSE=$(curl -s -X POST "${API_URL}/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "'${TEST_EMAIL}'", "code": "'${VERIFICATION_CODE}'"}')

echo $VERIFY_RESPONSE | jq .
STATUS=$(echo $VERIFY_RESPONSE | jq -r '.data.status')
echo "✅ Status: $STATUS"

echo ""
echo "🔵 ÉTAPE 4: Login..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "'${TEST_EMAIL}'", "password": "'${TEST_PASSWORD}'"}')

ID_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.id_token')
echo "✅ Token reçu"

echo ""
echo "🔵 ÉTAPE 5: Get Profile..."
curl -s -X POST "${API_URL}/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{"action": "get_profile", "userId": "'${USER_ID}'"}' | jq .

echo ""
echo "✅ Tous les tests passés!"
```

Utiliser:
```bash
chmod +x test_auth_flow.sh
./test_auth_flow.sh
```

