# 🛡️ Guide de Prévention - Éviter les Augmentations de Coûts

**Date:** 21 mars 2026  
**Objectif:** Mettre en place des garde-fous pour éviter les augmentations futures

---

## 🎯 3 Niveaux de Protection

### Niveau 1: Nettoyage Automatique (Immédiat)

#### 1.1 Script de Nettoyage Quotidien

```bash
#!/bin/bash
# scripts/daily-cleanup.sh

# Exécuter chaque jour à 2h du matin
0 2 * * * /path/to/scripts/cleanup-dynamodb-orphans.sh

# Supprimer les tables vides
aws dynamodb list-tables --query 'TableNames' --output text | while read table; do
    ITEM_COUNT=$(aws dynamodb describe-table --table-name "$table" --query 'Table.ItemCount' --output text)
    if [ "$ITEM_COUNT" -eq 0 ] && [ "$table" != "ScamGuardStack-DataTable447BC44E-1AY6QZXNSPP8" ]; then
        echo "Suppression table vide: $table"
        aws dynamodb delete-table --table-name "$table"
    fi
done
```

#### 1.2 Implémenter TTL par Défaut

```python
# backend/cdk/stacks/scamguard_stack.py

# Toutes les tables doivent avoir TTL
table = dynamodb.Table(
    self, "DataTable",
    partition_key=dynamodb.Attribute(
        name="id",
        type=dynamodb.AttributeType.STRING
    ),
    billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
    time_to_live_attribute="expiration_time"  # ← TTL obligatoire
)
```

---

### Niveau 2: Monitoring et Alertes (Court Terme)

#### 2.1 Alertes Coûts

```bash
# Alerter si coûts > $1/mois
aws cloudwatch put-metric-alarm \
  --alarm-name ScamGuard-CostAlert \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --period 86400 \
  --statistic Maximum \
  --threshold 1.0 \
  --alarm-actions arn:aws:sns:us-east-1:034362029181:alerts
```

#### 2.2 Dashboard CloudWatch

```python
# backend/cdk/stacks/monitoring_stack.py

dashboard = cloudwatch.Dashboard(
    self, "CostDashboard",
    dashboard_name="ScamGuard-Costs"
)

# Ajouter widgets
dashboard.add_widgets(
    cloudwatch.GraphWidget(
        title="Coûts AWS",
        left=[
            cloudwatch.Metric(
                namespace="AWS/Billing",
                metric_name="EstimatedCharges",
                statistic="Maximum"
            )
        ]
    )
)
```

#### 2.3 Rapport Mensuel

```bash
#!/bin/bash
# scripts/monthly-cost-report.sh

echo "📊 Rapport Coûts Mensuel"
echo "========================"

# Coûts du mois
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "first day of this month" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --output table

# Ressources actives
echo ""
echo "Ressources Actives:"
aws dynamodb list-tables
aws lambda list-functions --query "Functions[].FunctionName"
aws s3 ls
```

---

### Niveau 3: Gouvernance et Automatisation (Moyen Terme)

#### 3.1 Tagging des Ressources

```python
# backend/cdk/stacks/scamguard_stack.py

from aws_cdk import core

# Tagger toutes les ressources
core.Tags.of(self).add("Project", "ScamGuard")
core.Tags.of(self).add("Environment", "Production")
core.Tags.of(self).add("CostCenter", "MVP")
core.Tags.of(self).add("Owner", "echetoui")
```

#### 3.2 Budget AWS

```bash
# Créer un budget de $5/mois
aws budgets create-budget \
  --account-id 034362029181 \
  --budget '{
    "BudgetName": "ScamGuard-Monthly",
    "BudgetLimit": {
      "Amount": "5",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "FORECASTED",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80
    },
    "Subscribers": [{
      "SubscriptionType": "EMAIL",
      "Address": "your-email@example.com"
    }]
  }]'
```

#### 3.3 Validation des Coûts en CI/CD

```yaml
# .github/workflows/cost-check.yml

name: Cost Check

on: [pull_request]

jobs:
  cost-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Check CDK Costs
        run: |
          # Estimer les coûts du changement
          cdk synth
          
          # Vérifier que les coûts ne dépassent pas $1/mois
          ESTIMATED_COST=$(./scripts/estimate-costs.sh)
          if (( $(echo "$ESTIMATED_COST > 1" | bc -l) )); then
            echo "❌ Coûts estimés trop élevés: $ESTIMATED_COST"
            exit 1
          fi
          echo "✅ Coûts acceptables: $ESTIMATED_COST"
```

---

## 📋 Checklist de Prévention

### Quotidien
- [ ] Vérifier alertes coûts
- [ ] Vérifier tables orphelines
- [ ] Vérifier Lambda invocations

### Hebdomadaire
- [ ] Audit des ressources
- [ ] Vérifier TTL configuré
- [ ] Vérifier monitoring actif

### Mensuel
- [ ] Générer rapport coûts
- [ ] Audit complet des ressources
- [ ] Optimiser si nécessaire
- [ ] Documenter les changements

---

## 🚀 Implémentation Rapide

### Jour 1: Nettoyage (1h)
```bash
# 1. Supprimer tables orphelines
./scripts/cleanup-dynamodb-orphans.sh

# 2. Implémenter TTL
# Modifier backend/cdk/stacks/scamguard_stack.py
cdk deploy

# 3. Configurer alertes
aws cloudwatch put-metric-alarm ...
```

### Jour 2: Monitoring (1h)
```bash
# 1. Créer dashboard
# Modifier backend/cdk/stacks/monitoring_stack.py
cdk deploy

# 2. Créer budget
aws budgets create-budget ...

# 3. Tester alertes
# Vérifier que les alertes fonctionnent
```

### Jour 3: Automatisation (2h)
```bash
# 1. Configurer cron job
crontab -e
# Ajouter: 0 2 * * * /path/to/scripts/daily-cleanup.sh

# 2. Configurer CI/CD
# Ajouter cost-check.yml

# 3. Documenter
# Créer runbook pour les incidents
```

---

## 📊 Résumé Protection

| Niveau | Mesure | Temps | Bénéfice |
|--------|--------|-------|----------|
| **1** | Nettoyage auto | 1h | Prévention |
| **2** | Monitoring | 1h | Détection |
| **3** | Gouvernance | 2h | Prévention |
| **TOTAL** | - | **4h** | **Protection complète** |

---

## 🎓 Leçons Apprises

### ❌ Erreurs à Éviter
1. Déploiements sans nettoyage
2. Pas de TTL sur les données
3. Pas de monitoring des coûts
4. Pas d'alertes sur les dépassements
5. Pas de documentation

### ✅ Bonnes Pratiques
1. Nettoyage automatique quotidien
2. TTL par défaut sur toutes les tables
3. Monitoring continu des coûts
4. Alertes sur les dépassements
5. Documentation des limites free tier
6. Audit mensuel des ressources
7. Validation des coûts en CI/CD

---

## 📚 Ressources

- [AWS Cost Management](https://aws.amazon.com/aws-cost-management/)
- [AWS Budgets](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/budgets-managing-costs.html)
- [CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/WhatIsCloudWatch.html)

---

**Guide créé:** 21 mars 2026  
**Responsable:** @echetoui
