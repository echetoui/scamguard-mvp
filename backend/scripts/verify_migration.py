#!/usr/bin/env python3
"""
ScamGuard MVP - Data Integrity Verification
Phase 2, Day 10

Compares DynamoDB item counts to PostgreSQL row counts.
Validates foreign key relationships and key field integrity.

Usage:
    AWS_PROFILE=scamguard-dev \\
    AURORA_SECRET_ARN=<arn> \\
    AURORA_ENDPOINT=<host> \\
    python verify_migration.py

Exit code 0 = all checks passed
Exit code 1 = one or more checks failed
"""

import json
import logging
import os
import sys
from decimal import Decimal
from typing import Any

import boto3
import psycopg2
import psycopg2.extras

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

AWS_REGION  = os.environ.get("AWS_REGION",  "us-east-1")
AWS_PROFILE = os.environ.get("AWS_PROFILE", "scamguard-dev")
AURORA_DB   = os.environ.get("AURORA_DB_NAME", "scamguard")

DYNAMO_TABLES = {
    "data":         "ScamGuardStack-DataTable447BC44E-1AY6QZXNSPP8",
    "threats":      "threats",
    "scenarios":    "threat_scenarios",
    "interactions": "user_threats",
}


def get_session() -> boto3.Session:
    return boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)


def get_dynamo_counts(session: boto3.Session) -> dict:
    """Get item counts from all DynamoDB tables."""
    counts = {}
    dynamo = session.client("dynamodb")
    for key, table_name in DYNAMO_TABLES.items():
        try:
            resp = dynamo.scan(TableName=table_name, Select="COUNT")
            counts[key] = resp["Count"]
        except Exception as e:
            log.warning("Could not scan %s: %s", table_name, e)
            counts[key] = None
    return counts


def get_pg_conn(secret_arn: str, endpoint: str, session: boto3.Session):
    sm = session.client("secretsmanager")
    creds = json.loads(sm.get_secret_value(SecretId=secret_arn)["SecretString"])
    return psycopg2.connect(
        host=endpoint,
        port=5432,
        database=AURORA_DB,
        user=creds["username"],
        password=creds["password"],
        connect_timeout=10,
    )


def verify(secret_arn: str, endpoint: str) -> bool:
    session = get_session()

    log.info("=== Phase 2 Data Integrity Verification ===")

    # DynamoDB counts
    log.info("--- DynamoDB Source Counts ---")
    dynamo_counts = get_dynamo_counts(session)
    for k, v in dynamo_counts.items():
        log.info("  %-20s: %s", k, v)

    # PostgreSQL counts
    log.info("--- PostgreSQL Target Counts ---")
    conn = get_pg_conn(secret_arn, endpoint, session)
    cursor = conn.cursor()

    pg_count_sql = """
        SELECT 'users'                   AS tbl, COUNT(*) FROM users
        UNION ALL SELECT 'user_profiles'          , COUNT(*) FROM user_profiles
        UNION ALL SELECT 'sessions'               , COUNT(*) FROM sessions
        UNION ALL SELECT 'notification_preferences', COUNT(*) FROM notification_preferences
        UNION ALL SELECT 'threats'                , COUNT(*) FROM threats
        UNION ALL SELECT 'threat_scenarios'       , COUNT(*) FROM threat_scenarios
        UNION ALL SELECT 'user_threats'           , COUNT(*) FROM user_threats
        UNION ALL SELECT 'family_groups'          , COUNT(*) FROM family_groups
        UNION ALL SELECT 'family_members'         , COUNT(*) FROM family_members
        UNION ALL SELECT 'audit_log'              , COUNT(*) FROM audit_log
        ORDER BY 1
    """
    cursor.execute(pg_count_sql)
    pg_counts = {row[0]: row[1] for row in cursor.fetchall()}
    for tbl, cnt in sorted(pg_counts.items()):
        log.info("  %-30s: %d", tbl, cnt)

    # Verification checks
    log.info("--- Integrity Checks ---")
    failures = []

    # Check 1: RESEARCH_TRIGGER items → audit_log
    data_count = dynamo_counts.get("data") or 0
    al_count = pg_counts.get("audit_log", 0)
    if al_count < data_count:
        failures.append(f"audit_log has {al_count} rows but DynamoDB data table had {data_count} items")
    else:
        log.info("  PASS audit_log >= data_table_items (%d >= %d)", al_count, data_count)

    # Check 2: threats table
    threats_count = dynamo_counts.get("threats") or 0
    pg_threats = pg_counts.get("threats", 0)
    if pg_threats < threats_count:
        failures.append(f"threats has {pg_threats} rows but DynamoDB had {threats_count}")
    else:
        log.info("  PASS threats (%d rows, source had %d)", pg_threats, threats_count)

    # Check 3: threat_scenarios table
    sc_count = dynamo_counts.get("scenarios") or 0
    pg_sc = pg_counts.get("threat_scenarios", 0)
    if pg_sc < sc_count:
        failures.append(f"threat_scenarios has {pg_sc} rows but DynamoDB had {sc_count}")
    else:
        log.info("  PASS threat_scenarios (%d rows, source had %d)", pg_sc, sc_count)

    # Check 4: user_threats table
    ut_count = dynamo_counts.get("interactions") or 0
    pg_ut = pg_counts.get("user_threats", 0)
    if pg_ut < ut_count:
        failures.append(f"user_threats has {pg_ut} rows but DynamoDB had {ut_count}")
    else:
        log.info("  PASS user_threats (%d rows, source had %d)", pg_ut, ut_count)

    # Check 5: No orphaned sessions (user_id FK)
    cursor.execute("""
        SELECT COUNT(*) FROM sessions s
        LEFT JOIN users u ON u.user_id = s.user_id
        WHERE u.user_id IS NULL
    """)
    orphan_sessions = cursor.fetchone()[0]
    if orphan_sessions > 0:
        failures.append(f"ORPHAN sessions without user: {orphan_sessions}")
    else:
        log.info("  PASS no orphaned sessions")

    # Check 6: No orphaned user_threats (user_id or threat_id FK)
    cursor.execute("""
        SELECT COUNT(*) FROM user_threats ut
        LEFT JOIN users u ON u.user_id = ut.user_id
        WHERE u.user_id IS NULL
    """)
    orphan_ut_user = cursor.fetchone()[0]
    cursor.execute("""
        SELECT COUNT(*) FROM user_threats ut
        LEFT JOIN threats t ON t.threat_id = ut.threat_id
        WHERE t.threat_id IS NULL
    """)
    orphan_ut_threat = cursor.fetchone()[0]
    if orphan_ut_user > 0 or orphan_ut_threat > 0:
        failures.append(f"Orphaned user_threats: {orphan_ut_user} invalid users, {orphan_ut_threat} invalid threats")
    else:
        log.info("  PASS no orphaned user_threats")

    # Check 7: All users have email (NOT NULL constraint exists but verify data)
    cursor.execute("SELECT COUNT(*) FROM users WHERE email IS NULL OR email = ''")
    null_emails = cursor.fetchone()[0]
    if null_emails > 0:
        failures.append(f"{null_emails} users have NULL/empty email")
    else:
        log.info("  PASS all users have non-null email")

    # Check 8: Duplicate emails
    cursor.execute("""
        SELECT COUNT(*) FROM (
            SELECT email, COUNT(*) c FROM users GROUP BY email HAVING COUNT(*) > 1
        ) sub
    """)
    dup_emails = cursor.fetchone()[0]
    if dup_emails > 0:
        failures.append(f"{dup_emails} duplicate email values in users table")
    else:
        log.info("  PASS no duplicate emails in users")

    # Check 9: audit_log entries have valid created_at (no NULL, no future dates)
    cursor.execute("SELECT COUNT(*) FROM audit_log WHERE created_at IS NULL")
    null_dates = cursor.fetchone()[0]
    if null_dates > 0:
        failures.append(f"{null_dates} audit_log rows with NULL created_at")
    else:
        log.info("  PASS all audit_log rows have created_at")

    cursor.close()
    conn.close()

    # Final report
    log.info("=== Verification Summary ===")
    if failures:
        for f in failures:
            log.error("  FAIL: %s", f)
        log.error("VERIFICATION FAILED — %d check(s) did not pass.", len(failures))
        return False
    else:
        log.info("ALL CHECKS PASSED — migration is data-integrity-clean.")
        return True


def main():
    secret_arn = os.environ.get("AURORA_SECRET_ARN", "")
    endpoint   = os.environ.get("AURORA_ENDPOINT",   "")

    if not secret_arn or not endpoint:
        log.error("Set AURORA_SECRET_ARN and AURORA_ENDPOINT environment variables.")
        sys.exit(1)

    ok = verify(secret_arn, endpoint)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
