"""API response builders - Standardized response formatting."""

import json
from datetime import datetime
from typing import Any, Dict, Optional
from enum import Enum


class HTTPStatus(Enum):
    """HTTP status codes."""

    OK = 200
    CREATED = 201
    ACCEPTED = 202
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    CONFLICT = 409
    RATE_LIMIT = 429
    INTERNAL_ERROR = 500
    SERVICE_UNAVAILABLE = 503


class ResponseBuilder:
    """Build standardized API responses."""

    @staticmethod
    def success(
        data: Dict[str, Any],
        request_id: str,
        trace_id: str,
        status_code: int = HTTPStatus.OK.value,
    ) -> Dict:
        """Build success response.

        Args:
            data: Response data
            request_id: Unique request ID
            trace_id: X-Ray trace ID
            status_code: HTTP status code

        Returns:
            Lambda response dict
        """
        return {
            "statusCode": status_code,
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id,
                "X-Trace-ID": trace_id,
            },
            "body": json.dumps({
                "data": data,
                "meta": {
                    "request_id": request_id,
                    "processed_at": datetime.utcnow().isoformat() + "Z",
                    "trace_id": trace_id,
                },
            }),
        }

    @staticmethod
    def error(
        code: str,
        message: str,
        request_id: str,
        trace_id: str,
        status_code: int = HTTPStatus.INTERNAL_ERROR.value,
        details: str = "",
        retry_after: Optional[int] = None,
    ) -> Dict:
        """Build error response.

        Args:
            code: Error code (e.g., VISION_ANALYSIS_TIMEOUT)
            message: User-friendly message
            request_id: Unique request ID
            trace_id: X-Ray trace ID
            status_code: HTTP status code
            details: Technical details
            retry_after: Seconds to wait before retry

        Returns:
            Lambda response dict
        """
        headers = {
            "Content-Type": "application/json",
            "X-Request-ID": request_id,
            "X-Trace-ID": trace_id,
        }

        if retry_after:
            headers["Retry-After"] = str(retry_after)

        error_obj = {
            "code": code,
            "message": message,
            "trace_id": trace_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        if details:
            error_obj["details"] = details

        if retry_after:
            error_obj["retry_after"] = retry_after

        return {
            "statusCode": status_code,
            "headers": headers,
            "body": json.dumps({
                "error": error_obj,
                "meta": {
                    "request_id": request_id,
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                },
            }),
        }

    @staticmethod
    def created(
        data: Dict[str, Any],
        request_id: str,
        trace_id: str,
    ) -> Dict:
        """Build 201 Created response."""
        return ResponseBuilder.success(
            data, request_id, trace_id, HTTPStatus.CREATED.value
        )

    @staticmethod
    def accepted(
        data: Dict[str, Any],
        request_id: str,
        trace_id: str,
    ) -> Dict:
        """Build 202 Accepted response (async)."""
        return ResponseBuilder.success(
            data, request_id, trace_id, HTTPStatus.ACCEPTED.value
        )

    @staticmethod
    def bad_request(
        code: str,
        message: str,
        request_id: str,
        trace_id: str,
        details: str = "",
    ) -> Dict:
        """Build 400 Bad Request response."""
        return ResponseBuilder.error(
            code,
            message,
            request_id,
            trace_id,
            HTTPStatus.BAD_REQUEST.value,
            details,
        )

    @staticmethod
    def unauthorized(
        request_id: str,
        trace_id: str,
        message: str = "Authentication required",
    ) -> Dict:
        """Build 401 Unauthorized response."""
        return ResponseBuilder.error(
            "UNAUTHORIZED",
            message,
            request_id,
            trace_id,
            HTTPStatus.UNAUTHORIZED.value,
        )

    @staticmethod
    def rate_limit(
        request_id: str,
        trace_id: str,
        retry_after: int = 60,
    ) -> Dict:
        """Build 429 Rate Limit response."""
        return ResponseBuilder.error(
            "RATE_LIMIT_EXCEEDED",
            f"Rate limit exceeded. Try again in {retry_after}s",
            request_id,
            trace_id,
            HTTPStatus.RATE_LIMIT.value,
            retry_after=retry_after,
        )

    @staticmethod
    def not_found(
        request_id: str,
        trace_id: str,
        resource: str = "Resource",
    ) -> Dict:
        """Build 404 Not Found response."""
        return ResponseBuilder.error(
            "NOT_FOUND",
            f"{resource} not found",
            request_id,
            trace_id,
            HTTPStatus.NOT_FOUND.value,
        )

    @staticmethod
    def server_error(
        code: str,
        message: str,
        request_id: str,
        trace_id: str,
        details: str = "",
    ) -> Dict:
        """Build 500 Server Error response."""
        return ResponseBuilder.error(
            code,
            message,
            request_id,
            trace_id,
            HTTPStatus.INTERNAL_ERROR.value,
            details,
        )


class RateLimitHeaders:
    """Build rate limit response headers."""

    @staticmethod
    def add_to_headers(
        headers: Dict,
        remaining: int,
        limit: int,
        reset_timestamp: int,
    ) -> Dict:
        """Add rate limit headers to response.

        Args:
            headers: Existing headers dict
            remaining: Requests remaining
            limit: Total request limit
            reset_timestamp: Unix timestamp when limit resets

        Returns:
            Updated headers
        """
        headers.update({
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(reset_timestamp),
        })
        return headers
