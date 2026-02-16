# 🛡️ ScamGuard AI — MVP 10 Utilisateurs
## Architecture Hybride AWS + Gemini Pro + ChatGPT+ · Version 4.0 · Février 2026
### Optimisé pour Budget Minimal avec LLMs Externes

---

## Indicateurs Clés

| 🕐 Délai MVP | 💰 Coût Dev | ☁️ AWS/mois | 💡 Coût LLM | 📦 Repos |
|---|---|---|---|---|
| **1 semaine** | **$3K** | **$0.20/mo** | **$0** (inclus) | **2 repos** |
| ↓ -86% vs v3.0 | ↓ -92% vs v3.0 | ↓ -99.8% vs v3.0 | Gemini+ChatGPT | FDP + FAST |

---

## 0. Changements Majeurs v4.0

### 0.1 Stratégie LLM Hybride — Réaliste

**Utilisation Free Tiers + Coûts Réels:**
- ✅ Gemini 1.5 Flash API (1,500 req/jour gratuites)
- ✅ OpenAI GPT-4o-mini (coût minimal ~$3-5/mois pour 10 users)
- ❌ Amazon Bedrock Nova/Haiku (supprimé pour MVP)

**Note importante:** Cette architecture est une **Semaine 0 de validation**, pas un MVP de lancement production. Pour scale, migrer vers v3.0.

**Coût LLM réel: ~$3-5/mois** (honnête et négligeable)

### 0.2 Architecture Simplifiée 10 Users

| Supprimé | Remplacé par | Raison |
|---|---|---|
| AgentCore Runtime | Lambda simple | Overkill pour 10 users |
| Bedrock Knowledge Bases | JSON statique S3 | 50 scénarios suffisent |
| API Gateway | Lambda Function URLs | Gratuit |
| 5 agents séparés | 4 agents dans 1 Lambda | Simplicité |
| CloudFront | S3 direct | Latence OK pour 10 users |
| Nova Reel vidéos | Scripts Gemini + slides | $0 vs $200 |

---

## 1. Architecture LLM Hybride

### 1.1 Mapping Agents → LLMs

| Agent | LLM | Coût | Raison |
|---|---|---|---|
| **Scenario** | Gemini 1.5 Flash | $0 (free tier 1.5K/jour) | Créativité FR + gratuit |
| **Detection** | GPT-4o-mini | ~$2/mo | Vision + coût minimal |
| **Coaching** | Gemini 1.5 Flash | $0 (free tier) | Français naturel |
| **Analytics** | GPT-4o-mini | ~$1/mo | Rapide pour métriques |
| **TOTAL LLM** | | **~$3-5/mo** | Honnête et négligeable |

### 1.2 Comparaison vs Bedrock

| Métrique | Bedrock Nova | Gemini Flash + GPT-4o-mini |
|---|---|---|
| Coût 10 users | $0.50/mo | **$3-5/mo** |
| Qualité FR | Bon | **Excellent** |
| Vision | Nova Lite | **GPT-4o-mini suffisant** |
| Latence | 200-500ms | 300-600ms |
| Setup | Bedrock console | **API keys direct** |
| Free tier | Non | **Oui (Gemini 1.5K/jour)** |

---

## 2. Stack Technique Finale

### 2.1 Infrastructure Minimale

```
Frontend:  React PWA → S3 Static Website
Auth:      Cognito (gratuit < 50K MAU)
API:       Lambda Function URLs (gratuit)
Upload:    S3 + Presigned URLs
LLMs:      Gemini 1.5 Pro + GPT-4o/mini (inclus abonnements)
DB:        DynamoDB 1 table (gratuit free tier)
Vidéos:    Scripts Gemini + slides simples
Logs:      CloudWatch (gratuit free tier)
```

### 2.2 Coûts Détaillés

| Service | Usage 10 users | $/mois |
|---|---|---|
| Lambda | 500 invocations | $0 (free tier) |
| DynamoDB | 1K reads/writes | $0 (free tier) |
| S3 | 2GB storage + uploads | $0.10 |
| CloudFront | 10GB transfert | $0 (free tier 1TB) |
| Cognito | 10 MAU | $0 (free tier) |
| CloudWatch | 500MB logs | $0 (free tier) |
| Gemini Flash API | 1.5K req/jour | $0 (free tier) |
| GPT-4o-mini API | ~50K tokens/mo | $3-5 |
| **TOTAL** | | **$3-5/mo** |

---

## 3. Repositories AWS — Version Simplifiée

### 3.1 Repos Utilisés (2/4)

| # | Repository | Ce qu'on copie | Utilisation |
|---|---|---|---|
| **1** | `sample-fraud-detection-and-prevention-fdp-agentic-platform` | `app/api/agents/` patterns + compliance | **CRITIQUE** |
| **2** | `sample-agentic-platform` (FAST) | `cdk/` stack minimal | **CRITIQUE** |
| ~~3~~ | ~~Multi-agent orchestration~~ | ~~Trop complexe~~ | **SKIP** |
| ~~4~~ | ~~Data preparation~~ | ~~Optionnel~~ | **SKIP** |

### 3.2 Script Clone Simplifié

```bash
#!/bin/bash
# scamguard-mvp-10users.sh

PROJECT="scamguard-mvp"
mkdir -p $PROJECT && cd $PROJECT

# 1. FDP Platform - Patterns agents
git clone --depth 1 https://github.com/aws-samples/sample-fraud-detection-and-prevention-fdp-agentic-platform.git fdp
cp -r fdp/app/api/agents ./templates/
cp fdp/app/api/compliance/* ./compliance/

# 2. FAST Platform - CDK minimal
git clone --depth 1 https://github.com/aws-samples/sample-agentic-platform.git fast
cp fast/cdk/lib/lambda-stack.ts ./cdk/
cp fast/cdk/lib/dynamodb-stack.ts ./cdk/

echo "✅ Templates copiés. Configurer API keys Gemini + OpenAI."
```

---

## 4. Implémentation 4 Agents

### 4.1 LLM Router

```python
# lambda/llm_router.py
import os
from openai import OpenAI
import google.generativeai as genai

openai_client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])
genai.configure(api_key=os.environ['GEMINI_API_KEY'])

class LLMRouter:
    @staticmethod
    def generate_scenario(prompt: str) -> str:
        """Gemini 1.5 Flash - Free tier 1,500 req/jour"""
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text
    
    @staticmethod
    def detect_scam(prompt: str, image_b64: str = None) -> str:
        """GPT-4o-mini - Vision + coût minimal"""
        messages = [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
        if image_b64:
            messages[0]["content"].append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}
            })
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",  # Changé de gpt-4o
            messages=messages
        )
        return response.choices[0].message.content
    
    @staticmethod
    def generate_coaching(prompt: str) -> str:
        """Gemini 1.5 Flash - Free tier"""
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text
    
    @staticmethod
    def analyze_metrics(prompt: str) -> str:
        """GPT-4o-mini - Rapide et économique"""
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
```

### 4.2 Agent Scenario

```python
# lambda/agents/scenario.py
from llm_router import LLMRouter
import json

class ScenarioAgent:
    def generate(self, user_profile: dict) -> dict:
        prompt = f"""Génère un scénario de scam réaliste en français pour senior:
        Âge: {user_profile['age']} ans
        Niveau: {user_profile['level']}
        
        Format JSON:
        {{
            "title": "...",
            "content": "message scam réaliste",
            "red_flags": ["signal 1", "signal 2"],
            "correct_action": "..."
        }}"""
        
        response = LLMRouter.generate_scenario(prompt)
        return json.loads(response)
```

### 4.3 Agent Detection

```python
# lambda/agents/detection.py
from llm_router import LLMRouter
import json

class DetectionAgent:
    def analyze(self, scenario: dict, user_response: str, image_b64: str = None) -> dict:
        prompt = f"""Scénario: {scenario['content']}
        Réponse utilisateur: {user_response}
        
        Analyse JSON:
        {{
            "identified": true/false,
            "score": 0-100,
            "red_flags_found": [...],
            "red_flags_missed": [...]
        }}"""
        
        response = LLMRouter.detect_scam(prompt, image_b64)
        return json.loads(response)
```

### 4.4 Agent Coaching

```python
# lambda/agents/coaching.py
from llm_router import LLMRouter

class CoachingAgent:
    def generate_feedback(self, detection: dict, user_profile: dict) -> dict:
        prompt = f"""Utilisateur senior {user_profile['age']} ans.
        Score: {detection['score']}/100
        Red flags manqués: {detection['red_flags_missed']}
        
        Génère feedback bienveillant en français:
        1. Félicitations sincères
        2. Explication simple
        3. Conseil pratique
        4. Encouragement
        
        Max 150 mots."""
        
        feedback = LLMRouter.generate_coaching(prompt)
        
        return {
            "feedback": feedback,
            "xp_earned": detection['score'] + 20,
            "new_badges": []
        }
```

### 4.5 Agent Analytics

```python
# lambda/agents/analytics.py
from llm_router import LLMRouter
import json

class AnalyticsAgent:
    def generate_insights(self, sessions: list) -> dict:
        scores = [s['score'] for s in sessions]
        avg = sum(scores) / len(scores) if scores else 0
        
        prompt = f"""Sessions: {len(sessions)}
        Score moyen: {avg:.1f}/100
        Scores: {scores[:10]}
        
        JSON:
        {{
            "trend": "amélioration|stable|régression",
            "strengths": ["..."],
            "weaknesses": ["..."]
        }}"""
        
        response = LLMRouter.analyze_metrics(prompt)
        return json.loads(response)
```

---

## 5. Frontend React PWA

```jsx
// App.jsx - Interface complète
import { useState } from 'react';

const LAMBDA_URL = process.env.REACT_APP_LAMBDA_URL;

export default function App() {
  const [view, setView] = useState('home');
  const [scenario, setScenario] = useState(null);
  const [response, setResponse] = useState('');
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  
  const getScenario = async () => {
    const res = await fetch(LAMBDA_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'generate_scenario',
        userId: localStorage.getItem('userId')
      })
    });
    setScenario(await res.json());
    setView('scenario');
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  };
  
  const submitAnalysis = async () => {
    const res = await fetch(LAMBDA_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'analyze',
        userId: localStorage.getItem('userId'),
        scenario,
        userResponse: response,
        imageBase64: image
      })
    });
    setResult(await res.json());
    setView('result');
  };
  
  return (
    <div style={{fontSize: '20px', padding: '20px', maxWidth: '600px', margin: '0 auto'}}>
      <h1>🛡️ ScamGuard</h1>
      
      {view === 'home' && (
        <>
          <button onClick={getScenario} style={btnStyle}>
            🎯 Nouveau Scénario
          </button>
          <button onClick={() => setView('detection')} style={btnStyle}>
            📸 Analyser un Message
          </button>
        </>
      )}
      
      {view === 'scenario' && (
        <>
          <h2>{scenario?.title}</h2>
          <div style={{background: '#f5f5f5', padding: '15px', borderRadius: '8px'}}>
            {scenario?.content}
          </div>
          <textarea 
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Que faites-vous?"
            style={{width: '100%', minHeight: '100px', fontSize: '18px', marginTop: '15px'}}
          />
          <button onClick={submitAnalysis} style={btnStyle}>✅ Valider</button>
        </>
      )}
      
      {view === 'detection' && (
        <>
          <h2>📸 Analyser un Message Suspect</h2>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={handleImageUpload}
            style={{fontSize: '18px', marginBottom: '15px'}}
          />
          <textarea 
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Décrivez ce qui vous semble suspect..."
            style={{width: '100%', minHeight: '100px', fontSize: '18px'}}
          />
          <button onClick={submitAnalysis} style={btnStyle}>🔍 Analyser</button>
        </>
      )}
      
      {view === 'result' && result && (
        <>
          <h2>Résultat</h2>
          <div style={{fontSize: '48px', textAlign: 'center'}}>
            {result.detection.score}/100
          </div>
          <div style={{background: '#e8f5e9', padding: '15px', borderRadius: '8px', marginTop: '15px'}}>
            {result.coaching.feedback}
          </div>
          <div style={{marginTop: '15px'}}>
            <strong>🎖️ XP gagné: +{result.coaching.xp_earned}</strong>
          </div>
          <button onClick={() => setView('home')} style={btnStyle}>🏠 Retour</button>
        </>
      )}
    </div>
  );
}

const btnStyle = {
  width: '100%',
  padding: '15px',
  fontSize: '20px',
  marginTop: '10px',
  borderRadius: '8px',
  border: 'none',
  background: '#2196F3',
  color: 'white',
  cursor: 'pointer'
};
```

---

## 6. Infrastructure CDK

```python
# cdk_stack.py
from aws_cdk import (
    Stack, Duration,
    aws_lambda as lambda_,
    aws_dynamodb as ddb,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_cognito as cognito,
    aws_ssm as ssm,
    aws_iam as iam
)

class ScamGuardStack(Stack):
    def __init__(self, scope, id):
        super().__init__(scope, id)
        
        # DynamoDB
        table = ddb.Table(self, "Data",
            partition_key={"name": "PK", "type": ddb.AttributeType.STRING},
            sort_key={"name": "SK", "type": ddb.AttributeType.STRING},
            billing_mode=ddb.BillingMode.PAY_PER_REQUEST
        )
        
        # S3 Buckets
        uploads_bucket = s3.Bucket(self, "Uploads")
        frontend_bucket = s3.Bucket(self, "Frontend",
            website_index_document="index.html",
            public_read_access=True
        )
        
        # CloudFront devant S3 (5 lignes, gratuit à ce volume)
        distribution = cloudfront.Distribution(self, "CDN",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(frontend_bucket)
            )
        )
        
        # Cognito
        user_pool = cognito.UserPool(self, "Users",
            self_sign_up_enabled=True
        )
        
        # Secrets depuis SSM Parameter Store (pas hardcodés!)
        gemini_key = ssm.StringParameter.value_for_string_parameter(
            self, "/scamguard/gemini-key"
        )
        openai_key = ssm.StringParameter.value_for_string_parameter(
            self, "/scamguard/openai-key"
        )
        
        # Lambda
        api_lambda = lambda_.Function(self, "API",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda"),
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "TABLE_NAME": table.table_name,
                "UPLOADS_BUCKET": uploads_bucket.bucket_name,
                "GEMINI_API_KEY": gemini_key,
                "OPENAI_API_KEY": openai_key
            },
            function_url_options={
                "auth_type": lambda_.FunctionUrlAuthType.NONE
            }
        )
        
        # Permissions
        table.grant_read_write_data(api_lambda)
        uploads_bucket.grant_read_write(api_lambda)
```

---

## 7. Roadmap 1 Semaine

| Jour | Phase | Actions | Temps |
|---|---|---|---|
| **J1** | Setup | Clone 2 repos • CDK deploy • Config API keys | 4h |
| **J2** | Agents | Implémenter 4 agents + LLMRouter | 8h |
| **J3** | Tests | Tests agents + DynamoDB | 6h |
| **J4-5** | Frontend | React PWA + upload images | 12h |
| **J6** | Tests E2E | Tests avec 2 seniors | 6h |
| **J7** | Launch | Deploy + inviter 10 users | 2h |

---

## 8. Checklist Lancement

### Setup (Jour 1)
- [ ] Cloner FDP + FAST repos
- [ ] Créer secrets SSM Parameter Store:
  ```bash
  aws ssm put-parameter --name /scamguard/gemini-key --value "YOUR_KEY" --type SecureString
  aws ssm put-parameter --name /scamguard/openai-key --value "YOUR_KEY" --type SecureString
  ```
- [ ] CDK bootstrap + deploy
- [ ] Vérifier CloudFront distribution créée
- [ ] Créer 50 scénarios JSON

### Backend (Jour 2-3)
- [ ] LLMRouter avec Gemini + GPT-4o
- [ ] 4 agents implémentés
- [ ] Tests unitaires
- [ ] DynamoDB structure

### Frontend (Jour 4-5)
- [ ] React PWA
- [ ] Upload images
- [ ] 4 écrans
- [ ] Deploy S3

### Launch (Jour 6-7)
- [ ] Tests E2E
- [ ] 10 beta users invités
- [ ] Monitoring CloudWatch

---

## 9. Comparaison Versions

| Métrique | v3.0 (500 users) | **v4.0 (10 users - Semaine 0)** |
|---|---|---|
| Délai | 6 semaines | **1 semaine** |
| Coût dev | $38K | **$3K** |
| AWS/mois | $130 | **$0.10** |
| LLM/mois | $7 | **$3-5** |
| **TOTAL/mois** | **$137** | **$3-5** (-96%) |
| Repos | 4 | **2** |
| Complexité | Production | **Validation** |
| Secrets | Secrets Manager | **SSM Parameter Store** |
| CDN | CloudFront | **CloudFront** ✅ |

---

## 10. Migration vers v3.0

**Quand scaler (si succès):**

| Seuil | Action | Coût |
|---|---|---|
| 50 users | Optimiser prompts + caching | +$10/mo |
| 100 users | Migrer vers Bedrock Nova | +$20/mo |
| 500 users | Architecture v3.0 complète | $130/mo |

**⚠️ IMPORTANT:** v4.0 est une **Semaine 0 de validation technique**, pas un MVP de lancement production. Pour un vrai lancement:
- Migrer vers Bedrock (compliance + SLA)
- Ajouter WAF + monitoring avancé
- Implémenter rate limiting
- Audit sécurité complet

---

**ScamGuard AI v4.0 · Semaine 0 Validation · 10 users · Gemini Flash + GPT-4o-mini · $3-5/mois · 1 semaine**

---

## 11. Notes Importantes v4.0

### 11.1 Pourquoi "Semaine 0" et pas "MVP"?

Cette architecture est optimale pour:
- ✅ Valider le concept avec 10 beta users
- ✅ Tester les 4 agents rapidement
- ✅ Itérer sur l'UX seniors
- ✅ Coût minimal ($3-5/mois)

Mais **PAS prête pour production** car:
- ❌ Pas de SLA garantis (APIs externes)
- ❌ Pas de rate limiting robuste
- ❌ Secrets en SSM (pas Secrets Manager avec rotation)
- ❌ Pas de WAF / monitoring avancé
- ❌ Pas de compliance PIPEDA complète

### 11.2 Migration vers Production (v3.0)

Après validation Semaine 0, migrer vers v3.0 pour:
1. Bedrock Nova (SLA AWS + compliance)
2. Secrets Manager avec rotation
3. WAF + Shield Advanced
4. CloudTrail + audit PIPEDA
5. Multi-région + DR

**Coût production: $130/mois mais architecture enterprise-ready**

### 11.3 Free Tiers Réels

**Gemini 1.5 Flash:**
- 1,500 requêtes/jour gratuites
- 10 users × 5 sessions/jour = 50 req/jour
- ✅ Largement dans le free tier

**GPT-4o-mini:**
- $0.150/1M input tokens
- $0.600/1M output tokens
- 10 users × 5 sessions × 2K tokens = 100K tokens/mois
- Coût: ~$3-5/mois

**Total honnête: $3-5/mois (pas $0)**
