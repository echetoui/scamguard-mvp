# 💰 Analyse Coûts AWS ScamGuard - Plan d'Optimisation

## 📊 État Actuel (Février 2025)

### Coût Réel
```
Coût actuel: $0.00 USD
Raison: Tout dans le free tier + pas d'utilisation
```

### Infrastructure Déployée

| Service | Ressource | Usage | Coût Actuel | Coût Prévu (10 users) |
|---------|-----------|-------|-------------|----------------------|
| **Lambda** | APILambda (512MB, 60s) | 0 invocations | $0 | $0 (free tier) |
| **API Gateway HTTP** | ScamGuard API | 0 requêtes | $0 | $0 (free tier 1M) |
| **DynamoDB** | DataTable (Provisioned 5/5) | 0 items | $0 | $0 (free tier) |
| **S3** | Frontend bucket | ~10 MB | $0.01 | $0.02 |
| **S3** | Uploads bucket | 0 MB | $0 | $0.05 |
| **S3** | CDK assets | ~50 MB | $0.01 | $0.02 |
| **CloudFront** | Distribution | 0 GB | $0 | $0 (free tier 1TB) |
| **CloudWatch Logs** | Lambda logs | ~1 MB | $0 | $0 (free tier 5GB) |
| **Secrets Manager** | 2 secrets | N/A | $0.80 | $0.80 |
| **Gemini API** | 1.5 Flash | 0 req | $0 | $0 (free tier 1.5K/jour) |
| **OpenAI API** | GPT-4o-mini | 0 tokens | $0 | $2-3 |
| **TOTAL** | | | **$0.82/mois** | **$3.70-4.70/mois** |

---

## 🔴 Problèmes Identifiés

### 1. Secrets Manager ($0.80/mois)
**Coût:** $0.40/secret × 2 = $0.80/mois  
**Impact:** 21% du coût total prévu  
**Problème:** Overkill pour un MVP avec 10 users

### 2. Lambda Oversized (512MB)
**Coût actuel:** $0 (free tier)  
**Problème potentiel:** Si >1M invocations, coût élevé  
**Optimisation:** 256MB suffit pour LLM calls

### 3. DynamoDB Backup ($0.20/mois potentiel)
**Coût:** Point-in-time recovery  
**Impact:** Si activé, +$0.20/mois  
**Problème:** Pas nécessaire pour MVP

### 4. CloudWatch Logs Retention (7 jours)
**Coût actuel:** $0 (free tier)  
**Problème potentiel:** Si logs volumineux  
**Optimisation:** 3 jours suffisent pour MVP

### 5. Lambda Orpheline (VerifioAPIHandler)
**Coût:** $0 actuellement  
**Problème:** Ressource inutilisée qui peut générer des coûts

---

## 💡 Plan d'Optimisation - 3 Niveaux

### 🟢 Niveau 1: Optimisations Gratuites (0 min)

**Économie: -$0.80/mois (-21%)**

#### 1.1 Remplacer Secrets Manager par SSM Parameter Store

```bash
# Créer les secrets dans SSM (GRATUIT)
aws ssm put-parameter \
  --name /scamguard/gemini-key \
  --value "YOUR_KEY" \
  --type SecureString

aws ssm put-parameter \
  --name /scamguard/openai-key \
  --value "YOUR_KEY" \
  --type SecureString

# Supprimer Secrets Manager
aws secretsmanager delete-secret \
  --secret-id scamguard/gemini-key \
  --force-delete-without-recovery

aws secretsmanager delete-secret \
  --secret-id scamguard/openai-key \
  --force-delete-without-recovery
```

**Modifier CDK:**
```python
# Avant
gemini_secret = secretsmanager.Secret.from_secret_name_v2(...)

# Après
gemini_param = ssm.StringParameter.from_secure_string_parameter_attributes(
    self, "GeminiParam",
    parameter_name="/scamguard/gemini-key"
)
```

**Économie: -$0.80/mois**

#### 1.2 Supprimer Lambda Orpheline

```bash
aws lambda delete-function --function-name VerifioAPIHandler
```

**Économie: $0 (prévention)**

#### 1.3 Réduire Lambda Memory

```python
# CDK stack
memory_size=256  # Au lieu de 512
```

**Économie: -50% coût Lambda (si hors free tier)**

---

### 🟡 Niveau 2: Optimisations Avancées (2h)

**Économie: -$1-2/mois supplémentaires**

#### 2.1 Cache Agressif DynamoDB

```python
# Cache scénarios 30 jours au lieu de 7
TTL = int(time.time()) + 2592000  # 30 jours

# Économie: -30% appels Gemini
```

**Économie: -$0.50/mois (LLM)**

#### 2.2 Lambda Layers pour Dependencies

```bash
# Séparer code (10KB) des deps (50MB)
# Deploy plus rapide = moins de temps CDK
```

**Économie: Temps de dev**

#### 2.3 CloudWatch Logs Retention 3 jours

```python
# CDK stack
log_retention=logs.RetentionDays.THREE_DAYS  # Au lieu de ONE_WEEK
```

**Économie: -$0.10/mois (si logs volumineux)**

#### 2.4 S3 Lifecycle Aggressive

```python
# Supprimer uploads après 7 jours au lieu de 30
lifecycle_rules=[
    s3.LifecycleRule(
        expiration=Duration.days(7),  # Au lieu de 30
        abort_incomplete_multipart_upload_after=Duration.days(1)
    )
]
```

**Économie: -$0.05/mois**

---

### 🔵 Niveau 3: Architecture Alternative (1 jour)

**Économie: -$2-3/mois**

#### 3.1 Serverless Framework au lieu de CDK

**Avantages:**
- Moins de ressources CloudFormation
- Deploy plus rapide
- Moins de Lambda helpers

**Économie: -$0.20/mois**

#### 3.2 Vercel pour Frontend (au lieu de S3+CloudFront)

**Avantages:**
- $0 (hobby plan)
- Deploy automatique
- Edge functions gratuites
- Analytics inclus

**Économie: -$0.10/mois + meilleur DX**

#### 3.3 Upstash Redis (au lieu de DynamoDB cache)

**Avantages:**
- 10K requêtes/jour gratuites
- Plus rapide que DynamoDB
- Pas de cold start

**Économie: $0 (free tier) + performance**

#### 3.4 Utiliser Gemini 2.0 Flash Thinking (gratuit)

**Avantages:**
- Meilleur que 1.5 Flash
- Toujours gratuit
- Multimodal natif

**Économie: Qualité améliorée**

---

## 📊 Comparaison Plans

| Plan | Temps | Économie | Coût Final | Complexité |
|------|-------|----------|------------|------------|
| **Actuel** | - | - | $3.70-4.70/mois | Moyenne |
| **Niveau 1** | 30 min | -$0.80 | **$2.90-3.90/mois** | Facile |
| **Niveau 2** | 2h | -$1.50 | **$2.20-3.20/mois** | Moyenne |
| **Niveau 3** | 1 jour | -$2.50 | **$1.20-2.20/mois** | Élevée |

---

## 🎯 Recommandation Finale

### ✅ À FAIRE MAINTENANT (Niveau 1)

**Priorité absolue:**
1. **SSM Parameter Store** au lieu de Secrets Manager (-$0.80/mois)
2. **Lambda 256MB** au lieu de 512MB
3. **Supprimer VerifioAPIHandler**

**Temps:** 30 minutes  
**Économie:** -$0.80/mois (-21%)  
**Coût final:** $2.90-3.90/mois

### 🟡 À FAIRE CETTE SEMAINE (Niveau 2)

**Si temps disponible:**
1. Cache 30 jours
2. Logs retention 3 jours
3. S3 lifecycle 7 jours

**Temps:** 2 heures  
**Économie:** -$1.50/mois (-40%)  
**Coût final:** $2.20-3.20/mois

### 🔵 À CONSIDÉRER PLUS TARD (Niveau 3)

**Après validation MVP:**
1. Migrer frontend vers Vercel
2. Évaluer Upstash Redis
3. Tester Gemini 2.0 Flash Thinking

**Temps:** 1 jour  
**Économie:** -$2.50/mois (-67%)  
**Coût final:** $1.20-2.20/mois

---

## 📋 Script d'Optimisation Niveau 1

```bash
#!/bin/bash
# scripts/optimize-costs.sh

echo "💰 Optimisation Coûts ScamGuard - Niveau 1"
echo "=========================================="

# 1. Créer SSM parameters
echo "1️⃣  Migration Secrets Manager → SSM..."
aws ssm put-parameter \
  --name /scamguard/gemini-key \
  --value "$(aws secretsmanager get-secret-value --secret-id scamguard/gemini-key --query SecretString --output text)" \
  --type SecureString \
  --overwrite

aws ssm put-parameter \
  --name /scamguard/openai-key \
  --value "$(aws secretsmanager get-secret-value --secret-id scamguard/openai-key --query SecretString --output text)" \
  --type SecureString \
  --overwrite

echo "   ✅ SSM parameters créés"

# 2. Supprimer Secrets Manager (après deploy CDK modifié)
echo "2️⃣  Suppression Secrets Manager (après deploy CDK)..."
echo "   ⚠️  Exécuter après avoir déployé le CDK modifié"

# 3. Supprimer Lambda orpheline
echo "3️⃣  Suppression Lambda orpheline..."
aws lambda delete-function --function-name VerifioAPIHandler 2>/dev/null || echo "   ⚠️  Déjà supprimée"

echo ""
echo "✅ Optimisation Niveau 1 terminée!"
echo "💰 Économie: -$0.80/mois"
echo ""
echo "Prochaines étapes:"
echo "  1. Modifier backend/cdk/stacks/scamguard_stack.py (SSM au lieu de Secrets Manager)"
echo "  2. cdk deploy"
echo "  3. Supprimer Secrets Manager"
```

---

## 🔍 Monitoring Continu

### Dashboard Coûts

```bash
# Vérifier coûts quotidiens
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost

# Alertes si coût > $5/mois
aws cloudwatch put-metric-alarm \
  --alarm-name ScamGuard-CostAlert \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --period 86400 \
  --statistic Maximum \
  --threshold 5.0
```

---

## 📈 Projection Coûts

### Scénario 1: MVP (10 users)
```
Infrastructure: $0.10
SSM (gratuit): $0
LLM: $2-3
TOTAL: $2.10-3.10/mois ✅
```

### Scénario 2: Croissance (50 users)
```
Infrastructure: $0.50
SSM (gratuit): $0
LLM: $10-15
TOTAL: $10.50-15.50/mois
```

### Scénario 3: Scale (500 users)
```
Infrastructure: $5
Secrets Manager: $0.80 (nécessaire)
LLM: $100-150
TOTAL: $105.80-155.80/mois
→ Migrer vers Bedrock + Reserved Capacity
```

---

## ✅ Checklist Optimisation

### Niveau 1 (30 min)
- [ ] Créer SSM parameters
- [ ] Modifier CDK (SSM au lieu de Secrets Manager)
- [ ] Deploy CDK
- [ ] Supprimer Secrets Manager
- [ ] Supprimer VerifioAPIHandler
- [ ] Réduire Lambda à 256MB
- [ ] Vérifier coûts après 24h

### Niveau 2 (2h)
- [ ] Cache DynamoDB 30 jours
- [ ] Logs retention 3 jours
- [ ] S3 lifecycle 7 jours
- [ ] Lambda Layers
- [ ] Tests performance

### Niveau 3 (1 jour)
- [ ] Évaluer Vercel
- [ ] Tester Upstash Redis
- [ ] Gemini 2.0 Flash Thinking
- [ ] Comparer coûts

---

**Recommandation:** Commencer par Niveau 1 (30 min, -$0.80/mois) 🚀

**Coût final optimal: $2.10-3.10/mois pour 10 users**
