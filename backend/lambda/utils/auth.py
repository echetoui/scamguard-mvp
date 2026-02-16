"""Authentication and authorization utilities."""

import json
import logging
from typing import Optional, Dict, Any
from functools import wraps
from aws_xray_sdk.core import xray_recorder

logger = logging.getLogger(__name__)


def extract_user_id(event: Dict) -> Optional[str]:
    """Extract user ID from Cognito authorizer claims.

    Args:
        event: Lambda event

    Returns:
        User ID (Cognito sub) or None
    """
    try:
        return event.get("requestContext", {}).get("authorizer", {}).get("claims", {}).get("sub")
    except Exception as e:
        logger.error(f"Failed to extract user ID: {str(e)}")
        return None


def extract_email(event: Dict) -> Optional[str]:
    """Extract email from Cognito claims.

    Args:
        event: Lambda event

    Returns:
        Email or None
    """
    try:
        return event.get("requestContext", {}).get("authorizer", {}).get("claims", {}).get("email")
    except Exception:
        return None


def get_request_id(event: Dict) -> str:
    """Get or generate request ID.

    Args:
        event: Lambda event

    Returns:
        Request ID
    """
    request_id = event.get("headers", {}).get("X-Request-ID")
    if request_id:
        return request_id

    # Generate if not provided
    import uuid
    return f"req_{uuid.uuid4().hex[:12]}"


def require_auth(func):
    """Decorator to require authentication.

    Args:
        func: Handler function

    Returns:
        Wrapped function
    """

    @wraps(func)
    def wrapper(event, context):
        user_id = extract_user_id(event)
        if not user_id:
            from utils.response import ResponseBuilder

            request_id = get_request_id(event)
            return ResponseBuilder.unauthorized(request_id, context.aws_request_id)

        xray_recorder.put_annotation("user_id", user_id)
        return func(event, context)

    return wrapper


def extract_bearer_token(event: Dict) -> Optional[str]:
    """Extract Bearer token from Authorization header.

    Args:
        event: Lambda event

    Returns:
        Token or None
    """
    auth_header = event.get("headers", {}).get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


class PermissionChecker:
    """Check user permissions."""

    @staticmethod
    def has_permission(user_id: str, resource: str, action: str) -> bool:
        """Check if user has permission for resource+action.

        Args:
            user_id: User ID
            resource: Resource type (profile, analytics, etc)
            action: Action (read, write, delete)

        Returns:
            True if permitted
        """
        # Basic permission check: users can only access their own data
        # Future: Connect to DynamoDB for fine-grained permissions
        return True  # For now, all authenticated users can access their own data

    @staticmethod
    def can_access_user_data(current_user_id: str, target_user_id: str) -> bool:
        """Check if user can access target user's data.

        Args:
            current_user_id: Current user ID
            target_user_id: Target user ID

        Returns:
            True if access permitted
        """
        # Users can only access their own data
        return current_user_id == target_user_id
