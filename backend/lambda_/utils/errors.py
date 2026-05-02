"""Error classes for API responses."""


class ScamGuardError(Exception):
    """Base error for ScamGuard."""

    code: str = "INTERNAL_ERROR"

    def __init__(self, message: str, status_code: int = 500):
        """Initialize error."""
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ValidationError(ScamGuardError):
    """Validation error."""

    code = "VALIDATION_ERROR"

    def __init__(self, message: str):
        """Initialize validation error."""
        super().__init__(message, 400)


class AuthenticationError(ScamGuardError):
    """Authentication error."""

    code = "AUTHENTICATION_ERROR"

    def __init__(self, message: str = "Unauthorized"):
        """Initialize authentication error."""
        super().__init__(message, 401)


class AuthorizationError(ScamGuardError):
    """Authorization error."""

    code = "AUTHORIZATION_ERROR"

    def __init__(self, message: str = "Forbidden"):
        """Initialize authorization error."""
        super().__init__(message, 403)


class NotFoundError(ScamGuardError):
    """Not found error."""

    code = "NOT_FOUND"

    def __init__(self, message: str = "Not found"):
        """Initialize not found error."""
        super().__init__(message, 404)


class ConflictError(ScamGuardError):
    """Conflict error."""

    code = "CONFLICT"

    def __init__(self, message: str = "Conflict"):
        """Initialize conflict error."""
        super().__init__(message, 409)


class RateLimitError(ScamGuardError):
    """Rate limit error."""

    code = "RATE_LIMIT_EXCEEDED"

    def __init__(self, message: str = "Too many requests"):
        """Initialize rate limit error."""
        super().__init__(message, 429)


class InternalServerError(ScamGuardError):
    """Internal server error."""

    code = "INTERNAL_ERROR"

    def __init__(self, message: str = "Internal server error"):
        """Initialize internal server error."""
        super().__init__(message, 500)


class VisionAPITimeout(ScamGuardError):
    """Vision API timeout error."""

    code = "VISION_ANALYSIS_TIMEOUT"

    def __init__(self, timeout_seconds: int = 60):
        """Initialize timeout error."""
        super().__init__(f"Vision API timed out after {timeout_seconds}s", 500)


class RateLimitExceeded(ScamGuardError):
    """Rate limit exceeded error."""

    code = "RATE_LIMIT_EXCEEDED"

    def __init__(self, retry_after: int = 60):
        """Initialize rate limit error."""
        super().__init__(f"Rate limit exceeded, retry after {retry_after}s", 429)


class GeminiAPIError(ScamGuardError):
    """Gemini API error."""

    code = "SCENARIO_GENERATION_FAILED"

    def __init__(self, message: str = "Gemini API error"):
        """Initialize Gemini API error."""
        super().__init__(message, 500)
