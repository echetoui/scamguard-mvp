"""API response builders and utilities."""

import json
from datetime import datetime
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

    @staticmethod
    def success(
        data: Any,
        request_id: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build a success response (200)."""
        body = {
            "data": data,
            "meta": {
                "request_id": request_id or "unknown",
                "trace_id": trace_id or "unknown",
                "processed_at": datetime.utcnow().isoformat() + "Z",
            },
        }

        return {
            "statusCode": 200,
            "body": json.dumps(body),
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id or "unknown",
                "X-Trace-ID": trace_id or "unknown",
            },
        }

    @staticmethod
    def error(
        code: str,
        message: str,
        request_id: Optional[str] = None,
        trace_id: Optional[str] = None,
        status_code: int = 500,
        details: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build an error response."""
        body = {
            "error": {
                "code": code,
                "message": message,
                "trace_id": trace_id or "unknown",
            }
        }
        if details:
            body["error"]["details"] = details

        return {
            "statusCode": status_code,
            "body": json.dumps(body),
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id or "unknown",
                "X-Trace-ID": trace_id or "unknown",
            },
        }

    @staticmethod
    def created(
        data: Any,
        request_id: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build a created response (201)."""
        body = {
            "data": data,
            "meta": {
                "request_id": request_id or "unknown",
                "trace_id": trace_id or "unknown",
            },
        }

        return {
            "statusCode": 201,
            "body": json.dumps(body),
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id or "unknown",
                "X-Trace-ID": trace_id or "unknown",
            },
        }

    @staticmethod
    def accepted(
        data: Any,
        request_id: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build an accepted response (202)."""
        body = {
            "data": data,
            "meta": {
                "request_id": request_id or "unknown",
                "trace_id": trace_id or "unknown",
            },
        }

        return {
            "statusCode": 202,
            "body": json.dumps(body),
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id or "unknown",
                "X-Trace-ID": trace_id or "unknown",
            },
        }

    @staticmethod
    def bad_request(
        code: str,
        message: str,
        request_id: Optional[str] = None,
        trace_id: Optional[str] = None,
        details: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build a bad request response (400)."""
        return ResponseBuilder.error(
            code=code,
            message=message,
            request_id=request_id,
            trace_id=trace_id,
            status_code=400,
            details=details,
        )

    @staticmethod
    def unauthorized(
        request_id: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build an unauthorized response (401)."""
        return ResponseBuilder.error(
            code="UNAUTHORIZED",
            message="Unauthorized",
            request_id=request_id,
            trace_id=trace_id,
            status_code=401,
        )

    @staticmethod
    def forbidden(
        request_id: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build a forbidden response (403)."""
        return ResponseBuilder.error(
            code="FORBIDDEN",
            message="Forbidden",
            request_id=request_id,
            trace_id=trace_id,
            status_code=403,
        )

    @staticmethod
    def not_found(
        resource: str = "Resource",
        request_id: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build a not found response (404)."""
        return ResponseBuilder.error(
            code="NOT_FOUND",
            message=f"{resource} not found",
            request_id=request_id,
            trace_id=trace_id,
            status_code=404,
        )

    @staticmethod
    def conflict(
        code: str = "CONFLICT",
        message: str = "Conflict",
        request_id: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build a conflict response (409)."""
        return ResponseBuilder.error(
            code=code,
            message=message,
            request_id=request_id,
            trace_id=trace_id,
            status_code=409,
        )

    @staticmethod
    def rate_limit(
        request_id: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build a rate limit response (429)."""
        return ResponseBuilder.error(
            code="RATE_LIMIT_EXCEEDED",
            message="Too many requests",
            request_id=request_id,
            trace_id=trace_id,
            status_code=429,
        )

    @staticmethod
    def server_error(
        code: str = "INTERNAL_SERVER_ERROR",
        message: str = "Internal server error",
        request_id: Optional[str] = None,
        trace_id: Optional[str] = None,
        details: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build a server error response (500)."""
        return ResponseBuilder.error(
            code=code,
            message=message,
            request_id=request_id,
            trace_id=trace_id,
            status_code=500,
            details=details,
        )
