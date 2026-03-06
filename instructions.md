# CONTEXTE DU PROJET

- **Nom du Projet :** ScamGuard MVP
- **Objectif :** Plateforme de détection de fraude et signalement de scams avec authentification SMS OTP + Ressources Éducatives
- **Stack Technique :**
  - Frontend: React 18, JavaScript/JSX, Tailwind CSS
  - Backend: Python (AWS Lambda), DynamoDB, AWS Cognito, AWS Pinpoint (SMS)
  - API: AWS API Gateway (REST)
  - Déploiement: CloudFront (CDN)

# STANDARDS DE CODE

- **Style :**
  - Frontend: Functional Components avec Hooks (React 18)
  - Pas de classes, composants réutilisables
  - Fichiers nommés en PascalCase (ex: ModernAuthPage.jsx)

- **UI :**
  - Tailwind CSS pour le styling
  - Composants accessibles (WCAG 2.1 AA)
  - Design responsive mobile-first
  - Interface bilingue (Français/Anglais préparée)

- **Gestion d'état :**
  - React Hooks (useState, useEffect, useContext)
  - Custom hook useAuth.js pour l'authentification
  - Context API pour les états globaux

- **Tests :**
  - Frontend: Playwright E2E (54/54 tests passing)
  - Backend: Jest avec intégration DynamoDB
  - Load Testing: k6 scripts
  - Coverage: Signup, Login, SMS OTP, Token Refresh

# ÉTAT ACTUEL (Mis à jour 5 mars 2026)

- **Dernière feature complétée :**
  - ✅ Phase 4C: E2E & Load Testing (18 E2E tests + 4 load tests)
  - ✅ Phase 5E.1: Resources Tab (6 sections, 10 composants)
  - ✅ ModernAuthPage landing page avec authentification SMS OTP
  - ✅ CORS OPTIONS handlers sur tous les endpoints Lambda

- **Problème en cours :**
  - Phase 5A: Scam Reporting System (À commencer)
  - Fonctionnalités de signalement de scams
  - Système de protection familiale avec rôles utilisateur

- **Prochaine étape :**
  - Phase 5A: Implémenter le système de signalement de scams
  - Ajouter les rôles utilisateur (Protecteur/Protégé)
  - Créer l'interface de signalement et d'analyse

# SCHÉMA DE DONNÉES / API

## Tables DynamoDB

### ScamGuardData (On-Demand)
```typescript
interface User {
  PK: string;           // "USER#" + email
  SK: string;           // "METADATA"
  email: string;
  createdAt: number;
  lastLogin: number;
  phoneVerified: boolean;
  userRole: "protector" | "protected";  // Phase 5A
  familyId?: string;    // Phase 5A
}

interface ScamReport {
  PK: string;           // "SCAM#" + reportId
  SK: string;           // "METADATA"
  reporterId: string;
  title: string;
  description: string;
  scamType: string;
  severity: "low" | "medium" | "high";
  reportedAt: number;
  status: "pending" | "verified" | "closed";
}
```

### ScamGuardOTP (On-Demand)
```typescript
interface OTPRecord {
  PK: string;           // phone number
  SK: string;           // "OTP#" + timestamp
  code: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}
```

### ScamGuardAudit (On-Demand)
```typescript
interface AuditLog {
  PK: string;           // "AUDIT#" + timestamp
  SK: string;           // event type
  userId: string;
  action: string;
  resource: string;
  timestamp: number;
  details: Record<string, any>;
}
```

## API Endpoints

### Authentification
- `POST /auth/signup` - Créer un compte
- `POST /auth/login` - Connexion
- `POST /auth/request-sms-otp` - Demander OTP SMS
- `POST /auth/verify-sms-otp` - Vérifier OTP
- `POST /auth/refresh-token` - Rafraîchir le token

### Phase 5A (À implémenter)
- `POST /scam-reports` - Créer un signalement
- `GET /scam-reports` - Lister les signalements
- `POST /family-members` - Ajouter un membre à la famille
- `GET /family-members` - Lister les membres de la famille

## Variables d'Environnement

```env
# AWS
REACT_APP_API_BASE_URL=https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_qmehKb8ow
REACT_APP_COGNITO_CLIENT_ID=[À remplir]

# Lambda (Backend)
DYNAMODB_TABLE_MAIN=ScamGuardData
DYNAMODB_TABLE_OTP=ScamGuardOTP
DYNAMODB_TABLE_AUDIT=ScamGuardAudit
PINPOINT_PROJECT_ID=7422bf6714644482b8100da38abcd4ae
PINPOINT_REGION=us-east-1
```

# CHEMINS IMPORTANTS

```
scamguard-mvp/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ModernAuthPage.jsx (Landing + Auth)
│   │   │   ├── AuthScreen.jsx
│   │   │   ├── SMSAuthScreen.jsx
│   │   │   ├── ResourcesTab.jsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── useAuth.js (Gestion authentification)
│   │   ├── styles/
│   │   │   └── ModernAuthPage.css
│   │   └── App.jsx
│   └── tests/
│       ├── e2e/
│       │   └── auth.spec.ts (54 tests)
│       └── load/
│           ├── load-signups.js
│           ├── load-logins.js
│           └── ...
├── backend/
│   ├── auth_handler.py (Authentification)
│   ├── handler_llm.py (Analytics)
│   ├── sms_otp_handler.py (SMS OTP)
│   └── tests/
│       └── (26 unit tests)
└── documentation/
```

# CHECKLIST DE DÉMARRAGE

- [ ] Cloner le repo et installer les dépendances (`npm install`)
- [ ] Configurer les variables d'environnement (.env)
- [ ] Tester l'authentification: `npm test` ou `npm start`
- [ ] Exécuter les E2E tests: `npx playwright test`
- [ ] Vérifier la connexion API avec le staging

# NOTES IMPORTANTES

- **Performance:** Infrastructure validée pour 1000+ utilisateurs concurrent (load tests réussis)
- **CORS:** OPTIONS handlers déployés sur tous les endpoints (4 mars 2026)
- **Tests:** 54/54 E2E tests passing sur Chromium, Firefox, WebKit
- **Déploiement:** CloudFront CDN configuré, auto-scaling DynamoDB on-demand
