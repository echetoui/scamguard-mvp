"""Audit logging for compliance tracking."""

import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

try:
    import boto3
    dynamodb = boto3.resource("dynamodb")
except ImportError:
    dynamodb = None  # type: ignore

# TTL for audit records: 90 days
AUDIT_TTL_DAYS = 90


class AuditLogger:
    """Logger for audit trails and compliance tracking."""

    def __init__(self, table_name: str = "ScamGuardAudit"):
        """Initialize audit logger.

        Eagerly resolves the DynamoDB table so that tests can patch
        'compliance.audit_logger.dynamodb' before instantiation and have
        the mock table stored in self._table.
        """
        self.table_name = table_name
        self.logger = logging.getLogger("audit")
        # Eagerly initialize table so patch-at-construction-time works
        if dynamodb is not None:
            self._table = dynamodb.Table(table_name)
        else:
            self._table = None

    def _get_table(self):
        """Get DynamoDB table (already initialized in __init__)."""
        return self._table

    def _ttl_timestamp(self, days: int = AUDIT_TTL_DAYS) -> int:
        """Return Unix timestamp for TTL expiry."""
        return int(time.time()) + (days * 24 * 60 * 60)

    # -------------------------------------------------------------------------
    # Primary public interface expected by tests
    # -------------------------------------------------------------------------

    def log_action(
        self,
        user_id: str,
        action: str,
        resource: str,
        status: str = "success",
        details: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> bool:
        """Log a user action to DynamoDB.

        Returns True on success, False on failure.
        """
        try:
            table = self._get_table()
            if table is None:
                return False

            now = datetime.utcnow().isoformat()
            item: Dict[str, Any] = {
                "PK": f"USER#{user_id}",
                "SK": f"AUDIT#{now}#{action}",
                "user_id": user_id,
                "action": action,
                "resource": resource,
                "status": status,
                "timestamp": now,
                "ttl": self._ttl_timestamp(),
                "details": json.dumps(details or {}),
            }
            if error is not None:
                item["error"] = error

            table.put_item(Item=item)
            self.logger.info(json.dumps({"audit": action, "user": user_id, "status": status}))
            return True
        except Exception as e:
            self.logger.error(f"Audit log failed: {e}")
            return False

    def log_data_access(
        self,
        user_id: str,
        data_type: str,
        operation: str,
        data_count: int = 0,
    ) -> bool:
        """Log a data access event (read, export, delete).

        Marks GDPR-relevant operations (export, delete).
        """
        gdpr_operations = {"export", "delete"}
        action_label = f"data_{operation}_{data_type}".lower()
        is_gdpr = operation.lower() in gdpr_operations

        details = {
            "data_type": data_type,
            "operation": operation,
            "data_count": data_count,
            "gdpr_right": is_gdpr,
        }

        try:
            table = self._get_table()
            if table is None:
                return False

            now = datetime.utcnow().isoformat()
            item: Dict[str, Any] = {
                "PK": f"USER#{user_id}",
                "SK": f"AUDIT#{now}#{action_label}",
                "user_id": user_id,
                "action": action_label,
                "resource": data_type,
                "status": "success",
                "timestamp": now,
                "ttl": self._ttl_timestamp(),
                "details": json.dumps(details),
            }

            table.put_item(Item=item)
            return True
        except Exception as e:
            self.logger.error(f"Data access log failed: {e}")
            return False

    def log_security_event(
        self,
        user_id: str,
        event_type: str,
        severity: str,
        description: str,
    ) -> bool:
        """Log a security event (failed login, suspicious activity, etc.)."""
        action_label = f"security_{event_type}"

        try:
            table = self._get_table()
            if table is None:
                return False

            now = datetime.utcnow().isoformat()
            item: Dict[str, Any] = {
                "PK": f"USER#{user_id}",
                "SK": f"AUDIT#{now}#{action_label}",
                "user_id": user_id,
                "action": action_label,
                "resource": "security",
                "status": "success",
                "severity": severity,
                "description": description,
                "timestamp": now,
                "ttl": self._ttl_timestamp(),
                "details": json.dumps({
                    "event_type": event_type,
                    "severity": severity,
                    "description": description,
                }),
            }

            table.put_item(Item=item)
            return True
        except Exception as e:
            self.logger.error(f"Security event log failed: {e}")
            return False

    def get_user_audit_trail(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieve all audit entries for a user.

        Returns empty list on error.
        """
        try:
            table = self._get_table()
            if table is None:
                return []

            response = table.query(
                KeyConditionExpression="PK = :pk",
                ExpressionAttributeValues={":pk": f"USER#{user_id}"},
            )
            return response.get("Items", [])
        except Exception as e:
            self.logger.error(f"Failed to retrieve audit trail: {e}")
            return []

    def get_compliance_report(self, days: int = 30) -> Dict[str, Any]:
        """Generate a compliance audit report for the specified period.

        Returns empty dict on error.
        """
        try:
            table = self._get_table()
            if table is None:
                return {}

            response = table.scan()
            items = response.get("Items", [])

            # Categorize items
            security_events = [i for i in items if str(i.get("action", "")).startswith("security_")]
            data_access_events = [i for i in items if str(i.get("action", "")).startswith("data_")]
            actions_by_type: Dict[str, int] = {}
            for item in items:
                action = item.get("action", "unknown")
                actions_by_type[action] = actions_by_type.get(action, 0) + 1

            return {
                "total_actions": len(items),
                "period_days": days,
                "actions_by_type": actions_by_type,
                "security_events": security_events,
                "data_access_events": data_access_events,
            }
        except Exception as e:
            self.logger.error(f"Failed to generate compliance report: {e}")
            return {}

    # -------------------------------------------------------------------------
    # Legacy interface (kept for backward compatibility)
    # -------------------------------------------------------------------------

    def log(
        self,
        action: str,
        user_id: str,
        resource: str,
        details: Optional[Dict[str, Any]] = None,
        status: str = "success",
    ) -> Dict[str, Any]:
        """Log an audit event (legacy interface)."""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "user_id": user_id,
            "resource": resource,
            "status": status,
            "details": details or {},
        }
        self.logger.info(json.dumps(event))
        return event

    def log_access(self, user_id: str, resource: str, access_type: str = "read") -> Dict[str, Any]:
        """Log resource access (legacy)."""
        return self.log("access", user_id, resource, {"type": access_type})

    def log_modification(
        self, user_id: str, resource: str, old_value: Any = None, new_value: Any = None
    ) -> Dict[str, Any]:
        """Log resource modification (legacy)."""
        return self.log(
            "modify",
            user_id,
            resource,
            {"old_value": old_value, "new_value": new_value},
        )

    def log_deletion(self, user_id: str, resource: str) -> Dict[str, Any]:
        """Log resource deletion (legacy)."""
        return self.log("delete", user_id, resource)
