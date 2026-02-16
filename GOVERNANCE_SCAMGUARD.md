# 🏛️ GOUVERNANCE PROJET SCAMGUARD AI
## Workflow Développement · Git Strategy · Standards · Version 4.0

---

## 📋 TABLE DES MATIÈRES

1. [Structure Équipe](#1-structure-équipe)
2. [Git Workflow](#2-git-workflow)
3. [Standards Code](#3-standards-code)
4. [Roadmap Détaillée](#4-roadmap-détaillée-7-jours)
5. [Gestion Branches](#5-gestion-branches)
6. [Process Review](#6-process-review)
7. [Déploiement](#7-déploiement)
8. [Communication](#8-communication)

---

## 1. STRUCTURE ÉQUIPE

### 1.1 Rôles et Responsabilités

| Rôle | Personne | Responsabilités | Accès |
|---|---|---|---|
| **Tech Lead** | Dev Senior 1 | Architecture · Code review · Décisions tech | Admin repo |
| **Backend Dev** | Dev Senior 2 | Lambda · Agents · DynamoDB · API | Write repo |
| **Frontend Dev** | Dev Junior | React PWA · UI/UX · S3 deploy | Write repo |
| **DevOps** | Tech Lead | CDK · AWS · CI/CD · Monitoring | Admin AWS |

### 1.2 Disponibilité

```
Lundi-Vendredi: 9h-17h (timezone locale)
Daily standup: 9h30 (15 min max)
Code review: avant 16h pour merge jour même
Urgences: Slack #scamguard-urgent
```

---

## 2. GIT WORKFLOW

### 2.1 Structure Repository

```
scamguard-mvp/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       ├── frontend-ci.yml
│       └── deploy.yml
├── backend/
│   ├── lambda/
│   │   ├── agents/
│   │   │   ├── scenario.py
│   │   │   ├── detection.py
│   │   │   ├── coaching.py
│   │   │   └── analytics.py
│   │   ├── llm_router.py
│   │   ├── index.py
│   │   └── requirements.txt
│   ├── cdk/
│   │   ├── app.py
│   │   └── stacks/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── data/
│   └── scenarios.json
├── docs/
│   ├── GOVERNANCE.md
│   ├── API.md
│   └── DEPLOYMENT.md
└── README.md
```

### 2.2 Stratégie Branches

```
main (production)
  ↓
develop (intégration)
  ↓
feature/* (développement)
hotfix/* (urgences)
```

#### Règles Branches

| Branch | Protection | Merge Require | Deploy |
|---|---|---|---|
| `main` | ✅ Protected | 1 approval + CI pass | Auto → AWS Prod |
| `develop` | ✅ Protected | CI pass | Auto → AWS Dev |
| `feature/*` | ❌ | - | Manuel local |
| `hotfix/*` | ⚠️ Semi | Tech Lead approval | Urgent |

### 2.3 Convention Nommage Branches

```bash
# Features
feature/scenario-agent
feature/upload-images
feature/analytics-dashboard

# Fixes
fix/detection-json-parsing
fix/cognito-auth-error

# Hotfix
hotfix/critical-lambda-timeout
```

### 2.4 Convention Commits

```bash
# Format: <type>(<scope>): <message>

# Types autorisés:
feat:     Nouvelle fonctionnalité
fix:      Correction bug
refactor: Refactoring code
test:     Ajout tests
docs:     Documentation
style:    Formatting
chore:    Maintenance

# Exemples:
feat(scenario): add Gemini 1.5 Pro integration
fix(detection): handle missing image gracefully
test(coaching): add unit tests for XP calculation
docs(api): update Lambda endpoints documentation
```

### 2.5 Workflow Développement

```bash
# 1. Créer feature branch depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/nom-feature

# 2. Développer + commits réguliers
git add .
git commit -m "feat(scope): description"

# 3. Push + créer Pull Request
git push origin feature/nom-feature
# → Créer PR sur GitHub vers develop

# 4. Code review + corrections
# → Adresser commentaires review

# 5. Merge après approval
# → Squash merge dans develop

# 6. Supprimer branch
git branch -d feature/nom-feature
git push origin --delete feature/nom-feature
```

---

## 3. STANDARDS CODE

### 3.1 Python (Backend)

```python
# Style: PEP 8
# Formatter: black
# Linter: pylint
# Type hints: obligatoires

# Exemple conforme:
from typing import Dict, Optional
import json

def analyze_scam(
    scenario: Dict[str, str],
    user_response: str,
    image_b64: Optional[str] = None
) -> Dict[str, any]:
    """
    Analyse la réponse utilisateur face à un scénario.
    
    Args:
        scenario: Scénario présenté
        user_response: Réponse textuelle utilisateur
        image_b64: Image optionnelle en base64
        
    Returns:
        Résultat analyse avec score et feedback
    """
    if not scenario or not user_response:
        raise ValueError("Scenario et response requis")
    
    # Logique...
    return {"score": 85, "feedback": "..."}
```

### 3.2 JavaScript/React (Frontend)

```javascript
// Style: Airbnb
// Formatter: Prettier
// Linter: ESLint

// Exemple conforme:
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant affichage scénario
 */
export default function ScenarioCard({ scenario, onSubmit }) {
  const [response, setResponse] = useState('');
  
  const handleSubmit = () => {
    if (!response.trim()) {
      alert('Veuillez entrer une réponse');
      return;
    }
    onSubmit(response);
  };
  
  return (
    <div className="scenario-card">
      <h2>{scenario.title}</h2>
      <p>{scenario.content}</p>
      <textarea 
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Votre réponse..."
      />
      <button onClick={handleSubmit}>Valider</button>
    </div>
  );
}

ScenarioCard.propTypes = {
  scenario: PropTypes.shape({
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
};
```

### 3.3 Tests Obligatoires

```python
# backend/tests/test_scenario_agent.py
import pytest
from agents.scenario import ScenarioAgent

def test_generate_scenario_valid():
    agent = ScenarioAgent()
    profile = {"age": 70, "level": 1}
    
    result = agent.generate(profile)
    
    assert "title" in result
    assert "content" in result
    assert "red_flags" in result
    assert len(result["red_flags"]) > 0

def test_generate_scenario_invalid_profile():
    agent = ScenarioAgent()
    
    with pytest.raises(ValueError):
        agent.generate({})
```

### 3.4 Coverage Minimum

| Composant | Coverage Min | Priorité |
|---|---|---|
| Agents (scenario, detection, coaching) | 80% | CRITIQUE |
| LLM Router | 70% | HAUTE |
| API Lambda handler | 60% | HAUTE |
| Frontend components | 50% | MOYENNE |

---

## 4. ROADMAP DÉTAILLÉE 7 JOURS

### JOUR 1 - SETUP (Tech Lead + DevOps)

**Matin (4h)**
```bash
□ 9h00-9h30   Kickoff meeting équipe
□ 9h30-10h30  Créer repo GitHub + structure
□ 10h30-11h30 Cloner FDP + FAST repos
□ 11h30-12h30 Setup AWS account + IAM roles
```

**Après-midi (4h)**
```bash
□ 13h30-15h00 CDK bootstrap + deploy infra base
□ 15h00-16h00 Configurer API keys (Gemini + OpenAI)
□ 16h00-17h00 Setup CI/CD GitHub Actions
```

**Livrables J1:**
- ✅ Repo GitHub configuré
- ✅ Infrastructure AWS déployée (DynamoDB + S3 + Cognito)
- ✅ CI/CD fonctionnel
- ✅ Documentation README.md

---

### JOUR 2 - BACKEND CORE (Backend Dev)

**Matin (4h)**
```bash
□ 9h00-9h30   Daily standup
□ 9h30-11h00  Implémenter LLMRouter (Gemini + OpenAI)
□ 11h00-12h30 Tests unitaires LLMRouter
```

**Après-midi (4h)**
```bash
□ 13h30-15h30 Implémenter ScenarioAgent
□ 15h30-17h00 Tests ScenarioAgent + PR
```

**Livrables J2:**
- ✅ `llm_router.py` fonctionnel
- ✅ `agents/scenario.py` fonctionnel
- ✅ Tests coverage > 80%
- ✅ PR mergée dans develop

---

### JOUR 3 - AGENTS DETECTION + COACHING (Backend Dev)

**Matin (4h)**
```bash
□ 9h00-9h30   Daily standup
□ 9h30-11h30  Implémenter DetectionAgent (vision)
□ 11h30-12h30 Tests DetectionAgent
```

**Après-midi (4h)**
```bash
□ 13h30-15h30 Implémenter CoachingAgent
□ 15h30-16h30 Tests CoachingAgent
□ 16h30-17h00 PR + code review
```

**Livrables J3:**
- ✅ `agents/detection.py` avec support images
- ✅ `agents/coaching.py` avec calcul XP
- ✅ Tests coverage > 80%
- ✅ PR mergée dans develop

---

### JOUR 4 - ANALYTICS + API (Backend Dev + Tech Lead)

**Matin (4h)**
```bash
□ 9h00-9h30   Daily standup
□ 9h30-11h00  Implémenter AnalyticsAgent
□ 11h00-12h30 Lambda handler principal (index.py)
```

**Après-midi (4h)**
```bash
□ 13h30-15h00 Intégration DynamoDB
□ 15h00-16h30 Tests intégration E2E backend
□ 16h30-17h00 Deploy backend sur AWS dev
```

**Livrables J4:**
- ✅ `agents/analytics.py` fonctionnel
- ✅ `index.py` API complète
- ✅ Backend déployé sur AWS
- ✅ Endpoints testés avec Postman

---

### JOUR 5 - FRONTEND PWA (Frontend Dev)

**Matin (4h)**
```bash
□ 9h00-9h30   Daily standup
□ 9h30-11h00  Setup React PWA + routing
□ 11h00-12h30 Composant Home + Scenario
```

**Après-midi (4h)**
```bash
□ 13h30-15h00 Composant Detection + upload images
□ 15h00-16h30 Composant Result + Analytics
□ 16h30-17h00 Intégration API backend
```

**Livrables J5:**
- ✅ React PWA fonctionnelle
- ✅ 4 écrans (Home, Scenario, Detection, Result)
- ✅ Upload images opérationnel
- ✅ Intégration backend complète

---

### JOUR 6 - TESTS + POLISH (Toute l'équipe)

**Matin (4h)**
```bash
□ 9h00-9h30   Daily standup
□ 9h30-11h00  Tests E2E complets (Backend Dev)
□ 11h00-12h30 Tests UI/UX avec 2 seniors (Frontend Dev)
```

**Après-midi (4h)**
```bash
□ 13h30-15h00 Corrections bugs identifiés
□ 15h00-16h00 Génération 5 scripts vidéos (Gemini)
□ 16h00-17h00 Documentation finale
```

**Livrables J6:**
- ✅ Tests E2E passés
- ✅ Feedback seniors intégré
- ✅ 5 scripts vidéos générés
- ✅ Documentation API + déploiement

---

### JOUR 7 - DEPLOY + LAUNCH (Tech Lead + DevOps)

**Matin (3h)**
```bash
□ 9h00-9h30   Daily standup final
□ 9h30-10h30  Deploy production (main branch)
□ 10h30-11h30 Tests smoke production
□ 11h30-12h00 Setup monitoring CloudWatch
```

**Après-midi (2h)**
```bash
□ 13h30-14h30 Inviter 10 beta users
□ 14h30-15h00 Monitoring première session
□ 15h00-15h30 Rétrospective équipe
```

**Livrables J7:**
- ✅ Application en production
- ✅ 10 beta users actifs
- ✅ Monitoring opérationnel
- ✅ Runbook incidents

---

## 5. GESTION BRANCHES

### 5.1 Protection Branches

```yaml
# .github/branch-protection.yml
main:
  required_reviews: 1
  required_status_checks:
    - backend-tests
    - frontend-tests
    - security-scan
  enforce_admins: false
  allow_force_pushes: false
  
develop:
  required_status_checks:
    - backend-tests
    - frontend-tests
  allow_force_pushes: false
```

### 5.2 Merge Strategy

| Source | Target | Strategy | Raison |
|---|---|---|---|
| feature/* | develop | Squash merge | Historique propre |
| develop | main | Merge commit | Traçabilité releases |
| hotfix/* | main | Merge commit | Urgence |

---

## 6. PROCESS REVIEW

### 6.1 Pull Request Template

```markdown
## Description
[Décrire les changements]

## Type de changement
- [ ] Feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation

## Checklist
- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Code formatté (black/prettier)
- [ ] Pas de secrets dans le code
- [ ] Testé localement

## Screenshots (si UI)
[Ajouter captures d'écran]

## Tests
[Décrire comment tester]
```

### 6.2 Code Review Checklist

**Reviewer doit vérifier:**
```
□ Code suit les standards (PEP 8 / Airbnb)
□ Tests présents et passent
□ Pas de secrets/credentials hardcodés
□ Error handling approprié
□ Documentation/commentaires clairs
□ Performance acceptable
□ Sécurité (injection, XSS, etc.)
```

### 6.3 Timeline Review

| Taille PR | Review Max | Merge Max |
|---|---|---|
| < 100 lignes | 1h | 2h |
| 100-300 lignes | 3h | 4h |
| > 300 lignes | 6h | 8h |

---

## 7. DÉPLOIEMENT

### 7.1 Environnements

| Env | Branch | URL | Deploy |
|---|---|---|---|
| **Dev** | develop | dev.scamguard.app | Auto (push) |
| **Prod** | main | scamguard.app | Manuel (tag) |

### 7.2 Process Déploiement Production

```bash
# 1. Merge develop → main (PR)
git checkout main
git pull origin main
git merge develop
git push origin main

# 2. Créer tag version
git tag -a v1.0.0 -m "MVP Launch - 10 users"
git push origin v1.0.0

# 3. GitHub Actions déploie automatiquement

# 4. Vérifier déploiement
curl https://scamguard.app/health

# 5. Monitoring 1h post-deploy
# → CloudWatch dashboard
```

### 7.3 Rollback Procedure

```bash
# Si problème critique en production:

# 1. Identifier dernier tag stable
git tag -l

# 2. Rollback code
git checkout v0.9.0
git push origin main --force

# 3. Redéployer
# → GitHub Actions redéploie automatiquement

# 4. Créer hotfix branch
git checkout -b hotfix/critical-issue

# 5. Fix + test + merge
```

---

## 8. COMMUNICATION

### 8.1 Canaux

| Canal | Usage | Réponse |
|---|---|---|
| **Slack #scamguard-dev** | Questions dev quotidiennes | < 1h |
| **Slack #scamguard-urgent** | Bugs production | < 15min |
| **GitHub Issues** | Bugs / Features tracking | < 24h |
| **GitHub Discussions** | Décisions architecture | < 48h |
| **Email** | Communication formelle | < 24h |

### 8.2 Daily Standup (9h30 - 15min max)

**Format:**
```
1. Qu'ai-je fait hier?
2. Que vais-je faire aujourd'hui?
3. Ai-je des blocages?
```

**Règles:**
- Max 2 min par personne
- Pas de résolution problème (après standup)
- Caméra obligatoire
- Ponctualité stricte

### 8.3 Incidents Production

**Severity Levels:**

| Level | Définition | Réponse | Escalation |
|---|---|---|---|
| **P0** | App down | Immédiate | Tech Lead + DevOps |
| **P1** | Feature critique cassée | < 1h | Tech Lead |
| **P2** | Bug mineur | < 4h | Dev assigné |
| **P3** | Amélioration | Next sprint | Backlog |

**Process P0/P1:**
```
1. Poster dans #scamguard-urgent
2. Créer incident GitHub
3. Investiguer (max 30min)
4. Décision: hotfix ou rollback
5. Déployer fix
6. Post-mortem (24h après)
```

---

## 9. MÉTRIQUES SUCCÈS

### 9.1 Métriques Développement

| Métrique | Target | Mesure |
|---|---|---|
| Velocity | 100% roadmap J1-J7 | GitHub Projects |
| Code coverage | > 70% | pytest + jest |
| PR review time | < 4h | GitHub Insights |
| Build success rate | > 95% | GitHub Actions |
| Bugs production | < 2/semaine | GitHub Issues |

### 9.2 Métriques Qualité

| Métrique | Target | Outil |
|---|---|---|
| Linting errors | 0 | pylint + eslint |
| Security issues | 0 critical | Snyk |
| Performance | p95 < 2s | CloudWatch |
| Uptime | > 99% | CloudWatch |

---

## 10. DOCUMENTATION OBLIGATOIRE

### 10.1 Code

```python
# Chaque fonction/classe doit avoir docstring

def analyze_scam(scenario: dict, response: str) -> dict:
    """
    Analyse la réponse utilisateur face à un scénario de scam.
    
    Args:
        scenario: Dictionnaire contenant le scénario
        response: Réponse textuelle de l'utilisateur
        
    Returns:
        Dictionnaire avec score et feedback
        
    Raises:
        ValueError: Si scenario ou response vide
        
    Example:
        >>> analyze_scam({"content": "..."}, "Je ne clique pas")
        {"score": 90, "feedback": "Excellent!"}
    """
```

### 10.2 API

```markdown
# docs/API.md

## POST /analyze

Analyse une réponse utilisateur.

**Request:**
```json
{
  "userId": "user123",
  "scenario": {...},
  "userResponse": "...",
  "imageBase64": "..." // optionnel
}
```

**Response:**
```json
{
  "detection": {"score": 85, ...},
  "coaching": {"feedback": "...", "xp_earned": 105}
}
```

**Errors:**
- 400: Invalid request
- 500: Server error
```

---

## 11. CHECKLIST AVANT MERGE MAIN

```
□ Tous les tests passent (backend + frontend)
□ Code coverage > 70%
□ Linting 0 erreur
□ Security scan 0 critical
□ Documentation à jour
□ PR approuvée par Tech Lead
□ Testé sur environnement dev
□ Changelog mis à jour
□ Tag version créé
□ Runbook incidents à jour
```

---

## 12. CONTACTS URGENCE

| Rôle | Nom | Slack | Tel | Disponibilité |
|---|---|---|---|---|
| Tech Lead | [Nom] | @techlead | +1-XXX | 24/7 P0 |
| Backend Dev | [Nom] | @backend | +1-XXX | 9h-17h |
| Frontend Dev | [Nom] | @frontend | +1-XXX | 9h-17h |
| DevOps | [Nom] | @devops | +1-XXX | On-call |

---

**Document vivant - Dernière mise à jour: Février 2026**
**Version: 1.0**
**Propriétaire: Tech Lead ScamGuard AI**
