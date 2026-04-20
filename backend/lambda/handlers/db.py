"""
Aurora PostgreSQL connection management for Lambda.

Uses pg8000 (pure Python — no C extensions, works in Lambda without
a custom build layer). Credentials are read from Secrets Manager on
first call and cached for the lifetime of the warm execution environment.

Connection pool is a simple singleton: one connection per Lambda worker.
RDS Proxy sits in front of Aurora and handles the real pool; Lambda
just needs one healthy connection per instance.
"""

import json
import logging
import os
import time
from typing import Any, Dict, Optional

import boto3
import pg8000.native

logger = logging.getLogger(__name__)

# Module-level cache — survives across warm invocations of the same worker.
_db_conn: Optional[pg8000.native.Connection] = None
_secret_cache: Optional[Dict[str, Any]] = None
_secret_cached_at: float = 0
SECRET_TTL_SECONDS = 300  # Re-fetch secret every 5 minutes


def _get_secret() -> Dict[str, Any]:
    """Fetch and cache Aurora credentials from Secrets Manager."""
    global _secret_cache, _secret_cached_at

    now = time.time()
    if _secret_cache and (now - _secret_cached_at) < SECRET_TTL_SECONDS:
        return _secret_cache

    secret_arn = os.environ["AURORA_SECRET_ARN"]
    client = boto3.client("secretsmanager", region_name=os.environ.get("AWS_REGION", "us-east-1"))

    response = client.get_secret_value(SecretId=secret_arn)
    secret = json.loads(response["SecretString"])

    _secret_cache = secret
    _secret_cached_at = now
    logger.info("Aurora credentials refreshed from Secrets Manager")
    return secret


def get_connection() -> pg8000.native.Connection:
    """
    Return a live pg8000 connection to Aurora.

    Reconnects if the existing connection is broken (e.g., Aurora paused
    due to inactivity and resumed, or VPC connection recycled).
    """
    global _db_conn

    # Test if existing connection is still alive
    if _db_conn is not None:
        try:
            _db_conn.run("SELECT 1")
            return _db_conn
        except Exception:
            logger.warning("Existing Aurora connection dead — reconnecting")
            try:
                _db_conn.close()
            except Exception:
                pass
            _db_conn = None

    secret = _get_secret()
    host = os.environ.get(
        "AURORA_ENDPOINT",
        "scamguard-dev.cluster-cw98uiiykmn9.us-east-1.rds.amazonaws.com",
    )
    database = os.environ.get("AURORA_DATABASE", "scamguard")

    _db_conn = pg8000.native.Connection(
        host=host,
        port=int(secret.get("port", 5432)),
        database=database,
        user=secret["username"],
        password=secret["password"],
        ssl_context=True,  # Aurora requires TLS
        timeout=10,
    )

    logger.info("Aurora connection established to %s/%s", host, database)
    return _db_conn


def execute(sql: str, params: tuple = ()) -> list:
    """Execute a query and return all rows as a list of dicts."""
    conn = get_connection()
    rows = conn.run(sql, *params)
    if not rows:
        return []
    cols = [c["name"] for c in conn.columns]
    return [dict(zip(cols, row)) for row in rows]


def execute_one(sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """Execute a query and return the first row as a dict, or None."""
    results = execute(sql, params)
    return results[0] if results else None


def execute_write(sql: str, params: tuple = ()) -> None:
    """Execute a write statement (INSERT / UPDATE / DELETE)."""
    conn = get_connection()
    conn.run(sql, *params)
