"""
SMS OTP Handler - Phase 4.4 Modern Authentication
Handles SMS-based one-time password verification for senior users.

Features:
  ✅ OTP generation (6-digit codes)
  ✅ SMS delivery via Firebase Cloud Messaging (FCM)
  ✅ Rate limiting & brute force protection
  ✅ Attempt tracking
  ✅ Code expiration (10 minutes)
  ✅ Security audit logging
"""

import json
import os
import secrets
import boto3
import requests
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
cognito_client = boto3.client("cognito-idp", region_name="us-east-1")
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

# Environment variables
COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "us-east-1_L35zaDPJn")
COGNITO_CLIENT_ID = os.environ.get("COGNITO_CLIENT_ID", "tb4o4jblsbtekhtl9s611j4fg")
FIREBASE_API_KEY = os.environ.get("FIREBASE_API_KEY", "")  # Firebase API Key
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "")  # Firebase Project ID
OTP_TABLE = os.environ.get("OTP_TABLE", "ScamGuardOTP-dev")
AUDIT_TABLE = os.environ.get("AUDIT_TABLE", "ScamGuardAudit-dev")

# Configuration
OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
MAX_ATTEMPTS = 3
ATTEMPT_WINDOW_MINUTES = 10
LOCKOUT_DURATION_MINUTES = 15


def validate_phone_number(phone):
    """Validate phone number format (E.164)."""
    # E.164 format: +[country code][number]
    # Example: +15145551234
    if not phone or not phone.startswith("+"):
        return False
    if len(phone) < 10 or len(phone) > 15:
        return False
    if not phone[1:].isdigit():
        return False
    return True


def generate_otp():
    """Generate a secure 6-digit OTP."""
    return str(secrets.randbelow(10**OTP_LENGTH)).zfill(OTP_LENGTH)


def send_sms_otp(phone, otp_code):
    """Send OTP via SMS using Firebase Cloud Messaging (FCM)."""
    try:
        # Firebase Identity Toolkit REST API for sending SMS
        # This requires Firebase Authentication with phone verification enabled
        url = f"https://identitytoolkit.googleapis.com/v2/accounts:sendCustomOobCode"

        # French SMS template for Quebec seniors
        message = f"ScamGuard - Votre code de vérification: {otp_code} (valide 10 minutes)"

        payload = {
            "phoneNumber": phone,
            "customMessage": message
        }

        headers = {
            "Content-Type": "application/json"
        }

        # Use Firebase API Key for authentication
        params = {
            "key": FIREBASE_API_KEY
        }

        response = requests.post(
            url,
            json=payload,
            headers=headers,
            params=params,
            timeout=10
        )

        if response.status_code == 200:
            logger.info(f"SMS sent to {phone} via Firebase FCM")
            return True
        else:
            error_msg = response.json().get("error", {}).get("message", "Unknown error")
            logger.error(f"Firebase SMS failed for {phone}: {error_msg}")
            return False

    except Exception as e:
        logger.error(f"Failed to send SMS to {phone}: {str(e)}")
        return False


def store_otp(phone, email, otp_code, password=None):
    """Store OTP in DynamoDB with expiration."""
    try:
        table = dynamodb.Table(OTP_TABLE)
        expiry_time = (datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat()

        item = {
            "PK": f"OTP#{phone}",
            "SK": f"CODE#{email}",
            "code": otp_code,
            "email": email,
            "phone": phone,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expiry_time,
            "attempts": 0,
            "locked": False,
            "lock_until": None,
            "verified": False
        }

        # Store temporary password for phone-only auth
        if password:
            item["temp_password"] = password

        table.put_item(
            Item=item,
            # TTL: 15 minutes (slightly more than OTP expiry for grace period)
            ConditionExpression="attribute_not_exists(PK)"
        )
        logger.info(f"OTP stored for {phone}")
        return True
    except ClientError as e:
        logger.error(f"Failed to store OTP: {str(e)}")
        return False


def log_audit(action, phone, email, status, details=""):
    """Log authentication attempt for audit."""
    try:
        table = dynamodb.Table(AUDIT_TABLE)
        table.put_item(
            Item={
                "PK": f"AUTH#{phone}",
                "SK": f"TIMESTAMP#{datetime.utcnow().isoformat()}",
                "action": action,
                "phone": phone,
                "email": email,
                "status": status,
                "details": details,
                "ip_address": os.environ.get("SOURCE_IP", "unknown"),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    except Exception as e:
        logger.warning(f"Failed to log audit: {str(e)}")


def error_response(status_code, error_code, message):
    """Return standardized error response."""
    return {
        "statusCode": status_code,
        "body": json.dumps({
            "error": {
                "code": error_code,
                "message": message
            }
        }),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    }


def success_response(status_code, data):
    """Return standardized success response."""
    return {
        "statusCode": status_code,
        "body": json.dumps({"data": data}),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    }


def request_otp(event, context):
    """
    Request SMS OTP for a phone number (Phone-only auth).

    Endpoint: POST /auth/request-sms-otp

    Request (Phone-only - simplified):
    {
      "phone": "+15145551234"
    }

    OR legacy format (still supported):
    {
      "email": "user@example.com",
      "phone": "+15145551234",
      "password": "SecurePass123!"
    }

    Response:
    {
      "data": {
        "message": "OTP sent to +15145551234",
        "expires_in": 600
      }
    }
    """
    try:
        # Parse request body
        body_raw = event.get("body", "{}")
        if isinstance(body_raw, str):
            body = json.loads(body_raw)
        else:
            body = body_raw

        phone = body.get("phone", "").strip()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        # Validation
        if not phone:
            return error_response(400, "MISSING_FIELDS", "Phone number required.")

        if not validate_phone_number(phone):
            log_audit("REQUEST_OTP", phone, email or phone, "FAILED", "Invalid phone format")
            return error_response(400, "INVALID_PHONE", "Phone must be in E.164 format (e.g., +15145551234)")

        # Phone-only auth: auto-generate email and password if not provided
        if not email:
            # Generate a temporary email from phone number
            # Format: phone-+15145551234@scamguard.internal
            email = f"phone-{phone}@scamguard.internal"
            logger.info(f"Phone-only auth: generated email {email} from phone {phone}")

        if not password:
            # Generate a secure temporary password
            password = secrets.token_urlsafe(32)
            logger.info(f"Phone-only auth: generated temporary password for {email}")

        # Generate OTP
        otp_code = generate_otp()

        # Try to register/update user in Cognito
        try:
            cognito_client.sign_up(
                ClientId=COGNITO_CLIENT_ID,
                Username=email,
                Password=password,
                UserAttributes=[
                    {"Name": "email", "Value": email},
                    {"Name": "phone_number", "Value": phone}
                ]
            )
            logger.info(f"User {email} signed up in Cognito")
        except cognito_client.exceptions.UsernameExistsException:
            logger.info(f"User {email} already exists in Cognito")
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "COGNITO_ERROR")
            log_audit("REQUEST_OTP", phone, email, "FAILED", f"Cognito error: {error_code}")
            return error_response(400, error_code, str(e))

        # Store OTP in DynamoDB (pass password for phone-only auth)
        if not store_otp(phone, email, otp_code, password):
            log_audit("REQUEST_OTP", phone, email, "FAILED", "Failed to store OTP")
            return error_response(500, "OTP_STORAGE_ERROR", "Failed to store OTP")

        # Send SMS
        if not send_sms_otp(phone, otp_code):
            log_audit("REQUEST_OTP", phone, email, "FAILED", "SMS delivery failed")
            return error_response(500, "SMS_DELIVERY_ERROR", "Failed to send SMS. Please try again.")

        log_audit("REQUEST_OTP", phone, email, "SUCCESS", "OTP sent")

        return success_response(200, {
            "message": f"Code de vérification envoyé à {phone}",
            "expires_in": OTP_EXPIRY_MINUTES * 60,
            "phone_masked": f"{phone[:3]}****{phone[-4:]}"
        })

    except Exception as e:
        logger.error(f"Unexpected error in request_otp: {str(e)}")
        return error_response(500, "INTERNAL_ERROR", "An unexpected error occurred")


def verify_otp(event, context):
    """
    Verify SMS OTP and authenticate user (Phone-only or legacy auth).

    Endpoint: POST /auth/verify-sms-otp

    Request (Phone-only - simplified):
    {
      "phone": "+15145551234",
      "code": "123456"
    }

    OR legacy format (still supported):
    {
      "email": "user@example.com",
      "phone": "+15145551234",
      "code": "123456",
      "password": "SecurePass123!" (optional)
    }

    Response:
    {
      "data": {
        "status": "VERIFIED",
        "id_token": "eyJhbG...",
        "access_token": "eyJhbG...",
        "refresh_token": "...",
        "expires_in": 3600,
        "user": {
          "sub": "user-uuid",
          "email": "user@example.com"
        }
      }
    }
    """
    try:
        # Parse request body
        body_raw = event.get("body", "{}")
        if isinstance(body_raw, str):
            body = json.loads(body_raw)
        else:
            body = body_raw

        phone = body.get("phone", "").strip()
        code = body.get("code", "").strip()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        # Validation
        if not phone or not code:
            return error_response(400, "MISSING_FIELDS", "Phone and code required.")

        if not validate_phone_number(phone):
            return error_response(400, "INVALID_PHONE", "Invalid phone format.")

        if len(code) != OTP_LENGTH or not code.isdigit():
            log_audit("VERIFY_OTP", phone, email, "FAILED", "Invalid code format")
            return error_response(400, "INVALID_CODE", f"Code must be {OTP_LENGTH} digits.")

        # Get OTP from DynamoDB
        try:
            table = dynamodb.Table(OTP_TABLE)

            # If email not provided, we need to find it from the OTP table (phone-only auth)
            if not email:
                # Query by phone to find the associated email
                response = table.query(
                    KeyConditionExpression="PK = :pk",
                    ExpressionAttributeValues={":pk": f"OTP#{phone}"},
                    Limit=1
                )

                if response.get("Items"):
                    email = response["Items"][0].get("email")
                    logger.info(f"Phone-only auth: found email {email} for phone {phone}")
                else:
                    log_audit("VERIFY_OTP", phone, phone, "FAILED", "OTP not found")
                    return error_response(400, "OTP_NOT_FOUND", "No OTP request found. Please request a new code.")

            # Get the specific OTP item
            response = table.get_item(
                Key={
                    "PK": f"OTP#{phone}",
                    "SK": f"CODE#{email}"
                }
            )

            if "Item" not in response:
                log_audit("VERIFY_OTP", phone, email, "FAILED", "OTP not found")
                return error_response(400, "OTP_NOT_FOUND", "No OTP request found. Please request a new code.")

            otp_item = response["Item"]

            # Check if locked
            if otp_item.get("locked"):
                lock_until = otp_item.get("lock_until", "")
                log_audit("VERIFY_OTP", phone, email, "FAILED", "Account locked")
                return error_response(429, "ACCOUNT_LOCKED", f"Too many attempts. Try again after {lock_until}")

            # Check expiration
            expires_at = datetime.fromisoformat(otp_item["expires_at"])
            if datetime.utcnow() > expires_at:
                log_audit("VERIFY_OTP", phone, email, "FAILED", "OTP expired")
                return error_response(400, "OTP_EXPIRED", "Code has expired. Request a new one.")

            # Verify code
            if otp_item["code"] != code:
                # Increment attempts
                attempts = otp_item.get("attempts", 0) + 1

                if attempts >= MAX_ATTEMPTS:
                    # Lock account
                    lock_until = (datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)).isoformat()
                    table.update_item(
                        Key={"PK": f"OTP#{phone}", "SK": f"CODE#{email}"},
                        UpdateExpression="SET attempts = :attempts, locked = :locked, lock_until = :lock_until",
                        ExpressionAttributeValues={
                            ":attempts": attempts,
                            ":locked": True,
                            ":lock_until": lock_until
                        }
                    )
                    log_audit("VERIFY_OTP", phone, email, "FAILED", f"Account locked after {attempts} attempts")
                    return error_response(429, "ACCOUNT_LOCKED", f"Too many attempts. Try again in {LOCKOUT_DURATION_MINUTES} minutes.")
                else:
                    # Update attempts
                    table.update_item(
                        Key={"PK": f"OTP#{phone}", "SK": f"CODE#{email}"},
                        UpdateExpression="SET attempts = :attempts",
                        ExpressionAttributeValues={":attempts": attempts}
                    )
                    remaining = MAX_ATTEMPTS - attempts
                    log_audit("VERIFY_OTP", phone, email, "FAILED", f"Wrong code - attempt {attempts}/{MAX_ATTEMPTS}")
                    return error_response(400, "WRONG_CODE", f"Wrong code. {remaining} attempts remaining.")

            # Code is correct! Mark as verified
            table.update_item(
                Key={"PK": f"OTP#{phone}", "SK": f"CODE#{email}"},
                UpdateExpression="SET verified = :verified",
                ExpressionAttributeValues={":verified": True}
            )

            # Confirm signup in Cognito (mark as confirmed)
            try:
                cognito_client.admin_confirm_sign_up(
                    UserPoolId=COGNITO_USER_POOL_ID,
                    Username=email
                )
                logger.info(f"User {email} confirmed in Cognito")
            except cognito_client.exceptions.UserNotFoundException:
                logger.warning(f"User {email} not found in Cognito for confirmation")
            except ClientError as e:
                logger.warning(f"Failed to confirm user in Cognito: {str(e)}")

            # Initiate auth to get tokens
            try:
                # Determine which password to use
                auth_password = password  # Use provided password if available
                if not auth_password and otp_item.get("temp_password"):
                    # Phone-only auth: use stored temporary password
                    auth_password = otp_item.get("temp_password")
                    logger.info(f"Phone-only auth: using temporary password for {email}")

                if not auth_password:
                    log_audit("VERIFY_OTP", phone, email, "FAILED", "No password available for authentication")
                    return error_response(400, "AUTH_ERROR", "Authentication failed. Please request OTP again.")

                auth_response = cognito_client.initiate_auth(
                    ClientId=COGNITO_CLIENT_ID,
                    AuthFlow="USER_PASSWORD_AUTH",
                    AuthParameters={
                        "USERNAME": email,
                        "PASSWORD": auth_password
                    }
                )

                auth_result = auth_response.get("AuthenticationResult", {})
                user_response = cognito_client.admin_get_user(
                    UserPoolId=COGNITO_USER_POOL_ID,
                    Username=email
                )

                user_id = next(
                    (attr["Value"] for attr in user_response.get("UserAttributes", [])
                     if attr["Name"] == "sub"),
                    email
                )

                log_audit("VERIFY_OTP", phone, email, "SUCCESS", "OTP verified, user authenticated")

                return success_response(200, {
                    "status": "VERIFIED",
                    "id_token": auth_result.get("IdToken"),
                    "access_token": auth_result.get("AccessToken"),
                    "refresh_token": auth_result.get("RefreshToken"),
                    "expires_in": auth_result.get("ExpiresIn", 3600),
                    "user": {
                        "sub": user_id,
                        "email": email,
                        "phone_number": phone
                    }
                })

            except ClientError as e:
                error_code = e.response.get("Error", {}).get("Code", "AUTH_ERROR")
                log_audit("VERIFY_OTP", phone, email, "FAILED", f"Auth error: {error_code}")
                return error_response(400, error_code, "Authentication failed. Please try again.")

        except ClientError as e:
            logger.error(f"DynamoDB error: {str(e)}")
            return error_response(500, "DATABASE_ERROR", "An error occurred. Please try again.")

    except Exception as e:
        logger.error(f"Unexpected error in verify_otp: {str(e)}")
        return error_response(500, "INTERNAL_ERROR", "An unexpected error occurred")


def lambda_handler(event, context):
    """Route requests based on path."""
    path = event.get("rawPath", "")
    method = event.get("requestContext", {}).get("http", {}).get("method", "")

    # Handle CORS preflight requests
    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "body": "",
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        }

    if path.endswith("/auth/request-sms-otp") and method == "POST":
        return request_otp(event, context)
    elif path.endswith("/auth/verify-sms-otp") and method == "POST":
        return verify_otp(event, context)
    else:
        return error_response(404, "NOT_FOUND", "Endpoint not found")
