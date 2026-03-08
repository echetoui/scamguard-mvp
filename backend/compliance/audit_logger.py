"""Audit logging for compliance tracking."""

import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional

try:
    import boto3
    dynamodb = boto3.resource("dynamodb")
except ImportError:
    dynamodb = None  # type: ignore


class AuditLogger:
    """Logger for audit trails and compliance tracking."""

    def __init__(self, table_name: str = "ScamGuardAudit"):
        """Initialize audit logger."""
        self.table_name = table_name
        self.logger = logging.getLogger("audit")

    def log(
        self,
        action: str,
        user_id: str,
        resource: str,
        details: Optional[Dict[str, Any]] = None,
        status: str = "success",
    ) -> Dict[str, Any]:
        """Log an audit event."""
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
        """Log resource access."""
        return self.log("access", user_id, resource, {"type": access_type})

    def log_modification(
        self, user_id: str, resource: str, old_value: Any = None, new_value: Any = None
    ) -> Dict[str, Any]:
        """Log resource modification."""
        return self.log(
            "modify",
            user_id,
            resource,
            {"old_value": old_value, "new_value": new_value},
        )

    def log_deletion(self, user_id: str, resource: str) -> Dict[str, Any]:
        """Log resource deletion."""
        return self.log("delete", user_id, resource)
