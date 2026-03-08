"""Coaching agent with compliance validation."""

from typing import Dict, Any, Optional
from .base_agents import BaseCoachingAgent
from compliance.audit_logger import AuditLogger


class CoachingAgentWithCompliance(BaseCoachingAgent):
    """Coaching agent with compliance logging."""

    def __init__(self):
        """Initialize coaching agent with compliance."""
        super().__init__()
        self.audit_logger = AuditLogger()

    def coach(
        self, user_id: str, performance: Dict, context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Provide coaching with compliance tracking."""
        # Log coaching
        self.audit_logger.log_access(user_id, "coaching")

        result = {"user_id": user_id, "feedback": "Great effort!"}

        return result
