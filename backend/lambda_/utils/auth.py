"""Authentication and authorization utilities."""

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
    """Get request ID from Lambda event."""
    try:
        return event.get("requestContext", {}).get("requestId", "unknown")
    except (AttributeError, KeyError, TypeError):
        return "unknown"


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
