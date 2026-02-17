"""Main Lambda handler for ScamGuard API."""

import json
import os
import logging
import uuid
from datetime import datetime
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK
patch_all()

from agents import (
    ScenarioAgentWithCompliance,
    DetectionAgentWithCompliance,
    CoachingAgentWithCompliance,
    AnalyticsAgentWithCompliance,
)
from utils.performance import monitor_performance, timeout_guard
from utils.errors import ScamGuardError

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# AWS Clients
dynamodb = boto3.resource("dynamodb")
s3_client = boto3.client("s3")
secrets_client = boto3.client("secretsmanager")

# Table reference
table = dynamodb.Table(os.environ.get("DYNAMODB_TABLE", "ScamGuardData"))

# Agents (initialized lazily)
scenario_agent = None
detection_agent = None
coaching_agent = None
analytics_agent = None


def get_secrets(secret_name: str) -> dict:
    """Retrieve secrets from Secrets Manager."""
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        return json.loads(response["SecretString"])
    except Exception as e:
        logger.error(f"Failed to retrieve secret {secret_name}: {str(e)}")
        raise


def init_agents():
    """Initialize AI agents with compliance (lazy loading)."""
    global scenario_agent, detection_agent, coaching_agent, analytics_agent

    if scenario_agent is None:
        secrets = get_secrets("scamguard/gemini-key")
        scenario_agent = ScenarioAgentWithCompliance(secrets["api_key"])

    if detection_agent is None:
        secrets = get_secrets("scamguard/openai-key")
        detection_agent = DetectionAgentWithCompliance(secrets["api_key"])

    if coaching_agent is None:
        secrets = get_secrets("scamguard/openai-key")
        coaching_agent = CoachingAgentWithCompliance(secrets["api_key"])

    if analytics_agent is None:
        analytics_agent = AnalyticsAgentWithCompliance(table)


def standardize_response(data: dict, request_id: str, trace_id: str) -> dict:
    """Standardize API response format."""
    return {
        "data": data,
        "meta": {
            "request_id": request_id,
            "processed_at": datetime.utcnow().isoformat() + "Z",
            "trace_id": trace_id,
        },
    }


def error_response(
    code: str, message: str, details: str, status_code: int, request_id: str, trace_id: str
) -> tuple:
    """Standardize error response."""
    return (
        status_code,
        {
            "error": {
                "code": code,
                "message": message,
                "details": details,
                "trace_id": trace_id,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            },
            "meta": {
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            },
        },
    )


@monitor_performance
@timeout_guard(60)
@xray_recorder.capture("post_scenarios")
def post_scenarios(event, context):
    """POST /api/v1/scenarios - Generate learning scenario."""
    request_id = event.get("headers", {}).get("X-Request-ID", str(uuid.uuid4()))
    trace_id = context.aws_request_id
    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

    try:
        init_agents()
        xray_recorder.put_annotation("user_id", user_id)

        body = json.loads(event.get("body", "{}"))
        difficulty = body.get("difficulty", "medium")

        # Validate difficulty
        if difficulty not in ["easy", "medium", "hard"]:
            status, err = error_response(
                "INVALID_DIFFICULTY",
                "Difficulty must be easy, medium, or hard",
                f"Got: {difficulty}",
                400,
                request_id,
                trace_id,
            )
            return {"statusCode": status, "body": json.dumps(err)}

        # Generate scenario with compliance checks
        scenario = scenario_agent.generate_compliant(difficulty, user_id)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id,
                "X-Trace-ID": trace_id,
            },
            "body": json.dumps(standardize_response(scenario, request_id, trace_id)),
        }

    except Exception as e:
        logger.error(f"Scenario generation failed: {str(e)}", exc_info=True)
        status, err = error_response(
            "SCENARIO_GENERATION_FAILED",
            "Failed to generate scenario",
            str(e),
            500,
            request_id,
            trace_id,
        )
        return {"statusCode": status, "body": json.dumps(err)}


@monitor_performance
@timeout_guard(60)
@xray_recorder.capture("post_analysis")
def post_analysis(event, context):
    """POST /api/v1/analysis - Analyze message/image."""
    request_id = event.get("headers", {}).get("X-Request-ID", str(uuid.uuid4()))
    trace_id = context.aws_request_id
    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

    try:
        init_agents()
        xray_recorder.put_annotation("user_id", user_id)

        body = json.loads(event.get("body", "{}"))
        image_url = body.get("image_url")
        message = body.get("message")

        if not image_url and not message:
            status, err = error_response(
                "MISSING_DATA",
                "Either image_url or message is required",
                "Neither provided",
                400,
                request_id,
                trace_id,
            )
            return {"statusCode": status, "body": json.dumps(err)}

        # Run detection with compliance checks
        detection_result = detection_agent.analyze_image_compliant(image_url, message, user_id)

        # Get coaching with compliance checks
        coaching = coaching_agent.generate_coaching_compliant(
            detection_result["risk_level"],
            detection_result["indicators"],
            detection_result["explanation"],
            user_id,
        )

        # Update analytics with compliance checks
        analytics_agent.update_analytics_compliant(user_id, detection_result)

        # Store session
        session_id = str(uuid.uuid4())
        table.put_item(
            Item={
                "PK": f"USER#{user_id}",
                "SK": f"SESSION#{session_id}",
                "timestamp": datetime.utcnow().isoformat(),
                "image_url": image_url,
                "message": message,
                "detection": detection_result,
                "coaching": coaching,
                "ttl": int(datetime.utcnow().timestamp()) + (7 * 24 * 60 * 60),  # 7 days
            }
        )

        result = {
            "session_id": session_id,
            "detection": detection_result,
            "coaching": coaching,
        }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id,
                "X-Trace-ID": trace_id,
            },
            "body": json.dumps(standardize_response(result, request_id, trace_id)),
        }

    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}", exc_info=True)
        status, err = error_response(
            "ANALYSIS_FAILED",
            "Failed to analyze message",
            str(e),
            500,
            request_id,
            trace_id,
        )
        return {"statusCode": status, "body": json.dumps(err)}


@monitor_performance
@timeout_guard(60)
@xray_recorder.capture("get_profile")
def get_profile(event, context):
    """GET /api/v1/profile - Get user profile."""
    request_id = event.get("headers", {}).get("X-Request-ID", str(uuid.uuid4()))
    trace_id = context.aws_request_id
    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

    try:
        response = table.get_item(Key={"PK": f"USER#{user_id}", "SK": "PROFILE"})

        profile = response.get("Item", {})

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id,
                "X-Trace-ID": trace_id,
            },
            "body": json.dumps(standardize_response(profile, request_id, trace_id)),
        }

    except Exception as e:
        logger.error(f"Profile retrieval failed: {str(e)}", exc_info=True)
        status, err = error_response(
            "PROFILE_RETRIEVAL_FAILED",
            "Failed to retrieve profile",
            str(e),
            500,
            request_id,
            trace_id,
        )
        return {"statusCode": status, "body": json.dumps(err)}


@monitor_performance
@timeout_guard(60)
@xray_recorder.capture("get_analytics")
def get_analytics(event, context):
    """GET /api/v1/analytics/summary - Get user analytics."""
    request_id = event.get("headers", {}).get("X-Request-ID", str(uuid.uuid4()))
    trace_id = context.aws_request_id
    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

    try:
        init_agents()
        analytics = analytics_agent.get_user_analytics_compliant(user_id)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id,
                "X-Trace-ID": trace_id,
            },
            "body": json.dumps(standardize_response(analytics, request_id, trace_id)),
        }

    except Exception as e:
        logger.error(f"Analytics retrieval failed: {str(e)}", exc_info=True)
        status, err = error_response(
            "ANALYTICS_FAILED",
            "Failed to retrieve analytics",
            str(e),
            500,
            request_id,
            trace_id,
        )
        return {"statusCode": status, "body": json.dumps(err)}


def lambda_handler(event, context):
    """Route requests to appropriate handler."""
    path = event.get("rawPath", "")
    method = event.get("requestContext", {}).get("http", {}).get("method", "")

    logger.info(f"Request: {method} {path}")

    if method == "POST" and path == "/api/v1/scenarios":
        return post_scenarios(event, context)
    elif method == "POST" and path == "/api/v1/analysis":
        return post_analysis(event, context)
    elif method == "GET" and path == "/api/v1/profile":
        return get_profile(event, context)
    elif method == "GET" and path == "/api/v1/analytics/summary":
        return get_analytics(event, context)
    else:
        return {
            "statusCode": 404,
            "body": json.dumps({"error": "Not found"}),
        }
