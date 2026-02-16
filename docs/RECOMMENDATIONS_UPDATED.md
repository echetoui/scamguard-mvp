# 🎯 Recommandations Prioritaires - ScamGuard v5.0

## État Actuel

```
✅ Infrastructure AWS (CDK)     100% - Production-ready
✅ Documentation                100% - Complète
✅ Scripts déploiement          100% - Automatisés
✅ Optimisations P0/P1          100% - Appliquées
❌ Backend Lambda                 0% - BLOQUANT CRITIQUE
❌ Frontend                       0% - À faire Jour 4-5
❌ Tests                          0% - À faire Jour 3
```

---

## 🔴 P0 - CRITIQUE (Bloquants)

### 1. ✅ HTTP API v2 (FAIT)
**Status:** Appliqué dans CDK stack  
**Impact:** -50% latence, architecture moderne  
**Coût:** $0 (free tier identique)

### 2. ✅ Rate Limiting API Gateway (FAIT)
**Status:** Throttling natif configuré (10 req/user/jour)  
**Impact:** Sécurité native, pas besoin DynamoDB quotas  
**Code:** Simplifié

### 3. ❌ Backend Lambda Handler (BLOQUANT!)
**Status:** Fichiers manquants  
**Impact:** Rien ne fonctionne sans ça  
**Action:** Créer structure complète

```
backend/lambda/
├── index.py              # Handler principal + routing
├── llm_router.py         # Gemini + GPT-4o avec retry
├── agents/
│   ├── __init__.py
│   ├── scenario.py       # ScenarioAgent
│   ├── detection.py      # DetectionAgent
│   ├── coaching.py       # CoachingAgent
│   └── analytics.py      # AnalyticsAgent
├── utils/
│   ├── __init__.py
│   ├── errors.py         # Error handling
│   └── logger.py         # Structured logging
└── requirements.txt      # Dependencies
```

**Temps estimé:** 4-6h  
**Priorité:** IMMÉDIATE

### 4. ❌ Error Handling Standardisé (CRITIQUE)
**Status:** Non implémenté  
**Impact:** Users verront des 500 bruts  
**Action:** 
```python
# utils/errors.py
class ScamGuardError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code

# Retourner JSON user-friendly en français
{
    "error": "Désolé, une erreur est survenue",
    "code": "SCENARIO_GENERATION_FAILED",
    "retry": true
}
```

**Temps estimé:** 1h  
**Priorité:** IMMÉDIATE

### 5. ❌ S3 Presigned URLs (CRITIQUE)
**Status:** Non implémenté  
**Impact:** Upload images ne fonctionnera pas  
**Action:**
```python
# Dans Lambda
def generate_upload_url():
    return s3_client.generate_presigned_url(
        'put_object',
        Params={'Bucket': bucket, 'Key': key},
        ExpiresIn=300
    )
```

**Temps estimé:** 30 min  
**Priorité:** IMMÉDIATE

---

## 🟡 P1 - IMPORTANT (Cette semaine)

### 6. ✅ DynamoDB Provisioned (FAIT)
**Status:** 5 RCU/WCU configuré  
**Impact:** -$0.20/mois, gratuit avec free tier  
**Validation:** Suffisant pour 10 users

### 7. ✅ Lambda Timeout 60s (FAIT)
**Status:** Configuré dans CDK  
**Impact:** Vision analysis fiable (GPT-4o peut prendre 30-40s)

### 8. ❌ Lambda Powertools (IMPORTANT)
**Status:** Env var configuré mais pas utilisé  
**Impact:** Logging structuré, tracing, metrics  
**Action:**
```python
# requirements.txt
aws-lambda-powertools==2.31.0

# index.py
from aws_lambda_powertools import Logger, Tracer
logger = Logger()
tracer = Tracer()

@tracer.capture_lambda_handler
def handler(event, context):
    logger.info("Request received", extra={"user_id": user_id})
```

**Temps estimé:** 30 min  
**Priorité:** Jour 2

### 9. ❌ Lambda Layers (IMPORTANT)
**Status:** Non configuré  
**Impact:** Deploy plus rapide, code séparé des deps  
**Action:**
```python
# CDK stack
layer = lambda_.LayerVersion(
    self, "DepsLayer",
    code=lambda_.Code.from_asset("../lambda/layer"),
    compatible_runtimes=[lambda_.Runtime.PYTHON_3_12]
)

api_lambda = lambda_.Function(
    ...
    layers=[layer]
)
```

**Temps estimé:** 1h  
**Priorité:** Jour 3

### 10. ❌ Environment Validation (IMPORTANT)
**Status:** Non implémenté  
**Impact:** Fail fast si config incorrecte  
**Action:**
```python
# utils/config.py
from pydantic import BaseModel
import os

class Config(BaseModel):
    table_name: str
    uploads_bucket: str
    gemini_secret_arn: str
    openai_secret_arn: str

config = Config(
    table_name=os.environ["TABLE_NAME"],
    uploads_bucket=os.environ["UPLOADS_BUCKET"],
    gemini_secret_arn=os.environ["GEMINI_SECRET_ARN"],
    openai_secret_arn=os.environ["OPENAI_SECRET_ARN"]
)
```

**Temps estimé:** 30 min  
**Priorité:** Jour 2

### 11. ❌ Tests Unitaires (IMPORTANT)
**Status:** Aucun test  
**Impact:** Pas de validation du code  
**Action:**
```bash
backend/tests/
├── test_llm_router.py
├── test_agents.py
└── test_handler.py

# pytest + coverage
pytest tests/ --cov=lambda --cov-report=html
```

**Temps estimé:** 3h  
**Priorité:** Jour 3

---

## 🟢 P2 - RECOMMANDÉ (Semaine 1-2)

### 12. ⏳ Next.js 15 Frontend
**Status:** À faire  
**Impact:** Meilleur DX, SEO, deploy simplifié  
**Action:** Utiliser Next.js au lieu de React PWA  
**Temps estimé:** 6h (Jour 4-5)  
**Priorité:** Jour 4

**Pourquoi:**
- React PWA = 2020, Next.js 15 = 2025
- Deploy Vercel en 5 min vs S3+CloudFront complexe
- ISR pour scénarios = cache gratuit
- App Router + Server Components

### 13. ⏳ Gemini 1.5 Flash (pas 2.0)
**Status:** À implémenter  
**Impact:** Gratuit, stable, performant  
**Action:**
```python
# llm_router.py
model = genai.GenerativeModel('gemini-1.5-flash')
# PAS gemini-2.0-flash-exp (encore experimental)
```

**Temps estimé:** Inclus dans backend  
**Priorité:** Jour 2

**Note:** Gemini 2.0 Flash est "experimental", attendre stabilité

### 14. ⏳ Cache DynamoDB Scénarios
**Status:** À implémenter  
**Impact:** -30% appels LLM  
**Action:**
```python
# Avant appel Gemini
cached = table.get_item(Key={"PK": f"SCENARIO#{hash}", "SK": "CACHE"})
if cached and not expired:
    return cached

# Après génération
table.put_item(Item={
    "PK": f"SCENARIO#{hash}",
    "SK": "CACHE",
    "TTL": int(time.time()) + 604800,  # 7 jours
    "data": scenario
})
```

**Temps estimé:** 1h  
**Priorité:** Jour 3

### 15. ⏳ Retry Logic avec Backoff
**Status:** À implémenter  
**Impact:** Fiabilité face aux erreurs LLM  
**Action:**
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def call_gemini(prompt):
    return genai.generate(prompt)
```

**Temps estimé:** 30 min  
**Priorité:** Jour 2

### 16. ⏳ Fallback LLM
**Status:** À implémenter  
**Impact:** Haute disponibilité  
**Action:**
```python
try:
    return call_gemini(prompt)
except Exception:
    logger.warning("Gemini failed, fallback to GPT-4o-mini")
    return call_openai(prompt)
```

**Temps estimé:** 30 min  
**Priorité:** Jour 3

---

## 🔵 P3 - BONUS (Semaine 2+)

### 17. Gemini 2.0 Flash
**Quand:** Quand stable (pas experimental)  
**Impact:** Multimodal natif, 2x plus rapide

### 18. Redis Cache
**Quand:** Si >50 users  
**Impact:** Performance, mais overkill pour 10 users

### 19. Monitoring X-Ray Avancé
**Status:** Déjà activé dans CDK  
**Action:** Juste utiliser la console AWS

### 20. CI/CD GitHub Actions
**Quand:** Après MVP validé  
**Impact:** Deploy automatique sur push

---

## 📅 Roadmap Révisée

### Jour 2 (AUJOURD'HUI - 8h)
```
✅ P0: Backend Lambda structure complète (4h)
  - index.py + routing
  - llm_router.py (Gemini 1.5 + GPT-4o-mini)
  - 4 agents basiques
  
✅ P0: Error handling (1h)
✅ P0: S3 presigned URLs (30min)
✅ P1: Lambda Powertools (30min)
✅ P1: Environment validation (30min)
✅ P2: Retry logic (30min)

Tests locaux: 1h
```

### Jour 3 (6h)
```
✅ P1: Tests unitaires (3h)
✅ P1: Lambda Layers (1h)
✅ P2: Cache DynamoDB (1h)
✅ P2: Fallback LLM (30min)

Deploy CDK + tests E2E: 30min
```

### Jour 4-5 (10h)
```
✅ P2: Frontend Next.js 15 (6h)
  - Setup + 4 pages principales
  - Cognito auth
  - API client
  
✅ Deploy Vercel (1h)
✅ Tests E2E (2h)
✅ Ajustements UX (1h)
```

### Jour 6-7 (6h)
```
✅ Tests avec 2 seniors (2h)
✅ Ajustements accessibilité (2h)
✅ Documentation utilisateur (1h)
✅ Launch 10 beta users (1h)
```

---

## 💰 Impact Coûts

| Optimisation | Économie |
|--------------|----------|
| HTTP API v2 | $0 (même coût, meilleure perf) |
| DynamoDB Provisioned | -$0.20/mois |
| Rate limiting natif | -$0 (simplifie code) |
| Cache scénarios | -$0.50/mois (LLM) |
| **TOTAL** | **-$0.70/mois** |

**Coût final: $3.30-4.30/mois** (au lieu de $4-5)

---

## ✅ Checklist Validation

### Infrastructure (FAIT ✅)
- [x] HTTP API v2
- [x] DynamoDB Provisioned 5/5
- [x] Lambda 60s timeout
- [x] Rate limiting API Gateway
- [x] Secrets Manager
- [x] CloudWatch Alarms

### Backend (À FAIRE ❌)
- [ ] Lambda handler + routing
- [ ] LLMRouter avec retry
- [ ] 4 agents IA
- [ ] Error handling
- [ ] S3 presigned URLs
- [ ] Lambda Powertools
- [ ] Tests unitaires

### Frontend (À FAIRE ❌)
- [ ] Next.js 15 setup
- [ ] 4 pages principales
- [ ] Cognito auth
- [ ] Deploy Vercel

---

## 🎯 Action Immédiate

**BLOQUANT #1:** Générer le backend Lambda complet

**Commande:**
```bash
# Créer structure
mkdir -p backend/lambda/{agents,utils}
touch backend/lambda/{index,llm_router}.py
touch backend/lambda/agents/{scenario,detection,coaching,analytics}.py
touch backend/lambda/utils/{errors,logger,config}.py
touch backend/lambda/requirements.txt
```

**Veux-tu que je génère tout le code maintenant?** 🚀

---

**Version:** 5.1 Révisé  
**Date:** Mars 2025  
**Prochaine action:** Backend Lambda (4-6h)
