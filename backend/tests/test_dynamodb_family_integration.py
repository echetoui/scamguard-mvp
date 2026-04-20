"""
Integration tests for Family Protection DynamoDB operations.
Phase 5A - Tests that validate actual DynamoDB structure and data.
"""

import json
import pytest
from moto import mock_dynamodb
import boto3
from unittest.mock import patch, MagicMock
import sys
import os

# Setup AWS credentials before importing auth_handler
os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
os.environ['AWS_SECURITY_TOKEN'] = 'testing'
os.environ['AWS_SESSION_TOKEN'] = 'testing'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'


@mock_dynamodb
def test_signup_family_role_creates_correct_dynamodb_records():
    """
    Test that family role signup creates exactly 3 DynamoDB records
    with correct structure:
    1. FAMILY#{familyId}/METADATA
    2. FAMILY#{familyId}/MEMBER#{userId}
    3. USER#{userId}/PROFILE (with role and family_id)
    """
    # Setup DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.create_table(
        TableName='ScamGuardData',
        KeySchema=[
            {'AttributeName': 'PK', 'KeyType': 'HASH'},
            {'AttributeName': 'SK', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'PK', 'AttributeType': 'S'},
            {'AttributeName': 'SK', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    # Now import after mocking
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../lambda'))
    from auth_handler import post_signup

    event = {
        "body": json.dumps({
            "email": "parent@example.com",
            "password": "SecurePass123!",
            "role": "family",
        }),
    }

    # Mock Lambda context and Cognito
    lambda_context = MagicMock()
    lambda_context.aws_request_id = "test-trace-id"

    with patch("auth_handler.cognito_client") as mock_cognito:
        mock_cognito.sign_up.return_value = {"UserSub": "family-user-uuid-12345"}

        # Call the handler
        response = post_signup(event, lambda_context)

        # Verify response
        assert response["statusCode"] == 201, f"Expected 201, got {response['statusCode']}"
        body = json.loads(response["body"])
        assert body["data"]["role"] == "family"
        assert "family_id" in body["data"]
        assert "invite_code" in body["data"]
        invite_code = body["data"]["invite_code"]

        # Now check DynamoDB records
        items = table.scan()['Items']
        assert len(items) == 3, f"Expected 3 records, got {len(items)}: {items}"

        # Extract records by type
        family_metadata = None
        family_member = None
        user_profile = None

        for item in items:
            pk = item.get('PK', '')
            sk = item.get('SK', '')

            if pk.startswith('FAMILY#') and sk == 'METADATA':
                family_metadata = item
            elif pk.startswith('FAMILY#') and sk.startswith('MEMBER#'):
                family_member = item
            elif pk.startswith('USER#') and sk == 'PROFILE':
                user_profile = item

        # Verify FAMILY METADATA record
        assert family_metadata is not None, "FAMILY METADATA record not found"
        assert family_metadata['PK'].startswith('FAMILY#'), f"Invalid PK: {family_metadata['PK']}"
        assert family_metadata['SK'] == 'METADATA', f"Invalid SK: {family_metadata['SK']}"
        assert family_metadata['created_by'] == 'family-user-uuid-12345'
        assert family_metadata['family_name'] == 'Family of parent'
        assert family_metadata['invite_code'] == invite_code
        assert len(family_metadata['invite_code']) == 6
        assert family_metadata['invite_code'].isalnum()
        assert 'created_at' in family_metadata

        # Verify FAMILY MEMBER record
        assert family_member is not None, "FAMILY MEMBER record not found"
        assert family_member['PK'].startswith('FAMILY#'), f"Invalid PK: {family_member['PK']}"
        assert family_member['SK'] == f"MEMBER#family-user-uuid-12345"
        assert family_member['email'] == 'parent@example.com'
        assert family_member['role'] == 'family'
        assert 'joined_at' in family_member
        assert 'last_active' in family_member

        # Verify USER PROFILE record
        assert user_profile is not None, "USER PROFILE record not found"
        assert user_profile['PK'] == 'USER#family-user-uuid-12345'
        assert user_profile['SK'] == 'PROFILE'
        assert user_profile['email'] == 'parent@example.com'
        assert user_profile['role'] == 'family'
        assert 'family_id' in user_profile
        assert 'family_invite_code' in user_profile
        assert user_profile['status'] == 'PENDING_VERIFICATION'
        assert 'created_at' in user_profile

        # Verify family IDs match across all records
        family_id_from_metadata = family_metadata['PK'].split('#')[1]
        family_id_from_member = family_member['PK'].split('#')[1]
        family_id_from_profile = user_profile['family_id']
        assert family_id_from_metadata == family_id_from_member
        assert family_id_from_member == family_id_from_profile

        print(f"\n✅ FAMILY METADATA: {json.dumps(family_metadata, indent=2, default=str)}")
        print(f"\n✅ FAMILY MEMBER: {json.dumps(family_member, indent=2, default=str)}")
        print(f"\n✅ USER PROFILE: {json.dumps(user_profile, indent=2, default=str)}")


@mock_dynamodb
def test_signup_senior_role_does_not_create_family():
    """
    Test that senior role signup does NOT create family records,
    only creates USER PROFILE.
    """
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.create_table(
        TableName='ScamGuardData',
        KeySchema=[
            {'AttributeName': 'PK', 'KeyType': 'HASH'},
            {'AttributeName': 'SK', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'PK', 'AttributeType': 'S'},
            {'AttributeName': 'SK', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../lambda'))
    from auth_handler import post_signup

    event = {
        "body": json.dumps({
            "email": "senior@example.com",
            "password": "SecurePass123!",
            "role": "senior",
        }),
    }

    lambda_context = MagicMock()
    lambda_context.aws_request_id = "test-trace-id"

    with patch("auth_handler.cognito_client") as mock_cognito:
        mock_cognito.sign_up.return_value = {"UserSub": "senior-user-uuid-67890"}

        response = post_signup(event, lambda_context)

        assert response["statusCode"] == 201
        body = json.loads(response["body"])
        assert body["data"]["role"] == "senior"
        assert "family_id" not in body["data"]

        # Check DynamoDB
        items = table.scan()['Items']
        assert len(items) == 1, f"Expected 1 record (only PROFILE), got {len(items)}"

        # Only USER PROFILE should exist
        profile = items[0]
        assert profile['PK'] == 'USER#senior-user-uuid-67890'
        assert profile['SK'] == 'PROFILE'
        assert profile['role'] == 'senior'
        assert 'family_id' not in profile

        print(f"\n✅ SENIOR PROFILE: {json.dumps(profile, indent=2, default=str)}")


@mock_dynamodb
def test_signup_individual_role_default():
    """
    Test that signup without role defaults to 'individual' role
    and does not create family records.
    """
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.create_table(
        TableName='ScamGuardData',
        KeySchema=[
            {'AttributeName': 'PK', 'KeyType': 'HASH'},
            {'AttributeName': 'SK', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'PK', 'AttributeType': 'S'},
            {'AttributeName': 'SK', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../lambda'))
    from auth_handler import post_signup

    event = {
        "body": json.dumps({
            "email": "user@example.com",
            "password": "SecurePass123!",
        }),
    }

    lambda_context = MagicMock()
    lambda_context.aws_request_id = "test-trace-id"

    with patch("auth_handler.cognito_client") as mock_cognito:
        mock_cognito.sign_up.return_value = {"UserSub": "user-uuid-11111"}

        response = post_signup(event, lambda_context)

        assert response["statusCode"] == 201
        body = json.loads(response["body"])
        assert body["data"]["role"] == "individual"

        items = table.scan()['Items']
        assert len(items) == 1

        profile = items[0]
        assert profile['role'] == 'individual'
        assert 'family_id' not in profile

        print(f"\n✅ INDIVIDUAL PROFILE: {json.dumps(profile, indent=2, default=str)}")


@mock_dynamodb
def test_family_invite_code_uniqueness():
    """
    Test that each family gets a unique invite code.
    """
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.create_table(
        TableName='ScamGuardData',
        KeySchema=[
            {'AttributeName': 'PK', 'KeyType': 'HASH'},
            {'AttributeName': 'SK', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'PK', 'AttributeType': 'S'},
            {'AttributeName': 'SK', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../lambda'))
    from auth_handler import post_signup

    lambda_context = MagicMock()
    lambda_context.aws_request_id = "test-trace-id"

    invite_codes = set()
    family_ids = set()

    # Create 3 family accounts
    for i in range(3):
        event = {
            "body": json.dumps({
                "email": f"parent{i}@example.com",
                "password": "SecurePass123!",
                "role": "family",
            }),
        }

        with patch("auth_handler.cognito_client") as mock_cognito:
            mock_cognito.sign_up.return_value = {"UserSub": f"user-{i}"}

            response = post_signup(event, lambda_context)
            body = json.loads(response["body"])
            invite_codes.add(body["data"]["invite_code"])
            family_ids.add(body["data"]["family_id"])

    # All invite codes should be unique
    assert len(invite_codes) == 3, f"Expected 3 unique codes, got {len(invite_codes)}"

    # All family IDs should be unique
    assert len(family_ids) == 3, f"Expected 3 unique family IDs, got {len(family_ids)}"

    # All invite codes should be 6 chars alphanumeric
    for code in invite_codes:
        assert len(code) == 6, f"Code {code} should be 6 chars, got {len(code)}"
        assert code.isalnum(), f"Code {code} should be alphanumeric"

    print(f"\n✅ Generated {len(invite_codes)} unique invite codes")
    print(f"✅ Generated {len(family_ids)} unique family IDs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
