"""Tests for AI agents."""

import pytest
from unittest.mock import patch, MagicMock
from lambda_.agents import (
    ScenarioAgent,
    DetectionAgent,
    CoachingAgent,
)


class TestScenarioAgent:
    """Test ScenarioAgent."""

    @pytest.fixture
    def agent(self):
        """Create agent with mock key."""
        return ScenarioAgent("mock_key")

    def test_generate_scenario_success(self, agent):
        """Test successful scenario generation."""
        with patch("lambda_.agents.scenario_agent.genai.GenerativeModel") as mock_model:
            mock_response = MagicMock()
            mock_response.text = '{"scenario": "Test scenario", "indicators": ["indicator1"], "tactics": ["urgency"]}'
            mock_model.return_value.generate_content.return_value = mock_response

            result = agent.generate("medium", "user123")

            assert result["difficulty"] == "medium"
            assert "scenario" in result
            assert len(result["indicators"]) > 0

    def test_generate_scenario_fallback_on_error(self, agent):
        """Test fallback scenarios on API error."""
        with patch(
            "lambda_.agents.scenario_agent.genai.GenerativeModel"
        ) as mock_model:
            mock_model.return_value.generate_content.side_effect = Exception(
                "API Error"
            )

            result = agent.generate("easy")

            assert result["difficulty"] == "easy"
            assert result["source"] == "fallback"
            assert "scenario" in result


class TestDetectionAgent:
    """Test DetectionAgent."""

    @pytest.fixture
    def agent(self):
        """Create agent with mock key."""
        return DetectionAgent("mock_key")

    def test_analyze_text_success(self, agent):
        """Test successful text analysis."""
        with patch("lambda_.agents.detection_agent.OpenAI") as mock_client:
            mock_response = MagicMock()
            mock_response.choices[0].message.content = (
                '{"risk_level": "high", "confidence": 0.9, '
                '"indicators": ["urgency"], "explanation": "Test", "red_flags": ["flag1"]}'
            )
            mock_client.return_value.chat.completions.create.return_value = (
                mock_response
            )

            result = agent.analyze_text("Test message", "user123")

            assert result["risk_level"] == "high"
            assert result["confidence"] == 0.9
            assert len(result["indicators"]) > 0

    def test_analyze_text_fallback_on_error(self, agent):
        """Test fallback on analysis error."""
        with patch("lambda_.agents.detection_agent.OpenAI") as mock_client:
            mock_client.return_value.chat.completions.create.side_effect = Exception(
                "API Error"
            )

            result = agent.analyze_text("Test message")

            assert result["risk_level"] == "medium"
            assert result["confidence"] == 0.5


class TestCoachingAgent:
    """Test CoachingAgent."""

    @pytest.fixture
    def agent(self):
        """Create agent with mock key."""
        return CoachingAgent("mock_key")

    def test_generate_coaching_success(self, agent):
        """Test successful coaching generation."""
        with patch("lambda_.agents.coaching_agent.OpenAI") as mock_client:
            mock_response = MagicMock()
            mock_response.choices[0].message.content = (
                '{"advice": ["tip1"], "do_not_do": ["avoid1"], '
                '"real_world_example": "Example", "safety_tips": ["tip2"]}'
            )
            mock_client.return_value.chat.completions.create.return_value = (
                mock_response
            )

            result = agent.generate_coaching("high", ["indicator1"], "Test")

            assert "advice" in result
            assert len(result["advice"]) > 0
            assert result["tone"] == "encouraging"

    def test_generate_coaching_fallback(self, agent):
        """Test fallback coaching on error."""
        with patch("lambda_.agents.coaching_agent.OpenAI") as mock_client:
            mock_client.return_value.chat.completions.create.side_effect = Exception(
                "API Error"
            )

            result = agent.generate_coaching("high", [], "Test")

            assert "advice" in result
            assert len(result["advice"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
