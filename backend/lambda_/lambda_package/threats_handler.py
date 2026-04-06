"""
Threats Handler - Lambda function for threat management APIs
Phase 2 Sprint 5 - SMS Simulation & Real Threats

Endpoints:
- GET /api/threats - List all threats with optional filtering
- GET /api/threats/{threat_id} - Get specific threat details
- POST /api/threats/match - Find threats matching user profile
- GET /api/threats/feed - Get weekly digest threats
"""

import json
import os
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Any, List, Optional

import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
threats_table = dynamodb.Table(os.environ.get('THREATS_TABLE', 'threats'))
user_threats_table = dynamodb.Table(os.environ.get('USER_THREATS_TABLE', 'user_threats'))

# CORS headers
CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': os.environ.get('ALLOWED_ORIGIN', '*'),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for threats APIs
    """
    try:
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '')
        
        logger.info(f"Threats Handler: {http_method} {path}")
        
        # Route to appropriate handler
        if '/threats/match' in path and http_method == 'POST':
            return handle_threat_match(event)
        elif '/threats/feed' in path and http_method == 'GET':
            return handle_threat_feed(event)
        elif '/threats/' in path and http_method == 'GET':
            # Extract threat_id from path
            threat_id = path.split('/threats/')[-1]
            return handle_get_threat(threat_id)
        elif '/threats' in path and http_method == 'GET':
            return handle_list_threats(event)
        elif http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': ''
            }
        else:
            return error_response('Not Found', 404)
    
    except Exception as e:
        logger.exception(f"Error in threats_handler: {str(e)}")
        return error_response(f'Internal Server Error: {str(e)}', 500)


def handle_list_threats(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    GET /api/threats
    List all threats with optional filtering
    
    Query parameters:
    - threat_level: 'high' | 'medium' | 'low'
    - institution: filter by institution
    - limit: max results (default 100)
    - offset: pagination offset (default 0)
    """
    try:
        query_params = event.get('queryStringParameters') or {}
        
        threat_level = query_params.get('threat_level')
        institution = query_params.get('institution')
        limit = int(query_params.get('limit', '100'))
        offset = int(query_params.get('offset', '0'))
        
        # Query based on filters
        if threat_level:
            # Use GSI for threat_level
            response = threats_table.query(
                IndexName='threat_level_index',
                KeyConditionExpression='threat_level = :level',
                ExpressionAttributeValues={':level': threat_level},
                ScanIndexForward=False,  # Most recent first
                Limit=limit + offset
            )
        elif institution:
            # Use GSI for institution
            response = threats_table.query(
                IndexName='institution_index',
                KeyConditionExpression='institution = :inst',
                ExpressionAttributeValues={':inst': institution},
                ScanIndexForward=False,
                Limit=limit + offset
            )
        else:
            # Scan all threats
            response = threats_table.scan(
                Limit=limit + offset
            )
        
        items = response.get('Items', [])
        threats = [convert_decimal(item) for item in items[offset:offset+limit]]
        
        return success_response({
            'threats': threats,
            'count': len(threats),
            'total': response.get('Count', 0),
            'limit': limit,
            'offset': offset
        })
    
    except Exception as e:
        logger.error(f"Error listing threats: {str(e)}")
        return error_response(f'Failed to list threats: {str(e)}', 500)


def handle_get_threat(threat_id: str) -> Dict[str, Any]:
    """
    GET /api/threats/{threat_id}
    Get specific threat details
    """
    try:
        if not threat_id or threat_id == 'threats':
            return error_response('Invalid threat ID', 400)
        
        # Query requires both PK and SK range
        # For simplicity, use scan with filter
        response = threats_table.scan(
            FilterExpression='threat_id = :id',
            ExpressionAttributeValues={':id': threat_id},
            Limit=1
        )
        
        items = response.get('Items', [])
        if not items:
            return error_response('Threat not found', 404)
        
        threat = convert_decimal(items[0])
        return success_response({'threat': threat})
    
    except Exception as e:
        logger.error(f"Error getting threat: {str(e)}")
        return error_response(f'Failed to get threat: {str(e)}', 500)


def handle_threat_match(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    POST /api/threats/match
    Find threats matching user profile
    
    Body:
    {
        "user_id": "user@example.com",
        "institutions": ["Desjardins", "TD"],
        "regions": ["Montreal", "Quebec City"]
    }
    """
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        institutions = body.get('institutions', [])
        regions = body.get('regions', [])
        
        if not user_id:
            return error_response('Missing user_id', 400)
        
        if not institutions:
            return error_response('Missing institutions', 400)
        
        # Find threats matching user profile
        matched_threats = []
        
        for institution in institutions:
            response = threats_table.query(
                IndexName='institution_index',
                KeyConditionExpression='institution = :inst',
                ExpressionAttributeValues={':inst': institution},
                ScanIndexForward=False
            )
            
            items = response.get('Items', [])
            for item in items:
                threat = convert_decimal(item)
                
                # Check region match if specified
                if regions:
                    threat_regions = threat.get('regions', [])
                    if not any(r in threat_regions for r in regions):
                        continue
                
                matched_threats.append(threat)
        
        # Store matched threats for user
        for threat in matched_threats:
            try:
                user_threats_table.put_item(
                    Item={
                        'user_id': user_id,
                        'threat_id': threat['threat_id'],
                        'matched_at': datetime.utcnow().isoformat() + 'Z',
                        'notification_sent': False,
                        'user_saw_notification': False,
                        'threat_level': threat.get('threat_level'),
                        'institution': threat.get('institution')
                    }
                )
            except ClientError as e:
                logger.warning(f"Failed to store user threat: {str(e)}")
        
        return success_response({
            'user_id': user_id,
            'matched_threats': matched_threats,
            'count': len(matched_threats)
        })
    
    except json.JSONDecodeError:
        return error_response('Invalid JSON body', 400)
    except Exception as e:
        logger.error(f"Error matching threats: {str(e)}")
        return error_response(f'Failed to match threats: {str(e)}', 500)


def handle_threat_feed(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    GET /api/threats/feed
    Get threats from past 7 days for weekly digest
    
    Query parameters:
    - user_id: filter to user's matched threats
    """
    try:
        query_params = event.get('queryStringParameters') or {}
        user_id = query_params.get('user_id')
        
        seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat() + 'Z'
        
        if user_id:
            # Get user's matched threats from past 7 days
            response = user_threats_table.query(
                IndexName='user_date_index',
                KeyConditionExpression='user_id = :uid AND matched_at > :date',
                ExpressionAttributeValues={
                    ':uid': user_id,
                    ':date': seven_days_ago
                },
                ScanIndexForward=False  # Most recent first
            )
            
            user_matched = response.get('Items', [])
            threats = [convert_decimal(item) for item in user_matched]
        
        else:
            # Get all threats from past 7 days
            response = threats_table.scan(
                FilterExpression='date_detected > :date',
                ExpressionAttributeValues={':date': seven_days_ago}
            )
            
            items = response.get('Items', [])
            threats = [convert_decimal(item) for item in items]
        
        # Calculate statistics
        by_level = {
            'high': len([t for t in threats if t.get('threat_level') == 'high']),
            'medium': len([t for t in threats if t.get('threat_level') == 'medium']),
            'low': len([t for t in threats if t.get('threat_level') == 'low'])
        }
        
        by_type = {}
        for threat in threats:
            threat_type = threat.get('type', 'Unknown')
            by_type[threat_type] = by_type.get(threat_type, 0) + 1
        
        return success_response({
            'threats': threats[:10],  # Return top 10
            'total_count': len(threats),
            'statistics': {
                'by_level': by_level,
                'by_type': by_type
            },
            'period': 'last_7_days'
        })
    
    except Exception as e:
        logger.error(f"Error getting threat feed: {str(e)}")
        return error_response(f'Failed to get threat feed: {str(e)}', 500)


def convert_decimal(obj: Any) -> Any:
    """
    Convert DynamoDB Decimal to float for JSON serialization
    """
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj) if obj % 1 else int(obj)
    return obj


def success_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Return successful API response
    """
    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps(data)
    }


def error_response(message: str, status_code: int) -> Dict[str, Any]:
    """
    Return error API response
    """
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps({'error': message})
    }
