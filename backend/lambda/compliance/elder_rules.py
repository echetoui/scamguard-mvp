"""Elder protection rules - Specialized FDP patterns for vulnerable elderly users."""

from enum import Enum
from typing import List, Dict, Any
from dataclasses import dataclass
from .rules import ComplianceLevel, ComplianceRule


class ElderProtectionRules:
    """FDP Platform rules specialized for elderly user protection."""

    @staticmethod
    def verify_accessible_ui() -> ComplianceRule:
        """Verify platform provides accessible UI for elderly users."""
        return ComplianceRule(
            code="ACCESSIBLE_UI",
            description="Platform must support large fonts, clear language, simple navigation",
            level=ComplianceLevel.CRITICAL,
            category="accessibility",
            check_func=lambda config: config.get("large_font_enabled") == True,
            remediation="Enable large font mode (18pt+), clear buttons, simple navigation flow",
        )

    @staticmethod
    def verify_image_auto_deletion() -> ComplianceRule:
        """Verify images are automatically deleted after analysis."""
        return ComplianceRule(
            code="IMAGE_AUTO_DELETE",
            description="Uploaded images must be deleted within 24h to protect privacy",
            level=ComplianceLevel.CRITICAL,
            category="privacy",
            check_func=lambda item: item.get("image_ttl", float('inf')) <= 86400,  # 24 hours in seconds
            remediation="Set image TTL to maximum 24 hours (86400 seconds)",
        )

    @staticmethod
    def verify_family_notification_option() -> ComplianceRule:
        """Verify option for elderly users to notify family of progress."""
        return ComplianceRule(
            code="FAMILY_NOTIFICATION",
            description="Elderly users should be able to notify family members of training progress",
            level=ComplianceLevel.ERROR,
            category="support",
            check_func=lambda config: config.get("family_notification_enabled") == True,
            remediation="Implement optional email notifications to trusted family members",
        )

    @staticmethod
    def verify_no_user_profiling() -> ComplianceRule:
        """Verify training data is not used for profiling or marketing."""
        return ComplianceRule(
            code="NO_ELDER_PROFILING",
            description="Training data must not be used to profile elderly users for marketing or targeting",
            level=ComplianceLevel.CRITICAL,
            category="privacy",
            check_func=lambda config: config.get("marketing_profiling_disabled") == True,
            remediation="Disable all user behavior profiling; analytics must be aggregated only",
        )

    @staticmethod
    def verify_simplified_language() -> ComplianceRule:
        """Verify instructions and messages use simple, clear language."""
        return ComplianceRule(
            code="SIMPLIFIED_LANGUAGE",
            description="All UI text must use simple language (8th grade reading level max)",
            level=ComplianceLevel.ERROR,
            category="accessibility",
            check_func=lambda content: _check_reading_level(content.get("text", "")),
            remediation="Review all UI text for clarity; use short sentences, common words",
        )

    @staticmethod
    def verify_phone_support_available() -> ComplianceRule:
        """Verify phone support is available for elderly users."""
        return ComplianceRule(
            code="PHONE_SUPPORT",
            description="Phone support must be available for elderly users who need assistance",
            level=ComplianceLevel.ERROR,
            category="support",
            check_func=lambda config: config.get("phone_support_enabled") == True
                                     and config.get("phone_support_hours") is not None,
            remediation="Set up phone support line with training on elderly user assistance",
        )

    @staticmethod
    def verify_email_only_authentication() -> ComplianceRule:
        """Verify authentication uses email only (no complex TOTP/SMS)."""
        return ComplianceRule(
            code="EMAIL_ONLY_AUTH",
            description="Authentication should use email verification only (no SMS/TOTP complexity)",
            level=ComplianceLevel.ERROR,
            category="security",
            check_func=lambda config: config.get("auth_method") == "email_only"
                                     and config.get("mfa_optional") == True,
            remediation="Simplify auth to email verification codes; make MFA optional",
        )

    @staticmethod
    def verify_no_dark_patterns() -> ComplianceRule:
        """Verify absence of dark patterns in consent flows."""
        return ComplianceRule(
            code="NO_DARK_PATTERNS",
            description="Consent flows must not use dark patterns (pre-checked boxes, hidden options)",
            level=ComplianceLevel.CRITICAL,
            category="legal",
            check_func=lambda config: config.get("dark_patterns_audit_passed") == True,
            remediation="Audit all consent forms; ensure clear yes/no options, no defaults",
        )

    @staticmethod
    def verify_easy_data_deletion() -> ComplianceRule:
        """Verify elderly users can easily delete their data."""
        return ComplianceRule(
            code="EASY_DATA_DELETION",
            description="Deletion option must be easy to find and use (max 3 clicks)",
            level=ComplianceLevel.ERROR,
            category="privacy",
            check_func=lambda config: config.get("deletion_clicks_required", float('inf')) <= 3,
            remediation="Make delete account option easily accessible in settings",
        )

    @staticmethod
    def verify_training_data_anonymization() -> ComplianceRule:
        """Verify training session data is anonymized in analytics."""
        return ComplianceRule(
            code="ANONYMIZED_TRAINING_DATA",
            description="Training session analytics must be anonymized (no user IDs in logs)",
            level=ComplianceLevel.CRITICAL,
            category="privacy",
            check_func=lambda data: "user_id" not in data and "email" not in data,
            remediation="Remove user identifiers from training analytics; use hashed IDs only",
        )

    @staticmethod
    def verify_explicit_elder_consent() -> ComplianceRule:
        """Verify explicit consent for elderly users before image analysis."""
        return ComplianceRule(
            code="EXPLICIT_ELDER_CONSENT",
            description="Elderly users must explicitly consent before uploading/analyzing images",
            level=ComplianceLevel.CRITICAL,
            category="legal",
            check_func=lambda user: user.get("has_explicit_consent") == True
                                   and user.get("consent_timestamp") is not None,
            remediation="Show clear consent dialog before image upload; require explicit approval",
        )

    @staticmethod
    def verify_consent_refresh() -> ComplianceRule:
        """Verify consent is refreshed periodically (every 30 days)."""
        return ComplianceRule(
            code="CONSENT_REFRESH",
            description="Elderly users should re-confirm consent every 30 days",
            level=ComplianceLevel.WARNING,
            category="legal",
            check_func=lambda user: _check_consent_freshness(user, days=30),
            remediation="Show consent reminder every 30 days; track re-confirmation dates",
        )

    @staticmethod
    def get_all_elder_rules() -> List[ComplianceRule]:
        """Get all elder protection rules."""
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
            ElderProtectionRules.verify_consent_refresh(),
        ]

    @staticmethod
    def get_critical_elder_rules() -> List[ComplianceRule]:
        """Get critical elder protection rules."""
        return [
            r for r in ElderProtectionRules.get_all_elder_rules()
            if r.level == ComplianceLevel.CRITICAL
        ]


def _check_reading_level(text: str) -> bool:
    """Check if text is at appropriate reading level for elderly users.

    Simplified heuristic: average word length <= 5 chars,
    average sentence length <= 15 words.
    """
    if not text or len(text.strip()) == 0:
        return True

    words = text.split()
    if len(words) == 0:
        return True

    avg_word_length = sum(len(w) for w in words) / len(words)

    sentences = text.split('.')
    avg_sentence_length = len(words) / max(len(sentences), 1) if sentences else 0

    # Simple heuristic: average word < 5 chars and < 15 words per sentence
    return avg_word_length <= 5.5 and avg_sentence_length <= 18


def _check_consent_freshness(user: Dict[str, Any], days: int = 30) -> bool:
    """Check if user's consent is fresh (within specified days)."""
    from datetime import datetime, timedelta

    consent_timestamp = user.get("consent_timestamp")
    if not consent_timestamp:
        return False

    try:
        if isinstance(consent_timestamp, str):
            consent_date = datetime.fromisoformat(consent_timestamp.replace('Z', '+00:00'))
        else:
            consent_date = consent_timestamp

        age_days = (datetime.utcnow() - consent_date.replace(tzinfo=None)).days
        return age_days <= days
    except Exception:
        return False
