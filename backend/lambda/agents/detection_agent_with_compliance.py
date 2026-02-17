"""DetectionAgent with FDP compliance patterns integrated."""

import json
import time
import logging
from typing import Optional
from openai import OpenAI, APITimeoutError, RateLimitError as OpenAIRateLimitError
from aws_xray_sdk.core import xray_recorder
from agents.detection_agent import DetectionAgent as BaseDetectionAgent
from compliance.validator import ComplianceValidator
from compliance.audit_logger import AuditLogger
from utils.errors import VisionAPITimeout, RateLimitExceeded

logger = logging.getLogger(__name__)


class DetectionAgentWithCompliance(BaseDetectionAgent):
    """DetectionAgent enhanced with FDP compliance patterns."""

    def __init__(self, openai_key: str):
        """Initialize with base agent and compliance.

        Args:
            openai_key: OpenAI API key
        """
        super().__init__(openai_key)
        self.validator = ComplianceValidator()
        self.audit_logger = AuditLogger()

    @xray_recorder.capture("analyze_image_with_compliance")
    def analyze_image_compliant(
        self,
        image_url: str,
        message: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> dict:
        """Analyze image with compliance checks.

        Args:
            image_url: Presigned S3 URL to image
            message: Optional text message
            user_id: User ID for audit logging

        Returns:
            Analysis dict with compliance status
        """
        try:
            # 1. Check user compliance before operation
            if user_id:
                user_data = {"user_id": user_id}
                is_compliant, issues = self.validator.validate_operation(
                    operation="analyze_image",
                    user_id=user_id,
                    data={"image_url": image_url},
                )

                if not is_compliant:
                    self.audit_logger.log_action(
                        user_id=user_id,
                        action="analyze_image",
                        resource="image",
                        status="blocked",
                        error="Compliance check failed",
                        details={"issues": issues},
                    )

                    return {
                        "risk_level": "unknown",
                        "error": "Compliance check failed",
                        "compliance_issues": issues,
                        "model": "compliant_check",
                    }

            # 2. Run analysis (from base class)
            result = self.analyze_image(image_url, message, user_id)

            # 3. Validate result data compliance
            is_data_compliant, data_issues = self.validator.validate_data_handling(
                result
            )

            # 4. Audit log the action
            if user_id:
                self.audit_logger.log_action(
                    user_id=user_id,
                    action="analyze_image",
                    resource="image",
                    status="success",
                    details={
                        "risk_level": result.get("risk_level"),
                        "confidence": result.get("confidence"),
                        "data_compliant": is_data_compliant,
                    },
                )

            # 5. Add compliance metadata
            result["compliance"] = {
                "compliant": is_data_compliant,
                "issues": data_issues,
            }

            xray_recorder.put_annotation("analysis_compliant", str(is_data_compliant))

            return result

        except Exception as e:
            logger.error(f"Compliant analysis failed: {str(e)}", exc_info=True)

            if user_id:
                self.audit_logger.log_action(
                    user_id=user_id,
                    action="analyze_image",
                    resource="image",
                    status="failed",
                    error=str(e),
                )

            raise
