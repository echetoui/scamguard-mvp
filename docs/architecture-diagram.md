# 🏗️ Architecture ScamGuard v5.0 - Diagramme Visuel

## Architecture Complète

```mermaid
graph TB
    subgraph "👤 Client Layer"
        USER[👴 Senior User<br/>Navigateur Web]
    end

    subgraph "🌐 CDN Layer"
        CF[☁️ CloudFront<br/>CDN Global<br/>HTTPS]
    end

    subgraph "📦 Frontend Layer"
        S3F[🪣 S3 Frontend<br/>React PWA<br/>Static Website]
    end

    subgraph "🔐 Auth Layer"
        COGNITO[🔑 Cognito<br/>User Pool<br/>Email Auth]
    end

    subgraph "🚪 API Layer"
        APIGW[🚪 API Gateway<br/>REST API<br/>Rate Limit: 10/day<br/>CORS Enabled]
    end

    subgraph "⚡ Compute Layer"
        LAMBDA[⚡ Lambda<br/>Python 3.12<br/>512MB - 30s<br/>X-Ray Tracing]
    end

    subgraph "🤖 AI Agents"
        SCENARIO[🎭 ScenarioAgent<br/>Gemini Flash]
        DETECT[🔍 DetectionAgent<br/>GPT-4o-mini]
        COACH[💬 CoachingAgent<br/>Gemini Flash]
        ANALYTICS[📊 AnalyticsAgent<br/>GPT-4o-mini]
    end

    subgraph "💾 Data Layer"
        DDB[(🗄️ DynamoDB<br/>On-Demand<br/>Backup Enabled<br/>TTL Enabled)]
        S3U[🪣 S3 Uploads<br/>Images<br/>Private<br/>30d Lifecycle]
    end

    subgraph "🔒 Secrets Layer"
        SM[🔐 Secrets Manager<br/>Gemini Key<br/>OpenAI Key]
    end

    subgraph "🌍 External APIs"
        GEMINI[🤖 Gemini 1.5 Flash<br/>Free Tier<br/>1.5K req/day]
        OPENAI[🤖 GPT-4o-mini<br/>$2-3/month<br/>Vision Enabled]
    end

    subgraph "📊 Monitoring Layer"
        CW[📈 CloudWatch<br/>Logs + Metrics<br/>X-Ray Traces]
        ALARMS[🚨 CloudWatch Alarms<br/>Lambda Errors<br/>Duration<br/>DDB Throttle]
        SNS[📧 SNS Topic<br/>Email Alerts]
    end

    USER -->|HTTPS| CF
    CF -->|Cache| S3F
    USER -->|API Calls| APIGW
    APIGW -->|Authorize| COGNITO
    APIGW -->|Invoke| LAMBDA
    
    LAMBDA -->|Read/Write| DDB
    LAMBDA -->|Upload/Download| S3U
    LAMBDA -->|Get Secrets| SM
    LAMBDA -->|Route Request| SCENARIO
    LAMBDA -->|Route Request| DETECT
    LAMBDA -->|Route Request| COACH
    LAMBDA -->|Route Request| ANALYTICS
    
    SCENARIO -->|API Call| GEMINI
    DETECT -->|API Call| OPENAI
    COACH -->|API Call| GEMINI
    ANALYTICS -->|API Call| OPENAI
    
    LAMBDA -->|Logs| CW
    APIGW -->|Logs| CW
    CW -->|Trigger| ALARMS
    ALARMS -->|Notify| SNS

    style USER fill:#e1f5ff
    style CF fill:#ff9800
    style S3F fill:#4caf50
    style COGNITO fill:#2196f3
    style APIGW fill:#9c27b0
    style LAMBDA fill:#ff5722
    style DDB fill:#00bcd4
    style S3U fill:#4caf50
    style SM fill:#f44336
    style GEMINI fill:#4285f4
    style OPENAI fill:#10a37f
    style CW fill:#ff9800
    style ALARMS fill:#f44336
    style SNS fill:#ff9800
```

## Flux de Données Détaillé

### 1️⃣ Génération de Scénario

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant CF as ☁️ CloudFront
    participant API as 🚪 API Gateway
    participant COG as 🔑 Cognito
    participant L as ⚡ Lambda
    participant DDB as 🗄️ DynamoDB
    participant SM as 🔐 Secrets
    participant G as 🤖 Gemini

    U->>CF: GET /app
    CF->>U: React PWA
    U->>API: POST /scenario + JWT
    API->>COG: Validate Token
    COG->>API: ✅ Valid
    API->>L: Invoke
    L->>DDB: Check Cache (SCENARIO#id)
    alt Cache Hit
        DDB->>L: Return Cached
    else Cache Miss
        L->>SM: Get Gemini Key
        SM->>L: API Key
        L->>G: Generate Scenario
        G->>L: Scenario JSON
        L->>DDB: Store (TTL: 7d)
    end
    L->>API: Response
    API->>U: Scenario JSON
```

### 2️⃣ Analyse de Message (avec Image)

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant API as 🚪 API Gateway
    participant L as ⚡ Lambda
    participant S3 as 🪣 S3 Uploads
    participant SM as 🔐 Secrets
    participant GPT as 🤖 GPT-4o-mini
    participant G as 🤖 Gemini
    participant DDB as 🗄️ DynamoDB

    U->>API: POST /analyze + image
    API->>L: Invoke
    L->>S3: Upload Image (presigned URL)
    S3->>L: Image URL
    L->>SM: Get OpenAI Key
    SM->>L: API Key
    L->>GPT: Analyze (text + image)
    GPT->>L: Detection Result
    L->>SM: Get Gemini Key
    SM->>L: API Key
    L->>G: Generate Coaching
    G->>L: Feedback
    L->>DDB: Store Session
    L->>DDB: Update Quota
    L->>API: Results
    API->>U: Analysis + Feedback
```

### 3️⃣ Rate Limiting

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant API as 🚪 API Gateway
    participant L as ⚡ Lambda
    participant DDB as 🗄️ DynamoDB

    U->>API: POST /scenario
    API->>L: Invoke
    L->>DDB: Query QUOTA#2025-03-16
    DDB->>L: Count: 8
    alt Count < 10
        L->>DDB: Increment Count
        L->>L: Process Request
        L->>API: ✅ Success
    else Count >= 10
        L->>API: ❌ 429 Too Many Requests
    end
    API->>U: Response
```

## Schéma DynamoDB

```mermaid
erDiagram
    USER_PROFILE {
        string PK "USER#123"
        string SK "PROFILE"
        string email
        int age
        string level
        int xp
        array badges
        timestamp created_at
    }
    
    USER_SESSION {
        string PK "USER#123"
        string SK "SESSION#2025-03-16T10:30:00"
        string scenario_id
        int score
        array red_flags_found
        array red_flags_missed
        string feedback
        int xp_earned
        timestamp created_at
    }
    
    USER_ANALYTICS {
        string PK "USER#123"
        string SK "ANALYTICS"
        int total_sessions
        float avg_score
        array strengths
        array weaknesses
        string trend
        timestamp updated_at
    }
    
    USER_QUOTA {
        string PK "USER#123"
        string SK "QUOTA#2025-03-16"
        int count
        int TTL "Expire at midnight"
    }
    
    SCENARIO_CACHE {
        string PK "SCENARIO#abc123"
        string SK "METADATA"
        string title
        string content
        array red_flags
        string correct_action
        int TTL "7 days"
    }
```

## Monitoring & Alarms

```mermaid
graph LR
    subgraph "📊 Metrics Sources"
        L[⚡ Lambda]
        API[🚪 API Gateway]
        DDB[🗄️ DynamoDB]
    end

    subgraph "🚨 CloudWatch Alarms"
        A1[Lambda Errors > 5/5min]
        A2[Lambda Duration > 10s]
        A3[DDB Throttling]
    end

    subgraph "📧 Notifications"
        SNS[SNS Topic]
        EMAIL[📧 Email]
    end

    L -->|Errors Metric| A1
    L -->|Duration Metric| A2
    DDB -->|Throttle Metric| A3
    
    A1 -->|Trigger| SNS
    A2 -->|Trigger| SNS
    A3 -->|Trigger| SNS
    
    SNS -->|Send| EMAIL

    style A1 fill:#f44336
    style A2 fill:#ff9800
    style A3 fill:#f44336
```

## Coûts par Service

```mermaid
pie title Coûts Mensuels ($4-5/mois)
    "GPT-4o-mini" : 2.5
    "Secrets Manager" : 0.8
    "CloudWatch" : 0.5
    "DynamoDB Backup" : 0.2
    "S3" : 0.1
    "Autres (Free Tier)" : 0
```

## Sécurité - Layers

```mermaid
graph TB
    subgraph "🌐 Network Security"
        HTTPS[HTTPS Everywhere]
        CORS[CORS Configured]
    end

    subgraph "🔐 Authentication"
        COGNITO[Cognito User Pool]
        JWT[JWT Tokens]
    end

    subgraph "🛡️ Authorization"
        APIGW[API Gateway Authorizer]
        RATE[Rate Limiting]
    end

    subgraph "🔒 Data Security"
        S3ENC[S3 Encryption at Rest]
        DDBENC[DynamoDB Encryption]
        SM[Secrets Manager]
    end

    subgraph "📊 Audit"
        LOGS[CloudWatch Logs]
        XRAY[X-Ray Tracing]
    end

    HTTPS --> COGNITO
    CORS --> APIGW
    COGNITO --> JWT
    JWT --> APIGW
    APIGW --> RATE
    RATE --> S3ENC
    RATE --> DDBENC
    RATE --> SM
    S3ENC --> LOGS
    DDBENC --> LOGS
    SM --> LOGS
    LOGS --> XRAY

    style HTTPS fill:#4caf50
    style COGNITO fill:#2196f3
    style APIGW fill:#9c27b0
    style SM fill:#f44336
    style LOGS fill:#ff9800
```

---

## 📝 Légende

| Icône | Service | Coût |
|-------|---------|------|
| ☁️ | CloudFront | $0 (free tier) |
| 🪣 | S3 | $0.10/mois |
| 🚪 | API Gateway | $0 (free tier) |
| 🔑 | Cognito | $0 (free tier) |
| ⚡ | Lambda | $0 (free tier) |
| 🗄️ | DynamoDB | $0.20/mois (backup) |
| 🔐 | Secrets Manager | $0.80/mois |
| 🤖 | Gemini Flash | $0 (free tier) |
| 🤖 | GPT-4o-mini | $2-3/mois |
| 📈 | CloudWatch | $0.50/mois |

**Total: $4-5/mois pour 10 utilisateurs**

---

**Généré pour:** ScamGuard v5.0  
**Date:** Mars 2025  
**Status:** ✅ Production-Ready
