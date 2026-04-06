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

# Initialize AWS clients
cognito_client = boto3.client("cognito-idp")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("DYNAMODB_TABLE", "ScamGuardData-dev"))

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
            response = cognito_client.sign_up(
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
                table.put_item(
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
                table.put_item(
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
            table.put_item(Item=profile_item)

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
            cognito_client.confirm_sign_up(
                ClientId=COGNITO_CLIENT_ID,
                Username=email,
                ConfirmationCode=code
            )

            # Get user from Cognito to get UserSub
            user_response = cognito_client.admin_get_user(
                UserPoolId=COGNITO_USER_POOL_ID,
                Username=email
            )
            user_id = next(
                (attr["Value"] for attr in user_response.get("UserAttributes", [])
                 if attr["Name"] == "sub"),
                user_response.get("Username")
            )

            # Update user profile in DynamoDB
            table.update_item(
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

        except cognito_client.exceptions.CodeMismatchException:
            return error_response(400, "CODE_INVALID", "Verification code is invalid.")
        except cognito_client.exceptions.ExpiredCodeException:
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
            cognito_client.resend_confirmation_code(
                ClientId=COGNITO_CLIENT_ID,
                Username=email
            )

            return success_response(200, {
                "message": "Verification code sent to your email. Please check your inbox."
            })

        except cognito_client.exceptions.TooManyRequestsException:
            return error_response(429, "RATE_LIMITED", "Too many requests. Please try again later.")
        except cognito_client.exceptions.UserNotFoundException:
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
            auth_response = cognito_client.initiate_auth(
                ClientId=COGNITO_CLIENT_ID,
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={
                    "USERNAME": email,
                    "PASSWORD": password
                }
            )

            # Check if email is verified
            user_response = cognito_client.admin_get_user(
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

        except cognito_client.exceptions.NotAuthorizedException:
            return error_response(400, "INVALID_CREDENTIALS", "Invalid email or password.")
        except cognito_client.exceptions.UserNotFoundException:
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
            auth_response = cognito_client.initiate_auth(
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

        except cognito_client.exceptions.NotAuthorizedException:
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
    else:
        return error_response(404, "NOT_FOUND", "Endpoint not found.")
