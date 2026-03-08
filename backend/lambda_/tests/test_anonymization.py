"""
Unit tests for anonymization module
Tests hashing, TTL, and privacy compliance
"""

import unittest
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

# Add parent directory to path for imports
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.anonymization import (
    AnonymizationManager,
    anonymize_item,
    get_anonymization_manager
)


class TestAnonymizationManager(unittest.TestCase):
    """Test AnonymizationManager class"""

    def setUp(self):
        """Set up test fixtures"""
        # Mock the SSM client to avoid AWS calls
        self.ssm_patcher = patch('utils.anonymization.ssm_client')
        self.mock_ssm = self.ssm_patcher.start()

        # Mock salt retrieval
        self.test_salt = 'test_salt_value_12345'
        self.mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': self.test_salt}
        }

        self.manager = AnonymizationManager()

    def tearDown(self):
        """Clean up patches"""
        self.ssm_patcher.stop()

    def test_hash_is_deterministic(self):
        """Hash should be the same for the same input"""
        user_id = "user123@example.com"

        hash1 = self.manager.hash_user_id(user_id)
        hash2 = self.manager.hash_user_id(user_id)

        self.assertEqual(hash1, hash2, "Hash should be deterministic")

    def test_hash_is_different_for_different_input(self):
        """Different inputs should produce different hashes"""
        hash1 = self.manager.hash_user_id("user1@example.com")
        hash2 = self.manager.hash_user_id("user2@example.com")

        self.assertNotEqual(hash1, hash2, "Different inputs should produce different hashes")

    def test_hash_format(self):
        """Hash should be hexadecimal string"""
        hash_value = self.manager.hash_user_id("test_user")

        # Check it's a valid hex string
        try:
            int(hash_value, 16)
        except ValueError:
            self.fail("Hash should be valid hexadecimal")

        # Check length (SHA256 = 64 hex chars)
        self.assertEqual(len(hash_value), 64, "SHA256 hash should be 64 hex characters")

    def test_verify_hash_success(self):
        """verify_hash should return True for matching hash"""
        user_id = "test_user@example.com"
        hash_value = self.manager.hash_user_id(user_id)

        is_valid = self.manager.verify_hash(user_id, hash_value)
        self.assertTrue(is_valid, "verify_hash should return True for correct hash")

    def test_verify_hash_failure(self):
        """verify_hash should return False for non-matching hash"""
        user_id = "test_user@example.com"
        wrong_hash = "incorrect_hash_value_0000000000000000000000000000000000000000000000000000000000000000"

        is_valid = self.manager.verify_hash(user_id, wrong_hash)
        self.assertFalse(is_valid, "verify_hash should return False for incorrect hash")

    def test_hash_empty_string_raises_error(self):
        """Hashing empty string should raise ValueError"""
        with self.assertRaises(ValueError):
            self.manager.hash_user_id("")

    def test_hash_none_raises_error(self):
        """Hashing None should raise ValueError"""
        with self.assertRaises(ValueError):
            self.manager.hash_user_id(None)

    def test_expiration_time_is_unix_timestamp(self):
        """get_expiration_time should return integer Unix timestamp"""
        exp_time = self.manager.get_expiration_time()

        self.assertIsInstance(exp_time, int, "Expiration time should be integer")
        self.assertGreater(exp_time, 0, "Unix timestamp should be positive")

    def test_expiration_time_is_30_days_out(self):
        """get_expiration_time should be approximately 30 days from now"""
        exp_time = self.manager.get_expiration_time()

        # Convert to datetime
        exp_datetime = datetime.fromtimestamp(exp_time)

        # Check it's approximately 30 days away
        now = datetime.utcnow()
        delta = exp_datetime - now
        days = delta.days

        self.assertEqual(days, 30, "Expiration should be 30 days from now")

    def test_get_expiration_date_format(self):
        """get_expiration_date should return ISO format string"""
        exp_date = self.manager.get_expiration_date()

        self.assertIsInstance(exp_date, str, "Expiration date should be string")
        self.assertTrue(exp_date.endswith('Z'), "ISO format should end with Z")

        # Try to parse it as ISO datetime
        try:
            datetime.fromisoformat(exp_date.replace('Z', '+00:00'))
        except ValueError:
            self.fail("Expiration date should be valid ISO format")

    def test_salt_is_retrieved_only_once(self):
        """Salt should be cached and retrieved only once"""
        self.manager._salt = None
        self.mock_ssm.reset_mock()

        # First call should retrieve salt
        self.manager.hash_user_id("user1")
        self.assertEqual(self.mock_ssm.get_parameter.call_count, 1)

        # Second call should use cached salt
        self.manager.hash_user_id("user2")
        self.assertEqual(self.mock_ssm.get_parameter.call_count, 1)


class TestAnonymizeItem(unittest.TestCase):
    """Test anonymize_item function"""

    def setUp(self):
        """Set up test fixtures"""
        self.ssm_patcher = patch('utils.anonymization.ssm_client')
        self.mock_ssm = self.ssm_patcher.start()

        self.test_salt = 'test_salt_value_12345'
        self.mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': self.test_salt}
        }

    def tearDown(self):
        """Clean up patches"""
        self.ssm_patcher.stop()

    def test_anonymize_item_removes_userid(self):
        """anonymize_item should remove userId field"""
        item = {
            'userId': 'user123',
            'timestamp': '2026-02-17T10:00:00Z',
            'analysis': {'risk_score': 75, 'is_scam': True}
        }

        result = anonymize_item(item)

        self.assertNotIn('userId', result, "userId should be removed")
        self.assertIn('hashedUserId', result, "hashedUserId should be added")

    def test_anonymize_item_adds_hashed_userid(self):
        """anonymize_item should add hashedUserId"""
        item = {
            'userId': 'user123',
            'timestamp': '2026-02-17T10:00:00Z',
            'analysis': {'risk_score': 75, 'is_scam': True}
        }

        result = anonymize_item(item)

        self.assertIn('hashedUserId', result)
        self.assertEqual(len(result['hashedUserId']), 64)  # SHA256

    def test_anonymize_item_adds_ttl(self):
        """anonymize_item should add expirationTime"""
        item = {
            'userId': 'user123',
            'timestamp': '2026-02-17T10:00:00Z'
        }

        result = anonymize_item(item)

        self.assertIn('expirationTime', result)
        self.assertIsInstance(result['expirationTime'], int)

    def test_anonymize_item_preserves_other_fields(self):
        """anonymize_item should preserve non-userId fields"""
        item = {
            'userId': 'user123',
            'timestamp': '2026-02-17T10:00:00Z',
            'analysis': {'risk_score': 75, 'is_scam': True},
            'metadata': {'source': 'api'}
        }

        result = anonymize_item(item)

        self.assertEqual(result['timestamp'], item['timestamp'])
        self.assertEqual(result['analysis'], item['analysis'])
        self.assertEqual(result['metadata'], item['metadata'])

    def test_anonymize_item_adds_timestamp_if_missing(self):
        """anonymize_item should add timestamp if not present"""
        item = {
            'userId': 'user123',
            'analysis': {'risk_score': 75}
        }

        result = anonymize_item(item)

        self.assertIn('timestamp', result)

    def test_anonymize_item_with_anonymous_user(self):
        """anonymize_item should handle items without userId"""
        item = {
            'timestamp': '2026-02-17T10:00:00Z',
            'analysis': {'risk_score': 50}
        }

        result = anonymize_item(item)

        self.assertIn('hashedUserId', result)
        self.assertIn('expirationTime', result)


class TestGetAnonymizationManager(unittest.TestCase):
    """Test factory function"""

    def setUp(self):
        """Set up test fixtures"""
        self.ssm_patcher = patch('utils.anonymization.ssm_client')
        self.mock_ssm = self.ssm_patcher.start()

        self.test_salt = 'test_salt_value_12345'
        self.mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': self.test_salt}
        }

    def tearDown(self):
        """Clean up patches"""
        self.ssm_patcher.stop()

    def test_factory_returns_manager(self):
        """Factory should return AnonymizationManager instance"""
        manager = get_anonymization_manager()

        self.assertIsInstance(manager, AnonymizationManager)

    def test_factory_manager_works(self):
        """Factory-created manager should work"""
        manager = get_anonymization_manager()

        hash_value = manager.hash_user_id("test_user")

        self.assertEqual(len(hash_value), 64)


class TestPrivacyCompliance(unittest.TestCase):
    """Test privacy compliance requirements"""

    def setUp(self):
        """Set up test fixtures"""
        self.ssm_patcher = patch('utils.anonymization.ssm_client')
        self.mock_ssm = self.ssm_patcher.start()

        self.test_salt = 'test_salt_value_12345'
        self.mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': self.test_salt}
        }

    def tearDown(self):
        """Clean up patches"""
        self.ssm_patcher.stop()

    def test_no_plaintext_userid_in_output(self):
        """Anonymized items should never contain plaintext userId"""
        item = {
            'userId': 'user123@example.com',
            'email': 'user123@example.com',
            'analysis': {'risk_score': 75}
        }

        result = anonymize_item(item)
        result_json = json.dumps(result)

        # Check userId doesn't appear
        self.assertNotIn('user123', result_json.lower(), "Original userId should not appear in output")

    def test_hash_not_reversible(self):
        """Hash should be one-way (not reversible)"""
        user_id = "user123@example.com"

        manager = AnonymizationManager()
        hash_value = manager.hash_user_id(user_id)

        # We can't reverse a hash, only verify against known values
        # This test just ensures our hash is being used properly
        self.assertNotEqual(hash_value, user_id, "Hash should be different from original")

    def test_loi_25_compliance(self):
        """Test Loi 25 compliance requirements"""
        # Loi 25 requires:
        # 1. Pseudonymization (we do this with hash)
        # 2. Data deletion after 30 days (we do this with TTL)

        item = {
            'userId': 'user@example.com',
            'analysis': {'risk_score': 75}
        }

        result = anonymize_item(item)

        # Check pseudonymization
        self.assertNotIn('userId', result, "Should use pseudonymization (no userId)")
        self.assertIn('hashedUserId', result, "Should have hashed ID")

        # Check TTL
        self.assertIn('expirationTime', result, "Should have TTL")
        exp_time = result['expirationTime']
        now = datetime.utcnow()
        exp_datetime = datetime.fromtimestamp(exp_time)
        days_until_expiry = (exp_datetime - now).days
        self.assertEqual(days_until_expiry, 30, "Should expire in 30 days (Loi 25)")


if __name__ == '__main__':
    unittest.main()
