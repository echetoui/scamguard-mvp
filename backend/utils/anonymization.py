"""Anonymization utilities."""

from typing import Dict, Any, Optional


class AnonymizationUtil:
    """Utility for anonymizing data."""

    @staticmethod
    def anonymize_email(email: str) -> str:
        """Anonymize email address."""
        if not email or "@" not in email:
            return "***"
        parts = email.split("@")
        user_part = parts[0][:2] + "***" if len(parts[0]) > 2 else "***"
        return f"{user_part}@{parts[1]}"

    @staticmethod
    def anonymize_data(data: Dict[str, Any], fields: list) -> Dict[str, Any]:
        """Anonymize specified fields in data."""
        result = data.copy()
        for field in fields:
            if field in result:
                result[field] = "***"
        return result

    @staticmethod
    def is_anonymized(data: Dict[str, Any]) -> bool:
        """Check if data is properly anonymized."""
        # Check for common PII patterns
        pii_indicators = [
            "@",  # Email
            "+1",  # Phone
            "SSN",  # Social security
        ]

        data_str = str(data).lower()
        return not any(indicator.lower() in data_str for indicator in pii_indicators)
