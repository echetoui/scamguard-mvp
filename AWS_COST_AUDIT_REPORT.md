# 🔍 Audit des Coûts AWS - ScamGuard MVP
**Date:** 7 mars 2026  
**Compte:** 034362029181  
**Région:** us-east-1

---

## 📊 Résumé Exécutif

**Coût mensuel estimé actuel:** $8-15/mois  
**Coût optimisé possible:** $3-5/mois  
**Économie potentielle:** **$5-10/mois (50-66%)**

---

## 🚨 Problèmes Identifiés

### 1. ⚠️ STACKS EN DOUBLE (Critique)
**Impact:** $3-6/mois de gaspillage

| Stack | Statut | Ressources | Action |
|-------|--------|------------|--------|
| `scamguard-mvp` | Dev (ancien) | Lambda + API | ❌ Supprimer |
| `scamguard-staging` | Staging | Lambda + API + Cognito | ⚠️ Évaluer |
| `ScamGuardStack` | Prod (actuel) | Lambda + API + S3 | ✅ Garder |
| `AgentsStack` | Nouveau (test?) | 9 Lambdas | ❌ Supprimer si inutilisé |

**Recommandation:** Supprimer `scamguard-mvp` et `AgentsStack` si non utilisés.

---

### 2. 💰 LAMBDAS HAUTE MÉMOIRE (Moyen)
**Impact:** $2-4/mois

| Fonction | Mémoire | Timeout | Coût/1M invocations | Recommandation |
|----------|---------|---------|---------------------|----------------|
| `scamguard-handler-staging` | 1536 MB | 60s | $25.00 | Réduire à 512 MB |
| `scamguard-handler-dev` | 1536 MB | 60s | $25.00 | Réduire à 512 MB |
| `scamguard-sms-otp-staging` | 1024 MB | 60s | $17.00 | Réduire à 256 MB |
| `scamguard-sms-otp-dev` | 1024 MB | 60s | $17.00 | Réduire à 256 MB |

**Recommandation:** Tester avec 512 MB pour handlers, 256 MB pour SMS OTP.

---

### 3. 🗄️ COGNITO USER POOLS EN DOUBLE (Faible)
**Impact:** $0.50-1/mois

| Pool | Utilisateurs | Statut | Action |
|------|--------------|--------|--------|
| `scamguard-users-dev` | 3 | Dev | ✅ Garder |
| `scamguard-users-staging` | 322 | Staging | ⚠️ Évaluer |
| `User pool - wloaj` | 0 | Orphelin | ❌ Supprimer |

**Recommandation:** Supprimer `User pool - wloaj` (0 utilisateurs).

---

### 4. 📦 S3 BUCKETS EN DOUBLE (Faible)
**Impact:** $0.50-1/mois

| Bucket | Taille | Statut | Action |
|--------|--------|--------|--------|
| `scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw` | 53 MB | Ancien | ❌ Supprimer |
| `scamguardstack-frontendbucketefe2e19c-x4hgcqibndwe` | 0 MB | Nouveau | ✅ Garder |
| `scamguardstack-uploadsbucket5e5e9b64-y8dimi30melv` | 0 MB | Ancien | ❌ Supprimer |
| `scamguardstack-uploadsbucket5e5e9b64-tcb8tvluetzc` | 0 MB | Nouveau | ✅ Garder |

**Recommandation:** Supprimer les anciens buckets après migration.

---

### 5. ⚡ LAMBDA ORPHELINE (Faible)
**Impact:** $0.10-0.50/mois

| Fonction | Runtime | Statut | Action |
|----------|---------|--------|--------|
| `VerifioAPIHandler` | nodejs18.x | Orpheline | ❌ Supprimer |

**Recommandation:** Supprimer immédiatement (reste de Verifio).

---

## 💡 Recommandations Prioritaires

### 🔴 PRIORITÉ 1 - Supprimer ressources inutilisées
**Économie:** $3-5/mois

```bash
# Supprimer stacks en double
aws cloudformation delete-stack --stack-name scamguard-mvp
aws cloudformation delete-stack --stack-name AgentsStack

# Supprimer Lambda orpheline
aws lambda delete-function --function-name VerifioAPIHandler

# Supprimer Cognito orphelin
aws cognito-idp delete-user-pool --user-pool-id us-east-1_UdaQ4evwD
```

---

### 🟡 PRIORITÉ 2 - Optimiser mémoire Lambda
**Économie:** $2-3/mois

```bash
# Réduire mémoire handlers (tester d'abord)
aws lambda update-function-configuration \
  --function-name scamguard-handler-staging \
  --memory-size 512

aws lambda update-function-configuration \
  --function-name scamguard-sms-otp-staging \
  --memory-size 256
```

---

### 🟢 PRIORITÉ 3 - Nettoyer S3
**Économie:** $0.50-1/mois

```bash
# Supprimer anciens buckets (après vérification)
aws s3 rb s3://scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw --force
aws s3 rb s3://scamguardstack-uploadsbucket5e5e9b64-y8dimi30melv --force
```

---

## 📈 Bonnes Pratiques Appliquées

### ✅ Ce qui fonctionne bien:

1. **DynamoDB en PAY_PER_REQUEST** - Excellent choix pour faible charge
2. **Lambda Python 3.12** - Runtime moderne et performant
3. **API Gateway HTTP** - Plus économique que REST API
4. **Pas de NAT Gateway** - Économie de $32/mois
5. **Pas de RDS** - DynamoDB suffit pour MVP

---

## 🎯 Architecture Cible Optimisée

### Stack Unique Recommandée:
```
ScamGuardStack (Production)
├── Lambda: 256-512 MB (optimisé)
├── API Gateway HTTP
├── DynamoDB: PAY_PER_REQUEST
├── Cognito: 1 User Pool
├── S3: 2 buckets (frontend + uploads)
└── CloudFront (si nécessaire)
```

**Coût estimé:** $3-5/mois

---

## 📋 Plan d'Action

### Phase 1 - Nettoyage Immédiat (30 min)
- [ ] Supprimer `VerifioAPIHandler`
- [ ] Supprimer `User pool - wloaj`
- [ ] Supprimer stack `scamguard-mvp` (si non utilisée)
- [ ] Supprimer stack `AgentsStack` (si test terminé)

### Phase 2 - Optimisation Lambda (1h)
- [ ] Tester handlers avec 512 MB
- [ ] Tester SMS OTP avec 256 MB
- [ ] Monitorer performances pendant 24h
- [ ] Appliquer si OK

### Phase 3 - Consolidation (2h)
- [ ] Décider: garder staging ou non?
- [ ] Migrer données si nécessaire
- [ ] Supprimer anciens buckets S3
- [ ] Documenter architecture finale

---

## 💰 Estimation Coûts Post-Optimisation

| Service | Avant | Après | Économie |
|---------|-------|-------|----------|
| Lambda | $3-5 | $1-2 | $2-3 |
| DynamoDB | $0 | $0 | $0 |
| API Gateway | $1-2 | $1 | $0-1 |
| S3 + CloudFront | $1-2 | $0.50 | $0.50-1.50 |
| Cognito | $1-2 | $0.50 | $0.50-1.50 |
| Autres | $2-4 | $0.50 | $1.50-3.50 |
| **TOTAL** | **$8-15** | **$3-5** | **$5-10** |

---

## 🔗 Ressources

- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [Cost Optimization Best Practices](https://aws.amazon.com/architecture/cost-optimization/)

---

**Prochaine révision:** 14 mars 2026  
**Responsable:** @echetoui
