# 📦 Archive - Fichiers Obsolètes

Cette section documente les fichiers obsolètes qui devraient être supprimés du repository pour éviter la confusion.

**Date:** 22 février 2026
**Responsable:** @echetoui

---

## 📋 Fichiers à Archiver/Supprimer

Les fichiers suivants sont **obsolètes** ou **dupliqués** et doivent être supprimés du repository:

### Fichiers de Tâches (Task Tracking - Phase 1 & 2)
Ces fichiers documentaient les tâches individuelles des phases 1-2. Ils sont remplacés par [ACTION_PLAN_2026_02_22.md](../ACTION_PLAN_2026_02_22.md)

```
❌ TASK_1_1_EXECUTION.md              - Exécution tâche 1.1 (Phase 1 - Complétée)
❌ TASK_2_1_2_STATUS.md               - Status tâche 2.1.2 (Phase 2 - Complétée)
❌ TASK_2_1_3_STATUS.md               - Status tâche 2.1.3 (Phase 2 - Complétée)
❌ TASK_2_2_1_STATUS.md               - Status tâche 2.2.1 (Phase 2 - Complétée)
❌ TASK_2_2_2_STATUS.md               - Status tâche 2.2.2 (Phase 2 - Complétée)
```

**Raison:** Les phases 1-2 sont complétées. Le tracking des tâches est maintenant centralisé dans [ACTION_PLAN_2026_02_22.md](../ACTION_PLAN_2026_02_22.md)

**Remplaçant:** [../ACTION_PLAN_2026_02_22.md](../ACTION_PLAN_2026_02_22.md)

---

### Fichiers de Rapports Phases (Phase 1 à 4.0)
Ces fichiers documentaient l'état d'avancement de chaque phase. Remplacés par [PROJECT_STATUS.md](../PROJECT_STATUS.md)

```
❌ PHASE_1_EXECUTION_TRACKER.md       - Tracker exécution Phase 1
❌ PHASE_1_FINAL_REPORT.md            - Rapport final Phase 1
❌ PHASE_1_TASK_DASHBOARD.md          - Dashboard tâches Phase 1
❌ PHASE_2_EXECUTION_TRACKER.md       - Tracker exécution Phase 2
❌ PHASE_2_ROADMAP.md                 - Roadmap Phase 2
❌ PHASE_3_ROADMAP.md                 - Roadmap Phase 3
❌ PHASE_4_0_COMPLETION_SUMMARY.md    - Résumé complétude Phase 4.0
❌ PHASE_4_0_INTEGRATION_REPORT.md    - Rapport intégration Phase 4.0
❌ PHASE_4_0_4_CREDIT_SYSTEM_REPORT.md - Rapport système crédit Phase 4.0.4
❌ PHASE_4_0_4_FINAL_SUMMARY.md       - Résumé final Phase 4.0.4
❌ PHASE_4_0_5_QUIZ_CREDITS_REPORT.md - Rapport Quiz/Crédits Phase 4.0.5
❌ PHASE_4_2_ACCOUNT_MANAGEMENT_REPORT.md - Rapport gestion compte Phase 4.2
```

**Raison:** L'état de toutes les phases est consolidé dans [PROJECT_STATUS.md](../PROJECT_STATUS.md). Ces fichiers individuels créent de la confusion et des doublons.

**Remplaçant:** [../PROJECT_STATUS.md](../PROJECT_STATUS.md)

---

### Fichiers Agent & Prompts
Fichiers système liés aux agents IA utilisés pendant le développement

```
❌ AGENT_TASKS_PROMPTS.md             - Prompts pour les agents IA (documentation interne)
```

**Raison:** Documentation interne des agents, non pertinente pour les utilisateurs/développeurs

---

### Fichiers Génériques de Documentation
Ces fichiers contiennent des informations générales qui sont maintenant intégrées dans d'autres documents

```
❌ CORE_FEATURES_AUDIT.md             - Audit des fonctionnalités principales
❌ DEPLOYMENT_GUIDE.md                - Guide de déploiement (cf deployment.md)
❌ FEATURES_REPORT.md                 - Rapport des fonctionnalités
❌ FINAL_BUDGET_SUBSCRIPTION_MODEL.md - Modèle budget/abonnement
❌ LAUNCH_CHECKLIST.md                - Checklist de lancement
```

**Raison:** Informations dupliquées ou intégrées dans la documentation officielle

**Remplaçants:**
- Deployment: [../docs/deployment.md](deployment.md)
- Features: [../PROJECT_STATUS.md](../PROJECT_STATUS.md)
- Checklist: [À créer] `DEPLOYMENT_CHECKLIST.md`

---

## ✅ Fichiers à Conserver

Les fichiers suivants doivent **rester** dans le repository:

```
✅ ACTION_PLAN_2026_02_22.md          - Plan d'action actuel (Essentiel)
✅ README.md                          - Aperçu du projet (Essentiel)
✅ PROJECT_STATUS.md                  - État du projet (Essentiel)
✅ PHASE_4.1_TEST_PLAN.md             - Plan de test Phase 4.1 (Essentiel)
```

---

## 🛠️ Instructions d'Archivage

### Étape 1: Sauvegarder les fichiers (Optionnel)
```bash
# Créer une branche d'archive avant suppression
git checkout -b archive/obsolete-docs
mkdir -p docs/archive/phase-reports docs/archive/task-tracking

# Copier les fichiers (optionnel, juste pour trace)
cp PHASE_*.md docs/archive/phase-reports/
cp TASK_*.md docs/archive/task-tracking/
cp AGENT_*.md docs/archive/
```

### Étape 2: Supprimer du Repository
```bash
# Retirer les fichiers du git (garder dans l'historique)
git rm PHASE_*.md
git rm TASK_*.md
git rm AGENT_*.md
git rm CORE_FEATURES_AUDIT.md
git rm DEPLOYMENT_GUIDE.md
git rm FEATURES_REPORT.md
git rm FINAL_BUDGET_SUBSCRIPTION_MODEL.md
git rm LAUNCH_CHECKLIST.md

# Committer la suppression
git commit -m "chore: archive obsolete documentation files

This commit removes phase-specific reports and task trackers that have been consolidated into:
- ACTION_PLAN_2026_02_22.md (task tracking)
- PROJECT_STATUS.md (phase status)
- docs/deployment.md (deployment guide)
- docs/DOCUMENTATION_INDEX.md (documentation index)

These files remain in git history and are archived in docs/archive/ for reference."
```

### Étape 3: Pousser l'Archivage
```bash
# Créer une PR avec la suppression
git push origin archive/obsolete-docs

# Merger après revue
git checkout develop
git merge archive/obsolete-docs
git push origin develop
```

---

## 📊 Impact de la Suppression

### Avant
- 📦 ~25 fichiers markdown dans la racine
- ❌ Confus (multiple sources de vérité)
- ❌ Dupliqué (même info dans plusieurs fichiers)

### Après
- 📦 ~4 fichiers markdown dans la racine
- ✅ Clair (une seule source de vérité)
- ✅ Organisé (structure documentée)

### Fichiers Conservés
```
/
├── ACTION_PLAN_2026_02_22.md  (Plan d'action actuel)
├── README.md                   (Aperçu du projet)
├── PROJECT_STATUS.md           (État du projet)
├── PHASE_4.1_TEST_PLAN.md      (Tests Phase 4.1)
└── docs/
    ├── DOCUMENTATION_INDEX.md  (Index de la documentation)
    ├── AWS_ARCHITECTURE_READY.md
    ├── deployment.md
    ├── architecture.md
    └── archive/
        └── README.md (Ce fichier)
```

---

## 🔍 Points d'Attention

⚠️ **N'EFFACER PAS SUR MAIN/PRODUCTION**
- Effectuer l'archivage uniquement sur `develop`
- Tester après suppression pour vérifier que rien n'est cassé
- Vérifier que la documentation de référence est correcte

⚠️ **VÉRIFIER LES LIENS**
- S'assurer qu'aucun fichier ne pointe vers les fichiers supprimés
- Mettre à jour les références dans `README.md` et `DOCUMENTATION_INDEX.md`

---

## 📝 Historique des Mises à Jour

| Date | Action | Responsable |
|------|--------|-----------|
| 22/02/2026 | Création du plan d'archivage | @echetoui |
| TBD | Exécution de l'archivage | @echetoui |

---

**Dernier mise à jour:** 22 février 2026
