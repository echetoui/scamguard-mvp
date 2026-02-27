"""Tests for elder protection compliance rules and validators."""

import pytest
from datetime import datetime, timedelta
from compliance.elder_rules import ElderProtectionRules, _check_reading_level, _check_consent_freshness
from compliance.elder_validator import ElderValidator
from compliance.rules import ComplianceLevel
from utils.anonymization import AnonymizationUtil


class TestElderProtectionRules:
    """Test elder protection rules."""

    def test_verify_accessible_ui_rule(self):
        """Test accessible UI requirement for elderly users."""
        rule = ElderProtectionRules.verify_accessible_ui()

        assert rule.code == "ACCESSIBLE_UI"
        assert rule.level == ComplianceLevel.CRITICAL

        assert rule.check_func({"large_font_enabled": True}) is True
        assert rule.check_func({"large_font_enabled": False}) is False

    def test_verify_image_auto_deletion_rule(self):
        """Test image auto-deletion requirement."""
        rule = ElderProtectionRules.verify_image_auto_deletion()

        assert rule.code == "IMAGE_AUTO_DELETE"
        assert rule.level == ComplianceLevel.CRITICAL

        # 24 hours = 86400 seconds
        assert rule.check_func({"image_ttl": 86400}) is True
        assert rule.check_func({"image_ttl": 43200}) is True  # 12 hours OK
        assert rule.check_func({"image_ttl": 172800}) is False  # 48 hours not OK

    def test_verify_family_notification_option_rule(self):
        """Test family notification option."""
        rule = ElderProtectionRules.verify_family_notification_option()

        assert rule.code == "FAMILY_NOTIFICATION"
        assert rule.level == ComplianceLevel.ERROR

        assert rule.check_func({"family_notification_enabled": True}) is True
        assert rule.check_func({"family_notification_enabled": False}) is False

    def test_verify_no_user_profiling_rule(self):
        """Test no marketing profiling requirement."""
        rule = ElderProtectionRules.verify_no_user_profiling()

        assert rule.code == "NO_ELDER_PROFILING"
        assert rule.level == ComplianceLevel.CRITICAL

        assert rule.check_func({"marketing_profiling_disabled": True}) is True
        assert rule.check_func({"marketing_profiling_disabled": False}) is False

    def test_verify_simplified_language_rule(self):
        """Test simplified language requirement."""
        rule = ElderProtectionRules.verify_simplified_language()

        assert rule.code == "SIMPLIFIED_LANGUAGE"
        assert rule.level == ComplianceLevel.ERROR

        # Simple text
        assert rule.check_func({"text": "Click here to start."}) is True

        # Complex text
        complex_text = "This phenomenological manifestation necessitates sophisticated analytical frameworks."
        assert rule.check_func({"text": complex_text}) is False

    def test_verify_phone_support_available_rule(self):
        """Test phone support requirement."""
        rule = ElderProtectionRules.verify_phone_support_available()

        assert rule.code == "PHONE_SUPPORT"

        assert rule.check_func({
            "phone_support_enabled": True,
            "phone_support_hours": "9am-5pm EST"
        }) is True

        assert rule.check_func({
            "phone_support_enabled": False,
            "phone_support_hours": None
        }) is False

    def test_verify_email_only_authentication_rule(self):
        """Test email-only authentication requirement."""
        rule = ElderProtectionRules.verify_email_only_authentication()

        assert rule.code == "EMAIL_ONLY_AUTH"

        assert rule.check_func({
            "auth_method": "email_only",
            "mfa_optional": True
        }) is True

        assert rule.check_func({
            "auth_method": "totp",
            "mfa_optional": False
        }) is False

    def test_verify_no_dark_patterns_rule(self):
        """Test no dark patterns requirement."""
        rule = ElderProtectionRules.verify_no_dark_patterns()

        assert rule.code == "NO_DARK_PATTERNS"
        assert rule.level == ComplianceLevel.CRITICAL

        assert rule.check_func({"dark_patterns_audit_passed": True}) is True
        assert rule.check_func({"dark_patterns_audit_passed": False}) is False

    def test_verify_easy_data_deletion_rule(self):
        """Test easy data deletion requirement."""
        rule = ElderProtectionRules.verify_easy_data_deletion()

        assert rule.code == "EASY_DATA_DELETION"

        assert rule.check_func({"deletion_clicks_required": 1}) is True
        assert rule.check_func({"deletion_clicks_required": 3}) is True
        assert rule.check_func({"deletion_clicks_required": 5}) is False

    def test_verify_training_data_anonymization_rule(self):
        """Test training data anonymization."""
        rule = ElderProtectionRules.verify_training_data_anonymization()

        assert rule.code == "ANONYMIZED_TRAINING_DATA"
        assert rule.level == ComplianceLevel.CRITICAL

        assert rule.check_func({"risk_level": "high", "timestamp": "2026-02-16"}) is True
        assert rule.check_func({"user_id": "user123", "risk_level": "high"}) is False
        assert rule.check_func({"email": "user@example.com"}) is False

    def test_verify_explicit_elder_consent_rule(self):
        """Test explicit consent requirement."""
        rule = ElderProtectionRules.verify_explicit_elder_consent()

        assert rule.code == "EXPLICIT_ELDER_CONSENT"
        assert rule.level == ComplianceLevel.CRITICAL

        assert rule.check_func({
            "has_explicit_consent": True,
            "consent_timestamp": "2026-02-16T10:00:00"
        }) is True

        assert rule.check_func({"has_explicit_consent": False}) is False

    def test_get_all_elder_rules(self):
        """Test getting all elder protection rules."""
        rules = ElderProtectionRules.get_all_elder_rules()

        assert len(rules) == 12
        assert all(r.level in [ComplianceLevel.CRITICAL, ComplianceLevel.ERROR, ComplianceLevel.WARNING] for r in rules)

    def test_get_critical_elder_rules(self):
        """Test getting critical elder rules."""
        rules = ElderProtectionRules.get_critical_elder_rules()

        assert len(rules) == 6
        assert all(r.level == ComplianceLevel.CRITICAL for r in rules)

        codes = {r.code for r in rules}
        expected = {
            "ACCESSIBLE_UI",
            "IMAGE_AUTO_DELETE",
            "NO_ELDER_PROFILING",
            "NO_DARK_PATTERNS",
            "ANONYMIZED_TRAINING_DATA",
            "EXPLICIT_ELDER_CONSENT",
        }
        assert codes == expected

    def test_check_reading_level(self):
        """Test reading level checker."""
        # Simple: short words, short sentences
        simple = "Click here. Then wait. It is easy."
        assert _check_reading_level(simple) is True

        # Complex: long words, long sentences
        complex_text = "Notwithstanding the aforementioned considerations, the implementation of sophisticated mechanisms necessitates comprehensive understanding."
        assert _check_reading_level(complex_text) is False

    def test_check_consent_freshness(self):
        """Test consent freshness checker."""
        now = datetime.utcnow()
        recent = (now - timedelta(days=15)).isoformat()
        old = (now - timedelta(days=35)).isoformat()

        assert _check_consent_freshness({"consent_timestamp": recent}, days=30) is True
        assert _check_consent_freshness({"consent_timestamp": old}, days=30) is False


class TestElderValidator:
    """Test elder-specific compliance validator."""

    def setup_method(self):
        """Setup test fixtures."""
        self.validator = ElderValidator()

    def test_validate_elder_user_compliant(self):
        """Test validating fully compliant elderly user."""
        user = {
            "user_id": "elder123",
            "large_font_enabled": True,
            "family_notification_enabled": True,
            "marketing_profiling_disabled": True,
            "phone_support_enabled": True,
            "auth_method": "email_only",
            "mfa_optional": True,
            "dark_patterns_audit_passed": True,
            "deletion_clicks_required": 2,
            "has_explicit_consent": True,
            "consent_timestamp": datetime.utcnow().isoformat(),
        }

        is_compliant, issues = self.validator.validate_elder_user(user)

        # May have minor warnings but no critical issues
        critical_issues = [i for i in issues if i.get("level") == "critical"]
        assert len(critical_issues) == 0

    def test_validate_elder_user_missing_critical_requirements(self):
        """Test validating elderly user missing critical requirements."""
        user = {
            "user_id": "elder123",
            "large_font_enabled": False,
            "has_explicit_consent": False,
        }

        is_compliant, issues = self.validator.validate_elder_user(user)

        assert is_compliant is False
        critical_issues = [i for i in issues if i.get("level") == "critical"]
        assert len(critical_issues) > 0

    def test_validate_image_upload_with_consent(self):
        """Test image upload validation with proper consent."""
        is_allowed, issues = self.validator.validate_image_upload(
            user_id="elder123",
            user_config={
                "has_explicit_consent": True,
                "consent_timestamp": datetime.utcnow().isoformat()
            }
        )

        assert is_allowed is True
        assert len(issues) == 0

    def test_validate_image_upload_without_consent(self):
        """Test image upload blocked without consent."""
        is_allowed, issues = self.validator.validate_image_upload(
            user_id="elder123",
            user_config={"has_explicit_consent": False}
        )

        assert is_allowed is False
        assert any(i["code"] == "EXPLICIT_ELDER_CONSENT" for i in issues)

    def test_validate_image_upload_expired_consent(self):
        """Test image upload with expired consent."""
        old_consent = (datetime.utcnow() - timedelta(days=40)).isoformat()

        is_allowed, issues = self.validator.validate_image_upload(
            user_id="elder123",
            user_config={
                "has_explicit_consent": True,
                "consent_timestamp": old_consent
            }
        )

        # Still allowed but with warning
        assert any(i["code"] == "CONSENT_REFRESH" for i in issues)

    def test_validate_training_data_anonymization_good(self):
        """Test properly anonymized training data."""
        data = {
            "risk_level": "high",
            "confidence_improvement_percent": 15,
            "timestamp": datetime.utcnow().isoformat(),
            "scenario_category": "phishing"
        }

        is_anon, issues = self.validator.validate_training_data_anonymization(data)

        assert is_anon is True
        assert len(issues) == 0

    def test_validate_training_data_anonymization_bad(self):
        """Test training data with user identifiers."""
        data = {
            "user_id": "elder123",
            "email": "elder@example.com",
            "risk_level": "high"
        }

        is_anon, issues = self.validator.validate_training_data_anonymization(data)

        assert is_anon is False
        assert len(issues) > 0

    def test_validate_image_deletion_valid(self):
        """Test valid image deletion configuration."""
        image_data = {"image_ttl": 86400}  # 24 hours

        is_valid, issues = self.validator.validate_image_deletion(image_data)

        assert is_valid is True
        assert len(issues) == 0

    def test_validate_image_deletion_missing_ttl(self):
        """Test image deletion without TTL."""
        image_data = {}

        is_valid, issues = self.validator.validate_image_deletion(image_data)

        assert is_valid is False
        assert any(i["code"] == "IMAGE_AUTO_DELETE" for i in issues)

    def test_validate_image_deletion_ttl_too_long(self):
        """Test image deletion with TTL longer than 24h."""
        image_data = {"image_ttl": 172800}  # 48 hours

        is_valid, issues = self.validator.validate_image_deletion(image_data)

        assert is_valid is False

    def test_get_elder_protection_report(self):
        """Test generating elder protection report."""
        report = self.validator.get_elder_protection_report()

        assert report["total_rules"] == 12
        assert report["critical"] == 6
        assert "rules" in report
        assert len(report["rules"]) == 12


class TestAnonymization:
    """Test data anonymization utilities."""

    def test_anonymize_training_session(self):
        """Test anonymizing training session."""
        session = {
            "user_id": "elder123",
            "email": "elder@example.com",
            "difficulty": "medium",
            "risk_level": "high",
            "confidence_before": 3,
            "confidence_after": 8,
            "time_to_identify_seconds": 45,
            "learning_effective": True,
            "timestamp": datetime.utcnow().isoformat(),
        }

        anon = AnonymizationUtil.anonymize_training_session(session)

        # Should not contain user identifiers
        assert "user_id" not in anon
        assert "email" not in anon

        # Should contain learning metrics
        assert anon["risk_level"] == "high"
        assert anon["confidence_improvement_percent"] is None or isinstance(anon.get("confidence_improvement_percent"), (int, float))
        assert "session_hash" in anon

    def test_anonymize_user_id(self):
        """Test user ID anonymization."""
        user_id = "elder_user_123"

        anon1 = AnonymizationUtil.anonymize_user_id(user_id)
        anon2 = AnonymizationUtil.anonymize_user_id(user_id)

        # Should be consistent hashing
        assert anon1 == anon2
        assert anon1.startswith("USER_")
        assert len(anon1) > 5

    def test_anonymize_image_metadata(self):
        """Test image metadata anonymization."""
        image_data = {
            "image_url": "https://s3.../user123/image.jpg",
            "user_id": "elder123",
            "file_size_kb": 512,
            "format": "jpg",
            "analysis_result": {"risk_level": "high"},
            "confidence": 0.95,
            "timestamp": datetime.utcnow().isoformat(),
        }

        anon = AnonymizationUtil.anonymize_image_metadata(image_data)

        # Should not expose URL or user ID
        assert "image_url" not in anon
        assert "user_id" not in anon

        # Should contain image_hash instead
        assert "image_hash" in anon
        assert "image_hash" is not None

        # Should preserve analysis results
        assert anon["analysis_result"]["risk_level"] == "high"

    def test_create_aggregated_analytics(self):
        """Test creating aggregated analytics from sessions."""
        sessions = [
            {
                "difficulty": "easy",
                "confidence_before": 3,
                "confidence_after": 7,
                "confidence_improvement_percent": 40,
                "learning_effective": True,
                "red_flags_identified": ["urgency", "authority"],
            },
            {
                "difficulty": "medium",
                "confidence_before": 4,
                "confidence_after": 8,
                "confidence_improvement_percent": 50,
                "learning_effective": True,
                "red_flags_identified": ["urgency"],
            },
            {
                "difficulty": "medium",
                "confidence_before": 5,
                "confidence_after": 6,
                "confidence_improvement_percent": 10,
                "learning_effective": False,
                "red_flags_identified": ["authority"],
            },
        ]

        analytics = AnonymizationUtil.create_aggregated_analytics(sessions, cohort="age_70-80")

        assert analytics["cohort"] == "age_70-80"
        assert analytics["session_count"] == 3
        assert analytics["learning_effective_percent"] > 0
        assert "difficulty_breakdown" in analytics
        assert "common_red_flags" in analytics
