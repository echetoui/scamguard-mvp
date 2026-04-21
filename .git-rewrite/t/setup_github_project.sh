#!/bin/bash
# setup_github_project.sh
# Script pour créer le projet GitHub ScamGuard AI pour echetoui

set -e

OWNER="echetoui"
REPO="scamguard-mvp"

echo "🚀 Setup GitHub Project ScamGuard AI"
echo "======================================"
echo ""

# 1. Créer le repository
echo "📦 Étape 1: Créer repository GitHub..."
gh repo create $OWNER/$REPO \
  --public \
  --description "ScamGuard AI - MVP Semaine 0 - Protection seniors contre arnaques" \
  --clone

cd $REPO

# 2. Créer structure de base
echo "📁 Étape 2: Créer structure projet..."
mkdir -p .github/workflows
mkdir -p .github/ISSUE_TEMPLATE
mkdir -p backend/lambda/agents
mkdir -p backend/cdk
mkdir -p backend/tests
mkdir -p frontend/src/components
mkdir -p scripts
mkdir -p docs
mkdir -p data

# 3. Créer README
echo "📝 Étape 3: Créer README..."
cat > README.md << 'EOF'
# 🛡️ ScamGuard AI - MVP Semaine 0

Protection des seniors contre les arnaques par IA.

## Architecture

- **Frontend:** React PWA
- **Backend:** AWS Lambda + Python
- **LLMs:** Gemini 1.5 Flash + GPT-4o-mini
- **Infrastructure:** AWS CDK
- **Database:** DynamoDB

## Coût

~$3-5/mois pour 10 utilisateurs

## Documentation

- [Roadmap v4.0](docs/ROADMAP_v4.md)
- [Gouvernance](docs/GOVERNANCE.md)
- [Gestion Projet](docs/PROJECT_MANAGEMENT.md)

## Quick Start

```bash
# Setup
./scripts/setup.sh

# Deploy
cd backend/cdk
cdk deploy
```

## Équipe

- Tech Lead: @echetoui
- Backend Dev: TBD
- Frontend Dev: TBD

## License

MIT
EOF

# 4. Créer .gitignore
echo "🚫 Étape 4: Créer .gitignore..."
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/

# CDK
cdk.out/
.cdk.staging/

# Node
node_modules/
dist/
build/

# IDE
.vscode/
.idea/
*.swp

# AWS
.aws-sam/

# Secrets
.env
*.pem
*.key

# OS
.DS_Store
Thumbs.db
EOF

# 5. Créer branches
echo "🌿 Étape 5: Créer branches..."
git checkout -b develop
git add .
git commit -m "chore: initial project structure"
git push -u origin develop

git checkout -b main
git push -u origin main

git checkout develop

# 6. Créer GitHub Project
echo "📊 Étape 6: Créer GitHub Project..."
gh project create \
  --owner $OWNER \
  --title "ScamGuard MVP - Semaine 0" \
  --format board

# Note: Récupérer le numéro du projet créé
PROJECT_NUMBER=$(gh project list --owner $OWNER --format json | jq '.[0].number')

echo "✅ Projet créé: https://github.com/users/$OWNER/projects/$PROJECT_NUMBER"

# 7. Créer labels
echo "🏷️  Étape 7: Créer labels..."
gh label create "J1" --color "0E8A16" --description "Jour 1 - Setup"
gh label create "J2" --color "1D76DB" --description "Jour 2 - Backend Core"
gh label create "J3" --color "5319E7" --description "Jour 3 - Agents"
gh label create "J4" --color "E99695" --description "Jour 4 - Analytics/API"
gh label create "J5" --color "F9D0C4" --description "Jour 5 - Frontend"
gh label create "J6" --color "FEF2C0" --description "Jour 6 - Tests"
gh label create "J7" --color "C2E0C6" --description "Jour 7 - Deploy"

gh label create "backend" --color "0052CC" --description "Backend"
gh label create "frontend" --color "00B8D9" --description "Frontend"
gh label create "infra" --color "FF5630" --description "Infrastructure"
gh label create "tests" --color "36B37E" --description "Tests"

gh label create "in-progress" --color "FBCA04" --description "En cours"
gh label create "in-review" --color "0075CA" --description "En review"
gh label create "blocked" --color "D93F0B" --description "Bloqué"

# 8. Créer issue templates
echo "📋 Étape 8: Créer issue templates..."
cat > .github/ISSUE_TEMPLATE/feature.yml << 'EOF'
name: Feature
description: Nouvelle fonctionnalité
title: "[FEATURE] "
labels: ["feature"]

body:
  - type: dropdown
    id: jour
    attributes:
      label: Jour
      options:
        - J1 - Setup
        - J2 - Backend Core
        - J3 - Agents Detection/Coaching
        - J4 - Analytics/API
        - J5 - Frontend
        - J6 - Tests
        - J7 - Deploy
    validations:
      required: true
  
  - type: dropdown
    id: agent
    attributes:
      label: Agent Responsable
      options:
        - Tech Lead
        - Backend Dev
        - Frontend Dev
        - DevOps
    validations:
      required: true
  
  - type: textarea
    id: description
    attributes:
      label: Description
    validations:
      required: true
  
  - type: textarea
    id: acceptance
    attributes:
      label: Critères d'Acceptation
      placeholder: |
        - [ ] Critère 1
        - [ ] Critère 2
    validations:
      required: true
EOF

cat > .github/ISSUE_TEMPLATE/bug.yml << 'EOF'
name: Bug
description: Signaler un bug
title: "[BUG] "
labels: ["bug"]

body:
  - type: dropdown
    id: severity
    attributes:
      label: Sévérité
      options:
        - P0 - Critique
        - P1 - Majeur
        - P2 - Mineur
    validations:
      required: true
  
  - type: textarea
    id: description
    attributes:
      label: Description
    validations:
      required: true
EOF

# 9. Créer issues roadmap
echo "📅 Étape 9: Créer issues roadmap..."

# J1
gh issue create --title "[J1] Setup repo GitHub + structure" \
  --label "J1,infra" --assignee "$OWNER" \
  --body "Créer structure complète du projet"

gh issue create --title "[J1] Cloner FDP + FAST repos" \
  --label "J1,infra" --assignee "$OWNER" \
  --body "Cloner les 2 repos AWS de référence"

gh issue create --title "[J1] CDK bootstrap + deploy infra" \
  --label "J1,infra" --assignee "$OWNER" \
  --body "Déployer infrastructure AWS de base"

gh issue create --title "[J1] Configurer secrets SSM" \
  --label "J1,infra" --assignee "$OWNER" \
  --body "Créer secrets Gemini + OpenAI dans SSM"

# J2
gh issue create --title "[J2] Implémenter LLMRouter" \
  --label "J2,backend" \
  --body "Router Gemini Flash + GPT-4o-mini"

gh issue create --title "[J2] Tests unitaires LLMRouter" \
  --label "J2,backend,tests" \
  --body "Coverage > 80%"

gh issue create --title "[J2] Implémenter ScenarioAgent" \
  --label "J2,backend" \
  --body "Agent génération scénarios avec Gemini"

# J3
gh issue create --title "[J3] Implémenter DetectionAgent" \
  --label "J3,backend" \
  --body "Agent détection avec vision GPT-4o-mini"

gh issue create --title "[J3] Implémenter CoachingAgent" \
  --label "J3,backend" \
  --body "Agent coaching avec Gemini Flash"

# J4
gh issue create --title "[J4] Implémenter AnalyticsAgent" \
  --label "J4,backend" \
  --body "Agent analytics avec GPT-4o-mini"

gh issue create --title "[J4] Lambda handler principal" \
  --label "J4,backend" \
  --body "API Lambda complète"

gh issue create --title "[J4] Intégration DynamoDB" \
  --label "J4,backend" \
  --body "CRUD complet DynamoDB"

# J5
gh issue create --title "[J5] Setup React PWA" \
  --label "J5,frontend" \
  --body "Structure React + PWA config"

gh issue create --title "[J5] Composants Home + Scenario" \
  --label "J5,frontend" \
  --body "UI écrans principaux"

gh issue create --title "[J5] Composant Detection + upload" \
  --label "J5,frontend" \
  --body "Upload images + analyse"

# J6
gh issue create --title "[J6] Tests E2E complets" \
  --label "J6,tests" \
  --body "Tests end-to-end backend + frontend"

gh issue create --title "[J6] Tests UX avec seniors" \
  --label "J6,tests" \
  --body "Validation UX avec 2 seniors"

# J7
gh issue create --title "[J7] Deploy production" \
  --label "J7,infra" --assignee "$OWNER" \
  --body "Déploiement sur AWS production"

gh issue create --title "[J7] Inviter 10 beta users" \
  --label "J7" --assignee "$OWNER" \
  --body "Onboarding 10 utilisateurs beta"

echo ""
echo "✅ Setup terminé!"
echo ""
echo "📍 Repository: https://github.com/$OWNER/$REPO"
echo "📊 Project: https://github.com/users/$OWNER/projects/$PROJECT_NUMBER"
echo "📋 Issues: https://github.com/$OWNER/$REPO/issues"
echo ""
echo "🎯 Prochaines étapes:"
echo "1. Aller sur le projet GitHub"
echo "2. Configurer les vues (Par Jour, Par Agent, Timeline)"
echo "3. Assigner les issues aux développeurs"
echo "4. Démarrer Jour 1!"
