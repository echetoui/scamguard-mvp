# 🛡️ ScamGuard AI — Roadmap v5.0
## MVP Production-Ready · 10 Utilisateurs · 10 Jours
### Architecture Sécurisée + Optimisée · Mars 2025

---

## 📊 Indicateurs Clés v5.0

| Métrique | v4.0 | **v5.0** | Amélioration |
|----------|------|----------|--------------|
| **Délai** | 7 jours | **10 jours** | +3j buffer |
| **Coût AWS** | $0.10/mo | **$2/mo** | +sécurité |
| **Coût LLM** | $3-5/mo | **$2-3/mo** | -40% optimisé |
| **Production-ready** | ❌ Non | ✅ **Oui** | RGPD + monitoring |
| **Accessibilité** | Basique | **WCAG AAA** | Seniors optimisé |

**Total: $4-5/mois · Production-ready · 10 jours**

---

## 🎯 Changements Majeurs v5.0

### ✅ Sécurité Renforcée
- Secrets Manager (rotation auto)
- Rate limiting par user
- CORS configuré
- Encryption at rest/transit

### ✅ Monitoring Production
- CloudWatch Alarms
- X-Ray tracing
- Dashboard temps réel
- Alertes erreurs

### ✅ Optimisations LLM
- Prompt caching Gemini
- Retry logic + fallback
- Cache DynamoDB scénarios
- Batch requests

### ✅ UX Seniors Optimisée
- Police 24px minimum
- Mode vocal (Web Speech API)
- PWA offline-first
- Contraste WCAG AAA

### ✅ Compliance
- RGPD/PIPEDA basique
- Consentement explicite
- Droit à l'oubli
- Backup automatique

---

## 🏗️ Architecture v5.0

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React PWA)                  │
│  • Service Worker (offline)                              │
│  • Web Speech API (vocal)                                │
│  • Cache local (5 scénarios)                             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS + CORS
┌────────────────────▼────────────────────────────────────┐
│              API Gateway REST API                        │
│  • Cognito Authorizer                                    │
│  • Rate Limiting (10 req/user/jour)                      │
│  • WAF basique (gratuit)                                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 Lambda (Python 3.12)                     │
│  • X-Ray tracing                                         │
│  • Retry logic LLM                                       │
│  • Error handling                                        │
└─────┬──────────────┬──────────────┬─────────────────────┘
      │              │              │
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│ DynamoDB │  │ Secrets  │  │ Gemini Flash │
│ + Backup │  │ Manager  │  │ GPT-4o-mini  │
└──────────┘  └──────────┘  └──────────────┘
```

---

## 📅 Roadmap 10 Jours Détaillée

### **Jour 1-2: Fondations Sécurisées (14h)**

#### Jour 1 (8h)
```bash
# Setup infrastructure
□ CDK bootstrap + structure projet
□ Secrets Manager (Gemini + OpenAI keys)
□ DynamoDB table + backup config
□ API Gateway + Cognito User Pool
□ CloudWatch dashboard basique
```

**Livrables J1:**
- ✅ Infrastructure AWS déployée
- ✅ Secrets sécurisés
- ✅ Monitoring actif

#### Jour 2 (6h)
```bash
# Sécurité + Rate Limiting
□ Lambda authorizer custom
□ DynamoDB table quotas (PK: USER#id, SK: QUOTA#date)
□ CORS configuration
□ X-Ray tracing activé
□ Tests sécurité basiques
```

**Livrables J2:**
- ✅ Rate limiting fonctionnel
- ✅ CORS configuré
- ✅ Tests sécurité passés

---

### **Jour 3-4: Backend Core (16h)**

#### Jour 3 (8h)
```python
# LLMRouter + Cache
□ LLMRouter avec retry logic (3 tentatives)
□ Fallback Gemini ↔ GPT-4o-mini
□ Cache DynamoDB scénarios (TTL 7j)
□ Prompt optimization (tokens réduits)
□ Tests unitaires LLMRouter
```

**Code clé:**
```python
class LLMRouter:
    @retry(tries=3, delay=1, backoff=2)
    def generate_with_cache(self, prompt, cache_key):
        # Check cache first
        cached = self.cache.get(cache_key)
        if cached: return cached
        
        try:
            result = genai.generate(prompt)
        except Exception:
            result = openai.generate(prompt)  # Fallback
        
        self.cache.set(cache_key, result, ttl=604800)
        return result
```

#### Jour 4 (8h)
```python
# 4 Agents IA
□ ScenarioAgent + cache
□ DetectionAgent + vision
□ CoachingAgent + français optimisé
□ AnalyticsAgent + métriques
□ Tests unitaires agents (80% coverage)
```

**Livrables J3-4:**
- ✅ LLMRouter production-ready
- ✅ 4 agents testés
- ✅ Cache fonctionnel (-30% coûts)

---

### **Jour 5-6: API + Database (14h)**

#### Jour 5 (8h)
```python
# Lambda Handler + DynamoDB
□ API routes (POST /scenario, /analyze, /profile)
□ Schéma DynamoDB complet
□ CRUD operations
□ Error handling global
□ Logging structuré
```

**Schéma DynamoDB:**
```
PK: USER#<id>          SK: PROFILE              → Profil user
PK: USER#<id>          SK: SESSION#<timestamp>  → Session training
PK: USER#<id>          SK: ANALYTICS            → Métriques agrégées
PK: USER#<id>          SK: QUOTA#<date>         → Rate limiting
PK: SCENARIO#<id>      SK: METADATA             → Cache scénarios
```

#### Jour 6 (6h)
```bash
# Tests Intégration
□ Tests E2E backend (Postman/pytest)
□ Tests charge (10 users simultanés)
□ Tests rate limiting
□ Tests fallback LLM
□ Documentation API (OpenAPI)
```

**Livrables J5-6:**
- ✅ API complète testée
- ✅ DynamoDB optimisé
- ✅ Documentation API

---

### **Jour 7-8: Frontend PWA (16h)**

#### Jour 7 (10h)
```jsx
# React PWA Structure
□ Architecture composants
  - ScenarioView.jsx
  - DetectionView.jsx
  - ResultView.jsx
  - ProfileView.jsx
□ Hooks custom (useScenario, useAnalysis)
□ Service API centralisé
□ Routing (React Router)
□ State management (Context API)
```

**Structure:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── ScenarioView.jsx
│   │   ├── DetectionView.jsx
│   │   ├── ResultView.jsx
│   │   └── ProfileView.jsx
│   ├── hooks/
│   │   ├── useScenario.js
│   │   ├── useAnalysis.js
│   │   └── useAuth.js
│   ├── services/
│   │   ├── api.js
│   │   └── speech.js
│   ├── styles/
│   │   └── seniors.css (24px+, contraste AAA)
│   └── App.jsx
```

#### Jour 8 (6h)
```jsx
# PWA + Accessibilité
□ Service Worker (offline 5 scénarios)
□ Web Speech API (lecture audio)
□ Mode sombre/clair
□ Police 24px minimum
□ Contraste WCAG AAA
□ Tests accessibilité (Lighthouse)
```

**Livrables J7-8:**
- ✅ PWA fonctionnelle
- ✅ Mode offline
- ✅ Mode vocal
- ✅ Score Lighthouse > 90

---

### **Jour 9: Tests + Compliance (6h)**

```bash
# Tests UX Seniors
□ Tests avec 2 seniors (1h chacun)
□ Ajustements UX basés feedback
□ Tests accessibilité complets

# Compliance RGPD
□ Page consentement
□ Privacy policy
□ Fonction "Supprimer mes données"
□ Logs audit (qui accède quoi)
```

**Checklist RGPD Minimale:**
- ✅ Consentement explicite avant collecte
- ✅ Droit à l'oubli (delete user endpoint)
- ✅ Encryption at rest (DynamoDB)
- ✅ Encryption in transit (HTTPS)
- ✅ Logs accès données
- ✅ Privacy policy visible

**Livrables J9:**
- ✅ UX validée seniors
- ✅ RGPD compliant
- ✅ Tests accessibilité passés

---

### **Jour 10: Deploy + Launch (4h)**

```bash
# Déploiement Production
□ Deploy staging → tests finaux
□ Deploy production (blue/green)
□ Smoke tests production
□ Monitoring alarms actives

# Launch
□ Inviter 10 beta users
□ Documentation utilisateur
□ Support actif (Slack/email)
□ Dashboard monitoring partagé
```

**CloudWatch Alarms:**
- Lambda errors > 5/min
- Lambda duration > 10s
- DynamoDB throttling
- Coût LLM > $10/jour

**Livrables J10:**
- ✅ Production déployée
- ✅ 10 users invités
- ✅ Monitoring actif
- ✅ Documentation complète

---

## 💰 Coûts Détaillés v5.0

### AWS Infrastructure

| Service | Usage | $/mois | Justification |
|---------|-------|--------|---------------|
| **API Gateway** | 1K requests | $0 | Free tier 1M |
| **Lambda** | 500 invocations | $0 | Free tier |
| **DynamoDB** | 2K RCU/WCU | $0 | Free tier |
| **DynamoDB Backup** | 1GB | $0.20 | Point-in-time recovery |
| **Secrets Manager** | 2 secrets | $0.80 | Rotation auto |
| **S3** | 2GB + uploads | $0.10 | Static + images |
| **CloudWatch** | Logs + alarms | $0.50 | 5 alarms |
| **X-Ray** | 100K traces | $0 | Free tier |
| **Cognito** | 10 MAU | $0 | Free tier |
| **CloudFront** | 10GB | $0 | Free tier 1TB |
| **TOTAL AWS** | | **$1.60/mo** | |

### LLM Costs (Optimisé)

| LLM | Usage | $/mois | Optimisation |
|-----|-------|--------|--------------|
| **Gemini Flash** | 1K req/jour | $0 | Free tier + cache |
| **GPT-4o-mini** | 30K tokens/mo | $2-3 | Prompt optimisé |
| **TOTAL LLM** | | **$2-3/mo** | -40% vs v4.0 |

### Total v5.0: **$4-5/mois**

---

## 🔧 Stack Technique v5.0

### Backend
```yaml
Runtime: Python 3.12
Framework: AWS Lambda
API: API Gateway REST
Auth: Cognito + Custom Authorizer
Database: DynamoDB (single table design)
Secrets: Secrets Manager
Monitoring: CloudWatch + X-Ray
IaC: AWS CDK (Python)
```

### Frontend
```yaml
Framework: React 18
PWA: Workbox
Routing: React Router v6
State: Context API
HTTP: Axios + retry
Speech: Web Speech API
Build: Vite
Deploy: S3 + CloudFront
```

### LLMs
```yaml
Primary: Gemini 1.5 Flash (free tier)
Fallback: GPT-4o-mini
Vision: GPT-4o-mini
Cache: DynamoDB (TTL 7 jours)
Retry: 3 tentatives + backoff
```

---

## 📋 Checklist Complète

### Pré-requis (Avant J1)
```bash
□ Compte AWS configuré
□ AWS CLI + CDK installés
□ Clés API Gemini + OpenAI obtenues
□ GitHub repo créé
□ Node.js 18+ installé
□ Python 3.12 installé
```

### Jour 1-2: Infrastructure
```bash
□ CDK bootstrap
□ Secrets Manager configuré
□ DynamoDB table créée
□ API Gateway + Cognito
□ CloudWatch dashboard
□ Rate limiting actif
□ CORS configuré
□ X-Ray tracing
```

### Jour 3-4: Backend
```bash
□ LLMRouter avec retry
□ Cache DynamoDB
□ 4 agents implémentés
□ Tests unitaires > 80%
□ Error handling global
□ Logging structuré
```

### Jour 5-6: API
```bash
□ Lambda handler complet
□ Schéma DynamoDB finalisé
□ Tests E2E backend
□ Tests charge
□ Documentation OpenAPI
```

### Jour 7-8: Frontend
```bash
□ React PWA structure
□ 4 vues principales
□ Service Worker
□ Mode vocal
□ Police 24px+
□ Contraste WCAG AAA
□ Tests Lighthouse > 90
```

### Jour 9: Tests + Compliance
```bash
□ Tests UX 2 seniors
□ Ajustements accessibilité
□ Consentement RGPD
□ Privacy policy
□ Droit à l'oubli
□ Tests sécurité
```

### Jour 10: Launch
```bash
□ Deploy staging
□ Tests finaux
□ Deploy production
□ Alarms actives
□ 10 users invités
□ Documentation
□ Support actif
```

---

## 🎯 Métriques de Succès

### Technique
- ✅ Tests coverage > 80%
- ✅ Lighthouse score > 90
- ✅ Lambda cold start < 2s
- ✅ API latency < 500ms
- ✅ Uptime > 99%

### Business
- ✅ 10 users inscrits
- ✅ 50+ sessions complétées
- ✅ NPS > 40
- ✅ Coût < $5/mois
- ✅ 0 incidents sécurité

### UX Seniors
- ✅ Taux complétion > 80%
- ✅ Temps moyen session < 5min
- ✅ 0 bugs bloquants
- ✅ Feedback positif accessibilité
- ✅ Mode vocal utilisé > 30%

---

## 🔄 Workflow Quotidien

### Matin (9h00)
```bash
git checkout develop
git pull origin develop
gh issue list --assignee @me --label "J[X]"
git checkout -b feature/jX-task-name
```

### Développement
```bash
# Commits fréquents
git add .
git commit -m "feat(scope): description #issue"
git push origin feature/jX-task-name

# Tests continus
pytest tests/ --cov=lambda
npm test
```

### Fin de journée (17h00)
```bash
# Créer PR si terminé
gh pr create --base develop --title "feat: Task name"

# Sinon, push WIP
git push origin feature/jX-task-name
gh issue comment NUM --body "📊 Progress: 70% done"
```

---

## 🆘 Plan de Contingence

### Si retard Jour 1-2
- **Action:** Utiliser Lambda Function URLs (pas API Gateway)
- **Gain:** -4h setup
- **Trade-off:** Pas de rate limiting natif

### Si retard Jour 3-4
- **Action:** Utiliser seulement Gemini (pas GPT-4o-mini)
- **Gain:** -2h intégration
- **Trade-off:** Pas de vision

### Si retard Jour 7-8
- **Action:** Skip mode vocal
- **Gain:** -3h développement
- **Trade-off:** Accessibilité réduite

### Si bugs critiques Jour 9-10
- **Action:** Utiliser Jour 11-12 buffer
- **Gain:** +2 jours debug
- **Trade-off:** Launch retardé

---

## 📊 Comparaison Versions

| Métrique | v3.0 | v4.0 | **v5.0** |
|----------|------|------|----------|
| **Délai** | 6 sem | 7j | **10j** |
| **Coût/mois** | $137 | $3-5 | **$4-5** |
| **Production-ready** | ✅ | ❌ | ✅ |
| **Sécurité** | ✅✅✅ | ⚠️ | ✅✅ |
| **Monitoring** | ✅✅✅ | ⚠️ | ✅✅ |
| **Accessibilité** | ✅ | ⚠️ | ✅✅✅ |
| **RGPD** | ✅✅✅ | ❌ | ✅✅ |
| **Scalabilité** | 500+ | 10 | **50** |

**v5.0 = Sweet spot: Production-ready + Coût minimal + 10 jours**

---

## 🚀 Quick Start v5.0

```bash
# 1. Clone repo
git clone https://github.com/echetoui/scamguard-mvp.git
cd scamguard-mvp
git checkout -b develop

# 2. Setup AWS
aws configure
cdk bootstrap

# 3. Créer secrets
aws secretsmanager create-secret \
  --name scamguard/gemini-key \
  --secret-string "YOUR_KEY"

aws secretsmanager create-secret \
  --name scamguard/openai-key \
  --secret-string "YOUR_KEY"

# 4. Deploy infrastructure
cd backend/cdk
pip install -r requirements.txt
cdk deploy

# 5. Deploy frontend
cd ../../frontend
npm install
npm run build
aws s3 sync dist/ s3://scamguard-frontend-bucket/

# 6. Tests
cd ../backend
pytest tests/ --cov=lambda

cd ../frontend
npm test
npm run lighthouse

# 7. Launch
echo "✅ ScamGuard v5.0 déployé!"
```

---

## 📚 Documentation

### Architecture
- [Architecture Diagram](docs/architecture.md)
- [DynamoDB Schema](docs/dynamodb-schema.md)
- [API Reference](docs/api-reference.md)

### Développement
- [Setup Guide](docs/setup.md)
- [Testing Guide](docs/testing.md)
- [Deployment Guide](docs/deployment.md)

### Compliance
- [Privacy Policy](docs/privacy-policy.md)
- [RGPD Compliance](docs/rgpd.md)
- [Security Best Practices](docs/security.md)

---

## 🎉 Prêt pour Production!

**ScamGuard v5.0** est une architecture production-ready qui:

✅ Protège les seniors efficacement  
✅ Coûte < $5/mois pour 10 users  
✅ Se déploie en 10 jours  
✅ Respecte RGPD/PIPEDA  
✅ Scale jusqu'à 50 users  
✅ Monitoring production complet  

**Prochaine étape:** Démarrer Jour 1! 🚀

---

**Version:** 5.0  
**Date:** Mars 2025  
**Statut:** ✅ Production-Ready  
**Auteur:** @echetoui
