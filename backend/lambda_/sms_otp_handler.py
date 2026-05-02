"""SMS OTP handler for phone-based verification.

Provides request_otp and verify_otp endpoints for SMS-based authentication.
Supports E.164 phone format (e.g., +15145551234).
"""

import json
import os
import re
import random
import time
import string
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError

# Configuration
OTP_TABLE = os.environ.get('DYNAMODB_TABLE_OTP', 'ScamGuardOTP')
PINPOINT_PROJECT_ID = os.environ.get('PINPOINT_PROJECT_ID', '')
EXPIRATION_MINUTES = 10  # OTP valid for 10 minutes
CODE_LENGTH = 6
MAX_ATTEMPTS = 3
LOCK_MINUTES = 15

# AWS clients - module-level for testability (patch these in tests)
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_DEFAULT_REGION', 'us-east-1'))
cognito_client = boto3.client('cognito-idp', region_name=os.environ.get('AWS_DEFAULT_REGION', 'us-east-1'))
pinpoint_client = boto3.client('pinpoint', region_name=os.environ.get('AWS_DEFAULT_REGION', 'us-east-1'))

# Cognito config
COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID', '')
COGNITO_CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID', '')


def validate_phone_number(phone: str) -> bool:
    """Validate phone number in E.164 format (+[country][number]).

    Valid format: +15145551234, +33123456789, +14165551234
    Invalid: 15145551234 (no plus), 514-555-1234 (dashes), +1234 (too short),
             +1 + 20 digits (too long), non-numeric chars.

    Returns True if valid E.164 format, False otherwise.
    """
    if not phone or not isinstance(phone, str):
        return False
    # Must start with +
    if not phone.startswith('+'):
        return False
    # Rest must be digits only
    digits_part = phone[1:]
    if not digits_part.isdigit():
        return False
    # E.164: 7-15 digits after the +
    if len(digits_part) < 7 or len(digits_part) > 15:
        return False
    return True


def generate_otp() -> str:
    """Generate a zero-padded 6-digit OTP code."""
    return ''.join([str(random.randint(0, 9)) for _ in range(CODE_LENGTH)])


def error_response(status_code: int, error_code: str, message: str) -> dict:
    """Return a standardized error response."""
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "error": {
                "code": error_code,
                "message": message,
            }
        }),
    }


def success_response(status_code: int, data: dict) -> dict:
    """Return a standardized success response."""
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "data": data
        }),
    }


def request_otp(event: dict, context) -> dict:
    """Handle POST /auth/request-sms-otp.

    Registers the user in Cognito, generates a 6-digit OTP, stores it in
    DynamoDB, and sends it via Pinpoint.
    """
    try:
        body = json.loads(event.get('body') or '{}')
        email = body.get('email', '').strip()
        phone = body.get('phone', '').strip()
        password = body.get('password', '').strip()

        if not email or not phone or not password:
            return error_response(400, "MISSING_FIELDS", "email, phone, and password are required.")

        if not validate_phone_number(phone):
            return error_response(400, "INVALID_PHONE",
                                  "Phone must be in E.164 format (e.g. +15145551234).")

        # Register user in Cognito (sign_up)
        try:
            cognito_client.sign_up(
                ClientId=COGNITO_CLIENT_ID,
                Username=email,
                Password=password,
                UserAttributes=[
                    {'Name': 'email', 'Value': email},
                    {'Name': 'phone_number', 'Value': phone},
                ]
            )
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code not in ('UsernameExistsException',):
                return error_response(400, error_code, str(e))
        except Exception as e:
            exc_name = type(e).__name__
            if exc_name != 'UsernameExistsException':
                return error_response(400, "COGNITO_ERROR", str(e))

        # Generate OTP
        otp_code = generate_otp()
        now = datetime.utcnow()
        expires_at = (now + timedelta(minutes=EXPIRATION_MINUTES)).isoformat()

        # Store OTP in DynamoDB
        table = dynamodb.Table(OTP_TABLE)
        table.put_item(Item={
            'PK': phone,
            'SK': f"OTP#{email}",
            'code': otp_code,
            'phone': phone,
            'email': email,
            'expires_at': expires_at,
            'attempts': 0,
            'locked': False,
            'verified': False,
            'created_at': now.isoformat(),
        })

        # Store audit log in DynamoDB
        table.put_item(Item={
            'PK': f"AUDIT#{email}",
            'SK': f"OTP_REQUEST#{now.isoformat()}",
            'action': 'otp_requested',
            'phone': phone,
            'timestamp': now.isoformat(),
        })

        # Send SMS via Pinpoint
        message = (
            f"Votre code ScamGuard est : {otp_code}. "
            "Ne le partagez avec personne."
        )
        try:
            pinpoint_client.send_messages(
                ApplicationId=PINPOINT_PROJECT_ID,
                MessageRequest={
                    'Addresses': {phone: {'ChannelType': 'SMS'}},
                    'MessageConfiguration': {
                        'SMSMessage': {
                            'Body': message,
                            'MessageType': 'TRANSACTIONAL',
                        }
                    }
                }
            )
        except Exception:
            pass  # Don't fail if SMS fails in dev

        return success_response(200, {
            "message": f"Code de vérification envoyé à {phone}",
            "expires_in": EXPIRATION_MINUTES * 60,
        })

    except Exception as e:
        return error_response(500, "INTERNAL_ERROR", str(e))


def verify_otp(event: dict, context) -> dict:
    """Handle POST /auth/verify-sms-otp.

    Verifies the OTP code and logs in the user via Cognito.
    """
    try:
        body = json.loads(event.get('body') or '{}')
        email = body.get('email', '').strip()
        phone = body.get('phone', '').strip()
        code = body.get('code', '').strip()
        password = body.get('password', '').strip()

        if not email or not phone or not code or not password:
            return error_response(400, "MISSING_FIELDS",
                                  "email, phone, code, and password are required.")

        # Fetch stored OTP from DynamoDB
        table = dynamodb.Table(OTP_TABLE)
        response = table.get_item(Key={'PK': phone, 'SK': f"OTP#{email}"})
        item = response.get('Item')

        if not item:
            return error_response(404, "OTP_NOT_FOUND", "No OTP found for this phone/email.")

        # Check if account is locked
        if item.get('locked'):
            lock_until = item.get('lock_until', '')
            if lock_until:
                lock_dt = datetime.fromisoformat(lock_until)
                if datetime.utcnow() < lock_dt:
                    return error_response(429, "ACCOUNT_LOCKED",
                                          f"Account locked until {lock_until}.")

        # Check expiry
        expires_at = item.get('expires_at', '')
        if expires_at:
            exp_dt = datetime.fromisoformat(expires_at)
            if datetime.utcnow() > exp_dt:
                return error_response(400, "OTP_EXPIRED", "The verification code has expired.")

        # Check already verified
        if item.get('verified'):
            return error_response(400, "ALREADY_VERIFIED", "Code already used.")

        # Verify code
        if item.get('code') != code:
            attempts = item.get('attempts', 0) + 1
            locked = attempts >= MAX_ATTEMPTS
            update_data: dict = {'attempts': attempts, 'locked': locked}
            if locked:
                lock_until = (datetime.utcnow() + timedelta(minutes=LOCK_MINUTES)).isoformat()
                update_data['lock_until'] = lock_until

            table.update_item(
                Key={'PK': phone, 'SK': f"OTP#{email}"},
                UpdateExpression="SET attempts = :a, locked = :l" +
                                 (", lock_until = :lu" if locked else ""),
                ExpressionAttributeValues={
                    ':a': attempts,
                    ':l': locked,
                    **({':lu': update_data['lock_until']} if locked else {}),
                }
            )
            return error_response(400, "WRONG_CODE", "Verification code is incorrect.")

        # Mark as verified
        table.update_item(
            Key={'PK': phone, 'SK': f"OTP#{email}"},
            UpdateExpression="SET verified = :t",
            ExpressionAttributeValues={':t': True}
        )

        # Confirm Cognito signup
        try:
            cognito_client.admin_confirm_sign_up(
                UserPoolId=COGNITO_USER_POOL_ID,
                Username=email,
            )
        except Exception:
            pass  # Already confirmed or not needed

        # Authenticate user to get tokens
        auth_response = cognito_client.initiate_auth(
            ClientId=COGNITO_CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={'USERNAME': email, 'PASSWORD': password},
        )
        auth_result = auth_response.get('AuthenticationResult', {})

        # Get user sub
        user_response = cognito_client.admin_get_user(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=email,
        )
        user_id = next(
            (attr['Value'] for attr in user_response.get('UserAttributes', [])
             if attr['Name'] == 'sub'),
            None
        )

        return success_response(200, {
            "status": "VERIFIED",
            "user_id": user_id,
            "id_token": auth_result.get('IdToken'),
            "access_token": auth_result.get('AccessToken'),
            "refresh_token": auth_result.get('RefreshToken'),
            "expires_in": auth_result.get('ExpiresIn', 3600),
        })

    except Exception as e:
        return error_response(500, "INTERNAL_ERROR", str(e))


def lambda_handler(event: dict, context) -> dict:
    """Route Lambda events to the appropriate handler."""
    path = event.get('rawPath', '')
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')

    if method == 'POST' and path.endswith('/auth/request-sms-otp'):
        return request_otp(event, context)
    elif method == 'POST' and path.endswith('/auth/verify-sms-otp'):
        return verify_otp(event, context)
    else:
        return error_response(404, "NOT_FOUND", f"Route {method} {path} not found.")
