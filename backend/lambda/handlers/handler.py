"""
ScamGuardFunction — main Lambda handler for ScamGuard MVP.

Routes all /api/v1/* requests (except auth, threats) to the correct
sub-handler.  Business logic (LLM analysis, scenario generation) is
reused from the existing lambda_ package unchanged.  Only
database operations are new — they query Aurora via pg8000.

HTTP API Gateway v2 event format is assumed.
"""

import json
import logging
import os
import sys
import uuid
from datetime import datetime
from typing import Any, Dict

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# Path adjustment: allow importing from the adjacent lambda_ package when
# running under SAM local (which sets PYTHONPATH to the CodeUri directory).
# In production Lambda the layer supplies the shared deps.
# ---------------------------------------------------------------------------
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from response import (  # noqa: E402 — local sibling
    bad_request,
    cors_preflight,
    created,
    error,
    extract_user_id,
    get_method,
    get_path,
    internal,
    not_found,
    ok,
    parse_body,
    unauthorized,
)
import db  # noqa: E402 — local sibling


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _cors(event: Dict) -> bool:
    return get_method(event) == "OPTIONS"


# ---------------------------------------------------------------------------
# Analysis  (POST /api/v1/analyze)
# ---------------------------------------------------------------------------

def handle_analyze(user_id: str, body: Dict, event: Dict) -> Dict:
    """
    Reuse the existing LLM analysis pipeline from lambda_/handler_llm.py.
    We call its internal functions directly to avoid re-implementing the
    OpenAI / Gemini / fallback chain.
    """
    try:
        from lambda_.handler_llm import (
            analyze_with_quebec_expert,
            analyze_with_openai,
            analyze_with_gemini,
            fallback_scam_detection,
            get_coaching_feedback,
        )
    except ImportError:
        logger.warning("lambda_/handler_llm not importable — using keyword fallback only")
        from lambda_.handler_llm import fallback_scam_detection, get_coaching_feedback  # type: ignore
        analyze_with_quebec_expert = None  # type: ignore
        analyze_with_openai = None  # type: ignore
        analyze_with_gemini = None  # type: ignore

    user_response = body.get("userResponse", body.get("message", ""))
    if not user_response:
        return bad_request("userResponse is required", "MISSING_FIELD")

    # Run LLM pipeline
    result = None
    if analyze_with_quebec_expert:
        result = analyze_with_quebec_expert(user_response)
    if not result and analyze_with_openai:
        result = analyze_with_openai(user_response)
    if not result and analyze_with_gemini:
        result = analyze_with_gemini(user_response)
    if not result:
        result = fallback_scam_detection(user_response)

    result["coaching"] = {
        "feedback": get_coaching_feedback(result),
        "xp_earned": 10 if result.get("risk_score", 50) > 60 else 5,
    }

    # Persist session to Aurora
    try:
        xp = result["coaching"]["xp_earned"]
        db.execute_write(
            """
            INSERT INTO sessions (
                session_id, user_id, user_response,
                detection_score, xp_earned, feedback, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                str(uuid.uuid4()),
                user_id,
                user_response[:2000],  # cap to column size
                result.get("risk_score", 50) / 100.0,
                xp,
                result.get("explanation", ""),
                datetime.utcnow(),
            ),
        )
        logger.info("Session persisted for user %s", user_id)
    except Exception as exc:
        # Non-fatal: persist failure should not fail the analysis response
        logger.error("Aurora session insert failed: %s", exc)

    return ok(
        {
            "detection": {
                "score": result.get("risk_score", 50),
                "is_scam": result.get("is_scam", False),
            },
            "coaching": result["coaching"],
            "explanation": result.get("explanation", ""),
        }
    )


# ---------------------------------------------------------------------------
# Scenario generation  (POST /api/v1/scenarios)
# ---------------------------------------------------------------------------

def handle_generate_scenario(user_id: str, body: Dict) -> Dict:
    """
    Generate a training scenario.  Reuses ScenarioAgent when available,
    falls back to a static pool for local SAM testing without API keys.
    """
    difficulty = body.get("difficulty", "medium")

    try:
        import boto3
        ssm = boto3.client("ssm", region_name=os.environ.get("AWS_REGION", "us-east-1"))
        gemini_key = ssm.get_parameter(
            Name=os.environ.get("GEMINI_PARAM", "/scamguard/gemini-key"),
            WithDecryption=True,
        )["Parameter"]["Value"]

        from lambda_.agents.scenario_agent import ScenarioAgent  # type: ignore
        agent = ScenarioAgent(api_key=gemini_key)
        result = agent.generate(difficulty=difficulty, user_id=user_id)
        return ok(result)

    except Exception as exc:
        logger.warning("ScenarioAgent unavailable (%s) — using static fallback", exc)

    import random
    scenarios = [
        {
            "title": "SMS Bancaire",
            "content": "ALERTE: Votre compte Desjardins a été suspendu. Cliquez ici pour vérifier: http://desjardins-securite.xyz",
            "difficulty": difficulty,
            "type": "smishing",
        },
        {
            "title": "Courriel Amazon",
            "content": "Votre commande Amazon a été retenue. Confirmez vos informations de paiement immédiatement pour éviter l'annulation.",
            "difficulty": difficulty,
            "type": "phishing",
        },
        {
            "title": "Appel ARC",
            "content": "Message de l'Agence du revenu du Canada: Une dette fiscale urgente nécessite un paiement immédiat par cartes-cadeaux.",
            "difficulty": difficulty,
            "type": "vishing",
        },
        {
            "title": "Loterie Provinciale",
            "content": "Félicitations! Vous avez gagné 50 000$ à Loto-Québec. Envoyez 250$ de frais de traitement pour recevoir votre prix.",
            "difficulty": difficulty,
            "type": "advance_fee",
        },
    ]
    return ok(random.choice(scenarios))


# ---------------------------------------------------------------------------
# User profile  (GET /api/v1/profile, PUT /api/v1/profile)
# ---------------------------------------------------------------------------

def handle_get_profile(user_id: str) -> Dict:
    """Fetch user profile and stats from Aurora."""
    try:
        row = db.execute_one(
            """
            SELECT
                u.user_id,
                u.email,
                u.created_at,
                COALESCE(p.xp_earned, 0)          AS xp_earned,
                COALESCE(p.experience_level, 0)    AS experience_level,
                COUNT(s.session_id)                AS sessions_count,
                COALESCE(AVG(s.detection_score), 0) AS avg_detection_score
            FROM users u
            LEFT JOIN user_profiles p ON p.user_id = u.user_id
            LEFT JOIN sessions s      ON s.user_id = u.user_id
            WHERE u.cognito_sub = %s
            GROUP BY u.user_id, u.email, u.created_at, p.xp_earned, p.experience_level
            """,
            (user_id,),
        )

        if not row:
            # First time: auto-provision user record
            _provision_user(user_id)
            return ok({
                "user_id": user_id,
                "xp_earned": 0,
                "experience_level": 0,
                "sessions_count": 0,
                "avg_detection_score": 0.0,
            })

        # Convert Decimal/datetime for JSON serialisation
        row["avg_detection_score"] = float(row["avg_detection_score"])
        return ok(row)

    except Exception as exc:
        logger.error("Profile fetch failed for %s: %s", user_id, exc)
        return internal(exc)


def _provision_user(cognito_sub: str) -> None:
    """Create user + profile rows on first login (best-effort)."""
    try:
        new_id = str(uuid.uuid4())
        now = datetime.utcnow()
        db.execute_write(
            "INSERT INTO users (user_id, email, cognito_sub, created_at, updated_at) VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING",
            (new_id, f"{cognito_sub}@placeholder.scamguard", cognito_sub, now, now),
        )
        db.execute_write(
            "INSERT INTO user_profiles (user_id, experience_level, xp_earned, created_at) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING",
            (new_id, 0, 0, now),
        )
        logger.info("Provisioned new user for cognito_sub %s", cognito_sub)
    except Exception as exc:
        logger.error("User provisioning failed: %s", exc)


def handle_put_profile(user_id: str, body: Dict) -> Dict:
    """Update user profile fields in Aurora."""
    try:
        xp = body.get("xp_earned")
        level = body.get("experience_level")

        if xp is None and level is None:
            return bad_request("Provide xp_earned and/or experience_level")

        # Resolve internal UUID from cognito_sub
        user_row = db.execute_one(
            "SELECT user_id FROM users WHERE cognito_sub = %s", (user_id,)
        )
        if not user_row:
            _provision_user(user_id)
            user_row = db.execute_one(
                "SELECT user_id FROM users WHERE cognito_sub = %s", (user_id,)
            )

        internal_id = user_row["user_id"]

        if xp is not None and level is not None:
            db.execute_write(
                "UPDATE user_profiles SET xp_earned = %s, experience_level = %s WHERE user_id = %s",
                (xp, level, internal_id),
            )
        elif xp is not None:
            db.execute_write(
                "UPDATE user_profiles SET xp_earned = %s WHERE user_id = %s", (xp, internal_id)
            )
        else:
            db.execute_write(
                "UPDATE user_profiles SET experience_level = %s WHERE user_id = %s",
                (level, internal_id),
            )

        return ok({"message": "Profile updated"})

    except Exception as exc:
        logger.error("Profile update failed for %s: %s", user_id, exc)
        return internal(exc)


# ---------------------------------------------------------------------------
# Notification preferences  (GET/PUT /api/v1/notifications/preferences)
# ---------------------------------------------------------------------------

def handle_get_notification_prefs(user_id: str) -> Dict:
    """Read notification preferences from Aurora."""
    try:
        user_row = db.execute_one(
            "SELECT user_id FROM users WHERE cognito_sub = %s", (user_id,)
        )
        if not user_row:
            # Return sensible defaults — no error
            return ok({
                "sms_enabled": True,
                "email_enabled": True,
                "preferences": {},
            })

        row = db.execute_one(
            "SELECT sms_enabled, email_enabled, preferences FROM notification_preferences WHERE user_id = %s",
            (user_row["user_id"],),
        )
        if not row:
            return ok({"sms_enabled": True, "email_enabled": True, "preferences": {}})

        return ok(row)

    except Exception as exc:
        logger.error("Notification prefs GET failed for %s: %s", user_id, exc)
        return internal(exc)


def handle_put_notification_prefs(user_id: str, body: Dict) -> Dict:
    """Upsert notification preferences in Aurora."""
    try:
        user_row = db.execute_one(
            "SELECT user_id FROM users WHERE cognito_sub = %s", (user_id,)
        )
        if not user_row:
            _provision_user(user_id)
            user_row = db.execute_one(
                "SELECT user_id FROM users WHERE cognito_sub = %s", (user_id,)
            )

        internal_id = user_row["user_id"]
        sms_enabled = body.get("smsAlertsEnabled", True)
        email_enabled = body.get("emailAlertsEnabled", True)
        preferences = body.get("preferences", {})
        now = datetime.utcnow()

        db.execute_write(
            """
            INSERT INTO notification_preferences (user_id, sms_enabled, email_enabled, preferences, updated_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                sms_enabled  = EXCLUDED.sms_enabled,
                email_enabled = EXCLUDED.email_enabled,
                preferences  = EXCLUDED.preferences,
                updated_at   = EXCLUDED.updated_at
            """,
            (internal_id, sms_enabled, email_enabled, json.dumps(preferences), now),
        )

        return ok({"message": "Preferences updated", "sms_enabled": sms_enabled, "email_enabled": email_enabled})

    except Exception as exc:
        logger.error("Notification prefs PUT failed for %s: %s", user_id, exc)
        return internal(exc)


# ---------------------------------------------------------------------------
# Analytics summary  (GET /api/v1/analytics/summary)
# ---------------------------------------------------------------------------

def handle_get_analytics(user_id: str) -> Dict:
    """Return aggregated session stats for the authenticated user."""
    try:
        user_row = db.execute_one(
            "SELECT user_id FROM users WHERE cognito_sub = %s", (user_id,)
        )
        if not user_row:
            return ok({"sessions_count": 0, "avg_detection_score": 0.0, "xp_earned": 0})

        internal_id = user_row["user_id"]

        stats = db.execute_one(
            """
            SELECT
                COUNT(s.session_id)                  AS sessions_count,
                COALESCE(AVG(s.detection_score), 0)  AS avg_detection_score,
                COALESCE(SUM(s.xp_earned), 0)        AS total_xp,
                COALESCE(p.xp_earned, 0)             AS profile_xp,
                COALESCE(p.experience_level, 0)      AS experience_level
            FROM users u
            LEFT JOIN sessions s       ON s.user_id = u.user_id
            LEFT JOIN user_profiles p  ON p.user_id = u.user_id
            WHERE u.user_id = %s
            GROUP BY p.xp_earned, p.experience_level
            """,
            (internal_id,),
        )

        if stats:
            stats["avg_detection_score"] = float(stats["avg_detection_score"])

        return ok(stats or {})

    except Exception as exc:
        logger.error("Analytics GET failed for %s: %s", user_id, exc)
        return internal(exc)


# ---------------------------------------------------------------------------
# Health check  (GET /health)
# ---------------------------------------------------------------------------

def handle_health() -> Dict:
    try:
        db.execute("SELECT 1")
        db_status = "ok"
    except Exception as exc:
        db_status = f"error: {exc}"

    return ok({"status": "ok", "environment": os.environ.get("ENVIRONMENT", "dev"), "db": db_status})


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

ROUTES = {
    ("POST", "/api/v1/analyze"): lambda uid, body, ev: handle_analyze(uid, body, ev),
    ("POST", "/api/v1/scenarios"): lambda uid, body, _: handle_generate_scenario(uid, body),
    ("GET",  "/api/v1/profile"):   lambda uid, body, _: handle_get_profile(uid),
    ("PUT",  "/api/v1/profile"):   lambda uid, body, _: handle_put_profile(uid, body),
    ("GET",  "/api/v1/notifications/preferences"): lambda uid, body, _: handle_get_notification_prefs(uid),
    # Express used POST for GET-like semantics on this endpoint — keep both
    ("POST", "/api/v1/notifications/preferences"): lambda uid, body, _: handle_get_notification_prefs(uid),
    ("PUT",  "/api/v1/notifications/preferences"): lambda uid, body, _: handle_put_notification_prefs(uid, body),
    ("GET",  "/api/v1/analytics/summary"):          lambda uid, body, _: handle_get_analytics(uid),
    ("GET",  "/health"):                            lambda uid, body, _: handle_health(),
}

# Endpoints that do NOT require Cognito auth
PUBLIC_ROUTES = {
    ("GET", "/health"),
}


def lambda_handler(event: Dict, context: Any) -> Dict:
    """Entry point for ScamGuardFunction."""
    if _cors(event):
        return cors_preflight()

    method = get_method(event)
    path = get_path(event)
    route_key = (method, path)

    logger.info("ScamGuardFunction: %s %s", method, path)

    handler_fn = ROUTES.get(route_key)
    if handler_fn is None:
        return not_found(f"Route {method} {path}")

    # Auth check — public routes skip user extraction
    if route_key in PUBLIC_ROUTES:
        user_id = None
    else:
        user_id = extract_user_id(event)
        if not user_id:
            return unauthorized()

    body = parse_body(event)

    try:
        return handler_fn(user_id, body, event)
    except Exception as exc:
        logger.exception("Unhandled exception in %s %s", method, path)
        return internal(exc)
