"""Tests for compliance-wrapped agents."""

import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from agents.detection_agent_with_compliance import DetectionAgentWithCompliance
from agents.scenario_agent_with_compliance import ScenarioAgentWithCompliance
from agents.coaching_agent_with_compliance import CoachingAgentWithCompliance
from agents.analytics_agent_with_compliance import AnalyticsAgentWithCompliance


class TestDetectionAgentWithCompliance:
    """Test compliance-wrapped DetectionAgent."""

    @patch('agents.detection_agent_with_compliance.ComplianceValidator')
    @patch('agents.detection_agent_with_compliance.AuditLogger')
    @patch('agents.detection_agent_with_compliance.BaseDetectionAgent.__init__')
    def setup_method(self, mock_base_init, mock_audit, mock_validator):
        """Setup test fixtures."""
        mock_base_init.return_value = None
        self.mock_validator_instance = MagicMock()
        self.mock_audit_instance = MagicMock()
        mock_validator.return_value = self.mock_validator_instance
        mock_audit.return_value = self.mock_audit_instance

        self.agent = DetectionAgentWithCompliance("test_key")
        self.agent.validator = self.mock_validator_instance
        self.agent.audit_logger = self.mock_audit_instance

    @patch('agents.detection_agent_with_compliance.BaseDetectionAgent.analyze_image')
    def test_analyze_image_compliant_success(self, mock_analyze):
        """Test successful compliant analysis."""
        # Setup mocks
        self.mock_validator_instance.validate_operation.return_value = (True, [])
        self.mock_validator_instance.validate_data_handling.return_value = (True, [])
        self.mock_audit_instance.log_action.return_value = True

        mock_analyze.return_value = {
            "risk_level": "high",
            "confidence": 0.95,
            "indicators": ["urgency", "authority"]
        }

        # Run test
        result = self.agent.analyze_image_compliant(
            "https://example.com/image.jpg",
            "Verify your account",
            "user123"
        )

        # Assertions
        assert result["risk_level"] == "high"
        assert "compliance" in result
        assert result["compliance"]["compliant"] is True
        self.mock_validator_instance.validate_operation.assert_called_once()
        self.mock_audit_instance.log_action.assert_called_once()

    def test_analyze_image_compliant_blocked_by_compliance(self):
        """Test analysis blocked by compliance check."""
        # Setup mocks
        self.mock_validator_instance.validate_operation.return_value = (False, [
            {"code": "AGE_CONSENT", "message": "User age not verified"}
        ])

        # Run test
        result = self.agent.analyze_image_compliant(
            "https://example.com/image.jpg",
            "Verify your account",
            "user123"
        )

        # Assertions
        assert "error" in result
        assert result["error"] == "Compliance check failed"
        assert "compliance_issues" in result


class TestScenarioAgentWithCompliance:
    """Test compliance-wrapped ScenarioAgent."""

    @patch('agents.scenario_agent_with_compliance.ComplianceValidator')
    @patch('agents.scenario_agent_with_compliance.AuditLogger')
    @patch('agents.scenario_agent_with_compliance.BaseScenarioAgent.__init__')
    def setup_method(self, mock_base_init, mock_audit, mock_validator):
        """Setup test fixtures."""
        mock_base_init.return_value = None
        self.mock_validator_instance = MagicMock()
        self.mock_audit_instance = MagicMock()
        mock_validator.return_value = self.mock_validator_instance
        mock_audit.return_value = self.mock_audit_instance

        self.agent = ScenarioAgentWithCompliance("test_key")
        self.agent.validator = self.mock_validator_instance
        self.agent.audit_logger = self.mock_audit_instance

    @patch('agents.scenario_agent_with_compliance.BaseScenarioAgent.generate')
    def test_generate_compliant_success(self, mock_generate):
        """Test successful compliant scenario generation."""
        # Setup mocks
        self.mock_validator_instance.validate_operation.return_value = (True, [])
        self.mock_validator_instance.validate_data_handling.return_value = (True, [])
        self.mock_audit_instance.log_action.return_value = True

        mock_generate.return_value = {
            "id": "scenario_123",
            "difficulty": "medium",
            "scenario": "You receive an email...",
            "indicators": ["urgency", "authority"]
        }

        # Run test
        result = self.agent.generate_compliant("medium", "user123")

        # Assertions
        assert result["id"] == "scenario_123"
        assert "compliance" in result
        assert result["compliance"]["compliant"] is True
        self.mock_validator_instance.validate_operation.assert_called_once()


class TestCoachingAgentWithCompliance:
    """Test compliance-wrapped CoachingAgent."""

    @patch('agents.coaching_agent_with_compliance.ComplianceValidator')
    @patch('agents.coaching_agent_with_compliance.AuditLogger')
    @patch('agents.coaching_agent_with_compliance.BaseCoachingAgent.__init__')
    def setup_method(self, mock_base_init, mock_audit, mock_validator):
        """Setup test fixtures."""
        mock_base_init.return_value = None
        self.mock_validator_instance = MagicMock()
        self.mock_audit_instance = MagicMock()
        mock_validator.return_value = self.mock_validator_instance
        mock_audit.return_value = self.mock_audit_instance

        self.agent = CoachingAgentWithCompliance("test_key")
        self.agent.validator = self.mock_validator_instance
        self.agent.audit_logger = self.mock_audit_instance

    @patch('agents.coaching_agent_with_compliance.BaseCoachingAgent.generate_coaching')
    def test_generate_coaching_compliant_success(self, mock_coaching):
        """Test successful compliant coaching generation."""
        # Setup mocks
        self.mock_validator_instance.validate_operation.return_value = (True, [])
        self.mock_validator_instance.validate_data_handling.return_value = (True, [])
        self.mock_audit_instance.log_action.return_value = True

        mock_coaching.return_value = {
            "advice": ["Be cautious", "Verify the sender"],
            "do_not_do": ["Don't click links", "Don't share passwords"],
            "safety_tips": ["Contact the company directly"]
        }

        # Run test
        result = self.agent.generate_coaching_compliant(
            "high",
            ["urgency", "authority"],
            "This is a phishing attempt",
            "user123"
        )

        # Assertions
        assert len(result["advice"]) == 2
        assert "compliance" in result
        assert result["compliance"]["compliant"] is True


class TestAnalyticsAgentWithCompliance:
    """Test compliance-wrapped AnalyticsAgent."""

    @patch('agents.analytics_agent_with_compliance.ComplianceValidator')
    @patch('agents.analytics_agent_with_compliance.AuditLogger')
    @patch('agents.analytics_agent_with_compliance.BaseAnalyticsAgent.__init__')
    def setup_method(self, mock_base_init, mock_audit, mock_validator):
        """Setup test fixtures."""
        mock_base_init.return_value = None
        self.mock_validator_instance = MagicMock()
        self.mock_audit_instance = MagicMock()
        mock_validator.return_value = self.mock_validator_instance
        mock_audit.return_value = self.mock_audit_instance

        self.agent = AnalyticsAgentWithCompliance(MagicMock())
        self.agent.validator = self.mock_validator_instance
        self.agent.audit_logger = self.mock_audit_instance

    @patch('agents.analytics_agent_with_compliance.BaseAnalyticsAgent.get_user_analytics')
    def test_get_user_analytics_compliant_success(self, mock_get):
        """Test successful compliant analytics retrieval."""
        # Setup mocks
        self.mock_validator_instance.validate_operation.return_value = (True, [])
        self.mock_audit_instance.log_data_access.return_value = True

        mock_get.return_value = {
            "user_id": "user123",
            "total_scenarios": 10,
            "total_analyses": 25,
            "accuracy_score": 0.85
        }

        # Run test
        result = self.agent.get_user_analytics_compliant("user123")

        # Assertions
        assert result["user_id"] == "user123"
        assert "compliance" in result
        assert result["compliance"]["compliant"] is True
        self.mock_audit_instance.log_data_access.assert_called_once()

    @patch('agents.analytics_agent_with_compliance.BaseAnalyticsAgent.update_analytics')
    def test_update_analytics_compliant_success(self, mock_update):
        """Test successful compliant analytics update."""
        # Setup mocks
        self.mock_validator_instance.validate_operation.return_value = (True, [])
        self.mock_audit_instance.log_data_access.return_value = True

        mock_update.return_value = {
            "user_id": "user123",
            "total_analyses": 26,
            "high_risk_detected": 5
        }

        # Run test
        result = self.agent.update_analytics_compliant(
            "user123",
            {"risk_level": "high", "confidence": 0.95}
        )

        # Assertions
        assert result["total_analyses"] == 26
        assert "compliance" in result
        assert result["compliance"]["compliant"] is True
        self.mock_audit_instance.log_data_access.assert_called_once()
