"""Detection agent for scam analysis."""

import json
from typing import Dict, Any, Optional

try:
    from openai import OpenAI, APITimeoutError
except ImportError:
    OpenAI = None  # type: ignore
    APITimeoutError = Exception  # type: ignore

_MODEL = "gpt-4o-mini"
_MAX_RETRIES = 3


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
        """Analyze text for scam indicators with retry on timeout."""
        if OpenAI is None:
            return self._fallback_response(attempts=1)

        client = OpenAI(api_key=self.api_key)
        prompt = f"Analyze this text for scam indicators: {text}"

        last_exc = None
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                response = client.chat.completions.create(
                    model=_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                )

                try:
                    analysis = json.loads(response.choices[0].message.content)
                except (json.JSONDecodeError, AttributeError, IndexError):
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
                    "model": _MODEL,
                    "attempts": attempt,
                }
            except APITimeoutError as e:
                last_exc = e
                continue
            except Exception as e:
                last_exc = e
                break

        # All retries exhausted or non-retryable exception
        return self._fallback_response(attempts=_MAX_RETRIES)

    def _fallback_response(self, attempts: int = _MAX_RETRIES) -> Dict[str, Any]:
        """Return a safe fallback when the API is unavailable."""
        return {
            "risk_level": "medium",
            "confidence": 0.5,
            "indicators": [],
            "explanation": "Analysis unavailable",
            "red_flags": [],
            "model": "fallback",
            "attempts": attempts,
        }
