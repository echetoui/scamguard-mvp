"""Tests for audit logging."""

import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from compliance.audit_logger import AuditLogger
from datetime import datetime


class TestAuditLogger:
    """Test audit logging functionality."""

    def setup_method(self):
        """Setup test fixtures."""
        # Mock DynamoDB table
        self.mock_table = MagicMock()

        with patch('compliance.audit_logger.dynamodb') as mock_dynamodb:
            mock_dynamodb.Table.return_value = self.mock_table
            self.logger = AuditLogger(table_name="TestAuditTable")

    def test_log_action_success(self):
        """Test successful action logging."""
        self.mock_table.put_item.return_value = {}

        result = self.logger.log_action(
            user_id="user123",
            action="analyze_image",
            resource="image",
            status="success",
            details={"risk_level": "high"}
        )

        assert result is True
        self.mock_table.put_item.assert_called_once()

        # Check the item structure
        call_args = self.mock_table.put_item.call_args
        item = call_args.kwargs["Item"] if "Item" in call_args.kwargs else call_args[0][0]["Item"]

        assert item["user_id"] == "user123"
        assert item["action"] == "analyze_image"
        assert item["status"] == "success"

    def test_log_action_with_error(self):
        """Test logging action with error."""
        self.mock_table.put_item.return_value = {}

        result = self.logger.log_action(
            user_id="user123",
            action="analyze_image",
            resource="image",
            status="failed",
            error="API timeout"
        )

        assert result is True
        call_args = self.mock_table.put_item.call_args
        item = call_args.kwargs["Item"] if "Item" in call_args.kwargs else call_args[0][0]["Item"]

        assert item["error"] == "API timeout"

    def test_log_action_db_failure(self):
        """Test handling database failure."""
        self.mock_table.put_item.side_effect = Exception("Database error")

        result = self.logger.log_action(
            user_id="user123",
            action="analyze_image",
            resource="image",
            status="success"
        )

        assert result is False

    def test_log_data_access_read(self):
        """Test logging data access for read operation."""
        self.mock_table.put_item.return_value = {}

        result = self.logger.log_data_access(
            user_id="user123",
            data_type="user_data",
            operation="read",
            data_count=1
        )

        assert result is True
        call_args = self.mock_table.put_item.call_args
        item = call_args.kwargs["Item"] if "Item" in call_args.kwargs else call_args[0][0]["Item"]

        assert item["user_id"] == "user123"
        assert "data_read" in item["action"]

    def test_log_data_access_gdpr_export(self):
        """Test logging GDPR export operation."""
        self.mock_table.put_item.return_value = {}

        result = self.logger.log_data_access(
            user_id="user123",
            data_type="user_data",
            operation="export",
            data_count=50
        )

        assert result is True
        call_args = self.mock_table.put_item.call_args
        item = call_args.kwargs["Item"] if "Item" in call_args.kwargs else call_args[0][0]["Item"]

        details = json.loads(item.get("details", "{}"))
        assert details.get("gdpr_right") is True

    def test_log_data_access_gdpr_delete(self):
        """Test logging GDPR delete operation."""
        self.mock_table.put_item.return_value = {}

        result = self.logger.log_data_access(
            user_id="user123",
            data_type="user_data",
            operation="delete",
            data_count=50
        )

        assert result is True
        call_args = self.mock_table.put_item.call_args
        item = call_args.kwargs["Item"] if "Item" in call_args.kwargs else call_args[0][0]["Item"]

        details = json.loads(item.get("details", "{}"))
        assert details.get("gdpr_right") is True

    def test_log_security_event(self):
        """Test logging security event."""
        self.mock_table.put_item.return_value = {}

        result = self.logger.log_security_event(
            user_id="user123",
            event_type="failed_login",
            severity="high",
            description="Multiple failed login attempts"
        )

        assert result is True
        call_args = self.mock_table.put_item.call_args
        item = call_args.kwargs["Item"] if "Item" in call_args.kwargs else call_args[0][0]["Item"]

        assert "security_failed_login" in item["action"]

    def test_log_action_ttl_set(self):
        """Test that TTL is set correctly on audit records."""
        self.mock_table.put_item.return_value = {}

        self.logger.log_action(
            user_id="user123",
            action="analyze_image",
            resource="image",
            status="success"
        )

        call_args = self.mock_table.put_item.call_args
        item = call_args.kwargs["Item"] if "Item" in call_args.kwargs else call_args[0][0]["Item"]

        # TTL should be set for 90 days
        assert "ttl" in item
        assert item["ttl"] > 0

    def test_get_user_audit_trail_empty(self):
        """Test getting audit trail for user with no entries."""
        self.mock_table.query.return_value = {"Items": []}

        trail = self.logger.get_user_audit_trail("user123")

        assert trail == []
        self.mock_table.query.assert_called_once()

    def test_get_user_audit_trail_multiple_entries(self):
        """Test getting audit trail with multiple entries."""
        mock_items = [
            {
                "user_id": "user123",
                "action": "analyze_image",
                "status": "success",
                "timestamp": "2026-02-16T10:00:00"
            },
            {
                "user_id": "user123",
                "action": "generate_scenario",
                "status": "success",
                "timestamp": "2026-02-16T09:00:00"
            }
        ]
        self.mock_table.query.return_value = {"Items": mock_items}

        trail = self.logger.get_user_audit_trail("user123")

        assert len(trail) == 2
        assert trail[0]["action"] == "analyze_image"

    def test_get_user_audit_trail_db_error(self):
        """Test handling database error when retrieving audit trail."""
        self.mock_table.query.side_effect = Exception("Database error")

        trail = self.logger.get_user_audit_trail("user123")

        assert trail == []

    def test_get_compliance_report(self):
        """Test generating compliance audit report."""
        mock_items = [
            {
                "user_id": "user123",
                "action": "analyze_image",
                "status": "success",
                "timestamp": "2026-02-16T10:00:00"
            },
            {
                "user_id": "user456",
                "action": "security_failed_login",
                "status": "success",
                "timestamp": "2026-02-16T09:00:00"
            },
            {
                "user_id": "user789",
                "action": "data_export",
                "status": "success",
                "timestamp": "2026-02-16T08:00:00"
            }
        ]
        self.mock_table.scan.return_value = {"Items": mock_items}

        report = self.logger.get_compliance_report(days=30)

        assert report["total_actions"] == 3
        assert "actions_by_type" in report
        assert "security_events" in report
        assert "data_access_events" in report
        assert report["period_days"] == 30

    def test_get_compliance_report_db_error(self):
        """Test handling database error when generating report."""
        self.mock_table.scan.side_effect = Exception("Database error")

        report = self.logger.get_compliance_report()

        assert report == {}
