"""
Claude (Anthropic) LLM Integration

Integrates Claude 3 Sonnet with ScamGuard for scam detection and analysis.
Provides feature parity with OpenAI and Gemini implementations.

Features:
- Claude 3 Sonnet API integration
- Scam detection and risk scoring
- Quebec cybersecurity expert analysis
- Fallback handling
- Request/response standardization

Author: ScamGuard Claude Integration Team
Date: February 18, 2026
Version: 1.0
"""

import logging
import json
import requests
from typing import Dict, Optional, Tuple
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ClaudeIntegration:
    """
    Claude (Anthropic) integration for scam detection.

    Provides scam analysis using Claude 3 Sonnet model with
    standardized request/response format.
    """

    # Claude API configuration
    API_ENDPOINT = "https://api.anthropic.com/v1/messages"
    MODEL = "claude-3-sonnet-20240229"
    API_VERSION = "2024-02-15"
    MAX_TOKENS = 1024
    TEMPERATURE = 0.3

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude integration.

        Args:
            api_key: Anthropic API key (or from environment)
        """
        self.api_key = api_key
        self.request_count = 0
        self.error_count = 0

        logger.info("Initialized Claude integration")

    def set_api_key(self, api_key: str):
        """Set API key."""
        self.api_key = api_key

    def analyze_text(self, text: str, context: str = None) -> Dict:
        """
        Analyze text for scam indicators using Claude.

        Args:
            text: Text to analyze
            context: Additional context (optional)

        Returns:
            Standardized analysis result
        """
        if not self.api_key:
            logger.error("No API key provided")
            return self._error_response("No API key configured")

        if not text or len(text.strip()) == 0:
            return self._error_response("Empty text provided")

        try:
            # Build prompt
            prompt = self._build_analysis_prompt(text, context)

            # Make API request
            start_time = datetime.now()
            response = self._call_claude_api(prompt)
            latency_ms = (datetime.now() - start_time).total_seconds() * 1000

            if response['success']:
                self.request_count += 1
                result = response['data']
                result['latency_ms'] = latency_ms
                logger.info(f"Claude analysis successful: risk_score={result.get('risk_score')}")
                return result
            else:
                self.error_count += 1
                logger.error(f"Claude API error: {response['error']}")
                return self._error_response(response['error'])

        except Exception as e:
            self.error_count += 1
            logger.error(f"Claude analysis exception: {str(e)}")
            return self._error_response(f"Analysis failed: {str(e)}")

    def analyze_with_quebec_expert(self, text: str) -> Dict:
        """
        Analyze text using Quebec cybersecurity expert persona.

        Args:
            text: Text to analyze

        Returns:
            Expert analysis result
        """
        if not self.api_key:
            return self._error_response("No API key configured")

        try:
            # Build Quebec expert prompt
            prompt = self._build_quebec_expert_prompt(text)

            # Make API request
            start_time = datetime.now()
            response = self._call_claude_api(prompt, system_prompt=self._get_quebec_expert_system())
            latency_ms = (datetime.now() - start_time).total_seconds() * 1000

            if response['success']:
                self.request_count += 1
                result = response['data']
                result['latency_ms'] = latency_ms
                result['expert_type'] = 'Quebec Cybersecurity Expert'
                return result
            else:
                self.error_count += 1
                return self._error_response(response['error'])

        except Exception as e:
            self.error_count += 1
            logger.error(f"Quebec expert analysis failed: {str(e)}")
            return self._error_response(f"Expert analysis failed: {str(e)}")

    def _call_claude_api(self, prompt: str, system_prompt: str = None) -> Dict:
        """
        Call Claude API with standardized format.

        Args:
            prompt: User prompt
            system_prompt: Optional system prompt

        Returns:
            API response with success flag
        """
        headers = {
            "anthropic-version": self.API_VERSION,
            "content-type": "application/json",
            "x-api-key": self.api_key
        }

        messages = [
            {
                "role": "user",
                "content": prompt
            }
        ]

        request_body = {
            "model": self.MODEL,
            "max_tokens": self.MAX_TOKENS,
            "messages": messages,
            "temperature": self.TEMPERATURE
        }

        # Add system prompt if provided
        if system_prompt:
            request_body["system"] = system_prompt

        try:
            response = requests.post(
                self.API_ENDPOINT,
                headers=headers,
                json=request_body,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                content = data['content'][0]['text'].strip()

                # Parse JSON response
                try:
                    # Remove markdown code blocks if present
                    if content.startswith('```'):
                        content = content.split('```')[1]
                        if content.startswith('json'):
                            content = content[4:]
                        content = content.split('```')[0]

                    result = json.loads(content)
                    result['llm_used'] = 'Claude 3 Sonnet (Anthropic)'
                    result['model'] = self.MODEL

                    return {
                        'success': True,
                        'data': result
                    }
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse Claude response: {content}")
                    return {
                        'success': False,
                        'error': f"Invalid JSON response: {str(e)}"
                    }
            else:
                error_msg = response.text
                try:
                    error_data = response.json()
                    error_msg = error_data.get('error', {}).get('message', error_msg)
                except:
                    pass

                logger.error(f"Claude API error {response.status_code}: {error_msg}")
                return {
                    'success': False,
                    'error': f"API error {response.status_code}: {error_msg}"
                }

        except requests.Timeout:
            return {
                'success': False,
                'error': 'Claude API request timeout'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f"Request failed: {str(e)}"
            }

    def _build_analysis_prompt(self, text: str, context: str = None) -> str:
        """Build analysis prompt."""
        prompt = f'''Analyze this text for scam indicators and respond ONLY with valid JSON (no markdown):

{{"risk_score": 0-100, "is_scam": true/false, "indicators": ["list", "of", "indicators"], "explanation": "brief reason"}}

Text: {text}'''

        if context:
            prompt += f"\n\nContext: {context}"

        return prompt

    def _build_quebec_expert_prompt(self, text: str) -> str:
        """Build Quebec expert analysis prompt."""
        return f'''Analyser ce texte suspect pour des indicateurs d'arnaque.
Répondre UNIQUEMENT avec du JSON valide (pas de markdown):

{{"risk_score": 0-100, "is_scam": true/false, "scam_type": "type d'arnaque", "indicators": ["liste", "d'indicateurs"], "explanation": "explication brève", "quebec_context": "contexte québécois pertinent"}}

Texte: {text}'''

    def _get_quebec_expert_system(self) -> str:
        """Get Quebec cybersecurity expert system prompt."""
        return """Tu es un expert en cybersécurité spécialisé dans la détection d'arnaque au Québec.
Tu connais les arnaquesles plus communes au Québec et les institutions québécoises pertinentes.
Tu fais des analyses détaillées en français et en considérant le contexte québécois.
Tu fournis toujours tes réponses en format JSON valide."""

    def _error_response(self, error_msg: str) -> Dict:
        """Create standardized error response."""
        return {
            'success': False,
            'risk_score': 50,  # Default to medium risk on error
            'is_scam': False,
            'explanation': 'Unable to analyze with Claude',
            'error': error_msg,
            'llm_used': 'Claude 3 Sonnet (Error fallback)'
        }

    def get_metrics(self) -> Dict:
        """Get integration metrics."""
        return {
            'total_requests': self.request_count,
            'errors': self.error_count,
            'success_rate': (self.request_count - self.error_count) / self.request_count * 100 if self.request_count > 0 else 0,
            'model': self.MODEL,
            'api_endpoint': self.API_ENDPOINT
        }

    def health_check(self) -> bool:
        """
        Health check for Claude API connectivity.

        Returns:
            True if API is accessible
        """
        if not self.api_key:
            return False

        try:
            # Simple health check with minimal prompt
            result = self._call_claude_api("Respond with: {\"health\": \"ok\"}")
            return result['success']
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return False


class ClaudeProviderAdapter:
    """
    Adapter to integrate Claude with LLMProviderManager.

    Provides standardized interface for provider manager.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize adapter.

        Args:
            api_key: Anthropic API key
        """
        self.claude = ClaudeIntegration(api_key)

    def analyze(self, text: str, analysis_type: str = "standard") -> Dict:
        """
        Analyze text with Claude.

        Args:
            text: Text to analyze
            analysis_type: "standard" or "quebec_expert"

        Returns:
            Standardized analysis result
        """
        if analysis_type == "quebec_expert":
            return self.claude.analyze_with_quebec_expert(text)
        else:
            return self.claude.analyze_text(text)

    def is_healthy(self) -> bool:
        """Check if provider is healthy."""
        return self.claude.health_check()

    def get_metrics(self) -> Dict:
        """Get provider metrics."""
        return self.claude.get_metrics()


if __name__ == '__main__':
    print("Claude Integration Module")
    print("=" * 50)
    print("Provides Claude 3 Sonnet integration for ScamGuard")
