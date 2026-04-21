# 🛡️ ScamGuard MVP

Application de protection contre les arnaques numériques, conçue pour être accessible aux seniors (Senior-First).

## 📊 Project Status

| Phase | Status | Tests | Completion |
|-------|--------|-------|-----------|
| **Phase 1** | ✅ **COMPLETE** | 2,223 passing | 100% |
| **Phase 2** | 🔄 Ready (Apr 2026) | Planned | - |
| **Phase 3** | 📋 Planned (Aug 2026) | - | - |
| **Phase 4** | 📋 Planned (Oct 2026) | - | - |

**Latest Update:** March 14, 2026 - QuizModule tests fixed (59/59 ✅) + Phase 1 verified complete
- See [Issue #51](https://github.com/echetoui/scamguard-mvp/issues/51) for Phase 1 completion details

Ce projet est une application React (MVP) qui permet aux utilisateurs de :
- S'entraîner à détecter des arnaques via des scénarios interactifs.
- Analyser des messages suspects (texte ou image) grâce à l'IA.
- Recevoir des conseils et du coaching personnalisé.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :
- [Node.js](https://nodejs.org/) (v16 ou supérieur recommandé)
- [npm](https://www.npmjs.com/) (généralement inclus avec Node.js)

## 🚀 Installation

1.  **Cloner le dépôt :**
    ```bash
    git clone <votre-url-de-repo>
    cd scamguard-mvp
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    ```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du projet pour configurer les variables d'environnement. Vous pouvez vous baser sur l'exemple ci-dessous :

```env
# URL de l'API Backend (AWS Lambda / API Gateway)
REACT_APP_LAMBDA_URL=https://votre-api-gateway-url.amazonaws.com/dev/api/v1

# Configuration Cognito (si applicable)
REACT_APP_COGNITO_REGION=us-east-1
REACT_APP_COGNITO_USER_POOL_ID=votre_user_pool_id
REACT_APP_COGNITO_CLIENT_ID=votre_client_id
```

---

## 📦 Stack Technique

### Frontend
- **Framework:** React 18.2.0
- **Build:** Webpack (Create React App)
- **Styling:** CSS personnalisé accessible
- **API:** Axios
- **Storage:** LocalStorage + DynamoDB

### Backend
- **Runtime:** AWS Lambda (Python 3.12)
- **Framework:** HTTP API (API Gateway)
- **LLMs:** OpenAI GPT-4o-mini + Google Gemini 1.5
- **Database:** DynamoDB (NoSQL)
- **Auth:** AWS Cognito
- **Infrastructure:** AWS CDK

---

## ⚡ Quick Start

### Développement Frontend
```bash
cd frontend
npm install
npm start          # Dev server sur port 3000
```

### Développement Backend
```bash
cd backend/lambda
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Tests
pytest tests/ -v

# Déploiement SAM
sam deploy --guided
```

### Déploiement Complet (CDK)
```bash
cd backend/cdk
cdk synth              # Générer template CloudFormation
cdk deploy             # Déployer tous les services
```

---

## 🔑 Variables d'Environnement

### Frontend (.env)
```
REACT_APP_LAMBDA_URL=https://ymli0zyv6e.execute-api.us-east-1.amazonaws.com/dev/api/v1
REACT_APP_COGNITO_REGION=us-east-1
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_L35zaDPJn
REACT_APP_COGNITO_CLIENT_ID=tb4o4jblsbtekhtl9s611j4fg
```

### Backend (AWS Secrets Manager)
```
scamguard/openai-key      → OPENAI_API_KEY
scamguard/gemini-key      → GEMINI_API_KEY
scamguard/cognito-secret  → COGNITO_CLIENT_SECRET
```

---

## 📊 URLs de Déploiement (Actualisées - 21 mars 2026)

| Service | URL |
|---------|-----|
| **Frontend (CloudFront)** | https://dv04w7vjfnkg5.cloudfront.net |
| **API (API Gateway)** | https://528szyyu3k.execute-api.us-east-1.amazonaws.com/prod/ |
| **Agents Webhook** | https://q83a9xbdxj.execute-api.us-east-1.amazonaws.com/prod/webhook/github |
| **Région AWS** | us-east-1 |

---

## 🧪 Tests

### Phase 1 Test Results (March 14, 2026)
✅ **2,223 tests passing** | 97.5% pass rate | 100% Phase 1 coverage

```bash
# Run all frontend tests (Vitest)
cd frontend
npm run test:unit

# Run specific test file
npm run test:unit -- QuizModule.test.jsx

# Run tests with coverage
npm run test:coverage
```

### Test Coverage by Component
| Component | Tests | Status |
|-----------|-------|--------|
| QuizModule | 59 | ✅ PASSING |
| OnboardingWizard | 52 | ✅ PASSING |
| AdminDashboard | 45 | ✅ PASSING |
| UserManagement | 52 | ✅ PASSING |
| AuthCallback | 50 | ✅ PASSING |
| Other Components | 1,965+ | ✅ PASSING |
| App (Phase 2) | 54 | ⚠️ FAILING (React import) |

### Backend (Pytest)
```bash
cd backend
pytest tests/ -v
```

---

## 📋 Status & Next Steps

### Phase 1 (COMPLETE ✅)
All 4 sprints completed:
- ✅ Sprint 1: Core Features & Security
- ✅ Sprint 2: Admin Dashboard & Modules
- ✅ Sprint 3: Quiz Academy & Push Notifications
- ✅ Sprint 4: Onboarding Wizard

See [BACKLOG.md](BACKLOG.md) and [ROADMAP_COMPLETE.md](ROADMAP_COMPLETE.md) for details.

### Phase 2 (READY 🔄 - April 2026)
- Sprint 5: SMS Simulation & Real Threats
- Sprint 6: Enhanced Quizzes & Gamification
- Sprint 7: Dashboard Redesign
- Sprint 8: Guardian Angel Profile
- Sprints 9-11: Quebec Localization & Advanced Features

### Known Issues (Phase 2 Priority)
- App.test.jsx: 54 failures (React import error)
- Performance optimization opportunities
- Mobile responsiveness refinement

- [x] Tâche 1: Tests d'authentification complets (Phase 4.1)
- [x] Tâche 2: Intégration frontend-backend
- [x] Tâche 3: Validation configurations
- [x] Tâche 4: Cleanup des artefacts
- [x] Tâche 5: Mise à jour documentation
- [x] Tâche 6: Commit et versioning

### Phase 4.3 (Planifié) - 🆕 Scam Intelligence
**Voir [PHASE_4.3_SCAM_INTELLIGENCE_PLAN.md](PHASE_4.3_SCAM_INTELLIGENCE_PLAN.md)**

- [ ] Tâche 1: Architecture & Design (4h)
- [ ] Tâche 2: Backend Scraper (1 jour)
- [ ] Tâche 3: DynamoDB & API (1 jour)
- [ ] Tâche 4: Frontend Components (1 jour)
- [ ] Tâche 5: LLM Integration (4h)
- [ ] Tâche 6: Notifications & Alertes (4h)
- [ ] Tâche 7: Documentation & Tests (4h)

**Durée Totale:** 3-4 jours | **Priorité:** 🔴 HAUTE

---

## 💰 Coûts Actuels (Réels - 21 mars 2026)

**Budget mensuel actuel:** ~$16/mois (avant optimisation)

| Service | Coût | Statut |
|---------|------|--------|
| DynamoDB | $0.54/jour (~$16/mois) | Principal |
| Lambda | $0.00 | Free tier |
| API Gateway | $0.00 | Free tier |
| S3 | ~$0.00 | Minimal |
| Cognito | $0.00 | Optimisé |
| Secrets Manager | $0.00 | Aucun secret |
| CloudWatch | $0.00 | Free tier |

**Après optimisation:** $3-5/mois (70-80% d'économie)

Voir [AWS_OPTIMIZATION_ACTION_PLAN.md](AWS_OPTIMIZATION_ACTION_PLAN.md) pour le plan détaillé.

---

## 🔗 Ressources

### Documentation Technique
- [AWS Architecture](docs/AWS_ARCHITECTURE_READY.md)
- [Roadmap v5](docs/ROADMAP_v5.md)
- [API Deployment](docs/deployment.md)

### Docs Élémentaires
- [HOW_TO_VIEW_DIAGRAMS.md](docs/HOW_TO_VIEW_DIAGRAMS.md) - Voir les diagrammes d'architecture
- [OPTIMIZATIONS_APPLIED.md](docs/OPTIMIZATIONS_APPLIED.md) - Optimisations de performance

### Outils Externes
- [AWS CDK Docs](https://docs.aws.amazon.com/cdk/)
- [React Docs](https://react.dev)
- [Lambda Python Docs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)

---

## 📞 Support

**Responsable:** @echetoui
**Compte AWS:** 034362029181
**Région Primaire:** us-east-1
**Environnement:** Production

Pour des problèmes ou feedback, voir [ACTION_PLAN_2026_02_22.md](ACTION_PLAN_2026_02_22.md#-notes-importantes)

---

## 📄 License

MIT

---

**Dernière mise à jour:** 21 mars 2026 (Déploiement CDK + Optimisation AWS)
**Prochaine révision:** 28 mars 2026
