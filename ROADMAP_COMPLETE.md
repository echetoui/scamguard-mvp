# ScamGuard - Roadmap Complète 2026-2027

**Document:** Planification stratégique
**Date:** 17 février 2026
**Horizon:** 18 mois (Feb 2026 - Aug 2027)
**Version:** 1.0

---

## 📊 Vue d'ensemble Stratégique

```
Phase 1 (Feb-Mar)
└─ Consolidation & Ancrage Québécois
   ├─ Localisation menaces
   ├─ Conformité Loi 25
   └─ Intégration institutions locales

Phase 2 (Apr-Jul)
├─ Phase 2.1: Rattrapage (Apr)
│  ├─ Simulation SMS réelles
│  ├─ Quizz interactifs
│  └─ Alertes hebdomadaires
├─ Phase 2.2: UX/UI (May)
│  ├─ Refonte Dashboard
│  ├─ Profil "Ange Gardien"
│  └─ Haptic feedback
├─ Phase 2.3: Localisation (Jun)
│  └─ Numéros d'urgence québécois
└─ Phase 2 Avancée (Jul)
   ├─ Mode "Ange Gardien"
   ├─ Réseau de confiance
   └─ Académie formation

Phase 3 (Aug-Sep)
└─ UX/UI & Accessibilité 2.0
   ├─ Design Senior-First
   ├─ Tableau de bord "Cœur Sécurité"
   └─ WCAG AAA complet

Phase 4 (Oct+)
└─ Vision IA & Intelligence Prédictive
   ├─ Vision IA (documents papier)
   └─ Assistant appel temps réel
```

---

# 🎯 PHASE 1: Consolidation & Ancrage Québécois

## Durée
**Février - Mars 2026 (2 mois)**

## Objectif Stratégique
Rendre l'outil **indispensable localement** en intégrant les réalités du Québec

### Résumé
- Adapter l'IA pour institutions québécoises
- Conformité Loi 25 RGPD québécoise
- Intégration alertes Sûreté du Québec
- Débuter partenariats locaux

---

## 📍 1.1 Localisation des Menaces

### 1.1.1 Flux "Alerte Québec" en Temps Réel

**Objectif:** Système de notifications push basé sur alertes SQ + CAFC

**Livrables:**

```
✅ Integration API Sûreté du Québec
   ├─ Endpoint: /api/sq-alerts
   ├─ Frequency: Polling toutes les 4h
   └─ Format: JSON des dernières arnaques

✅ Integration Centre Antifraude du Canada (CAFC)
   ├─ Endpoint: /api/cafc-alerts
   ├─ Data: CSV threats
   └─ Update: Daily

✅ Push Notifications
   ├─ Firebase Cloud Messaging
   ├─ Titre: "🚨 Nouvelle arnaque détectée au Québec"
   ├─ Body: Description alerte (50 chars max)
   └─ Action: Ouvrir détails

✅ Dashboard Alertes
   ├─ Afficher les 10 dernières alertes
   ├─ Filtrer par type (SMS, Email, Appel)
   ├─ Alerter l'utilisateur matching ses patterns
   └─ Archive des alertes (30 jours)
```

**Spécifications Techniques:**

```python
# Structure alerte SQ
{
  "id": "SQ-2026-001",
  "type": "SMS",  # SMS, Email, Appel, Phishing
  "institution": "Desjardins",
  "threat_level": "high",  # low, medium, high
  "keywords": ["cliquer", "urgent", "vérifier"],
  "description_fr": "Faux SMS bancaire circulant...",
  "source": "SQ",  # SQ ou CAFC
  "date_detected": "2026-02-17T10:30:00Z",
  "geometry": {
    "regions": ["Montréal", "Québec", "Gatineau"],
    "province": "QC"
  }
}
```

**Timeline:**
- Semaine 1: API SQ/CAFC integration
- Semaine 2: Firebase setup + notifications
- Semaine 3: Dashboard + filtering
- Semaine 4: Testing + launch

**Ressources:**
- Backend Dev: 1 FTE
- DevOps: 0.5 FTE
- QA: 0.5 FTE

**Coûts AWS Estimés:** +$50/mois (Firebase, DynamoDB)

---

### 1.1.2 Base de Données Institutions Québécoises

**Objectif:** IA reconnaît formats communications institutions locales

**Institutions Cibles:**

| Institution | Type | Priorité |
|---|---|---|
| Desjardins | Banque | 1 |
| Hydro-Québec | Services | 1 |
| Revenu Québec | Gov | 1 |
| SAAQ | Gov | 1 |
| Bell/Videotron | Telecom | 2 |
| Telus | Telecom | 2 |
| Laurentian Bank | Banque | 2 |
| National Bank | Banque | 2 |

**Livrables:**

```python
# Institution template
{
  "id": "desjardins",
  "name": "Desjardins",
  "type": "bank",
  "legitimate_domains": [
    "desjardins.com",
    "mon.desjardins.com",
    "mail.desjardins.com"
  ],
  "legitimate_emails": [
    "noreply@desjardins.com",
    "support@desjardins.com"
  ],
  "legitimate_phone_prefixes": [
    "+1-800-",
    "+1-418-",
    "+1-514-"
  ],
  "common_messages": [
    "Vérifier votre compte",
    "Confirmer identité",
    "Mettre à jour coordonnées"
  ],
  "red_flags": {
    "urgency_keywords": ["urgent", "immediate", "action requise"],
    "suspicious_patterns": [
      "Click link to verify",
      "Confirm password",
      "Verify personal info"
    ]
  },
  "ai_prompt": {
    "context": "This is a Desjardins communication",
    "check_for": ["Legitimate domain?", "Legitimate sender?", "Matching patterns?"]
  }
}
```

**Modifications OpenAI Prompt:**

```
Before: Generic scam detection

After:
"Analyze this text, potentially from a Desjardins communication.
Desjardins never asks to click links or confirm passwords via SMS.
Check if this matches Desjardins legitimate patterns..."
```

**Timeline:**
- Semaine 1-2: Recherche 8 institutions
- Semaine 2-3: Data modeling + Database
- Semaine 3-4: AI prompt optimization
- Semaine 4: Testing vs real messages

**Ressources:**
- Data Analyst: 1 FTE
- AI Engineer: 1 FTE
- QA: 0.5 FTE

**Livrables:**
- ✅ Institution database (8 institutions)
- ✅ Enhanced OpenAI prompts
- ✅ Test cases (50+ messages)
- ✅ Accuracy report

---

## ⚖️ 1.2 Conformité Loi 25 (RGPD Québec)

### 1.2.1 Gouvernance des Données

**Objectif:** Respecter les exigences de la Loi 25

**Livrables:**

```
✅ Nommer Responsable Protection Données (DPO)
   ├─ Email: dpo@scamguard.ca
   ├─ Hotline: +1-514-XXX-XXXX
   └─ Rapport au conseil chaque trimestre

✅ Cartographie Données Personnelles
   ├─ Audit: Quelles données collectées?
   ├─ Stockage: Où (DynamoDB, S3, etc.)?
   ├─ Rétention: Combien de temps (30-90 jours)?
   ├─ Accès: Qui y accède (admin, AI, etc.)?
   └─ Risques: Evaluation PIA

✅ Data Inventory Document
   ├─ userId ✓ (PII) → Hashed, encrypted
   ├─ userResponse (Analyse) → Anonymisable
   ├─ riskScore (Metadata) → No PII
   ├─ timestamp (Log) → Retention 30j
   └─ xp_earned (Métier) → No PII

✅ Privacy by Design Review
   ├─ Minimisation: Réduire collecte données
   ├─ Pseudonymization: Hash identifiants
   ├─ Encryption: Data at rest + in transit
   ├─ Access Control: IAM roles restrictifs
   └─ Audit Logs: CloudTrail enabled
```

**Privacy Impact Assessment (PIA):**

```
Risk Level: MEDIUM
├─ Data: userId (identifiant) → Encrypted DynamoDB
├─ Processing: IA analyse (CloudWatch logs)
├─ Risk: Breach → Utilisateurs identifiés
├─ Mitigation: Encryption + Access control
└─ Residual Risk: Low (after mitigation)
```

**Timeline:**
- Semaine 1: Audit données actuelles
- Semaine 2: PIA + Risk assessment
- Semaine 3: Nommer DPO + policy docs
- Semaine 4: Implementation + testing

**Ressources:**
- Legal/Compliance: 1 FTE
- Data Engineer: 0.5 FTE
- DevOps: 0.5 FTE (encryption setup)

---

### 1.2.2 Transparence & Consentement

**Objectif:** Bannières de consentement claires pour aînés

**Livrables:**

```jsx
// Pop-up consentement (à l'accès)
┌─────────────────────────────────────────┐
│         🛡️ VOTRE SÉCURITÉ AVANT TOUT    │
├─────────────────────────────────────────┤
│                                         │
│ Nous utilisons vos réponses pour:       │
│ ✓ Améliorer la détection d'arnaques    │
│ ✓ Vous offrir des conseils personnalisés│
│ ✓ Protéger les aînés québécois         │
│                                         │
│ Vos données restent:                    │
│ ✓ Confidentielles et chiffrées          │
│ ✓ Stockées 30 jours maximum             │
│ ✓ Jamais vendues                        │
│                                         │
│ [✓] Je comprends et j'accepte           │
│                                         │
│ Lire notre politique complète →         │
└─────────────────────────────────────────┘

Features:
- Font: 20px (lisible)
- Couleur: Bleu rassurante
- Checkbox clear + mandatory
- Lien vers politique simple (PDF)
- Accessible: WCAG AAA
- Traduction: FR
```

**Privacy Policy Adapté Aînés:**

```markdown
# Notre Politique de Confidentialité
## (Expliquée simplement)

### Que collectons-nous?
- Vos réponses aux tests
- Pas de noms ou adresses
- Pas d'informations bancaires

### Comment les utilisons-nous?
- Améliorer la détection arnaque
- Vous envoyer alertes
- Rien d'autre

### Combien de temps?
- Conservé 30 jours
- Puis supprimé automatiquement

### Qui y accède?
- Notre IA uniquement
- Pas d'humains (sauf urgence légale)

### Vos droits
- Voir vos données: oui
- Les supprimer: oui
- Les exporter: oui
```

**Timeline:**
- Semaine 1: Draft policy + consent form
- Semaine 2: Legal review
- Semaine 3: UX implementation
- Semaine 4: Testing + deployment

**Ressources:**
- Legal/Compliance: 1 FTE
- UX Designer: 0.5 FTE
- Frontend Dev: 0.5 FTE

**Coût:** Consultation avocat: ~$2000

---

## 📋 Phase 1 - Résumé Exécutif

### Timeline
```
Février
├─ Semaine 1-2: Localisation menaces (SQ/CAFC APIs)
├─ Semaine 3-4: Institutions database
└─ Tests + refinement

Mars
├─ Semaine 1-2: Loi 25 compliance (PIA, DPO)
├─ Semaine 3-4: Consent UI + policy
└─ Launch Phase 1
```

### Livrables Clés
- ✅ SQ/CAFC alerts system
- ✅ 8 institutions database
- ✅ Loi 25 compliance
- ✅ Privacy policy
- ✅ Consent banners

### Budget Phase 1
| Item | Coût |
|------|------|
| Dev resources (3 FTE × 2 mois) | $18,000 |
| AWS/Cloud (alerts, DB) | $100 |
| Legal consultation | $2,000 |
| Testing + QA | Included |
| **Total** | **$20,100** |

### Metrics de Succès Phase 1
- ✅ 95%+ users accept consent
- ✅ SQ alerts accuracy > 90%
- ✅ Institution detection +50% accuracy
- ✅ Zero Loi 25 violations
- ✅ 3+ institutional partnerships signed

---

# 🚀 PHASE 2: Fonctions Avancées & Mode "Ange Gardien"

## Durée
**Avril - Juillet 2026 (4 mois)**

## Objectif Stratégique
Créer un lien de confiance entre aînés et proches

---

## Phase 2.1: Rattrapage (Avril)

### 2.1.1 Simulation SMS Réelles

**Objectif:** Entraînement avec vrais SMS arnaque (anonymisés)

**Livrables:**

```
✅ Base de SMS réels (50+ messages)
   ├─ Source: CAFC, SQ, utilisateurs
   ├─ Anonymisation: Remove phone #
   ├─ Catégories: Banque, Telecom, Gov, E-commerce
   └─ Difficulty: Easy → Hard

✅ SMS Simulator Feature
   ├─ Menu: "Tester avec SMS réels"
   ├─ Random SMS chaque jour
   ├─ Utilisateur répond: "Je clique" ou "Je supprime"
   ├─ Score immédiat
   └─ Feedback spécifique au SMS

✅ SMS Difficulty Levels
   Level 1 (Easy):
   - "Cliquer ici!" (5/10 danger)

   Level 2 (Medium):
   - "Votre compte a été suspendu" (7/10)

   Level 3 (Hard):
   - Très crédible, presque vrai (9/10)

✅ Historical SMS Database
   ├─ Stocké dans DynamoDB
   ├─ Accessible: "SMS du jour" ou "Archives"
   ├─ Analytics: Performance utilisateur
   └─ Feedback: "Pourquoi c'était arnaque?"
```

**Architecture:**

```python
# SMS Simulator Model
{
  "id": "sms-001",
  "original_text": "Cliquez ici pour vérifier votre compte Desjardins",
  "anonymized_text": "Cliquez ici pour vérifier votre compte [BANK]",
  "source": "SQ",  # SQ, CAFC, User
  "category": "banking",  # banking, telecom, gov, ecommerce
  "threat_level": 8,  # 1-10
  "correct_response": "Je supprime",  # "Je clique" ou "Je supprime"
  "red_flags": [
    "Urgency indicator",
    "Click link",
    "Verify account",
    "Unusual sender"
  ],
  "explanation": "Ce message prétend être Desjardins mais les vrais SMS...",
  "created_at": "2026-02-01",
  "usage_count": 145,
  "avg_accuracy": 0.82  # 82% users got it right
}
```

**Timeline:**
- Semaine 1: Collect + anonymize 50 SMS
- Semaine 2: Feature implementation
- Semaine 3: Testing + refinement
- Semaine 4: Launch + monitoring

**Ressources:**
- Backend Dev: 1 FTE
- Frontend Dev: 0.5 FTE
- Data Specialist: 0.5 FTE
- QA: 0.5 FTE

---

### 2.1.2 Quizz Interactifs Thématiques

**Objectif:** Modules d'apprentissage courts récompensés

**Livrables:**

```
✅ 5 Quizz Thématiques (Lancement Phase 2.1)

   1. "Arnaque des Grands-Parents"
      ├─ 5 questions × 2 minutes
      ├─ Scénario: Petit-fils appelle demandant argent
      ├─ Récompense: +25 XP + Badge "Familial"
      └─ % correct: 78% moyenne

   2. "Faux SMS Bancaires"
      ├─ 5 questions × 2 minutes
      ├─ Scénario: Desjardins, National Bank, etc.
      ├─ Récompense: +25 XP + Badge "Bancaire"
      └─ Difficulté: Medium

   3. "Usurpation d'Identité en Ligne"
      ├─ 5 questions × 2 minutes
      ├─ Scénario: Profil Facebook clone
      ├─ Récompense: +25 XP + Badge "Détective"
      └─ Difficulté: Hard

   4. "Arnaque au Paiement Amazon/Apple"
      ├─ 5 questions × 2 minutes
      ├─ Scénario: Email faux paiement rejeté
      ├─ Récompense: +25 XP + Badge "E-Commerce"
      └─ Difficulté: Medium

   5. "Phishing & Faux Liens"
      ├─ 5 questions × 2 minutes
      ├─ Scénario: Identifier URLs suspectes
      ├─ Récompense: +25 XP + Badge "Expert"
      └─ Difficulté: Hard

✅ Quizz Engine
   ├─ Randomize questions
   ├─ Immediate feedback
   ├─ Score calculation
   ├─ Certificate PDF (if 100%)
   └─ Share score (optional)

✅ Progress Tracking
   ├─ Quizz completed: 2/5
   ├─ Total XP: 50
   ├─ Badges earned: Familial
   ├─ Next: Bancaire (70% complete)
   └─ Leaderboard: Optional
```

**Question Example:**

```
📞 Vous recevez un appel d'un jeune homme:
"Grand-maman! C'est ton petit-fils. Je suis en Thaïlande,
mon portefeuille a été volé, j'ai besoin de $2000 vite!"

Que faites-vous?
A) ✓ Vous raccrochez et rappelez un numéro connu de votre petit-fils
B) Vous envoyez l'argent immédiatement
C) Vous envoyer l'argent et lui dites ensuite
D) Vous demandez son mot de passe

Réponse correcte: A
Explication: Arnaque classique. Vrais proches vous rappelleront.
```

**Timeline:**
- Semaine 1: Design 5 quizz
- Semaine 2: Content creation + QA
- Semaine 3: Feature implementation
- Semaine 4: Testing + launch

**Ressources:**
- Content Creator: 1 FTE
- Frontend Dev: 0.5 FTE
- UX Designer: 0.5 FTE

---

### 2.1.3 Alertes SMS Hebdomadaires

**Objectif:** Notifications push pour nouvelles menaces

**Livrables:**

```
✅ Push Notification System
   ├─ Frequency: Every Monday 9 AM
   ├─ Content: "🚨 Nouvelle arnaque cette semaine"
   ├─ Example: "Faux SMS Hydro-Québec détecté"
   ├─ Action: Tap → Detailed info
   └─ Opt-out: Settings available

✅ Email Digest (Optional)
   ├─ Frequency: Weekly Thursday
   ├─ Content: Top 3 threats + tips
   ├─ Format: Simple HTML (20px fonts)
   ├─ Unsubscribe: One-click
   └─ Analytics: Open rate tracking

✅ In-App Notifications
   ├─ Bell icon (badge count)
   ├─ Notification center (swipeable)
   ├─ Mark as read/archive
   ├─ Expiry: 30 days auto-delete
   └─ Categories: Critical, Warning, Info

✅ Smart Alert Targeting
   ├─ If user likes banking: +banking alerts
   ├─ If user likes telecom: +telecom alerts
   ├─ If user active: +frequency
   ├─ If user inactive: -frequency
   └─ Personalization: 80% relevant
```

**Example Alert:**

```
┌─────────────────────────────────────────┐
│ 🚨 Arnaque de la Semaine                │
├─────────────────────────────────────────┤
│                                         │
│ Faux SMS Desjardins détecté              │
│                                         │
│ Message: "Vérifier compte urgent"       │
│                                         │
│ Ce que faire:                           │
│ ✗ Ne JAMAIS cliquer le lien             │
│ ✗ Ne pas donner vos identifiants        │
│ ✓ Appeler Desjardins directement        │
│ ✓ Signaler le SMS à 9999 (Canada)       │
│                                         │
│ [Voir les 10 autres alertes]            │
└─────────────────────────────────────────┘
```

**Timeline:**
- Semaine 1: Setup Firebase Cloud Messaging
- Semaine 2: Notification scheduler
- Semaine 3: Email integration
- Semaine 4: Testing + launch

**Ressources:**
- Backend Dev: 0.5 FTE
- Frontend Dev: 0.5 FTE

---

## Phase 2.2: UX/UI (Mai)

### 2.2.1 Refonte Dashboard Principal

**Objectif:** Tableau de bord intégré (remplace accueil basique)

**Livrables:**

```
✅ Nouvelle Architecture Dashboard
   ┌─────────────────────────────────┐
   │ 🛡️ SCAMGUARD          [⚙️ Param]│
   ├─────────────────────────────────┤
   │                                 │
   │  Votre Score Sécurité: 78/100   │
   │  ████████░░ 78%                │
   │                                 │
   │  🎖️ XP: 240 Points             │
   │  📊 Niveau: 2 (Vigilant)        │
   │  🏆 Badge: Familial (déverrouillé│
   │                                 │
   ├─────────────────────────────────┤
   │  ACTIONS RAPIDES (4 boutons)    │
   │                                 │
   │  [🎯] [📸] [🎓] [🔔]            │
   │  Scénario Analyse Quiz Alertes  │
   │                                 │
   ├─────────────────────────────────┤
   │  CETTE SEMAINE                  │
   │  ✓ 2 scénarios complétés        │
   │  ✓ SMS arnaque détecté (Tue)    │
   │  ✓ Quiz "Grands-parents" (Wed)  │
   │                                 │
   ├─────────────────────────────────┤
   │  ALERTES IMPORTANTES            │
   │  🚨 Desjardins SMS (nouveau)    │
   │  ⚠️ 3 autres alertes            │
   │  [Voir toutes]                  │
   │                                 │
   └─────────────────────────────────┘
```

**Éléments Clés:**

```
Security Score Circle
├─ 0-30: 🔴 À risque (font: "Augmentez vigilance")
├─ 31-60: 🟡 Moyen (font: "Continue l'apprentissage")
├─ 61-100: 🟢 Excellent (font: "Très vigilant!")
└─ Update: After each analysis

Level System
├─ Level 1 (0-99 XP): Novice
├─ Level 2 (100-299 XP): Vigilant
├─ Level 3 (300-499 XP): Expert
├─ Level 4 (500+ XP): Guardian
└─ Unlock: New features per level

Badge System
├─ Familial: Complete "Grands-parents" quiz
├─ Bancaire: Detect 5 banking scams
├─ Detective: Identify 3 phishing attempts
├─ Expert: Reach Level 3
└─ Guardian: Reach Level 4
```

**Navigation Bar (Bottom - Sticky)**

```
┌────────────────────────────────────┐
│ [Vérifier] [Bilan] [Académie] [+] │
│   🎯      📊      🎓        ⚙️    │
└────────────────────────────────────┘

- Vérifier (Analyze): SMS/Messages
- Bilan (Dashboard): Score + Stats
- Académie (Academy): Quizz + Learning
- Paramètres (Settings): Profile + Prefs
```

**Timeline:**
- Semaine 1: Design mockups + prototypes
- Semaine 2: Frontend implementation
- Semaine 3: Backend integration
- Semaine 4: Testing + Polish

**Ressources:**
- UX/UI Designer: 1 FTE
- Frontend Dev: 1 FTE
- Backend Dev: 0.5 FTE

---

### 2.2.2 Profil "Ange Gardien"

**Objectif:** Lier aîné à un proche (family guardian)

**Livrables:**

```
✅ Guardian Link Feature
   ├─ Add Guardian: QR code or email
   ├─ Permissions: View-only by default
   ├─ Guard accepts: Confirmation email
   ├─ Relationship: Stored (parent/child/etc)
   └─ Remove: Easy unlink option

✅ Guardian Permissions
   ├─ View security score ✓
   ├─ View analysis history ✓
   ├─ Receive alerts (high-risk) ✓
   ├─ Edit profile ✗
   ├─ Delete data ✗
   └─ Access messages ✗

✅ Alert Flow for Guardian
   Risk Score > 80?
   └─ Notify Guardian: "Your parent detected high-risk"
      └─ Show message + analysis
      └─ Option: Share feedback
      └─ Elderly gets notified of shared feedback

✅ Feedback System
   Guardian can:
   ├─ "This looks like a scam to me"
   ├─ "Looks legitimate"
   ├─ "I'm not sure, be careful"
   └─ Message: "Show them [link] for help"

   Displayed to Elderly:
   ├─ Guardian opinion visible
   ├─ Non-binding ("For reference")
   ├─ Expert advice also shown
   └─ Elderly makes final call

✅ Privacy Controls
   ├─ What Guardian sees: Score only
   ├─ What Elderly sees: Guardian is linked
   ├─ Who sees messages: No one
   ├─ Encryption: End-to-end
   └─ GDPR: One-click revoke access
```

**UX Screen - Add Guardian:**

```
┌─────────────────────────────────────┐
│ Ajouter un "Ange Gardien"          │
├─────────────────────────────────────┤
│                                     │
│ Un proche de confiance qui peut      │
│ vous aider en cas d'alerte.          │
│                                     │
│ Options:                            │
│ [📱 Par QR Code] (Guardian scan)    │
│ [✉️ Par Email]   (Send invite)      │
│                                     │
│ Gardiens actuels:                   │
│ • Marie (Fille) - Accepté ✓         │
│   [Retirer accès]                   │
│                                     │
│ Demandes en attente:                │
│ • Jean (Fils) - Pending             │
│   [Accepter] [Refuser]              │
│                                     │
└─────────────────────────────────────┘
```

**Timeline:**
- Semaine 1: UX design + flow mapping
- Semaine 2: Frontend + Backend dev
- Semaine 3: Database + Permissions
- Semaine 4: Testing + encryption

**Ressources:**
- Backend Dev: 1 FTE
- Frontend Dev: 0.5 FTE
- Security Engineer: 0.5 FTE

---

### 2.2.3 Haptic Feedback (Vibration)

**Objectif:** Retours tactiles pour validation actions

**Livrables:**

```
✅ Haptic Feedback Points
   ├─ Button press: Short vibration (10ms)
   ├─ Success: Pattern (100ms-50ms)
   ├─ Warning: Double vibration (50ms-50ms)
   ├─ Error: Long vibration (200ms)
   └─ Alert: Custom pattern (pulse 5x)

✅ Implementation
   ├─ API: navigator.vibrate() (Web API)
   ├─ Fallback: Silent for unsupported
   ├─ Setting: Toggleable (Accessibilité)
   ├─ Performance: Non-blocking
   └─ Battery: Minimal impact

✅ Use Cases
   Analysis submitted:
   └─ Button press vibration
   └─ 200ms delay
   └─ Success pattern on result

   Alert received:
   └─ Custom pulse pattern (5x)
   └─ 100ms between pulses
   └─ Attention-grabbing

   Quiz answer correct:
   └─ Happy pattern (short-long-short)

   Quiz answer wrong:
   └─ Sad pattern (long-short-long)
```

**Code Implementation:**

```javascript
// Success pattern
const successPattern = [100, 50];  // vibrate 100ms, wait 50ms
navigator.vibrate(successPattern);

// Warning pattern (double tap)
const warningPattern = [50, 50, 50];  // 50-50-50
navigator.vibrate(warningPattern);

// Custom alert
const alertPattern = [30, 50, 30, 50, 30, 50, 30, 50, 30];
navigator.vibrate(alertPattern);
```

**Timeline:**
- Semaine 1: Design haptic patterns
- Semaine 2: Implementation
- Semaine 3: Testing on devices
- Semaine 4: Launch + monitoring

**Ressources:**
- Frontend Dev: 0.5 FTE
- QA (Device testing): 0.5 FTE

---

## Phase 2.3: Localisation Québécoise (Juin)

### 2.3.1 Intégration Numéros d'Urgence Québécois

**Objectif:** Numéros pertinents post-détection arnaque

**Livrables:**

```
✅ Numéros d'Urgence Post-Analyse

   If High-Risk Detected (score > 75):

   ┌───────────────────────────────────┐
   │ 🚨 ARNAQUE DÉTECTÉE               │
   │                                   │
   │ Score: 85/100 - TRÈS RISQUÉ       │
   │                                   │
   │ Que faire MAINTENANT:             │
   │                                   │
   │ 1️⃣ [📞 CAFC] +1-888-495-8501     │
   │    Centre antifraude Canada       │
   │    (Signaler l'arnaque)           │
   │                                   │
   │ 2️⃣ [📞 SQ] +1-418-228-0771       │
   │    Sûreté du Québec               │
   │    (Déposer plainte)              │
   │                                   │
   │ 3️⃣ [📞 Desjardins] 1-800-522-    │
   │    (Votre banque - si impliquée)  │
   │                                   │
   │ 4️⃣ [👨‍👩‍👧 Ange Gardien] Notifier  │
   │    (Si configuré)                 │
   │                                   │
   │ Ne cliquez PAS le lien suspect    │
   │ Ne donnez PAS vos identifiants    │
   │                                   │
   └───────────────────────────────────┘
```

**Institution-Specific Numbers:**

```python
# Numbers database
EMERGENCY_CONTACTS = {
  "general": {
    "CAFC": {
      "name": "Centre antifraude du Canada",
      "phone": "+1-888-495-8501",
      "hours": "24/7",
      "type": "federal",
      "action": "Report fraud nationally"
    },
    "SQ": {
      "name": "Sûreté du Québec",
      "phone": "+1-418-228-0771",
      "hours": "24/7",
      "type": "provincial",
      "action": "File police complaint"
    }
  },

  "banking": {
    "Desjardins": {
      "fraud_line": "1-800-DESJARDINS (335-2734)",
      "hours": "24/7",
      "action": "Report fraud"
    },
    "NationalBank": {
      "fraud_line": "1-800-387-9449",
      "hours": "24/7",
      "action": "Report suspicious activity"
    },
    "TD": {
      "fraud_line": "1-800-983-2121",
      "hours": "24/7"
    },
    "RBC": {
      "fraud_line": "1-800-769-2511",
      "hours": "24/7"
    }
  },

  "telecom": {
    "Bell": {
      "fraud_line": "1-800-563-2355",
      "hours": "24/7"
    },
    "Videotron": {
      "fraud_line": "1-888-926-8338",
      "hours": "24/7"
    },
    "Telus": {
      "fraud_line": "1-866-558-3835",
      "hours": "24/7"
    }
  },

  "government": {
    "RevenueQuebec": {
      "fraud_line": "1-418-654-2000",
      "hours": "8:30-16:30 (Mon-Fri)",
      "action": "Report CRA impersonation"
    },
    "SAAQ": {
      "fraud_line": "1-800-361-7222",
      "hours": "24/7",
      "action": "Report driver license fraud"
    },
    "HydroQuebec": {
      "fraud_line": "1-888-385-3792",
      "hours": "24/7"
    }
  }
}
```

**Smart Contact Selection:**

```python
def get_emergency_contacts(analysis_result):
    """Select relevant contacts based on threat type"""

    contacts = [CAFC, SQ]  # Always include federal + provincial

    if "Desjardins" in analysis_result.text:
        contacts.append(BANKING["Desjardins"])
    elif "NationalBank" in analysis_result.text:
        contacts.append(BANKING["NationalBank"])
    elif "TD" in analysis_result.text:
        contacts.append(BANKING["TD"])

    if "Bell" in analysis_result.text:
        contacts.append(TELECOM["Bell"])
    elif "Videotron" in analysis_result.text:
        contacts.append(TELECOM["Videotron"])

    if "RevenuQuebec" in analysis_result.text:
        contacts.append(GOVERNMENT["RevenueQuebec"])

    return contacts[:5]  # Max 5 contacts
```

**UX Features:**

```
✅ One-Tap Calling
   ├─ Click number → Initiates call
   ├─ Pre-filled message (optional)
   └─ Confirmation before dial

✅ SMS Reporting
   ├─ "Report via text" option
   ├─ Pre-filled template SMS
   ├─ Send to CAFC (9999)
   └─ Confirmation of sent

✅ Save for Future
   ├─ Add contact to phone
   ├─ "My Trusted Contacts" list
   ├─ Quick access (Settings)
   └─ Updated quarterly

✅ Accessibility
   ├─ Font: 22px (large)
   ├─ Color: Blue (trusted)
   ├─ Buttons: 60px touch target
   ├─ TTS: Read numbers aloud
   └─ Mobile-optimized
```

**Timeline:**
- Semaine 1: Collect/verify all phone numbers
- Semaine 2: UX design + implementation
- Semaine 3: Integration + testing
- Semaine 4: Launch + verification

**Ressources:**
- Frontend Dev: 0.5 FTE
- QA: 0.5 FTE
- Data Specialist: 0.25 FTE

**Cost:** Phone number research + verification: 20 hours

---

## Phase 2 Avancée: Mode "Ange Gardien" Complet (Juillet)

### 2.A.1 Réseau de Confiance (Tandem)

**Objectif:** Écosystème aîné ↔ proche sécurisé

**Livrables:**

```
✅ Guardian Dashboard (For Guardian)
   ┌─────────────────────────────────┐
   │ Vos Personnes Protégées         │
   ├─────────────────────────────────┤
   │                                 │
   │ 👵 Maman (77)                   │
   │ Security Score: 82/100 ✓ Good   │
   │ Last activity: Today 2:30 PM    │
   │                                 │
   │ Recent alerts:                  │
   │ ✓ Desjardins SMS (Detected)     │
   │   Your opinion: "Looks legit"   │
   │ (Mom's doing well!)             │
   │                                 │
   │ 👴 Papa (81)                    │
   │ Security Score: 45/100 ⚠️ Risky  │
   │ Last activity: 3 days ago       │
   │                                 │
   │ Recent alerts:                  │
   │ ⚠️ Amazon Email (High risk)     │
   │   Your opinion needed!          │
   │ [Review]                        │
   │                                 │
   └─────────────────────────────────┘

✅ Elderly View (Knowing Guardian)
   ┌─────────────────────────────────┐
   │ Ange Gardien                    │
   ├─────────────────────────────────┤
   │ Marie (Fille)                   │
   │ Statut: Connecté ✓              │
   │                                 │
   │ Quand j'ai besoin d'aide:       │
   │ [📲 Envoyer alerte à Marie]     │
   │                                 │
   │ Messages de Marie (3):          │
   │ "Maman, sois prudente..."       │
   │ "Papa t'aime, on regarde..."    │
   │                                 │
   │ [Voir tous les messages]        │
   │                                 │
   └─────────────────────────────────┘
```

**Tandem Features:**

```
✅ Real-time Alerts
   Elderly detects risk (score > 75)
   └─ Notifies Guardian (push + email)
   └─ Guardian receives: Message + Context
   └─ Guardian can: View, Advise, Call

✅ One-Click Help
   Elderly confused? [SOS Ange Gardien]
   └─ Notifies all Guardians immediately
   └─ Guardians see request
   └─ Can call/message back
   └─ Creates "Help Session" log

✅ Collaborative Analysis
   Elderly unsure? [Get second opinion]
   └─ Sends analysis to Guardian
   └─ Guardian reviews (1-hour response SLA)
   └─ Returns opinion: "Safe/Risky"
   └─ Elderly makes informed decision
   └─ Decision logged

✅ Weekly Family Report
   Every Sunday 9 AM:
   └─ Send to all Guardians
   └─ Summary: Activities, Scores, Tips
   └─ Trends: Improving or Declining?
   └─ Recommendations: "Suggest quiz X"
```

**Trust & Privacy Model:**

```
Elderly Controls:
├─ Who can be guardian? ✓ Approve each
├─ What can they see? ✓ Choose (score only)
├─ Can they read messages? ✗ No (encrypted)
├─ Can they delete data? ✗ No (elderly owns it)
├─ Can they log in? ✗ No (read-only view)
└─ Can remove at any time? ✓ One-click

Guardian Can:
├─ See security score ✓
├─ See analysis history (30-day) ✓
├─ Receive critical alerts ✓
├─ Send supportive messages ✓
├─ View aggregated stats ✓
├─ Request collaborative analysis ✓
└─ See raw messages? ✗ NO
```

**Timeline:**
- Week 1: Architecture + data modeling
- Week 2: Guardian dashboard
- Week 3: Notification system
- Week 4: Testing + launch

**Resources:**
- Backend Dev: 1.5 FTE
- Frontend Dev: 1 FTE
- Security Eng: 0.5 FTE

---

### 2.A.2 Académie de Formation

**Objectif:** Hub d'apprentissage interactif

**Livrables:**

```
✅ Académie Hub
   ┌─────────────────────────────────┐
   │ 🎓 ACADÉMIE SCAMGUARD           │
   ├─────────────────────────────────┤
   │ Niveau: 2 (Vigilant)            │
   │ Progrès: 240/500 XP             │
   │                                 │
   │ MODULES DISPONIBLES:            │
   │                                 │
   │ 1️⃣ Arnaque Grands-Parents      │
   │   ✓ Complété 1/1 (25 XP)        │
   │   🏆 Badge "Familial"           │
   │                                 │
   │ 2️⃣ SMS Bancaires Fake          │
   │   ⏳ En cours (15/25 XP)         │
   │   Progrès: [███░░░░░░] 60%      │
   │                                 │
   │ 3️⃣ Phishing & Faux Liens       │
   │   🔒 Verrouillé (Unlock Level 3)│
   │                                 │
   │ 4️⃣ Usurpation Identité         │
   │   🔒 Verrouillé                 │
   │                                 │
   │ 5️⃣ Arnaque Paiement E-Com      │
   │   🔒 Verrouillé                 │
   │                                 │
   │ [Leaderboard] [Certifiés] [+]   │
   │                                 │
   └─────────────────────────────────┘

✅ Module Content
   Each module includes:
   ├─ 5 Quiz questions (2 min)
   ├─ 3 Real-world examples
   ├─ Action checklist
   ├─ Printable certificate
   ├─ Badge reward
   └─ XP progression

✅ Leaderboard (Optional)
   ├─ Global: Top 100 learners
   ├─ Regional: QC only
   ├─ Friend: If enabled
   ├─ Privacy: Pseudonymous (No names)
   └─ Refresh: Weekly
```

**Module Example: "Arnaque Grands-Parents"**

```
SECTION 1: Learn (3 min)
└─ Scenario: "Appel du petit-fils en détresse"
└─ What to recognize: Emotional manipulation
└─ Red flags: Urgency, Secrecy, Money request
└─ What to do: Verify through known number

SECTION 2: Test (5 min - Quiz)
└─ 5 questions (multiple choice)
└─ Immediate feedback
└─ Links to learn more

SECTION 3: Practice (Real-world)
└─ "Receive" 3 fake calls (text transcripts)
└─ Rate: Real or Fake?
└─ Score: Instant feedback

SECTION 4: Celebrate
└─ "Module Complete! 🎉"
└─ Badge: "Familial Guardian"
└─ XP: +25 points
└─ Share: (Optional)
```

**Timeline:**
- Week 1: Module architecture
- Week 2-3: Content creation (5 modules)
- Week 4: Testing + QA
- Week 5: Launch

**Resources:**
- Content Creator: 1 FTE
- Frontend Dev: 0.5 FTE
- QA: 0.5 FTE

---

## 📋 Phase 2 - Résumé Exécutif

### Timeline Complète Phase 2
```
Avril (2.1)
├─ SMS Simulator with 50+ real messages
├─ 5 Thematic quizzes
└─ Weekly alert system

Mai (2.2)
├─ Dashboard refonte (Score, XP, Badges)
├─ Guardian profile link feature
└─ Haptic feedback integration

Juin (2.3)
└─ Emergency numbers integration
   ├─ 30+ institutional numbers
   ├─ Smart number selection
   └─ One-tap calling

Juillet (2.A)
├─ Guardian tandem system
├─ Learning academy (5+ modules)
└─ Collaborative analysis feature
```

### Livrables Clés Phase 2
- ✅ SMS Simulator (50+ messages)
- ✅ 5 Interactive quizzes
- ✅ Weekly alert system
- ✅ Redesigned dashboard
- ✅ Guardian feature (family link)
- ✅ Haptic feedback
- ✅ 30+ emergency numbers (QC)
- ✅ Guardian tandem (2-way notifications)
- ✅ Learning academy (5+ modules)

### Budget Phase 2
| Item | Cost |
|------|------|
| Dev Team (10 FTE × 4 months) | $72,000 |
| Content Creation (SMS, Quiz) | $5,000 |
| Design/UX | $8,000 |
| Testing & QA | $4,000 |
| Cloud costs (+alerts, messaging) | $200 |
| **Total Phase 2** | **$89,200** |

### Success Metrics Phase 2
- ✅ 80%+ users complete 1st module
- ✅ Guardian adoption: 40%+ users
- ✅ Average session time: +300% (from Phase 1)
- ✅ User retention (30-day): 60%+
- ✅ SMS simulator accuracy: 90%+

---

# 🎨 PHASE 3: UX/UI & Accessibilité 2.0

## Durée
**Août - Septembre 2026 (2 mois)**

## Objectif Stratégique
Simplifier radicalement l'interface (Senior-First Design)

---

## 3.1 Refonte Interface Design Senior-First

### 3.1.1 "Cœur de Sécurité" Dashboard

**Concept:** Score de sécurité global rassurant (0-100)

```
┌─────────────────────────────────────┐
│           ❤️ CŒUR SÉCURITÉ          │
├─────────────────────────────────────┤
│                                     │
│           🟢 78/100                  │
│          TRÈS SÛRS                  │
│                                     │
│  Vous êtes bien protégé! ✨         │
│                                     │
│  Cette semaine:                     │
│  ✓ 3 arnaques détectées et arrêtées│
│  ✓ 2 quizz réussis                  │
│  ✓ Ange gardien vous surveille      │
│                                     │
│            [CONTINUER]              │
│                                     │
└─────────────────────────────────────┘
```

**Score Evolution:**
- Day 1: 50/100 (Nouveau)
- Week 1: 65/100 (+15 via quizz)
- Week 2: 78/100 (+13 via vigilance)
- Trend: Graph showing improvement

**Emotional Design:**
- 🟢 Green = Safe, Confident
- Encouraging messages
- Celebration of successes
- No shame/guilt for failures

### 3.1.2 Navigation Simplifiée (4 Icônes)

```
┌────────────────────────────────────┐
│                                    │
│  [Main Content Area]              │
│                                    │
│                                    │
│                                    │
├────────────────────────────────────┤
│ [🔍]      [❤️]      [🎓]      [⚙️]  │
│Vérifier Sécurité Académie Paramètres│
└────────────────────────────────────┘

Navigation Rules:
├─ Always sticky at bottom
├─ Each tab full-screen (no dual pane)
├─ Icon + label (both visible)
├─ Active tab: Highlight (blue + underline)
├─ Swipeable (left-right)
└─ Touch target: 60px min
```

**Tab 1: Vérifier (🔍)**
- Analyze SMS/Messages
- Upload photo
- Quick scan
- Results

**Tab 2: Sécurité (❤️)**
- Score display
- Weekly stats
- Guardian status
- Activity log

**Tab 3: Académie (🎓)**
- Quiz modules
- Learning progress
- Certificates
- Leaderboard

**Tab 4: Paramètres (⚙️)**
- Profile
- Guardian settings
- Notifications
- Accessibility
- Logout

### 3.1.3 Color & Typography Standard

```
WCAG AAA Compliance:

Colors:
├─ Primary: #0056B3 (Dark blue) - Contrast 8.5:1
├─ Success: #2E7D32 (Dark green)
├─ Warning: #D32F2F (Red)
├─ Background: #F9F9F9 (Off-white)
└─ Text: #1A1A1A (Nearly black)

Typography:
├─ Headings (h1): 32px Segoe UI bold
├─ Headings (h2): 26px Segoe UI bold
├─ Body: 20px Segoe UI regular
├─ Labels: 18px Segoe UI semi-bold
├─ Small text: 16px (MINIMUM)
└─ Line-height: 1.5 (readable)

Icon Style:
├─ Size: 48px minimum
├─ Outline: 2px stroke
├─ Color: Primary or success
└─ No thin lines (readability)

Spacing:
├─ Padding: 20px standard
├─ Gap: 16px between elements
├─ Margin: 24px between sections
└─ Touch target: 60px × 60px minimum
```

### 3.1.4 Animations & Transitions

```
Principles:
├─ Slow: 300ms+ (not jumpy)
├─ Gentle: Ease-in-out
├─ Purposeful: Meaningful motion
└─ Accessible: Can disable (Settings)

Examples:
├─ Page transition: 300ms slide-left
├─ Button tap: 100ms scale (0.95x)
├─ Success: 500ms fade-in + celebration
├─ Error: 400ms shake + vibration
└─ Loading: Smooth spinner (circular)
```

**Timeline:**
- Week 1: Design system finalization
- Week 2: Mockups & prototypes
- Week 3: Frontend implementation
- Week 4: Testing + refinement

**Resources:**
- UX/UI Designer: 1 FTE
- Frontend Dev: 1 FTE
- QA: 0.5 FTE

---

## 3.2 Accessibilité Avancée (WCAG AAA Complet)

### 3.2.1 Audit & Certifications

**Livrables:**

```
✅ WCAG 2.1 Level AAA Certification
   ├─ Contrast: 7:1 minimum (AAA)
   ├─ Text sizing: 18px+ (no magnification needed)
   ├─ Focus visible: All interactive elements
   ├─ Keyboard nav: Full support (no mouse needed)
   ├─ Screen reader: 100% compatible
   ├─ Color contrast: All text + icons
   └─ Testing: axe DevTools, WAVE, Lighthouse

✅ Accessibility Features Audit
   ├─ Keyboard navigation: Full
   ├─ Voice control: Tested (iOS/Android)
   ├─ Magnification: 200% zoom tested
   ├─ High contrast mode: Supported
   ├─ Dyslexic font: Available (Comic Sans alt)
   ├─ Motion reduction: All animations disableable
   └─ Screen reader: VoiceOver/TalkBack

✅ Accessibility Statement
   ├─ Public commitment page
   ├─ Features list
   ├─ Contact for issues
   ├─ Legal compliance statements
   ├─ Feedback form (accessible)
   └─ Certification badge
```

**Testing Checklist:**

```
Manual Testing:
☑ Keyboard-only navigation (Tab, Enter, Escape)
☑ Screen reader testing (NVDA, JAWS, VoiceOver)
☑ Color contrast (all text vs background)
☑ Zoom testing (200%, 300%)
☑ Mobile device testing (iPhone, Android)
☑ Voice control testing (Siri, Google Assistant)
☑ Touch target sizes (60px minimum)

Automated Testing:
☑ axe DevTools (continuous)
☑ WAVE accessibility checker
☑ Lighthouse audit (PageSpeed Insights)
☑ WebAIM contrast analyzer
☑ HTML validation (W3C)

Device Testing:
☑ iPhone XS (modern iOS)
☑ iPhone SE (small screen)
☑ Samsung Galaxy S10 (Android)
☑ iPad (tablet)
☑ macOS (Safari)
☑ Windows (Edge, Chrome)
```

### 3.2.2 Voice Assistance Native Complète

**Livrables:**

```
✅ TTS for All Content
   ├─ Headings: Auto-announced
   ├─ Form labels: Read aloud
   ├─ Button text: Announced with context
   ├─ Results: Full narration
   ├─ Alerts: Immediate voice notification
   └─ Error messages: Priority announcement

✅ Speech Recognition Enhancement
   ├─ French: Native
   ├─ English: Added (Phase 3)
   ├─ Offline fallback: Keyboard input
   ├─ Retry logic: Auto-suggest alternatives
   ├─ Confidence scoring: Show when uncertain
   └─ Edit transcript: Allow corrections

✅ Deaf/Hard of Hearing Support
   ├─ Captions: All voice content
   ├─ Visual indicators: For all audio
   ├─ Haptic feedback: Vibration alerts
   ├─ Flash notifications: For critical alerts
   └─ Text-only mode: Available

✅ Dyslexia Support
   ├─ Font: OpenDyslexic (optional)
   ├─ Spacing: Increased line/letter spacing
   ├─ Alignment: Left-aligned (not justified)
   ├─ Color: Dark text on light background
   ├─ Font size: 20px minimum
   └─ Sans-serif: No serifs (cleaner)
```

**Settings Accessibility Menu:**

```
┌─────────────────────────────────────┐
│ ♿ Accessibilité                     │
├─────────────────────────────────────┤
│                                     │
│ VISION                              │
│ ☑ High Contrast Mode                │
│ [Taille Texte]      [Larger ↑]      │
│ ☑ Dark Mode                         │
│ [Coleur Fond]     [Choisir]         │
│                                     │
│ HEARING                             │
│ ☑ Captions for all audio            │
│ ☑ Visual alerts (flash)             │
│ [Volume]          [Louder ↑]        │
│                                     │
│ MOTOR                               │
│ ☑ Large touch targets (60px)        │
│ ☑ Reduce animations                 │
│ [Hold time for tap]  [2.0s]         │
│                                     │
│ COGNITIVE                           │
│ ☑ Simpler layout (fewer options)    │
│ ☑ Confirmation before submit        │
│ [Font]         [OpenDyslexic]       │
│                                     │
│ VOICE                               │
│ ☑ Text-to-Speech enabled            │
│ ☑ Speech Recognition enabled        │
│ [Voice]    [Female / Male]          │
│ [Speed]    [0.9x (normal)]          │
│                                     │
│ MISC                                │
│ ☑ Haptic feedback                   │
│ ☑ Reduce vibration                  │
│ [Reset to defaults]                 │
│                                     │
└─────────────────────────────────────┘
```

**Timeline:**
- Week 1: Audit + testing
- Week 2: Fixes implementation
- Week 3: Certification prep
- Week 4: Certification + launch

**Resources:**
- Accessibility Specialist: 1 FTE
- QA/Testing: 1 FTE
- Frontend Dev: 0.5 FTE

---

## 📋 Phase 3 - Résumé Exécutif

### Timeline
```
Août
├─ Week 1-2: Design senior-first dashboard
├─ Week 2-3: Implement simplified navigation
└─ Week 4: Polish + testing

Septembre
├─ Week 1: Accessibility audit
├─ Week 2-3: WCAG AAA implementation
├─ Week 4: Certification + launch
└─ Launch Phase 3
```

### Livrables Clés
- ✅ "Cœur Sécurité" dashboard
- ✅ 4-icon simplified navigation
- ✅ WCAG AAA certification
- ✅ Complete voice assistance
- ✅ Dyslexia + deaf support
- ✅ Accessibility statement

### Budget Phase 3
| Item | Cost |
|------|------|
| Design & UX | $12,000 |
| Frontend Dev (2 FTE × 2mo) | $16,000 |
| Accessibility Specialist | $10,000 |
| Testing & Certification | $5,000 |
| Cloud costs | $100 |
| **Total Phase 3** | **$43,100** |

### Success Metrics Phase 3
- ✅ WCAG AAA certification obtained
- ✅ 95%+ color contrast ratio
- ✅ 100% keyboard navigable
- ✅ Screen reader: 100% compatible
- ✅ Accessibility complaints: <1%

---

# 🤖 PHASE 4: Vision IA & Intelligence Prédictive

## Durée
**Octobre 2026 + (Long-term)**

## Objectif Stratégique
Passer de détection texte à protection proactive globale

---

## 4.1 Analyse de Documents Papier (Vision IA)

### 4.1.1 Scannage de Courrier Physique

**Objectif:** Analyser photos de lettres/fausses factures reçues

**Livrables:**

```
✅ Vision IA Integration
   ├─ Model: GPT-4V (or similar)
   ├─ Input: Photo of physical mail
   ├─ Processing: Extract text + detect anomalies
   ├─ Output: Scam score + red flags
   └─ Cost: $0.03 per analysis (estimate)

✅ Document Upload Feature
   ┌─────────────────────────────────┐
   │ 📬 Analyser Courrier Papier     │
   ├─────────────────────────────────┤
   │                                 │
   │ Vous avez reçu une lettre       │
   │ suspecte par la poste?          │
   │                                 │
   │ [📷 Prendre une photo]          │
   │ ou                              │
   │ [📤 Envoyer depuis Photos]      │
   │                                 │
   │ Nous analyserons:               │
   │ ✓ Logo & branding               │
   │ ✓ Adresse de retour             │
   │ ✓ Numéro de téléphone           │
   │ ✓ Demandes d'argent             │
   │ ✓ Urgency language              │
   │                                 │
   │ [Voir exemples]                 │
   │                                 │
   └─────────────────────────────────┘

✅ Analysis Features
   ├─ Logo verification: Real or fake?
   ├─ Typography: Professional or sloppy?
   ├─ Grammar: Errors detected?
   ├─ Color: Matching official colors?
   ├─ Contact info: Can be verified?
   ├─ Urgency: Suspicious timeline?
   └─ Overall: Legitimate or Scam?

✅ Results Page
   ┌─────────────────────────────────┐
   │ 📄 Analyse Lettre               │
   ├─────────────────────────────────┤
   │                                 │
   │ 🔴 TRÈS SUSPICIEUX (88/100)    │
   │                                 │
   │ Indicateurs de Fraude:          │
   │ ⚠️ Logo faible qualité          │
   │ ⚠️ Adresse retour inconnue      │
   │ ⚠️ Urgency (payer dans 48h)    │
   │ ⚠️ Fautes d'orthographe         │
   │ ⚠️ Numéro de téléphone local   │
   │                                 │
   │ Recommandations:                │
   │ ✓ Ne pas répondre au numéro    │
   │ ✓ Appeler l'institution         │
   │   directement                   │
   │ ✓ Garder la lettre (preuve)    │
   │ ✓ Signaler à CAFC               │
   │                                 │
   │ [Signaler] [Garder] [Détail]   │
   │                                 │
   └─────────────────────────────────┘
```

**Real Examples to Analyze:**

```
1. Fake Hydro-Québec bill
   ├─ Missing security features
   ├─ Unusual font
   └─ Urgent payment demand

2. Fake CRA/Revenu Québec letter
   ├─ Threat of legal action
   ├─ Vague account reference
   └─ Request for gift cards

3. Fake credit card approval
   ├─ No official letterhead
   ├─ Typos in bank name
   └─ "Click link to activate"

4. Fake lottery win
   ├─ No official regulations
   ├─ "Claim your prize now"
   └─ Wire transfer requested
```

**Technical Implementation:**

```python
# Vision AI API call
import base64
from openai import OpenAI

def analyze_mail_photo(image_path):
    # Encode image to base64
    with open(image_path, "rb") as image_file:
        encoded_image = base64.b64encode(image_file.read()).decode()

    # Send to GPT-4V
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4-vision",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Analyze this mail/letter for fraud indicators.
                        Check for:
                        1. Logo quality and authenticity
                        2. Typography and font consistency
                        3. Spelling/grammar errors
                        4. Company contact information
                        5. Urgency language or threats
                        6. Unusual requests (money, passwords, etc)

                        Respond in JSON:
                        {
                            "risk_score": 0-100,
                            "is_scam": true/false,
                            "red_flags": ["flag1", "flag2"],
                            "explanation": "Why this is/isn't a scam"
                        }"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encoded_image}"
                        }
                    }
                ]
            }
        ]
    )

    return json.loads(response.choices[0].message.content)
```

**Timeline:**
- Week 1-2: GPT-4V integration
- Week 2-3: Feature implementation
- Week 3-4: Testing + validation
- Week 5: Launch (soft)

**Resources:**
- Backend Dev: 1 FTE
- Frontend Dev: 0.5 FTE
- QA: 0.5 FTE

**Costs:**
- API: $0.03 per image (scalable)
- Development: ~$8,000

---

## 4.2 Assistant d'Appel en Temps Réel (Future)

### 4.2.1 Analyseur de Discours (Proof of Concept)

**Objectif:** Identifier mots-clés manipulation lors appel téléphonique

**Concept:**

```
User activates:
[🎙️ Monitorer appel]
     │
     ├─ Puts caller on speaker
     ├─ Records audio (local only)
     ├─ AI listens for keywords
     │
     └─ Real-time indicators:
        ├─ 🔴 "Urgent" detected
        ├─ 🟡 "Money" mentioned
        ├─ 🟡 "Account suspended"
        ├─ 🔴 "Don't tell anyone"
        │
        └─ Alert: "This is suspicious!"
           [Hang up] [Continue]
```

**Keyword Detection Model:**

```python
MANIPULATION_KEYWORDS = {
    "urgency": [
        "urgent", "immediately", "right now",
        "tout de suite", "maintenant", "immédiatement"
    ],
    "authority": [
        "police", "government", "CRA", "revenu",
        "arrest", "legal action", "court"
    ],
    "secrecy": [
        "don't tell anyone", "keep secret",
        "ne dis à personne", "secret"
    ],
    "money": [
        "payment", "wire", "gift card", "bitcoin",
        "argent", "paiement", "virement"
    ],
    "account": [
        "account suspended", "locked", "compromised",
        "compte fermé", "compromis", "verrouillé"
    ],
    "verification": [
        "verify password", "confirm card",
        "update information",
        "vérifier mot de passe", "confirmer"
    ]
}

def detect_manipulation(audio_text):
    """Detect manipulation keywords in conversation"""
    detected = {
        "urgency": False,
        "authority": False,
        "secrecy": False,
        "money": False,
        "account": False,
        "verification": False,
        "risk_score": 0
    }

    text_lower = audio_text.lower()

    for category, keywords in MANIPULATION_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                detected[category] = True
                detected["risk_score"] += 20

    # Scoring
    if detected["risk_score"] > 60:
        detected["alert"] = "SUSPICIOUS CALL"
        detected["recommendation"] = "Hang up immediately"

    return detected
```

**Prototype Features:**

```
Phase 4 Prototype (Oct 2026):
├─ Audio transcription (real-time)
├─ Keyword detection (basic)
├─ Visual alerts (icon + color)
├─ Recording (optional, encrypted)
├─ Immediate feedback
└─ Post-call analysis

Phase 5+ (Future):
├─ Speaker identification (who's calling?)
├─ Tone analysis (stress, excitement)
├─ Emotional manipulation detection
├─ Caller ID spoofing detection
├─ Integration with call-screening APIs
└─ Legal recording (jurisdiction-aware)
```

**Privacy & Legal Considerations:**

```
🔒 Privacy First:
├─ Audio recorded LOCAL ONLY (device storage)
├─ No upload to cloud (by default)
├─ User consent required
├─ Can delete recording anytime
├─ No third-party sharing
└─ GDPR/PIPEDA compliant

⚖️ Legal Requirements:
├─ Quebec: One-party consent (user aware)
├─ Canada: Generally legal with awareness
├─ Warning: "This call is being monitored"
├─ Recording indicator: Always visible
└─ Legal disclaimer: In Settings

🎯 Use Cases:
✓ Personal protection (detect scam)
✗ Illegal recording (surveillance)
✗ Non-consensual recording
✗ Sharing without permission
```

**Timeline (Future):**
- Phase 4 (Oct 2026): Prototype
- Phase 5 (Jan 2027): Beta testing
- Phase 6 (Apr 2027): Full launch

**Resources Needed:**
- Audio Engineer: 1 FTE
- Security/Privacy Expert: 1 FTE
- Legal Compliance: 0.5 FTE

**Estimated Cost:** $25,000+ (complex)

---

## 📋 Phase 4 - Résumé Exécutif

### Timeline
```
Phase 4.1: Vision IA (Oct-Nov 2026)
├─ Weeks 1-2: GPT-4V integration
├─ Weeks 2-3: Document analysis
└─ Week 4: Launch

Phase 4.2: Call Assistant (Jan 2027+)
├─ Research & prototyping
├─ User testing
├─ Legal compliance review
└─ Soft launch (beta)
```

### Livrables Clés Phase 4
- ✅ Mail photo analyzer (Vision AI)
- ✅ Fraud detection for documents
- ✅ Call monitoring prototype (future)
- ✅ Audio transcription engine (future)
- ✅ Keyword detection system (future)

### Budget Phase 4
| Item | Cost |
|------|------|
| Vision IA integration | $10,000 |
| Document analysis feature | $8,000 |
| Testing + QA | $4,000 |
| Call monitoring R&D | $15,000 |
| Cloud/API costs | $500+ |
| **Total Phase 4** | **$37,500+** |

### Success Metrics Phase 4
- ✅ Document detection accuracy: 85%+
- ✅ Mail analysis per day: 1000+
- ✅ User satisfaction: 4.5/5 stars
- ✅ Call monitoring adoption: 10%+ (Phase 5)

---

# 📊 Résumé Complet Roadmap

## Timeline Consolidé

```
PHASE 1: Consolidation & Ancrage Québécois
Feb-Mar 2026 (8 weeks)
├─ SQ/CAFC alerts integration
├─ 8 Institutions database
├─ Loi 25 compliance
└─ Privacy policy + consent

PHASE 2: Fonctions Avancées & Ange Gardien
Apr-Jul 2026 (16 weeks)
├─ 2.1: SMS simulator + Quizzes + Alerts (Apr)
├─ 2.2: Dashboard + Guardian + Haptic (May)
├─ 2.3: Emergency numbers QC (Jun)
└─ 2.A: Tandem + Academy (Jul)

PHASE 3: UX/UI & Accessibilité 2.0
Aug-Sep 2026 (8 weeks)
├─ Senior-first dashboard
├─ Simplified 4-icon navigation
├─ WCAG AAA certification
└─ Voice assistance complete

PHASE 4: Vision IA & Intelligence Prédictive
Oct 2026+ (ongoing)
├─ Mail photo analyzer (Vision AI)
├─ Call monitoring assistant (R&D)
└─ Predictive threat detection
```

## Budget Total Roadmap

```
Phase 1:  $20,100
Phase 2:  $89,200
Phase 3:  $43,100
Phase 4:  $37,500+
─────────────────
TOTAL:   $189,900+

(18 months, 12-15 FTE average)
```

## Key Success Factors

```
✅ Keep focus on Quebec reality
✅ Iterate based on user feedback
✅ Maintain accessibility standards
✅ Build trust with families
✅ Create habit-forming features
✅ Monitor fraud trends closely
✅ Partner with local institutions
✅ Document compliance rigorously
```

## Dependencies & Risks

```
RISKS:
├─ API changes (SQ, CAFC)
├─ User adoption challenges
├─ LLM accuracy variations
├─ Privacy regulation changes
└─ Competitive pressure

DEPENDENCIES:
├─ SQ/CAFC partnership
├─ OpenAI/Gemini API stability
├─ AWS infrastructure
├─ Cognito availability
└─ Legal expertise

MITIGATIONS:
├─ Multi-LLM strategy
├─ Fallback systems
├─ Regular audits
├─ Community feedback loops
└─ Flexible architecture
```

---

## 🎯 Conclusion

**ScamGuard Roadmap 2026-2027** outlines a comprehensive evolution from MVP to comprehensive elder protection platform:

- **Phase 1**: Establish Quebec roots & compliance
- **Phase 2**: Build family ecosystem & learning
- **Phase 3**: Perfect accessibility & UX
- **Phase 4**: Add advanced AI capabilities

**Expected Outcomes:**
- 10,000+ active users (end 2026)
- 40%+ guardian adoption
- 50,000+ analyses completed
- +$100K in potential revenue (partnerships)
- National recognition as Quebec's scam protection leader

**Vision:** Make ScamGuard **indispensable** for Quebec seniors and their families.

---

**Document Created:** February 17, 2026
**Roadmap Version:** 1.0
**Next Review:** April 1, 2026 (Phase 1 evaluation)
