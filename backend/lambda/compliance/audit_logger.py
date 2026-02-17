"""Audit logger - Track all actions for compliance."""

import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import boto3
from aws_xray_sdk.core import xray_recorder

logger = logging.getLogger(__name__)

dynamodb = boto3.resource("dynamodb")


class AuditLogger:
    """Log actions for compliance auditing (FDP pattern)."""

    def __init__(self, table_name: str = "ScamGuardAudit"):
        """Initialize audit logger.

        Args:
            table_name: DynamoDB table for audit logs
        """
        self.table = dynamodb.Table(table_name)

    @xray_recorder.capture("log_user_action")
    def log_action(
        self,
        user_id: str,
        action: str,
        resource: str,
        status: str,
        details: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> bool:
        """Log user action for audit trail.

        Args:
            user_id: User performing action
            action: Action type (create, read, update, delete, analyze)
            resource: Resource affected (user, analysis, scenario)
            status: Action status (success, failed, blocked)
            details: Additional details
            error: Error message if failed

        Returns:
            True if logged successfully
        """
        try:
            timestamp = datetime.utcnow().isoformat()

            item = {
                "PK": f"AUDIT#{timestamp}",
                "SK": f"USER#{user_id}#ACTION#{action}",
                "user_id": user_id,
                "action": action,
                "resource": resource,
                "status": status,
                "timestamp": timestamp,
                "ttl": int(datetime.utcnow().timestamp()) + (90 * 24 * 60 * 60),  # 90 days
            }

            if details:
                item["details"] = json.dumps(details)

            if error:
                item["error"] = error

            self.table.put_item(Item=item)

            xray_recorder.put_annotation("audit_logged", "true")
            xray_recorder.put_annotation("audit_action", action)
            xray_recorder.put_annotation("audit_status", status)

            return True

        except Exception as e:
            logger.error(f"Failed to log action: {str(e)}", exc_info=True)
            return False

    @xray_recorder.capture("log_data_access")
    def log_data_access(
        self,
        user_id: str,
        data_type: str,
        operation: str,
        data_count: int = 0,
    ) -> bool:
        """Log data access for GDPR compliance.

        Args:
            user_id: User accessing data
            data_type: Type of data (user_data, sessions, analytics)
            operation: Operation type (read, export, delete)
            data_count: Number of records affected

        Returns:
            True if logged successfully
        """
        return self.log_action(
            user_id=user_id,
            action=f"data_{operation}",
            resource=data_type,
            status="success",
            details={
                "data_type": data_type,
                "operation": operation,
                "data_count": data_count,
                "gdpr_right": True if operation in ["export", "delete"] else False,
            },
        )

    @xray_recorder.capture("log_security_event")
    def log_security_event(
        self,
        user_id: str,
        event_type: str,
        severity: str,
        description: str,
    ) -> bool:
        """Log security event for audit.

        Args:
            user_id: User involved
            event_type: Type of security event (failed_login, rate_limit, etc)
            severity: low, medium, high, critical
            description: Event description

        Returns:
            True if logged successfully
        """
        return self.log_action(
            user_id=user_id,
            action=f"security_{event_type}",
            resource="security",
            status="success",
            details={
                "event_type": event_type,
                "severity": severity,
                "description": description,
            },
        )

    def get_user_audit_trail(
        self, user_id: str, days: int = 30
    ) -> list:
        """Get audit trail for user.

        Args:
            user_id: User ID
            days: Look back period in days

        Returns:
            List of audit entries
        """
        try:
            response = self.table.query(
                KeyConditionExpression="SK = :sk",
                ExpressionAttributeValues={
                    ":sk": f"USER#{user_id}",
                },
                Limit=100,
                ScanIndexForward=False,  # Most recent first
            )

            return response.get("Items", [])

        except Exception as e:
            logger.error(f"Failed to get audit trail: {str(e)}")
            return []

    def get_compliance_report(self, days: int = 30) -> Dict[str, Any]:
        """Generate compliance audit report.

        Args:
            days: Report period in days

        Returns:
            Compliance report
        """
        try:
            # Scan all audit logs
            response = self.table.scan()
            items = response.get("Items", [])

            # Aggregate statistics
            stats = {
                "total_actions": len(items),
                "actions_by_type": {},
                "actions_by_status": {},
                "security_events": [],
                "data_access_events": [],
                "period_days": days,
                "generated_at": datetime.utcnow().isoformat(),
            }

            for item in items:
                action = item.get("action", "unknown")
                status = item.get("status", "unknown")

                stats["actions_by_type"][action] = (
                    stats["actions_by_type"].get(action, 0) + 1
                )
                stats["actions_by_status"][status] = (
                    stats["actions_by_status"].get(status, 0) + 1
                )

                if "security" in action:
                    stats["security_events"].append(item)

                if "data_" in action:
                    stats["data_access_events"].append(item)

            return stats

        except Exception as e:
            logger.error(f"Failed to generate compliance report: {str(e)}")
            return {}
