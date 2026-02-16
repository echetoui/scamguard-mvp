"""Utility modules for ScamGuard backend."""

from .retry import retry_with_backoff, RetryConfig
from .errors import ScamGuardError, VisionAPIError, ScenarioGenerationError
from .response import ResponseBuilder, HTTPStatus, RateLimitHeaders
from .auth import extract_user_id, extract_email, get_request_id, PermissionChecker
from .performance import monitor_performance, timeout_guard

__all__ = [
    # Retry
    "retry_with_backoff",
    "RetryConfig",
    # Errors
    "ScamGuardError",
    "VisionAPIError",
    "ScenarioGenerationError",
    # Response
    "ResponseBuilder",
    "HTTPStatus",
    "RateLimitHeaders",
    # Auth
    "extract_user_id",
    "extract_email",
    "get_request_id",
    "PermissionChecker",
    # Performance
    "monitor_performance",
    "timeout_guard",
]
