"""Elder validator for Quebec seniors compliance."""

from typing import Dict, Any, List, Tuple
from datetime import datetime, timedelta
from .elder_rules import ElderProtectionRules, _check_consent_freshness
from .rules import ComplianceLevel


# PII fields that must not appear in training data
_FORBIDDEN_PII = {"user_id", "email", "phone", "name", "address"}


class ElderValidator:
    """Validates compliance for elderly users (65+) per Loi 25 / Quebec regulations."""

    # Rules applicable to a user profile object.
    # IMAGE_AUTO_DELETE applies to image data, not a user profile.
    # ANONYMIZED_TRAINING_DATA applies to training data, not a user profile
    # (and its check rejects any dict containing 'user_id', which user profiles have).
    _USER_RULE_CODES = {
        "ACCESSIBLE_UI",
        "FAMILY_NOTIFICATION",
        "NO_ELDER_PROFILING",
        "SIMPLIFIED_LANGUAGE",
        "PHONE_SUPPORT",
        "EMAIL_ONLY_AUTH",
        "NO_DARK_PATTERNS",
        "EASY_DATA_DELETION",
        "EXPLICIT_ELDER_CONSENT",
        "CONSENT_FRESHNESS",
    }

    def __init__(self):
        """Initialize elder validator."""
        self._all_rules = ElderProtectionRules.get_all_elder_rules()

    def validate_elder_user(
        self, user: Dict[str, Any]
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """Validate a user object against elder protection rules.

        Only rules relevant to a user profile are checked.
        IMAGE_AUTO_DELETE and ANONYMIZED_TRAINING_DATA are excluded because
        they apply to image/training data, not user profile objects.

        Returns (is_compliant, list_of_issues).
        Each issue: {code, description, level, category}.
        """
        issues = []

        user_rules = [r for r in self._all_rules if r.code in self._USER_RULE_CODES]
        for rule in user_rules:
            try:
                passed = rule.check_func(user)
            except Exception:
                passed = False

            if not passed:
                issues.append({
                    "code": rule.code,
                    "description": rule.description,
                    "level": rule.level.value,
                    "category": rule.category,
                })

        critical_issues = [i for i in issues if i["level"] == ComplianceLevel.CRITICAL.value]
        is_compliant = len(critical_issues) == 0
        return is_compliant, issues

    def validate_image_upload(
        self, user_id: str, user_config: Dict[str, Any]
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """Check if an image upload is allowed for an elder user.

        Requires explicit consent with a valid timestamp.
        Returns (is_allowed, list_of_issues).
        """
        issues = []

        # Must have explicit consent
        if not user_config.get("has_explicit_consent"):
            issues.append({
                "code": "EXPLICIT_ELDER_CONSENT",
                "description": "Explicit consent is required to upload images.",
                "level": ComplianceLevel.CRITICAL.value,
                "category": "legal",
            })
            return False, issues

        # Check if consent is still fresh (warn if stale, don't block)
        consent_ts = user_config.get("consent_timestamp")
        if consent_ts:
            is_fresh = _check_consent_freshness({"consent_timestamp": consent_ts}, days=30)
            if not is_fresh:
                issues.append({
                    "code": "CONSENT_REFRESH",
                    "description": "Consent is older than 30 days and should be renewed.",
                    "level": ComplianceLevel.WARNING.value,
                    "category": "legal",
                })
                # Still allowed - this is a warning
                return True, issues

        return True, issues

    def validate_training_data_anonymization(
        self, data: Dict[str, Any]
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """Check that training data contains no PII.

        Returns (is_anonymized, list_of_issues).
        """
        issues = []
        pii_found = _FORBIDDEN_PII & set(data.keys())

        if pii_found:
            for field in sorted(pii_found):
                issues.append({
                    "code": "PII_IN_TRAINING_DATA",
                    "description": f"Field '{field}' is PII and must not appear in training data.",
                    "level": ComplianceLevel.CRITICAL.value,
                    "category": "privacy",
                })
            return False, issues

        return True, []

    def validate_image_deletion(
        self, image_data: Dict[str, Any]
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """Check image deletion configuration.

        TTL must be set and must not exceed 86400 seconds (24 hours).
        """
        issues = []
        ttl = image_data.get("image_ttl")

        if ttl is None:
            issues.append({
                "code": "IMAGE_AUTO_DELETE",
                "description": "image_ttl must be set for elder user images.",
                "level": ComplianceLevel.CRITICAL.value,
                "category": "privacy",
            })
            return False, issues

        if ttl > 86400:
            issues.append({
                "code": "IMAGE_AUTO_DELETE",
                "description": f"image_ttl ({ttl}s) exceeds maximum 86400s (24 hours).",
                "level": ComplianceLevel.CRITICAL.value,
                "category": "privacy",
            })
            return False, issues

        return True, []

    def get_elder_protection_report(self) -> Dict[str, Any]:
        """Generate a summary of all elder protection rules."""
        all_rules = ElderProtectionRules.get_all_elder_rules()
        critical = [r for r in all_rules if r.level == ComplianceLevel.CRITICAL]

        return {
            "total_rules": len(all_rules),
            "critical": len(critical),
            "rules": [
                {
                    "code": r.code,
                    "description": r.description,
                    "level": r.level.value,
                    "category": r.category,
                }
                for r in all_rules
            ],
        }

    # -------------------------------------------------------------------------
    # Legacy interface
    # -------------------------------------------------------------------------

    def validate(self, data: Dict[str, Any]) -> bool:
        """Validate data for elder users (legacy)."""
        return ElderProtectionRules.validate_all(data)

    def validate_text(self, text: str) -> bool:
        """Validate text clarity for seniors (legacy)."""
        return ElderProtectionRules.check_text_clarity(text)

    def validate_consent(self, consent_data: Dict[str, Any]) -> bool:
        """Validate consent freshness (legacy)."""
        return ElderProtectionRules.check_consent_valid(consent_data)
