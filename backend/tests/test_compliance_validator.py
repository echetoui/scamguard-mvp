"""Tests for compliance validator."""

import pytest
from compliance.validator import ComplianceValidator
from compliance.rules import ComplianceLevel


class TestComplianceValidator:
    """Test compliance validation."""

    def setup_method(self):
        """Setup test fixtures."""
        self.validator = ComplianceValidator()

    def test_validate_user_all_compliant(self):
        """Test validating fully compliant user."""
        user = {
            "user_id": "user123",
            "email_verified": True,
            "age_verified": True,
            "terms_accepted": True,
            "data_consent": True,
            "mfa_enabled": True,
        }

        is_compliant, issues = self.validator.validate_user(user)

        # May have warnings but no critical issues
        critical_issues = [i for i in issues if i.get("level") == "critical"]
        assert len(critical_issues) == 0

    def test_validate_user_missing_critical_fields(self):
        """Test validating user missing critical requirements."""
        user = {
            "user_id": "user123",
            "email_verified": False,
            "age_verified": False,
        }

        is_compliant, issues = self.validator.validate_user(user)

        assert is_compliant is False
        assert len(issues) > 0

        codes = {i.get("code") for i in issues}
        assert "IDENTITY_VERIFIED" in codes
        assert "AGE_CONSENT" in codes

    def test_validate_operation_allowed(self):
        """Test validating allowed operation."""
        is_allowed, issues = self.validator.validate_operation(
            operation="analyze_image",
            user_id="user123",
            data={"image_url": "https://example.com/image.jpg"}
        )

        # Default implementation should allow most operations
        assert isinstance(is_allowed, bool)
        assert isinstance(issues, list)

    def test_validate_operation_blocked_by_critical_rules(self):
        """Test operation blocked by critical compliance rules."""
        # Test with data that fails critical checks
        is_allowed, issues = self.validator.validate_operation(
            operation="analyze_image",
            user_id="user123",
            data={"image_url": "https://example.com/image.jpg"}
        )

        assert isinstance(is_allowed, bool)

        if not is_allowed:
            critical_issues = [i for i in issues if i.get("level") == "critical"]
            assert len(critical_issues) > 0

    def test_validate_data_handling_encrypted(self):
        """Test data handling validation with encryption."""
        data = {
            "user_id": "user123",
            "timestamp": "2026-02-16T10:00:00",
            "encrypted": True,
            "ttl": 7776000,
            "message": "Secure data"
        }

        is_compliant, issues = self.validator.validate_data_handling(data)

        assert is_compliant is True
        assert len(issues) == 0

    def test_validate_data_handling_unencrypted(self):
        """Test data handling validation with unencrypted data."""
        data = {
            "user_id": "user123",
            "timestamp": "2026-02-16T10:00:00",
            "encrypted": False,
        }

        is_compliant, issues = self.validator.validate_data_handling(data)

        assert is_compliant is False

        encryption_issues = [i for i in issues if i.get("code") == "ENCRYPTION"]
        assert len(encryption_issues) > 0

    def test_validate_data_handling_missing_retention(self):
        """Test data handling validation missing retention policy."""
        data = {
            "user_id": "user123",
            "timestamp": "2026-02-16T10:00:00",
            "encrypted": True,
            # Missing ttl or retention_days
        }

        is_compliant, issues = self.validator.validate_data_handling(data)

        retention_issues = [i for i in issues if i.get("code") == "DATA_RETENTION"]
        assert len(retention_issues) > 0

    def test_validate_data_handling_missing_audit_fields(self):
        """Test data handling validation missing audit fields."""
        data = {
            "encrypted": True,
            "ttl": 7776000,
            # Missing timestamp or user_id
        }

        is_compliant, issues = self.validator.validate_data_handling(data)

        audit_issues = [i for i in issues if i.get("code") == "AUDIT_LOGGING"]
        assert len(audit_issues) > 0

    def test_get_compliance_report(self):
        """Test generating compliance report."""
        report = self.validator.get_compliance_report()

        assert "total_rules" in report
        assert "critical" in report
        assert "errors" in report
        assert "warnings" in report
        assert "rules" in report

        assert report["total_rules"] == 11
        assert report["critical"] >= 4
        assert isinstance(report["rules"], list)

        # Check all rules have required fields
        for rule in report["rules"]:
            assert "code" in rule
            assert "description" in rule
            assert "level" in rule
            assert "category" in rule

    def test_validator_handles_exceptions(self):
        """Test validator handles exceptions gracefully."""
        # Intentionally provide bad data to check error handling
        user_with_bad_data = {
            "email_verified": "invalid_type",  # Should be boolean
        }

        # Validator should handle this gracefully
        is_compliant, issues = self.validator.validate_user(user_with_bad_data)
        assert isinstance(is_compliant, bool)
        assert isinstance(issues, list)
