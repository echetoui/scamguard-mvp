"""ScenarioAgent with FDP compliance patterns integrated."""

import json
import time
import logging
from typing import Optional
import google.generativeai as genai
from aws_xray_sdk.core import xray_recorder
from agents.scenario_agent import ScenarioAgent as BaseScenarioAgent
from compliance.validator import ComplianceValidator
from compliance.audit_logger import AuditLogger
from utils.errors import GeminiAPIError

logger = logging.getLogger(__name__)


class ScenarioAgentWithCompliance(BaseScenarioAgent):
    """ScenarioAgent enhanced with FDP compliance patterns."""

    def __init__(self, gemini_key: str):
        """Initialize with base agent and compliance.

        Args:
            gemini_key: Gemini API key
        """
        super().__init__(gemini_key)
        self.validator = ComplianceValidator()
        self.audit_logger = AuditLogger()

    @xray_recorder.capture("generate_scenario_with_compliance")
    def generate_compliant(
        self,
        difficulty: str = "medium",
        user_id: Optional[str] = None,
    ) -> dict:
        """Generate scenario with compliance checks.

        Args:
            difficulty: 'easy', 'medium', or 'hard'
            user_id: User ID for audit logging

        Returns:
            Scenario dict with compliance status
        """
        try:
            # 1. Check user compliance before operation
            if user_id:
                is_compliant, issues = self.validator.validate_operation(
                    operation="generate_scenario",
                    user_id=user_id,
                    data={"difficulty": difficulty},
                )

                if not is_compliant:
                    self.audit_logger.log_action(
                        user_id=user_id,
                        action="generate_scenario",
                        resource="scenario",
                        status="blocked",
                        error="Compliance check failed",
                        details={"issues": issues},
                    )

                    return {
                        "error": "Compliance check failed",
                        "compliance_issues": issues,
                        "model": "compliant_check",
                    }

            # 2. Run scenario generation (from base class)
            result = self.generate(difficulty, user_id)

            # 3. Validate result data compliance
            is_data_compliant, data_issues = self.validator.validate_data_handling(
                result
            )

            # 4. Audit log the action
            if user_id:
                self.audit_logger.log_action(
                    user_id=user_id,
                    action="generate_scenario",
                    resource="scenario",
                    status="success",
                    details={
                        "difficulty": difficulty,
                        "scenario_id": result.get("id"),
                        "data_compliant": is_data_compliant,
                    },
                )

            # 5. Add compliance metadata
            result["compliance"] = {
                "compliant": is_data_compliant,
                "issues": data_issues,
            }

            xray_recorder.put_annotation("scenario_compliant", str(is_data_compliant))

            return result

        except Exception as e:
            logger.error(f"Compliant scenario generation failed: {str(e)}", exc_info=True)

            if user_id:
                self.audit_logger.log_action(
                    user_id=user_id,
                    action="generate_scenario",
                    resource="scenario",
                    status="failed",
                    error=str(e),
                )

            raise
