"""
Enhanced Lambda Handler with Multi-Provider LLM Support

Uses LLM Provider Manager and Load Balancer for intelligent
request routing across Claude, OpenAI, and Gemini.

This handler replaces handler_llm.py with enhanced capabilities:
- Automatic failover
- Load balancing
- Performance tracking
- Cost optimization

Author: ScamGuard LLM Team
Date: February 18, 2026
Version: 2.0
"""

import json
import os
import boto3
import logging
from datetime import datetime

# Import new LLM modules
from llm_provider_manager import LLMProviderManager, ProviderType
from claude_integration import ClaudeIntegration, ClaudeProviderAdapter
from gemini_integration import GeminiIntegration, GeminiProviderAdapter
from llm_load_balancer import LLMLoadBalancer, LoadBalancingStrategy

# Initialize AWS SDK
secrets_client = boto3.client('secretsmanager', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize provider manager (global)
provider_manager = None
load_balancer = None


def initialize_providers():
    """Initialize LLM provider manager and integrations."""
    global provider_manager, load_balancer

    if provider_manager is not None:
        return

    logger.info("Initializing LLM provider manager...")

    # Create provider manager
    provider_manager = LLMProviderManager()

    # Initialize Claude integration
    claude_key = get_secret('scamguard/claude-key')
    if claude_key:
        claude = ClaudeProviderAdapter(claude_key)
        logger.info("Claude integration initialized")

    # Initialize Gemini integration
    gemini_key = get_secret('scamguard/gemini-key')
    if gemini_key:
        gemini = GeminiProviderAdapter(gemini_key)
        logger.info("Gemini integration initialized")

    # Create load balancer
    load_balancer = LLMLoadBalancer(provider_manager)
    load_balancer.set_strategy(LoadBalancingStrategy.PRIORITY)

    logger.info(f"Provider manager initialized with {len(provider_manager.providers)} providers")


def get_secret(secret_id):
    """Get API key from Secrets Manager."""
    try:
        response = secrets_client.get_secret_value(SecretId=secret_id)
        return response.get('SecretString', '')
    except Exception as e:
        logger.warning(f"Error getting secret {secret_id}: {e}")
        return None


def analyze_with_provider(provider_name: str, text: str) -> Dict:
    """
    Analyze text with specific provider.

    Args:
        provider_name: Name of provider to use
        text: Text to analyze

    Returns:
        Analysis result
    """
    provider_config = provider_manager.get_provider_config(provider_name)

    if not provider_config:
        return {
            'success': False,
            'error': f'Provider {provider_name} not found'
        }

    # Get API key
    api_key = get_secret(provider_config.api_key_secret)
    if not api_key:
        return {
            'success': False,
            'error': f'No API key for {provider_name}'
        }

    # Dispatch to correct provider
    try:
        if provider_config.type == ProviderType.CLAUDE:
            claude = ClaudeIntegration(api_key)
            result = claude.analyze_text(text)
        elif provider_config.type == ProviderType.GEMINI:
            gemini = GeminiIntegration(api_key)
            result = gemini.analyze_text(text)
        elif provider_config.type == ProviderType.OPENAI:
            # Use existing OpenAI handler
            result = analyze_with_openai(text, api_key)
        elif provider_config.type == ProviderType.KEYWORD:
            result = fallback_scam_detection(text)
        else:
            result = {'success': False, 'error': f'Unknown provider type'}

        # Record metrics
        latency_ms = result.get('latency_ms', 0)
        success = result.get('success', True) if 'success' in result else True
        provider_manager.record_request(
            provider=provider_name,
            success=success,
            latency_ms=latency_ms,
            error=result.get('error') if not success else None,
            data=result
        )

        return result

    except Exception as e:
        logger.error(f"Error analyzing with {provider_name}: {str(e)}")
        provider_manager.record_request(
            provider=provider_name,
            success=False,
            error=str(e)
        )
        return {
            'success': False,
            'error': str(e),
            'llm_used': provider_name
        }


def analyze_with_fallback(text: str, max_retries: int = 3) -> Dict:
    """
    Analyze text with automatic fallback.

    Args:
        text: Text to analyze
        max_retries: Max providers to try

    Returns:
        Analysis result
    """
    initialize_providers()

    excluded_providers = []
    result = None

    for attempt in range(max_retries):
        # Get best available provider
        provider = load_balancer.select_provider(exclude_providers=excluded_providers)

        if not provider:
            logger.warning(f"No providers available after {attempt} attempts")
            break

        logger.info(f"Attempt {attempt + 1}: Using provider {provider}")

        # Analyze with provider
        result = analyze_with_provider(provider, text)

        if result.get('success', True):
            logger.info(f"Analysis successful with {provider}")
            return result

        # Provider failed, try next
        excluded_providers.append(provider)

    # All providers failed
    logger.warning("All providers failed, using keyword fallback")
    return fallback_scam_detection(text)


def analyze_with_openai(text: str, api_key: str) -> Dict:
    """Analyze text using OpenAI API (existing implementation)."""
    try:
        import requests
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
            },
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content'].strip()
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
            result = json.loads(content)
            result['llm_used'] = 'GPT-3.5 (OpenAI)'
            return result
    except Exception as e:
        logger.error(f"OpenAI error: {e}")

    return {'success': False, 'error': str(e)}


def fallback_scam_detection(text: str) -> Dict:
    """Keyword-based fallback detection."""
    keywords = [
        'cliquer', 'verifier', 'confirmer', 'compte suspendu', 'action requise',
        'compte bloque', 'paiement', 'urgent', 'immediatement', 'risque',
        'banque', 'paypal', 'amazon', 'apple', 'microsoft', 'google',
        'gratuit', 'prix', 'gagner', 'concours', 'lot'
    ]

    text_lower = text.lower()
    found_keywords = [kw for kw in keywords if kw in text_lower]
    risk_score = min(len(found_keywords) * 15, 100)

    return {
        'risk_score': risk_score,
        'is_scam': len(found_keywords) > 3,
        'explanation': f'Found {len(found_keywords)} scam indicators',
        'llm_used': 'Keyword Detection (Fallback)',
        'success': True
    }


def lambda_handler(event, context):
    """Main Lambda handler with multi-provider support."""
    try:
        # Parse request
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event

        action = body.get('action', 'analyze')

        if action == 'analyze':
            text = body.get('userResponse', '')
            user_id = body.get('userId', 'anonymous')

            # Analyze with intelligent fallback
            result = analyze_with_fallback(text)

            # Store in DynamoDB
            try:
                table = dynamodb.Table(os.environ.get(
                    'TABLE_NAME',
                    'ScamGuardStack-DataTable447BC44E-1BID2SBGQEELH'
                ))

                item = {
                    'userId': user_id,
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'analysis': result
                }

                table.put_item(Item=item)
                logger.info(f"Analysis stored for user {user_id}")
            except Exception as e:
                logger.error(f"DynamoDB error: {e}")

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'data': {
                        'detection': {
                            'score': result.get('risk_score', 50),
                            'is_scam': result.get('is_scam', False)
                        },
                        'explanation': result.get('explanation', ''),
                        'llm_used': result.get('llm_used', 'Unknown')
                    }
                })
            }

        elif action == 'provider_status':
            initialize_providers()
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'providers': provider_manager.list_providers(),
                    'metrics': provider_manager.get_provider_metrics(),
                    'distribution': load_balancer.get_distribution_stats()
                })
            }

        elif action == 'compare_providers':
            initialize_providers()
            return {
                'statusCode': 200,
                'body': json.dumps(provider_manager.compare_providers())
            }

        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid action'})
            }

    except Exception as e:
        logger.error(f"Handler error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


if __name__ == '__main__':
    print("Enhanced LLM Handler")
    print("=" * 50)
    print("Multi-provider LLM support with fallback")
