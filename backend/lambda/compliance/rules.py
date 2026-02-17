"""Compliance rules from FDP Platform patterns."""

from enum import Enum
from typing import List, Dict, Any
from dataclasses import dataclass


class ComplianceLevel(Enum):
    """Compliance severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class ComplianceRule:
    """Single compliance rule."""
    code: str
    description: str
    level: ComplianceLevel
    category: str
    check_func: callable
    remediation: str = ""


class ComplianceRules:
    """FDP Platform compliance rules adapted for ScamGuard."""

    @staticmethod
    def verify_user_identity() -> ComplianceRule:
        """Verify user has confirmed identity."""
        return ComplianceRule(
            code="IDENTITY_VERIFIED",
            description="User identity must be verified via email",
            level=ComplianceLevel.CRITICAL,
            category="authentication",
            check_func=lambda user: user.get("email_verified") == True,
            remediation="Send email verification code to user",
        )

    @staticmethod
    def verify_age_consent() -> ComplianceRule:
        """Verify user age and consent."""
        return ComplianceRule(
            code="AGE_CONSENT",
            description="User must be 18+ and accept terms",
            level=ComplianceLevel.CRITICAL,
            category="legal",
            check_func=lambda user: user.get("age_verified") == True
            and user.get("terms_accepted") == True,
            remediation="Request age confirmation and terms acceptance",
        )

    @staticmethod
    def verify_data_consent() -> ComplianceRule:
        """Verify data collection consent."""
        return ComplianceRule(
            code="DATA_CONSENT",
            description="User must consent to data collection",
            level=ComplianceLevel.ERROR,
            category="privacy",
            check_func=lambda user: user.get("data_consent") == True,
            remediation="Present privacy policy and request consent",
        )

    @staticmethod
    def verify_mfa_availability() -> ComplianceRule:
        """Verify MFA is available to user."""
        return ComplianceRule(
            code="MFA_AVAILABLE",
            description="MFA must be available for high-risk operations",
            level=ComplianceLevel.WARNING,
            category="security",
            check_func=lambda user: user.get("mfa_enabled") == True
            or user.get("can_enable_mfa") == True,
            remediation="Offer MFA setup to user",
        )

    @staticmethod
    def verify_data_minimization() -> ComplianceRule:
        """Verify only necessary data is collected."""
        return ComplianceRule(
            code="DATA_MINIMIZATION",
            description="Only collect data necessary for service",
            level=ComplianceLevel.WARNING,
            category="privacy",
            check_func=lambda data: len(data) <= 50,  # Max fields
            remediation="Remove unnecessary data fields",
        )

    @staticmethod
    def verify_data_retention() -> ComplianceRule:
        """Verify data retention policy."""
        return ComplianceRule(
            code="DATA_RETENTION",
            description="Data must not be retained longer than needed",
            level=ComplianceLevel.ERROR,
            category="privacy",
            check_func=lambda item: "ttl" in item or "retention_days" in item,
            remediation="Set TTL (time-to-live) for user data",
        )

    @staticmethod
    def verify_encryption() -> ComplianceRule:
        """Verify data encryption."""
        return ComplianceRule(
            code="ENCRYPTION",
            description="Sensitive data must be encrypted",
            level=ComplianceLevel.CRITICAL,
            category="security",
            check_func=lambda item: item.get("encrypted") == True,
            remediation="Enable encryption at rest and in transit",
        )

    @staticmethod
    def verify_audit_logging() -> ComplianceRule:
        """Verify audit logging enabled."""
        return ComplianceRule(
            code="AUDIT_LOGGING",
            description="All actions must be logged for audit",
            level=ComplianceLevel.ERROR,
            category="audit",
            check_func=lambda action: "timestamp" in action and "user_id" in action,
            remediation="Add audit logging to all operations",
        )

    @staticmethod
    def verify_gdpr_right_to_delete() -> ComplianceRule:
        """Verify GDPR right to be forgotten (deletion)."""
        return ComplianceRule(
            code="GDPR_DELETE",
            description="Support user data deletion (GDPR right)",
            level=ComplianceLevel.CRITICAL,
            category="privacy",
            check_func=lambda config: config.get("supports_deletion") == True,
            remediation="Implement user data deletion endpoint",
        )

    @staticmethod
    def verify_gdpr_data_export() -> ComplianceRule:
        """Verify GDPR data portability (export)."""
        return ComplianceRule(
            code="GDPR_EXPORT",
            description="Support user data export (GDPR portability)",
            level=ComplianceLevel.CRITICAL,
            category="privacy",
            check_func=lambda config: config.get("supports_export") == True,
            remediation="Implement user data export endpoint",
        )

    @staticmethod
    def verify_rate_limiting() -> ComplianceRule:
        """Verify rate limiting prevents abuse."""
        return ComplianceRule(
            code="RATE_LIMITING",
            description="Rate limiting must prevent API abuse",
            level=ComplianceLevel.ERROR,
            category="security",
            check_func=lambda config: config.get("rate_limit_per_user") is not None,
            remediation="Implement rate limiting (10 req/user/day)",
        )

    @staticmethod
    def get_all_rules() -> List[ComplianceRule]:
        """Get all compliance rules."""
        return [
            ComplianceRules.verify_user_identity(),
            ComplianceRules.verify_age_consent(),
            ComplianceRules.verify_data_consent(),
            ComplianceRules.verify_mfa_availability(),
            ComplianceRules.verify_data_minimization(),
            ComplianceRules.verify_data_retention(),
            ComplianceRules.verify_encryption(),
            ComplianceRules.verify_audit_logging(),
            ComplianceRules.verify_gdpr_right_to_delete(),
            ComplianceRules.verify_gdpr_data_export(),
            ComplianceRules.verify_rate_limiting(),
        ]

    @staticmethod
    def get_rules_by_level(level: ComplianceLevel) -> List[ComplianceRule]:
        """Get rules filtered by severity level."""
        return [
            rule
            for rule in ComplianceRules.get_all_rules()
            if rule.level == level
        ]

    @staticmethod
    def get_critical_rules() -> List[ComplianceRule]:
        """Get critical compliance rules."""
        return ComplianceRules.get_rules_by_level(ComplianceLevel.CRITICAL)
