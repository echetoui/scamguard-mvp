"""
User ID Anonymization Utility for ScamGuard
Implements SHA-256 hashing with salt for Loi 25 compliance
"""

import hashlib
import hmac
import json
import os
import boto3
from datetime import datetime, timedelta
from typing import Optional

# Initialize AWS SDK
secrets_client = boto3.client('secretsmanager', region_name='us-east-1')


class AnonymizationManager:
    """Manages user ID anonymization and hashing for privacy compliance"""

    SALT_SECRET_ID = 'scamguard/anonymization-salt'
    HASH_ALGORITHM = 'sha256'
    TTL_DAYS = 30

    def __init__(self):
        """Initialize the anonymization manager"""
        self._salt = None

    def _get_salt(self) -> str:
        """
        Retrieve salt from AWS Secrets Manager
        Creates a new salt if one doesn't exist

        Returns:
            str: The salt value for hashing
        """
        if self._salt:
            return self._salt

        try:
            response = secrets_client.get_secret_value(SecretId=self.SALT_SECRET_ID)
            self._salt = response.get('SecretString', '')
            return self._salt
        except secrets_client.exceptions.ResourceNotFoundException:
            # Create new salt if it doesn't exist
            self._salt = self._generate_new_salt()
            return self._salt
        except Exception as e:
            print(f"Error retrieving salt from Secrets Manager: {e}")
            raise

    def _generate_new_salt(self) -> str:
        """
        Generate a new cryptographic salt and store in Secrets Manager

        Returns:
            str: The newly generated salt
        """
        import secrets
        salt = secrets.token_hex(32)  # 64 character hex string

        try:
            secrets_client.create_secret(
                Name=self.SALT_SECRET_ID,
                SecretString=salt,
                Description='Anonymization salt for ScamGuard user IDs'
            )
            print(f"Created new anonymization salt in Secrets Manager")
        except secrets_client.exceptions.ResourceExistsException:
            # Salt was created concurrently, retrieve it
            response = secrets_client.get_secret_value(SecretId=self.SALT_SECRET_ID)
            salt = response.get('SecretString', '')
        except Exception as e:
            print(f"Error creating salt in Secrets Manager: {e}")
            raise

        return salt

    def hash_user_id(self, user_id: str) -> str:
        """
        Create a deterministic hash of user ID using SHA-256 + salt

        Args:
            user_id (str): The user ID to hash (e.g., email, UUID)

        Returns:
            str: The hashed user ID (hex format)

        Example:
            manager = AnonymizationManager()
            hashed = manager.hash_user_id("user@example.com")
            # Returns: "a1b2c3d4e5f6..." (deterministic)
        """
        if not user_id:
            raise ValueError("user_id cannot be empty")

        salt = self._get_salt()

        # Use HMAC for additional security
        hashed = hmac.new(
            salt.encode('utf-8'),
            user_id.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        return hashed

    def verify_hash(self, user_id: str, hash_value: str) -> bool:
        """
        Verify that a user_id produces the expected hash
        Used for testing and validation

        Args:
            user_id (str): The original user ID
            hash_value (str): The expected hash value

        Returns:
            bool: True if hash matches, False otherwise
        """
        computed_hash = self.hash_user_id(user_id)
        return hmac.compare_digest(computed_hash, hash_value)

    def get_expiration_time(self) -> int:
        """
        Calculate Unix timestamp for 30 days from now
        Used as DynamoDB TTL value

        Returns:
            int: Unix timestamp when record should expire

        Example:
            exp_time = manager.get_expiration_time()
            # Returns: 1709251800 (Unix timestamp ~30 days out)
        """
        expiration_date = datetime.utcnow() + timedelta(days=self.TTL_DAYS)
        return int(expiration_date.timestamp())

    def get_expiration_date(self) -> str:
        """
        Get human-readable expiration date (ISO format)

        Returns:
            str: ISO format datetime string
        """
        expiration_date = datetime.utcnow() + timedelta(days=self.TTL_DAYS)
        return expiration_date.isoformat() + 'Z'


def anonymize_item(item: dict) -> dict:
    """
    Anonymize a DynamoDB item by hashing userId and adding TTL

    Args:
        item (dict): DynamoDB item with 'userId' field

    Returns:
        dict: Anonymized item with hashedUserId and expirationTime

    Example:
        item = {'userId': 'user123', 'analysis': {...}}
        anonymized = anonymize_item(item)
        # Returns: {'hashedUserId': 'abc123...', 'expirationTime': 1709251800, ...}
    """
    manager = AnonymizationManager()

    # Create new item without userId
    anonymized = {k: v for k, v in item.items() if k != 'userId'}

    # Add hashed user ID
    if 'userId' in item:
        anonymized['hashedUserId'] = manager.hash_user_id(item['userId'])

    # Add TTL field for DynamoDB auto-deletion
    anonymized['expirationTime'] = manager.get_expiration_time()

    # Keep original timestamp if present, otherwise add current time
    if 'timestamp' not in anonymized:
        anonymized['timestamp'] = datetime.utcnow().isoformat() + 'Z'

    return anonymized


def get_anonymization_manager() -> AnonymizationManager:
    """
    Factory function to get AnonymizationManager instance

    Returns:
        AnonymizationManager: Instance ready to use
    """
    return AnonymizationManager()
