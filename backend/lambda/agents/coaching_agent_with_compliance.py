"""CoachingAgent with FDP compliance patterns integrated."""

import json
import logging
from typing import Optional
from openai import OpenAI
from aws_xray_sdk.core import xray_recorder
from agents.coaching_agent import CoachingAgent as BaseCoachingAgent
from compliance.validator import ComplianceValidator
from compliance.audit_logger import AuditLogger

logger = logging.getLogger(__name__)


class CoachingAgentWithCompliance(BaseCoachingAgent):
    """CoachingAgent enhanced with FDP compliance patterns."""

    def __init__(self, openai_key: str):
        """Initialize with base agent and compliance.

        Args:
            openai_key: OpenAI API key
        """
        super().__init__(openai_key)
        self.validator = ComplianceValidator()
        self.audit_logger = AuditLogger()

    @xray_recorder.capture("generate_coaching_with_compliance")
    def generate_coaching_compliant(
        self,
        risk_level: str,
        indicators: list,
        explanation: str,
        user_id: Optional[str] = None,
    ) -> dict:
        """Generate coaching with compliance checks.

        Args:
            risk_level: 'low', 'medium', or 'high'
            indicators: List of detected indicators
            explanation: Explanation from DetectionAgent
            user_id: User ID for audit logging

        Returns:
            Coaching dict with compliance status
        """
        try:
            # 1. Check user compliance before operation
            if user_id:
                is_compliant, issues = self.validator.validate_operation(
                    operation="generate_coaching",
                    user_id=user_id,
                    data={
                        "risk_level": risk_level,
                        "indicators_count": len(indicators),
                    },
                )

                if not is_compliant:
                    self.audit_logger.log_action(
                        user_id=user_id,
                        action="generate_coaching",
                        resource="coaching",
                        status="blocked",
                        error="Compliance check failed",
                        details={"issues": issues},
                    )

                    return {
                        "error": "Compliance check failed",
                        "compliance_issues": issues,
                        "model": "compliant_check",
                    }

            # 2. Run coaching generation (from base class)
            result = self.generate_coaching(
                risk_level, indicators, explanation, user_id
            )

            # 3. Validate result data compliance
            is_data_compliant, data_issues = self.validator.validate_data_handling(
                result
            )

            # 4. Audit log the action
            if user_id:
                self.audit_logger.log_action(
                    user_id=user_id,
                    action="generate_coaching",
                    resource="coaching",
                    status="success",
                    details={
                        "risk_level": risk_level,
                        "advice_count": len(result.get("advice", [])),
                        "data_compliant": is_data_compliant,
                    },
                )

            # 5. Add compliance metadata
            result["compliance"] = {
                "compliant": is_data_compliant,
                "issues": data_issues,
            }

            xray_recorder.put_annotation("coaching_compliant", str(is_data_compliant))

            return result

        except Exception as e:
            logger.error(f"Compliant coaching generation failed: {str(e)}", exc_info=True)

            if user_id:
                self.audit_logger.log_action(
                    user_id=user_id,
                    action="generate_coaching",
                    resource="coaching",
                    status="failed",
                    error=str(e),
                )

            raise
