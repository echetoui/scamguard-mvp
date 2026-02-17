"""Tests for compliance rules."""

import pytest
from compliance.rules import ComplianceRules, ComplianceLevel, ComplianceRule


class TestComplianceRules:
    """Test compliance rule definitions."""

    def test_verify_user_identity_rule(self):
        """Test user identity verification rule."""
        rule = ComplianceRules.verify_user_identity()

        assert rule.code == "IDENTITY_VERIFIED"
        assert rule.level == ComplianceLevel.CRITICAL
        assert rule.category == "authentication"

        # Test check function
        assert rule.check_func({"email_verified": True}) is True
        assert rule.check_func({"email_verified": False}) is False
        assert rule.check_func({}) is False

    def test_verify_age_consent_rule(self):
        """Test age consent verification rule."""
        rule = ComplianceRules.verify_age_consent()

        assert rule.code == "AGE_CONSENT"
        assert rule.level == ComplianceLevel.CRITICAL
        assert rule.category == "legal"

        # Test check function
        assert rule.check_func({
            "age_verified": True,
            "terms_accepted": True
        }) is True
        assert rule.check_func({
            "age_verified": False,
            "terms_accepted": True
        }) is False
        assert rule.check_func({
            "age_verified": True,
            "terms_accepted": False
        }) is False

    def test_verify_data_consent_rule(self):
        """Test data consent verification rule."""
        rule = ComplianceRules.verify_data_consent()

        assert rule.code == "DATA_CONSENT"
        assert rule.level == ComplianceLevel.ERROR
        assert rule.category == "privacy"

        assert rule.check_func({"data_consent": True}) is True
        assert rule.check_func({"data_consent": False}) is False

    def test_verify_mfa_availability_rule(self):
        """Test MFA availability rule."""
        rule = ComplianceRules.verify_mfa_availability()

        assert rule.code == "MFA_AVAILABLE"
        assert rule.level == ComplianceLevel.WARNING

        assert rule.check_func({"mfa_enabled": True}) is True
        assert rule.check_func({"can_enable_mfa": True}) is True
        assert rule.check_func({"mfa_enabled": False, "can_enable_mfa": False}) is False

    def test_verify_data_minimization_rule(self):
        """Test data minimization rule."""
        rule = ComplianceRules.verify_data_minimization()

        assert rule.code == "DATA_MINIMIZATION"
        assert rule.level == ComplianceLevel.WARNING

        # Check function validates field count
        assert rule.check_func({f"field_{i}": i for i in range(50)}) is True
        assert rule.check_func({f"field_{i}": i for i in range(51)}) is False

    def test_verify_encryption_rule(self):
        """Test encryption rule."""
        rule = ComplianceRules.verify_encryption()

        assert rule.code == "ENCRYPTION"
        assert rule.level == ComplianceLevel.CRITICAL
        assert rule.category == "security"

        assert rule.check_func({"encrypted": True}) is True
        assert rule.check_func({"encrypted": False}) is False

    def test_verify_audit_logging_rule(self):
        """Test audit logging rule."""
        rule = ComplianceRules.verify_audit_logging()

        assert rule.code == "AUDIT_LOGGING"
        assert rule.level == ComplianceLevel.ERROR

        assert rule.check_func({
            "timestamp": "2026-02-16T10:00:00",
            "user_id": "user123"
        }) is True
        assert rule.check_func({"timestamp": "2026-02-16T10:00:00"}) is False

    def test_verify_gdpr_deletion_rule(self):
        """Test GDPR right to delete rule."""
        rule = ComplianceRules.verify_gdpr_right_to_delete()

        assert rule.code == "GDPR_DELETE"
        assert rule.level == ComplianceLevel.CRITICAL

        assert rule.check_func({"supports_deletion": True}) is True
        assert rule.check_func({"supports_deletion": False}) is False

    def test_verify_gdpr_export_rule(self):
        """Test GDPR data export rule."""
        rule = ComplianceRules.verify_gdpr_data_export()

        assert rule.code == "GDPR_EXPORT"
        assert rule.level == ComplianceLevel.CRITICAL

        assert rule.check_func({"supports_export": True}) is True
        assert rule.check_func({"supports_export": False}) is False

    def test_verify_rate_limiting_rule(self):
        """Test rate limiting rule."""
        rule = ComplianceRules.verify_rate_limiting()

        assert rule.code == "RATE_LIMITING"
        assert rule.level == ComplianceLevel.ERROR

        assert rule.check_func({"rate_limit_per_user": 10}) is True
        assert rule.check_func({"rate_limit_per_user": None}) is False

    def test_get_all_rules(self):
        """Test getting all rules."""
        rules = ComplianceRules.get_all_rules()

        assert len(rules) == 11
        assert all(isinstance(r, ComplianceRule) for r in rules)

        # Check we have all expected rules
        codes = {r.code for r in rules}
        expected_codes = {
            "IDENTITY_VERIFIED",
            "AGE_CONSENT",
            "DATA_CONSENT",
            "MFA_AVAILABLE",
            "DATA_MINIMIZATION",
            "DATA_RETENTION",
            "ENCRYPTION",
            "AUDIT_LOGGING",
            "GDPR_DELETE",
            "GDPR_EXPORT",
            "RATE_LIMITING",
        }
        assert codes == expected_codes

    def test_get_critical_rules(self):
        """Test getting critical-level rules."""
        rules = ComplianceRules.get_critical_rules()

        assert len(rules) == 4
        assert all(r.level == ComplianceLevel.CRITICAL for r in rules)

        codes = {r.code for r in rules}
        assert codes == {
            "IDENTITY_VERIFIED",
            "AGE_CONSENT",
            "ENCRYPTION",
            "GDPR_DELETE",
            "GDPR_EXPORT",
        }

    def test_get_rules_by_level(self):
        """Test filtering rules by level."""
        warning_rules = ComplianceRules.get_rules_by_level(ComplianceLevel.WARNING)
        assert all(r.level == ComplianceLevel.WARNING for r in warning_rules)

        error_rules = ComplianceRules.get_rules_by_level(ComplianceLevel.ERROR)
        assert all(r.level == ComplianceLevel.ERROR for r in error_rules)
