"""Compliance validator - Check FDP patterns."""

import logging
from typing import List, Dict, Any, Tuple
from aws_xray_sdk.core import xray_recorder
from .rules import ComplianceRules, ComplianceLevel

logger = logging.getLogger(__name__)


class ComplianceValidator:
    """Validate operations against FDP compliance rules."""

    def __init__(self):
        """Initialize validator with all rules."""
        self.rules = ComplianceRules.get_all_rules()

    @xray_recorder.capture("validate_user_compliance")
    def validate_user(self, user: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate user meets compliance requirements.

        Args:
            user: User data from Cognito/DynamoDB

        Returns:
            (is_compliant, list_of_issues)
        """
        issues = []

        for rule in self.rules:
            try:
                if not rule.check_func(user):
                    xray_recorder.put_annotation(
                        f"compliance_failed_{rule.code}", "true"
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
                        f"Compliance check failed: {rule.code} for user {user.get('user_id')}"
                    )

            except Exception as e:
                logger.error(f"Error checking rule {rule.code}: {str(e)}")
                issues.append(
                    {
                        "code": rule.code,
                        "message": f"Error checking compliance: {str(e)}",
                        "level": ComplianceLevel.ERROR.value,
                    }
                )

        return len([i for i in issues if i["level"] == "critical"]) == 0, issues

    @xray_recorder.capture("validate_operation_compliance")
    def validate_operation(
        self, operation: str, user_id: str, data: Dict[str, Any]
    ) -> Tuple[bool, List[str]]:
        """Validate specific operation meets compliance.

        Args:
            operation: Operation type (analyze, verify, etc)
            user_id: User performing operation
            data: Operation data

        Returns:
            (is_allowed, list_of_issues)
        """
        issues = []

        # Check critical rules
        critical_rules = ComplianceRules.get_critical_rules()
        for rule in critical_rules:
            try:
                if not rule.check_func({**data, "user_id": user_id}):
                    issues.append(
                        {
                            "code": rule.code,
                            "message": rule.description,
                            "level": rule.level.value,
                        }
                    )

            except Exception as e:
                logger.error(f"Error validating operation: {str(e)}")

        # Operation allowed only if no critical issues
        is_allowed = (
            len([i for i in issues if i["level"] == "critical"]) == 0
        )

        if not is_allowed:
            logger.warning(
                f"Operation {operation} blocked for user {user_id}: {issues}"
            )
            xray_recorder.put_annotation("operation_blocked", "true")

        return is_allowed, issues

    def validate_data_handling(
        self, data: Dict[str, Any]
    ) -> Tuple[bool, List[str]]:
        """Validate data handling meets compliance.

        Args:
            data: Data item being stored/processed

        Returns:
            (is_compliant, list_of_issues)
        """
        issues = []

        # Check encryption
        if "encrypted" in data and not data["encrypted"]:
            issues.append(
                {
                    "code": "ENCRYPTION",
                    "message": "Sensitive data must be encrypted",
                    "level": "critical",
                }
            )

        # Check TTL (data retention)
        if "ttl" not in data and "retention_days" not in data:
            issues.append(
                {
                    "code": "DATA_RETENTION",
                    "message": "Data must have TTL or retention policy",
                    "level": "error",
                }
            )

        # Check audit logging
        if "timestamp" not in data or "user_id" not in data:
            issues.append(
                {
                    "code": "AUDIT_LOGGING",
                    "message": "Data must include timestamp and user_id for audit",
                    "level": "error",
                }
            )

        return len([i for i in issues if i["level"] == "critical"]) == 0, issues

    def get_compliance_report(self) -> Dict[str, Any]:
        """Generate compliance report."""
        rules = ComplianceRules.get_all_rules()

        return {
            "total_rules": len(rules),
            "critical": len(
                [r for r in rules if r.level == ComplianceLevel.CRITICAL]
            ),
            "errors": len(
                [r for r in rules if r.level == ComplianceLevel.ERROR]
            ),
            "warnings": len(
                [r for r in rules if r.level == ComplianceLevel.WARNING]
            ),
            "rules": [
                {
                    "code": rule.code,
                    "description": rule.description,
                    "level": rule.level.value,
                    "category": rule.category,
                }
                for rule in rules
            ],
        }
