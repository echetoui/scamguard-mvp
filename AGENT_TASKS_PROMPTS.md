# ScamGuard - User Stories & Prompts pour Agents IA

**Document:** Task structure pour Claude & Gemini agents
**Date:** 17 février 2026
**Structure:** 18+ blocs de tâches (Phases 1-4)

---

## 📋 Fonctionnement

Chaque tâche inclut:
- **User Story ID:** Unique identifier
- **Priorité:** P0 (critique) → P3 (nice-to-have)
- **Dépendances:** Tâches prerequis
- **Prompt Spécifique:** Pour Claude/Gemini
- **Context Files:** À fournir à l'agent
- **Livrable:** Fichier/code output attendu
- **Estimation:** Heures estimées

---

# 🏗️ BLOC 1: Infrastructure & Conformité (Phase 1)

## Tâche 1.1: DynamoDB TTL & Anonymisation

**User Story ID:** `INFRA-001`
**Priorité:** P0 (Critical)
**Dépendances:** Aucune
**Timeline:** Week 1

### Context Files à Fournir

```
1. backend/lambda/handler_llm.py (actuel)
2. PROJECT_STATUS.md (architecture existing)
3. ROADMAP_COMPLETE.md (phase 1 spec)
```

### Prompt pour Claude Sonnet

```
Tu es un expert AWS DynamoDB et sécurité des données.

CONTEXTE:
ScamGuard est une app de prévention d'arnaque pour aînés québécois.
Stack existant: DynamoDB + Lambda + CloudFront
Conformité requise: Loi 25 (RGPD québécois)

TÂCHE:
Modifie le schéma DynamoDB et la fonction Lambda pour:

1. RÉTENTION (TTL - Time To Live)
   ├─ Ajoute un champ 'expirationTime' (TimeToLive)
   ├─ TTL = 30 jours après création
   ├─ Les anciens records s'auto-supprimnt
   └─ Code Python avec boto3 pour configurer TTL

2. ANONYMISATION (SHA-256 + Salt)
   ├─ Crée utilitaire: hash_user_id(userId, salt)
   ├─ Stocke hash au lieu de userId brut
   ├─ Garde salt dans AWS Secrets Manager
   ├─ Impossible de tracer l'utilisateur après 30 jours
   └─ Conforme Loi 25 (pseudonymization)

3. MIGRATION
   ├─ Script pour migrer anciens records
   ├─ Tester sur DynamoDB local d'abord
   └─ Plan rollback si problème

FICHIERS À GÉNÉRER:
├─ backend/lambda/utils/anonymization.py (new)
│  └─ Fonction: hash_user_id(), verify_hash()
├─ backend/lambda/handler_llm.py (modified)
│  └─ Appel à anonymization avant save DynamoDB
├─ backend/lambda/migration_script.py (new)
│  └─ Migrate existing data
└─ backend/lambda/tests/test_anonymization.py
   └─ Unit tests

FORMAT RETOUR DynamoDB:
{
  "hashedUserId": "sha256_hash_here",
  "timestamp": "2026-02-17T10:30:00Z",
  "expirationTime": 1709251800,  # Unix timestamp (30j later)
  "analysis": {
    "risk_score": 75,
    "is_scam": true,
    "explanation": "..."
  }
}

VALIDATION:
- Hash est déterministe (same input = same hash)
- Salt is secure (from Secrets Manager)
- TTL fonctionne dans DynamoDB
- Tests couvrent tous les cas
```

### Context Prompt pour Gemini (Validation)

```
Tu es un expert en sécurité des données.

VALIDÉ LE CODE SUIVANT pour:
- Pas de fuite de userId brut
- Salt management sécurisé
- Pas de régression de performance
- Compatibilité Loi 25

Utilise ce checklist:
☑ userId jamais stocké en clair
☑ Salt ne dépasse pas 1000 requests/jour API
☑ TTL configué correctement
☑ Migration non-destructive
☑ Tests couvrent 95%+ du code
```

### Livrable Attendu

```
✅ anonymization.py (150 lignes)
✅ handler_llm.py modifié (avec appels anon)
✅ migration_script.py (100 lignes)
✅ test_anonymization.py (150 lignes)
✅ README: "How to deploy TTL"
```

### Estimation
- Claude: 1.5 heures
- Gemini validation: 0.5 heures
- Votre review: 1 heure
- **Total API cost:** ~$0.15

---

## Tâche 1.2: Bannière de Consentement Accessible

**User Story ID:** `UI-001`
**Priorité:** P0 (Critical)
**Dépendances:** Aucune
**Timeline:** Week 1-2

### Context Files à Fournir

```
1. frontend/src/App.jsx (structure existing)
2. frontend/src/App.css (styles existing)
3. FEATURES_REPORT.md (accessibility standards)
4. WCAG_AAA_REQUIREMENTS.txt (contrast ratios, font sizes)
```

### Prompt pour Claude Haiku

```
Tu es un expert React et accessibilité WCAG AAA.

CONTEXTE:
- App pour aînés québécois
- Loi 25 exige consentement explicite
- Standards WCAG AAA (contraste 7:1 minimum, 20px+ font)

TÂCHE:
Crée composant ConsentBanner.jsx qui:

1. AFFICHAGE
   ├─ Modal centered (max 600px width)
   ├─ Fond: #F9F9F9 (light), texte: #1A1A1A (dark)
   ├─ Font-size: 20px (lisible aînés)
   ├─ Line-height: 1.5 (aéré)
   └─ Padding: 20px (spacing)

2. CONTENU
   ├─ Titre: "🛡️ Votre Sécurité Avant Tout"
   ├─ Paragraphes expliquant:
   │  ├─ "Nous utilisons vos réponses pour améliorer"
   │  ├─ "Vos données sont chiffrées"
   │  ├─ "Conservées 30 jours max"
   │  └─ "Jamais vendues"
   ├─ Lien "Lire notre politique complète"
   └─ Checkbox: "Je comprends et j'accepte"

3. COMPORTEMENT
   ├─ Afficher au 1er accès (localStorage check)
   ├─ Bloquer TOUT accès avant consentement
   ├─ Bouton "Accepter" disabled tant que checkbox pas coché
   ├─ localStorage.setItem('userConsent', 'true')
   ├─ Puis rediriger vers app
   └─ Ne jamais re-afficher si déjà accepté

4. ACCESSIBILITÉ (WCAG AAA)
   ├─ ARIA labels sur tous les controls
   ├─ Focus visible (yellow outline)
   ├─ Keyboard navigation (Tab, Enter)
   ├─ Contraste: 7:1+ pour tous textes
   ├─ Screen reader friendly
   └─ Pas de colors seules (utiliser + patterns)

5. STYLE CSS
   ├─ Responsive (mobile 100%)
   ├─ No animations (sauf fade-in lent)
   ├─ High contrast mode compatible
   └─ Dark mode aware

FICHIERS À GÉNÉRER:
├─ frontend/src/components/ConsentBanner.jsx (150 lignes)
│  └─ React component with hooks
├─ frontend/src/components/ConsentBanner.css (80 lignes)
│  └─ Accessible styles
├─ frontend/src/utils/consentManager.js (50 lignes)
│  └─ localStorage utilities
└─ frontend/src/components/__tests__/ConsentBanner.test.js
   └─ Unit tests

EXEMPLE RENDU:
┌─────────────────────────────────────┐
│         🛡️ VOTRE SÉCURITÉ           │
├─────────────────────────────────────┤
│                                     │
│ Nous utilisons vos réponses pour:   │
│ ✓ Améliorer la détection            │
│ ✓ Vous offrir des conseils          │
│ ✓ Protéger les aînés québécois      │
│                                     │
│ Vos données:                        │
│ ✓ Confidentielles et chiffrées      │
│ ✓ Conservées 30 jours max           │
│ ✓ Jamais vendues                    │
│                                     │
│ ☐ Je comprends et j'accepte         │
│                                     │
│ [Politique complète →]              │
│                                     │
│ [Accepter]  (button)                │
│                                     │
└─────────────────────────────────────┘

CONTRASTE VALIDATION:
- Texte noir #1A1A1A sur blanc #F9F9F9 = ratio 8.3:1 ✓
- Tous les textes ≥ 20px ✓
- Pas de texte clignote ✓
```

### Context Prompt pour Gemini Flash (Testing)

```
Test cette bannière de consentement:

1. Visuellement:
   ☑ Font size ≥ 20px visible
   ☑ Contraste 7:1+ mesuré
   ☑ Pas de texte clignote
   ☑ Responsive sur mobile 320px

2. Fonctionnellement:
   ☑ Bloque app avant consentement
   ☑ Accepter requiert checkbox coché
   ☑ localStorage fonctionne
   ☑ Ne réapparait pas après accept

3. Accessibilité:
   ☑ Tab navigation works
   ☑ Screen reader announces tous elements
   ☑ High contrast mode compatible
   ☑ No color-only indicators
```

### Livrable Attendu

```
✅ ConsentBanner.jsx (150 lignes)
✅ ConsentBanner.css (80 lignes)
✅ consentManager.js (50 lignes)
✅ test file (150 lignes)
✅ README: "How to use ConsentBanner"
```

### Estimation
- Claude Haiku: 1 heure
- Gemini validation: 0.5 heures
- Votre review: 1 heure
- **Total API cost:** ~$0.08

---

# 🛡️ BLOC 2: Intelligence Locale & Alertes (Phases 1 & 2)

## Tâche 2.1: System Prompt - Expert Cybersécurité Québec

**User Story ID:** `AI-001`
**Priorité:** P0 (Critical)
**Dépendances:** Aucune
**Timeline:** Week 2

### Context Files à Fournir

```
1. backend/lambda/handler_llm.py (existing)
2. FEATURES_REPORT.md (scam patterns)
3. Institutions_Database.json (Desjardins, Hydro-QC, SAAQ, Revenu-Québec patterns)
```

### Prompt pour Claude Sonnet

```
Tu es un expert en cybersécurité et arnaque spécialisé au Québec.

TÂCHE:
Réécris le system_prompt utilisé dans handler_llm.py pour:

1. EXPERTISE QUÉBÉCOISE
   L'IA doit être consciente de:
   ├─ Institutions québécoises (Desjardins, Hydro-Québec, SAAQ, Revenu Québec)
   ├─ Tactiques de fraude locales (faux SMS bancaires, usurpation CRA)
   ├─ Langue française (terms like "urgent", "vérifier compte", "action requise")
   ├─ Contexte culturel (arnaque des grands-parents vs. américains)
   └─ Numéros d'urgence pertinents (CAFC, SQ, CAFC)

2. ANALYSE ENRICHIE
   Pour chaque analyse, retourner JSON avec:
   {
     "risk_score": 0-100,
     "is_scam": true/false,
     "explanation": "Pourquoi c'est arnaque",
     "institution": "Desjardins",  # Si détecté
     "fraud_type": "banking_phishing",  # Type spécifique
     "red_flags": [
       "SMS from unknown #",
       "Urgency language",
       "Request for credentials"
     ],
     "local_remediation": {
       "contact": "CAFC (Centre Antifraude du Canada)",
       "phone": "+1-888-495-8501",
       "action": "Signaler la fraude"
     },
     "confidence": 0.92  # 92% certain
   }

3. PROMPT STRUCTURE
   ├─ System role: "Tu es un expert en cybersécurité au Québec"
   ├─ Examples: 3-5 examples de vraies arnaques québécoises
   ├─ Instructions: Checklist des red flags spécifiques QC
   ├─ Language: French-first (mais bilingual OK)
   └─ Context: Utilisateurs sont aînés vulnérables

4. RED FLAGS QUÉBÉCOIS
   À chercher spécifiquement:
   ├─ Déjardins fake SMS (les vrais SMS ne demandent jamais click)
   ├─ Hydro-Québec urgent payment (très courant)
   ├─ Revenu Québec/CRA threats (legal action scare)
   ├─ SAAQ license suspension (emotional trigger)
   ├─ Bell/Videotron account urgency
   ├─ Non-local #s prétendant être QC
   └─ Broken French (signe d'arnaque)

5. EXAMPLES DANS PROMPT
   Inclure 3 examples réels:

   Example 1:
   User: "Cliquez ici pour vérifier votre compte Desjardins"
   Expected output:
   - risk_score: 95
   - is_scam: true
   - red_flags: ["Click link request", "Account verification", "Urgency"]
   - institution: "Desjardins"
   - remediation: Contact Desjardins directly at 1-800-522-XXX

   Example 2:
   User: "Votre compte Revenu Québec est suspendu..."
   Expected output:
   - risk_score: 90
   - is_scam: true
   - fraud_type: "government_impersonation"
   - remediation: Contact CRA at 1-800-959-5525 (legit #)

NOUVEAU CODE handler_llm.py:
def get_quebec_expert_prompt():
    return """
Tu es un expert en cybersécurité spécialisé dans la détection d'arnaque au Québec.
Tu protèges les personnes âgées de 65+ ans contre les fraudes.

CONTEXTE QUÉBÉCOIS:
- Institutions principales: Desjardins, Hydro-Québec, Revenu Québec, SAAQ, Bell/Videotron
- Populations vulnérables: Aînés, immigrants, personnes isolées
- Tactiques courantes: SMS faux bancaires, usurpation CRA, menaces légales, scare tactics

RED FLAGS SPÉCIFIQUES À DÉTECTER:
1. Demandes de cliquer liens (jamais fait par vrais institutions)
2. Demandes de confirmer mots de passe (impossible)
3. Urgence factice (24h-48h deadlines)
4. Menaces légales non crédibles
5. Demandes d'argent par méthodes inhabituelles (gift cards, crypto)
6. Français cassé ou anglais dans contexte français
7. Numéros de téléphone suspects

ANALYSE REQUISE:
Pour chaque texte analysé:
1. Identifier l'institution prétendante
2. Vérifier si c'est une institution réelle au Québec
3. Chercher les red flags listés
4. Évaluer probabilité arnaque (0-100)
5. Si arnaque probable, fournir contact d'urgence local

FORMAT RETOUR (JSON STRICT):
{
    "risk_score": <0-100>,
    "is_scam": <true/false>,
    "explanation": "<Explication en français>",
    "institution": "<Desjardins|Hydro-QC|Revenu-Quebec|SAAQ|Bell|Videotron|Unknown>",
    "fraud_type": "<banking_phishing|government_impersonation|urgency_scam|other>",
    "red_flags": [<list de flags détectés>],
    "local_remediation": {
        "contact": "<Organisation d'urgence>",
        "phone": "<Numéro à appeler>",
        "action": "<Quoi faire>"
    },
    "confidence": <0.0-1.0>,
    "advice_for_elder": "<Conseil simple pour aîné>"
}

Exemples réels:

[EXAMPLE 1]
Text: "Bonjour, votre compte Desjardins a été suspendu. Cliquez ici pour vérifier: bit.ly/...
Analysis:
- risk_score: 95
- is_scam: true
- red_flags: ["Click link request", "Account suspension threat", "Shortened URL"]
- institution: "Desjardins"
- remediation: {"contact": "Desjardins", "phone": "1-800-522-2346"}

[EXAMPLE 2]
Text: "CRA - Revenu Québec alerte! Fraude détectée. Appelez immédiatement: 418-555-1234"
Analysis:
- risk_score: 88
- is_scam: true
- fraud_type: "government_impersonation"
- red_flags: ["False urgency", "Phone number not official", "Threat language"]
- remediation: {"contact": "Revenu Québec officiel", "phone": "1-800-959-5525"}
```

### Livrable Attendu

```
✅ New system prompt (500 lignes)
✅ Updated handler_llm.py with new prompt
✅ Examples JSON (3+ real Quebec scams)
✅ Testing script validating Quebec-specific detection
✅ README: "Quebec Expert Mode Setup"
```

### Estimation
- Claude: 1.5 heures
- Gemini validation: 0.5 heures
- **Total API cost:** ~$0.12

---

## Tâche 2.2: Backend - SQ/CAFC Alerts Integration

**User Story ID:** `ALERTS-001`
**Priorité:** P0 (Critical)
**Dépendances:** Tâche 2.1 (utilise institution database)
**Timeline:** Week 2-3

### Context Files à Fournir

```
1. backend/lambda/handler_llm.py (existing)
2. Institutions_Database.json (2.1 output)
3. PROJECT_STATUS.md (DynamoDB structure)
```

### Prompt pour Claude Sonnet

```
Tu es un expert en intégration d'API et backend Python.

TÂCHE:
Crée un service Python de polling pour alertes SQ/CAFC

1. ARCHITECTURE
   ├─ Source 1: Centre Antifraude du Canada (CAFC)
   │  ├─ Endpoint: https://cafc.gc.ca/api/latest-alerts (example)
   │  ├─ Frequency: Every 4 hours
   │  └─ Format: JSON array of threat objects
   ├─ Source 2: Sûreté du Québec (SQ)
   │  ├─ Endpoint: https://sq.gouv.qc.ca/alertes (example)
   │  ├─ Frequency: Every 4 hours
   │  └─ Format: RSS feed or JSON
   └─ Local Storage: DynamoDB table 'Alerts_QC'

2. DATABASE SCHEMA (DynamoDB)
   Table: Alerts_QC
   ├─ Primary Key: alert_id (String)
   ├─ Sort Key: date_detected (String, ISO 8601)
   ├─ Attributes:
   │  ├─ threat_level: "high|medium|low"
   │  ├─ institution: "Desjardins|Hydro-QC|..." (or "Unknown")
   │  ├─ fraud_type: "phishing|sms_banking|gov_impersonation|..."
   │  ├─ keywords: ["cliquer", "urgent", "compte"]
   │  ├─ description_fr: "Texte alert en français"
   │  ├─ regions_affected: ["Montreal", "Quebec", "Gatineau"]
   │  ├─ source: "SQ|CAFC"
   │  ├─ expiration_time: <Unix timestamp, 30j>
   │  └─ ttl: <Unix timestamp for auto-delete>

3. POLLING SERVICE (Python)
   ├─ Lambda function: alerts_poller_lambda.py
   ├─ Trigger: EventBridge (CloudWatch Events) every 4h
   ├─ Flow:
   │  ├─ 1. Fetch latest from CAFC API
   │  ├─ 2. Parse JSON/RSS
   │  ├─ 3. Check if alert_id already in DynamoDB
   │  ├─ 4. If new: Store to DynamoDB
   │  ├─ 5. If new + threat_level=high: Send FCM notification
   │  ├─ 6. Log processing
   │  └─ 7. Return summary {"new_alerts": 5, "processed": true}

4. FCM NOTIFICATION
   ├─ When: New alert with threat_level="high"
   ├─ Target: All users (broadcast)
   ├─ Payload:
   │  {
   │    "notification": {
   │      "title": "🚨 Nouvelle arnaque détectée",
   │      "body": "Faux SMS [Institution] circulant au Québec"
   │    },
   │    "data": {
   │      "alert_id": "SQ-2026-001",
   │      "threat_level": "high",
   │      "action": "OPEN_ALERT_DETAILS"
   │    }
   │  }

5. ERROR HANDLING
   ├─ If CAFC API down: Log error, retry next cycle
   ├─ If SQ down: Continue with CAFC, log
   ├─ If FCM fails: Store notification job in queue for retry
   ├─ DynamoDB throttling: Use exponential backoff

6. TESTING
   ├─ Mock CAFC/SQ responses (sample JSONs)
   ├─ Test DynamoDB writes
   ├─ Test FCM notifications
   ├─ Test duplicate detection (same alert_id)

FICHIERS À GÉNÉRER:
├─ backend/lambda/services/alerts_poller.py (250 lignes)
│  └─ Main polling service
├─ backend/lambda/handlers/alerts_poller_handler.py (100 lignes)
│  └─ AWS Lambda entry point
├─ backend/lambda/utils/fcm_notifier.py (100 lignes)
│  └─ Firebase Cloud Messaging integration
├─ backend/lambda/tests/test_alerts_poller.py (200 lignes)
│  └─ Unit tests with mocks
├─ backend/config/alerts_schedule.yaml (20 lignes)
│  └─ EventBridge/CloudWatch rule (every 4h)
└─ backend/scripts/alerts_poller_setup.sh
   └─ Deploy script (create Lambda, IAM roles, etc)

EXEMPLE CAFC RESPONSE (Mock):
{
  "alerts": [
    {
      "id": "CAFC-2026-001",
      "date": "2026-02-17T10:30:00Z",
      "type": "SMS_PHISHING",
      "threat_level": "high",
      "institution": "Desjardins",
      "message_sample": "Cliquez ici pour vérifier votre compte",
      "region_codes": ["QC"],
      "description": "Faux SMS bancaire circulant au Québec..."
    }
  ]
}
```

### Livrable Attendu

```
✅ alerts_poller.py (250 lignes)
✅ alerts_poller_handler.py (100 lignes)
✅ fcm_notifier.py (100 lignes)
✅ test_alerts_poller.py (200 lignes)
✅ alerts_schedule.yaml (EventBridge config)
✅ Deployment script + README
```

### Estimation
- Claude: 2 heures
- Gemini validation: 0.5 heures
- Your review: 1.5 heures
- **Total API cost:** ~$0.18

---

# 👨‍👩‍👧 BLOC 3: Système "Ange Gardien" (Phase 2)

## Tâche 3.1: Backend - Guardian Link System

**User Story ID:** `GUARDIAN-001`
**Priorité:** P1 (High)
**Dépendances:** Tâches 1.1 (anonymization)
**Timeline:** Week 5-6

### Context Files à Fournir

```
1. PROJECT_STATUS.md (DynamoDB existing)
2. ROADMAP_COMPLETE.md (Phase 2.A spec)
3. backend/lambda/handler_llm.py (existing)
```

### Prompt pour Claude Sonnet

```
Tu es expert en backend sécurisé et gestion des permissions.

TÂCHE:
Implémente système de liaison "Ange Gardien" (Guardian Link)

1. SYSTÈME D'INVITATION
   ├─ Aîné génère code unique (6 chiffres ou QR code)
   ├─ Proche (Ange Gardien) utilise code pour se lier
   ├─ Relation confirmée = guardian a accès read-only

2. TABLES DYNAMODB

   Table 1: User_Guardian (Relations)
   ├─ Primary Key: relation_id (UUID)
   ├─ Attributes:
   │  ├─ elderly_user_hashed_id: <sha256 hashed>
   │  ├─ guardian_user_hashed_id: <sha256 hashed>
   │  ├─ relationship_type: "child|parent|sibling|friend|professional"
   │  ├─ status: "pending|active|revoked"
   │  ├─ invited_at: <timestamp>
   │  ├─ confirmed_at: <timestamp>
   │  ├─ permissions: ["view_score", "view_history", "send_message"]
   │  ├─ created_by: "elderly|guardian"
   │  └─ ttl: <Unix timestamp for auto-expire unconfirmed after 7 days>

   Table 2: Guardian_Invitations (Codes temporaires)
   ├─ Primary Key: invitation_code (6-digit string)
   ├─ Attributes:
   │  ├─ invited_by_hashed_id: <elderly hash>
   │  ├─ created_at: <timestamp>
   │  ├─ expires_at: <timestamp + 48 hours>
   │  ├─ used_by_hashed_id: <null until used>
   │  ├─ used_at: <null until used>
   │  └─ ttl: <Unix timestamp auto-delete after 48h>

3. API ENDPOINTS

   Endpoint 1: POST /guardian/generate-invitation
   Request:
   {
     "elderly_id": "<hashed user id>",
     "invitation_type": "qr_code|numeric_code",
     "expires_in_hours": 48
   }
   Response:
   {
     "invitation_code": "123456",
     "qr_code_data": "QR_BASE64_STRING",
     "expires_at": "2026-02-19T10:30:00Z",
     "share_message": "Partagez ce code à votre proche: 123456"
   }

   Endpoint 2: POST /guardian/link-with-code
   Request:
   {
     "guardian_id": "<hashed user id>",
     "invitation_code": "123456",
     "relationship": "child"
   }
   Response:
   {
     "relation_id": "uuid-here",
     "status": "active|pending_confirmation",
     "message": "Liaisonstab réussie!"
   }

   Endpoint 3: GET /guardian/my-charges
   Request: Guardian queries their elderly
   Response:
   [
     {
       "relation_id": "uuid",
       "elderly_name_hashed": "xxx",
       "status": "active",
       "latest_score": 82,
       "last_activity": "2026-02-17T10:30:00Z"
     }
   ]

   Endpoint 4: DELETE /guardian/relation/{relation_id}
   Guardian can revoke access anytime
   Response: {"status": "revoked"}

4. SÉCURITÉ
   ├─ Invitation code: 6 digits = 1M combinations (brute force resistant)
   ├─ Rate limit: Max 3 attempts per minute per IP
   ├─ Expiry: 48 hours max
   ├─ Permissions: Guardian sees score ONLY (not raw messages)
   ├─ Encryption: All data at rest + in transit
   └─ Audit log: All links/revokes logged

5. PERMISSIONS MODEL
   Guardian CAN see:
   ├─ Security score (0-100)
   ├─ Analysis history (last 30 analyses, no message content)
   ├─ When person took action (timestamps)
   └─ Aggregate stats (% correct answers)

   Guardian CANNOT see:
   ├─ Raw user messages analyzed
   ├─ Personal data (phone, email, etc)
   ├─ Exact IP or device location
   └─ Edit or delete anything

FICHIERS À GÉNÉRER:
├─ backend/lambda/handlers/guardian_handler.py (300 lignes)
│  └─ All guardian endpoints
├─ backend/lambda/services/guardian_service.py (200 lignes)
│  └─ Business logic
├─ backend/lambda/utils/invitation_generator.py (80 lignes)
│  └─ Code + QR generation
├─ backend/lambda/models/guardian_models.py (100 lignes)
│  └─ Data models
├─ backend/lambda/tests/test_guardian.py (300 lignes)
│  └─ Complete test coverage
└─ backend/scripts/guardian_setup.sh
   └─ DynamoDB table creation
```

### Livrable Attendu

```
✅ guardian_handler.py (300 lignes)
✅ guardian_service.py (200 lignes)
✅ invitation_generator.py (80 lignes)
✅ guardian_models.py (100 lignes)
✅ test_guardian.py (300 lignes)
✅ Setup script + README
```

### Estimation
- Claude: 2.5 heures
- Gemini validation: 0.75 heures
- **Total API cost:** ~$0.22

---

## Tâche 3.2: Notifications - Guardian Alert Trigger

**User Story ID:** `NOTIFICATIONS-001`
**Priorité:** P1 (High)
**Dépendances:** Tâche 3.1 (Guardian system), Tâche 2.2 (FCM setup)
**Timeline:** Week 6-7

### Context Files à Fournir

```
1. backend/lambda/handlers/guardian_handler.py (3.1 output)
2. backend/lambda/utils/fcm_notifier.py (2.2 output)
3. ROADMAP_COMPLETE.md (Phase 2.A notification spec)
```

### Prompt pour Claude Sonnet

```
Tu es expert en AWS DynamoDB streams et event-driven architecture.

TÂCHE:
Crée trigger automatique qui envoie notification au Guardian
quand risk_score > 75 est détecté

1. ARCHITECTURE
   ├─ DynamoDB Stream sur table 'analyses'
   ├─ Lambda function: analysis_trigger_handler
   ├─ Check: risk_score > 75?
   ├─ If yes: Query User_Guardian table
   ├─ If guardian found: Send FCM notification
   └─ Log all actions

2. DYNAMODB STREAMS SETUP
   ├─ Enable DynamoDB Streams on 'analyses' table
   ├─ Stream specification: NEW_AND_OLD_IMAGES
   ├─ Lambda trigger: On INSERT and MODIFY
   └─ Batch size: 100 records, timeout 60s

3. NOTIFICATION FLOW

   DynamoDB Stream Event:
   {
     "Records": [
       {
         "dynamodb": {
           "NewImage": {
             "hashedUserId": {"S": "xxx"},
             "timestamp": {"S": "2026-02-17T10:30:00Z"},
             "analysis": {
               "M": {
                 "risk_score": {"N": "85"},
                 "is_scam": {"BOOL": true},
                 "explanation": {"S": "..."}
               }
             }
           }
         }
       }
     ]
   }

   Lambda Processing:
   1. Extract hashedUserId, risk_score, explanation
   2. Check: risk_score >= 75?
   3. If yes: Query User_Guardian for this elderly
   4. For each guardian found:
      ├─ Fetch guardian_device_tokens from database
      ├─ Build FCM payload
      ├─ Send notification
      ├─ Store notification record (for audit)
      └─ Log success/failure
   5. Return {"processed": N, "notifications_sent": M}

4. FCM PAYLOAD (à Guardian)
   {
     "notification": {
       "title": "⚠️ Alerte Sécurité",
       "body": "Un message à haut risque détecté pour [Elderly Name]"
     },
     "data": {
       "alert_type": "high_risk_analysis",
       "risk_score": "85",
       "explanation": "Message seems like bank phishing...",
       "elderly_id_hashed": "xxx",
       "timestamp": "2026-02-17T10:30:00Z",
       "action_url": "scamguard://analysis/uuid"
     }
   }

5. DATABASE CHANGES

   Table: Notifications_Sent
   ├─ Primary Key: notification_id (UUID)
   ├─ Attributes:
   │  ├─ from_hashed_id: <elderly hash>
   │  ├─ to_hashed_id: <guardian hash>
   │  ├─ analysis_id: <analysis UUID>
   │  ├─ risk_score: 85
   │  ├─ sent_at: <timestamp>
   │  ├─ delivered_at: <null until FCM confirms>
   │  ├─ status: "sent|delivered|failed"
   │  └─ ttl: <30 days>

6. ERROR HANDLING
   ├─ If guardian not found: No notification (OK)
   ├─ If FCM fails: Retry with exponential backoff
   ├─ If DynamoDB query fails: Log error, continue
   ├─ Idempotency: Track notification_id to avoid duplicates
   └─ Throttling: Max 1000 notifications/minute

7. TESTING
   ├─ Mock DynamoDB Stream events
   ├─ Test risk_score >= 75 detection
   ├─ Test guardian lookup (found/not found)
   ├─ Test FCM payload format
   ├─ Test error scenarios

FICHIERS À GÉNÉRER:
├─ backend/lambda/handlers/analysis_trigger_handler.py (200 lignes)
│  └─ DynamoDB Stream processor
├─ backend/lambda/services/notification_service.py (150 lignes)
│  └─ Notification business logic
├─ backend/lambda/tests/test_notification_trigger.py (200 lignes)
│  └─ Mock Stream events + test cases
├─ backend/config/dynamodb_stream_setup.yaml
│  └─ IaC for DynamoDB Stream
└─ backend/scripts/trigger_setup.sh
   └─ Deploy trigger script
```

### Livrable Attendu

```
✅ analysis_trigger_handler.py (200 lignes)
✅ notification_service.py (150 lignes)
✅ test_notification_trigger.py (200 lignes)
✅ DynamoDB Stream config
✅ Deployment script + README
```

### Estimation
- Claude: 2 heures
- Gemini validation: 0.5 heures
- **Total API cost:** ~$0.18

---

# 🎨 BLOC 4: UI/UX Senior-First (Phase 3)

## Tâche 4.1: Dashboard "Cœur de Sécurité"

**User Story ID:** `UI-002`
**Priorité:** P1 (High)
**Dépendances:** Tâche 1.2 (consent), Tâche 3.1 (guardian system)
**Timeline:** Week 9-10

### Context Files à Fournir

```
1. frontend/src/App.jsx (existing structure)
2. frontend/src/App.css (existing styles)
3. FEATURES_REPORT.md (dashboard spec)
4. WCAG_AAA_CHECKLIST.txt (accessibility)
```

### Prompt pour Claude Haiku

```
Tu es expert React et design accessible pour aînés.

TÂCHE:
Refactorise App.jsx pour afficher "Cœur de Sécurité" dashboard

1. ARCHITECTURE
   ├─ Compose new App.jsx structure:
   │  ├─ <ConsentBanner /> (1.2 component)
   │  ├─ <Header />
   │  ├─ <NavigationBar /> (4 icons bottom)
   │  ├─ <SecurityHeartDashboard /> (NEW)
   │  ├─ <GuardianStatus /> (if linked)
   │  ├─ <WeeklyStats />
   │  └─ <AlertsList />
   └─ Views mapped to bottom nav icons

2. SECURITY HEART DASHBOARD
   ┌─────────────────────────────┐
   │  🛡️ SCAMGUARD              │
   ├─────────────────────────────┤
   │                             │
   │        ❤️ 78/100            │
   │      TRÈS SÛRS             │
   │                             │
   │  Vous êtes bien protégé! ✨ │
   │                             │
   │  Cette semaine:             │
   │  ✓ 3 arnaques détectées    │
   │  ✓ 2 quizz réussis         │
   │  ✓ Ange gardien surveille   │
   │                             │
   │    [CONTINUER →]           │
   │                             │
   └─────────────────────────────┘

3. COULEURS DYNAMIQUES
   ├─ Score 70-100: 🟢 Green (#2E7D32)
   ├─ Score 50-69: 🟡 Yellow (#FFA500)
   ├─ Score 0-49: 🔴 Red (#D32F2F)
   └─ Heart emoji color changes with score

4. COMPOSANT SecurityHeartDashboard.jsx
   ├─ Props:
   │  ├─ score: number (0-100)
   │  ├─ weekStats: object
   │  ├─ hasGuardian: boolean
   │  └─ onContinue: function
   │
   ├─ State:
   │  ├─ displayScore: starts at 0, animates to actual score
   │  ├─ weeklyAnalyses: count
   │  ├─ quizzesCompleted: count
   │  └─ guardianActive: boolean
   │
   ├─ Features:
   │  ├─ Animate heart size based on score
   │  ├─ Pulse animation (gentle)
   │  ├─ Show weekly summary
   │  ├─ Indicate guardian status
   │  └─ Large "Continue" button (60px)

5. NAVIGATION BAR (Bottom, Sticky)
   ┌───────────────────────────────┐
   │ [🔍] [❤️] [🎓] [⚙️]           │
   │Véri Sécur Acad  Param         │
   └───────────────────────────────┘

   ├─ Always visible at bottom
   ├─ 4 large icons (48px min)
   ├─ Active tab highlighted (blue)
   ├─ Swipe to navigate (optional)
   └─ Tap icon changes view

6. ACCESSIBILITY (WCAG AAA)
   ├─ Font: 20px+ everywhere
   ├─ Contrast: 7:1+ (heart emoji might need border)
   ├─ Touch targets: 60px all buttons
   ├─ ARIA labels: "<button aria-label='Continue'>"
   ├─ Screen reader: Reads score as "78 sur 100, Très sûrs"
   ├─ Focus visible: Yellow outline all interactive elements
   ├─ Animations: Can be reduced via prefers-reduced-motion
   └─ Color not only indicator (use icon + text)

7. STYLING
   ├─ Heart SVG or emoji: 120px × 120px
   ├─ Color: Dynamic based on score
   ├─ Pulse animation: 2s cycle, ease-in-out
   ├─ Responsive: 100% width on mobile
   ├─ Padding: 20px min, 40px on tablet/desktop
   ├─ Typography: Bold for numbers, regular for labels
   └─ No clutter (minimal UI)

FICHIERS À GÉNÉRER:
├─ frontend/src/components/SecurityHeartDashboard.jsx (250 lignes)
│  └─ Main heart component
├─ frontend/src/components/NavigationBar.jsx (150 lignes)
│  └─ Bottom 4-icon nav
├─ frontend/src/components/SecurityHeartDashboard.css (100 lignes)
│  └─ Heart styling + animations
├─ frontend/src/components/NavigationBar.css (80 lignes)
│  └─ Nav styling
├─ frontend/src/App.jsx (refactored, 200 lignes)
│  └─ New structure with heart
├─ frontend/src/pages/DashboardPage.jsx (100 lignes)
│  └─ New dashboard page view
└─ frontend/src/tests/SecurityHeartDashboard.test.js
   └─ Component tests
```

### Livrable Attendu

```
✅ SecurityHeartDashboard.jsx (250 lignes)
✅ NavigationBar.jsx (150 lignes)
✅ Refactored App.jsx (200 lignes)
✅ DashboardPage.jsx (100 lignes)
✅ CSS files (180 lignes total)
✅ Tests (150 lignes)
✅ README: "Heart Dashboard Documentation"
```

### Estimation
- Claude Haiku: 1.5 heures
- Gemini review: 0.5 heures
- Your review: 1.5 heures
- **Total API cost:** ~$0.12

---

# 📊 Tableau Récapitulatif des Tâches

## Phase 1: Infrastructure & Conformité (Weeks 1-4)

| User Story | Task | Agent | Heures API | Cost |
|---|---|---|---|---|
| INFRA-001 | DynamoDB TTL & Anon | Claude + Gemini | 2h | $0.15 |
| UI-001 | Consent Banner | Haiku + Gemini | 1.5h | $0.08 |
| AI-001 | Quebec Expert Prompt | Claude | 1.5h | $0.12 |
| ALERTS-001 | SQ/CAFC Integration | Claude | 2.5h | $0.18 |
| **TOTAL PHASE 1** | | | **7.5h** | **$0.53** |

---

## Phase 2: Ange Gardien & Tandem (Weeks 5-12)

| User Story | Task | Agent | Heures API | Cost |
|---|---|---|---|---|
| GUARDIAN-001 | Guardian Link | Claude + Gemini | 3h | $0.22 |
| NOTIFICATIONS-001 | Alert Trigger | Claude + Gemini | 2.5h | $0.18 |
| SMS-001 (next) | SMS Simulator | Haiku | 1.5h | $0.09 |
| QUIZ-001 (next) | Quizzes | Haiku | 1.5h | $0.09 |
| ACADEMY-001 (next) | Learning Academy | Claude | 2h | $0.15 |
| **TOTAL PHASE 2** | | | **10.5h** | **$0.73** |

---

## Phase 3: WCAG AAA & Senior-First (Weeks 13-16)

| User Story | Task | Agent | Heures API | Cost |
|---|---|---|---|---|
| UI-002 | Heart Dashboard | Haiku + Gemini | 2.5h | $0.12 |
| ACCESSIBILITY-001 (next) | WCAG Audit | Claude | 2h | $0.15 |
| VOICE-001 (next) | Voice Assistance | Haiku | 1.5h | $0.09 |
| **TOTAL PHASE 3** | | | **6h** | **$0.36** |

---

## Phase 4: Vision IA (Weeks 17-24+)

| User Story | Task | Agent | Heures API | Cost |
|---|---|---|---|---|
| VISION-001 | Mail Photo Analyzer | Claude | 1.5h | $0.12 |
| CALL-001 | Call Monitoring R&D | Claude | 1.5h | $0.12 |
| **TOTAL PHASE 4** | | | **3h** | **$0.24** |

---

# 🎯 Guide d'Utilisation pour l'Orchestration

## Chaque Semaine: Votre Workflow

### Lundi
```
1. Ouvrir le fichier de la tâche à faire
2. Copier le Prompt spécifique
3. Envoyer à Claude (platform.anthropic.com)
4. Attendre output
5. Reviser code généré (15 min)
```

### Mardi-Jeudi
```
1. Si code OK: Commiter à Git
2. Si problèmes: Relancer Claude avec corrections
3. Tester localement
4. Iterate avec agents si nécessaire
```

### Vendredi
```
1. Integration testing
2. Review all week's code
3. Prepare next week's tasks
4. Update GitHub Issues
```

---

## Context Files À Fournir TOUJOURS

### Minimal Set
```
1. PROJECT_STATUS.md (architecture actuelle)
2. ROADMAP_COMPLETE.md (vision phase)
3. FEATURES_REPORT.md (spec détaillée)
4. Code files existants (handler_llm.py, App.jsx, etc)
```

### Nice to Have
```
5. WCAG_STANDARDS.txt (accessibility rules)
6. COST_METHODOLOGY.md (pour comprendre budget)
7. Previous task outputs (pour continuité)
```

---

## Comment Évaluer Quality d'Agent Output

### Checklist

```
CODE QUALITY:
☑ Indentation consistent (2 or 4 spaces)
☑ Variables nommées clairement (not 'x', 'temp')
☑ Comments pour complex logic
☑ No hardcoded values (use config)
☑ Error handling present

FUNCTIONALITY:
☑ Matches specification 100%
☑ Edge cases considered
☑ Tests included
☑ Documentation clear

SECURITY:
☑ No passwords/keys in code
☑ Input validation present
☑ SQL injection prevented (if DB)
☑ Secrets from Secrets Manager
☑ Audit logging included
```

---

## Erreurs Communes & Solutions

### Si Claude génère code qui compile pas

```
Solution:
1. Envoyer l'erreur à Claude
2. Claude va fixer et re-générer
3. Test à nouveau
4. Iterate max 2-3x
5. Si toujours ko: Pause, re-analyze prompt
```

### Si Gemini validation trouve bug

```
Solution:
1. Envoyer bug report à Claude
2. Claude investigates + fixes
3. Gemini validate fix
4. Commit when ok
```

### Si vous pas comprenez code généré

```
Solution:
1. Demander Claude: "Explique cette fonction"
2. Claude va expliquer en détail
3. Ask questions jusqu'à comprenez
4. Then can proceed with confidence
```

---

## 🎯 Prochaines Étapes

### Maintenant (Start Today)

```
1. Créer fichier PROMPTS.txt avec tous les prompts
2. Créer GitHub project board
3. Assigner Tâche 1.1 (anonymization)
4. Envoyer contexte files à Claude
5. Lancer travail!
```

### Cette Semaine

```
☑ 1.1: DynamoDB TTL + anonymization
☑ 1.2: Consent banner
☑ Tests localement
```

### Semaine 2

```
☑ 2.1: Quebec expert prompt
☑ 2.2: SQ/CAFC alerts
☑ Integration testing
```

---

## 📊 Budget Suivi par Tâche

```
Task 1.1: $0.15 API + 1h your time ($50) = $50.15
Task 1.2: $0.08 API + 1h your time = $50.08
Task 2.1: $0.12 API + 0.5h = $25.12
Task 2.2: $0.18 API + 1.5h = $75.18
Task 3.1: $0.22 API + 1.5h = $75.22
Task 3.2: $0.18 API + 1h = $50.18

RUNNING TOTAL: ~$326 for all core tasks ✓
(vs $18,962 budget = huge buffer)
```

---

**Document créé:** 17 février 2026
**Total Tâches Détaillées:** 10+
**Structure:** Blocks → User Stories → Prompts
**Timeline:** 18 mois
**Budget API:** ~$2-3 per complex task
**Your Time:** 2-3 hours/week
