-- =============================================================
-- ScamGuard MVP - PostgreSQL Schema
-- Phase 2, Day 6-7: Schema Creation
-- Source of truth: backend/db/schema_migration_plan.md
--
-- Apply against Aurora cluster:
--   psql -h <ClusterEndpoint> -U scamguard_admin -d scamguard -f schema.sql
-- Or via pg_dump/psql over SSM tunnel (see runbook below).
--
-- Idempotent: all CREATE TABLE statements use IF NOT EXISTS.
-- Indexes use IF NOT EXISTS (PostgreSQL 9.5+).
-- =============================================================

-- Enable pgcrypto for gen_random_uuid() (available on Aurora PostgreSQL 15)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- users
-- Source: ScamGuardData USER#{userId}/PROFILE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);


-- ============================================================
-- user_profiles
-- Source: ScamGuardData USER#{userId}/PROFILE (gamification fields)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
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
CREATE TABLE IF NOT EXISTS sessions (
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

CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_scenario  ON sessions(scenario_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date      ON sessions(created_at DESC);


-- ============================================================
-- notification_preferences
-- Source: ScamGuardData USER#{userId}/NOTIF_PREFS
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
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
CREATE TABLE IF NOT EXISTS threats (
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

CREATE INDEX IF NOT EXISTS idx_threats_type_date   ON threats(threat_type, date_detected DESC);
CREATE INDEX IF NOT EXISTS idx_threats_institution ON threats(institution);
CREATE INDEX IF NOT EXISTS idx_threats_level_date  ON threats(threat_level, date_detected DESC);
CREATE INDEX IF NOT EXISTS idx_threats_regions     ON threats USING GIN(regions);
CREATE INDEX IF NOT EXISTS idx_threats_keywords    ON threats USING GIN(keywords);


-- ============================================================
-- threat_scenarios
-- Source: ScamGuardThreats SCENARIO#{id}/{version}
-- Training scenarios for the quiz simulator
-- ============================================================
CREATE TABLE IF NOT EXISTS threat_scenarios (
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

CREATE INDEX IF NOT EXISTS idx_scenarios_category   ON threat_scenarios(category);
CREATE INDEX IF NOT EXISTS idx_scenarios_difficulty ON threat_scenarios(difficulty);


-- ============================================================
-- user_threats
-- Source: ScamGuardThreatInteractions USER#{userId}/THREAT#{threatId}
-- ============================================================
CREATE TABLE IF NOT EXISTS user_threats (
    user_id               UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    threat_id             VARCHAR(64) NOT NULL REFERENCES threats(threat_id),
    matched_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notification_sent     BOOLEAN NOT NULL DEFAULT FALSE,
    user_saw_notification BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (user_id, threat_id)
);

CREATE INDEX IF NOT EXISTS idx_user_threats_user_date ON user_threats(user_id, matched_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_threats_threat    ON user_threats(threat_id);


-- ============================================================
-- threat_reports
-- Source: new table (Phase 6 analytics, no DynamoDB equivalent)
-- ============================================================
CREATE TABLE IF NOT EXISTS threat_reports (
    report_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    threat_type  VARCHAR(32) NOT NULL,
    region       VARCHAR(128),
    confidence   FLOAT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threat_reports_type_date   ON threat_reports(threat_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_reports_region_date ON threat_reports(region, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_reports_user        ON threat_reports(user_id);


-- ============================================================
-- family_groups + family_members
-- Source: ScamGuardData FAMILY#{familyId}/MEMBER#{userId}
-- Phase 5A Family Protection feature
-- ============================================================
CREATE TABLE IF NOT EXISTS family_groups (
    family_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(256) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_members (
    family_id  UUID NOT NULL REFERENCES family_groups(family_id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role       VARCHAR(32) NOT NULL DEFAULT 'member',  -- admin | member
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (family_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);


-- ============================================================
-- audit_log
-- Source: ScamGuardAudit AUDIT#{userId}/{timestamp}
-- Compliance requirement (PIPEDA): immutable append-only log
-- No UPDATE or DELETE grants should be given to Lambda IAM role.
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    log_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(user_id),
    action     VARCHAR(128) NOT NULL,
    resource   VARCHAR(256),
    outcome    VARCHAR(32) NOT NULL,  -- success | blocked | error
    ip_address INET,
    metadata   JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_date   ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_user   ON audit_log(user_id, created_at DESC);


-- ============================================================
-- Verification query (run after applying schema)
-- ============================================================
-- SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)))
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
