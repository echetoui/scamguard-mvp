# Architecture AWS ScamGuard v5.0

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                         UTILISATEUR                          │
│                    (Seniors - Navigateur)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFRONT CDN                          │
│  • Cache statique                                            │
│  • HTTPS automatique                                         │
│  • Latence optimisée                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    S3 FRONTEND BUCKET                        │
│  • React PWA (build/)                                        │
│  • Service Worker                                            │
│  • Assets statiques                                          │
└─────────────────────────────────────────────────────────────┘

                         │ API Calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY REST                          │
│  • CORS configuré                                            │
│  • Rate limiting: 10 req/user/jour                           │
│  • Cognito Authorizer                                        │
│  • Logging + X-Ray                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   COGNITO USER POOL                          │
│  • Authentification email                                    │
│  • Password policy                                           │
│  • Auto-verify email                                         │
└─────────────────────────────────────────────────────────────┘

                         │ Authorized
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    LAMBDA FUNCTION                           │
│  Runtime: Python 3.12                                        │
│  Memory: 512 MB                                              │
│  Timeout: 30s                                                │
│  Tracing: X-Ray enabled                                      │
│                                                              │
│  Handlers:                                                   │
│  • POST /scenario    → ScenarioAgent                         │
│  • POST /analyze     → DetectionAgent + CoachingAgent        │
│  • GET  /profile     → User profile                          │
│  • GET  /analytics   → AnalyticsAgent                        │
└──┬────────┬──────────┬──────────┬───────────────────────────┘
   │        │          │          │
   │        │          │          │
   ▼        ▼          ▼          ▼
┌────┐  ┌────┐    ┌────┐    ┌─────────┐
│ DB │  │ S3 │    │SEC │    │  LLMs   │
└────┘  └────┘    └────┘    └─────────┘

┌─────────────────────────────────────────────────────────────┐
│                      DYNAMODB TABLE                          │
│  Name: ScamGuardData                                         │
│  Mode: On-Demand                                             │
│  Backup: Point-in-time recovery                              │
│                                                              │
│  Schema:                                                     │
│  PK: USER#<id>     SK: PROFILE                               │
│  PK: USER#<id>     SK: SESSION#<timestamp>                   │
│  PK: USER#<id>     SK: ANALYTICS                             │
│  PK: USER#<id>     SK: QUOTA#<date>                          │
│  PK: SCENARIO#<id> SK: METADATA                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    S3 UPLOADS BUCKET                         │
│  • Images utilisateurs                                       │
│  • Encryption: S3-managed                                    │
│  • Lifecycle: 30 jours                                       │
│  • Private (presigned URLs)                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SECRETS MANAGER                           │
│  • scamguard/gemini-key  (rotation: 90j)                     │
│  • scamguard/openai-key  (rotation: 90j)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      LLMs EXTERNES                           │
│  • Gemini 1.5 Flash (free tier 1.5K/jour)                    │
│  • GPT-4o-mini (vision + analytics)                          │
│  • Retry logic: 3 tentatives                                 │
│  • Fallback automatique                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   CLOUDWATCH MONITORING                      │
│  Alarms:                                                     │
│  • Lambda errors > 5/5min                                    │
│  • Lambda duration > 10s                                     │
│  • DynamoDB throttling                                       │
│  • SNS notifications                                         │
│                                                              │
│  Logs:                                                       │
│  • API Gateway logs                                          │
│  • Lambda logs (retention: 7 jours)                          │
│  • X-Ray traces                                              │
└─────────────────────────────────────────────────────────────┘
```

## Flux de données

### 1. Génération Scénario
```
User → CloudFront → API Gateway → Cognito → Lambda
                                              ↓
                                    Check cache DynamoDB
                                              ↓
                                    Cache miss → Gemini API
                                              ↓
                                    Store in DynamoDB (TTL 7j)
                                              ↓
                                    Return scenario
```

### 2. Analyse Message
```
User uploads image → S3 presigned URL → S3 Bucket
                                          ↓
User submits → API Gateway → Lambda → Get image from S3
                                          ↓
                                    GPT-4o-mini (vision)
                                          ↓
                                    DetectionAgent analysis
                                          ↓
                                    CoachingAgent feedback
                                          ↓
                                    Store session DynamoDB
                                          ↓
                                    Return results
```

### 3. Rate Limiting
```
Request → API Gateway → Lambda → Check DynamoDB
                                    ↓
                            PK: USER#<id>
                            SK: QUOTA#<date>
                                    ↓
                            Count < 10? → Allow
                            Count >= 10? → Reject 429
```

## Coûts mensuels (10 users)

| Service | Coût |
|---------|------|
| API Gateway | $0 (free tier) |
| Lambda | $0 (free tier) |
| DynamoDB | $0 (free tier) |
| DynamoDB Backup | $0.20 |
| Secrets Manager | $0.80 |
| S3 | $0.10 |
| CloudWatch | $0.50 |
| CloudFront | $0 (free tier) |
| Cognito | $0 (free tier) |
| Gemini API | $0 (free tier) |
| GPT-4o-mini | $2-3 |
| **TOTAL** | **$4-5/mois** |

## Sécurité

- ✅ HTTPS partout (CloudFront + API Gateway)
- ✅ Secrets Manager avec rotation
- ✅ Cognito authentication
- ✅ Rate limiting par user
- ✅ CORS configuré
- ✅ S3 encryption at rest
- ✅ DynamoDB encryption at rest
- ✅ IAM least privilege
- ✅ CloudWatch logging
- ✅ X-Ray tracing

## Scalabilité

| Users | Actions |
|-------|---------|
| 10 | Architecture actuelle OK |
| 50 | Augmenter rate limit à 20/jour |
| 100 | Ajouter Lambda reserved concurrency |
| 500 | Migrer vers Bedrock (SLA AWS) |
