"""Coaching agent for personalized feedback."""

import json
from typing import Dict, Any, Optional, List

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None  # type: ignore


class CoachingAgent:
    """Agent for providing personalized coaching and feedback."""

    def __init__(self, api_key: str):
        """Initialize coaching agent with API key."""
        self.api_key = api_key

    def generate_feedback(
        self, user_id: str, performance: Dict[str, Any], context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate personalized feedback."""
        return {
            "user_id": user_id,
            "feedback": "Well done!",
            "tips": [],
            "next_steps": [],
        }

    def generate_coaching(
        self,
        risk_level: str,
        indicators: List[str],
        context: str,
    ) -> Dict[str, Any]:
        """Generate coaching based on risk level and indicators."""
        try:
            if OpenAI is None:
                raise ImportError("OpenAI not available")

            client = OpenAI(api_key=self.api_key)
            prompt = f"Generate safety coaching for a {risk_level} risk scenario with indicators: {indicators}"

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
            )

            try:
                coaching = json.loads(response.choices[0].message.content)
            except json.JSONDecodeError:
                coaching = {
                    "advice": ["Stay vigilant"],
                    "do_not_do": [],
                }

            return {
                "advice": coaching.get("advice", []),
                "do_not_do": coaching.get("do_not_do", []),
                "real_world_example": coaching.get("real_world_example", ""),
                "safety_tips": coaching.get("safety_tips", []),
                "tone": "encouraging",
            }
        except Exception:
            # Fallback coaching
            return {
                "advice": [
                    "Be cautious of unsolicited communications",
                    "Verify requests through official channels",
                    "Never share personal information",
                ],
                "do_not_do": [
                    "Click links in unexpected messages",
                    "Share passwords",
                ],
                "real_world_example": "Common phishing attempts",
                "safety_tips": ["Check sender email addresses", "Look for grammar errors"],
                "tone": "encouraging",
            }
