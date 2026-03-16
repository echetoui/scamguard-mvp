"""
ScamGuard Lambda Handler with LLM Integration
Handles scam detection and scenario generation using OpenAI/Gemini APIs
"""

import json
import os
import boto3
import requests
from datetime import datetime
import uuid

# Initialize AWS SDK
ssm_client = boto3.client('ssm', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Import anonymization utilities
from .utils.anonymization import anonymize_item, get_anonymization_manager

# Import Quebec expert prompt
try:
    from .prompts import get_quebec_expert_prompt
except ImportError:
    # Fallback if prompt module not available
    def get_quebec_expert_prompt():
        return "Tu es un expert en cybersécurité spécialisé dans la détection d'arnaque au Québec."

# Get API keys from SSM Parameter Store
def get_parameter(param_name):
    try:
        response = ssm_client.get_parameter(Name=param_name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        print(f"Error getting parameter {param_name}: {e}")
        return None

# Scam keywords for fallback detection
SCAM_KEYWORDS = [
    'cliquer', 'verifier', 'confirmer', 'compte suspendu', 'action requise',
    'compte bloque', 'paiement', 'urgent', 'immediatement', 'risque',
    'banque', 'paypal', 'amazon', 'apple', 'microsoft', 'google',
    'gratuit', 'prix', 'gagner', 'prix', 'concours', 'lot',
    'identifiant', 'mot de passe', 'pin', 'code', 'secret',
    'heritage', 'million', 'riche', 'prince', 'transfert'
]

def detect_scam_keywords(text):
    """Simple keyword-based scam detection"""
    text_lower = text.lower()
    found_keywords = []
    for keyword in SCAM_KEYWORDS:
        if keyword in text_lower:
            found_keywords.append(keyword)
    return found_keywords

def analyze_with_openai(text):
    """Analyze text using OpenAI API"""
    try:
        api_key = get_parameter(os.environ.get('OPENAI_PARAM_NAME', '/scamguard/openai-key'))
        if not api_key:
            return None

        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={'Authorization': f'Bearer {api_key}'},
            json={
                'model': 'gpt-3.5-turbo',
                'messages': [{
                    'role': 'user',
                    'content': f'''Analyze this text for scam indicators.
                    Respond ONLY with JSON (no markdown):
                    {{"risk_score": 0-100, "is_scam": true/false, "explanation": "brief reason"}}

                    Text: {text}'''
                }],
                'temperature': 0.3,
                'max_tokens': 200
            }
        )

        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content'].strip()
            # Remove markdown if present
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
            result = json.loads(content)
            return {
                'risk_score': result.get('risk_score', 50),
                'is_scam': result.get('is_scam', False),
                'explanation': result.get('explanation', 'Unable to determine'),
                'llm_used': 'OpenAI GPT-3.5'
            }
    except Exception as e:
        print(f"OpenAI error: {e}")
        return None

def analyze_with_gemini(text):
    """Analyze text using Google Gemini API"""
    try:
        api_key = get_parameter(os.environ.get('GEMINI_PARAM_NAME', '/scamguard/gemini-key'))
        if not api_key:
            return None

        response = requests.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}',
            json={
                'contents': [{
                    'parts': [{
                        'text': f'''Analyze this text for scam indicators.
                        Respond ONLY with JSON (no markdown):
                        {{"risk_score": 0-100, "is_scam": true/false, "explanation": "brief reason"}}

                        Text: {text}'''
                    }]
                }]
            }
        )

        if response.status_code == 200:
            data = response.json()
            content = data['candidates'][0]['content']['parts'][0]['text'].strip()
            # Remove markdown if present
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
            result = json.loads(content)
            return {
                'risk_score': result.get('risk_score', 50),
                'is_scam': result.get('is_scam', False),
                'explanation': result.get('explanation', 'Unable to determine'),
                'llm_used': 'Google Gemini'
            }
    except Exception as e:
        print(f"Gemini error: {e}")
        return None

def analyze_with_quebec_expert(text):
    """
    Analyze text using Quebec cybersecurity expert prompt
    Returns enriched analysis with institution detection and local remediation
    """
    try:
        quebec_prompt = get_quebec_expert_prompt()
        api_key = get_parameter(os.environ.get('OPENAI_PARAM_NAME', '/scamguard/openai-key'))
        if not api_key:
            return None

        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={'Authorization': f'Bearer {api_key}'},
            json={
                'model': 'gpt-3.5-turbo',
                'messages': [
                    {
                        'role': 'system',
                        'content': quebec_prompt
                    },
                    {
                        'role': 'user',
                        'content': f'Analyser ce texte suspect: {text}'
                    }
                ],
                'temperature': 0.3,
                'max_tokens': 500
            }
        )

        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content'].strip()

            # Parse JSON response
            try:
                result = json.loads(content)
                result['llm_used'] = 'Quebec Expert (OpenAI)'
                return result
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract from response
                print(f"Failed to parse Quebec expert response: {content}")
                return None
    except Exception as e:
        print(f"Quebec expert analysis error: {e}")
        return None


def fallback_scam_detection(text):
    """Fallback keyword-based detection"""
    keywords = detect_scam_keywords(text)
    risk_score = len(keywords) * 15
    return {
        'risk_score': min(risk_score, 100),
        'is_scam': len(keywords) > 3,
        'explanation': f'Found {len(keywords)} scam indicators: {", ".join(keywords[:3])}',
        'llm_used': 'Keyword Detection (Fallback)'
    }

def add_cors_headers(response):
    """Add CORS headers to Lambda response"""
    if 'headers' not in response:
        response['headers'] = {}
    response['headers'].update({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    return response

def share_threat_with_family(user_id, family_id, result, user_response):
    """
    Phase 5A - Threat Sharing: Create a threat record in the family group
    Only share HIGH and CRITICAL threats (don't spam family with low-risk detections)
    """
    try:
        # Determine severity based on risk_score
        risk_score = result.get('risk_score', 50)

        if risk_score >= 75:
            severity = 'CRITICAL'
        elif risk_score >= 60:
            severity = 'HIGH'
        else:
            # Don't share LOW/MEDIUM threats
            return None

        # Create threat record
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        timestamp = datetime.utcnow().isoformat()

        threat_item = {
            'PK': f'FAMILY#{family_id}',
            'SK': f'THREAT#{timestamp}',
            'reportedBy': user_id,
            'reportedAt': timestamp,
            'scamType': 'SMS/Email Scam',  # Can be enhanced with LLM categorization
            'severity': severity,
            'content': user_response[:500],  # Store first 500 chars of message
            'riskScore': risk_score,
            'explanation': result.get('explanation', ''),
            'ttl': int(datetime.utcnow().timestamp()) + (30 * 24 * 60 * 60)  # 30 days
        }

        table.put_item(Item=threat_item)
        print(f"Threat shared with family: PK=FAMILY#{family_id}, severity={severity}")
        return threat_item

    except Exception as e:
        print(f"Error sharing threat with family: {e}")
        return None


def get_user_family_id(user_id):
    """
    Retrieve user's familyId from their profile
    Returns None if user has no family
    """
    try:
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        response = table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': 'PROFILE'
            }
        )
        user_profile = response.get('Item', {})
        return user_profile.get('familyId')
    except Exception as e:
        print(f"Error getting user family ID: {e}")
        return None


def lambda_handler(event, context):
    """Main Lambda handler"""
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'body': '',
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        }

    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event

        action = body.get('action', 'analyze')

        # Analyze action
        if action == 'analyze':
            user_response = body.get('userResponse', '')

            # Try LLM services in order (Quebec expert first for Quebec focus)
            result = analyze_with_quebec_expert(user_response)
            if not result:
                result = analyze_with_openai(user_response)
            if not result:
                result = analyze_with_gemini(user_response)
            if not result:
                result = fallback_scam_detection(user_response)

            # Add coaching feedback
            result['coaching'] = {
                'feedback': get_coaching_feedback(result),
                'xp_earned': 10 if result.get('risk_score', 50) > 60 else 5
            }

            # Store in DynamoDB with correct schema
            try:
                table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
                user_id = body.get('userId', 'anonymous')
                timestamp = datetime.utcnow().isoformat()
                analysis_id = str(uuid.uuid4())[:8]

                # Create item with PK/SK schema for DynamoDB
                item = {
                    'PK': f'USER#{user_id}',
                    'SK': f'ANALYSIS#{timestamp}#{analysis_id}',
                    'userId': user_id,
                    'timestamp': timestamp,
                    'analysis': result,
                    'ttl': int(datetime.utcnow().timestamp()) + (90 * 24 * 60 * 60)  # 90 days
                }

                # Store item in DynamoDB
                table.put_item(Item=item)

                print(f"Item stored: PK=USER#{user_id}, SK=ANALYSIS#{timestamp}#{analysis_id}")

                # Phase 5A - Share threat with family if user has a family
                family_id = get_user_family_id(user_id)
                if family_id:
                    share_threat_with_family(user_id, family_id, result, user_response)
            except Exception as e:
                print(f"DynamoDB error: {e}")

            return add_cors_headers({
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'data': {
                        'detection': {
                            'score': result.get('risk_score', 50),
                            'is_scam': result.get('is_scam', False)
                        },
                        'coaching': result['coaching'],
                        'explanation': result.get('explanation', '')
                    }
                })
            })

        # Generate scenario action
        elif action == 'generate_scenario':
            scenarios = [
                {
                    'title': 'SMS Bancaire',
                    'content': 'Cliquez ici pour vérifier votre compte bancaire. Action urgente requise.'
                },
                {
                    'title': 'Annonce Amazon',
                    'content': 'Votre compte Amazon a été suspendu. Confirmez vos informations immédiatement.'
                },
                {
                    'title': 'Email Apple',
                    'content': 'Paiement refusé sur votre compte Apple. Mettez à jour vos coordonnées bancaires.'
                }
            ]
            import random
            scenario = random.choice(scenarios)

            return add_cors_headers({
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'data': scenario
                })
            })

        # Get user profile
        elif action == 'get_profile':
            try:
                user_id = body.get('userId', 'anonymous')
                table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

                response = table.get_item(
                    Key={
                        'PK': f'USER#{user_id}',
                        'SK': 'PROFILE'
                    }
                )

                profile = response.get('Item', {})
                return add_cors_headers({
                    'statusCode': 200,
                    'body': json.dumps({
                        'success': True,
                        'data': profile
                    })
                })
            except Exception as e:
                print(f"Error getting profile: {e}")
                return add_cors_headers({
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)})
                })

        # Save/update user profile
        elif action == 'save_profile':
            try:
                user_id = body.get('userId', 'anonymous')
                table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

                profile_data = body.get('profile', {})
                profile_data['PK'] = f'USER#{user_id}'
                profile_data['SK'] = 'PROFILE'
                profile_data['updated_at'] = datetime.utcnow().isoformat()

                table.put_item(Item=profile_data)

                return add_cors_headers({
                    'statusCode': 200,
                    'body': json.dumps({
                        'success': True,
                        'data': {'message': 'Profile saved successfully'}
                    })
                })
            except Exception as e:
                print(f"Error saving profile: {e}")
                return add_cors_headers({
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)})
                })

        # Get analytics summary
        elif action == 'get_analytics':
            try:
                user_id = body.get('userId', 'anonymous')
                table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

                response = table.get_item(
                    Key={
                        'PK': f'USER#{user_id}',
                        'SK': 'ANALYSIS_SUMMARY'
                    }
                )

                analytics = response.get('Item', {})
                return add_cors_headers({
                    'statusCode': 200,
                    'body': json.dumps({
                        'success': True,
                        'data': analytics
                    })
                })
            except Exception as e:
                print(f"Error getting analytics: {e}")
                return add_cors_headers({
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)})
                })

        else:
            return add_cors_headers({
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid action'})
            })

    except Exception as e:
        print(f"Error: {e}")
        return add_cors_headers({
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        })

def get_coaching_feedback(result):
    """Generate coaching feedback based on analysis"""
    score = result.get('risk_score', 50)
    is_scam = result.get('is_scam', False)

    if is_scam:
        if score > 80:
            return "Excellente détection ! Ce message avait tous les signes d'une arnaque. Continuez comme ça !"
        else:
            return "C'était une arnaque. Méfiez-vous des messages qui demandent vos données personnelles."
    else:
        return "Ce message semble sûr. Vous faites preuve de vigilance !"
