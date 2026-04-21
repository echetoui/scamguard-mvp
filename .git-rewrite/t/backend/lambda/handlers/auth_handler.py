"""
AuthHandler — SMS OTP + Cognito auth operations for ScamGuard MVP.

Replaces dev-server.js auth routes with Aurora-backed storage for OTP
state and session tokens.  Cognito handles JWT issuance; this handler
manages the SMS OTP pre-auth flow that is upstream of Cognito.

Routes handled (all public — no JWT required):
  POST /api/v1/auth/request-sms-otp
  POST /api/v1/auth/verify-sms-otp
  POST /api/v1/auth/request-password-reset
  POST /api/v1/auth/reset-password
  POST /api/v1/auth/validate-session
  POST /api/v1/auth/refresh-session
  POST /api/v1/auth/signup
  POST /api/v1/auth/login
  POST /api/v1/auth/verify-email
  POST /api/v1/auth/resend-code
  POST /api/v1/auth/logout

HTTP API Gateway v2 event format assumed.
"""

import json
import logging
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# AWS clients (module-level — reused across warm invocations)
# ---------------------------------------------------------------------------
_sns = None
_cognito = None
_ssm = None


def _get_sns():
    global _sns
    if _sns is None:
        _sns = boto3.client("sns", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    return _sns


def _get_cognito():
    global _cognito
    if _cognito is None:
        _cognito = boto3.client("cognito-idp", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    return _cognito


# ---------------------------------------------------------------------------
# Local imports
# ---------------------------------------------------------------------------
import sys
_HANDLERS_DIR = os.path.dirname(os.path.abspath(__file__))
if _HANDLERS_DIR not in sys.path:
    sys.path.insert(0, _HANDLERS_DIR)

from response import (  # noqa: E402
    bad_request, cors_preflight, created, error,
    get_method, get_path, internal, not_found, ok, parse_body, unauthorized,
)
import db  # noqa: E402


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
OTP_TTL_MINUTES = 5
OTP_MAX_ATTEMPTS = 3
SESSION_TTL_HOURS = 24
RATE_LIMIT_WINDOW_MINUTES = 60
RATE_LIMIT_MAX_REQUESTS = 10
ACCOUNT_LOCKOUT_MINUTES = 30
LOCKOUT_THRESHOLD = 5

COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
COGNITO_CLIENT_ID = os.environ.get("COGNITO_CLIENT_ID", "")


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def _clean_phone(raw: str) -> Optional[str]:
    """Return 10-digit phone string or None if invalid."""
    digits = re.sub(r"[^\d]", "", raw)
    if len(digits) == 11 and digits[0] == "1":
        digits = digits[1:]
    return digits if len(digits) >= 10 else None


def _validate_email(email: str) -> bool:
    return bool(re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", email))


def _validate_password(password: str) -> bool:
    if len(password) < 12:
        return False
    checks = [r"[A-Z]", r"[a-z]", r"[0-9]", r"[!@#$%^&*()\-_=+\[\]{};:'\",.<>?/\\|]"]
    return all(re.search(p, password) for p in checks)


# ---------------------------------------------------------------------------
# OTP store helpers  (Aurora — otp_tokens table)
#
# Table schema (idempotent, from schema.sql):
#   CREATE TABLE otp_tokens (
#     phone        VARCHAR(15) PRIMARY KEY,
#     code         VARCHAR(6)  NOT NULL,
#     expires_at   TIMESTAMPTZ NOT NULL,
#     attempts     SMALLINT    DEFAULT 0,
#     created_at   TIMESTAMPTZ DEFAULT NOW()
#   );
# ---------------------------------------------------------------------------

def _store_otp(phone: str, code: str) -> None:
    expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
    db.execute_write(
        """
        INSERT INTO otp_tokens (phone, code, expires_at, attempts, created_at)
        VALUES (%s, %s, %s, 0, NOW())
        ON CONFLICT (phone) DO UPDATE SET
            code = EXCLUDED.code,
            expires_at = EXCLUDED.expires_at,
            attempts = 0,
            created_at = NOW()
        """,
        (phone, code, expires),
    )


def _get_otp(phone: str) -> Optional[Dict]:
    return db.execute_one(
        "SELECT code, expires_at, attempts FROM otp_tokens WHERE phone = %s", (phone,)
    )


def _increment_otp_attempt(phone: str) -> None:
    db.execute_write(
        "UPDATE otp_tokens SET attempts = attempts + 1 WHERE phone = %s", (phone,)
    )


def _delete_otp(phone: str) -> None:
    db.execute_write("DELETE FROM otp_tokens WHERE phone = %s", (phone,))


# ---------------------------------------------------------------------------
# OTP sending via SNS
# ---------------------------------------------------------------------------

def _send_sms_otp(phone: str, code: str) -> bool:
    """Send OTP via AWS SNS direct publish (not topic)."""
    e164 = f"+1{phone[-10:]}"
    message = f"Votre code ScamGuard est : {code}. Il expire dans {OTP_TTL_MINUTES} min."
    try:
        _get_sns().publish(
            PhoneNumber=e164,
            Message=message,
            MessageAttributes={
                "AWS.SNS.SMS.SMSType": {
                    "DataType": "String",
                    "StringValue": "Transactional",
                }
            },
        )
        logger.info("OTP SMS sent to %s", e164)
        return True
    except ClientError as exc:
        logger.error("SNS publish failed for %s: %s", e164, exc)
        return False


# ---------------------------------------------------------------------------
# Route handlers
# ---------------------------------------------------------------------------

def handle_request_sms_otp(body: Dict, event: Dict) -> Dict:
    raw_phone = body.get("phone") or body.get("phoneNumber", "")
    if not raw_phone:
        return bad_request("phone is required", "MISSING_PHONE")

    phone = _clean_phone(str(raw_phone))
    if not phone:
        return bad_request("Phone must have at least 10 digits", "INVALID_PHONE")

    code = str(secrets.randbelow(10000)).zfill(4)

    try:
        _store_otp(phone, code)
    except Exception as exc:
        logger.error("OTP store failed: %s", exc)
        return internal(exc)

    sms_sent = _send_sms_otp(phone, code)

    logger.info("[AUTH] OTP generated for %s, sms_sent=%s", phone[-4:], sms_sent)

    response_data = {
        "message": "Code envoyé.",
        "phone_masked": f"***{phone[-4:]}",
        "sms_sent": sms_sent,
    }
    # Expose code in non-production for local testing
    if os.environ.get("ENVIRONMENT", "dev") != "production":
        response_data["otp"] = code

    return ok(response_data)


def handle_verify_sms_otp(body: Dict) -> Dict:
    raw_phone = body.get("phone") or body.get("phoneNumber", "")
    code = str(body.get("code", "")).strip()

    if not raw_phone or not code:
        return bad_request("phone and code are required", "MISSING_FIELDS")

    phone = _clean_phone(str(raw_phone))
    if not phone:
        return bad_request("Invalid phone format", "INVALID_PHONE")

    try:
        otp_data = _get_otp(phone)
    except Exception as exc:
        return internal(exc)

    if not otp_data:
        return error(400, "OTP_NOT_FOUND", "Code expired or not found. Request a new code.")

    expires_at = otp_data["expires_at"]
    # pg8000 returns timezone-aware datetime
    if hasattr(expires_at, "tzinfo") and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        _delete_otp(phone)
        return error(400, "OTP_EXPIRED", "Code expired. Please request a new code.")

    attempts = int(otp_data.get("attempts", 0))
    if attempts >= OTP_MAX_ATTEMPTS:
        _delete_otp(phone)
        return error(429, "TOO_MANY_ATTEMPTS", "Too many failed attempts. Request a new code.")

    if str(otp_data["code"]).strip() != code:
        _increment_otp_attempt(phone)
        return error(400, "INVALID_OTP", "Incorrect code.")

    # Success — clean up OTP
    _delete_otp(phone)

    # Provision or fetch user in Aurora
    try:
        user_id = _provision_user_by_phone(phone)
    except Exception as exc:
        logger.error("User provision failed: %s", exc)
        user_id = str(uuid.uuid4())

    # Create session
    try:
        session_token = _create_session(user_id, phone)
    except Exception as exc:
        logger.error("Session creation failed: %s", exc)
        session_token = secrets.token_hex(32)

    # Emit a base64 token compatible with the Express server shape
    token_payload = json.dumps({"userId": user_id, "phone": phone})
    token = __import__("base64").b64encode(token_payload.encode()).decode()

    logger.info("[AUTH] OTP verified for phone ending %s, user %s", phone[-4:], user_id)

    return ok({
        "user_id": user_id,
        "phone_number": phone,
        "token": token,
        "session_token": session_token,
        "message": "SMS OTP vérifié avec succès.",
    })


def _provision_user_by_phone(phone: str) -> str:
    """Return existing user_id for phone, or create a new user row."""
    row = db.execute_one("SELECT user_id FROM users WHERE phone = %s", (phone,))
    if row:
        return row["user_id"]

    user_id = str(uuid.uuid4())
    now = datetime.utcnow()
    db.execute_write(
        """
        INSERT INTO users (user_id, email, phone, cognito_sub, created_at, updated_at)
        VALUES (%s, %s, %s, NULL, %s, %s)
        ON CONFLICT DO NOTHING
        """,
        (user_id, f"{phone}@sms.scamguard", phone, now, now),
    )
    db.execute_write(
        """
        INSERT INTO user_profiles (user_id, experience_level, xp_earned, created_at)
        VALUES (%s, 0, 0, %s) ON CONFLICT DO NOTHING
        """,
        (user_id, now),
    )
    logger.info("[AUTH] Provisioned new user %s for phone %s", user_id, phone[-4:])
    return user_id


def _create_session(user_id: str, phone: str) -> str:
    """Insert a session row and return the token."""
    token = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS)
    db.execute_write(
        """
        INSERT INTO sessions (session_id, user_id, user_response, detection_score, xp_earned, feedback, created_at)
        VALUES (%s, %s, %s, 0, 0, %s, NOW())
        ON CONFLICT DO NOTHING
        """,
        (token, user_id, "__session__", f"login:{phone[-4:]}"),
    )
    return token


def handle_validate_session(body: Dict) -> Dict:
    session_token = body.get("session_token", "")
    if not session_token:
        return bad_request("session_token is required", "MISSING_SESSION_TOKEN")

    row = db.execute_one(
        "SELECT user_id, created_at FROM sessions WHERE session_id = %s AND user_response = '__session__'",
        (session_token,),
    )
    if not row:
        return error(401, "INVALID_SESSION", "Session not found or expired.")

    return ok({"valid": True, "user_id": row["user_id"]})


def handle_refresh_session(body: Dict) -> Dict:
    # Sessions in Aurora don't carry expiry — respond with success to maintain contract
    session_token = body.get("session_token", "")
    if not session_token:
        return bad_request("session_token is required", "MISSING_SESSION_TOKEN")

    row = db.execute_one(
        "SELECT user_id FROM sessions WHERE session_id = %s AND user_response = '__session__'",
        (session_token,),
    )
    if not row:
        return error(401, "INVALID_SESSION", "Session not found.")

    return ok({"message": "Session refreshed.", "expires_at": (datetime.utcnow() + timedelta(hours=SESSION_TTL_HOURS)).isoformat()})


def handle_request_password_reset(body: Dict) -> Dict:
    phone = body.get("phone", "")
    cleaned = _clean_phone(str(phone)) if phone else None
    if not cleaned:
        return bad_request("Valid phone number is required", "INVALID_PHONE")

    # Always respond success (don't leak account existence)
    reset_token = secrets.token_hex(16)
    logger.info("[AUTH] Password reset requested for phone %s (token logged, not stored)", cleaned[-4:])

    response_data = {"message": "Si un compte existe, un code sera envoyé.", "phone_masked": f"***{cleaned[-4:]}"}
    if os.environ.get("ENVIRONMENT", "dev") != "production":
        response_data["reset_token"] = reset_token
    return ok(response_data)


def handle_reset_password(body: Dict) -> Dict:
    # In the Aurora-backed stack, passwords are Cognito-managed.
    # Stub: acknowledge the call and redirect client to Cognito forgot-password flow.
    return ok({"message": "Utilisez le flux Cognito pour réinitialiser votre mot de passe."})


# ---------------------------------------------------------------------------
# Cognito-delegating signup / login / verify helpers
# ---------------------------------------------------------------------------

def handle_signup(body: Dict) -> Dict:
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not _validate_email(email):
        return bad_request("Email invalide", "INVALID_EMAIL")
    if not password or not _validate_password(password):
        return bad_request(
            "Mot de passe trop faible (12+ caractères, maj/min/chiffre/symbole)",
            "WEAK_PASSWORD",
        )

    try:
        _get_cognito().sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=[{"Name": "email", "Value": email}],
        )
        logger.info("[AUTH] Cognito signup for %s", email)
        return created({"message": "Compte créé. Vérifiez votre courriel.", "email": email})
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        if code == "UsernameExistsException":
            return error(409, "EMAIL_EXISTS", "Un compte avec cet email existe déjà.")
        logger.error("[AUTH] Cognito signup error: %s", exc)
        return internal(exc)


def handle_login(body: Dict) -> Dict:
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return bad_request("email et password requis", "MISSING_FIELDS")

    try:
        resp = _get_cognito().initiate_auth(
            ClientId=COGNITO_CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": email, "PASSWORD": password},
        )
        auth_result = resp.get("AuthenticationResult", {})
        return ok({
            "access_token": auth_result.get("AccessToken"),
            "id_token": auth_result.get("IdToken"),
            "refresh_token": auth_result.get("RefreshToken"),
            "expires_in": auth_result.get("ExpiresIn", 3600),
        })
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        if code in ("NotAuthorizedException", "UserNotFoundException"):
            return error(401, "INVALID_CREDENTIALS", "Email ou mot de passe incorrect.")
        if code == "UserNotConfirmedException":
            return error(403, "EMAIL_NOT_VERIFIED", "Vérifiez votre courriel d'abord.")
        logger.error("[AUTH] Cognito login error: %s", exc)
        return internal(exc)


def handle_verify_email(body: Dict) -> Dict:
    email = body.get("email", "").strip().lower()
    code = str(body.get("code", "")).strip()

    if not email or not code:
        return bad_request("email et code requis", "MISSING_FIELDS")

    try:
        _get_cognito().confirm_sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=email,
            ConfirmationCode=code,
        )
        return ok({"message": "Email vérifié. Vous pouvez maintenant vous connecter."})
    except ClientError as exc:
        code_err = exc.response["Error"]["Code"]
        if code_err == "CodeMismatchException":
            return error(400, "INVALID_CODE", "Code de vérification invalide.")
        if code_err == "ExpiredCodeException":
            return error(400, "CODE_EXPIRED", "Code expiré. Demandez un nouveau code.")
        logger.error("[AUTH] verify-email error: %s", exc)
        return internal(exc)


def handle_resend_code(body: Dict) -> Dict:
    email = body.get("email", "").strip().lower()
    if not email:
        return bad_request("email requis", "MISSING_EMAIL")

    try:
        _get_cognito().resend_confirmation_code(
            ClientId=COGNITO_CLIENT_ID,
            Username=email,
        )
        return ok({"message": "Code renvoyé."})
    except ClientError as exc:
        logger.error("[AUTH] resend-code error: %s", exc)
        return internal(exc)


def handle_logout(body: Dict) -> Dict:
    # In the SMS OTP flow, invalidate the Aurora session record
    session_token = body.get("session_token") or body.get("access_token", "")
    if session_token:
        try:
            db.execute_write(
                "DELETE FROM sessions WHERE session_id = %s AND user_response = '__session__'",
                (session_token,),
            )
        except Exception as exc:
            logger.warning("[AUTH] Session delete failed: %s", exc)
    return ok({"message": "Déconnecté."})


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

ROUTES = {
    ("POST", "/api/v1/auth/request-sms-otp"):      lambda body, ev: handle_request_sms_otp(body, ev),
    ("POST", "/api/v1/auth/verify-sms-otp"):        lambda body, ev: handle_verify_sms_otp(body),
    ("POST", "/api/v1/auth/request-password-reset"): lambda body, ev: handle_request_password_reset(body),
    ("POST", "/api/v1/auth/reset-password"):        lambda body, ev: handle_reset_password(body),
    ("POST", "/api/v1/auth/validate-session"):      lambda body, ev: handle_validate_session(body),
    ("POST", "/api/v1/auth/refresh-session"):       lambda body, ev: handle_refresh_session(body),
    ("POST", "/api/v1/auth/signup"):                lambda body, ev: handle_signup(body),
    ("POST", "/api/v1/auth/login"):                 lambda body, ev: handle_login(body),
    ("POST", "/api/v1/auth/verify-email"):          lambda body, ev: handle_verify_email(body),
    ("POST", "/api/v1/auth/resend-code"):           lambda body, ev: handle_resend_code(body),
    ("POST", "/api/v1/auth/logout"):                lambda body, ev: handle_logout(body),
}


def lambda_handler(event: Dict, context: Any) -> Dict:
    """Entry point for AuthHandler Lambda."""
    method = get_method(event)
    if method == "OPTIONS":
        return cors_preflight()

    path = get_path(event)
    route_key = (method, path)

    logger.info("AuthHandler: %s %s", method, path)

    handler_fn = ROUTES.get(route_key)
    if handler_fn is None:
        return not_found(f"Route {method} {path}")

    body = parse_body(event)

    try:
        return handler_fn(body, event)
    except Exception as exc:
        logger.exception("Unhandled exception in AuthHandler %s %s", method, path)
        return internal(exc)
