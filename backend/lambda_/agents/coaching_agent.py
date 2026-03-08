"""Coaching agent for personalized feedback."""

from typing import Dict, Any, Optional


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
