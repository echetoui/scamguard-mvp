"""Error classes for API responses."""


class ScamGuardError(Exception):
    """Base error for ScamGuard."""

    def __init__(self, message: str, status_code: int = 500):
        """Initialize error."""
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ValidationError(ScamGuardError):
    """Validation error."""

    def __init__(self, message: str):
        """Initialize validation error."""
        super().__init__(message, 400)


class AuthenticationError(ScamGuardError):
    """Authentication error."""

    def __init__(self, message: str = "Unauthorized"):
        """Initialize authentication error."""
        super().__init__(message, 401)


class AuthorizationError(ScamGuardError):
    """Authorization error."""

    def __init__(self, message: str = "Forbidden"):
        """Initialize authorization error."""
        super().__init__(message, 403)


class NotFoundError(ScamGuardError):
    """Not found error."""

    def __init__(self, message: str = "Not found"):
        """Initialize not found error."""
        super().__init__(message, 404)


class ConflictError(ScamGuardError):
    """Conflict error."""

    def __init__(self, message: str = "Conflict"):
        """Initialize conflict error."""
        super().__init__(message, 409)


class RateLimitError(ScamGuardError):
    """Rate limit error."""

    def __init__(self, message: str = "Too many requests"):
        """Initialize rate limit error."""
        super().__init__(message, 429)


class InternalServerError(ScamGuardError):
    """Internal server error."""

    def __init__(self, message: str = "Internal server error"):
        """Initialize internal server error."""
        super().__init__(message, 500)
