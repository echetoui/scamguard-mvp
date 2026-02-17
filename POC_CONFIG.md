# ScamGuard POC - Configuration Ultra Économique

## Coût Actuel: $124/mois ❌
## Coût POC: $0-5/mois ✅

---

## Stratégie POC: Utiliser la Couche Gratuite AWS

### 1. DynamoDB: Change à ON-DEMAND (Gratuit en POC)

**Avant (Provisioned):**
- 25 RCU/WCU = $25/mois
- Capacité réservée même si non utilisée

**Après (On-Demand - POC):**
- Payez seulement ce que vous utilisez
- Pour un POC: **$0-1/mois**
- Scalable automatiquement
- Parfait pour tester sans charge

### 2. Lambda: Gratuit avec Free Tier

**Free Tier AWS:**
- 1M invocations/mois = GRATUIT
- 400,000 GB-secondes = GRATUIT
- Pour POC: quelques centaines de requêtes = **$0**

### 3. API Gateway: Gratuit avec Free Tier

**Free Tier:**
- 1M requêtes/mois = GRATUIT
- Pour POC: **$0**

### 4. CloudWatch Logs: Quasi Gratuit

**Réduction:**
- Rétention: 7 jours au lieu de 14 = moins de logs stockés
- Coût: **$0-2/mois**

### 5. Secrets Manager: Gratuit pour 1 secret

**Options:**
- AWS free tier: 1 secret gratuit pendant 1 an
- Coût: **$0**

### 6. Cognito: Gratuit pour 50K MAU

**Free Tier:**
- 50,000 Monthly Active Users = GRATUIT
- Pour POC avec quelques utilisateurs de test: **$0**

---

## TOTAL POC: **$0-3/mois** 🎉

---

## Comment Modifier pour POC

### Étape 1: Modifiez template.yaml

Changez BillingMode pour DynamoDB:

**Avant:**
```yaml
DataTable:
  BillingMode: PROVISIONED
  ProvisionedThroughputSettings:
    ReadCapacityUnits: 25
    WriteCapacityUnits: 25
```

**Après (POC):**
```yaml
DataTable:
  BillingMode: PAY_PER_REQUEST  # ← Changez ça!
```

Pareil pour AuditTable.

### Étape 2: Déployez avec SAM

```bash
cd backend

# Déployez avec override du mode de facturation
sam build --use-container

sam deploy \
  --stack-name scamguard-mvp-poc \
  --parameter-overrides \
    Environment=poc \
    DynamoDBBillingMode=PAY_PER_REQUEST

# OU modifiez samconfig.toml:
cat > samconfig.toml << 'EOF'
[poc]
[poc.deploy]
billing_mode = "PAY_PER_REQUEST"
environment = "poc"
EOF

sam deploy --config-env poc
```

---

## Comparaison: POC vs Production

| Ressource | POC | Production |
|-----------|-----|------------|
| **DynamoDB** | On-Demand ($0-5) | Provisioned 25 RCU/WCU ($25) |
| **Lambda** | Free Tier ($0) | 10 concurrent ($45) |
| **API Gateway** | Free Tier ($0) | 1M requests ($3.50) |
| **CloudWatch** | 7-day retention ($0-1) | 30-day retention ($50) |
| **Secrets Manager** | 1 free secret ($0) | $0.40 |
| **TOTAL** | **$0-3** | **$124** |

---

## AWS Free Tier Durée

**Gratuit pendant 12 mois:**
- ✅ Lambda: 1M invocations
- ✅ DynamoDB: 25 GiB (peut être gratuit avec pay-per-request)
- ✅ API Gateway: 1M requêtes
- ✅ CloudWatch: 5 GB logs (peut suffire)

**Après 12 mois:**
- Migrez à Production config ($124/mois)
- Ou continuez en POC ($0-3/mois)

---

## Coûts Additionnels (API Keys)

### OpenAI Vision API
- **Free Trial**: $5 crédit
- **Usage POC**: quelques cents pour tester
- **Coût**: $0-5 pour POC

### Google Gemini
- **Free Tier**: 60 requêtes/minute, illimité
- **Coût POC**: **$0**

---

## Étapes pour Passer à POC

### 1. Modifiez template.yaml

```bash
cd backend

# Changez les deux tables DynamoDB:
sed -i '' 's/BillingMode: PROVISIONED/BillingMode: PAY_PER_REQUEST/g' template.yaml
sed -i '' '/ProvisionedThroughputSettings/,/WriteCapacityUnits: [0-9]*/d' template.yaml
```

### 2. Déployez POC

```bash
./deploy.sh

# Quand demandé:
# Environment: poc
# OpenAI Key: (utilisez free trial)
# Gemini Key: (free tier)
```

### 3. Vérifiez les Coûts

```bash
# Allez à AWS Cost Explorer
# https://console.aws.amazon.com/cost-management/home#/custom
```

---

## Monitoring Coûts POC

```bash
# Voir les coûts actuels
aws ce get-cost-and-usage \
  --time-period Start=2026-02-17,End=2026-02-24 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## Quand Passer à Production

Migrez à la config $124/mois quand:
- ✅ Vous avez des utilisateurs réels
- ✅ Vous avez validé le produit
- ✅ Vous avez des vrais clients

Jusqu'à ce moment: **Restez en POC ($0-3/mois)**

---

## Récapitulatif POC

✅ **Coût**: $0-3/mois
✅ **Scaling**: Automatique (pay-per-request)
✅ **Performance**: Suffisant pour quelques utilisateurs
✅ **API Keys**: Utilisez free tier (Gemini) + free trial (OpenAI)
✅ **Durée**: 12 mois gratuit AWS Free Tier

---

## Commandes Rapides POC

```bash
# 1. Modifiez template.yaml
cd backend
sed -i '' 's/PROVISIONED/PAY_PER_REQUEST/g' template.yaml

# 2. Créez config POC
cat > samconfig.toml << 'EOF'
[poc]
[poc.deploy]
[poc.deploy.parameters]
stack_name = "scamguard-mvp-poc"
environment = "poc"
parameter_overrides = [
  "Environment=poc"
]
EOF

# 3. Déployez
sam build --use-container
sam deploy --config-env poc

# 4. Vérifiez les coûts
# https://console.aws.amazon.com/cost-management/
```

---

## Après POC: Scaling à Production

Quand vous êtes prêt pour les vrais utilisateurs:

```bash
# Créez stack production
./deploy.sh
# Environment: prod
# Uses Provisioned DynamoDB with 50 RCU/WCU
# Coût: ~$300/mois pour 100+ utilisateurs
```

---

**TL;DR pour POC:**

```bash
# 1. Changez template.yaml: PROVISIONED → PAY_PER_REQUEST
# 2. Déployez avec ./deploy.sh
# 3. Coût: $0-3/mois au lieu de $124/mois
# 4. Quand clients arrivent: Passez à production
```

Vous êtes POC, pas une startup avec millions de requêtes! 🚀
