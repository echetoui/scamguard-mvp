# 💰 Analyse Détaillée des Coûts AWS - ScamGuard MVP

**Date:** 21 mars 2026  
**Compte:** 034362029181  
**Région:** us-east-1  
**Période analysée:** 1er janvier - 21 mars 2026

---

## 📊 Résumé Exécutif

### Coûts Réels (Données AWS)

| Période | Coût Réel | Statut |
|---------|-----------|--------|
| **Janvier 2026** | $0.0000000086 | Pratiquement nul |
| **Février 2026** | $0.0000000539 | Pratiquement nul |
| **Mars 2026** (1-21) | $0.0000018042 | Pratiquement nul |
| **TOTAL 3 mois** | **$0.0000018667** | **Gratuit (free tier)** |

### Coûts par Service (Mars 1-21)

| Service | Coût | Statut |
|---------|------|--------|
| **Amazon DynamoDB** | $0.0000020160 | Principal |
| **AWS Secrets Manager** | -$0.0000002092 | Crédit |
| **AWS Amplify** | -$0.0000000022 | Crédit |
| **S3** | -$0.0000000004 | Crédit |
| **TOTAL** | **$0.0000018042** | **Gratuit** |

---

## 🎯 Analyse Détaillée

### 1. DynamoDB: $0.0000020160 (Mars 1-21)

**Projection mensuelle:** ~$0.000003 USD/mois  
**Projection annuelle:** ~$0.00004 USD/an

**Raison:** 
- Mode PAY_PER_REQUEST (facturation à l'utilisation)
- Très faible utilisation (MVP en développement)
- Free tier: 25 GB de stockage gratuit
- Free tier: 25 unités de lecture/écriture gratuites

**Conclusion:** ✅ Coût négligeable

### 2. AWS Secrets Manager: -$0.0000002092 (Crédit)

**Raison:** Crédit AWS ou ajustement de facturation

**Conclusion:** ✅ Gratuit

### 3. Autres Services: Gratuit

- **Lambda:** $0 (free tier: 1M invocations/mois)
- **API Gateway:** $0 (free tier: 1M requêtes/mois)
- **CloudWatch:** $0 (free tier: 5 GB logs/mois)
- **Cognito:** $0 (free tier: 50K utilisateurs/mois)
- **S3:** $0 (free tier: 5 GB stockage)
- **CloudFront:** $0 (free tier: 1 TB/mois)

---

## 💡 Comparaison: Documentation vs Réalité

### Documentation Ancienne (Obsolète)

```
Coût estimé: $8-15/mois
Raison: Estimation basée sur hypothèses
```

### Réalité (Données AWS)

```
Coût réel: ~$0.000002/mois (pratiquement gratuit)
Raison: Utilisation extrêmement faible (MVP)
```

### Écart

**Documentation était 4,000,000x trop élevée !**

---

## 🔍 Pourquoi les Coûts Sont Si Bas?

### 1. Free Tier AWS
- Compte créé récemment (février 2026)
- Toutes les ressources dans le free tier
- Pas de dépassement des limites

### 2. Utilisation Très Faible
- MVP en développement
- Pas d'utilisateurs en production
- Pas de trafic réel
- Pas de données volumineuses

### 3. Architecture Optimisée
- Lambda: 256 MB (minimal)
- DynamoDB: PAY_PER_REQUEST (pas de surprovisionnement)
- Pas de NAT Gateway
- Pas de RDS
- Pas de EC2

---

## 📈 Projection Coûts Futurs

### Scénario 1: MVP (10 utilisateurs)
```
DynamoDB:     $0.50/mois (stockage + requêtes)
Lambda:       $0.00/mois (free tier)
API Gateway:  $0.00/mois (free tier)
S3:           $0.10/mois (uploads)
Cognito:      $0.00/mois (free tier)
TOTAL:        ~$0.60/mois
```

### Scénario 2: Croissance (100 utilisateurs)
```
DynamoDB:     $5.00/mois (stockage + requêtes)
Lambda:       $0.50/mois (dépassement free tier)
API Gateway:  $0.50/mois (dépassement free tier)
S3:           $1.00/mois (uploads)
Cognito:      $0.00/mois (free tier)
LLM (Gemini): $0.00/mois (free tier 1.5K/jour)
TOTAL:        ~$7.00/mois
```

### Scénario 3: Scale (1000 utilisateurs)
```
DynamoDB:     $50.00/mois (stockage + requêtes)
Lambda:       $5.00/mois (invocations)
API Gateway:  $5.00/mois (requêtes)
S3:           $10.00/mois (uploads)
Cognito:      $0.00/mois (free tier)
LLM (Gemini): $0.00/mois (free tier)
TOTAL:        ~$70.00/mois
```

### Scénario 4: Production (10,000 utilisateurs)
```
DynamoDB:     $500.00/mois (stockage + requêtes)
Lambda:       $50.00/mois (invocations)
API Gateway:  $50.00/mois (requêtes)
S3:           $100.00/mois (uploads)
Cognito:      $0.00/mois (free tier)
LLM (Gemini): $100.00/mois (dépassement free tier)
TOTAL:        ~$800.00/mois
```

---

## ✅ Optimisations Déjà Appliquées

### 1. ✅ Lambda Package Optimisé
- **Avant:** 215 MB (dépassait limite)
- **Après:** 34 MB (84% de réduction)
- **Impact:** Déploiement plus rapide, moins de coûts

### 2. ✅ Pas de Secrets Manager
- **Coût évité:** $0.40/mois par secret
- **Solution:** Utiliser SSM Parameter Store (gratuit)

### 3. ✅ DynamoDB PAY_PER_REQUEST
- **Coût:** Facturation à l'utilisation
- **Avantage:** Pas de surprovisionnement
- **Impact:** Coûts minimaux pour MVP

### 4. ✅ Pas de NAT Gateway
- **Coût évité:** $32/mois
- **Raison:** Pas besoin pour Lambda

### 5. ✅ Pas de RDS
- **Coût évité:** $50-200/mois
- **Solution:** DynamoDB suffit pour MVP

---

## 🎯 Recommandations

### Immédiat (Gratuit)
- ✅ Continuer avec architecture actuelle
- ✅ Monitorer les coûts mensuellement
- ✅ Rester dans le free tier

### Court Terme (Avant 100 utilisateurs)
- Implémenter TTL DynamoDB (archivage automatique)
- Configurer S3 Lifecycle (archivage S3)
- Monitorer utilisation Lambda

### Moyen Terme (100-1000 utilisateurs)
- Évaluer Reserved Capacity DynamoDB
- Utiliser Lambda Layers pour réduire taille
- Implémenter caching (Redis/ElastiCache)

### Long Terme (1000+ utilisateurs)
- Migrer vers Bedrock pour LLM (coûts réduits)
- Utiliser DynamoDB Global Tables (si multi-région)
- Implémenter CDN caching agressif

---

## 📊 Tableau Comparatif: Coûts vs Utilisateurs

```
Utilisateurs | Coût Estimé | Coût/Utilisateur
─────────────┼─────────────┼──────────────────
10           | $0.60       | $0.06
50           | $2.00       | $0.04
100          | $7.00       | $0.07
500          | $30.00      | $0.06
1,000        | $70.00      | $0.07
5,000        | $300.00     | $0.06
10,000       | $800.00     | $0.08
```

---

## ✅ Checklist Monitoring

- [ ] Vérifier coûts AWS chaque semaine
- [ ] Alerter si coûts > $1/mois
- [ ] Analyser utilisation DynamoDB
- [ ] Vérifier dépassements free tier
- [ ] Documenter croissance utilisateurs

---

## 📝 Conclusion

### État Actuel
- **Coûts réels:** Pratiquement gratuit (~$0.000002/mois)
- **Raison:** Free tier AWS + utilisation très faible
- **Documentation ancienne:** 4,000,000x trop élevée

### Prochaines Étapes
1. Continuer avec architecture actuelle
2. Monitorer les coûts mensuellement
3. Optimiser quand utilisation augmente
4. Planifier scaling à 100+ utilisateurs

### Verdict
✅ **Architecture très économique pour MVP**  
✅ **Coûts négligeables jusqu'à 100 utilisateurs**  
✅ **Scalable et rentable**

---

**Analyse complétée:** 21 mars 2026  
**Prochaine révision:** 28 mars 2026  
**Responsable:** @echetoui
