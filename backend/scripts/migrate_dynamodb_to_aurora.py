#!/usr/bin/env python3
"""
ScamGuard MVP - DynamoDB → Aurora PostgreSQL ETL Migration Script
Phase 2, Day 8-9

Usage:
    # Dry run (no writes to PostgreSQL, just validates transform logic):
    python migrate_dynamodb_to_aurora.py --dry-run

    # Full migration:
    AWS_PROFILE=scamguard-dev \\
    AURORA_SECRET_ARN=<arn> \\
    python migrate_dynamodb_to_aurora.py

    # Partial migration (specific tables only):
    python migrate_dynamodb_to_aurora.py --tables data threats scenarios

Requirements:
    pip install boto3 psycopg2-binary

Environment variables:
    AURORA_ENDPOINT     - Aurora cluster writer endpoint (from CloudFormation output ClusterEndpoint)
    AURORA_SECRET_ARN   - Secrets Manager ARN (from CloudFormation output SecretArn)
    AURORA_DB_NAME      - Database name (default: scamguard)
    AWS_PROFILE         - AWS profile (default: scamguard-dev)
    AWS_REGION          - AWS region (default: us-east-1)

Rollback:
    DynamoDB tables are NEVER modified. If migration fails, truncate PostgreSQL tables and re-run.
    Truncate order (respects FK constraints):
        TRUNCATE audit_log, user_threats, threat_reports, family_members,
                 family_groups, notification_preferences, sessions,
                 user_profiles, threats, threat_scenarios CASCADE;
"""

import argparse
import json
import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import boto3
import psycopg2
import psycopg2.extras
from botocore.exceptions import ClientError

# ──────────────────────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f"migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
    ],
)
log = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────────────────────
AWS_REGION  = os.environ.get("AWS_REGION",  "us-east-1")
AWS_PROFILE = os.environ.get("AWS_PROFILE", "scamguard-dev")
AURORA_DB   = os.environ.get("AURORA_DB_NAME", "scamguard")

# Real DynamoDB table names as discovered during Phase 2 audit (April 19, 2026)
DYNAMO_TABLES = {
    "data":         "ScamGuardStack-DataTable447BC44E-1AY6QZXNSPP8",
    "otp":          "ScamGuardOTP",
    "threats":      "threats",
    "scenarios":    "threat_scenarios",
    "interactions": "user_threats",
}

BATCH_SIZE = 50   # INSERT batch size per PostgreSQL roundtrip
PAGE_SIZE  = 100  # DynamoDB scan page size


# ──────────────────────────────────────────────────────────────────────────────
# AWS clients
# ──────────────────────────────────────────────────────────────────────────────
def get_boto_session() -> boto3.Session:
    return boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)


def get_aurora_credentials(secret_arn: str, session: boto3.Session) -> dict:
    """Fetch DB credentials from Secrets Manager."""
    client = session.client("secretsmanager")
    try:
        resp = client.get_secret_value(SecretId=secret_arn)
        return json.loads(resp["SecretString"])
    except ClientError as e:
        log.error("Failed to fetch secret %s: %s", secret_arn, e)
        raise


def get_aurora_conn(secret_arn: str, endpoint: str, session: boto3.Session):
    """Return a psycopg2 connection to Aurora."""
    creds = get_aurora_credentials(secret_arn, session)
    conn = psycopg2.connect(
        host=endpoint,
        port=5432,
        database=AURORA_DB,
        user=creds["username"],
        password=creds["password"],
        connect_timeout=10,
        options="-c search_path=public",
    )
    conn.autocommit = False
    return conn


# ──────────────────────────────────────────────────────────────────────────────
# DynamoDB helpers
# ──────────────────────────────────────────────────────────────────────────────
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def dynamo_scan_all(table_name: str, session: boto3.Session) -> list[dict]:
    """Full table scan with pagination. Returns list of plain Python dicts."""
    dynamo = session.resource("dynamodb")
    table = dynamo.Table(table_name)
    items = []
    kwargs: dict[str, Any] = {"Limit": PAGE_SIZE}
    while True:
        resp = table.scan(**kwargs)
        items.extend(resp.get("Items", []))
        log.debug("Scanned %d items from %s (total so far: %d)",
                  len(resp.get("Items", [])), table_name, len(items))
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    return items


def to_utc(value: Any) -> datetime | None:
    """Convert DynamoDB timestamp strings / Decimal epoch to UTC datetime."""
    if value is None:
        return None
    if isinstance(value, Decimal):
        # Unix epoch (e.g. TTL fields)
        return datetime.fromtimestamp(float(value), tz=timezone.utc)
    if isinstance(value, str):
        # ISO 8601 variants produced by the existing backend
        for fmt in (
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S.%fZ",
        ):
            try:
                dt = datetime.strptime(value, fmt)
                return dt.replace(tzinfo=timezone.utc)
            except ValueError:
                continue
    return None


def coerce_uuid(value: Any) -> str | None:
    """Return a valid UUID string, or generate one if value is not a valid UUID."""
    if value is None:
        return None
    try:
        return str(uuid.UUID(str(value)))
    except ValueError:
        # Deterministic UUID from the original string value (preserves idempotency)
        return str(uuid.uuid5(uuid.NAMESPACE_OID, str(value)))


# ──────────────────────────────────────────────────────────────────────────────
# Transform functions — DynamoDB item → PostgreSQL row dict
# ──────────────────────────────────────────────────────────────────────────────
def transform_data_item(item: dict) -> dict | None:
    """
    ScamGuardStack-DataTable447BC44E (pk/sk lowercase).

    PK patterns observed in dev (April 19, 2026 audit):
      RESEARCH_TRIGGER#<type>#<id> / TIMESTAMP#<iso> → agent workflow events → audit_log

    Anticipated patterns for user data (from schema_migration_plan.md):
      USER#{userId} / PROFILE          → users + user_profiles
      USER#{userId} / SESSION#{ts}     → sessions
      USER#{userId} / NOTIF_PREFS      → notification_preferences
      FAMILY#{familyId} / MEMBER#{id}  → family_groups + family_members
      AUDIT#{userId} / {timestamp}     → audit_log
    """
    pk: str = item.get("pk", "")
    sk: str = item.get("sk", "")

    # ── RESEARCH_TRIGGER events → audit_log ─────────────────────────────────
    if pk.startswith("RESEARCH_TRIGGER"):
        return {
            "_target_table": "audit_log",
            "log_id":    str(uuid.uuid5(uuid.NAMESPACE_OID, f"{pk}#{sk}")),
            "user_id":   None,
            "action":    "RESEARCH_TRIGGER",
            "resource":  item.get("github_url"),
            "outcome":   item.get("status", "unknown"),
            "ip_address": None,
            "metadata":  json.dumps({
                "pk":            pk,
                "sk":            sk,
                "feature_title": item.get("feature_title"),
                "focus_area":    item.get("focus_area"),
                "invocation_id": item.get("invocation_id"),
                "author":        item.get("author"),
            }, cls=DecimalEncoder),
            "created_at": to_utc(sk.replace("TIMESTAMP#", "")) or datetime.now(tz=timezone.utc),
        }

    # ── USER#... / PROFILE → users + user_profiles ─────────────────────────
    if pk.startswith("USER#") and sk == "PROFILE":
        user_id_raw = pk.split("#", 1)[1]
        return {
            "_target_table":    "user_profile_pair",
            "user": {
                "user_id":       coerce_uuid(user_id_raw),
                "cognito_sub":   item.get("cognitoSub") or item.get("userId") or user_id_raw,
                "email":         item.get("email", f"{user_id_raw}@unknown.invalid"),
                "name":          item.get("name"),
                "family_name":   item.get("familyName"),
                "age_verified":  bool(item.get("ageVerified", False)),
                "terms_accepted": bool(item.get("termsAccepted", False)),
                "data_consent":  bool(item.get("dataConsent", False)),
                "created_at":    to_utc(item.get("createdAt")) or datetime.now(tz=timezone.utc),
                "updated_at":    to_utc(item.get("updatedAt")) or datetime.now(tz=timezone.utc),
            },
            "profile": {
                "user_id":          coerce_uuid(user_id_raw),
                "experience_level": int(item.get("level", 0)),
                "xp_earned":        int(item.get("xpEarned", 0)),
                "badges":           json.dumps(item.get("badges", [])),
                "preferred_lang":   item.get("preferredLang", "fr"),
                "created_at":       to_utc(item.get("createdAt")) or datetime.now(tz=timezone.utc),
                "updated_at":       to_utc(item.get("updatedAt")) or datetime.now(tz=timezone.utc),
            },
        }

    # ── USER#... / SESSION#{ts} → sessions ─────────────────────────────────
    if pk.startswith("USER#") and sk.startswith("SESSION#"):
        user_id_raw = pk.split("#", 1)[1]
        ts_raw = sk.split("#", 1)[1]
        return {
            "_target_table": "sessions",
            "session_id":    coerce_uuid(item.get("sessionId", f"{user_id_raw}-{ts_raw}")),
            "user_id":       coerce_uuid(user_id_raw),
            "scenario_id":   item.get("scenario") or item.get("scenarioId"),
            "user_response": item.get("userResponse"),
            "detection_score": float(item.get("score", 0)) if item.get("score") is not None else None,
            "xp_earned":     int(item.get("xp", 0)),
            "feedback":      item.get("feedback"),
            "image_analyzed": bool(item.get("imageAnalyzed", False)),
            "created_at":    to_utc(ts_raw) or datetime.now(tz=timezone.utc),
        }

    # ── USER#... / NOTIF_PREFS → notification_preferences ──────────────────
    if pk.startswith("USER#") and sk == "NOTIF_PREFS":
        user_id_raw = pk.split("#", 1)[1]
        return {
            "_target_table": "notification_preferences",
            "user_id":       coerce_uuid(user_id_raw),
            "sms_enabled":   bool(item.get("smsEnabled", True)),
            "email_enabled": bool(item.get("emailEnabled", True)),
            "push_enabled":  bool(item.get("pushEnabled", False)),
            "phone_number":  item.get("phone") or item.get("phoneNumber"),
            "preferences":   json.dumps(item.get("preferences", {}), cls=DecimalEncoder),
            "updated_at":    to_utc(item.get("updatedAt")) or datetime.now(tz=timezone.utc),
        }

    # ── FAMILY#{id} / MEMBER#{userId} → family_groups + family_members ─────
    if pk.startswith("FAMILY#") and sk.startswith("MEMBER#"):
        family_id_raw = pk.split("#", 1)[1]
        user_id_raw   = sk.split("#", 1)[1]
        return {
            "_target_table": "family_member_pair",
            "family": {
                "family_id":  coerce_uuid(family_id_raw),
                "name":       item.get("familyName", "Family"),
                "created_by": coerce_uuid(user_id_raw),
                "created_at": to_utc(item.get("createdAt")) or datetime.now(tz=timezone.utc),
            },
            "member": {
                "family_id": coerce_uuid(family_id_raw),
                "user_id":   coerce_uuid(user_id_raw),
                "role":      item.get("role", "member"),
                "joined_at": to_utc(item.get("joinedAt")) or datetime.now(tz=timezone.utc),
            },
        }

    # ── AUDIT#{userId} / {timestamp} → audit_log ───────────────────────────
    if pk.startswith("AUDIT#"):
        user_id_raw = pk.split("#", 1)[1]
        return {
            "_target_table": "audit_log",
            "log_id":    str(uuid.uuid5(uuid.NAMESPACE_OID, f"{pk}#{sk}")),
            "user_id":   coerce_uuid(user_id_raw),
            "action":    item.get("action", "UNKNOWN"),
            "resource":  item.get("resource"),
            "outcome":   item.get("outcome", "success"),
            "ip_address": item.get("ipAddress"),
            "metadata":  json.dumps(item.get("metadata", {}), cls=DecimalEncoder),
            "created_at": to_utc(sk) or datetime.now(tz=timezone.utc),
        }

    log.warning("Unrecognised pk/sk pattern — skipped: pk=%s sk=%s", pk, sk)
    return None


def transform_threat_item(item: dict) -> dict | None:
    """threats DynamoDB table → threats PostgreSQL table."""
    threat_id = item.get("threat_id")
    if not threat_id:
        log.warning("threats item missing threat_id, skipping: %s", item)
        return None
    return {
        "_target_table":   "threats",
        "threat_id":       str(threat_id),
        "threat_type":     item.get("threat_type", "Unknown"),
        "institution":     item.get("institution"),
        "threat_level":    item.get("threat_level", "medium"),
        "message":         item.get("message"),
        "explanation_fr":  item.get("explanation_fr"),
        "keywords":        list(item.get("keywords", [])),
        "regions":         list(item.get("regions", [])),
        "source":          item.get("source", "internal"),
        "is_scam":         bool(item.get("is_scam", True)),
        "threat_indicators": list(item.get("threat_indicators", [])),
        "expires_at":      to_utc(item.get("expires_at")),
        "date_detected":   to_utc(item.get("date_detected")) or datetime.now(tz=timezone.utc),
        "created_at":      to_utc(item.get("created_at")) or datetime.now(tz=timezone.utc),
    }


def transform_scenario_item(item: dict) -> dict | None:
    """threat_scenarios DynamoDB table → threat_scenarios PostgreSQL table."""
    scenario_id = item.get("scenario_id")
    version     = item.get("version", "1")
    if not scenario_id:
        log.warning("threat_scenarios item missing scenario_id, skipping: %s", item)
        return None
    return {
        "_target_table":    "threat_scenarios",
        "scenario_id":      str(scenario_id),
        "version":          str(version),
        "threat_type":      item.get("threat_type", "Unknown"),
        "institution":      item.get("institution"),
        "category":         item.get("category", "other"),
        "message":          item.get("message", ""),
        "is_scam":          bool(item.get("is_scam", True)),
        "explanation_fr":   item.get("explanation_fr"),
        "threat_indicators": list(item.get("threat_indicators", [])),
        "difficulty":       item.get("difficulty", "medium"),
        "created_at":       to_utc(item.get("created_at")) or datetime.now(tz=timezone.utc),
    }


def transform_interaction_item(item: dict) -> dict | None:
    """user_threats DynamoDB table → user_threats PostgreSQL table."""
    user_id   = item.get("user_id")
    threat_id = item.get("threat_id")
    if not user_id or not threat_id:
        log.warning("user_threats item missing user_id or threat_id, skipping: %s", item)
        return None
    return {
        "_target_table":        "user_threats",
        "user_id":              coerce_uuid(user_id),
        "threat_id":            str(threat_id),
        "matched_at":           to_utc(item.get("matched_at")) or datetime.now(tz=timezone.utc),
        "notification_sent":    bool(item.get("notification_sent", False)),
        "user_saw_notification": bool(item.get("user_saw_notification", False)),
    }


# ──────────────────────────────────────────────────────────────────────────────
# PostgreSQL insert functions
# ──────────────────────────────────────────────────────────────────────────────
def insert_batch(cursor, table: str, rows: list[dict]) -> int:
    """Batch insert rows into table. Skips duplicates (ON CONFLICT DO NOTHING)."""
    if not rows:
        return 0
    columns = list(rows[0].keys())
    col_str = ", ".join(columns)
    placeholder = ", ".join([f"%({c})s" for c in columns])
    sql = f"INSERT INTO {table} ({col_str}) VALUES ({placeholder}) ON CONFLICT DO NOTHING"
    psycopg2.extras.execute_batch(cursor, sql, rows, page_size=BATCH_SIZE)
    return len(rows)


def migrate_audit_log(cursor, rows: list[dict]) -> int:
    clean = [{k: v for k, v in r.items() if not k.startswith("_")} for r in rows]
    return insert_batch(cursor, "audit_log", clean)


def migrate_users_and_profiles(cursor, items: list[dict]) -> tuple[int, int]:
    users, profiles = [], []
    for item in items:
        if item.get("_target_table") == "user_profile_pair":
            users.append(item["user"])
            profiles.append(item["profile"])
    u_count = insert_batch(cursor, "users", users)
    p_count = insert_batch(cursor, "user_profiles", profiles)
    return u_count, p_count


def migrate_sessions(cursor, rows: list[dict]) -> int:
    clean = [{k: v for k, v in r.items() if not k.startswith("_")} for r in rows]
    return insert_batch(cursor, "sessions", clean)


def migrate_notif_prefs(cursor, rows: list[dict]) -> int:
    clean = [{k: v for k, v in r.items() if not k.startswith("_")} for r in rows]
    return insert_batch(cursor, "notification_preferences", clean)


def migrate_family(cursor, items: list[dict]) -> tuple[int, int]:
    groups_seen, families, members = set(), [], []
    for item in items:
        if item.get("_target_table") == "family_member_pair":
            family_id = item["family"]["family_id"]
            if family_id not in groups_seen:
                families.append(item["family"])
                groups_seen.add(family_id)
            members.append(item["member"])
    f_count = insert_batch(cursor, "family_groups", families)
    m_count = insert_batch(cursor, "family_members", members)
    return f_count, m_count


def migrate_threats(cursor, rows: list[dict]) -> int:
    clean = [{k: v for k, v in r.items() if not k.startswith("_")} for r in rows]
    return insert_batch(cursor, "threats", clean)


def migrate_scenarios(cursor, rows: list[dict]) -> int:
    clean = [{k: v for k, v in r.items() if not k.startswith("_")} for r in rows]
    return insert_batch(cursor, "threat_scenarios", clean)


def migrate_interactions(cursor, rows: list[dict]) -> int:
    clean = [{k: v for k, v in r.items() if not k.startswith("_")} for r in rows]
    return insert_batch(cursor, "user_threats", clean)


# ──────────────────────────────────────────────────────────────────────────────
# Verification
# ──────────────────────────────────────────────────────────────────────────────
def verify_counts(cursor, dynamo_counts: dict) -> bool:
    """Compare DynamoDB source counts to PostgreSQL row counts. Returns True if all match."""
    log.info("=" * 60)
    log.info("DATA INTEGRITY VERIFICATION")
    log.info("=" * 60)

    pg_query = """
        SELECT 'users'                  , COUNT(*) FROM users
        UNION ALL
        SELECT 'user_profiles'          , COUNT(*) FROM user_profiles
        UNION ALL
        SELECT 'sessions'               , COUNT(*) FROM sessions
        UNION ALL
        SELECT 'notification_preferences', COUNT(*) FROM notification_preferences
        UNION ALL
        SELECT 'threats'                , COUNT(*) FROM threats
        UNION ALL
        SELECT 'threat_scenarios'       , COUNT(*) FROM threat_scenarios
        UNION ALL
        SELECT 'user_threats'           , COUNT(*) FROM user_threats
        UNION ALL
        SELECT 'family_groups'          , COUNT(*) FROM family_groups
        UNION ALL
        SELECT 'family_members'         , COUNT(*) FROM family_members
        UNION ALL
        SELECT 'audit_log'              , COUNT(*) FROM audit_log
        ORDER BY 1
    """
    cursor.execute(pg_query)
    pg_counts = {row[0]: row[1] for row in cursor.fetchall()}

    all_ok = True
    for pg_table, pg_count in sorted(pg_counts.items()):
        source_count = dynamo_counts.get(pg_table, "N/A")
        status = "OK" if source_count == "N/A" or pg_count >= 0 else "MISMATCH"
        log.info("  %-30s pg=%4d  dynamo=%s  %s", pg_table, pg_count, source_count, status)

    # Specific checks against known DynamoDB source table counts
    checks = [
        ("audit_log", dynamo_counts.get("data_all"), "ScamGuardStack-DataTable items"),
        ("threats",   dynamo_counts.get("threats"),   "threats table items"),
        ("threat_scenarios", dynamo_counts.get("scenarios"), "threat_scenarios items"),
        ("user_threats", dynamo_counts.get("interactions"), "user_threats items"),
    ]
    for pg_table, expected, label in checks:
        if expected is None:
            continue
        actual = pg_counts.get(pg_table, 0)
        if actual < expected:
            log.error("  FAIL %s: expected >=%d (%s) got %d", pg_table, expected, label, actual)
            all_ok = False
        else:
            log.info("  PASS %s: %d >= %d (%s)", pg_table, actual, expected, label)

    log.info("=" * 60)
    return all_ok


# ──────────────────────────────────────────────────────────────────────────────
# Main orchestration
# ──────────────────────────────────────────────────────────────────────────────
def run_migration(
    secret_arn: str,
    endpoint: str,
    tables: list[str],
    dry_run: bool,
) -> None:
    session = get_boto_session()

    log.info("Phase 2 Migration — ScamGuard DynamoDB → Aurora PostgreSQL")
    log.info("Tables to migrate: %s", tables)
    log.info("Dry run: %s", dry_run)
    log.info("Target endpoint: %s", endpoint)

    # ── Step 1: Scan DynamoDB tables ─────────────────────────────────────────
    dynamo_items: dict[str, list[dict]] = {}
    dynamo_counts: dict[str, int] = {}

    if "data" in tables:
        log.info("Scanning DynamoDB: %s", DYNAMO_TABLES["data"])
        dynamo_items["data"] = dynamo_scan_all(DYNAMO_TABLES["data"], session)
        dynamo_counts["data_all"] = len(dynamo_items["data"])
        log.info("  Found %d items", dynamo_counts["data_all"])

    if "threats" in tables:
        log.info("Scanning DynamoDB: %s", DYNAMO_TABLES["threats"])
        dynamo_items["threats"] = dynamo_scan_all(DYNAMO_TABLES["threats"], session)
        dynamo_counts["threats"] = len(dynamo_items["threats"])
        log.info("  Found %d items", dynamo_counts["threats"])

    if "scenarios" in tables:
        log.info("Scanning DynamoDB: %s", DYNAMO_TABLES["scenarios"])
        dynamo_items["scenarios"] = dynamo_scan_all(DYNAMO_TABLES["scenarios"], session)
        dynamo_counts["scenarios"] = len(dynamo_items["scenarios"])
        log.info("  Found %d items", dynamo_counts["scenarios"])

    if "interactions" in tables:
        log.info("Scanning DynamoDB: %s", DYNAMO_TABLES["interactions"])
        dynamo_items["interactions"] = dynamo_scan_all(DYNAMO_TABLES["interactions"], session)
        dynamo_counts["interactions"] = len(dynamo_items["interactions"])
        log.info("  Found %d items", dynamo_counts["interactions"])

    # ── Step 2: Transform ────────────────────────────────────────────────────
    log.info("Transforming items...")

    transformed: dict[str, list[dict]] = {
        "users":         [],
        "user_profiles": [],
        "sessions":      [],
        "notif_prefs":   [],
        "family":        [],
        "audit_log":     [],
        "threats":       [],
        "scenarios":     [],
        "interactions":  [],
    }

    # Transform main data table
    for item in dynamo_items.get("data", []):
        result = transform_data_item(item)
        if result is None:
            continue
        target = result.get("_target_table")
        if target == "audit_log":
            transformed["audit_log"].append(result)
        elif target == "user_profile_pair":
            transformed["users"].append(result)   # handled specially during insert
        elif target == "sessions":
            transformed["sessions"].append(result)
        elif target == "notification_preferences":
            transformed["notif_prefs"].append(result)
        elif target == "family_member_pair":
            transformed["family"].append(result)

    # Transform threats / scenarios / interactions
    for item in dynamo_items.get("threats", []):
        result = transform_threat_item(item)
        if result:
            transformed["threats"].append(result)

    for item in dynamo_items.get("scenarios", []):
        result = transform_scenario_item(item)
        if result:
            transformed["scenarios"].append(result)

    for item in dynamo_items.get("interactions", []):
        result = transform_interaction_item(item)
        if result:
            transformed["interactions"].append(result)

    log.info("Transform summary:")
    for k, v in transformed.items():
        log.info("  %-20s %d rows", k, len(v))

    if dry_run:
        log.info("DRY RUN — no writes to PostgreSQL. Exiting.")
        return

    # ── Step 3: Insert into PostgreSQL ───────────────────────────────────────
    log.info("Connecting to Aurora at %s...", endpoint)
    conn = get_aurora_conn(secret_arn, endpoint, session)
    cursor = conn.cursor()

    try:
        # Insert order respects FK constraints:
        # threats must exist before user_threats
        # users must exist before sessions, notif_prefs, family_members, user_profiles

        log.info("Inserting threats (%d rows)...", len(transformed["threats"]))
        t_count = migrate_threats(cursor, transformed["threats"])

        log.info("Inserting threat_scenarios (%d rows)...", len(transformed["scenarios"]))
        s_count = migrate_scenarios(cursor, transformed["scenarios"])

        log.info("Inserting users and profiles (%d pairs)...", len(transformed["users"]))
        u_count, p_count = migrate_users_and_profiles(cursor, transformed["users"])

        log.info("Inserting sessions (%d rows)...", len(transformed["sessions"]))
        sess_count = migrate_sessions(cursor, transformed["sessions"])

        log.info("Inserting notification_preferences (%d rows)...", len(transformed["notif_prefs"]))
        np_count = migrate_notif_prefs(cursor, transformed["notif_prefs"])

        log.info("Inserting family groups/members (%d pairs)...", len(transformed["family"]))
        fg_count, fm_count = migrate_family(cursor, transformed["family"])

        log.info("Inserting audit_log (%d rows)...", len(transformed["audit_log"]))
        al_count = migrate_audit_log(cursor, transformed["audit_log"])

        log.info("Inserting user_threats (%d rows)...", len(transformed["interactions"]))
        ut_count = migrate_interactions(cursor, transformed["interactions"])

        conn.commit()
        log.info("All inserts committed successfully.")
        log.info("Insert counts: threats=%d scenarios=%d users=%d profiles=%d "
                 "sessions=%d notif_prefs=%d family_groups=%d family_members=%d "
                 "audit_log=%d user_threats=%d",
                 t_count, s_count, u_count, p_count, sess_count, np_count,
                 fg_count, fm_count, al_count, ut_count)

    except Exception as e:
        conn.rollback()
        log.error("Migration failed, transaction rolled back: %s", e)
        raise
    finally:
        cursor.close()
        conn.close()

    # ── Step 4: Verify ───────────────────────────────────────────────────────
    log.info("Running data integrity verification...")
    conn2 = get_aurora_conn(secret_arn, endpoint, session)
    cursor2 = conn2.cursor()
    try:
        ok = verify_counts(cursor2, dynamo_counts)
        if ok:
            log.info("MIGRATION COMPLETE — all integrity checks passed.")
        else:
            log.error("MIGRATION COMPLETE WITH WARNINGS — some counts did not match. Review log above.")
            sys.exit(1)
    finally:
        cursor2.close()
        conn2.close()


# ──────────────────────────────────────────────────────────────────────────────
# CLI entry point
# ──────────────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="ScamGuard DynamoDB → Aurora PostgreSQL migration"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Scan DynamoDB and run transforms, but do not write to PostgreSQL",
    )
    parser.add_argument(
        "--tables",
        nargs="+",
        choices=["data", "threats", "scenarios", "interactions"],
        default=["data", "threats", "scenarios", "interactions"],
        help="Which DynamoDB tables to migrate (default: all)",
    )
    args = parser.parse_args()

    # Required env vars (not needed for dry run)
    secret_arn = os.environ.get("AURORA_SECRET_ARN", "")
    endpoint   = os.environ.get("AURORA_ENDPOINT",   "")

    if not args.dry_run:
        if not secret_arn:
            log.error("AURORA_SECRET_ARN environment variable is required for a live run.")
            sys.exit(1)
        if not endpoint:
            log.error("AURORA_ENDPOINT environment variable is required for a live run.")
            sys.exit(1)

    run_migration(
        secret_arn=secret_arn,
        endpoint=endpoint,
        tables=args.tables,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
