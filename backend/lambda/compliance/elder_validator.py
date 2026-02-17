"""Elder-specific compliance validator for elderly user protection."""

import logging
from typing import List, Dict, Any, Tuple
from aws_xray_sdk.core import xray_recorder
from .rules import ComplianceLevel
from .elder_rules import ElderProtectionRules

logger = logging.getLogger(__name__)


class ElderValidator:
    """Validate operations against elder protection rules."""

    def __init__(self):
        """Initialize validator with elder protection rules."""
        self.rules = ElderProtectionRules.get_all_elder_rules()
        self.critical_rules = ElderProtectionRules.get_critical_elder_rules()

    @xray_recorder.capture("validate_elder_user")
    def validate_elder_user(self, user: Dict[str, Any]) -> Tuple[bool, List[Dict]]:
        """Validate elderly user meets protection requirements.

        Args:
            user: User data including consent and preferences

        Returns:
            (is_compliant, list_of_issues)
        """
        issues = []

        for rule in self.rules:
            try:
                if not rule.check_func(user):
                    xray_recorder.put_annotation(
                        f"elder_compliance_failed_{rule.code}", "true"
                    )
                    issues.append(
                        {
                            "code": rule.code,
                            "message": rule.description,
                            "level": rule.level.value,
                            "remediation": rule.remediation,
                        }
                    )
                    logger.warning(
                        f"Elder protection check failed: {rule.code} for user {user.get('user_id')}"
                    )

            except Exception as e:
                logger.error(f"Error checking rule {rule.code}: {str(e)}")
                issues.append(
                    {
                        "code": rule.code,
                        "message": f"Error checking elder protection: {str(e)}",
                        "level": ComplianceLevel.ERROR.value,
                    }
                )

        critical_failures = [i for i in issues if i["level"] == "critical"]
        return len(critical_failures) == 0, issues

    @xray_recorder.capture("validate_image_upload")
    def validate_image_upload(
        self, user_id: str, user_config: Dict[str, Any]
    ) -> Tuple[bool, List[Dict]]:
        """Validate image upload operation for elderly user.

        Args:
            user_id: User uploading image
            user_config: User configuration and preferences

        Returns:
            (is_allowed, list_of_issues)
        """
        issues = []

        # Check explicit consent
        if not user_config.get("has_explicit_consent"):
            issues.append(
                {
                    "code": "EXPLICIT_ELDER_CONSENT",
                    "message": "User must explicitly consent before uploading image",
                    "level": "critical",
                }
            )
            logger.warning(f"Image upload blocked: no explicit consent for user {user_id}")

        # Check consent freshness (30 days)
        if user_config.get("consent_timestamp"):
            from datetime import datetime, timedelta
            try:
                consent_date = datetime.fromisoformat(
                    user_config["consent_timestamp"].replace("Z", "+00:00")
                )
                age_days = (datetime.utcnow() - consent_date.replace(tzinfo=None)).days
                if age_days > 30:
                    issues.append(
                        {
                            "code": "CONSENT_REFRESH",
                            "message": "Consent needs to be refreshed (older than 30 days)",
                            "level": "warning",
                        }
                    )
            except Exception as e:
                logger.warning(f"Could not check consent freshness: {str(e)}")

        is_allowed = len([i for i in issues if i.get("level") == "critical"]) == 0

        if not is_allowed:
            xray_recorder.put_annotation("elder_image_upload_blocked", "true")

        return is_allowed, issues

    @xray_recorder.capture("validate_training_data_anonymization")
    def validate_training_data_anonymization(
        self, training_data: Dict[str, Any]
    ) -> Tuple[bool, List[Dict]]:
        """Validate training data is properly anonymized.

        Args:
            training_data: Training session data

        Returns:
            (is_anonymized, list_of_issues)
        """
        issues = []

        # Check for user identifiers that should not be in training data
        sensitive_keys = ["user_id", "email", "phone", "name", "ip_address"]

        for key in sensitive_keys:
            if key in training_data:
                issues.append(
                    {
                        "code": "ANONYMIZED_TRAINING_DATA",
                        "message": f"Sensitive field '{key}' found in training data - must be removed",
                        "level": "critical",
                    }
                )
                logger.warning(f"Training data contains sensitive field: {key}")

        is_anonymized = len([i for i in issues if i.get("level") == "critical"]) == 0

        return is_anonymized, issues

    @xray_recorder.capture("validate_image_deletion")
    def validate_image_deletion(
        self, image_data: Dict[str, Any]
    ) -> Tuple[bool, List[Dict]]:
        """Validate image will be properly deleted.

        Args:
            image_data: Image metadata

        Returns:
            (is_valid, list_of_issues)
        """
        issues = []

        # Check TTL is set and <= 24 hours
        if "image_ttl" not in image_data:
            issues.append(
                {
                    "code": "IMAGE_AUTO_DELETE",
                    "message": "Image TTL must be set (max 24 hours / 86400 seconds)",
                    "level": "critical",
                }
            )

        elif image_data["image_ttl"] > 86400:
            issues.append(
                {
                    "code": "IMAGE_AUTO_DELETE",
                    "message": f"Image TTL too long ({image_data['image_ttl']}s > 86400s)",
                    "level": "critical",
                }
            )
            logger.warning(
                f"Image TTL exceeds 24h limit: {image_data['image_ttl']} seconds"
            )

        is_valid = len([i for i in issues if i.get("level") == "critical"]) == 0

        return is_valid, issues

    def get_elder_protection_report(self) -> Dict[str, Any]:
        """Generate elder protection compliance report."""
        return {
            "total_rules": len(self.rules),
            "critical": len(
                [r for r in self.rules if r.level == ComplianceLevel.CRITICAL]
            ),
            "errors": len(
                [r for r in self.rules if r.level == ComplianceLevel.ERROR]
            ),
            "warnings": len(
                [r for r in self.rules if r.level == ComplianceLevel.WARNING]
            ),
            "rules": [
                {
                    "code": rule.code,
                    "description": rule.description,
                    "level": rule.level.value,
                    "category": rule.category,
                    "remediation": rule.remediation,
                }
                for rule in self.rules
            ],
        }
