# DynamoDB to Aurora (PostgreSQL) Schema Migration Plan

**Phase 1, Day 5 — Migration Planning**  
**Date:** April 19, 2026  
**Decision reference:** SERVERLESS_ARCHITECTURE_DECISION.md  
**Status:** PLANNING — not yet executed (execution in Phase 2, Week 2)

---

## Current DynamoDB Tables

The current system has five DynamoDB tables. All use PAY_PER_REQUEST billing.

| Table | PK | SK | Purpose |
|---|---|---|---|
| ScamGuardData-dev | PK (string) | SK (string) | User profiles, sessions, analytics |
| ScamGuardAudit-dev | PK (string) | SK (string) | Audit trail / compliance |
| ScamGuardOTP-dev | PK (string) | SK (string) | SMS OTP tracking (TTL-expired) |
| ScamGuardThreats-dev | PK (string) | SK (string) | Threat scenario library |
| ScamGuardThreatInteractions-dev | PK (string) | SK (string) | User-threat interaction records |

### Key patterns observed in DynamoDB (composite PK/SK design)

```
ScamGuardData:
  USER#{userId}        / PROFILE          -> user profile record
  USER#{userId}        / SESSION#{ts}     -> analysis session record
  USER#{userId}        / ANALYTICS#{ts}   -> analytics snapshot
  USER#{userId}        / NOTIF_PREFS      -> notification preferences
  FAMILY#{familyId}    / MEMBER#{userId}  -> family group membership

ScamGuardAudit:
  AUDIT#{userId}       / {timestamp}      -> compliance audit record

ScamGuardOTP:
  OTP#{phone}          / {timestamp}      -> one-time password (TTL: 5min)

ScamGuardThreats:
  THREAT#{threatId}    / {dateDetected}   -> threat record (SQ / CAFC source)
  SCENARIO#{id}        / {version}        -> training scenario

ScamGuardThreatInteractions:
  USER#{userId}        / THREAT#{threatId} -> matched threat, notification status
```

---

## Target PostgreSQL Schema

### Design principles

1. **Normalize where it removes scan cost** — DynamoDB scans become indexed lookups.
2. **JSONB for flexible attributes** — avoids premature over-normalization while preserving SQL query ability.
3. **UUID primary keys** — matches Cognito sub format, avoids integer sequence contention.
4. **Timestamps as TIMESTAMPTZ** — timezone-aware, required for multi-region compliance (PIPEDA).
5. **Indexes on all foreign keys + common query patterns** — prevents sequential scans on joins.

### Tables

```sql
-- ============================================================
-- users
-- Source: ScamGuardData USER#{userId}/PROFILE
-- ============================================================
CREATE TABLE users (
    user_id       UUID PRIMARY KEY,
    cognito_sub   VARCHAR(256) UNIQUE NOT NULL,
    email         VARCHAR(320) UNIQUE NOT NULL,
    name          VARCHAR(256),
    family_name   VARCHAR(256),
    age_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    data_consent  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);


-- ============================================================
-- user_profiles
-- Source: ScamGuardData USER#{userId}/PROFILE (gamification fields)
-- ============================================================
CREATE TABLE user_profiles (
    user_id          UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    experience_level INT NOT NULL DEFAULT 0,
    xp_earned        INT NOT NULL DEFAULT 0,
    badges           JSONB NOT NULL DEFAULT '[]',
    preferred_lang   VARCHAR(5) NOT NULL DEFAULT 'fr',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- sessions
-- Source: ScamGuardData USER#{userId}/SESSION#{ts}
-- Critical: indexed on (user_id, created_at) for Phase 6 analytics
-- ============================================================
CREATE TABLE sessions (
    session_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    scenario_id     VARCHAR(128),
    user_response   TEXT,
    detection_score FLOAT,
    xp_earned       INT NOT NULL DEFAULT 0,
    feedback        TEXT,
    image_analyzed  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_date ON sessions(user_id, created_at DESC);
CREATE INDEX idx_sessions_scenario  ON sessions(scenario_id);
CREATE INDEX idx_sessions_date      ON sessions(created_at DESC);


-- ============================================================
-- notification_preferences
-- Source: ScamGuardData USER#{userId}/NOTIF_PREFS
-- ============================================================
CREATE TABLE notification_preferences (
    user_id        UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    sms_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    phone_number   VARCHAR(20),
    preferences    JSONB NOT NULL DEFAULT '{}',
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- threats
-- Source: ScamGuardThreats THREAT#{threatId}/{dateDetected}
-- Indexed for Phase 6 trend queries (threat_type, region, date)
-- ============================================================
CREATE TABLE threats (
    threat_id         VARCHAR(64) PRIMARY KEY,
    threat_type       VARCHAR(32) NOT NULL,     -- SMS | Email | Call | Phishing
    institution       VARCHAR(128),
    threat_level      VARCHAR(16) NOT NULL,     -- high | medium | low
    message           TEXT,
    explanation_fr    TEXT,
    keywords          TEXT[] NOT NULL DEFAULT '{}',
    regions           TEXT[] NOT NULL DEFAULT '{}',
    source            VARCHAR(32) NOT NULL,     -- SQ | CAFC | internal
    is_scam           BOOLEAN NOT NULL,
    threat_indicators TEXT[] NOT NULL DEFAULT '{}',
    expires_at        TIMESTAMPTZ,
    date_detected     TIMESTAMPTZ NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_threats_type_date     ON threats(threat_type, date_detected DESC);
CREATE INDEX idx_threats_institution   ON threats(institution);
CREATE INDEX idx_threats_level_date    ON threats(threat_level, date_detected DESC);
CREATE INDEX idx_threats_regions       ON threats USING GIN(regions);
CREATE INDEX idx_threats_keywords      ON threats USING GIN(keywords);


-- ============================================================
-- threat_scenarios
-- Source: ScamGuardThreats SCENARIO#{id}/{version}
-- Training scenarios for the quiz simulator
-- ============================================================
CREATE TABLE threat_scenarios (
    scenario_id       VARCHAR(128) NOT NULL,
    version           VARCHAR(16)  NOT NULL,
    threat_type       VARCHAR(32)  NOT NULL,
    institution       VARCHAR(128),
    category          VARCHAR(64)  NOT NULL,    -- banking | utilities | other
    message           TEXT         NOT NULL,
    is_scam           BOOLEAN      NOT NULL,
    explanation_fr    TEXT,
    threat_indicators TEXT[] NOT NULL DEFAULT '{}',
    difficulty        VARCHAR(16)  NOT NULL,    -- easy | medium | hard
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (scenario_id, version)
);

CREATE INDEX idx_scenarios_category ON threat_scenarios(category);
CREATE INDEX idx_scenarios_difficulty ON threat_scenarios(difficulty);


-- ============================================================
-- user_threats
-- Source: ScamGuardThreatInteractions USER#{userId}/THREAT#{threatId}
-- ============================================================
CREATE TABLE user_threats (
    user_id               UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    threat_id             VARCHAR(64) NOT NULL REFERENCES threats(threat_id),
    matched_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notification_sent     BOOLEAN NOT NULL DEFAULT FALSE,
    user_saw_notification BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (user_id, threat_id)
);

CREATE INDEX idx_user_threats_user_date ON user_threats(user_id, matched_at DESC);
CREATE INDEX idx_user_threats_threat    ON user_threats(threat_id);


-- ============================================================
-- threat_reports
-- Source: new table (Phase 6 analytics, no DynamoDB equivalent)
-- ============================================================
CREATE TABLE threat_reports (
    report_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    threat_type  VARCHAR(32) NOT NULL,
    region       VARCHAR(128),
    confidence   FLOAT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_threat_reports_type_date   ON threat_reports(threat_type, created_at DESC);
CREATE INDEX idx_threat_reports_region_date ON threat_reports(region, created_at DESC);
CREATE INDEX idx_threat_reports_user        ON threat_reports(user_id);


-- ============================================================
-- family_groups
-- Source: ScamGuardData FAMILY#{familyId}/MEMBER#{userId}
-- Phase 5A Family Protection feature
-- ============================================================
CREATE TABLE family_groups (
    family_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(256) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE family_members (
    family_id  UUID NOT NULL REFERENCES family_groups(family_id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role       VARCHAR(32) NOT NULL DEFAULT 'member',  -- admin | member
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (family_id, user_id)
);

CREATE INDEX idx_family_members_user ON family_members(user_id);


-- ============================================================
-- audit_log
-- Source: ScamGuardAudit AUDIT#{userId}/{timestamp}
-- Compliance requirement (PIPEDA): immutable append-only log
-- ============================================================
CREATE TABLE audit_log (
    log_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(user_id),
    action     VARCHAR(128) NOT NULL,
    resource   VARCHAR(256),
    outcome    VARCHAR(32) NOT NULL,  -- success | blocked | error
    ip_address INET,
    metadata   JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition by month in production for retention management
-- CREATE INDEX idx_audit_user_date ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_date   ON audit_log(created_at DESC);
CREATE INDEX idx_audit_action ON audit_log(action);
```

---

## DynamoDB Item Count (to verify after migration)

Run before starting ETL (Phase 2, Day 8-9) to establish baseline counts:

```bash
# Get counts for all tables
for table in ScamGuardData-dev ScamGuardAudit-dev ScamGuardOTP-dev ScamGuardThreats-dev ScamGuardThreatInteractions-dev; do
    echo -n "$table: "
    aws dynamodb scan --table-name "$table" --select COUNT --output text \
        --query 'Count' 2>/dev/null || echo "table not found or no access"
done
```

After ETL, PostgreSQL counts must match:

```sql
SELECT 'users'         AS tbl, COUNT(*) FROM users
UNION ALL
SELECT 'user_profiles',        COUNT(*) FROM user_profiles
UNION ALL
SELECT 'sessions',             COUNT(*) FROM sessions
UNION ALL
SELECT 'threats',              COUNT(*) FROM threats
UNION ALL
SELECT 'threat_scenarios',     COUNT(*) FROM threat_scenarios
UNION ALL
SELECT 'user_threats',         COUNT(*) FROM user_threats
UNION ALL
SELECT 'family_groups',        COUNT(*) FROM family_groups
UNION ALL
SELECT 'family_members',       COUNT(*) FROM family_members
UNION ALL
SELECT 'audit_log',            COUNT(*) FROM audit_log;
```

---

## ETL Mapping Rules

| DynamoDB PK / SK pattern | DynamoDB fields | PostgreSQL table | PostgreSQL columns |
|---|---|---|---|
| USER#{id} / PROFILE | userId, email, name, xpEarned, level | users + user_profiles | user_id, email, name, xp_earned, experience_level |
| USER#{id} / SESSION#{ts} | sessionId, scenario, score, xp, feedback | sessions | session_id, user_id, scenario_id, detection_score, xp_earned, feedback |
| USER#{id} / NOTIF_PREFS | smsEnabled, emailEnabled, phone | notification_preferences | sms_enabled, email_enabled, phone_number |
| FAMILY#{id} / MEMBER#{userId} | role, joinedAt | family_groups + family_members | family_id, user_id, role, joined_at |
| AUDIT#{id} / {ts} | action, resource, outcome, ip | audit_log | action, resource, outcome, ip_address |
| THREAT#{id} / {date} | type, level, message, keywords, regions | threats | threat_id, threat_type, threat_level, message, keywords[], regions[] |
| SCENARIO#{id} / {version} | category, message, isScam, difficulty | threat_scenarios | scenario_id, version, category, message, is_scam, difficulty |
| USER#{id} / THREAT#{id} | matchedAt, notifSent, saw | user_threats | user_id, threat_id, matched_at, notification_sent, user_saw_notification |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Data loss during ETL | Low | High | Run ETL on copy; keep DynamoDB 7 days post-cutover |
| Field name mismatch (camelCase → snake_case) | Medium | Medium | ETL script applies explicit field mapping (not auto-detect) |
| NULL constraint violations | Medium | Medium | ETL pre-validates nullable vs required fields before inserting |
| OTP table: active tokens during migration | Low | High | Migrate OTP last; cutover during low-traffic window |
| Audit log: append-only semantics | Low | Medium | audit_log has no UPDATE/DELETE grants on Lambda IAM policy |
| Aurora cold start on first query | Low | Low | Acceptable for MVP; RDS Proxy added if p99 >500ms |

---

## Rollback Plan

If ETL or Lambda cutover fails:

1. API Gateway integration points back to Express.js (takes <5 minutes)
2. DynamoDB tables remain untouched and available as read replicas
3. Aurora cluster kept but idle (cost: 0.5 ACU = ~$0.03/hr)
4. Fix issue, re-run ETL from DynamoDB snapshot
5. Re-attempt cutover

---

## Phase 2 Prerequisites (before running ETL)

- [ ] Aurora cluster deployed and healthy (`cdk deploy AuroraStack --profile dev`)
- [ ] PostgreSQL schema applied via psql or Aurora Data API
- [ ] ETL script validated on 10 sample DynamoDB records
- [ ] DynamoDB backup created (AWS Backup or on-demand export to S3)
- [ ] Record current DynamoDB item counts (baseline for integrity check)
- [ ] Low-traffic window identified (weeknight 2-4am ET)

---

**Owner:** Lead (Database migration)  
**Review date:** April 21, 2026 (Phase 2 kickoff)  
**Next step:** Phase 2, Day 6-7 — Execute PostgreSQL schema creation against Aurora cluster
