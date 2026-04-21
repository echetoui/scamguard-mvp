"""
FamilyHandler — family group management for ScamGuard MVP.

Replaces dev-server.js family routes + DynamoDB lambda_/family_handler.py
with Aurora-backed storage.

Routes (all require JWT auth unless noted):
  GET  /api/v1/family/dashboard  — fetch family data for authenticated user
  POST /api/v1/family/create     — create a new family group
  POST /api/v1/family/join       — join a family using an invite code

Aurora tables required (from schema.sql):
  families(family_id, name, invite_code, created_by, created_at)
  family_members(family_id, user_id, role, joined_at)

HTTP API Gateway v2 event format assumed.
"""

import logging
import os
import random
import string
import sys
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

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
# Helpers
# ---------------------------------------------------------------------------

def _generate_invite_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=6))


def _get_user_email(user_id: str) -> str:
    """Fetch email from users table, or synthesise a placeholder."""
    row = db.execute_one("SELECT email FROM users WHERE user_id = %s OR cognito_sub = %s", (user_id, user_id))
    return row["email"] if row else f"{user_id[:8]}@scamguard.internal"


# ---------------------------------------------------------------------------
# Route handlers
# ---------------------------------------------------------------------------

def handle_get_dashboard(user_id: str) -> Dict:
    """GET /api/v1/family/dashboard."""
    try:
        # Resolve internal user UUID (may be cognito_sub or user_id)
        user_row = db.execute_one(
            "SELECT user_id, email FROM users WHERE user_id = %s OR cognito_sub = %s",
            (user_id, user_id),
        )
        internal_uid = user_row["user_id"] if user_row else user_id
        user_email = user_row["email"] if user_row else f"{user_id[:8]}@scamguard.internal"

        # Find membership
        membership = db.execute_one(
            "SELECT fm.family_id, fm.role FROM family_members fm WHERE fm.user_id = %s",
            (internal_uid,),
        )
        if not membership:
            return not_found("family")

        family_id = membership["family_id"]
        current_role = membership["role"]

        family = db.execute_one(
            "SELECT family_id, name, invite_code, created_at FROM families WHERE family_id = %s",
            (family_id,),
        )
        if not family:
            return not_found("family")

        # Members list
        members = db.execute(
            """
            SELECT
                fm.user_id, fm.role, fm.joined_at,
                u.email
            FROM family_members fm
            LEFT JOIN users u ON u.user_id = fm.user_id
            WHERE fm.family_id = %s
            ORDER BY fm.joined_at ASC
            """,
            (family_id,),
        )

        member_list = [
            {
                "userId":     m["user_id"],
                "email":      m.get("email") or f"{m['user_id'][:8]}@scamguard.internal",
                "role":       m["role"],
                "joinedAt":   str(m.get("joined_at", "")),
                "lastActive": str(m.get("joined_at", "")),  # placeholder — add last_active col in Phase 4
            }
            for m in members
        ]

        return ok({
            "familyName":        family["name"],
            "inviteCode":        family["invite_code"],
            "members":           member_list,
            "threats":           [],  # populated by Phase 5 threat-sharing feature
            "currentUserRole":   current_role,
            "currentUserEmail":  user_email,
        })

    except Exception as exc:
        logger.error("family dashboard failed for %s: %s", user_id, exc)
        return internal(exc)


def handle_create_family(user_id: str, body: Dict) -> Dict:
    """POST /api/v1/family/create."""
    family_name = (body.get("familyName") or body.get("family_name") or "Ma famille").strip()[:100]

    try:
        # Resolve internal user UUID
        user_row = db.execute_one(
            "SELECT user_id FROM users WHERE user_id = %s OR cognito_sub = %s",
            (user_id, user_id),
        )
        internal_uid = user_row["user_id"] if user_row else user_id

        # Check already in a family
        existing = db.execute_one(
            "SELECT family_id FROM family_members WHERE user_id = %s", (internal_uid,)
        )
        if existing:
            return bad_request("Vous êtes déjà dans une famille.", "ALREADY_IN_FAMILY")

        family_id = str(uuid.uuid4())
        invite_code = _generate_invite_code()
        now = datetime.utcnow()

        db.execute_write(
            """
            INSERT INTO families (family_id, name, invite_code, created_by, created_at)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (family_id, family_name, invite_code, internal_uid, now),
        )
        db.execute_write(
            """
            INSERT INTO family_members (family_id, user_id, role, joined_at)
            VALUES (%s, %s, 'family', %s)
            """,
            (family_id, internal_uid, now),
        )

        logger.info("[FAMILY] Created %s by %s", family_id, internal_uid)

        return created({
            "familyId":   family_id,
            "inviteCode": invite_code,
            "message":    "Famille créée avec succès.",
        })

    except Exception as exc:
        logger.error("family create failed for %s: %s", user_id, exc)
        return internal(exc)


def handle_join_family(user_id: str, body: Dict) -> Dict:
    """POST /api/v1/family/join."""
    invite_code = (body.get("inviteCode") or body.get("invite_code") or "").strip().upper()
    if not invite_code:
        return bad_request("inviteCode est requis", "MISSING_INVITE_CODE")

    try:
        # Resolve internal user UUID
        user_row = db.execute_one(
            "SELECT user_id FROM users WHERE user_id = %s OR cognito_sub = %s",
            (user_id, user_id),
        )
        internal_uid = user_row["user_id"] if user_row else user_id

        # Check already in a family
        existing = db.execute_one(
            "SELECT family_id FROM family_members WHERE user_id = %s", (internal_uid,)
        )
        if existing:
            return bad_request("Vous êtes déjà dans une famille.", "ALREADY_IN_FAMILY")

        # Find family by invite code
        family = db.execute_one(
            "SELECT family_id FROM families WHERE invite_code = %s", (invite_code,)
        )
        if not family:
            return not_found("invite code")

        family_id = family["family_id"]
        now = datetime.utcnow()

        db.execute_write(
            """
            INSERT INTO family_members (family_id, user_id, role, joined_at)
            VALUES (%s, %s, 'senior', %s)
            ON CONFLICT DO NOTHING
            """,
            (family_id, internal_uid, now),
        )

        logger.info("[FAMILY] User %s joined family %s", internal_uid, family_id)

        return ok({"familyId": family_id, "message": "Vous avez rejoint la famille avec succès."})

    except Exception as exc:
        logger.error("family join failed for %s: %s", user_id, exc)
        return internal(exc)


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

ROUTES = {
    ("GET",  "/api/v1/family/dashboard"): lambda uid, body, _: handle_get_dashboard(uid),
    ("POST", "/api/v1/family/create"):    lambda uid, body, _: handle_create_family(uid, body),
    ("POST", "/api/v1/family/join"):      lambda uid, body, _: handle_join_family(uid, body),
}


def lambda_handler(event: Dict, context: Any) -> Dict:
    """Entry point for FamilyHandler Lambda."""
    method = get_method(event)
    if method == "OPTIONS":
        return cors_preflight()

    path = get_path(event)
    route_key = (method, path)

    logger.info("FamilyHandler: %s %s", method, path)

    handler_fn = ROUTES.get(route_key)
    if handler_fn is None:
        return not_found(f"Route {method} {path}")

    user_id = extract_user_id(event)
    if not user_id:
        return unauthorized()

    body = parse_body(event)

    try:
        return handler_fn(user_id, body, event)
    except Exception as exc:
        logger.exception("Unhandled exception in FamilyHandler %s %s", method, path)
        return internal(exc)
