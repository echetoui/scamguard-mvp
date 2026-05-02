"""Scenario agent for generating training scenarios."""

import json
from typing import Dict, Any, Optional

try:
    import google.generativeai as genai
except ImportError:
    genai = None  # type: ignore

_MAX_RETRIES = 3

_FALLBACK_SCENARIOS = {
    "easy": {
        "scenario": "Email asking to verify account",
        "indicators": ["urgent language", "suspicious email"],
        "tactics": ["urgency"],
    },
    "medium": {
        "scenario": "Phone call pretending to be bank",
        "indicators": ["caller ID spoofing", "account details requested"],
        "tactics": ["authority", "urgency"],
    },
    "hard": {
        "scenario": "Sophisticated phishing with social engineering",
        "indicators": ["personalized info", "fake website"],
        "tactics": ["trust building", "urgency"],
    },
}


class ScenarioAgent:
    """Agent for generating training scenarios."""

    def __init__(self, api_key: str):
        """Initialize scenario agent with API key."""
        self.api_key = api_key

    def generate(
        self, difficulty: str, user_id: Optional[str] = None, context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate a training scenario with retry on transient errors."""
        if genai is None:
            return self._fallback(difficulty, attempts=1)

        last_exc = None
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                model = genai.GenerativeModel("gemini-pro")
                prompt = f"Generate a scam scenario with {difficulty} difficulty."
                response = model.generate_content(prompt)

                try:
                    data = json.loads(response.text)
                except (json.JSONDecodeError, AttributeError):
                    data = {"scenario": getattr(response, "text", "")}

                return {
                    "difficulty": difficulty,
                    "scenario": data.get("scenario", "Unknown scenario"),
                    "indicators": data.get("indicators", []),
                    "tactics": data.get("tactics", []),
                    "source": "api",
                    "attempts": attempt,
                }
            except Exception as e:
                last_exc = e
                continue

        # All retries exhausted
        return self._fallback(difficulty, attempts=_MAX_RETRIES)

    def _fallback(self, difficulty: str, attempts: int = _MAX_RETRIES) -> Dict[str, Any]:
        """Return a fallback scenario when the API is unavailable."""
        scenario_data = _FALLBACK_SCENARIOS.get(
            difficulty.lower(),
            _FALLBACK_SCENARIOS["medium"],
        )
        return {
            "difficulty": difficulty,
            "scenario": scenario_data["scenario"],
            "indicators": scenario_data["indicators"],
            "tactics": scenario_data["tactics"],
            "source": "fallback",
            "attempts": attempts,
        }
