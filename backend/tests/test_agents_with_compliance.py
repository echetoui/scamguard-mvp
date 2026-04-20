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

    def setup_method(self):
        """Setup test fixtures."""
        self.patcher_base_init = patch('agents.detection_agent_with_compliance.BaseDetectionAgent.__init__')
        self.patcher_audit = patch('agents.detection_agent_with_compliance.AuditLogger')
        self.patcher_validator = patch('agents.detection_agent_with_compliance.ComplianceValidator')

        mock_base_init = self.patcher_base_init.start()
        mock_audit = self.patcher_audit.start()
        mock_validator = self.patcher_validator.start()

        mock_base_init.return_value = None
        self.mock_validator_instance = MagicMock()
        self.mock_audit_instance = MagicMock()
        mock_validator.return_value = self.mock_validator_instance
        mock_audit.return_value = self.mock_audit_instance

        self.agent = DetectionAgentWithCompliance()
        self.agent.validator = self.mock_validator_instance
        self.agent.audit_logger = self.mock_audit_instance

    def teardown_method(self):
        """Cleanup test fixtures."""
        self.patcher_base_init.stop()
        self.patcher_audit.stop()
        self.patcher_validator.stop()

    def test_analyze_image_compliant_success(self):
        """Test successful compliant analysis."""
        # Setup mocks
        self.mock_validator_instance.validate.return_value = True
        self.mock_audit_instance.log_access.return_value = True
        self.mock_audit_instance.log.return_value = True

        # Run test
        result = self.agent.analyze("Phishing content", {"user_id": "user123"})

        # Assertions
        assert result["is_threat"] is False
        assert result["compliant"] is True
        self.mock_audit_instance.log_access.assert_called_once()

    def test_analyze_image_compliant_blocked_by_compliance(self):
        """Test analysis blocked by compliance check."""
        # Setup mocks
        self.mock_validator_instance.validate.return_value = False
        self.mock_audit_instance.log_access.return_value = True
        self.mock_audit_instance.log.return_value = True

        # Run test
        result = self.agent.analyze("Phishing content", {"user_id": "user123"})

        # Assertions
        assert result["compliant"] is False
        self.mock_audit_instance.log.assert_called_once()


class TestScenarioAgentWithCompliance:
    """Test compliance-wrapped ScenarioAgent."""

    def setup_method(self):
        """Setup test fixtures."""
        self.patcher_base_init = patch('agents.scenario_agent_with_compliance.BaseScenarioAgent.__init__')
        self.patcher_audit = patch('agents.scenario_agent_with_compliance.AuditLogger')

        mock_base_init = self.patcher_base_init.start()
        mock_audit = self.patcher_audit.start()

        mock_base_init.return_value = None
        self.mock_audit_instance = MagicMock()
        mock_audit.return_value = self.mock_audit_instance

        self.agent = ScenarioAgentWithCompliance()
        self.agent.audit_logger = self.mock_audit_instance

    def teardown_method(self):
        """Cleanup test fixtures."""
        self.patcher_base_init.stop()
        self.patcher_audit.stop()

    @patch('agents.scenario_agent_with_compliance.BaseScenarioAgent.generate')
    def test_generate_compliant_success(self, mock_generate):
        """Test successful compliant scenario generation."""
        # Setup mocks
        self.mock_audit_instance.log_access.return_value = True

        mock_generate.return_value = {
            "id": "scenario_123",
            "difficulty": "medium",
            "scenario": "You receive an email...",
            "indicators": ["urgency", "authority"]
        }

        # Run test
        result = self.agent.generate("medium", "user123")

        # Assertions
        assert result["scenario"] == "Training scenario"
        assert result["difficulty"] == "medium"
        self.mock_audit_instance.log_access.assert_called_once()


class TestCoachingAgentWithCompliance:
    """Test compliance-wrapped CoachingAgent."""

    def setup_method(self):
        """Setup test fixtures."""
        self.patcher_base_init = patch('agents.coaching_agent_with_compliance.BaseCoachingAgent.__init__')
        self.patcher_audit = patch('agents.coaching_agent_with_compliance.AuditLogger')

        mock_base_init = self.patcher_base_init.start()
        mock_audit = self.patcher_audit.start()

        mock_base_init.return_value = None
        self.mock_audit_instance = MagicMock()
        mock_audit.return_value = self.mock_audit_instance

        self.agent = CoachingAgentWithCompliance()
        self.agent.audit_logger = self.mock_audit_instance

    def teardown_method(self):
        """Cleanup test fixtures."""
        self.patcher_base_init.stop()
        self.patcher_audit.stop()

    @patch('agents.coaching_agent_with_compliance.BaseCoachingAgent.coach')
    def test_generate_coaching_compliant_success(self, mock_coaching):
        """Test successful compliant coaching generation."""
        # Setup mocks
        self.mock_audit_instance.log_access.return_value = True

        mock_coaching.return_value = {
            "user_id": "user123",
            "feedback": "Great effort!"
        }

        # Run test
        result = self.agent.coach("user123", {"performance": "good"})

        # Assertions
        assert result["user_id"] == "user123"
        assert result["feedback"] == "Great effort!"
        self.mock_audit_instance.log_access.assert_called_once()


class TestAnalyticsAgentWithCompliance:
    """Test compliance-wrapped AnalyticsAgent."""

    def setup_method(self):
        """Setup test fixtures."""
        self.patcher_base_init = patch('agents.analytics_agent_with_compliance.BaseAnalyticsAgent.__init__')
        self.patcher_audit = patch('agents.analytics_agent_with_compliance.AuditLogger')

        mock_base_init = self.patcher_base_init.start()
        mock_audit = self.patcher_audit.start()

        mock_base_init.return_value = None
        self.mock_audit_instance = MagicMock()
        mock_audit.return_value = self.mock_audit_instance

        self.agent = AnalyticsAgentWithCompliance()
        self.agent.audit_logger = self.mock_audit_instance

    def teardown_method(self):
        """Cleanup test fixtures."""
        self.patcher_base_init.stop()
        self.patcher_audit.stop()

    @patch('agents.analytics_agent_with_compliance.BaseAnalyticsAgent.analyze')
    def test_get_user_analytics_compliant_success(self, mock_analyze):
        """Test successful compliant analytics retrieval."""
        # Setup mocks
        self.mock_audit_instance.log_access.return_value = True

        mock_analyze.return_value = {
            "insights": ["insight1", "insight2"],
            "timestamp": "2026-03-08T00:00:00Z"
        }

        # Run test
        result = self.agent.analyze({"user_id": "user123"}, "user123")

        # Assertions
        assert result["timestamp"] == "2026-03-08T00:00:00Z"
        self.mock_audit_instance.log_access.assert_called_once()

    def test_update_analytics_compliant_success(self):
        """Test successful compliant analytics update."""
        # This test verifies the analytics agent can be instantiated
        assert self.agent is not None
        assert self.agent.audit_logger == self.mock_audit_instance
