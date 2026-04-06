# 🏗️ AWS Infrastructure Status - ScamGuard MVP

**Date:** 21 mars 2026  
**Compte:** 034362029181  
**Région:** us-east-1  
**Dernière mise à jour:** Après déploiement CDK réussi

---

## ✅ État Actuel

### CloudFormation Stacks

| Stack | Status | Dernière mise à jour | Action |
|-------|--------|---------------------|--------|
| **ScamGuardStack** | ✅ UPDATE_COMPLETE | 2026-03-21 18:07 | Production |
| **AgentsStack** | ✅ UPDATE_COMPLETE | 2026-03-21 18:08 | Agents Framework |
| **scamguard-staging** | ❌ DELETE_FAILED | 2026-02-27 22:19 | À nettoyer |
| **CDKToolkit** | ✅ CREATE_COMPLETE | 2026-02-17 19:42 | Infrastructure |

### Lambda Functions (10 actives)

| Fonction | Mémoire | Runtime | Stack |
|----------|---------|---------|-------|
| Handler | 256 MB | Python 3.12 | ScamGuardStack |
| OrchestratorFunction | 256 MB | Python 3.12 | AgentsStack |
| CriticAgentLambda | 256 MB | Python 3.12 | AgentsStack |
| ArchitectLambda | 256 MB | Python 3.12 | AgentsStack |
| ProjectOwnerLambda | 256 MB | Python 3.12 | AgentsStack |
| ThreatAnalystLambda | 256 MB | Python 3.12 | AgentsStack |
| TriageAgentLambda | 256 MB | Python 3.12 | AgentsStack |
| QAEngineerLambda | 256 MB | Python 3.12 | AgentsStack |
| FamilyNotifierLambda | 256 MB | Python 3.12 | AgentsStack |
| DeveloperLambda | 256 MB | Python 3.12 | AgentsStack |

### Cognito User Pools

| Pool | Utilisateurs | Statut | Action |
|------|--------------|--------|--------|
| User pool - wloaj | 0 | Orpheline | ❌ À supprimer |

### S3 Buckets

| Bucket | Taille | Statut | Action |
|--------|--------|--------|--------|
| cdk-hnb659fds-assets-034362029181-us-east-1 | ~50 MB | CDK Assets | ✅ Garder |
| scamguard-artifacts-034362029181-staging | ~100 MB | Staging | ⚠️ À évaluer |
| scamguardstack-frontendbucketefe2e19c-x4hgcqibndwe | ~53 MB | Frontend | ✅ Production |
| scamguardstack-uploadsbucket5e5e9b64-tcb8tvluetzc | ~0 MB | Uploads | ✅ Production |

### Secrets Manager

| Secret | Statut |
|--------|--------|
| Aucun secret trouvé | ✅ Optimisé |

---

## 💰 Coûts Réels (1-7 mars 2026)

### Résumé par Service

| Service | Coût | Statut |
|---------|------|--------|
| **DynamoDB** | $0.54 USD | Principal coût |
| **AWS Secrets Manager** | ~$0.00 USD | Aucun secret |
| **Lambda** | $0.00 USD | Free tier |
| **API Gateway** | $0.00 USD | Free tier |
| **S3** | ~$0.00 USD | Minimal |
| **CloudWatch** | $0.00 USD | Free tier |
| **TOTAL** | **~$0.54 USD/jour** | **~$16/mois** |

### Projection Mensuelle

```
Coût actuel: ~$16/mois
Coût optimisé: ~$3-5/mois
Économie potentielle: 70-80%
```

---

## 🎯 Opportunités d'Optimisation

### 🔴 PRIORITÉ 1 - Supprimer Ressources Orphelines (Immédiat)

```bash
# 1. Supprimer Cognito pool orpheline
aws cognito-idp delete-user-pool --user-pool-id us-east-1_UdaQ4evwD

# 2. Nettoyer stack staging
aws cloudformation delete-stack --stack-name scamguard-staging
```

**Économie:** -$1-2/mois

### 🟡 PRIORITÉ 2 - Optimiser DynamoDB (1h)

**Problème:** DynamoDB en mode `PAY_PER_REQUEST` coûte $0.54/jour

**Solutions:**
1. **Réduire la rétention des données** (TTL)
2. **Archiver les données anciennes** vers S3
3. **Utiliser le mode provisionné** si charge prévisible

**Économie:** -$5-10/mois

### 🟢 PRIORITÉ 3 - Nettoyer S3 (30 min)

```bash
# Évaluer bucket staging
aws s3 ls s3://scamguard-artifacts-034362029181-staging --recursive --summarize

# Supprimer si inutilisé
aws s3 rb s3://scamguard-artifacts-034362029181-staging --force
```

**Économie:** -$1-2/mois

---

## 📊 Endpoints Actuels

| Service | URL |
|---------|-----|
| **API Gateway** | https://528szyyu3k.execute-api.us-east-1.amazonaws.com/prod/ |
| **Agents Webhook** | https://q83a9xbdxj.execute-api.us-east-1.amazonaws.com/prod/webhook/github |
| **Frontend** | https://dv04w7vjfnkg5.cloudfront.net |

---

## 🔧 Déploiement CDK

### Dernière Exécution

```
✅ ScamGuardStack: UPDATE_COMPLETE (92.5s)
✅ AgentsStack: UPDATE_COMPLETE (50.3s)
Total: 124.33s
```

### Package Lambda

**Avant optimisation:** 215 MB  
**Après optimisation:** 34 MB  
**Réduction:** 84% ✅

---

## ✅ Checklist Nettoyage

- [ ] Supprimer Cognito pool orpheline (us-east-1_UdaQ4evwD)
- [ ] Supprimer stack staging (scamguard-staging)
- [ ] Évaluer bucket staging (scamguard-artifacts-034362029181-staging)
- [ ] Optimiser DynamoDB (TTL + archivage)
- [ ] Mettre à jour documentation

---

## 📝 Notes

- **Lambda Package:** Réduit de 215 MB à 34 MB via nettoyage des dépendances
- **Secrets Manager:** Aucun secret trouvé (optimisé)
- **Cognito:** 1 pool orpheline à supprimer
- **Staging:** Stack en DELETE_FAILED, à nettoyer

---

**Prochaine révision:** 28 mars 2026  
**Responsable:** @echetoui
