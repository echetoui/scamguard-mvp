"""
Comprehensive unit tests for Phase 5A Family Protection role feature.
Tests each functionality individually with edge cases.
"""

import json
import pytest
from unittest.mock import patch, MagicMock
import sys
import os

# Setup AWS credentials
os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

# Add lambda directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../lambda'))


class TestRoleValidation:
    """Test role validation functionality."""

    def test_role_accepts_family(self):
        """Feature: Accept 'family' role"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-1"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert body["data"]["role"] == "family"
                assert response["statusCode"] == 201

    def test_role_accepts_senior(self):
        """Feature: Accept 'senior' role"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-2"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "senior",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert body["data"]["role"] == "senior"

    def test_role_accepts_individual(self):
        """Feature: Accept 'individual' role"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-3"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "individual",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert body["data"]["role"] == "individual"

    def test_role_defaults_to_individual_when_missing(self):
        """Feature: Default to 'individual' when role missing"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-4"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert body["data"]["role"] == "individual"

    def test_role_defaults_to_individual_when_invalid(self):
        """Feature: Default to 'individual' when role invalid"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-5"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "admin",  # Invalid
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert body["data"]["role"] == "individual"

    def test_role_case_insensitive(self):
        """Feature: Role is case-insensitive"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-6"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "FAMILY",  # Uppercase
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert body["data"]["role"] == "family"


class TestInviteCodeGeneration:
    """Test invite code generation for family role."""

    def test_invite_code_generated_for_family(self):
        """Feature: Generate invite code for family role"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-7"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert "invite_code" in body["data"]
                assert body["data"]["invite_code"] is not None

    def test_invite_code_not_generated_for_senior(self):
        """Feature: No invite code for senior role"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-8"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "senior",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert "invite_code" not in body["data"]

    def test_invite_code_format_is_6_chars(self):
        """Feature: Invite code is exactly 6 characters"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-9"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                code = body["data"]["invite_code"]
                assert len(code) == 6

    def test_invite_code_is_alphanumeric(self):
        """Feature: Invite code contains only letters and digits"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-10"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                code = body["data"]["invite_code"]
                assert code.isalnum()

    def test_invite_code_uppercase_only(self):
        """Feature: Invite code uses uppercase letters"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-11"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                code = body["data"]["invite_code"]
                # Check that letters are uppercase
                for char in code:
                    if char.isalpha():
                        assert char.isupper()

    def test_invite_codes_are_unique(self):
        """Feature: Each family gets a unique invite code"""
        from auth_handler import post_signup

        codes = set()

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                for i in range(10):
                    mock_cognito.sign_up.return_value = {"UserSub": f"user-{i}"}

                    response = post_signup({
                        "body": json.dumps({
                            "email": f"test{i}@example.com",
                            "password": "SecurePass123!",
                            "role": "family",
                        })
                    }, MagicMock())

                    body = json.loads(response["body"])
                    codes.add(body["data"]["invite_code"])

        assert len(codes) == 10, f"Expected 10 unique codes, got {len(codes)}"


class TestFamilyIDGeneration:
    """Test family ID generation for family role."""

    def test_family_id_generated_for_family_role(self):
        """Feature: Generate family ID for family role"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-12"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert "family_id" in body["data"]
                assert body["data"]["family_id"] is not None

    def test_family_id_not_generated_for_senior(self):
        """Feature: No family ID for senior role"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-13"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "senior",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert "family_id" not in body["data"]

    def test_family_id_is_uuid_format(self):
        """Feature: Family ID is UUID v4 format"""
        from auth_handler import post_signup
        import uuid

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-14"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                family_id = body["data"]["family_id"]

                # Verify it's a valid UUID
                try:
                    uuid.UUID(family_id)
                    assert True
                except ValueError:
                    assert False, f"Invalid UUID: {family_id}"

    def test_family_ids_are_unique(self):
        """Feature: Each family gets a unique ID"""
        from auth_handler import post_signup

        family_ids = set()

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                for i in range(5):
                    mock_cognito.sign_up.return_value = {"UserSub": f"user-{i}"}

                    response = post_signup({
                        "body": json.dumps({
                            "email": f"test{i}@example.com",
                            "password": "SecurePass123!",
                            "role": "family",
                        })
                    }, MagicMock())

                    body = json.loads(response["body"])
                    family_ids.add(body["data"]["family_id"])

        assert len(family_ids) == 5


class TestRoleStorageInDynamoDB:
    """Test that role is stored correctly in DynamoDB."""

    def test_role_stored_in_profile_for_family(self):
        """Feature: Role stored in USER PROFILE for family"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table") as mock_table:
                mock_cognito.sign_up.return_value = {"UserSub": "user-15"}

                post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                # Check that put_item was called with role='family'
                calls = mock_table.put_item.call_args_list
                profile_call = [c for c in calls if "PROFILE" in str(c)]
                assert len(profile_call) > 0

                profile_item = profile_call[0][1]["Item"]
                assert profile_item["role"] == "family"

    def test_role_stored_in_profile_for_senior(self):
        """Feature: Role stored in USER PROFILE for senior"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table") as mock_table:
                mock_cognito.sign_up.return_value = {"UserSub": "user-16"}

                post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "senior",
                    })
                }, MagicMock())

                calls = mock_table.put_item.call_args_list
                profile_call = [c for c in calls if "PROFILE" in str(c)]

                profile_item = profile_call[0][1]["Item"]
                assert profile_item["role"] == "senior"


class TestFamilyRecordsCreation:
    """Test that FAMILY records are created correctly."""

    def test_three_records_created_for_family_role(self):
        """Feature: Create 3 DynamoDB records for family role"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table") as mock_table:
                mock_cognito.sign_up.return_value = {"UserSub": "user-17"}

                post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                # Should be 3 put_item calls: FAMILY METADATA, FAMILY MEMBER, USER PROFILE
                assert mock_table.put_item.call_count == 3

    def test_one_record_created_for_senior_role(self):
        """Feature: Create only 1 record (PROFILE) for senior role"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table") as mock_table:
                mock_cognito.sign_up.return_value = {"UserSub": "user-18"}

                post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "senior",
                    })
                }, MagicMock())

                assert mock_table.put_item.call_count == 1

    def test_family_metadata_record_structure(self):
        """Feature: FAMILY METADATA record has all required fields"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table") as mock_table:
                mock_cognito.sign_up.return_value = {"UserSub": "user-19"}

                post_signup({
                    "body": json.dumps({
                        "email": "testuser@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                calls = mock_table.put_item.call_args_list
                metadata_call = [c for c in calls if "METADATA" in str(c)]
                metadata = metadata_call[0][1]["Item"]

                assert "PK" in metadata
                assert metadata["PK"].startswith("FAMILY#")
                assert metadata["SK"] == "METADATA"
                assert metadata["family_name"] == "Family of testuser"
                assert metadata["created_by"] == "user-19"
                assert "invite_code" in metadata
                assert "created_at" in metadata

    def test_family_member_record_structure(self):
        """Feature: FAMILY MEMBER record has all required fields"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table") as mock_table:
                mock_cognito.sign_up.return_value = {"UserSub": "user-20"}

                post_signup({
                    "body": json.dumps({
                        "email": "member@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                calls = mock_table.put_item.call_args_list
                member_call = [c for c in calls if "MEMBER#" in str(c)]
                member = member_call[0][1]["Item"]

                assert member["PK"].startswith("FAMILY#")
                assert member["SK"] == "MEMBER#user-20"
                assert member["email"] == "member@example.com"
                assert member["role"] == "family"
                assert "joined_at" in member
                assert "last_active" in member


class TestErrorHandling:
    """Test error handling for role feature."""

    def test_invalid_email_returns_400(self):
        """Feature: Invalid email returns 400 error"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            response = post_signup({
                "body": json.dumps({
                    "email": "invalid-email",
                    "password": "SecurePass123!",
                    "role": "family",
                })
            }, MagicMock())

            assert response["statusCode"] == 400
            body = json.loads(response["body"])
            assert body["error"]["code"] == "INVALID_EMAIL"

    def test_weak_password_returns_400(self):
        """Feature: Weak password returns 400 error"""
        from auth_handler import post_signup

        response = post_signup({
            "body": json.dumps({
                "email": "test@example.com",
                "password": "weak",
                "role": "family",
            })
        }, MagicMock())

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"]["code"] == "WEAK_PASSWORD"

    def test_cognito_username_exists_error(self):
        """Feature: Handle Cognito UsernameExistsException"""
        from auth_handler import post_signup
        from botocore.exceptions import ClientError

        with patch("auth_handler.cognito_client") as mock_cognito:
            error = ClientError(
                {"Error": {"Code": "UsernameExistsException"}},
                "SignUp"
            )
            mock_cognito.sign_up.side_effect = error

            response = post_signup({
                "body": json.dumps({
                    "email": "existing@example.com",
                    "password": "SecurePass123!",
                    "role": "family",
                })
            }, MagicMock())

            assert response["statusCode"] == 400
            body = json.loads(response["body"])
            assert body["error"]["code"] == "EMAIL_EXISTS"


class TestResponseFormat:
    """Test that API responses are correctly formatted."""

    def test_family_response_includes_all_fields(self):
        """Feature: Family signup response includes role, family_id, invite_code"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-21"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert "data" in body
                assert "user_id" in body["data"]
                assert "status" in body["data"]
                assert "message" in body["data"]
                assert "role" in body["data"]
                assert "family_id" in body["data"]
                assert "invite_code" in body["data"]

    def test_senior_response_excludes_family_fields(self):
        """Feature: Senior signup response excludes family_id, invite_code"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-22"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "senior",
                    })
                }, MagicMock())

                body = json.loads(response["body"])
                assert "role" in body["data"]
                assert "family_id" not in body["data"]
                assert "invite_code" not in body["data"]

    def test_response_status_code_201_for_success(self):
        """Feature: Successful signup returns 201 status code"""
        from auth_handler import post_signup

        with patch("auth_handler.cognito_client") as mock_cognito:
            with patch("auth_handler.table"):
                mock_cognito.sign_up.return_value = {"UserSub": "user-23"}

                response = post_signup({
                    "body": json.dumps({
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "role": "family",
                    })
                }, MagicMock())

                assert response["statusCode"] == 201


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
