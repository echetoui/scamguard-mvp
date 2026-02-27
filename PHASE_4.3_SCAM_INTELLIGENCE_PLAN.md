# 📋 Phase 4.3 - Scam Intelligence (Nouvelles Scams Québec)

**Date:** 22 février 2026
**Statut:** 📋 PLANIFIÉ
**Priorité:** 🔴 HAUTE
**Durée Estimée:** 3-4 jours
**Responsable:** @echetoui

---

## 🎯 Vue d'Ensemble

Implémenter un système d'intelligence sur les arnacles au Québec qui:
- ✅ Extrait les scams actuels (web scraping)
- ✅ Stocke dans DynamoDB
- ✅ Affiche un dashboard "Scams Trending"
- ✅ Génère des scénarios basés sur scams réels
- ✅ Alerte les utilisateurs sur nouveaux scams
- ✅ Enrichit l'IA avec données locales

---

## 📊 Composants

### 1. Backend - Web Scraper Lambda

**Fonction:** `backend/lambda/scam_scraper.py`

```python
# Scraper Protégez-vous.ca
# Extraire:
# - Titre de l'arnaque
# - Description
# - Risque/Sévérité
# - Date découverte
# - Catégorie (phishing, SMS, email, etc.)

# Sources à scraper:
# 1. Protégez-vous.ca/arnaque
# 2. RCMP/GRCAF (Canadian Anti-Fraud Centre)
# 3. Police Québec
# 4. Autorités provinciales

# Sortie: JSON structuré
{
  "id": "uuid",
  "title": "Arnaque au faux livreur",
  "description": "Les arnaqueurs prétendent être...",
  "category": "delivery_fraud",
  "risk_level": "high",
  "source": "protegezvous.ca",
  "date_discovered": "2026-02-22",
  "affected_region": "Quebec",
  "red_flags": ["urgence", "appel téléphonique", "virement"],
  "prevention_tips": ["Vérifier numéro", "Ne pas payer immédiatement"]
}
```

**Détails Techniques:**
- BeautifulSoup4 pour HTML scraping
- Requests pour HTTP calls
- Scheduled CloudWatch Events (quotidien)
- Timeout: 120 secondes
- Memory: 1024 MB

---

### 2. Backend - DynamoDB Table

**Table:** `ScamGuardNews-dev`

```
Partition Key (PK):  category#source
Sort Key (SK):       timestamp#id

Attributes:
  - title: String
  - description: String (long)
  - risk_level: Enum (low, medium, high, critical)
  - red_flags: List
  - prevention_tips: List
  - source_url: String
  - date_discovered: Timestamp
  - affected_region: String
  - views_count: Number
  - is_trending: Boolean
  - created_at: Timestamp
  - updated_at: Timestamp

Global Secondary Indexes (GSI):
  - date_discovered-index (pour historique)
  - risk_level-index (pour filtrer par sévérité)
  - is_trending-index (pour dashboard)
```

---

### 3. Frontend - Scam News Component

**Fichier:** `frontend/src/components/ScamNews.jsx`

```jsx
// Composant pour afficher les scams actuels
// Features:
// - Liste des scams du moment
// - Filtrage par catégorie/sévérité
// - Search
// - Détails de chaque scam
// - Tips de prévention
// - "Mark as read" / "Share"

// Props:
// - scams: Array<Scam>
// - onViewDetails: (scamId) => void
// - onShare: (scamId) => void

// Design:
// - Cards responsives
// - Indicateur de sévérité (couleur)
// - Icons par catégorie
// - Accessible (WCAG AA)
// - Texte français clair
```

---

### 4. Frontend - Dashboard Tab

**Nouvelle Onglet:** "Scams Actuels"

```
Navigation:
  - Accueil
  - Sécurité (Dashboard)
  - Formations
  + Scams Actuels      ← NOUVEAU
  - Mon Compte

Features:
  - Trending scams (top 5)
  - Nouveaux scams (24h)
  - Par catégorie
  - Par sévérité
  - Historique (30 jours)
```

---

### 5. API Endpoints

**GET /scams/trending** (Public)
```json
Response:
{
  "data": {
    "scams": [
      {
        "id": "uuid",
        "title": "...",
        "risk_level": "high",
        "date_discovered": "2026-02-22",
        "views": 1234
      }
    ],
    "total": 5,
    "updated_at": "2026-02-22T10:30:00Z"
  }
}
```

**GET /scams/category/{category}** (Public)
```json
Response:
{
  "data": {
    "scams": [...],
    "category": "phishing",
    "total": 12,
    "count": 10,
    "page": 1
  }
}
```

**GET /scams/search?q=...** (Public)
```json
Response:
{
  "data": {
    "results": [...],
    "query": "email",
    "count": 8
  }
}
```

**GET /scams/{id}** (Public)
```json
Response:
{
  "data": {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "risk_level": "high",
    "red_flags": [...],
    "prevention_tips": [...],
    "source_url": "...",
    "related_scams": [...]
  }
}
```

---

## 🔄 Intégrations

### 1. Scénarios Dynamiques

**Mise à jour:** `backend/lambda/handler_llm.py`

```python
# Au lieu de scénarios statiques, utiliser les scams actuels
# GET scam récent de DynamoDB
# Convertir en scénario pour l'utilisateur

# Exemple:
scam = get_trending_scam()
scenario = {
  "title": f"Attention: {scam.title}",
  "content": scam.description,
  "category": scam.category,
  "based_on_real_scam": True,
  "red_flags": scam.red_flags
}
```

---

### 2. IA Enrichissement

**Mise à jour:** `useAuth + analysisAPI`

```python
# Lors d'une analyse utilisateur:
# 1. Analyser le message avec LLM
# 2. Chercher scams similaires dans BD
# 3. Enrichir le feedback avec infos locales

# Exemple de réponse améliorée:
{
  "detection": {
    "score": 85,
    "risk": "high"
  },
  "coaching": {
    "feedback": "⚠️ Ceci ressemble à l'arnaque XXXX...",
    "similar_scams": [
      {
        "title": "...",
        "how_it_works": "...",
        "prevention": "..."
      }
    ],
    "xp_earned": 20
  }
}
```

---

### 3. Notifications Utilisateurs

**Feature:** Alertes nouveaux scams

```javascript
// Dans useAuth hook ou notification service
// Si nouvel scam "critical" découvert:
// - Notification push (si accepté)
// - Toast dans l'app
// - Email optionnel

notification = {
  type: "CRITICAL_SCAM",
  title: "⚠️ Nouveau scam critique découvert",
  message: "...",
  scam_id: "uuid",
  action_url: "/scams/123"
}
```

---

## 📋 Tâches Détaillées

### Tâche 1: Architecture & Design

**Durée:** 4 heures

```
□ Vérifier sources scams québécoises
  ├─ Protégez-vous.ca (HTML structure)
  ├─ RCMP/CAFC (API disponible?)
  ├─ Police Québec (données publiques?)
  └─ Médias locaux (RSS/API?)

□ Concevoir DB schema
  ├─ Table ScamGuardNews
  ├─ Attributes
  ├─ GSIs
  └─ Partitioning strategy

□ Planifier API endpoints
  ├─ GET /scams/trending
  ├─ GET /scams/category/{cat}
  ├─ GET /scams/search
  ├─ GET /scams/{id}
  └─ Caching strategy

□ Créer prototypes UI
  ├─ ScamNews component
  ├─ Dashboard layout
  ├─ Onglets navigation
  └─ Responsive design
```

---

### Tâche 2: Backend - Scraper

**Durée:** 1 jour

```
□ Implémenter scam_scraper.py
  ├─ Parser HTML Protégez-vous
  ├─ Extract title, description, date
  ├─ Classify category
  ├─ Extract red flags
  └─ Extract prevention tips

□ Configurer scheduling
  ├─ CloudWatch Events (daily)
  ├─ Lambda trigger
  ├─ Error handling
  ├─ Logging
  └─ Retry logic

□ Tests scraper
  ├─ Manual test Protégez-vous
  ├─ Verify data extraction
  ├─ Check date formats
  ├─ Validate JSON output
  └─ Performance test
```

---

### Tâche 3: Backend - DynamoDB & API

**Durée:** 1 jour

```
□ Créer table ScamGuardNews
  ├─ Create table via CDK/SAM
  ├─ Configure GSIs
  ├─ Set TTL (30 jours)
  ├─ Enable encryption
  └─ Test query performance

□ Implémenter API endpoints
  ├─ GET /scams/trending
  ├─ GET /scams/category/{cat}
  ├─ GET /scams/search
  ├─ GET /scams/{id}
  ├─ Error handling (404, 400)
  └─ Response formatting

□ Ajouter caching
  ├─ CloudFront cache
  ├─ Cache headers
  ├─ Invalidation strategy
  └─ Performance monitoring

□ Tests API
  ├─ Unit tests endpoints
  ├─ Integration tests
  ├─ Load test
  └─ Security test (injection)
```

---

### Tâche 4: Frontend - Components

**Durée:** 1 jour

```
□ Créer ScamNews.jsx
  ├─ Fetch trending scams
  ├─ Display cards
  ├─ Filter by category
  ├─ Filter by severity
  ├─ Search functionality
  ├─ Detail modal
  ├─ Share button
  └─ Accessibility (ARIA)

□ Créer nouveau Tab
  ├─ Add onglet "Scams Actuels"
  ├─ Integrate routing
  ├─ Update BottomNavigation
  ├─ Add icon
  └─ Responsive layout

□ Intégrer API calls
  ├─ Fetch data from backend
  ├─ Handle loading state
  ├─ Handle errors
  ├─ Cache results
  └─ Refresh logic

□ Tests components
  ├─ Render test
  ├─ Interaction test
  ├─ API mock test
  ├─ Accessibility test
  └─ Performance test
```

---

### Tâche 5: Intégration LLM

**Durée:** 4 heures

```
□ Mettre à jour handler_llm.py
  ├─ Query ScamNews table
  ├─ Find similar scams
  ├─ Enrich LLM response
  ├─ Add related_scams
  └─ Format response

□ Mettre à jour useAuth
  ├─ Fetch trending scams
  ├─ Show notifications
  ├─ Handle new critical scams
  ├─ Local storage caching
  └─ Notification UI

□ Tests intégration
  ├─ Test enriched response
  ├─ Test similar scams
  ├─ Test notification
  └─ End-to-end test
```

---

### Tâche 6: Notifications & Alertes

**Durée:** 4 heures

```
□ Implémenter système d'alertes
  ├─ Detect critical scams
  ├─ Send push notification
  ├─ Send email (optionnel)
  ├─ Display toast in app
  └─ Track user interactions

□ Configuration
  ├─ Risk level thresholds
  ├─ Notification frequency
  ├─ User preferences
  ├─ Opt-in/out
  └─ Schedule (quiet hours?)

□ Tests alertes
  ├─ Test critical detection
  ├─ Test notification delivery
  ├─ Test opt-out
  └─ Performance under load
```

---

### Tâche 7: Documentation & Tests

**Durée:** 4 heures

```
□ Documentation
  ├─ API documentation
  ├─ Scraper documentation
  ├─ Component documentation
  ├─ Data model documentation
  └─ Deployment guide

□ Tests complets
  ├─ Unit tests (95% coverage)
  ├─ Integration tests
  ├─ E2E tests
  ├─ Load tests
  ├─ Security tests
  └─ Accessibility tests

□ QA & Validation
  ├─ Manual testing
  ├─ Cross-browser testing
  ├─ Mobile testing
  ├─ Performance audit
  └─ Security audit
```

---

## 🔐 Sécurité

```
⚠️ Considerations:
□ SQL injection (web scraping)
  ├─ Use trusted libraries
  ├─ Validate URLs
  └─ No direct HTML exec

□ Data validation
  ├─ Sanitize extracted data
  ├─ Validate JSON
  ├─ Check file sizes
  └─ Timeout protection

□ Rate limiting
  ├─ API rate limits
  ├─ Scraper delays
  ├─ User request limits
  └─ DDoS protection

□ Privacy
  ├─ No PII in scam data
  ├─ Anonymized sources
  ├─ RGPD compliant
  └─ User consent for alerts
```

---

## 📊 Sources Recommandées

### 1. Protégez-vous.ca
- URL: https://www.protegez-vous.ca/arnaque
- Format: HTML
- Update: Weekly
- Coverage: All Canada (focus QC)
- Reliability: Excellent

### 2. Canadian Anti-Fraud Centre (CAFC)
- URL: https://www.antifraudcentre-centreantifraude.ca/
- Format: Check API/RSS
- Update: Real-time
- Coverage: Canada-wide
- Reliability: Official government

### 3. Authorities & Police
- Service de police Montréal
- RCMP
- Check for public APIs/feeds

### 4. Media RSS
- Journal de Montréal
- TVA Nouvelles
- Métro Montréal

---

## 🎯 Métriques de Succès

```
Phase 4.3 Success Criteria:

✅ Backend:
   □ Scraper extracts 50+ scams weekly
   □ API responds < 200ms
   □ 99.9% uptime
   □ Zero data loss

✅ Frontend:
   □ Component renders < 500ms
   □ Search works across 100+ scams
   □ Mobile responsive
   □ Accessibility WCAG AA

✅ Intégrations:
   □ LLM enrichment working
   □ Alerts delivering < 5 min
   □ Similar scams found correctly
   □ User engagement > 30%

✅ Testing:
   □ Test coverage > 90%
   □ E2E tests passing
   □ Load test: 1000 req/s
   □ Security scan passed
```

---

## 📅 Timeline Proposée

```
Semaine 1:
  Lun 24/02: Tâche 1 (Architecture)
  Mar 25/02: Tâche 2 (Scraper)
  Mer 26/02: Tâche 3 (DynamoDB + API)
  Jeu 27/02: Tâche 4 (Frontend)
  Ven 28/02: Tests + QA

Semaine 2:
  Lun 03/03: Tâche 5 (LLM Integration)
  Mar 04/03: Tâche 6 (Notifications)
  Mer 05/03: Tâche 7 (Documentation)
  Jeu 06/03: Final QA
  Ven 07/03: Production Deployment
```

---

## 💰 Estimation Ressources

```
Development:
  - Backend: 2 jours
  - Frontend: 1 jour
  - Integration: 0.5 jour
  - Testing: 1 jour
  - Documentation: 0.5 jour
  ━━━━━━━━━━━━━━━━
  Total: 5 jours dev

Infrastructure:
  - Lambda (scraper): $0.10/day
  - DynamoDB (news): $0.50-1.00/day
  - API Gateway: Already included
  ━━━━━━━━━━━━━━━━
  Total: ~$15-20/month

AWS Costs (estimated monthly addition):
  - Scraper Lambda: $3
  - DynamoDB (on-demand): $5-10
  - Data transfer: $2
  ━━━━━━━━━━━━━━━━
  Total: ~$10-15/month (acceptable)
```

---

## 🚀 Dépendances

**Avant de commencer Phase 4.3:**
- ✅ Phase 4.1 complète (Auth)
- ✅ Phase 4.2 complète (Account)
- ✅ Frontend build stable
- ✅ Backend infrastructure ready

---

## 📚 Références

**Web Scraping:**
- BeautifulSoup4 documentation
- Requests library
- Selenium (if JS needed)

**AWS Services:**
- DynamoDB best practices
- Lambda pricing & limits
- CloudWatch Events

**Frontend:**
- React patterns
- Search/Filter patterns
- Responsive design

---

## ✅ Checklist Avant Démarrage

```
□ Budget approuvé (~$10-15/month extra)
□ Sources de données confirmées
□ API design validée
□ DB schema approuvé
□ UI mockups reviewed
□ Team capacité confirmée
□ Timeline acceptable
```

---

## 🎓 Learning Outcomes

Team membres apprendront:
- Web scraping best practices
- DynamoDB advanced queries
- API design & optimization
- Real-time alerting systems
- Data enrichment patterns
- Production monitoring

---

**Statut:** 📋 READY TO PLAN
**Prochaine Étape:** Approbation budget + confirmation sources données

---

**Date Création:** 22 février 2026
**Version:** 1.0
**Status:** PLANIFIÉ (en attente d'approbation)
