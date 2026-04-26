"""
VerifyOTPHandler — SMS OTP verification + family-user JWT issuance.

Route:
  POST /api/v1/auth/verify-otp

This handler is the family-auth entry point: a guardian or senior member
proves their phone number via OTP, and receives a JWT that includes their
family_id and role so downstream handlers (family_handler.py) can trust
the identity without another DB round-trip.

The JWT is signed with a HS256 secret stored in SSM Parameter Store
(path: /scamguard/jwt-secret, default: dev-only fallback). In production,
set JWT_SECRET_PARAM to the SSM path.

HTTP API Gateway v2 event format assumed.
"""

import json
import logging
import os
import sys
import time
import uuid
import hmac
import hashlib
import base64
from datetime import datetime, timezone, timedelta
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
    bad_request, cors_preflight, get_method, get_path,
    internal, ok, parse_body, unauthorized,
)
import db  # noqa: E402

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
JWT_EXPIRY_HOURS = 24
OTP_MAX_ATTEMPTS = 3
_JWT_SECRET: Optional[str] = None


def _get_jwt_secret() -> str:
    """Return JWT signing secret (module-level cached for warm reuse)."""
    global _JWT_SECRET
    if _JWT_SECRET is not None:
        return _JWT_SECRET

    # Try SSM first (production path)
    param_path = os.environ.get("JWT_SECRET_PARAM", "")
    if param_path:
        try:
            import boto3
            ssm = boto3.client("ssm", region_name=os.environ.get("AWS_REGION", "us-east-1"))
            resp = ssm.get_parameter(Name=param_path, WithDecryption=True)
            _JWT_SECRET = resp["Parameter"]["Value"]
            logger.info("JWT secret loaded from SSM: %s", param_path)
            return _JWT_SECRET
        except Exception as exc:
            logger.warning("SSM JWT secret fetch failed (%s) — using env fallback", exc)

    # Fallback: env var (dev / test) — refuse to use the literal default in prod
    secret = os.environ.get("JWT_SECRET", "")
    if not secret:
        env = os.environ.get("ENVIRONMENT", "dev")
        if env == "prod":
            raise RuntimeError("JWT_SECRET not configured for production environment")
        secret = "dev-insecure-secret-do-not-use-in-prod"
        logger.warning("Using hard-coded dev JWT secret — DO NOT use in production")

    _JWT_SECRET = secret
    return _JWT_SECRET


# ---------------------------------------------------------------------------
# JWT helpers  (HS256, no external library dependency)
# ---------------------------------------------------------------------------

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def generate_jwt(user_id: str, family_id: Optional[str], role: Optional[str]) -> str:
    """
    Generate a signed HS256 JWT.

    Payload claims:
      sub       — user UUID
      family_id — family UUID (may be null for users not yet in a family)
      role      — 'family' | 'senior' | None
      iat       — issued-at (Unix timestamp)
      exp       — expiry   (Unix timestamp, iat + JWT_EXPIRY_HOURS)
    """
    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "family_id": family_id,
        "role": role,
        "iat": now,
        "exp": now + JWT_EXPIRY_HOURS * 3600,
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_b64}.{payload_b64}"

    secret = _get_jwt_secret()
    sig = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    sig_b64 = _b64url_encode(sig)

    return f"{signing_input}.{sig_b64}"


def verify_jwt(token: str) -> Optional[Dict]:
    """
    Verify a JWT signature and expiry.

    Returns the decoded payload dict on success, None on failure.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}"

        secret = _get_jwt_secret()
        expected_sig = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
        expected_b64 = _b64url_encode(expected_sig)

        if not hmac.compare_digest(sig_b64, expected_b64):
            return None

        payload = json.loads(_b64url_decode(payload_b64))
        if int(time.time()) > payload.get("exp", 0):
            return None

        return payload
    except Exception:
        return None


# ---------------------------------------------------------------------------
# OTP store helpers  (Aurora — otp_tokens table)
# ---------------------------------------------------------------------------

def _get_otp(phone: str) -> Optional[Dict]:
    return db.execute_one(
        "SELECT code, expires_at, attempts FROM otp_tokens WHERE phone = %s",
        (phone,),
    )


def _increment_otp_attempt(phone: str) -> None:
    db.execute_write(
        "UPDATE otp_tokens SET attempts = attempts + 1 WHERE phone = %s",
        (phone,),
    )


def _delete_otp(phone: str) -> None:
    db.execute_write("DELETE FROM otp_tokens WHERE phone = %s", (phone,))


# ---------------------------------------------------------------------------
# User + family lookup
# ---------------------------------------------------------------------------

def _get_user_and_family(phone: str) -> Dict[str, Optional[str]]:
    """
    Return {'user_id': ..., 'family_id': ..., 'role': ...} for a phone number.
    Creates a minimal user row if none exists.
    """
    row = db.execute_one(
        "SELECT user_id FROM users WHERE phone = %s",
        (phone,),
    )

    if row:
        user_id = row["user_id"]
    else:
        # First-time login: provision user
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        db.execute_write(
            """
            INSERT INTO users (user_id, email, phone, cognito_sub, created_at, updated_at)
            VALUES (%s, %s, %s, NULL, %s, %s)
            ON CONFLICT DO NOTHING
            """,
            (user_id, f"{phone}@sms.scamguard", phone, now, now),
        )
        logger.info("[OTP] Provisioned new user %s for phone %s", user_id, phone[-4:])

    # Look up family membership
    membership = db.execute_one(
        "SELECT family_id, role FROM family_members WHERE user_id = %s",
        (user_id,),
    )

    return {
        "user_id": user_id,
        "family_id": membership["family_id"] if membership else None,
        "role": membership["role"] if membership else None,
    }


# ---------------------------------------------------------------------------
# Route handler
# ---------------------------------------------------------------------------

def handle_verify_otp(body: Dict) -> Dict:
    """POST /api/v1/auth/verify-otp."""
    phone = str(body.get("phone") or body.get("phoneNumber") or "").strip()
    code = str(body.get("code") or "").strip()
    family_id_hint = body.get("family_id")  # optional — caller may supply

    if not phone:
        return bad_request("phone is required", "MISSING_PHONE")
    if not code:
        return bad_request("code is required", "MISSING_CODE")

    # Normalise: strip non-digits, drop leading +1 / 1
    import re
    digits = re.sub(r"[^\d]", "", phone)
    if len(digits) == 11 and digits[0] == "1":
        digits = digits[1:]
    if len(digits) < 10:
        return bad_request("Invalid phone number format", "INVALID_PHONE")
    phone = digits

    # Fetch OTP record
    try:
        otp_record = _get_otp(phone)
    except Exception as exc:
        logger.error("[OTP] DB read failed: %s", exc)
        return internal(exc)

    if not otp_record:
        return bad_request("No OTP found for this number. Request a new code.", "OTP_NOT_FOUND")

    # Expiry check
    expires_at = otp_record["expires_at"]
    if hasattr(expires_at, "tzinfo") and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        _delete_otp(phone)
        return bad_request("OTP has expired. Please request a new code.", "OTP_EXPIRED")

    # Brute-force guard
    attempts = int(otp_record.get("attempts", 0))
    if attempts >= OTP_MAX_ATTEMPTS:
        _delete_otp(phone)
        return bad_request("Too many failed attempts. Request a new code.", "TOO_MANY_ATTEMPTS")

    # Code match
    if str(otp_record["code"]).strip() != code:
        try:
            _increment_otp_attempt(phone)
        except Exception:
            pass
        return unauthorized("Incorrect OTP code.")

    # Valid — consume OTP
    try:
        _delete_otp(phone)
    except Exception as exc:
        logger.warning("[OTP] Could not delete OTP for %s: %s", phone[-4:], exc)

    # Resolve user + family
    try:
        identity = _get_user_and_family(phone)
    except Exception as exc:
        logger.error("[OTP] Identity resolution failed: %s", exc)
        return internal(exc)

    user_id = identity["user_id"]
    resolved_family_id = identity["family_id"] or family_id_hint
    role = identity["role"]

    # Issue JWT
    try:
        token = generate_jwt(user_id, resolved_family_id, role)
    except Exception as exc:
        logger.error("[OTP] JWT generation failed: %s", exc)
        return internal(exc)

    logger.info(
        "[OTP] Verified for phone %s — user=%s family=%s role=%s",
        phone[-4:], user_id, resolved_family_id, role,
    )

    return ok({
        "token": token,
        "user_id": user_id,
        "family_id": resolved_family_id,
        "role": role,
        "message": "OTP verified successfully.",
    })


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

def lambda_handler(event: Dict, context: Any) -> Dict:
    """Entry point for VerifyOTPHandler Lambda."""
    method = get_method(event)
    if method == "OPTIONS":
        return cors_preflight()

    path = get_path(event)
    logger.info("VerifyOTPHandler: %s %s", method, path)

    if method == "POST" and path in ("/api/v1/auth/verify-otp", "/api/v1/auth/verify-sms-otp"):
        return handle_verify_otp(parse_body(event))

    from response import not_found
    return not_found(f"Route {method} {path}")
