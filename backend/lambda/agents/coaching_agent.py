"""CoachingAgent - Provide educational feedback to users."""

import json
import logging
from typing import Optional
from openai import OpenAI
from aws_xray_sdk.core import xray_recorder

logger = logging.getLogger(__name__)


class CoachingAgent:
    """Provide personalized coaching and learning feedback."""

    def __init__(self, openai_key: str):
        """Initialize with OpenAI API key."""
        self.client = OpenAI(api_key=openai_key)

    @xray_recorder.capture("coaching_generation")
    def generate_coaching(
        self,
        risk_level: str,
        indicators: list,
        explanation: str,
        user_id: Optional[str] = None,
    ) -> dict:
        """Generate personalized coaching based on analysis.

        Args:
            risk_level: 'low', 'medium', or 'high'
            indicators: List of detected indicators
            explanation: Explanation from DetectionAgent
            user_id: For tracking

        Returns:
            Coaching dict with advice, do_not_do, example
        """
        try:
            xray_recorder.put_annotation("risk_level", risk_level)

            prompt = f"""You are a friendly coach helping seniors avoid scams.

Based on this analysis:
- Risk Level: {risk_level}
- Red Flags: {', '.join(indicators)}
- Explanation: {explanation}

Provide friendly, actionable coaching.

Respond with JSON:
{{
    "advice": ["advice1", "advice2", "advice3"],
    "do_not_do": ["don't do this", "avoid this"],
    "real_world_example": "How this could happen to you or a friend...",
    "safety_tips": ["tip1", "tip2"]
}}

Keep it simple, friendly, and easy to understand for seniors."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
            )

            text = response.choices[0].message.content
            json_start = text.find("{")
            json_end = text.rfind("}") + 1
            json_str = text[json_start:json_end]
            data = json.loads(json_str)

            return {
                "advice": data.get("advice", []),
                "do_not_do": data.get("do_not_do", []),
                "real_world_example": data.get("real_world_example", ""),
                "safety_tips": data.get("safety_tips", []),
                "tone": "encouraging",
            }

        except Exception as e:
            logger.error(f"Coaching generation failed: {str(e)}", exc_info=True)
            xray_recorder.put_annotation("fallback_used", "true")

            # Return safe fallback coaching
            return {
                "advice": [
                    "If something feels suspicious, ask a trusted family member",
                    "Never click links from unknown senders",
                    "Legitimate companies won't ask for passwords via email",
                ],
                "do_not_do": [
                    "Don't click suspicious links",
                    "Don't share personal information",
                    "Don't send money to unknown people",
                ],
                "real_world_example": "Many seniors receive emails pretending to be from their bank. The scammers use fake urgency to pressure you into clicking a link.",
                "safety_tips": [
                    "When in doubt, contact the company directly using a number from their official website",
                    "Take your time - legitimate requests won't disappear in an hour",
                ],
                "tone": "encouraging",
                "error": str(e),
            }
