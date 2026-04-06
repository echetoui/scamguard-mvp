# 🚀 Plan d'Action - Optimisation AWS ScamGuard

**Date:** 21 mars 2026  
**Objectif:** Réduire coûts de $16/mois à $3-5/mois (70-80% d'économie)

---

## Phase 1: Nettoyage Immédiat (30 min) → -$1-2/mois

### Tâche 1.1: Supprimer Cognito Pool Orpheline

```bash
# Vérifier le pool
aws cognito-idp describe-user-pool --user-pool-id us-east-1_UdaQ4evwD

# Supprimer
aws cognito-idp delete-user-pool --user-pool-id us-east-1_UdaQ4evwD
```

**Économie:** -$0.50/mois

### Tâche 1.2: Nettoyer Stack Staging

```bash
# Vérifier les ressources
aws cloudformation describe-stack-resources --stack-name scamguard-staging

# Supprimer
aws cloudformation delete-stack --stack-name scamguard-staging
```

**Économie:** -$0.50/mois

### Tâche 1.3: Évaluer Bucket Staging

```bash
# Vérifier la taille
aws s3 ls s3://scamguard-artifacts-034362029181-staging --recursive --summarize

# Si vide, supprimer
aws s3 rb s3://scamguard-artifacts-034362029181-staging --force
```

**Économie:** -$0.50/mois

---

## Phase 2: Optimisation DynamoDB (2h) → -$5-10/mois

### Tâche 2.1: Analyser Utilisation DynamoDB

```bash
# Vérifier les tables
aws dynamodb list-tables

# Analyser les métriques
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedWriteCapacityUnits \
  --dimensions Name=TableName,Value=ScamGuardStack-DataTable447BC44E-1AY6QZXNSPP8 \
  --start-time 2026-03-14T00:00:00Z \
  --end-time 2026-03-21T00:00:00Z \
  --period 86400 \
  --statistics Sum
```

### Tâche 2.2: Implémenter TTL

```python
# backend/cdk/stacks/scamguard_stack.py
table.add_ttl(
    attribute=Attr("expiration_time"),
    enabled=True
)
```

**Économie:** -$3-5/mois (supprime données anciennes automatiquement)

### Tâche 2.3: Archiver Données Anciennes

```python
# Créer Lambda pour archivage
def archive_old_data():
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('ScamGuardStack-DataTable447BC44E-1AY6QZXNSPP8')
    
    # Scan items > 30 jours
    response = table.scan(
        FilterExpression='created_at < :cutoff',
        ExpressionAttributeValues={':cutoff': int(time.time()) - 2592000}
    )
    
    # Archiver vers S3
    s3 = boto3.client('s3')
    s3.put_object(
        Bucket='scamguardstack-uploadsbucket5e5e9b64-tcb8tvluetzc',
        Key=f'archive/{datetime.now().isoformat()}.json',
        Body=json.dumps(response['Items'])
    )
    
    # Supprimer de DynamoDB
    for item in response['Items']:
        table.delete_item(Key={'id': item['id']})
```

**Économie:** -$2-5/mois (réduit stockage DynamoDB)

---

## Phase 3: Optimisation Lambda (1h) → -$1-2/mois

### Tâche 3.1: Réduire Timeout Lambda

```python
# backend/cdk/stacks/scamguard_stack.py
handler = lambda_.Function(
    self, "Handler",
    runtime=lambda_.Runtime.PYTHON_3_12,
    handler="handler.main",
    code=lambda_.Code.from_asset("../lambda_"),
    memory_size=256,
    timeout=Duration.seconds(30),  # Réduire de 60 à 30
    environment={...}
)
```

**Économie:** -$0.50/mois (moins de temps d'exécution)

### Tâche 3.2: Utiliser Lambda Layers

```bash
# Créer layer pour dépendances
mkdir -p lambda_layer/python
pip install -r requirements.txt -t lambda_layer/python/

# Zipper
cd lambda_layer && zip -r ../lambda_layer.zip . && cd ..

# Uploader
aws lambda publish-layer-version \
  --layer-name scamguard-dependencies \
  --zip-file fileb://lambda_layer.zip \
  --compatible-runtimes python3.12
```

**Économie:** -$0.50/mois (déploiement plus rapide)

---

## Phase 4: Optimisation S3 (30 min) → -$0.50/mois

### Tâche 4.1: Configurer Lifecycle S3

```python
# backend/cdk/stacks/scamguard_stack.py
uploads_bucket.add_lifecycle_rule(
    transitions=[
        s3.Transition(
            storage_class=s3.StorageClass.GLACIER,
            transition_after=Duration.days(30)
        )
    ],
    expiration=Duration.days(90)
)
```

**Économie:** -$0.50/mois (archive automatique)

---

## 📊 Résumé Économies

| Phase | Tâches | Temps | Économie | Total |
|-------|--------|-------|----------|-------|
| **Phase 1** | 3 | 30 min | -$1-2 | -$1-2 |
| **Phase 2** | 3 | 2h | -$5-10 | -$6-12 |
| **Phase 3** | 2 | 1h | -$1-2 | -$7-14 |
| **Phase 4** | 1 | 30 min | -$0.50 | -$7.50-14.50 |
| **TOTAL** | 9 | 4h | **-$7.50-14.50** | **$1.50-8.50/mois** |

---

## 🎯 Exécution

### Semaine 1: Phase 1 + 2
```bash
# Lundi
./scripts/cleanup-aws.sh  # Phase 1

# Mardi-Mercredi
# Implémenter TTL + archivage (Phase 2)
cdk deploy

# Jeudi
# Tester et valider
```

### Semaine 2: Phase 3 + 4
```bash
# Lundi-Mardi
# Réduire timeout + Lambda Layers (Phase 3)
cdk deploy

# Mercredi
# Configurer S3 Lifecycle (Phase 4)
cdk deploy

# Jeudi-Vendredi
# Monitoring et validation
```

---

## ✅ Checklist

### Phase 1
- [ ] Supprimer Cognito pool orpheline
- [ ] Supprimer stack staging
- [ ] Évaluer et supprimer bucket staging

### Phase 2
- [ ] Analyser utilisation DynamoDB
- [ ] Implémenter TTL
- [ ] Créer Lambda archivage
- [ ] Tester archivage

### Phase 3
- [ ] Réduire timeout Lambda
- [ ] Créer Lambda Layers
- [ ] Tester déploiement

### Phase 4
- [ ] Configurer S3 Lifecycle
- [ ] Tester expiration
- [ ] Valider coûts

---

## 📈 Monitoring

```bash
# Vérifier coûts quotidiens
aws ce get-cost-and-usage \
  --time-period Start=2026-03-21,End=2026-03-28 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

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

**Prochaine révision:** 28 mars 2026  
**Responsable:** @echetoui
