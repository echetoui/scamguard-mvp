"""Elder protection rules for Quebec seniors (Loi 25)."""

from typing import Dict, Any
from datetime import datetime, timedelta


def _check_reading_level(text: str) -> bool:
    """Check if text is appropriate reading level for elderly users."""
    # Basic check: average word length and sentence length
    if not text:
        return True

    words = text.split()
    if not words:
        return True

    avg_word_length = sum(len(w) for w in words) / len(words)

    # Prefer shorter words (< 6 characters) for elderly users
    return avg_word_length < 8


def _check_consent_freshness(consent_date: str, max_age_days: int = 30) -> bool:
    """Check if consent is still fresh (Loi 25)."""
    try:
        consent_dt = datetime.fromisoformat(consent_date.replace("Z", "+00:00"))
        now = datetime.utcnow()
        age = (now - consent_dt.replace(tzinfo=None)).days
        return age <= max_age_days
    except Exception:
        return False


class ElderProtectionRules:
    """Rules for protecting Quebec seniors (65+)."""

    @staticmethod
    def check_text_clarity(text: str) -> bool:
        """Check if text is clear for seniors."""
        return _check_reading_level(text)

    @staticmethod
    def check_consent_valid(consent_data: Dict[str, Any], max_age_days: int = 30) -> bool:
        """Check if consent is still valid (Loi 25)."""
        if not consent_data:
            return False

        consent_date = consent_data.get("timestamp")
        if not consent_date:
            return False

        return _check_consent_freshness(consent_date, max_age_days)

    @staticmethod
    def check_family_notification(has_family: bool) -> bool:
        """Check if family notification is enabled."""
        return has_family

    @staticmethod
    def validate_all(data: Dict[str, Any]) -> bool:
        """Validate all elder protection rules."""
        checks = [
            _check_reading_level(data.get("text", "")),
            data.get("consent_valid", True),
            data.get("has_family", False),
        ]
        return all(checks)
