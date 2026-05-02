"""Elder protection rules for Quebec seniors (Loi 25)."""

from typing import Dict, Any, List, Tuple
from datetime import datetime, timedelta


# ---------------------------------------------------------------------------
# Module-level utility functions (importable directly)
# ---------------------------------------------------------------------------

def _check_reading_level(text: str) -> bool:
    """Check if text is appropriate reading level for elderly users.

    Uses average word length as proxy: < 8 chars average = readable.
    """
    if not text:
        return True

    words = text.split()
    if not words:
        return True

    avg_word_length = sum(len(w) for w in words) / len(words)
    return avg_word_length < 8


def _check_consent_freshness(consent_data: Dict[str, Any], days: int = 30) -> bool:
    """Check if consent is still fresh (Loi 25).

    Accepts a dict with 'consent_timestamp' key.
    """
    if not isinstance(consent_data, dict):
        return False
    consent_date = consent_data.get("consent_timestamp") or consent_data.get("timestamp")
    if not consent_date:
        return False
    try:
        consent_dt = datetime.fromisoformat(str(consent_date).replace("Z", "+00:00"))
        now = datetime.utcnow()
        age = (now - consent_dt.replace(tzinfo=None)).days
        return age <= days
    except Exception:
        return False


# ---------------------------------------------------------------------------
# ComplianceLevel (local import to avoid circular)
# ---------------------------------------------------------------------------

from .rules import ComplianceLevel, ComplianceRule


# ---------------------------------------------------------------------------
# ElderProtectionRules: static factory methods
# ---------------------------------------------------------------------------

class ElderProtectionRules:
    """Rules for protecting Quebec seniors (65+)."""

    @staticmethod
    def verify_accessible_ui() -> ComplianceRule:
        """Accessible UI: large font must be enabled."""
        return ComplianceRule(
            code="ACCESSIBLE_UI",
            description="App must support large font mode for elderly users.",
            level=ComplianceLevel.CRITICAL,
            category="accessibility",
            check_func=lambda d: bool(d.get("large_font_enabled")),
        )

    @staticmethod
    def verify_image_auto_deletion() -> ComplianceRule:
        """Images must be auto-deleted within 24 hours (86400 seconds)."""
        return ComplianceRule(
            code="IMAGE_AUTO_DELETE",
            description="User images must be deleted automatically within 24 hours.",
            level=ComplianceLevel.CRITICAL,
            category="privacy",
            check_func=lambda d: (
                d.get("image_ttl") is not None and d.get("image_ttl") <= 86400
            ),
        )

    @staticmethod
    def verify_family_notification_option() -> ComplianceRule:
        """Family notification option must be available."""
        return ComplianceRule(
            code="FAMILY_NOTIFICATION",
            description="Family notification option must be available to elder users.",
            level=ComplianceLevel.ERROR,
            category="safety",
            check_func=lambda d: bool(d.get("family_notification_enabled")),
        )

    @staticmethod
    def verify_no_user_profiling() -> ComplianceRule:
        """Marketing profiling must be disabled for elder users."""
        return ComplianceRule(
            code="NO_ELDER_PROFILING",
            description="Marketing profiling must be disabled for elderly users.",
            level=ComplianceLevel.CRITICAL,
            category="privacy",
            check_func=lambda d: bool(d.get("marketing_profiling_disabled")),
        )

    @staticmethod
    def verify_simplified_language() -> ComplianceRule:
        """Text must use simplified language (reading level check)."""
        return ComplianceRule(
            code="SIMPLIFIED_LANGUAGE",
            description="All text content must use simplified language for elderly users.",
            level=ComplianceLevel.ERROR,
            category="accessibility",
            check_func=lambda d: _check_reading_level(d.get("text", "")),
        )

    @staticmethod
    def verify_phone_support_available() -> ComplianceRule:
        """Phone support must be available."""
        return ComplianceRule(
            code="PHONE_SUPPORT",
            description="Phone support must be available for elderly users.",
            level=ComplianceLevel.WARNING,
            category="support",
            check_func=lambda d: (
                bool(d.get("phone_support_enabled")) and bool(d.get("phone_support_hours"))
            ),
        )

    @staticmethod
    def verify_email_only_authentication() -> ComplianceRule:
        """Authentication should use email-only (MFA optional)."""
        return ComplianceRule(
            code="EMAIL_ONLY_AUTH",
            description="Authentication must use email-only method (MFA optional for seniors).",
            level=ComplianceLevel.WARNING,
            category="authentication",
            check_func=lambda d: (
                d.get("auth_method") == "email_only" and bool(d.get("mfa_optional"))
            ),
        )

    @staticmethod
    def verify_no_dark_patterns() -> ComplianceRule:
        """UI must pass a dark patterns audit."""
        return ComplianceRule(
            code="NO_DARK_PATTERNS",
            description="UI must not contain dark patterns (confirmed by audit).",
            level=ComplianceLevel.CRITICAL,
            category="ethics",
            check_func=lambda d: bool(d.get("dark_patterns_audit_passed")),
        )

    @staticmethod
    def verify_easy_data_deletion() -> ComplianceRule:
        """Data deletion must require 3 clicks or fewer."""
        return ComplianceRule(
            code="EASY_DATA_DELETION",
            description="Data deletion must be accessible in 3 clicks or fewer.",
            level=ComplianceLevel.WARNING,
            category="privacy",
            check_func=lambda d: (
                d.get("deletion_clicks_required") is not None
                and d.get("deletion_clicks_required") <= 3
            ),
        )

    @staticmethod
    def verify_training_data_anonymization() -> ComplianceRule:
        """Training data must not contain PII (user_id, email)."""
        _forbidden_pii = {"user_id", "email", "phone", "name", "address"}

        def _check(d: Dict[str, Any]) -> bool:
            return not bool(_forbidden_pii & set(d.keys()))

        return ComplianceRule(
            code="ANONYMIZED_TRAINING_DATA",
            description="Training data must not contain personally identifiable information.",
            level=ComplianceLevel.CRITICAL,
            category="privacy",
            check_func=_check,
        )

    @staticmethod
    def verify_explicit_elder_consent() -> ComplianceRule:
        """User must have given explicit consent with a timestamp."""
        return ComplianceRule(
            code="EXPLICIT_ELDER_CONSENT",
            description="Elderly users must give explicit consent with recorded timestamp.",
            level=ComplianceLevel.CRITICAL,
            category="legal",
            check_func=lambda d: (
                bool(d.get("has_explicit_consent"))
                and bool(d.get("consent_timestamp"))
            ),
        )

    @staticmethod
    def get_all_elder_rules() -> List[ComplianceRule]:
        """Return all 12 elder protection rules."""
        return [
            ElderProtectionRules.verify_accessible_ui(),
            ElderProtectionRules.verify_image_auto_deletion(),
            ElderProtectionRules.verify_family_notification_option(),
            ElderProtectionRules.verify_no_user_profiling(),
            ElderProtectionRules.verify_simplified_language(),
            ElderProtectionRules.verify_phone_support_available(),
            ElderProtectionRules.verify_email_only_authentication(),
            ElderProtectionRules.verify_no_dark_patterns(),
            ElderProtectionRules.verify_easy_data_deletion(),
            ElderProtectionRules.verify_training_data_anonymization(),
            ElderProtectionRules.verify_explicit_elder_consent(),
            # 12th rule placeholder: consent freshness check
            ComplianceRule(
                code="CONSENT_FRESHNESS",
                description="Consent must be renewed within 30 days (Loi 25).",
                level=ComplianceLevel.WARNING,
                category="legal",
                check_func=lambda d: _check_consent_freshness(d, days=30),
            ),
        ]

    @staticmethod
    def get_critical_elder_rules() -> List[ComplianceRule]:
        """Return only CRITICAL elder rules."""
        return [r for r in ElderProtectionRules.get_all_elder_rules()
                if r.level == ComplianceLevel.CRITICAL]

    # -------------------------------------------------------------------------
    # Legacy interface (kept for backward compatibility)
    # -------------------------------------------------------------------------

    @staticmethod
    def check_text_clarity(text: str) -> bool:
        """Check if text is clear for seniors (legacy)."""
        return _check_reading_level(text)

    @staticmethod
    def check_consent_valid(consent_data: Dict[str, Any], max_age_days: int = 30) -> bool:
        """Check if consent is still valid (legacy)."""
        return _check_consent_freshness(consent_data, days=max_age_days)

    @staticmethod
    def check_family_notification(has_family: bool) -> bool:
        """Check if family notification is enabled (legacy)."""
        return has_family

    @staticmethod
    def validate_all(data: Dict[str, Any]) -> bool:
        """Validate all elder protection rules (legacy)."""
        checks = [
            _check_reading_level(data.get("text", "")),
            data.get("consent_valid", True),
            data.get("has_family", False),
        ]
        return all(checks)
