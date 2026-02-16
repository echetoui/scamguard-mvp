"""Authentication handlers (email verification, signup, login)."""

import json
import os
import logging
import uuid
from datetime import datetime
import boto3
from aws_xray_sdk.core import xray_recorder
from utils.response import ResponseBuilder
from utils.auth import get_request_id, extract_user_id
from utils.errors import ScamGuardError, EmailNotVerified

logger = logging.getLogger(__name__)

cognito_client = boto3.client("cognito-idp")
dynamodb = boto3.resource("dynamodb")

USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID")
CLIENT_ID = os.environ.get("COGNITO_CLIENT_ID")
DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE", "ScamGuardData")
table = dynamodb.Table(DYNAMODB_TABLE)


@xray_recorder.capture("post_signup")
def post_signup(event, context):
    """POST /api/v1/auth/signup - Sign up new user."""
    request_id = get_request_id(event)
    trace_id = context.aws_request_id

    try:
        body = json.loads(event.get("body", "{}"))
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        # Validate input
        if not email or "@" not in email:
            return ResponseBuilder.bad_request(
                "INVALID_EMAIL",
                "Valid email required",
                request_id,
                trace_id,
                f"Got: {email}",
            )

        if len(password) < 12:
            return ResponseBuilder.bad_request(
                "WEAK_PASSWORD",
                "Password must be at least 12 characters",
                request_id,
                trace_id,
            )

        # Check password complexity
        has_upper = any(c.isupper() for c in password)
        has_number = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*" for c in password)

        if not (has_upper and has_number and has_special):
            return ResponseBuilder.bad_request(
                "WEAK_PASSWORD",
                "Password must contain uppercase, number, and special character",
                request_id,
                trace_id,
            )

        xray_recorder.put_annotation("email", email)

        # Sign up user in Cognito
        try:
            response = cognito_client.sign_up(
                ClientId=CLIENT_ID,
                Username=email,
                Password=password,
                UserAttributes=[
                    {"Name": "email", "Value": email},
                    {"Name": "email_verified", "Value": "false"},
                ],
            )

            user_sub = response["UserSub"]

            # Create user profile in DynamoDB
            table.put_item(
                Item={
                    "PK": f"USER#{user_sub}",
                    "SK": "PROFILE",
                    "email": email,
                    "status": "PENDING_VERIFICATION",
                    "created_at": datetime.utcnow().isoformat(),
                }
            )

            return ResponseBuilder.created(
                {
                    "user_id": user_sub,
                    "email": email,
                    "status": "PENDING_VERIFICATION",
                    "message": "Check your email for verification code",
                },
                request_id,
                trace_id,
            )

        except cognito_client.exceptions.UsernameExistsException:
            return ResponseBuilder.bad_request(
                "EMAIL_EXISTS",
                "Email already registered",
                request_id,
                trace_id,
            )
        except Exception as e:
            logger.error(f"Cognito signup failed: {str(e)}", exc_info=True)
            return ResponseBuilder.server_error(
                "SIGNUP_FAILED",
                "Signup failed",
                request_id,
                trace_id,
                str(e),
            )

    except Exception as e:
        logger.error(f"Signup handler error: {str(e)}", exc_info=True)
        return ResponseBuilder.server_error(
            "SIGNUP_ERROR",
            "Signup error",
            request_id,
            trace_id,
            str(e),
        )


@xray_recorder.capture("post_verify_email")
def post_verify_email(event, context):
    """POST /api/v1/auth/verify-email - Verify email with code."""
    request_id = get_request_id(event)
    trace_id = context.aws_request_id

    try:
        body = json.loads(event.get("body", "{}"))
        email = body.get("email", "").strip().lower()
        code = body.get("code", "").strip()

        if not email or not code:
            return ResponseBuilder.bad_request(
                "MISSING_DATA",
                "Email and code required",
                request_id,
                trace_id,
            )

        xray_recorder.put_annotation("email", email)

        # Confirm signup in Cognito
        try:
            cognito_client.confirm_sign_up(
                ClientId=CLIENT_ID,
                Username=email,
                ConfirmationCode=code,
            )

            # Update user profile status
            response = cognito_client.admin_get_user(
                UserPoolId=USER_POOL_ID,
                Username=email,
            )
            user_sub = response["Username"]

            table.update_item(
                Key={"PK": f"USER#{user_sub}", "SK": "PROFILE"},
                UpdateExpression="SET #status = :status, verified_at = :verified_at",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":status": "VERIFIED",
                    ":verified_at": datetime.utcnow().isoformat(),
                },
            )

            return ResponseBuilder.success(
                {
                    "email": email,
                    "status": "VERIFIED",
                    "message": "Email verified successfully. You can now login.",
                },
                request_id,
                trace_id,
            )

        except cognito_client.exceptions.ExpiredCodeException:
            return ResponseBuilder.bad_request(
                "CODE_EXPIRED",
                "Verification code expired. Request a new one.",
                request_id,
                trace_id,
            )
        except cognito_client.exceptions.CodeMismatchException:
            return ResponseBuilder.bad_request(
                "CODE_INVALID",
                "Verification code is invalid",
                request_id,
                trace_id,
            )
        except Exception as e:
            logger.error(f"Email verification failed: {str(e)}", exc_info=True)
            return ResponseBuilder.server_error(
                "VERIFICATION_FAILED",
                "Email verification failed",
                request_id,
                trace_id,
                str(e),
            )

    except Exception as e:
        logger.error(f"Verify email handler error: {str(e)}", exc_info=True)
        return ResponseBuilder.server_error(
            "VERIFY_ERROR",
            "Verification error",
            request_id,
            trace_id,
            str(e),
        )


@xray_recorder.capture("post_resend_code")
def post_resend_code(event, context):
    """POST /api/v1/auth/resend-code - Resend verification code."""
    request_id = get_request_id(event)
    trace_id = context.aws_request_id

    try:
        body = json.loads(event.get("body", "{}"))
        email = body.get("email", "").strip().lower()

        if not email:
            return ResponseBuilder.bad_request(
                "MISSING_DATA",
                "Email required",
                request_id,
                trace_id,
            )

        xray_recorder.put_annotation("email", email)

        try:
            cognito_client.resend_confirmation_code(
                ClientId=CLIENT_ID,
                Username=email,
            )

            return ResponseBuilder.success(
                {
                    "email": email,
                    "message": "Verification code sent to your email",
                },
                request_id,
                trace_id,
            )

        except cognito_client.exceptions.UserNotFoundException:
            return ResponseBuilder.bad_request(
                "USER_NOT_FOUND",
                "User not found",
                request_id,
                trace_id,
            )
        except cognito_client.exceptions.TooManyRequestsException:
            return ResponseBuilder.rate_limit(
                request_id,
                trace_id,
                retry_after=60,
            )
        except Exception as e:
            logger.error(f"Resend code failed: {str(e)}", exc_info=True)
            return ResponseBuilder.server_error(
                "RESEND_FAILED",
                "Failed to resend code",
                request_id,
                trace_id,
                str(e),
            )

    except Exception as e:
        logger.error(f"Resend code handler error: {str(e)}", exc_info=True)
        return ResponseBuilder.server_error(
            "RESEND_ERROR",
            "Resend error",
            request_id,
            trace_id,
            str(e),
        )


@xray_recorder.capture("post_login")
def post_login(event, context):
    """POST /api/v1/auth/login - User login."""
    request_id = get_request_id(event)
    trace_id = context.aws_request_id

    try:
        body = json.loads(event.get("body", "{}"))
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            return ResponseBuilder.bad_request(
                "MISSING_DATA",
                "Email and password required",
                request_id,
                trace_id,
            )

        xray_recorder.put_annotation("email", email)

        try:
            response = cognito_client.initiate_auth(
                ClientId=CLIENT_ID,
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={
                    "USERNAME": email,
                    "PASSWORD": password,
                },
            )

            # Check if email is verified
            user_response = cognito_client.admin_get_user(
                UserPoolId=USER_POOL_ID,
                Username=email,
            )

            email_verified = any(
                attr["Name"] == "email_verified" and attr["Value"] == "true"
                for attr in user_response.get("UserAttributes", [])
            )

            if not email_verified:
                return ResponseBuilder.bad_request(
                    "COGNITO_EMAIL_NOT_VERIFIED",
                    "Email not verified. Check your inbox for verification code.",
                    request_id,
                    trace_id,
                )

            return ResponseBuilder.success(
                {
                    "id_token": response["AuthenticationResult"]["IdToken"],
                    "access_token": response["AuthenticationResult"]["AccessToken"],
                    "refresh_token": response["AuthenticationResult"].get("RefreshToken"),
                    "expires_in": response["AuthenticationResult"]["ExpiresIn"],
                },
                request_id,
                trace_id,
            )

        except cognito_client.exceptions.NotAuthorizedException:
            return ResponseBuilder.bad_request(
                "INVALID_CREDENTIALS",
                "Email or password is incorrect",
                request_id,
                trace_id,
            )
        except cognito_client.exceptions.UserNotFoundException:
            return ResponseBuilder.bad_request(
                "USER_NOT_FOUND",
                "User not found",
                request_id,
                trace_id,
            )
        except Exception as e:
            logger.error(f"Login failed: {str(e)}", exc_info=True)
            return ResponseBuilder.server_error(
                "LOGIN_FAILED",
                "Login failed",
                request_id,
                trace_id,
                str(e),
            )

    except Exception as e:
        logger.error(f"Login handler error: {str(e)}", exc_info=True)
        return ResponseBuilder.server_error(
            "LOGIN_ERROR",
            "Login error",
            request_id,
            trace_id,
            str(e),
        )


@xray_recorder.capture("post_logout")
def post_logout(event, context):
    """POST /api/v1/auth/logout - User logout."""
    request_id = get_request_id(event)
    trace_id = context.aws_request_id
    user_id = extract_user_id(event)

    try:
        if not user_id:
            return ResponseBuilder.unauthorized(request_id, trace_id)

        xray_recorder.put_annotation("user_id", user_id)

        # In Cognito, logout is typically client-side (token invalidation)
        # We just acknowledge the logout
        return ResponseBuilder.success(
            {
                "message": "Logged out successfully",
            },
            request_id,
            trace_id,
        )

    except Exception as e:
        logger.error(f"Logout handler error: {str(e)}", exc_info=True)
        return ResponseBuilder.server_error(
            "LOGOUT_ERROR",
            "Logout error",
            request_id,
            trace_id,
            str(e),
        )
