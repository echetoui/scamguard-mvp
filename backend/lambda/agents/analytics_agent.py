"""AnalyticsAgent - Track and summarize user learning progress."""

import logging
from typing import Optional, Dict, List
from datetime import datetime
from aws_xray_sdk.core import xray_recorder

logger = logging.getLogger(__name__)


class AnalyticsAgent:
    """Track user learning progress and provide insights."""

    def __init__(self, dynamodb_table):
        """Initialize with DynamoDB table reference."""
        self.table = dynamodb_table

    @xray_recorder.capture("get_user_analytics")
    def get_user_analytics(self, user_id: str) -> dict:
        """Get user's learning analytics.

        Args:
            user_id: Cognito user ID

        Returns:
            Analytics dict with sessions, progress, trends
        """
        try:
            xray_recorder.put_annotation("user_id", user_id)

            # Query user analytics
            response = self.table.get_item(
                Key={"PK": f"USER#{user_id}", "SK": "ANALYTICS"}
            )

            if "Item" not in response:
                return self._create_empty_analytics(user_id)

            data = response["Item"]

            return {
                "user_id": user_id,
                "total_scenarios": data.get("total_scenarios", 0),
                "total_analyses": data.get("total_analyses", 0),
                "sessions_completed": data.get("sessions_completed", 0),
                "high_risk_detected": data.get("high_risk_detected", 0),
                "medium_risk_detected": data.get("medium_risk_detected", 0),
                "low_risk_detected": data.get("low_risk_detected", 0),
                "accuracy_score": data.get("accuracy_score", 0),
                "learning_streak": data.get("learning_streak", 0),
                "last_activity": data.get("last_activity", None),
                "created_at": data.get("created_at", None),
            }

        except Exception as e:
            logger.error(f"Analytics retrieval failed: {str(e)}", exc_info=True)
            return self._create_empty_analytics(user_id)

    @xray_recorder.capture("update_analytics")
    def update_analytics(
        self,
        user_id: str,
        analysis_result: dict,
        correct_answer: Optional[bool] = None,
    ) -> dict:
        """Update analytics after user session.

        Args:
            user_id: Cognito user ID
            analysis_result: Results from DetectionAgent
            correct_answer: Whether user's assessment was correct

        Returns:
            Updated analytics
        """
        try:
            # Get current analytics
            current = self.get_user_analytics(user_id)

            # Update counters
            risk_level = analysis_result.get("risk_level", "unknown")
            if risk_level == "high":
                current["high_risk_detected"] = current.get("high_risk_detected", 0) + 1
            elif risk_level == "medium":
                current["medium_risk_detected"] = (
                    current.get("medium_risk_detected", 0) + 1
                )
            else:
                current["low_risk_detected"] = current.get("low_risk_detected", 0) + 1

            current["total_analyses"] = current.get("total_analyses", 0) + 1
            current["last_activity"] = datetime.now().isoformat()

            # Update DynamoDB
            self.table.update_item(
                Key={"PK": f"USER#{user_id}", "SK": "ANALYTICS"},
                UpdateExpression="SET total_analyses = :ta, high_risk_detected = :hrd, medium_risk_detected = :mrd, low_risk_detected = :lrd, last_activity = :la",
                ExpressionAttributeValues={
                    ":ta": current["total_analyses"],
                    ":hrd": current["high_risk_detected"],
                    ":mrd": current["medium_risk_detected"],
                    ":lrd": current["low_risk_detected"],
                    ":la": current["last_activity"],
                },
            )

            return current

        except Exception as e:
            logger.error(f"Analytics update failed: {str(e)}", exc_info=True)
            return current

    def _create_empty_analytics(self, user_id: str) -> dict:
        """Create empty analytics template."""
        return {
            "user_id": user_id,
            "total_scenarios": 0,
            "total_analyses": 0,
            "sessions_completed": 0,
            "high_risk_detected": 0,
            "medium_risk_detected": 0,
            "low_risk_detected": 0,
            "accuracy_score": 0,
            "learning_streak": 0,
            "last_activity": None,
            "created_at": datetime.now().isoformat(),
        }
