"""Base classes for agents."""

from typing import Dict, Any, Optional


class BaseDetectionAgent:
    """Base class for detection agents."""

    def __init__(self):
        """Initialize base detection agent."""
        pass

    def analyze(self, content: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Analyze content for threats."""
        return {"is_threat": False, "confidence": 0.0}


class BaseScenarioAgent:
    """Base class for scenario agents."""

    def __init__(self):
        """Initialize base scenario agent."""
        pass

    def generate(self, difficulty: str) -> Dict[str, Any]:
        """Generate a scenario."""
        return {"scenario": "Unknown", "difficulty": difficulty}


class BaseCoachingAgent:
    """Base class for coaching agents."""

    def __init__(self):
        """Initialize base coaching agent."""
        pass

    def coach(self, user_id: str, performance: Dict) -> Dict[str, Any]:
        """Provide coaching."""
        return {"user_id": user_id, "feedback": "Good job!"}


class BaseAnalyticsAgent:
    """Base class for analytics agents."""

    def __init__(self):
        """Initialize base analytics agent."""
        pass

    def analyze(self, data: Dict) -> Dict[str, Any]:
        """Analyze data."""
        return {"insights": []}
