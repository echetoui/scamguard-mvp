"""Family Protection handler for managing family groups, members, and shared threats."""

import json
import os
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
import base64

# Initialize AWS clients
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("DYNAMODB_TABLE", "ScamGuardData-dev"))
cognito_client = boto3.client("cognito-idp")


def error_response(status_code, error_code, message):
    """Return standardized error response."""
    return {
        "statusCode": status_code,
        "body": json.dumps({
            "error": {
                "code": error_code,
                "message": message,
            }
        }),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    }


def success_response(status_code, data):
    """Return standardized success response."""
    return {
        "statusCode": status_code,
        "body": json.dumps({
            "data": data
        }),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    }


def extract_user_id(event):
    """Extract user ID from Cognito token in Authorization header."""
    try:
        auth_header = event.get("headers", {}).get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header[7:]  # Remove "Bearer " prefix

        # Decode the token (JWT structure: header.payload.signature)
        # For now, just extract from the payload
        parts = token.split('.')
        if len(parts) != 3:
            return None

        # Decode payload (second part)
        payload = parts[1]
        # Add padding if needed
        padding = 4 - (len(payload) % 4)
        if padding != 4:
            payload += '=' * padding

        decoded = base64.urlsafe_b64decode(payload)
        payload_data = json.loads(decoded)

        # Get user ID from 'sub' claim (standard JWT subject claim)
        return payload_data.get('sub')
    except Exception as e:
        print(f"Error extracting user ID: {e}")
        return None


def get_user_profile(user_id):
    """Get user profile from DynamoDB."""
    try:
        response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": "PROFILE"
            }
        )
        return response.get("Item", {})
    except ClientError as e:
        print(f"Error getting user profile: {e}")
        return {}


def get_family_data(family_id):
    """Get family metadata and members."""
    try:
        # Get family metadata
        response = table.get_item(
            Key={
                "PK": f"FAMILY#{family_id}",
                "SK": "METADATA"
            }
        )
        family_metadata = response.get("Item", {})

        # Query all family members
        members_response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
            ExpressionAttributeValues={
                ":pk": f"FAMILY#{family_id}",
                ":sk_prefix": "MEMBER#"
            }
        )

        members = []
        for item in members_response.get("Items", []):
            members.append({
                "email": item.get("email"),
                "role": item.get("role"),
                "joinedAt": item.get("joinedAt"),
                "lastActive": item.get("lastActive")
            })

        # Query recent threats (limit to last 10)
        threats_response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
            ExpressionAttributeValues={
                ":pk": f"FAMILY#{family_id}",
                ":sk_prefix": "THREAT#"
            },
            ScanIndexForward=False,  # Descending order (most recent first)
            Limit=10
        )

        threats = []
        for item in threats_response.get("Items", []):
            threats.append({
                "scamType": item.get("scamType"),
                "severity": item.get("severity"),
                "content": item.get("content"),
                "reportedBy": item.get("reportedBy"),
                "reportedAt": item.get("reportedAt")
            })

        return {
            "familyName": family_metadata.get("familyName", "Ma Famille"),
            "inviteCode": family_metadata.get("inviteCode", ""),
            "members": members,
            "threats": threats
        }
    except ClientError as e:
        print(f"Error getting family data: {e}")
        return None


def get_family_dashboard(event, context):
    """
    GET /api/v1/family/dashboard

    Returns family members and recent threats.
    Requires Bearer token authentication.
    """
    user_id = extract_user_id(event)
    if not user_id:
        return error_response(401, "INVALID_TOKEN", "Invalid or missing authorization token")

    # Get user profile to find familyId
    user_profile = get_user_profile(user_id)
    family_id = user_profile.get("familyId")

    if not family_id:
        # User doesn't have a family yet
        return error_response(404, "NO_FAMILY", "User does not belong to a family")

    # Get family data
    family_data = get_family_data(family_id)
    if not family_data:
        return error_response(500, "FAMILY_ERROR", "Failed to retrieve family data")

    return success_response(200, family_data)


def join_family(event, context):
    """
    POST /api/v1/family/join

    Join a family using an invite code.
    Body: { inviteCode: "ABC123" }
    """
    user_id = extract_user_id(event)
    if not user_id:
        return error_response(401, "INVALID_TOKEN", "Invalid or missing authorization token")

    try:
        # Get user profile to retrieve email
        user_profile = get_user_profile(user_id)
        if not user_profile:
            return error_response(404, "USER_NOT_FOUND", "User profile not found")

        user_email = user_profile.get("email", "unknown")

        body = json.loads(event.get("body", "{}"))
        invite_code = body.get("inviteCode", "").strip().upper()

        if not invite_code:
            return error_response(400, "MISSING_CODE", "Invite code is required")

        # Find family by invite code
        # Query for family with matching invite code
        response = table.scan(
            FilterExpression="attribute_exists(inviteCode) AND inviteCode = :code",
            ExpressionAttributeValues={
                ":code": invite_code
            }
        )

        family_items = [item for item in response.get("Items", []) if item.get("SK") == "METADATA"]
        if not family_items:
            return error_response(404, "INVALID_CODE", "Invite code not found")

        family_metadata = family_items[0]
        family_id = family_metadata.get("PK", "").replace("FAMILY#", "")

        # Add user as family member
        now = datetime.utcnow().isoformat() + "Z"

        table.put_item(
            Item={
                "PK": f"FAMILY#{family_id}",
                "SK": f"MEMBER#{user_id}",
                "email": user_email,
                "role": "senior",  # Joining user is a senior by default
                "joinedAt": now,
                "lastActive": now
            }
        )

        # Update user profile with familyId
        user_profile["familyId"] = family_id
        user_profile["PK"] = f"USER#{user_id}"
        user_profile["SK"] = "PROFILE"

        table.put_item(Item=user_profile)

        return success_response(200, {
            "message": "Successfully joined family",
            "familyId": family_id,
            "familyName": family_metadata.get("familyName")
        })

    except json.JSONDecodeError:
        return error_response(400, "INVALID_JSON", "Invalid request body")
    except ClientError as e:
        print(f"Error joining family: {e}")
        return error_response(500, "DB_ERROR", "Failed to join family")


def lambda_handler(event, context):
    """Main Lambda handler for family endpoints."""

    path = event.get("path", "")
    method = event.get("httpMethod", "")

    # Handle CORS preflight
    if method == "OPTIONS":
        return success_response(200, {})

    # Route to appropriate handler
    if path == "/api/v1/family/dashboard" and method == "GET":
        return get_family_dashboard(event, context)

    elif path == "/api/v1/family/join" and method == "POST":
        return join_family(event, context)

    else:
        return error_response(404, "NOT_FOUND", f"Endpoint {method} {path} not found")
