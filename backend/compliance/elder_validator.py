"""Elder validator for Quebec seniors compliance."""

from typing import Dict, Any
from .elder_rules import ElderProtectionRules


class ElderValidator:
    """Validates content for seniors (65+)."""

    def __init__(self):
        """Initialize elder validator."""
        self.rules = ElderProtectionRules()

    def validate(self, data: Dict[str, Any]) -> bool:
        """Validate data for elder users."""
        return self.rules.validate_all(data)

    def validate_text(self, text: str) -> bool:
        """Validate text clarity for seniors."""
        return self.rules.check_text_clarity(text)

    def validate_consent(self, consent_data: Dict[str, Any]) -> bool:
        """Validate consent freshness."""
        return self.rules.check_consent_valid(consent_data)
