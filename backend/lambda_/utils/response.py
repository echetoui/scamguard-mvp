"""API response builders and utilities."""

from enum import IntEnum
from typing import Dict, Any, Optional


class HTTPStatus(IntEnum):
    """HTTP status codes."""

    OK = 200
    CREATED = 201
    ACCEPTED = 202
    NO_CONTENT = 204
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    CONFLICT = 409
    INTERNAL_SERVER_ERROR = 500
    SERVICE_UNAVAILABLE = 503


class RateLimitHeaders:
    """Rate limit headers for API responses."""

    def __init__(
        self, limit: int = 100, remaining: int = 99, reset_at: int = 0
    ):
        """Initialize rate limit headers."""
        self.limit = limit
        self.remaining = remaining
        self.reset_at = reset_at

    def to_dict(self) -> Dict[str, str]:
        """Convert to HTTP headers dict."""
        return {
            "X-RateLimit-Limit": str(self.limit),
            "X-RateLimit-Remaining": str(self.remaining),
            "X-RateLimit-Reset": str(self.reset_at),
        }


class ResponseBuilder:
    """Builder for API responses."""

    def __init__(self, status: int = HTTPStatus.OK):
        """Initialize response builder."""
        self.status = status
        self.data: Optional[Any] = None
        self.error: Optional[str] = None
        self.headers: Dict[str, str] = {}

    def with_data(self, data: Any) -> "ResponseBuilder":
        """Add data to response."""
        self.data = data
        return self

    def with_error(self, error: str) -> "ResponseBuilder":
        """Add error to response."""
        self.error = error
        return self

    def with_status(self, status: int) -> "ResponseBuilder":
        """Set response status."""
        self.status = status
        return self

    def with_headers(self, headers: Dict[str, str]) -> "ResponseBuilder":
        """Add custom headers."""
        self.headers.update(headers)
        return self

    def with_rate_limit(self, rate_limit: RateLimitHeaders) -> "ResponseBuilder":
        """Add rate limit headers."""
        self.headers.update(rate_limit.to_dict())
        return self

    def build(self) -> Dict[str, Any]:
        """Build the response."""
        body = {}
        if self.data is not None:
            body["data"] = self.data
        if self.error is not None:
            body["error"] = self.error

        return {
            "statusCode": self.status,
            "body": body,
            "headers": self.headers or {},
        }
