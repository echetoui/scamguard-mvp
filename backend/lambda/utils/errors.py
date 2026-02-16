"""Custom error classes for ScamGuard."""


class ScamGuardError(Exception):
    """Base error for ScamGuard."""

    def __init__(self, code: str, message: str, details: str = "", status_code: int = 500):
        """Initialize error.

        Args:
            code: Error code (e.g., VISION_ANALYSIS_TIMEOUT)
            message: User-friendly message
            details: Technical details
            status_code: HTTP status code
        """
        self.code = code
        self.message = message
        self.details = details
        self.status_code = status_code
        super().__init__(message)


class VisionAPIError(ScamGuardError):
    """Vision API (GPT-4o-mini) error."""

    def __init__(self, message: str, details: str = ""):
        super().__init__(
            code="VISION_API_ERROR",
            message=message or "Vision analysis failed",
            details=details,
            status_code=500,
        )


class VisionAPITimeout(VisionAPIError):
    """Vision API timeout."""

    def __init__(self, duration_sec: int = 60):
        super().__init__(
            code="VISION_ANALYSIS_TIMEOUT",
            message=f"GPT-4o-mini analysis exceeded {duration_sec}s timeout",
        )


class ScenarioGenerationError(ScamGuardError):
    """Scenario generation error."""

    def __init__(self, message: str = ""):
        super().__init__(
            code="SCENARIO_GENERATION_FAILED",
            message=message or "Failed to generate scenario",
            status_code=500,
        )


class GeminiAPIError(ScenarioGenerationError):
    """Gemini API error."""

    def __init__(self, message: str = ""):
        super().__init__(message or "Gemini API error (using fallback)")


class RateLimitExceeded(ScamGuardError):
    """Rate limit exceeded."""

    def __init__(self, retry_after: int = 60):
        super().__init__(
            code="RATE_LIMIT_EXCEEDED",
            message=f"Rate limit exceeded. Try again in {retry_after}s",
            status_code=429,
        )


class InvalidImageFormat(ScamGuardError):
    """Invalid image format."""

    def __init__(self, format: str = ""):
        super().__init__(
            code="INVALID_IMAGE_FORMAT",
            message="Image format not supported",
            details=f"Supported: JPG, PNG. Got: {format}",
            status_code=400,
        )


class ImageTooLarge(ScamGuardError):
    """Image file too large."""

    def __init__(self, size_mb: float = 0, max_mb: float = 20):
        super().__init__(
            code="IMAGE_TOO_LARGE",
            message=f"Image exceeds {max_mb}MB limit",
            details=f"File size: {size_mb:.1f}MB",
            status_code=400,
        )


class AuthenticationError(ScamGuardError):
    """Authentication error."""

    def __init__(self, message: str = ""):
        super().__init__(
            code="AUTH_FAILED",
            message=message or "Authentication failed",
            status_code=401,
        )


class EmailNotVerified(AuthenticationError):
    """Email not verified."""

    def __init__(self):
        super().__init__("Email not verified. Check your inbox for confirmation code.")
        self.code = "COGNITO_EMAIL_NOT_VERIFIED"


class DatabaseError(ScamGuardError):
    """Database error."""

    def __init__(self, message: str = "", details: str = ""):
        super().__init__(
            code="DB_QUERY_FAILED",
            message=message or "Database query failed",
            details=details,
            status_code=500,
        )


class SecretsError(ScamGuardError):
    """Secrets Manager error."""

    def __init__(self, secret_name: str = ""):
        super().__init__(
            code="SECRETS_RETRIEVAL_FAILED",
            message="Failed to retrieve API keys",
            details=f"Secret: {secret_name}",
            status_code=500,
        )
