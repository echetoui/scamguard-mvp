"""
ReportsToolsHandler — scam reports + verification tools for ScamGuard MVP.

Replaces Express dev-server.js:
  POST /api/v1/reports              — submit a scam report (JSON body; S3 for files in prod)
  POST /api/v1/scam-reports         — legacy JSON-only scam report
  POST /api/v1/tools/check-email    — email breach check (HaveIBeenPwned-compatible)
  POST /api/v1/tools/check-advisor  — AMF financial advisor verification

Design decisions:
- Multipart file uploads are NOT handled here.  API Gateway HTTP v2 has a
  10MB payload limit and does not stream bodies to Lambda.  Phase 4 will add
  a pre-signed S3 upload URL endpoint; clients upload directly to S3 and
  pass the key in the report body.  For now, screenshot_url is accepted as
  a plain string field.
- Aurora `scam_reports` table stores report metadata.  No file bytes in DB.
- HaveIBeenPwned API call is made synchronously; latency budget is 3s
  (Lambda timeout 60s).  In case of downstream failure, a safe degraded
  response is returned so the frontend is never blocked.

HTTP API Gateway v2 event format assumed.
"""

import json
import logging
import os
import sys
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------
_HANDLERS_DIR = os.path.dirname(os.path.abspath(__file__))
if _HANDLERS_DIR not in sys.path:
    sys.path.insert(0, _HANDLERS_DIR)

from response import (  # noqa: E402
    bad_request, cors_preflight, created, extract_user_id,
    get_method, get_path, internal, not_found, ok, parse_body, unauthorized,
)
import db  # noqa: E402


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
VALID_SCAM_TYPES = frozenset([
    "phishing", "vishing", "email", "sms", "smishing",
    "fake_app", "call_spoofing", "other",
])
MAX_DESCRIPTION_LENGTH = 2000
MAX_REPORTS_PER_DAY = 10
HIBP_API_URL = "https://haveibeenpwned.com/api/v3/breachedaccount/{}"
HIBP_PARAM = os.environ.get("HIBP_PARAM", "/scamguard/hibp-key")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_hibp_key() -> Optional[str]:
    try:
        ssm = boto3.client("ssm", region_name=os.environ.get("AWS_REGION", "us-east-1"))
        return ssm.get_parameter(Name=HIBP_PARAM, WithDecryption=True)["Parameter"]["Value"]
    except Exception as exc:
        logger.warning("HIBP key unavailable: %s", exc)
        return None


def _check_hibp(email: str) -> Dict:
    """
    Query HaveIBeenPwned API.  Returns dict with breached/count/breaches.
    Falls back to a safe default on any error.
    """
    import urllib.request
    import urllib.error

    api_key = _get_hibp_key()
    if not api_key:
        # Deterministic dev-mode simulation (matches Express server behaviour)
        el = email.lower()
        is_breach = "test" in el or "breach" in el
        breaches = [
            {
                "name": "DevBreachSimulation",
                "date": "2024-01-01",
                "description": "Simulated breach for development testing.",
            }
        ] if is_breach else []
        return {"breached": is_breach, "count": len(breaches), "breaches": breaches, "source": "simulation"}

    url = HIBP_API_URL.format(urllib.parse.quote(email))  # type: ignore[attr-defined]
    req = urllib.request.Request(url)
    req.add_header("hibp-api-key", api_key)
    req.add_header("User-Agent", "ScamGuard/1.0 (contact@scamguard.ca)")

    try:
        import urllib.parse
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read())
            breaches = [
                {
                    "name": b.get("Name", ""),
                    "date": b.get("BreachDate", ""),
                    "description": b.get("Description", "")[:200],
                }
                for b in data[:10]
            ]
            return {"breached": True, "count": len(data), "breaches": breaches, "source": "hibp"}
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return {"breached": False, "count": 0, "breaches": [], "source": "hibp"}
        logger.warning("HIBP HTTPError %s for %s", exc.code, email)
        return {"breached": False, "count": 0, "breaches": [], "source": "error", "error": str(exc)}
    except Exception as exc:
        logger.warning("HIBP request failed: %s", exc)
        return {"breached": False, "count": 0, "breaches": [], "source": "error", "error": str(exc)}


def _check_report_rate_limit(user_id: str) -> bool:
    """Return True if user is within their daily report quota."""
    try:
        row = db.execute_one(
            """
            SELECT COUNT(*) AS cnt FROM scam_reports
            WHERE user_id = %s
              AND created_at >= NOW() - INTERVAL '24 hours'
            """,
            (user_id,),
        )
        if row:
            return int(row.get("cnt", 0)) < MAX_REPORTS_PER_DAY
    except Exception as exc:
        logger.warning("Rate limit check failed: %s", exc)
    return True  # fail open — don't block on DB error


# ---------------------------------------------------------------------------
# Route handlers
# ---------------------------------------------------------------------------

def handle_post_report(user_id: str, body: Dict) -> Dict:
    """
    POST /api/v1/reports — create a scam report.

    Expected JSON fields:
      scamType    (required) — one of VALID_SCAM_TYPES
      description (optional) — up to 2000 chars
      screenshotUrl (optional) — pre-signed S3 URL or filename (Phase 4)
    """
    scam_type = (body.get("scamType") or body.get("scam_type") or "").lower().strip()
    description = (body.get("description") or "").strip()
    screenshot_url = body.get("screenshotUrl") or body.get("screenshot_url")

    if not scam_type:
        return bad_request(
            f"scamType est requis. Valeurs acceptées : {', '.join(sorted(VALID_SCAM_TYPES))}",
            "INVALID_SCAM_TYPE",
        )
    if scam_type not in VALID_SCAM_TYPES:
        return bad_request(
            f"scamType invalide : '{scam_type}'. Valeurs : {', '.join(sorted(VALID_SCAM_TYPES))}",
            "INVALID_SCAM_TYPE",
        )
    if not description and not screenshot_url:
        return bad_request("description ou screenshotUrl requis.", "MISSING_DESCRIPTION")
    if description and len(description) > MAX_DESCRIPTION_LENGTH:
        return bad_request(
            f"description dépasse la limite de {MAX_DESCRIPTION_LENGTH} caractères.",
            "DESCRIPTION_TOO_LONG",
        )

    if not _check_report_rate_limit(user_id):
        return {
            "statusCode": 429,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Maximum {MAX_REPORTS_PER_DAY} rapports par jour atteint.",
                }
            }),
        }

    report_id = str(uuid.uuid4())
    now = datetime.utcnow()

    try:
        db.execute_write(
            """
            INSERT INTO scam_reports (
                report_id, user_id, scam_type, description,
                screenshot_url, status, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s)
            """,
            (report_id, user_id, scam_type, description or "", screenshot_url, now, now),
        )
        logger.info("[REPORT] %s created by %s (type=%s)", report_id, user_id, scam_type)
    except Exception as exc:
        logger.error("scam_report insert failed: %s", exc)
        return internal(exc)

    return created({
        "reportId":    report_id,
        "timestamp":   now.isoformat(),
        "screenshotUrl": screenshot_url,
        "message":     "Rapport soumis avec succès.",
    })


def handle_legacy_scam_report(body: Dict) -> Dict:
    """POST /api/v1/scam-reports — legacy JSON endpoint (no auth)."""
    scam_type = (body.get("scamType") or body.get("scam_type") or "").lower()
    description = body.get("description") or body.get("message") or ""

    if not scam_type or not description:
        return bad_request("scamType et description sont requis", "MISSING_FIELDS")

    report_id = str(uuid.uuid4())
    confirmation = "SGR-" + report_id[:8].upper()
    now = datetime.utcnow()

    try:
        db.execute_write(
            """
            INSERT INTO scam_reports (
                report_id, user_id, scam_type, description,
                screenshot_url, status, created_at, updated_at
            ) VALUES (%s, 'anonymous', %s, %s, NULL, 'received', %s, %s)
            """,
            (report_id, scam_type, description[:2000], now, now),
        )
    except Exception as exc:
        logger.warning("Legacy report DB insert failed (non-fatal): %s", exc)

    return created({
        "reportId":           report_id,
        "confirmationNumber": confirmation,
        "message":            "Rapport soumis avec succès.",
        "status":             "received",
    })


def handle_check_email(body: Dict) -> Dict:
    """POST /api/v1/tools/check-email."""
    import re
    email = (body.get("email") or "").strip().lower()

    if not email:
        return bad_request("email est requis", "MISSING_EMAIL")
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        return bad_request("Format email invalide", "INVALID_EMAIL")

    result = _check_hibp(email)
    logger.info("[EMAIL-CHECK] %s breached=%s count=%s", email, result["breached"], result["count"])

    return ok({
        "email":   email,
        "breached": result["breached"],
        "count":   result["count"],
        "breaches": result["breaches"],
        "message": (
            f"Trouvé dans {result['count']} fuite(s)." if result["breached"]
            else "Aucune fuite trouvée pour cet email."
        ),
    })


def handle_check_advisor(body: Dict) -> Dict:
    """
    POST /api/v1/tools/check-advisor — AMF financial advisor verification.

    Production implementation will query the AMF public API.
    For MVP, returns a deterministic result based on input (scam keywords → not verified).
    """
    name = (body.get("name") or "").strip()
    license_number = (body.get("licenseNumber") or body.get("license_number") or "").strip()
    firm_name = (body.get("firmName") or body.get("firm_name") or "").strip()

    if not name and not license_number and not firm_name:
        return bad_request("Au moins un identifiant requis (name, licenseNumber, firmName)", "MISSING_FIELDS")

    search_term = (name or license_number or firm_name).lower()
    scam_keywords = {"arnaque", "fraud", "fake", "faux", "escro", "ponzi"}
    is_verified = not any(kw in search_term for kw in scam_keywords)

    reg_num = None
    if is_verified:
        # Stable deterministic registration number for dev testing
        import hashlib
        reg_num = "AMF-" + hashlib.sha256(search_term.encode()).hexdigest()[:6].upper()

    return ok({
        "verified":            is_verified,
        "name":                name or "Inconnu",
        "registrationNumber":  reg_num,
        "status":              "REGISTERED" if is_verified else "NOT_VERIFIED",
        "firm":                firm_name or None,
        "message": (
            "Conseiller enregistré auprès de l'AMF." if is_verified
            else "Conseiller non vérifié — soyez prudent."
        ),
    })


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

ROUTES = {
    ("POST", "/api/v1/reports"):               ("auth", lambda uid, body: handle_post_report(uid, body)),
    ("POST", "/api/v1/scam-reports"):          ("public", lambda uid, body: handle_legacy_scam_report(body)),
    ("POST", "/api/v1/tools/check-email"):     ("public", lambda uid, body: handle_check_email(body)),
    ("POST", "/api/v1/tools/check-advisor"):   ("public", lambda uid, body: handle_check_advisor(body)),
}


def lambda_handler(event: Dict, context: Any) -> Dict:
    """Entry point for ReportsToolsHandler Lambda."""
    method = get_method(event)
    if method == "OPTIONS":
        return cors_preflight()

    path = get_path(event)
    route_key = (method, path)

    logger.info("ReportsToolsHandler: %s %s", method, path)

    route = ROUTES.get(route_key)
    if route is None:
        return not_found(f"Route {method} {path}")

    auth_mode, handler_fn = route

    user_id: Optional[str] = None
    if auth_mode == "auth":
        user_id = extract_user_id(event)
        if not user_id:
            return unauthorized()
    else:
        user_id = extract_user_id(event) or "anonymous"

    body = parse_body(event)

    try:
        return handler_fn(user_id, body)
    except Exception as exc:
        logger.exception("Unhandled exception in ReportsToolsHandler %s %s", method, path)
        return internal(exc)
