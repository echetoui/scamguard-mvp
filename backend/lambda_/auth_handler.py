"""Authentication handler for Cognito-based sign up, email verification, and login."""

import json
import os
import re
import string
import random
import uuid
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

# Lazy-initialized AWS clients (to support testing with moto)
_cognito_client = None
_sns_client = None
_dynamodb = None
_table = None

def get_cognito_client():
    global _cognito_client
    if _cognito_client is None:
        _cognito_client = boto3.client("cognito-idp")
    return _cognito_client

def get_sns_client():
    global _sns_client
    if _sns_client is None:
        _sns_client = boto3.client("sns", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    return _sns_client

def get_dynamodb():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource("dynamodb")
    return _dynamodb

def get_table():
    global _table
    if _table is None:
        dynamodb = get_dynamodb()
        _table = dynamodb.Table(os.environ.get("DYNAMODB_TABLE", "ScamGuardData-dev"))
    return _table

def reset_clients():
    """Reset all AWS clients. Used for testing."""
    global _cognito_client, _sns_client, _dynamodb, _table
    _cognito_client = None
    _sns_client = None
    _dynamodb = None
    _table = None

# Environment variables
COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.environ.get("COGNITO_CLIENT_ID")


def validate_email(email):
    """Validate email format."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_password(password):
    """
    Validate password meets Cognito requirements.
    Min 12 chars, uppercase, lowercase, number, symbol.
    """
    if len(password) < 12:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*()_+=\[\]{};:'\",.<>?/\\|-]", password):
        return False
    return True


def generate_invite_code():
    """
    Generate a 6-character alphanumeric invite code for family joining.
    Phase 5A - Family Protection.
    """
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(6))


def validate_phone_number(phone):
    """
    Validate phone number format (Canadian format: 10+ digits).
    Removes non-digit characters and validates.
    Returns tuple: (is_valid, cleaned_phone_digits_only)
    """
    # Remove all non-digit characters (including +)
    digits_only = re.sub(r'[^\d]', '', phone)
    # Must have at least 10 digits
    # If starts with 1 (country code), that counts toward the 10
    # Standardize to last 10 digits (remove leading 1 if 11 digits)
    if len(digits_only) == 11 and digits_only[0] == '1':
        digits_only = digits_only[1:]  # Remove leading 1
    return len(digits_only) >= 10, digits_only  # Return ONLY digits


def generate_otp():
    """
    Generate a 4-digit OTP code for SMS verification.
    """
    return ''.join(str(random.randint(0, 9)) for _ in range(4))


def error_response(status_code, error_code, message):
    """Return standardized error response."""
    return {
        "statusCode": status_code,
        "body": json.dumps({
            "error": {
                "code": error_code,
                "message": message,
            }
        }),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    }


def success_response(status_code, data):
    """Return standardized success response."""
    return {
        "statusCode": status_code,
        "body": json.dumps({
            "data": data
        }),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    }


def post_signup(event, context):
    """
    Handle user signup.

    Validates email and password, then creates user in Cognito.
    Accepts optional role ('senior', 'family', 'individual') for family protection feature (Phase 5A).
    Returns user_id and PENDING_VERIFICATION status.
    """
    try:
        # Parse request body
        body_raw = event.get("body", "{}")
        if isinstance(body_raw, str):
            body = json.loads(body_raw)
        else:
            body = body_raw
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        role = body.get("role", "individual").strip().lower()  # Phase 5A - Family Protection

        # Validate email
        if not email or not validate_email(email):
            return error_response(400, "INVALID_EMAIL", "Email address is invalid.")

        # Validate password
        if not validate_password(password):
            return error_response(
                400,
                "WEAK_PASSWORD",
                "Password must be at least 12 characters with uppercase, lowercase, number, and symbol."
            )

        # Validate role (Phase 5A - Family Protection)
        valid_roles = ['senior', 'family', 'individual']
        if role not in valid_roles:
            role = 'individual'  # Default to individual if invalid

        # Attempt to create user in Cognito
        try:
            response = get_cognito_client().sign_up(
                ClientId=COGNITO_CLIENT_ID,
                Username=email,
                Password=password,
                UserAttributes=[
                    {"Name": "email", "Value": email}
                ]
            )
            user_id = response["UserSub"]

            # Build user profile item
            profile_item = {
                "PK": f"USER#{user_id}",
                "SK": "PROFILE",
                "email": email,
                "role": role,  # Phase 5A - Family Protection
                "status": "PENDING_VERIFICATION",
                "created_at": datetime.utcnow().isoformat(),
            }

            # If user is creating a family, generate family record
            if role == 'family':
                family_id = str(uuid.uuid4())
                invite_code = generate_invite_code()  # Generate 6-char invite code

                # Create family record
                get_table().put_item(
                    Item={
                        "PK": f"FAMILY#{family_id}",
                        "SK": "METADATA",
                        "family_name": f"Family of {email.split('@')[0]}",
                        "created_by": user_id,
                        "created_at": datetime.utcnow().isoformat(),
                        "invite_code": invite_code,
                    }
                )

                # Add creator as family member
                get_table().put_item(
                    Item={
                        "PK": f"FAMILY#{family_id}",
                        "SK": f"MEMBER#{user_id}",
                        "email": email,
                        "role": "family",
                        "joined_at": datetime.utcnow().isoformat(),
                        "last_active": datetime.utcnow().isoformat(),
                    }
                )

                # Store family info in user profile
                profile_item["family_id"] = family_id
                profile_item["family_invite_code"] = invite_code

            # Store user profile in DynamoDB
            get_table().put_item(Item=profile_item)

            response_data = {
                "user_id": user_id,
                "status": "PENDING_VERIFICATION",
                "message": "Signup successful. Please verify your email.",
                "role": role,
            }

            # Include family info if applicable
            if role == 'family':
                response_data["family_id"] = family_id
                response_data["invite_code"] = invite_code

            return success_response(201, response_data)

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "COGNITO_ERROR")
            # Handle specific Cognito errors
            if error_code == "UsernameExistsException":
                return error_response(400, "EMAIL_EXISTS", "Email address already registered.")
            return error_response(400, error_code, str(e))

    except Exception as e:
        return error_response(500, "INTERNAL_ERROR", f"Error during signup: {str(e)}")


def post_verify_email(event, context):
    """
    Handle email verification.

    Verifies the email confirmation code and marks user as verified.
    """
    try:
        body_raw = event.get("body", "{}")
        if isinstance(body_raw, str):
            body = json.loads(body_raw)
        else:
            body = body_raw
        email = body.get("email", "").strip().lower()
        code = body.get("code", "").strip()

        if not email or not code:
            return error_response(400, "MISSING_FIELDS", "Email and code are required.")

        # Confirm signup (verify email with code)
        try:
            get_cognito_client().confirm_sign_up(
                ClientId=COGNITO_CLIENT_ID,
                Username=email,
                ConfirmationCode=code
            )

            # Get user from Cognito to get UserSub
            user_response = get_cognito_client().admin_get_user(
                UserPoolId=COGNITO_USER_POOL_ID,
                Username=email
            )
            user_id = next(
                (attr["Value"] for attr in user_response.get("UserAttributes", [])
                 if attr["Name"] == "sub"),
                user_response.get("Username")
            )

            # Update user profile in DynamoDB
            get_table().update_item(
                Key={"PK": f"USER#{user_id}", "SK": "PROFILE"},
                UpdateExpression="SET #status = :status, email_verified = :true, verified_at = :now",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":status": "VERIFIED",
                    ":true": True,
                    ":now": datetime.utcnow().isoformat()
                }
            )

            return success_response(200, {
                "status": "VERIFIED",
                "message": "Email verified successfully."
            })

        except get_cognito_client().exceptions.CodeMismatchException:
            return error_response(400, "CODE_INVALID", "Verification code is invalid.")
        except get_cognito_client().exceptions.ExpiredCodeException:
            return error_response(400, "CODE_EXPIRED", "Verification code has expired.")
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "COGNITO_ERROR")
            return error_response(400, error_code, str(e))

    except Exception as e:
        return error_response(500, "INTERNAL_ERROR", f"Error during email verification: {str(e)}")


def post_resend_code(event, context):
    """
    Resend verification code to user's email.
    """
    try:
        body_raw = event.get("body", "{}")
        if isinstance(body_raw, str):
            body = json.loads(body_raw)
        else:
            body = body_raw
        email = body.get("email", "").strip().lower()

        if not email:
            return error_response(400, "MISSING_EMAIL", "Email is required.")

        try:
            get_cognito_client().resend_confirmation_code(
                ClientId=COGNITO_CLIENT_ID,
                Username=email
            )

            return success_response(200, {
                "message": "Verification code sent to your email. Please check your inbox."
            })

        except get_cognito_client().exceptions.TooManyRequestsException:
            return error_response(429, "RATE_LIMITED", "Too many requests. Please try again later.")
        except get_cognito_client().exceptions.UserNotFoundException:
            return error_response(400, "USER_NOT_FOUND", "User with this email not found.")
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "COGNITO_ERROR")
            return error_response(400, error_code, str(e))

    except Exception as e:
        return error_response(500, "INTERNAL_ERROR", f"Error resending code: {str(e)}")


def post_login(event, context):
    """
    Handle user login.

    Authenticates user with email and password, returns JWT tokens.
    """
    try:
        body_raw = event.get("body", "{}")
        if isinstance(body_raw, str):
            body = json.loads(body_raw)
        else:
            body = body_raw
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            return error_response(400, "MISSING_CREDENTIALS", "Email and password are required.")

        try:
            # Authenticate user
            auth_response = get_cognito_client().initiate_auth(
                ClientId=COGNITO_CLIENT_ID,
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={
                    "USERNAME": email,
                    "PASSWORD": password
                }
            )

            # Check if email is verified
            user_response = get_cognito_client().admin_get_user(
                UserPoolId=COGNITO_USER_POOL_ID,
                Username=email
            )

            email_verified = next(
                (attr["Value"] == "true" for attr in user_response.get("UserAttributes", [])
                 if attr["Name"] == "email_verified"),
                False
            )

            if not email_verified:
                return error_response(400, "COGNITO_EMAIL_NOT_VERIFIED", "Please verify your email first.")

            # Extract tokens from auth result
            auth_result = auth_response.get("AuthenticationResult", {})
            tokens = {
                "id_token": auth_result.get("IdToken"),
                "access_token": auth_result.get("AccessToken"),
                "refresh_token": auth_result.get("RefreshToken"),
                "expires_in": auth_result.get("ExpiresIn", 3600),
            }

            return success_response(200, {
                **tokens,
                "message": "Login successful."
            })

        except get_cognito_client().exceptions.NotAuthorizedException:
            return error_response(400, "INVALID_CREDENTIALS", "Invalid email or password.")
        except get_cognito_client().exceptions.UserNotFoundException:
            return error_response(400, "USER_NOT_FOUND", "User not found.")
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "COGNITO_ERROR")
            return error_response(400, error_code, str(e))

    except Exception as e:
        return error_response(500, "INTERNAL_ERROR", f"Error during login: {str(e)}")


def post_refresh_token(event, context):
    """
    Refresh expired JWT tokens using refresh_token.

    Cognito's refresh_token is long-lived and can be used to get new id_token and access_token.
    """
    try:
        body_raw = event.get("body", "{}")
        if isinstance(body_raw, str):
            body = json.loads(body_raw)
        else:
            body = body_raw
        refresh_token = body.get("refresh_token", "").strip()

        if not refresh_token:
            return error_response(400, "MISSING_REFRESH_TOKEN", "Refresh token is required.")

        try:
            # Use Cognito's initiate_auth with REFRESH_TOKEN_AUTH flow
            auth_response = get_cognito_client().initiate_auth(
                ClientId=COGNITO_CLIENT_ID,
                AuthFlow="REFRESH_TOKEN_AUTH",
                AuthParameters={
                    "REFRESH_TOKEN": refresh_token
                }
            )

            # Extract new tokens
            auth_result = auth_response.get("AuthenticationResult", {})
            tokens = {
                "id_token": auth_result.get("IdToken"),
                "access_token": auth_result.get("AccessToken"),
                # Refresh token remains the same (unless Cognito rotates it)
                "refresh_token": refresh_token,
                "expires_in": auth_result.get("ExpiresIn", 3600),
            }

            return success_response(200, {
                **tokens,
                "message": "Token refreshed successfully."
            })

        except get_cognito_client().exceptions.NotAuthorizedException:
            return error_response(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.")
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "COGNITO_ERROR")
            return error_response(401, error_code, str(e))

    except Exception as e:
        return error_response(500, "INTERNAL_ERROR", f"Error during token refresh: {str(e)}")


def post_logout(event, context):
    """
    Handle user logout.

    Requires authentication (access_token in Authorization header).
    """
    try:
        # Extract user from requestContext
        request_context = event.get("requestContext", {})
        authorizer = request_context.get("authorizer", {})
        claims = authorizer.get("claims", {})
        user_id = claims.get("sub")

        if not user_id:
            return error_response(401, "UNAUTHORIZED", "User not authenticated.")

        # Note: In a real app, you might invalidate tokens in a token blacklist
        # For now, just return success (JWT expiry handles invalidation)

        return success_response(200, {
            "message": "Logged out successfully."
        })

    except Exception as e:
        return error_response(500, "INTERNAL_ERROR", f"Error during logout: {str(e)}")


def post_request_sms_otp(event, context):
    """
    Request SMS OTP for phone-based authentication.

    Generates a 4-digit code and stores it in DynamoDB with TTL (5 minutes).
    Sends OTP via AWS SNS.
    For development, the code is returned in response.
    """
    try:
        body_raw = event.get("body", "{}")
        if isinstance(body_raw, str):
            body = json.loads(body_raw)
        else:
            body = body_raw
        phone_number = body.get("phone", "").strip()

        if not phone_number:
            return error_response(400, "MISSING_PHONE", "Phone number is required.")

        # Validate phone number
        is_valid, cleaned_phone = validate_phone_number(phone_number)
        if not is_valid:
            return error_response(400, "INVALID_PHONE", "Phone number must have at least 10 digits.")

        # Generate OTP
        otp = generate_otp()

        # Store OTP in DynamoDB with 5-minute TTL
        otp_expiry = int(datetime.utcnow().timestamp()) + 300  # 5 minutes
        get_table().put_item(
            Item={
                "PK": f"OTP#{cleaned_phone}",
                "SK": "VERIFICATION",
                "code": otp,
                "created_at": datetime.utcnow().isoformat(),
                "expires_at": otp_expiry,
                "TTL": otp_expiry,  # DynamoDB TTL attribute
                "attempts": 0,
            }
        )

        # Send OTP via AWS SNS
        sns_topic_arn = os.environ.get("SNS_TOPIC_ARN")
        sms_sent = False

        if sns_topic_arn:
            try:
                # Convert to E.164 format (+1 country code)
                e164_phone = f"+1{cleaned_phone[-10:]}"
                message = f"Your ScamGuard verification code is: {otp}. This code expires in 5 minutes."

                get_sns_client().publish(
                    TopicArn=sns_topic_arn,
                    Subject="ScamGuard Verification Code",
                    Message=message,
                    MessageAttributes={
                        "AWS.SNS.SMS.SMSType": {
                            "DataType": "String",
                            "StringValue": "Transactional"
                        }
                    }
                )
                print("[SNS] SMS OTP sent successfully.")
                sms_sent = True
            except Exception as sns_error:
                print(f"[SNS] Error sending SMS: {str(sns_error)}")
                # Don't fail the request if SNS fails - user can still verify with the code

        # In development, return the code for testing
        is_dev = os.environ.get("ENVIRONMENT", "dev") == "dev"
        response_data = {
            "message": "OTP sent to your phone number.",
            "phone_masked": f"***{cleaned_phone[-4:]}",
            "sms_sent": sms_sent
        }
        if is_dev:
            response_data["otp"] = otp  # Development only

        return success_response(200, response_data)

    except Exception as e:
        return error_response(500, "INTERNAL_ERROR", f"Error requesting OTP: {str(e)}")


def post_verify_sms_otp(event, context):
    """
    Verify SMS OTP code.

    Validates the code provided by the user against the stored OTP.
    Creates or retrieves user based on phone number.
    Returns authentication tokens.
    """
    try:
        body_raw = event.get("body", "{}")
        if isinstance(body_raw, str):
            body = json.loads(body_raw)
        else:
            body = body_raw
        phone_number = body.get("phone", "").strip()
        code = body.get("code", "").strip()

        if not phone_number or not code:
            return error_response(400, "MISSING_FIELDS", "Phone number and code are required.")

        # Validate phone number
        is_valid, cleaned_phone = validate_phone_number(phone_number)
        if not is_valid:
            return error_response(400, "INVALID_PHONE", "Invalid phone number format.")

        # Retrieve OTP from DynamoDB
        try:
            response = get_table().get_item(
                Key={
                    "PK": f"OTP#{cleaned_phone}",
                    "SK": "VERIFICATION"
                }
            )
        except Exception as e:
            return error_response(400, "OTP_NOT_FOUND", "No OTP found for this phone number.")

        if "Item" not in response:
            return error_response(400, "OTP_NOT_FOUND", "OTP expired or not found. Please request a new code.")

        otp_item = response["Item"]
        stored_code = otp_item.get("code")
        attempts = otp_item.get("attempts", 0)

        # Check if OTP has expired
        expires_at = otp_item.get("expires_at", 0)
        if int(datetime.utcnow().timestamp()) > expires_at:
            get_table().delete_item(Key={"PK": f"OTP#{cleaned_phone}", "SK": "VERIFICATION"})
            return error_response(400, "OTP_EXPIRED", "OTP has expired. Please request a new code.")

        # Check if too many attempts (max 3)
        if attempts >= 3:
            get_table().delete_item(Key={"PK": f"OTP#{cleaned_phone}", "SK": "VERIFICATION"})
            return error_response(429, "TOO_MANY_ATTEMPTS", "Too many failed attempts. Please request a new code.")

        # Verify code (ensure both are strings for comparison)
        if str(stored_code).strip() != str(code).strip():
            # Increment attempts
            get_table().update_item(
                Key={"PK": f"OTP#{cleaned_phone}", "SK": "VERIFICATION"},
                UpdateExpression="SET attempts = attempts + :inc",
                ExpressionAttributeValues={":inc": 1}
            )
            return error_response(400, "INVALID_OTP", "Incorrect OTP code.")

        # OTP is valid - clean up and create/retrieve user
        get_table().delete_item(Key={"PK": f"OTP#{cleaned_phone}", "SK": "VERIFICATION"})

        # Get or create user profile
        user_id = str(uuid.uuid4())
        profile_key = f"USER#{user_id}"

        # Check if phone already has a user
        try:
            response = get_table().query(
                IndexName="PhoneIndex" if os.environ.get("PHONE_INDEX", "false") == "true" else None,
                KeyConditionExpression="phone_number = :phone",
                ExpressionAttributeValues={":phone": cleaned_phone},
                Limit=1
            ) if os.environ.get("PHONE_INDEX", "false") == "true" else {"Items": []}

            if response.get("Items"):
                # Existing user
                existing_user = response["Items"][0]
                user_id = existing_user.get("PK").replace("USER#", "")
                profile_key = f"USER#{user_id}"
            else:
                # New user - create profile
                get_table().put_item(
                    Item={
                        "PK": profile_key,
                        "SK": "PROFILE",
                        "phone_number": cleaned_phone,
                        "phone_verified": True,
                        "status": "ACTIVE",
                        "created_at": datetime.utcnow().isoformat(),
                        "verified_at": datetime.utcnow().isoformat(),
                    }
                )
        except Exception as e:
            # If phone index doesn't exist, just create new user
            get_table().put_item(
                Item={
                    "PK": profile_key,
                    "SK": "PROFILE",
                    "phone_number": cleaned_phone,
                    "phone_verified": True,
                    "status": "ACTIVE",
                    "created_at": datetime.utcnow().isoformat(),
                    "verified_at": datetime.utcnow().isoformat(),
                }
            )

        # Generate a simple JWT-like token (in production, use proper JWT library)
        # For now, return a base64-encoded token
        import base64
        token_payload = {
            "user_id": user_id,
            "phone_number": cleaned_phone,
            "iat": int(datetime.utcnow().timestamp()),
            "exp": int(datetime.utcnow().timestamp()) + 3600
        }
        token = base64.b64encode(json.dumps(token_payload).encode()).decode()

        return success_response(200, {
            "user_id": user_id,
            "phone_number": cleaned_phone,
            "token": token,
            "message": "SMS OTP verified successfully."
        })

    except Exception as e:
        return error_response(500, "INTERNAL_ERROR", f"Error verifying OTP: {str(e)}")


def lambda_handler(event, context):
    """
    Route authentication requests to appropriate handler.
    Supports multiple routes through API Gateway integration.
    """
    path = event.get("path", "")
    method = event.get("httpMethod", "")

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

    # Route based on path
    if path == "/api/v1/auth/signup" and method == "POST":
        return post_signup(event, context)
    elif path == "/api/v1/auth/verify-email" and method == "POST":
        return post_verify_email(event, context)
    elif path == "/api/v1/auth/resend-code" and method == "POST":
        return post_resend_code(event, context)
    elif path == "/api/v1/auth/login" and method == "POST":
        return post_login(event, context)
    elif path == "/api/v1/auth/refresh-token" and method == "POST":
        return post_refresh_token(event, context)
    elif path == "/api/v1/auth/logout" and method == "POST":
        return post_logout(event, context)
    elif path == "/api/v1/auth/request-sms-otp" and method == "POST":
        return post_request_sms_otp(event, context)
    elif path == "/api/v1/auth/verify-sms-otp" and method == "POST":
        return post_verify_sms_otp(event, context)
    else:
        return error_response(404, "NOT_FOUND", "Endpoint not found.")
