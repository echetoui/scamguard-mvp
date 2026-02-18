"""
ScamGuard Lambda Handler with LLM Integration
Handles scam detection and scenario generation using OpenAI/Gemini APIs
"""

import json
import os
import boto3
import requests
from datetime import datetime

# Initialize AWS SDK
secrets_client = boto3.client('secretsmanager', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Import anonymization utilities
from utils.anonymization import anonymize_item, get_anonymization_manager

# Get API keys from Secrets Manager
def get_secret(secret_id):
    try:
        response = secrets_client.get_secret_value(SecretId=secret_id)
        return response.get('SecretString', '')
    except Exception as e:
        print(f"Error getting secret {secret_id}: {e}")
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
        api_key = get_secret('scamguard/openai-key')
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
        api_key = get_secret('scamguard/gemini-key')
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

def lambda_handler(event, context):
    """Main Lambda handler"""
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

            # Try LLM services in order
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

            # Store in DynamoDB with anonymization and TTL
            try:
                table = dynamodb.Table(os.environ.get('TABLE_NAME', 'ScamGuardStack-DataTable447BC44E-1BID2SBGQEELH'))

                # Create item with user ID and analysis
                item = {
                    'userId': body.get('userId', 'anonymous'),
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'analysis': result
                }

                # Anonymize the item (hash user ID, add TTL)
                anonymized_item = anonymize_item(item)

                # Store anonymized item in DynamoDB
                table.put_item(Item=anonymized_item)

                print(f"Item stored: hashedUserId={anonymized_item.get('hashedUserId')[:16]}..., expirationTime={anonymized_item.get('expirationTime')}")
            except Exception as e:
                print(f"DynamoDB error: {e}")

            return {
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
            }

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

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'data': scenario
                })
            }

        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid action'})
            }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

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
