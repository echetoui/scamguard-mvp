"""Shared HTTP response helpers for all Lambda handlers."""

import json
from typing import Any, Dict, Optional

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def ok(data: Any, status: int = 200) -> Dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps({"data": data}, default=str),
    }


def created(data: Any) -> Dict:
    return ok(data, 201)


def error(status: int, code: str, message: str) -> Dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps({"error": {"code": code, "message": message}}),
    }


def bad_request(message: str, code: str = "BAD_REQUEST") -> Dict:
    return error(400, code, message)


def unauthorized(message: str = "Authentication required") -> Dict:
    return error(401, "UNAUTHORIZED", message)


def not_found(resource: str = "Resource") -> Dict:
    return error(404, "NOT_FOUND", f"{resource} not found")


def internal(e: Exception) -> Dict:
    return error(500, "INTERNAL_ERROR", str(e))


def cors_preflight() -> Dict:
    return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}


def extract_user_id(event: Dict) -> Optional[str]:
    """
    Extract authenticated user's Cognito sub from API Gateway HTTP v2 event.

    HTTP v2 JWT authorizer stores claims at:
      event['requestContext']['authorizer']['jwt']['claims']['sub']

    Falls back to the REST API v1 location:
      event['requestContext']['authorizer']['claims']['sub']
    """
    rc = event.get("requestContext", {})

    # HTTP v2 JWT authorizer
    jwt_claims = rc.get("authorizer", {}).get("jwt", {}).get("claims", {})
    if jwt_claims.get("sub"):
        return jwt_claims["sub"]

    # REST API v1 Lambda authorizer / Cognito authorizer
    claims = rc.get("authorizer", {}).get("claims", {})
    if claims.get("sub"):
        return claims["sub"]

    return None


def parse_body(event: Dict) -> Dict:
    """Safely parse JSON body from event."""
    body = event.get("body") or "{}"
    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, ValueError):
            return {}
    if isinstance(body, dict):
        return body
    return {}


def get_path(event: Dict) -> str:
    """Extract request path, normalising HTTP v1 vs v2."""
    # HTTP v2: rawPath
    path = event.get("rawPath") or event.get("path") or ""
    return path.rstrip("/")


def get_method(event: Dict) -> str:
    """Extract HTTP method, normalising HTTP v1 vs v2."""
    rc = event.get("requestContext", {})
    # HTTP v2
    method = rc.get("http", {}).get("method", "")
    if not method:
        # HTTP v1
        method = event.get("httpMethod", "GET")
    return method.upper()
