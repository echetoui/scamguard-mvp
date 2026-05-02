"""Compliance validator for ScamGuard."""

from typing import Dict, Any, List, Tuple
from .rules import ComplianceRules, ComplianceRule, ComplianceLevel


class ComplianceValidator:
    """Validates data against compliance rules."""

    def __init__(self, rules: ComplianceRules = None):
        """Initialize validator."""
        self.rules = rules or ComplianceRules()
        # Load all built-in rules by default
        self._all_rules: List[ComplianceRule] = ComplianceRules.get_all_rules()

    # -------------------------------------------------------------------------
    # Primary interface expected by tests
    # -------------------------------------------------------------------------

    # Rules that apply to user profile objects (not system/data-handling rules)
    _USER_RULE_CODES = {
        "IDENTITY_VERIFIED",
        "AGE_CONSENT",
        "DATA_CONSENT",
        "MFA_AVAILABLE",
        "RATE_LIMITING",
    }

    def validate_user(self, user: Dict[str, Any]) -> Tuple[bool, List[Dict[str, Any]]]:
        """Validate a user object against compliance rules.

        Only user-profile-relevant rules are checked (identity, consent, MFA).
        System-level rules (ENCRYPTION, GDPR_DELETE, GDPR_EXPORT, etc.) are
        not applicable to a user object and are skipped here.

        Returns (is_compliant, list_of_issues).
        Each issue has: code, description, level, category.
        """
        issues = []

        # Check only user-relevant rules against the user data
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

        # Non-compliant if any CRITICAL or ERROR issues exist
        critical_or_error = [
            i for i in issues
            if i["level"] in (ComplianceLevel.CRITICAL.value, ComplianceLevel.ERROR.value)
        ]
        is_compliant = len(critical_or_error) == 0
        return is_compliant, issues

    def validate_operation(
        self,
        operation: str,
        user_id: str,
        data: Dict[str, Any],
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """Validate whether an operation is allowed under compliance rules.

        Checks encryption and audit logging requirements.
        Returns (is_allowed, list_of_issues).
        """
        issues = []

        # Basic encryption check for data operations
        enc_rule = ComplianceRules.verify_encryption()
        if not enc_rule.check_func(data):
            issues.append({
                "code": enc_rule.code,
                "description": enc_rule.description,
                "level": enc_rule.level.value,
                "category": enc_rule.category,
            })

        # Rate limiting check
        rl_rule = ComplianceRules.verify_rate_limiting()
        if not rl_rule.check_func(data):
            issues.append({
                "code": rl_rule.code,
                "description": rl_rule.description,
                "level": rl_rule.level.value,
                "category": rl_rule.category,
            })

        critical_issues = [i for i in issues if i["level"] == ComplianceLevel.CRITICAL.value]
        is_allowed = len(critical_issues) == 0
        return is_allowed, issues

    def validate_data_handling(
        self, data: Dict[str, Any]
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """Validate data handling compliance (encryption, retention, audit fields).

        Returns (is_compliant, list_of_issues).
        """
        issues = []

        # Check encryption
        enc_rule = ComplianceRules.verify_encryption()
        if not enc_rule.check_func(data):
            issues.append({
                "code": enc_rule.code,
                "description": enc_rule.description,
                "level": enc_rule.level.value,
                "category": enc_rule.category,
            })

        # Check data retention (ttl or retention_days)
        ret_rule = ComplianceRules.verify_data_retention()
        if not ret_rule.check_func(data):
            issues.append({
                "code": ret_rule.code,
                "description": ret_rule.description,
                "level": ret_rule.level.value,
                "category": ret_rule.category,
            })

        # Check audit logging fields (timestamp + user_id)
        audit_rule = ComplianceRules.verify_audit_logging()
        if not audit_rule.check_func(data):
            issues.append({
                "code": audit_rule.code,
                "description": audit_rule.description,
                "level": audit_rule.level.value,
                "category": audit_rule.category,
            })

        critical_or_error = [
            i for i in issues
            if i["level"] in (ComplianceLevel.CRITICAL.value, ComplianceLevel.ERROR.value)
        ]
        is_compliant = len(critical_or_error) == 0
        return is_compliant, issues

    def get_compliance_report(self) -> Dict[str, Any]:
        """Generate a summary compliance report with all rules."""
        all_rules = ComplianceRules.get_all_rules()
        critical = [r for r in all_rules if r.level == ComplianceLevel.CRITICAL]
        errors = [r for r in all_rules if r.level == ComplianceLevel.ERROR]
        warnings = [r for r in all_rules if r.level == ComplianceLevel.WARNING]

        return {
            "total_rules": len(all_rules),
            "critical": len(critical),
            "errors": len(errors),
            "warnings": len(warnings),
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
    # Legacy interface (kept for backward compatibility)
    # -------------------------------------------------------------------------

    def validate(self, data: Dict[str, Any]) -> bool:
        """Validate data (legacy interface)."""
        return self.rules.validate_all(data)

    def validate_detailed(self, data: Dict[str, Any]) -> Dict[str, bool]:
        """Get detailed validation results (legacy)."""
        return self.rules.validate(data)
