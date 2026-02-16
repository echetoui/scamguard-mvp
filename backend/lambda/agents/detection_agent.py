"""DetectionAgent - Analyze messages/images for scam indicators."""

import json
import logging
import time
from typing import Optional
from base64 import b64encode
import base64
from openai import OpenAI
from openai import APITimeoutError, RateLimitError as OpenAIRateLimitError
from aws_xray_sdk.core import xray_recorder
from utils.retry import retry_with_backoff, VISION_API_RETRY_CONFIG
from utils.errors import VisionAPITimeout, RateLimitExceeded

logger = logging.getLogger(__name__)


class DetectionAgent:
    """Analyze messages and images for scam indicators using vision."""

    def __init__(self, openai_key: str):
        """Initialize with OpenAI API key."""
        self.client = OpenAI(api_key=openai_key)

    def _call_vision_api(
        self, image_url: str, message: Optional[str] = None
    ) -> dict:
        """Call GPT-4o-mini vision API (retry-able)."""
        prompt = f"""Analyze this message/image for scam indicators targeting seniors.

{f'Message text: {message}' if message else ''}

Respond with JSON:
{{
    "risk_level": "low|medium|high",
    "confidence": 0.0-1.0,
    "indicators": ["indicator1", "indicator2"],
    "explanation": "Brief explanation of risks",
    "red_flags": ["flag1", "flag2"]
}}

Focus on:
- Phishing indicators (fake links, urgency)
- Social engineering tactics (authority, fear)
- Impersonation attempts
- Unusual requests (gift cards, wire transfers)
- Grammar/spelling errors (common in scams)"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt,
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url},
                            },
                        ],
                    }
                ],
                max_tokens=500,
                timeout=55.0,  # Leave 5s buffer for Lambda 60s timeout
            )

            text = response.choices[0].message.content
            json_start = text.find("{")
            json_end = text.rfind("}") + 1
            json_str = text[json_start:json_end]
            return json.loads(json_str)

        except APITimeoutError as e:
            raise VisionAPITimeout(60) from e
        except OpenAIRateLimitError as e:
            raise RateLimitExceeded(60) from e

    @xray_recorder.capture("vision_analysis")
    def analyze_image(
        self, image_url: str, message: Optional[str] = None, user_id: Optional[str] = None
    ) -> dict:
        """Analyze image for scam indicators using GPT-4o-mini vision.

        Args:
            image_url: Presigned S3 URL to image
            message: Optional text message to analyze alongside
            user_id: For tracking

        Returns:
            Analysis dict with risk_level, indicators, explanation
        """
        try:
            xray_recorder.put_annotation("analysis_type", "image")
            xray_recorder.put_annotation("user_id", user_id)

            # Retry vision API call with exponential backoff
            attempt = 0
            last_error = None

            while attempt < 3:
                attempt += 1
                try:
                    xray_recorder.put_annotation("vision_attempt", str(attempt))
                    data = self._call_vision_api(image_url, message)

                    xray_recorder.put_annotation("risk_level", data["risk_level"])
                    xray_recorder.put_annotation("confidence", str(data["confidence"]))

                    return {
                        "risk_level": data["risk_level"],
                        "confidence": data["confidence"],
                        "indicators": data["indicators"],
                        "explanation": data["explanation"],
                        "red_flags": data["red_flags"],
                        "model": "gpt-4o-mini",
                        "attempts": attempt,
                    }

                except (VisionAPITimeout, RateLimitExceeded) as e:
                    last_error = e
                    if attempt >= 3:
                        logger.error(f"Vision API failed after {attempt} attempts: {e}")
                        raise

                    # Exponential backoff: 1s, 2s, 4s
                    delay = 2 ** (attempt - 1)
                    logger.warning(f"Vision API attempt {attempt} failed, retrying in {delay}s")
                    xray_recorder.put_annotation(f"vision_retry_delay_attempt_{attempt}", f"{delay}s")
                    time.sleep(delay)

        except Exception as e:
            logger.error(f"Vision analysis failed: {str(e)}", exc_info=True)
            xray_recorder.put_annotation("fallback_used", "true")

            # Return safe default analysis
            return {
                "risk_level": "medium",
                "confidence": 0.5,
                "indicators": ["Unable to analyze - please review manually"],
                "explanation": "Vision analysis temporarily unavailable. Please review the message manually for warning signs.",
                "red_flags": [],
                "error": str(e),
                "model": "fallback",
            }

    @xray_recorder.capture("text_analysis")
    def analyze_text(self, message: str, user_id: Optional[str] = None) -> dict:
        """Analyze text-only message for scam indicators.

        Args:
            message: Text to analyze
            user_id: For tracking

        Returns:
            Analysis dict with risk_level, indicators, explanation
        """
        try:
            xray_recorder.put_annotation("analysis_type", "text")

            prompt = f"""Analyze this message for scam indicators targeting seniors.

Message: "{message}"

Respond with JSON:
{{
    "risk_level": "low|medium|high",
    "confidence": 0.0-1.0,
    "indicators": ["indicator1", "indicator2"],
    "explanation": "Brief explanation",
    "red_flags": ["flag1", "flag2"]
}}"""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
            )

            text = response.choices[0].message.content
            json_start = text.find("{")
            json_end = text.rfind("}") + 1
            json_str = text[json_start:json_end]
            data = json.loads(json_str)

            return {
                "risk_level": data["risk_level"],
                "confidence": data["confidence"],
                "indicators": data["indicators"],
                "explanation": data["explanation"],
                "red_flags": data["red_flags"],
                "model": "gpt-4o-mini",
            }

        except Exception as e:
            logger.error(f"Text analysis failed: {str(e)}", exc_info=True)
            return {
                "risk_level": "medium",
                "confidence": 0.5,
                "indicators": ["Analysis error"],
                "explanation": "Unable to analyze text. Please review manually.",
                "red_flags": [],
                "error": str(e),
            }
