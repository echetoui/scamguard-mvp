"""Authentication and authorization utilities."""

import uuid
from typing import Dict, Any, Optional


def extract_user_id(event: Dict[str, Any]) -> Optional[str]:
    """Extract user ID from Lambda event."""
    try:
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        return claims.get("sub") or claims.get("cognito:username")
    except (AttributeError, KeyError, TypeError):
        return None


def extract_email(event: Dict[str, Any]) -> Optional[str]:
    """Extract email from Lambda event."""
    try:
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        return claims.get("email")
    except (AttributeError, KeyError, TypeError):
        return None


def get_request_id(event: Dict[str, Any]) -> str:
    """Get request ID from Lambda event (headers or requestContext), or generate one."""
    try:
        # First check headers for X-Request-ID
        headers = event.get("headers", {})
        if isinstance(headers, dict):
            request_id = headers.get("X-Request-ID") or headers.get("x-request-id")
            if request_id:
                return request_id
        # Fall back to requestContext
        ctx_id = event.get("requestContext", {}).get("requestId")
        if ctx_id:
            return ctx_id
    except (AttributeError, KeyError, TypeError):
        pass
    # Generate a request ID if none found
    return f"req_{uuid.uuid4().hex[:12]}"


class PermissionChecker:
    """Check user permissions."""

    @staticmethod
    def is_admin(event: Dict[str, Any]) -> bool:
        """Check if user is admin."""
        try:
            groups = (
                event.get("requestContext", {})
                .get("authorizer", {})
                .get("claims", {})
                .get("cognito:groups", [])
            )
            return "admin" in groups if isinstance(groups, list) else False
        except (AttributeError, KeyError, TypeError):
            return False

    @staticmethod
    def is_authenticated(event: Dict[str, Any]) -> bool:
        """Check if user is authenticated."""
        return extract_user_id(event) is not None

    @staticmethod
    def can_access_user_data(requesting_user_id: str, target_user_id: str) -> bool:
        """Check if a user can access another user's data.

        Users can only access their own data.
        """
        return requesting_user_id == target_user_id

    @staticmethod
    def has_permission(user_id: str, resource: str, action: str) -> bool:
        """Check if a user has permission to perform an action on a resource.

        Default policy: all authenticated users have basic read/write on standard resources.
        """
        if not user_id:
            return False
        # All authenticated users have basic permissions
        return True
