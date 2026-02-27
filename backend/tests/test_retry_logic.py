"""Tests for retry logic and error handling."""

import pytest
import time
from unittest.mock import patch, MagicMock, call
from lambda_.utils.retry import (
    retry_with_backoff,
    RetryConfig,
    TimeoutError,
    RateLimitError,
)
from lambda_.utils.errors import (
    VisionAPITimeout,
    RateLimitExceeded,
    GeminiAPIError,
)


class TestRetryWithBackoff:
    """Test retry decorator."""

    def test_successful_on_first_attempt(self):
        """Test function succeeds on first attempt."""

        @retry_with_backoff()
        def successful_function():
            return "success"

        result = successful_function()
        assert result == "success"

    def test_succeeds_on_retry(self):
        """Test function succeeds after initial failures."""
        call_count = 0

        @retry_with_backoff(
            RetryConfig(
                max_attempts=3,
                initial_delay=0.01,
                retryable_exceptions=(ValueError,),
            )
        )
        def failing_then_success():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ValueError("Failed")
            return "success"

        result = failing_then_success()
        assert result == "success"
        assert call_count == 3

    def test_fails_after_max_attempts(self):
        """Test function raises after max attempts."""

        @retry_with_backoff(
            RetryConfig(
                max_attempts=2,
                initial_delay=0.01,
                retryable_exceptions=(ValueError,),
            )
        )
        def always_failing():
            raise ValueError("Always fails")

        with pytest.raises(ValueError):
            always_failing()

    def test_exponential_backoff_timing(self):
        """Test exponential backoff delays."""
        call_times = []

        @retry_with_backoff(
            RetryConfig(
                max_attempts=3,
                initial_delay=0.05,
                exponential_base=2.0,
                jitter=False,
                retryable_exceptions=(ValueError,),
            )
        )
        def failing_function():
            call_times.append(time.time())
            if len(call_times) < 3:
                raise ValueError("Retry me")
            return "success"

        start = time.time()
        failing_function()

        # Check delays are approximately: 0.05s, 0.1s
        if len(call_times) > 1:
            delay1 = call_times[1] - call_times[0]
            assert delay1 >= 0.04  # Allow some variance

        if len(call_times) > 2:
            delay2 = call_times[2] - call_times[1]
            assert delay2 >= 0.09  # Allow some variance


class TestDetectionAgentRetry:
    """Test DetectionAgent retry logic."""

    def test_vision_api_retries_on_timeout(self):
        """Test vision API retries after timeout."""
        from lambda_.agents.detection_agent import DetectionAgent
        from openai import APITimeoutError

        with patch("lambda_.agents.detection_agent.OpenAI") as mock_client:
            # Fail first 2 times, succeed on 3rd
            mock_response = MagicMock()
            mock_response.choices[0].message.content = (
                '{"risk_level": "high", "confidence": 0.9, '
                '"indicators": ["urgency"], "explanation": "Test", "red_flags": ["flag1"]}'
            )

            mock_client.return_value.chat.completions.create.side_effect = [
                APITimeoutError("timeout", None, None),
                APITimeoutError("timeout", None, None),
                mock_response,
            ]

            agent = DetectionAgent("mock_key")
            result = agent.analyze_text("Test message", "user123")

            assert result["risk_level"] == "high"
            assert result["model"] == "gpt-4o-mini"
            assert result["attempts"] == 3

    def test_vision_api_falls_back_after_max_retries(self):
        """Test vision API fallback after max retries."""
        from lambda_.agents.detection_agent import DetectionAgent
        from openai import APITimeoutError

        with patch("lambda_.agents.detection_agent.OpenAI") as mock_client:
            mock_client.return_value.chat.completions.create.side_effect = APITimeoutError(
                "timeout", None, None
            )

            agent = DetectionAgent("mock_key")
            result = agent.analyze_text("Test message", "user123")

            assert result["model"] == "fallback"
            assert result["risk_level"] == "medium"
            assert result["confidence"] == 0.5


class TestScenarioAgentRetry:
    """Test ScenarioAgent retry logic."""

    def test_gemini_retries_on_error(self):
        """Test Gemini retries after error."""
        from lambda_.agents.scenario_agent import ScenarioAgent

        with patch("lambda_.agents.scenario_agent.genai.GenerativeModel") as mock_model:
            # Fail first, succeed on 2nd
            mock_response = MagicMock()
            mock_response.text = (
                '{"scenario": "Test scenario", "indicators": ["indicator1"], "tactics": ["urgency"]}'
            )

            mock_model.return_value.generate_content.side_effect = [
                Exception("API Error"),
                mock_response,
            ]

            agent = ScenarioAgent("mock_key")
            result = agent.generate("medium", "user123")

            assert result["difficulty"] == "medium"
            assert result["source"] != "fallback"
            assert result["attempts"] == 2

    def test_gemini_falls_back_after_max_retries(self):
        """Test Gemini fallback after max retries."""
        from lambda_.agents.scenario_agent import ScenarioAgent

        with patch("lambda_.agents.scenario_agent.genai.GenerativeModel") as mock_model:
            mock_model.return_value.generate_content.side_effect = Exception("API Error")

            agent = ScenarioAgent("mock_key")
            result = agent.generate("easy")

            assert result["source"] == "fallback"
            assert result["difficulty"] == "easy"


class TestErrorClasses:
    """Test custom error classes."""

    def test_vision_api_timeout_error(self):
        """Test VisionAPITimeout error."""
        error = VisionAPITimeout(60)
        assert error.code == "VISION_ANALYSIS_TIMEOUT"
        assert error.status_code == 500

    def test_rate_limit_exceeded_error(self):
        """Test RateLimitExceeded error."""
        error = RateLimitExceeded(120)
        assert error.code == "RATE_LIMIT_EXCEEDED"
        assert error.status_code == 429

    def test_gemini_api_error(self):
        """Test GeminiAPIError error."""
        error = GeminiAPIError("Custom message")
        assert error.code == "SCENARIO_GENERATION_FAILED"
        assert error.status_code == 500


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
