"""Unit tests for threat sharing functionality (Phase 5A)."""

import os
import sys
import json
from datetime import datetime
from unittest.mock import MagicMock, patch
import pytest

# Setup path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Mock environment variables before importing
os.environ['DYNAMODB_TABLE'] = 'ScamGuardData-dev'
os.environ['OPENAI_PARAM_NAME'] = '/scamguard/openai-key'
os.environ['GEMINI_PARAM_NAME'] = '/scamguard/gemini-key'


class TestThreatSharing:
    """Test suite for threat sharing with family (Phase 5A)"""

    @pytest.fixture(autouse=True)
    def setup_mocks(self):
        """Setup mocks for each test.

        handler_llm is a module that captures boto3.resource at import time in a
        module-level global.  Patching boto3.resource after the module has been
        imported has no effect.  Instead we patch the already-bound module-level
        'dynamodb' variable directly so that _get_dynamodb_table() returns our
        mock table for every call during the test.
        """
        self.mock_table = MagicMock()

        from lambda_ import handler_llm
        self.handler = handler_llm

        # Build a mock DynamoDB resource whose .Table() returns self.mock_table
        mock_dynamodb_resource = MagicMock()
        mock_dynamodb_resource.Table.return_value = self.mock_table

        with patch.object(handler_llm, 'dynamodb', mock_dynamodb_resource):
            yield

    # ========================================================================
    # Test: Share Threat with Family (HIGH/CRITICAL only)
    # ========================================================================

    def test_share_threat_critical_severity(self):
        """Test sharing a CRITICAL threat (risk_score >= 75)."""
        user_id = "user-123"
        family_id = "family-456"
        result = {
            "risk_score": 95,
            "is_scam": True,
            "explanation": "Clear phishing attempt"
        }
        user_response = "Click here to verify your account immediately!"

        # Mock DynamoDB put_item
        self.mock_table.put_item.return_value = {}

        threat = self.handler.share_threat_with_family(
            user_id, family_id, result, user_response
        )

        assert threat is not None
        assert threat["severity"] == "CRITICAL"
        assert threat["riskScore"] == 95
        assert threat["reportedBy"] == user_id
        assert threat["PK"] == f"FAMILY#{family_id}"
        assert threat["SK"].startswith("THREAT#")

        # Verify DynamoDB was called
        self.mock_table.put_item.assert_called_once()

    def test_share_threat_high_severity(self):
        """Test sharing a HIGH threat (60 <= risk_score < 75)."""
        user_id = "user-789"
        family_id = "family-999"
        result = {
            "risk_score": 68,
            "is_scam": True,
            "explanation": "Suspicious payment request"
        }
        user_response = "Update your payment information"

        self.mock_table.put_item.return_value = {}

        threat = self.handler.share_threat_with_family(
            user_id, family_id, result, user_response
        )

        assert threat is not None
        assert threat["severity"] == "HIGH"
        assert threat["riskScore"] == 68

    def test_dont_share_low_threat(self):
        """Test that LOW/MEDIUM threats are NOT shared (risk_score < 60)."""
        user_id = "user-456"
        family_id = "family-789"
        result = {
            "risk_score": 45,
            "is_scam": False,
            "explanation": "Legitimate message"
        }
        user_response = "This looks fine to me"

        threat = self.handler.share_threat_with_family(
            user_id, family_id, result, user_response
        )

        # Should return None - no threat created
        assert threat is None

        # Verify DynamoDB was NOT called
        self.mock_table.put_item.assert_not_called()

    def test_dont_share_medium_threat(self):
        """Test that MEDIUM threats (50-59) are NOT shared."""
        user_id = "user-111"
        family_id = "family-222"
        result = {
            "risk_score": 55,
            "is_scam": False,
            "explanation": "Possibly legitimate"
        }
        user_response = "Uncertain message"

        threat = self.handler.share_threat_with_family(
            user_id, family_id, result, user_response
        )

        assert threat is None
        self.mock_table.put_item.assert_not_called()

    def test_threat_content_truncated(self):
        """Test that threat content is truncated to 500 chars."""
        user_id = "user-333"
        family_id = "family-444"
        result = {
            "risk_score": 85,
            "is_scam": True,
            "explanation": "Phishing"
        }
        # Create a very long message
        long_message = "A" * 1000

        self.mock_table.put_item.return_value = {}

        threat = self.handler.share_threat_with_family(
            user_id, family_id, result, long_message
        )

        assert threat is not None
        assert len(threat["content"]) == 500
        assert threat["content"] == long_message[:500]

    # ========================================================================
    # Test: Get User Family ID
    # ========================================================================

    def test_get_user_family_id_exists(self):
        """Test retrieving familyId when user has a family."""
        user_id = "user-family-abc"
        family_id = "family-xyz-123"

        self.mock_table.get_item.return_value = {
            "Item": {
                "PK": f"USER#{user_id}",
                "SK": "PROFILE",
                "email": "user@example.com",
                "familyId": family_id
            }
        }

        result = self.handler.get_user_family_id(user_id)

        assert result == family_id
        self.mock_table.get_item.assert_called_once_with(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "PROFILE"
            }
        )

    def test_get_user_family_id_no_family(self):
        """Test retrieving familyId when user has no family."""
        user_id = "solo-user"

        self.mock_table.get_item.return_value = {
            "Item": {
                "PK": f"USER#{user_id}",
                "SK": "PROFILE",
                "email": "solo@example.com"
                # No familyId
            }
        }

        result = self.handler.get_user_family_id(user_id)

        assert result is None

    def test_get_user_family_id_user_not_found(self):
        """Test retrieving familyId when user profile doesn't exist."""
        user_id = "nonexistent"

        self.mock_table.get_item.return_value = {}

        result = self.handler.get_user_family_id(user_id)

        assert result is None

    # ========================================================================
    # Test: Threat Record Schema
    # ========================================================================

    def test_threat_record_has_required_fields(self):
        """Test that threat records contain all required fields."""
        user_id = "user-555"
        family_id = "family-666"
        result = {
            "risk_score": 90,
            "is_scam": True,
            "explanation": "Obvious scam"
        }
        user_response = "Verify account now!"

        self.mock_table.put_item.return_value = {}

        threat = self.handler.share_threat_with_family(
            user_id, family_id, result, user_response
        )

        # Check all required fields
        assert threat["PK"] == f"FAMILY#{family_id}"
        assert threat["SK"].startswith("THREAT#")
        assert "reportedBy" in threat
        assert "reportedAt" in threat
        assert "scamType" in threat
        assert "severity" in threat
        assert "content" in threat
        assert "riskScore" in threat
        assert "explanation" in threat
        assert "ttl" in threat

    def test_threat_record_sk_includes_timestamp(self):
        """Test that threat SK includes ISO timestamp."""
        user_id = "user-777"
        family_id = "family-888"
        result = {
            "risk_score": 80,
            "is_scam": True,
            "explanation": "Scam"
        }
        user_response = "Test"

        self.mock_table.put_item.return_value = {}

        threat = self.handler.share_threat_with_family(
            user_id, family_id, result, user_response
        )

        # SK should be "THREAT#2026-03-06T..."
        sk = threat["SK"]
        assert sk.startswith("THREAT#")
        # Verify the timestamp part is ISO format
        timestamp_part = sk.replace("THREAT#", "")
        # Should be parseable as ISO datetime
        try:
            datetime.fromisoformat(timestamp_part)
            valid_timestamp = True
        except ValueError:
            valid_timestamp = False
        assert valid_timestamp

    def test_threat_ttl_is_30_days(self):
        """Test that threat TTL is set to 30 days."""
        user_id = "user-999"
        family_id = "family-111"
        result = {
            "risk_score": 75,
            "is_scam": True,
            "explanation": "Threat"
        }
        user_response = "Message"

        self.mock_table.put_item.return_value = {}

        threat = self.handler.share_threat_with_family(
            user_id, family_id, result, user_response
        )

        # TTL should be approximately 30 days from now
        now_timestamp = int(datetime.utcnow().timestamp())
        thirty_days_seconds = 30 * 24 * 60 * 60
        expected_ttl = now_timestamp + thirty_days_seconds

        # Allow 5 second variance
        assert abs(threat["ttl"] - expected_ttl) < 5

    # ========================================================================
    # Test: Error Handling
    # ========================================================================

    def test_threat_sharing_database_error(self):
        """Test graceful handling of DynamoDB errors."""
        user_id = "user-error"
        family_id = "family-error"
        result = {
            "risk_score": 80,
            "is_scam": True,
            "explanation": "Error test"
        }
        user_response = "Test"

        # Mock DynamoDB to raise an error
        self.mock_table.put_item.side_effect = Exception("DynamoDB error")

        threat = self.handler.share_threat_with_family(
            user_id, family_id, result, user_response
        )

        # Should return None instead of raising
        assert threat is None

    def test_get_user_family_id_database_error(self):
        """Test graceful handling of DynamoDB errors in get_user_family_id."""
        user_id = "user-db-error"

        # Mock DynamoDB to raise an error
        self.mock_table.get_item.side_effect = Exception("DynamoDB error")

        family_id = self.handler.get_user_family_id(user_id)

        # Should return None instead of raising
        assert family_id is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
