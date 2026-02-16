"""ScenarioAgent - Generate learning scenarios for seniors."""

import json
import logging
from typing import Optional
import google.generativeai as genai
from aws_xray_sdk.core import xray_recorder

logger = logging.getLogger(__name__)


class ScenarioAgent:
    """Generate realistic scam scenarios for user learning."""

    # Fallback scenarios if API fails
    FALLBACK_SCENARIOS = [
        {
            "id": "fallback_001",
            "difficulty": "easy",
            "scenario": "You receive an email claiming to be from your bank asking you to verify your account details by clicking a link. The email has a logo but the sender email looks slightly off.",
            "indicators": ["Generic greeting", "Urgency", "Link to click", "Request for personal info"],
        },
        {
            "id": "fallback_002",
            "difficulty": "medium",
            "scenario": "A friend you haven't heard from in years messages you on Facebook saying they're in an emergency abroad and need money urgently. They ask you to send funds via wire transfer.",
            "indicators": ["Social engineering", "Urgency", "Money request", "Unusual contact"],
        },
        {
            "id": "fallback_003",
            "difficulty": "hard",
            "scenario": "You receive a call from someone claiming to be from a government agency saying there's a warrant for your arrest for unpaid taxes. They demand you go to a store immediately and buy gift cards to pay.",
            "indicators": ["Impersonation", "Authority", "Threat", "Unusual payment method"],
        },
    ]

    def __init__(self, gemini_key: str):
        """Initialize with Gemini API key."""
        self.gemini_key = gemini_key
        genai.configure(api_key=gemini_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    @xray_recorder.capture("scenario_generation")
    def generate(
        self, difficulty: str = "medium", user_id: Optional[str] = None
    ) -> dict:
        """Generate a realistic scam scenario.

        Args:
            difficulty: 'easy', 'medium', or 'hard'
            user_id: For tracking

        Returns:
            Scenario dict with id, difficulty, scenario text, indicators
        """
        try:
            prompt = f"""Generate a realistic scam scenario for educational purposes targeting seniors.

Difficulty: {difficulty}

Requirements:
1. Scenario should be realistic and believable
2. Include common tactics (urgency, authority, fear, etc.)
3. Keep it under 150 words
4. Format as: "You receive..."

Also provide 3-4 red flags/indicators of this scam.

Respond with valid JSON:
{{
    "scenario": "...",
    "indicators": ["flag1", "flag2", "flag3"],
    "tactics": ["urgency", "authority"]
}}"""

            xray_recorder.put_annotation("difficulty", difficulty)
            response = self.model.generate_content(prompt)

            # Parse response
            text = response.text
            # Extract JSON from response
            json_start = text.find("{")
            json_end = text.rfind("}") + 1
            json_str = text[json_start:json_end]
            data = json.loads(json_str)

            return {
                "id": f"scenario_{user_id}_{hash(data['scenario']) % 10000}",
                "difficulty": difficulty,
                "scenario": data["scenario"],
                "indicators": data["indicators"],
                "tactics": data.get("tactics", []),
            }

        except Exception as e:
            logger.error(f"Gemini API failed: {str(e)}", exc_info=True)
            xray_recorder.put_annotation("fallback_used", "true")

            # Return random fallback scenario
            import random
            fallback = random.choice(self.FALLBACK_SCENARIOS)
            return {
                "id": fallback["id"],
                "difficulty": fallback["difficulty"],
                "scenario": fallback["scenario"],
                "indicators": fallback["indicators"],
                "tactics": [],
                "source": "fallback",
            }
