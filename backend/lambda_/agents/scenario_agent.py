"""Scenario agent for generating training scenarios."""

import json
from typing import Dict, Any, Optional

try:
    import google.generativeai as genai
except ImportError:
    genai = None  # type: ignore


class ScenarioAgent:
    """Agent for generating training scenarios."""

    def __init__(self, api_key: str):
        """Initialize scenario agent with API key."""
        self.api_key = api_key

    def generate(
        self, difficulty: str, user_id: Optional[str] = None, context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate a training scenario."""
        try:
            if genai is None:
                raise ImportError("genai not available")

            model = genai.GenerativeModel("gemini-pro")
            prompt = f"Generate a scam scenario with {difficulty} difficulty."
            response = model.generate_content(prompt)

            try:
                data = json.loads(response.text)
            except json.JSONDecodeError:
                data = {"scenario": response.text}

            return {
                "difficulty": difficulty,
                "scenario": data.get("scenario", "Unknown scenario"),
                "indicators": data.get("indicators", []),
                "tactics": data.get("tactics", []),
                "source": "api",
            }
        except Exception as e:
            # Fallback scenario when API fails
            fallback_scenarios = {
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

            scenario_data = fallback_scenarios.get(
                difficulty.lower(),
                fallback_scenarios["medium"]
            )

            return {
                "difficulty": difficulty,
                "scenario": scenario_data["scenario"],
                "indicators": scenario_data["indicators"],
                "tactics": scenario_data["tactics"],
                "source": "fallback",
            }
