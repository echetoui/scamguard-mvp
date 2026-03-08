"""Detection agent for scam analysis."""

from typing import Dict, Any, Optional


class DetectionAgent:
    """Agent for detecting and analyzing scams."""

    def __init__(self, api_key: str):
        """Initialize detection agent with API key."""
        self.api_key = api_key

    def analyze(self, content: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Analyze content for scam indicators."""
        return {
            "is_scam": False,
            "risk_score": 0.0,
            "indicators": [],
            "confidence": 0.0,
        }
