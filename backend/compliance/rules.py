"""Compliance rules for ScamGuard."""

from enum import Enum
from typing import Dict, Any, List, Callable, Optional


class ComplianceLevel(str, Enum):
    """Compliance levels."""

    LOW = "low"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ComplianceRule:
    """A single compliance rule with a code, category, level and check function."""

    def __init__(
        self,
        code: str,
        description: str,
        level: ComplianceLevel,
        category: str,
        check_func: Callable[[Dict[str, Any]], bool],
    ):
        """Initialize compliance rule."""
        self.code = code
        self.description = description
        self.level = level
        self.category = category
        self.check_func = check_func
        # Legacy compat
        self.name = code
        self.validator = check_func

    def validate(self, data: Dict[str, Any]) -> bool:
        """Validate data against rule."""
        try:
            return self.check_func(data)
        except Exception:
            return False


class ComplianceRules:
    """Collection of compliance rules with static factory methods."""

    def __init__(self):
        """Initialize compliance rules."""
        self.rules: List[ComplianceRule] = []

    def add_rule(self, rule: ComplianceRule) -> None:
        """Add a compliance rule."""
        self.rules.append(rule)

    def validate(self, data: Dict[str, Any]) -> Dict[str, bool]:
        """Validate data against all rules."""
        return {rule.code: rule.validate(data) for rule in self.rules}

    def validate_all(self, data: Dict[str, Any]) -> bool:
        """Check if data passes all rules."""
        return all(self.validate(data).values()) if self.rules else True

    # -------------------------------------------------------------------------
    # Static factory methods for predefined compliance rules
    # -------------------------------------------------------------------------

    @staticmethod
    def verify_user_identity() -> ComplianceRule:
        """User must have verified email."""
        return ComplianceRule(
            code="IDENTITY_VERIFIED",
            description="User identity must be verified via email confirmation.",
            level=ComplianceLevel.CRITICAL,
            category="authentication",
            check_func=lambda d: bool(d.get("email_verified")),
        )

    @staticmethod
    def verify_age_consent() -> ComplianceRule:
        """User must confirm age and accept terms."""
        return ComplianceRule(
            code="AGE_CONSENT",
            description="User must confirm they are of legal age and accept terms.",
            level=ComplianceLevel.CRITICAL,
            category="legal",
            check_func=lambda d: bool(d.get("age_verified")) and bool(d.get("terms_accepted")),
        )

    @staticmethod
    def verify_data_consent() -> ComplianceRule:
        """User must consent to data processing."""
        return ComplianceRule(
            code="DATA_CONSENT",
            description="User must explicitly consent to data processing.",
            level=ComplianceLevel.ERROR,
            category="privacy",
            check_func=lambda d: bool(d.get("data_consent")),
        )

    @staticmethod
    def verify_mfa_availability() -> ComplianceRule:
        """MFA must be available or enabled."""
        return ComplianceRule(
            code="MFA_AVAILABLE",
            description="Multi-factor authentication must be available to the user.",
            level=ComplianceLevel.WARNING,
            category="security",
            check_func=lambda d: bool(d.get("mfa_enabled")) or bool(d.get("can_enable_mfa")),
        )

    @staticmethod
    def verify_data_minimization() -> ComplianceRule:
        """Data stored must not exceed 50 fields."""
        return ComplianceRule(
            code="DATA_MINIMIZATION",
            description="Data records must not exceed 50 fields (data minimization principle).",
            level=ComplianceLevel.WARNING,
            category="privacy",
            check_func=lambda d: len(d) <= 50,
        )

    @staticmethod
    def verify_data_retention() -> ComplianceRule:
        """Data must have a retention TTL set."""
        return ComplianceRule(
            code="DATA_RETENTION",
            description="Data must have a TTL or retention_days set.",
            level=ComplianceLevel.WARNING,
            category="privacy",
            check_func=lambda d: bool(d.get("ttl")) or bool(d.get("retention_days")),
        )

    @staticmethod
    def verify_encryption() -> ComplianceRule:
        """Data must be encrypted."""
        return ComplianceRule(
            code="ENCRYPTION",
            description="Sensitive data must be encrypted at rest.",
            level=ComplianceLevel.CRITICAL,
            category="security",
            check_func=lambda d: bool(d.get("encrypted")),
        )

    @staticmethod
    def verify_audit_logging() -> ComplianceRule:
        """Events must be audit-logged with timestamp and user_id."""
        return ComplianceRule(
            code="AUDIT_LOGGING",
            description="All events must be audit-logged with timestamp and user_id.",
            level=ComplianceLevel.ERROR,
            category="compliance",
            check_func=lambda d: bool(d.get("timestamp")) and bool(d.get("user_id")),
        )

    @staticmethod
    def verify_gdpr_right_to_delete() -> ComplianceRule:
        """System must support GDPR right to deletion."""
        return ComplianceRule(
            code="GDPR_DELETE",
            description="System must support user's right to data deletion (GDPR Art. 17).",
            level=ComplianceLevel.CRITICAL,
            category="gdpr",
            check_func=lambda d: bool(d.get("supports_deletion")),
        )

    @staticmethod
    def verify_gdpr_data_export() -> ComplianceRule:
        """System must support GDPR right to data portability."""
        return ComplianceRule(
            code="GDPR_EXPORT",
            description="System must support user's right to data export (GDPR Art. 20).",
            level=ComplianceLevel.CRITICAL,
            category="gdpr",
            check_func=lambda d: bool(d.get("supports_export")),
        )

    @staticmethod
    def verify_rate_limiting() -> ComplianceRule:
        """API must have rate limiting configured."""
        return ComplianceRule(
            code="RATE_LIMITING",
            description="API endpoints must have rate limiting configured.",
            level=ComplianceLevel.ERROR,
            category="security",
            check_func=lambda d: d.get("rate_limit_per_user") is not None,
        )

    @staticmethod
    def get_all_rules() -> List[ComplianceRule]:
        """Return all 11 compliance rules."""
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
    def get_critical_rules() -> List[ComplianceRule]:
        """Return only CRITICAL level rules."""
        return [r for r in ComplianceRules.get_all_rules() if r.level == ComplianceLevel.CRITICAL]

    @staticmethod
    def get_rules_by_level(level: ComplianceLevel) -> List[ComplianceRule]:
        """Return rules filtered by level."""
        return [r for r in ComplianceRules.get_all_rules() if r.level == level]
