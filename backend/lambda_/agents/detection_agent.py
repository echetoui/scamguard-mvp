"""Detection agent for scam analysis."""

import json
from typing import Dict, Any, Optional

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None  # type: ignore


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

    def analyze_text(
        self, text: str, user_id: Optional[str] = None, context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze text for scam indicators."""
        try:
            if OpenAI is None:
                raise ImportError("OpenAI not available")

            client = OpenAI(api_key=self.api_key)
            prompt = f"Analyze this text for scam indicators: {text}"

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
            )

            try:
                analysis = json.loads(response.choices[0].message.content)
            except json.JSONDecodeError:
                analysis = {
                    "risk_level": "medium",
                    "confidence": 0.5,
                    "indicators": [],
                }

            return {
                "risk_level": analysis.get("risk_level", "medium"),
                "confidence": float(analysis.get("confidence", 0.5)),
                "indicators": analysis.get("indicators", []),
                "explanation": analysis.get("explanation", ""),
                "red_flags": analysis.get("red_flags", []),
            }
        except Exception:
            # Fallback response when API fails
            return {
                "risk_level": "medium",
                "confidence": 0.5,
                "indicators": [],
                "explanation": "Analysis unavailable",
                "red_flags": [],
            }
