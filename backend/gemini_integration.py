"""
Gemini (Google) LLM Integration

Integrates Google Gemini Pro with ScamGuard for scam detection and analysis.
Provides feature parity with Claude and OpenAI implementations.

Features:
- Gemini Pro API integration
- Scam detection and risk scoring
- Quebec cybersecurity expert analysis
- Fallback handling
- Request/response standardization

Author: ScamGuard Gemini Integration Team
Date: February 18, 2026
Version: 1.0
"""

import logging
import json
import requests
from typing import Dict, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GeminiIntegration:
    """
    Gemini (Google) integration for scam detection.

    Provides scam analysis using Google Gemini Pro model with
    standardized request/response format.
    """

    # Gemini API configuration
    API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    MODEL = "gemini-pro"
    TEMPERATURE = 0.3
    MAX_TOKENS = 1024

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini integration.

        Args:
            api_key: Google API key (or from environment)
        """
        self.api_key = api_key
        self.request_count = 0
        self.error_count = 0

        logger.info("Initialized Gemini integration")

    def set_api_key(self, api_key: str):
        """Set API key."""
        self.api_key = api_key

    def analyze_text(self, text: str, context: str = None) -> Dict:
        """
        Analyze text for scam indicators using Gemini.

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
            response = self._call_gemini_api(prompt)
            latency_ms = (datetime.now() - start_time).total_seconds() * 1000

            if response['success']:
                self.request_count += 1
                result = response['data']
                result['latency_ms'] = latency_ms
                logger.info(f"Gemini analysis successful: risk_score={result.get('risk_score')}")
                return result
            else:
                self.error_count += 1
                # Log a generic error message to avoid exposing potentially sensitive upstream details
                logger.error("Gemini API error during analysis")
                return self._error_response(response['error'])

        except Exception as e:
            self.error_count += 1
            logger.error(f"Gemini analysis exception: {str(e)}")
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
            response = self._call_gemini_api(prompt)
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

    def _call_gemini_api(self, prompt: str) -> Dict:
        """
        Call Gemini API with standardized format.

        Args:
            prompt: User prompt

        Returns:
            API response with success flag
        """
        request_body = {
            'contents': [
                {
                    'parts': [
                        {
                            'text': prompt
                        }
                    ]
                }
            ],
            'generationConfig': {
                'temperature': self.TEMPERATURE,
                'maxOutputTokens': self.MAX_TOKENS
            }
        }

        try:
            response = requests.post(
                f"{self.API_ENDPOINT}?key={self.api_key}",
                json=request_body,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()

                # Extract text from Gemini response
                if 'candidates' in data and len(data['candidates']) > 0:
                    candidate = data['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        content = candidate['content']['parts'][0]['text'].strip()

                        # Parse JSON response
                        try:
                            # Remove markdown code blocks if present
                            if content.startswith('```'):
                                content = content.split('```')[1]
                                if content.startswith('json'):
                                    content = content[4:]
                                content = content.split('```')[0]

                            result = json.loads(content)
                            result['llm_used'] = 'Gemini Pro (Google)'
                            result['model'] = self.MODEL

                            return {
                                'success': True,
                                'data': result
                            }
                        except json.JSONDecodeError as e:
                            # Avoid logging full model output, which may contain user input or sensitive data
                            logger.error(f"Failed to parse Gemini response JSON: {str(e)}")
                            return {
                                'success': False,
                                'error': f"Invalid JSON response from Gemini"
                            }

                logger.error("Unexpected Gemini response structure")
                return {
                    'success': False,
                    'error': "Unexpected response structure from Gemini"
                }
            else:
                # Do not log full error body as it may contain sensitive information
                try:
                    error_data = response.json()
                    # Optionally extract a non-sensitive error code if available, but do not expose full message
                    error_code = error_data.get('error', {}).get('code')
                except Exception:
                    error_code = None

                if error_code is not None:
                    logger.error(f"Gemini API returned HTTP {response.status_code} with error code {error_code}")
                    error_summary = f"API error {response.status_code} (code {error_code}) from Gemini"
                else:
                    logger.error(f"Gemini API returned HTTP {response.status_code}")
                    error_summary = f"API error {response.status_code} from Gemini"

                return {
                    'success': False,
                    'error': error_summary
                }

        except requests.Timeout:
            return {
                'success': False,
                'error': 'Gemini API request timeout'
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

    def _error_response(self, error_msg: str) -> Dict:
        """Create standardized error response."""
        return {
            'success': False,
            'risk_score': 50,  # Default to medium risk on error
            'is_scam': False,
            'explanation': 'Unable to analyze with Gemini',
            'error': error_msg,
            'llm_used': 'Gemini Pro (Error fallback)'
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
        Health check for Gemini API connectivity.

        Returns:
            True if API is accessible
        """
        if not self.api_key:
            return False

        try:
            # Simple health check with minimal prompt
            result = self._call_gemini_api('Respond with: {"health": "ok"}')
            return result['success']
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return False


class GeminiProviderAdapter:
    """
    Adapter to integrate Gemini with LLMProviderManager.

    Provides standardized interface for provider manager.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize adapter.

        Args:
            api_key: Google API key
        """
        self.gemini = GeminiIntegration(api_key)

    def analyze(self, text: str, analysis_type: str = "standard") -> Dict:
        """
        Analyze text with Gemini.

        Args:
            text: Text to analyze
            analysis_type: "standard" or "quebec_expert"

        Returns:
            Standardized analysis result
        """
        if analysis_type == "quebec_expert":
            return self.gemini.analyze_with_quebec_expert(text)
        else:
            return self.gemini.analyze_text(text)

    def is_healthy(self) -> bool:
        """Check if provider is healthy."""
        return self.gemini.health_check()

    def get_metrics(self) -> Dict:
        """Get provider metrics."""
        return self.gemini.get_metrics()


if __name__ == '__main__':
    print("Gemini Integration Module")
    print("=" * 50)
    print("Provides Gemini Pro integration for ScamGuard")
