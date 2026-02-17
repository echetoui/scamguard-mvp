"""AnalyticsAgent with FDP compliance patterns integrated."""

import logging
from typing import Optional
from aws_xray_sdk.core import xray_recorder
from agents.analytics_agent import AnalyticsAgent as BaseAnalyticsAgent
from compliance.validator import ComplianceValidator
from compliance.audit_logger import AuditLogger

logger = logging.getLogger(__name__)


class AnalyticsAgentWithCompliance(BaseAnalyticsAgent):
    """AnalyticsAgent enhanced with FDP compliance patterns."""

    def __init__(self, dynamodb_table):
        """Initialize with base agent and compliance.

        Args:
            dynamodb_table: DynamoDB table reference
        """
        super().__init__(dynamodb_table)
        self.validator = ComplianceValidator()
        self.audit_logger = AuditLogger()

    @xray_recorder.capture("get_analytics_with_compliance")
    def get_user_analytics_compliant(self, user_id: str) -> dict:
        """Get user analytics with compliance checks.

        Args:
            user_id: Cognito user ID

        Returns:
            Analytics dict with compliance status
        """
        try:
            # 1. Check user compliance before data access
            is_compliant, issues = self.validator.validate_operation(
                operation="get_analytics",
                user_id=user_id,
                data={"user_id": user_id},
            )

            if not is_compliant:
                self.audit_logger.log_action(
                    user_id=user_id,
                    action="get_analytics",
                    resource="analytics",
                    status="blocked",
                    error="Compliance check failed",
                    details={"issues": issues},
                )

                return {
                    "error": "Compliance check failed",
                    "compliance_issues": issues,
                }

            # 2. Get analytics (from base class)
            result = self.get_user_analytics(user_id)

            # 3. Log data access for GDPR compliance
            self.audit_logger.log_data_access(
                user_id=user_id,
                data_type="analytics",
                operation="read",
                data_count=1,
            )

            # 4. Add compliance metadata
            result["compliance"] = {
                "compliant": True,
                "issues": [],
            }

            xray_recorder.put_annotation("analytics_compliant", "true")

            return result

        except Exception as e:
            logger.error(f"Compliant analytics retrieval failed: {str(e)}", exc_info=True)

            self.audit_logger.log_action(
                user_id=user_id,
                action="get_analytics",
                resource="analytics",
                status="failed",
                error=str(e),
            )

            raise

    @xray_recorder.capture("update_analytics_with_compliance")
    def update_analytics_compliant(
        self,
        user_id: str,
        analysis_result: dict,
        correct_answer: Optional[bool] = None,
    ) -> dict:
        """Update analytics with compliance checks.

        Args:
            user_id: Cognito user ID
            analysis_result: Results from DetectionAgent
            correct_answer: Whether user's assessment was correct

        Returns:
            Updated analytics with compliance metadata
        """
        try:
            # 1. Check user compliance before operation
            is_compliant, issues = self.validator.validate_operation(
                operation="update_analytics",
                user_id=user_id,
                data={"user_id": user_id, "risk_level": analysis_result.get("risk_level")},
            )

            if not is_compliant:
                self.audit_logger.log_action(
                    user_id=user_id,
                    action="update_analytics",
                    resource="analytics",
                    status="blocked",
                    error="Compliance check failed",
                    details={"issues": issues},
                )

                return {
                    "error": "Compliance check failed",
                    "compliance_issues": issues,
                }

            # 2. Update analytics (from base class)
            result = self.update_analytics(user_id, analysis_result, correct_answer)

            # 3. Log data modification for GDPR compliance
            self.audit_logger.log_data_access(
                user_id=user_id,
                data_type="analytics",
                operation="update",
                data_count=1,
            )

            # 4. Add compliance metadata
            result["compliance"] = {
                "compliant": True,
                "issues": [],
            }

            xray_recorder.put_annotation("analytics_update_compliant", "true")

            return result

        except Exception as e:
            logger.error(f"Compliant analytics update failed: {str(e)}", exc_info=True)

            self.audit_logger.log_action(
                user_id=user_id,
                action="update_analytics",
                resource="analytics",
                status="failed",
                error=str(e),
            )

            raise
