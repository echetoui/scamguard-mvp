# 📊 GESTION DE PROJET SCAMGUARD AI
## GitHub Projects + Automation · Suivi Temps Réel · Version 1.0

---

## 1. OUTIL DE GESTION: GITHUB PROJECTS

### 1.1 Pourquoi GitHub Projects?

✅ **Intégré au repo** - Pas d'outil externe  
✅ **Automation native** - Mise à jour automatique via GitHub Actions  
✅ **Gratuit** - Inclus dans GitHub  
✅ **Traçabilité** - Lié aux commits/PRs  
✅ **API disponible** - Agents peuvent mettre à jour  

---

## 2. STRUCTURE GITHUB PROJECT

### 2.1 Setup Initial

```bash
# Créer le projet GitHub
# Via UI: https://github.com/orgs/YOUR_ORG/projects/new
# Ou via CLI:

gh project create --owner YOUR_ORG --title "ScamGuard MVP - Semaine 0"
```

### 2.2 Colonnes (Board View)

| Colonne | Statut | Automation |
|---|---|---|
| 📋 **Backlog** | À faire | Issues créées |
| 🏗️ **In Progress** | En cours | Branch créée |
| 👀 **In Review** | Code review | PR ouverte |
| ✅ **Done** | Terminé | PR mergée |
| 🚫 **Blocked** | Bloqué | Label "blocked" |

### 2.3 Vues Personnalisées

**Vue 1: Par Jour**
```
Grouper par: Custom Field "Jour" (J1-J7)
Filtrer par: Status != Done
Trier par: Priority
```

**Vue 2: Par Agent**
```
Grouper par: Assignee
Filtrer par: Status = In Progress
Trier par: Updated (desc)
```

**Vue 3: Timeline**
```
Layout: Roadmap
Dates: Start Date → Target Date
Grouper par: Jour
```

---

## 3. AUTOMATION GITHUB ACTIONS

### 3.1 Workflow Mise à Jour Automatique

```yaml
# .github/workflows/project-automation.yml
name: Project Automation

on:
  issues:
    types: [opened, closed, assigned]
  pull_request:
    types: [opened, closed, merged, review_requested]
  push:
    branches: [develop, main]

jobs:
  update-project:
    runs-on: ubuntu-latest
    steps:
      - name: Update Project Board
        uses: actions/add-to-project@v0.5.0
        with:
          project-url: https://github.com/orgs/YOUR_ORG/projects/1
          github-token: ${{ secrets.PROJECT_TOKEN }}
      
      - name: Move to In Progress
        if: github.event_name == 'pull_request' && github.event.action == 'opened'
        uses: actions/github-script@v7
        with:
          script: |
            const issue = context.payload.pull_request;
            await github.rest.projects.moveCard({
              card_id: issue.project_card_id,
              position: 'top',
              column_id: IN_PROGRESS_COLUMN_ID
            });
      
      - name: Move to In Review
        if: github.event_name == 'pull_request' && github.event.action == 'review_requested'
        uses: actions/github-script@v7
        with:
          script: |
            // Move to In Review column
            
      - name: Move to Done
        if: github.event_name == 'pull_request' && github.event.pull_request.merged == true
        uses: actions/github-script@v7
        with:
          script: |
            // Move to Done column + close issue
```

### 3.2 Workflow Notification Slack

```yaml
# .github/workflows/slack-notifications.yml
name: Slack Notifications

on:
  pull_request:
    types: [opened, closed, review_requested]
  issues:
    types: [opened, closed]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Notify PR Opened
        if: github.event_name == 'pull_request' && github.event.action == 'opened'
        uses: slackapi/slack-github-action@v1.25.0
        with:
          channel-id: 'C12345678'
          slack-message: |
            🔔 Nouvelle PR ouverte
            *${{ github.event.pull_request.title }}*
            Par: @${{ github.event.pull_request.user.login }}
            Lien: ${{ github.event.pull_request.html_url }}
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
      
      - name: Notify PR Merged
        if: github.event.pull_request.merged == true
        uses: slackapi/slack-github-action@v1.25.0
        with:
          channel-id: 'C12345678'
          slack-message: |
            ✅ PR mergée dans develop
            *${{ github.event.pull_request.title }}*
            Par: @${{ github.event.pull_request.user.login }}
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

---

## 4. ISSUES TEMPLATE

### 4.1 Template Feature

```markdown
# .github/ISSUE_TEMPLATE/feature.yml
name: Feature
description: Nouvelle fonctionnalité
title: "[FEATURE] "
labels: ["feature"]
assignees: []

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
      description: Décrire la fonctionnalité
    validations:
      required: true
  
  - type: textarea
    id: acceptance
    attributes:
      label: Critères d'Acceptation
      description: Liste des critères pour considérer la tâche terminée
      placeholder: |
        - [ ] Critère 1
        - [ ] Critère 2
    validations:
      required: true
  
  - type: input
    id: estimate
    attributes:
      label: Estimation (heures)
      placeholder: "4"
    validations:
      required: true
```

### 4.2 Template Bug

```markdown
# .github/ISSUE_TEMPLATE/bug.yml
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
        - P0 - Critique (app down)
        - P1 - Majeur (feature cassée)
        - P2 - Mineur
        - P3 - Cosmétique
    validations:
      required: true
  
  - type: textarea
    id: description
    attributes:
      label: Description du Bug
    validations:
      required: true
  
  - type: textarea
    id: reproduction
    attributes:
      label: Étapes de Reproduction
      placeholder: |
        1. Aller sur...
        2. Cliquer sur...
        3. Observer...
    validations:
      required: true
  
  - type: textarea
    id: expected
    attributes:
      label: Comportement Attendu
    validations:
      required: true
```

---

## 5. SCRIPT MISE À JOUR MANUELLE

### 5.1 CLI pour Agents

```python
# scripts/update_task.py
#!/usr/bin/env python3
"""
Script pour mettre à jour l'état d'une tâche GitHub Project
Usage: python update_task.py --issue 42 --status "In Progress" --comment "Démarré LLMRouter"
"""

import argparse
import os
from github import Github

def update_task(issue_number: int, status: str, comment: str = None):
    """Met à jour une issue GitHub Project"""
    
    g = Github(os.environ['GITHUB_TOKEN'])
    repo = g.get_repo("YOUR_ORG/scamguard-mvp")
    issue = repo.get_issue(issue_number)
    
    # Ajouter commentaire
    if comment:
        issue.create_comment(f"📝 **Mise à jour:** {comment}")
    
    # Changer label selon statut
    status_labels = {
        "In Progress": "in-progress",
        "In Review": "in-review",
        "Done": "done",
        "Blocked": "blocked"
    }
    
    if status in status_labels:
        issue.add_to_labels(status_labels[status])
    
    print(f"✅ Issue #{issue_number} mise à jour: {status}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--issue", type=int, required=True)
    parser.add_argument("--status", required=True)
    parser.add_argument("--comment", default=None)
    
    args = parser.parse_args()
    update_task(args.issue, args.status, args.comment)
```

### 5.2 Utilisation par les Agents

```bash
# Backend Dev démarre une tâche
python scripts/update_task.py \
  --issue 42 \
  --status "In Progress" \
  --comment "Démarré implémentation LLMRouter"

# Backend Dev termine une tâche
python scripts/update_task.py \
  --issue 42 \
  --status "In Review" \
  --comment "LLMRouter terminé, PR #15 créée"

# Tech Lead valide
python scripts/update_task.py \
  --issue 42 \
  --status "Done" \
  --comment "PR mergée, tests passent"
```

---

## 6. DASHBOARD TEMPS RÉEL

### 6.1 GitHub Project Dashboard

**URL:** `https://github.com/orgs/YOUR_ORG/projects/1`

**Widgets:**
- 📊 Burndown chart (tâches restantes par jour)
- 👥 Workload par agent
- ⏱️ Temps moyen par tâche
- 🎯 Vélocité (tâches/jour)
- 🚨 Tâches bloquées

### 6.2 Métriques Clés

```sql
-- Requête GitHub GraphQL pour métriques

query {
  organization(login: "YOUR_ORG") {
    projectV2(number: 1) {
      items(first: 100) {
        nodes {
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field {
                  ... on ProjectV2SingleSelectField {
                    name
                  }
                }
              }
            }
          }
          content {
            ... on Issue {
              number
              title
              assignees(first: 1) {
                nodes {
                  login
                }
              }
              createdAt
              closedAt
            }
          }
        }
      }
    }
  }
}
```

---

## 7. WORKFLOW QUOTIDIEN

### 7.1 Matin (9h00)

```bash
# 1. Chaque agent check son board
open https://github.com/orgs/YOUR_ORG/projects/1/views/2  # Vue "Par Agent"

# 2. Daily standup (9h30)
# → Chaque agent partage son écran GitHub Project

# 3. Démarrer première tâche
python scripts/update_task.py --issue XX --status "In Progress"
```

### 7.2 Pendant la Journée

```bash
# Commit avec référence issue
git commit -m "feat(llm): implement Gemini router #42"

# → GitHub Actions met à jour automatiquement le board

# Créer PR
gh pr create --title "feat: LLMRouter implementation" --body "Closes #42"

# → Board passe automatiquement en "In Review"
```

### 7.3 Fin de Journée (17h00)

```bash
# 1. Mettre à jour toutes les tâches en cours
python scripts/update_task.py \
  --issue 42 \
  --status "In Progress" \
  --comment "80% terminé, reste tests unitaires"

# 2. Check dashboard
open https://github.com/orgs/YOUR_ORG/projects/1

# 3. Poster résumé dans Slack
# → Automatique via GitHub Actions
```

---

## 8. ROADMAP GITHUB PROJECT

### 8.1 Issues Pré-créées (Jour 0)

```bash
# Script création automatique des issues

#!/bin/bash
# scripts/create_roadmap_issues.sh

# JOUR 1
gh issue create --title "[J1] Setup repo GitHub + structure" \
  --label "J1,setup" --assignee "techlead" --body "..."

gh issue create --title "[J1] Clone FDP + FAST repos" \
  --label "J1,setup" --assignee "techlead" --body "..."

gh issue create --title "[J1] CDK bootstrap + deploy infra" \
  --label "J1,infra" --assignee "devops" --body "..."

gh issue create --title "[J1] Configurer secrets SSM" \
  --label "J1,security" --assignee "devops" --body "..."

# JOUR 2
gh issue create --title "[J2] Implémenter LLMRouter" \
  --label "J2,backend" --assignee "backend-dev" --body "..."

gh issue create --title "[J2] Tests unitaires LLMRouter" \
  --label "J2,backend,tests" --assignee "backend-dev" --body "..."

gh issue create --title "[J2] Implémenter ScenarioAgent" \
  --label "J2,backend" --assignee "backend-dev" --body "..."

# JOUR 3
gh issue create --title "[J3] Implémenter DetectionAgent" \
  --label "J3,backend" --assignee "backend-dev" --body "..."

gh issue create --title "[J3] Implémenter CoachingAgent" \
  --label "J3,backend" --assignee "backend-dev" --body "..."

# JOUR 4
gh issue create --title "[J4] Implémenter AnalyticsAgent" \
  --label "J4,backend" --assignee "backend-dev" --body "..."

gh issue create --title "[J4] Lambda handler principal" \
  --label "J4,backend" --assignee "techlead" --body "..."

gh issue create --title "[J4] Intégration DynamoDB" \
  --label "J4,backend" --assignee "backend-dev" --body "..."

# JOUR 5
gh issue create --title "[J5] Setup React PWA" \
  --label "J5,frontend" --assignee "frontend-dev" --body "..."

gh issue create --title "[J5] Composants Home + Scenario" \
  --label "J5,frontend" --assignee "frontend-dev" --body "..."

gh issue create --title "[J5] Composant Detection + upload" \
  --label "J5,frontend" --assignee "frontend-dev" --body "..."

# JOUR 6
gh issue create --title "[J6] Tests E2E complets" \
  --label "J6,tests" --assignee "backend-dev" --body "..."

gh issue create --title "[J6] Tests UX avec seniors" \
  --label "J6,tests" --assignee "frontend-dev" --body "..."

# JOUR 7
gh issue create --title "[J7] Deploy production" \
  --label "J7,deploy" --assignee "devops" --body "..."

gh issue create --title "[J7] Inviter 10 beta users" \
  --label "J7,launch" --assignee "techlead" --body "..."

echo "✅ 25 issues créées pour roadmap 7 jours"
```

### 8.2 Exécution Script

```bash
# Jour 0 - Avant démarrage
chmod +x scripts/create_roadmap_issues.sh
./scripts/create_roadmap_issues.sh

# Vérifier
gh issue list --label "J1"
```

---

## 9. INTÉGRATION SLACK

### 9.1 Bot Slack Notifications

```python
# scripts/slack_bot.py
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
import os

client = WebClient(token=os.environ['SLACK_BOT_TOKEN'])

def notify_task_update(issue_number: int, status: str, assignee: str):
    """Notifie Slack d'une mise à jour de tâche"""
    
    message = f"""
    📋 *Mise à jour tâche #{issue_number}*
    Statut: `{status}`
    Assigné à: @{assignee}
    Lien: https://github.com/YOUR_ORG/scamguard-mvp/issues/{issue_number}
    """
    
    try:
        response = client.chat_postMessage(
            channel='#scamguard-dev',
            text=message
        )
    except SlackApiError as e:
        print(f"Erreur Slack: {e.response['error']}")

def daily_summary():
    """Envoie résumé quotidien à 17h"""
    
    # Récupérer métriques GitHub
    # ...
    
    message = f"""
    📊 *Résumé Journée J{day}*
    
    ✅ Terminé: {done_count} tâches
    🏗️ En cours: {in_progress_count} tâches
    🚫 Bloqué: {blocked_count} tâches
    
    👥 *Par Agent:*
    • Backend Dev: {backend_tasks} tâches
    • Frontend Dev: {frontend_tasks} tâches
    • Tech Lead: {lead_tasks} tâches
    
    🎯 Vélocité: {velocity} tâches/jour
    📈 Progression: {progress}%
    """
    
    client.chat_postMessage(channel='#scamguard-dev', text=message)
```

### 9.2 Commandes Slack

```python
# Bot répond aux commandes Slack

@app.command("/task-status")
def task_status(ack, command):
    """Affiche statut d'une tâche"""
    ack()
    issue_number = command['text']
    # Récupérer depuis GitHub API
    # ...

@app.command("/my-tasks")
def my_tasks(ack, command):
    """Affiche tâches assignées à l'utilisateur"""
    ack()
    user = command['user_name']
    # Récupérer depuis GitHub API
    # ...

@app.command("/block-task")
def block_task(ack, command):
    """Marque une tâche comme bloquée"""
    ack()
    issue_number, reason = command['text'].split(' ', 1)
    # Mettre à jour GitHub
    # ...
```

---

## 10. MÉTRIQUES & REPORTING

### 10.1 Dashboard Hebdomadaire

```python
# scripts/weekly_report.py
import matplotlib.pyplot as plt
from github import Github

def generate_weekly_report():
    """Génère rapport hebdomadaire avec graphiques"""
    
    g = Github(os.environ['GITHUB_TOKEN'])
    repo = g.get_repo("YOUR_ORG/scamguard-mvp")
    
    # Burndown chart
    days = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7']
    remaining = [25, 21, 16, 12, 8, 4, 0]  # Tâches restantes
    
    plt.figure(figsize=(10, 6))
    plt.plot(days, remaining, marker='o')
    plt.title('Burndown Chart - Semaine 0')
    plt.xlabel('Jour')
    plt.ylabel('Tâches Restantes')
    plt.grid(True)
    plt.savefig('reports/burndown.png')
    
    # Velocity chart
    completed = [4, 5, 4, 4, 4, 4, 0]
    plt.figure(figsize=(10, 6))
    plt.bar(days, completed)
    plt.title('Vélocité Quotidienne')
    plt.xlabel('Jour')
    plt.ylabel('Tâches Complétées')
    plt.savefig('reports/velocity.png')
    
    print("✅ Rapports générés dans reports/")
```

### 10.2 Alertes Automatiques

```yaml
# .github/workflows/alerts.yml
name: Project Alerts

on:
  schedule:
    - cron: '0 17 * * *'  # Tous les jours à 17h

jobs:
  check-blocked:
    runs-on: ubuntu-latest
    steps:
      - name: Check Blocked Tasks
        uses: actions/github-script@v7
        with:
          script: |
            const issues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: 'blocked',
              state: 'open'
            });
            
            if (issues.data.length > 0) {
              // Envoyer alerte Slack
              console.log(`⚠️ ${issues.data.length} tâches bloquées!`);
            }
  
  check-overdue:
    runs-on: ubuntu-latest
    steps:
      - name: Check Overdue Tasks
        uses: actions/github-script@v7
        with:
          script: |
            // Vérifier tâches en retard
            // Envoyer alerte si nécessaire
```

---

## 11. CHECKLIST SETUP GESTION PROJET

```bash
□ Créer GitHub Project "ScamGuard MVP - Semaine 0"
□ Configurer colonnes (Backlog, In Progress, In Review, Done, Blocked)
□ Créer vues personnalisées (Par Jour, Par Agent, Timeline)
□ Setup GitHub Actions automation (.github/workflows/project-automation.yml)
□ Créer issues templates (.github/ISSUE_TEMPLATE/)
□ Exécuter script création roadmap (scripts/create_roadmap_issues.sh)
□ Configurer Slack bot + notifications
□ Installer script CLI update_task.py
□ Tester workflow complet (créer issue → branch → PR → merge)
□ Former équipe sur utilisation GitHub Project
□ Planifier daily summary automatique (17h)
```

---

## 12. EXEMPLE WORKFLOW COMPLET

### Scénario: Backend Dev implémente LLMRouter

```bash
# 1. Matin - Check board
open https://github.com/orgs/YOUR_ORG/projects/1/views/2

# 2. Démarrer tâche #42
python scripts/update_task.py --issue 42 --status "In Progress"

# 3. Créer branch
git checkout -b feature/llm-router
# → GitHub Actions met à jour board automatiquement

# 4. Développer
# ... code ...

# 5. Commit avec référence
git commit -m "feat(llm): implement Gemini router #42"
git push origin feature/llm-router

# 6. Créer PR
gh pr create --title "feat: LLMRouter implementation" --body "Closes #42"
# → Board passe en "In Review" automatiquement
# → Notification Slack envoyée

# 7. Après review + merge
# → Board passe en "Done" automatiquement
# → Issue #42 fermée automatiquement
# → Notification Slack "✅ PR mergée"
```

---

**Gestion Projet ScamGuard AI · GitHub Projects + Automation · Temps Réel**
**Version: 1.0 · Propriétaire: Tech Lead**
