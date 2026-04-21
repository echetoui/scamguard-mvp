"""
ThreatsHandler — threat feed + matching for ScamGuard MVP.

Replaces DynamoDB-backed lambda_/threats_handler.py with Aurora queries.
Quebec fraud alerts (in-process static data) are unchanged.

Routes:
  GET  /api/v1/threats              — paginated threat list
  GET  /api/v1/threats/{threat_id}  — single threat detail
  POST /api/v1/threats/match        — match threats to user profile
  GET  /api/v1/threats/feed         — weekly digest (recent + high severity)

All routes are public (no JWT required) matching existing behaviour.
"""

import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------
_HANDLERS_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(os.path.dirname(_HANDLERS_DIR))
for _p in (_HANDLERS_DIR, _BACKEND_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from response import (  # noqa: E402
    bad_request, cors_preflight, get_method, get_path,
    internal, not_found, ok, parse_body,
)
import db  # noqa: E402

# Quebec fraud alerts — static in-process data, no DB required
try:
    from lambda_.quebec_fraud_alerts import (  # type: ignore
        get_recent_quebec_alerts,
        get_quebec_alerts_by_level,
    )
except ImportError:
    def get_recent_quebec_alerts(days: int = 7) -> List:  # type: ignore
        return []
    def get_quebec_alerts_by_level(level: str = None) -> List:  # type: ignore
        return []


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _row_to_threat(row: Dict) -> Dict:
    """Normalise an Aurora threats row to the API shape."""
    return {
        "threat_id":   row.get("threat_id"),
        "title":       row.get("title", ""),
        "description": row.get("description", ""),
        "category":    row.get("category", ""),
        "severity":    row.get("severity", "medium"),
        "source":      row.get("source", "ScamGuard"),
        "created_at":  str(row.get("created_at", "")),
        "updated_at":  str(row.get("updated_at", "")),
        "active":      row.get("active", True),
        "metadata":    row.get("metadata") or {},
    }


def _threat_static_pool() -> List[Dict]:
    """
    Minimal static fallback used when the Aurora threats table is empty
    (e.g., immediately after migration with no seeded data).
    """
    return [
        {
            "threat_id":   "static-001",
            "title":       "Fausse alerte CRA / ARC",
            "description": "Appel frauduleux prétendant être l'Agence du revenu du Canada exigeant un paiement immédiat par cartes-cadeaux.",
            "category":    "vishing",
            "severity":    "high",
            "source":      "ScamGuard-Static",
            "created_at":  "2025-01-01T00:00:00Z",
            "updated_at":  "2025-01-01T00:00:00Z",
            "active":      True,
            "metadata":    {},
        },
        {
            "threat_id":   "static-002",
            "title":       "Hameçonnage Desjardins",
            "description": "SMS prétendant que votre compte Desjardins a été suspendu avec un lien malveillant.",
            "category":    "smishing",
            "severity":    "high",
            "source":      "ScamGuard-Static",
            "created_at":  "2025-01-01T00:00:00Z",
            "updated_at":  "2025-01-01T00:00:00Z",
            "active":      True,
            "metadata":    {},
        },
        {
            "threat_id":   "static-003",
            "title":       "Arnaque Amazon",
            "description": "Courriel prétendant que votre commande Amazon est retenue demandant vos informations de paiement.",
            "category":    "phishing",
            "severity":    "medium",
            "source":      "ScamGuard-Static",
            "created_at":  "2025-01-01T00:00:00Z",
            "updated_at":  "2025-01-01T00:00:00Z",
            "active":      True,
            "metadata":    {},
        },
    ]


# ---------------------------------------------------------------------------
# Route handlers
# ---------------------------------------------------------------------------

def handle_list_threats(event: Dict) -> Dict:
    """GET /api/v1/threats — paginated list."""
    params = event.get("queryStringParameters") or {}
    category = params.get("category")
    severity = params.get("severity")
    limit = min(int(params.get("limit", 20)), 100)
    offset = int(params.get("offset", 0))

    try:
        where_clauses = ["active = true"]
        args = []

        if category:
            where_clauses.append("category = %s")
            args.append(category)
        if severity:
            where_clauses.append("severity = %s")
            args.append(severity)

        where = " AND ".join(where_clauses)
        rows = db.execute(
            f"""
            SELECT threat_id, title, description, category, severity, source, created_at, updated_at, active, metadata
            FROM threats
            WHERE {where}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            tuple(args) + (limit, offset),
        )

        if not rows:
            rows = _threat_static_pool()
            # Apply filters to static pool
            if category:
                rows = [r for r in rows if r["category"] == category]
            if severity:
                rows = [r for r in rows if r["severity"] == severity]
            rows = rows[offset: offset + limit]

        threats = [_row_to_threat(r) for r in rows]

        # Augment with Quebec-specific alerts (always fresh, in-process)
        quebec_alerts = get_recent_quebec_alerts(days=7)
        return ok({
            "threats": threats,
            "quebec_alerts": quebec_alerts[:5],
            "count": len(threats),
            "offset": offset,
            "limit": limit,
        })

    except Exception as exc:
        logger.error("list_threats failed: %s", exc)
        # Graceful degradation — return static pool + Quebec alerts
        return ok({
            "threats": _threat_static_pool(),
            "quebec_alerts": get_recent_quebec_alerts(days=7)[:5],
            "count": len(_threat_static_pool()),
            "offset": 0,
            "limit": limit,
        })


def handle_get_threat(threat_id: str) -> Dict:
    """GET /api/v1/threats/{threat_id}."""
    try:
        row = db.execute_one(
            "SELECT * FROM threats WHERE threat_id = %s", (threat_id,)
        )
        if not row:
            # Check static pool
            for t in _threat_static_pool():
                if t["threat_id"] == threat_id:
                    return ok(t)
            return not_found(f"Threat {threat_id}")
        return ok(_row_to_threat(row))
    except Exception as exc:
        logger.error("get_threat failed for %s: %s", threat_id, exc)
        return internal(exc)


def handle_match_threats(body: Dict) -> Dict:
    """POST /api/v1/threats/match — return threats relevant to user profile."""
    categories = body.get("categories", [])
    risk_level = body.get("risk_level", "medium")

    try:
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        target_severity = ["critical", "high"] if risk_level in ("high", "critical") else ["high", "medium"]

        where_parts = ["active = true", "severity = ANY(%s)"]
        args: list = [target_severity]

        if categories:
            where_parts.append("category = ANY(%s)")
            args.append(categories)

        rows = db.execute(
            f"""
            SELECT threat_id, title, description, category, severity, source, created_at, updated_at, active, metadata
            FROM threats
            WHERE {' AND '.join(where_parts)}
            ORDER BY CASE severity
                WHEN 'critical' THEN 0
                WHEN 'high'     THEN 1
                WHEN 'medium'   THEN 2
                ELSE 3
            END, created_at DESC
            LIMIT 10
            """,
            tuple(args),
        )

        if not rows:
            rows = [t for t in _threat_static_pool() if t["severity"] in target_severity]

        return ok({
            "matched_threats": [_row_to_threat(r) for r in rows],
            "count": len(rows),
            "risk_level": risk_level,
        })

    except Exception as exc:
        logger.error("match_threats failed: %s", exc)
        return internal(exc)


def handle_threat_feed(event: Dict) -> Dict:
    """GET /api/v1/threats/feed — weekly digest."""
    try:
        rows = db.execute(
            """
            SELECT threat_id, title, description, category, severity, source, created_at, updated_at, active, metadata
            FROM threats
            WHERE active = true
              AND created_at >= NOW() - INTERVAL '7 days'
            ORDER BY CASE severity
                WHEN 'critical' THEN 0
                WHEN 'high'     THEN 1
                ELSE 2
            END, created_at DESC
            LIMIT 10
            """,
        )

        if not rows:
            rows = _threat_static_pool()

        quebec_alerts = get_recent_quebec_alerts(days=7)
        high_alerts = get_quebec_alerts_by_level("high")

        return ok({
            "weekly_threats": [_row_to_threat(r) for r in rows],
            "quebec_alerts": quebec_alerts[:3],
            "high_priority_alerts": high_alerts[:2],
            "period_days": 7,
        })

    except Exception as exc:
        logger.error("threat_feed failed: %s", exc)
        return ok({
            "weekly_threats": _threat_static_pool(),
            "quebec_alerts": get_recent_quebec_alerts(days=7)[:3],
            "high_priority_alerts": [],
            "period_days": 7,
        })


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

def lambda_handler(event: Dict, context: Any) -> Dict:
    """Entry point for ThreatsHandler Lambda."""
    method = get_method(event)
    if method == "OPTIONS":
        return cors_preflight()

    path = get_path(event)
    logger.info("ThreatsHandler: %s %s", method, path)

    # Route matching — order matters (most specific first)
    if method == "POST" and path == "/api/v1/threats/match":
        return handle_match_threats(parse_body(event))

    if method == "GET" and path == "/api/v1/threats/feed":
        return handle_threat_feed(event)

    if method == "GET" and path == "/api/v1/threats":
        return handle_list_threats(event)

    if method == "GET" and path.startswith("/api/v1/threats/"):
        threat_id = path.split("/api/v1/threats/")[-1]
        if threat_id:
            return handle_get_threat(threat_id)

    return not_found(f"Route {method} {path}")
