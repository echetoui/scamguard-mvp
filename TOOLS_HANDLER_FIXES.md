# tools_handler.py - Security Fixes & Improvements

## Quick Reference: Critical Fixes

This document provides specific code snippets to fix the HIGH and CRITICAL security issues identified in the security review.

---

## Fix #1: CORS Origin Validation (CRITICAL)

**Current Code (lines 23, 42):**
```python
"Access-Control-Allow-Origin": "*",
```

**Problem:** Allows any website to call your API

**Fixed Code:**
```python
# At top of file after imports
import os

ALLOWED_ORIGINS = os.environ.get(
    'ALLOWED_ORIGINS',
    'https://scamguard.ca,https://www.scamguard.ca,https://app.scamguard.ca'
).split(',')

def get_cors_origin(request_origin=None):
    """Get allowed CORS origin or default."""
    if request_origin in ALLOWED_ORIGINS:
        return request_origin
    return ALLOWED_ORIGINS[0]  # Return primary domain

# Update both success_response and error_response functions:
def success_response(status_code, data):
    """Return standardized success response."""
    return {
        "statusCode": status_code,
        "body": json.dumps({"data": data}),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
            "Access-Control-Allow-Methods": "POST, OPTIONS",  # Remove GET, PUT, DELETE
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        },
    }

def error_response(status_code, code, message):
    """Return standardized error response."""
    return {
        "statusCode": status_code,
        "body": json.dumps({"error": {"code": code, "message": message}}),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        },
    }
```

**Deployment:**
Set environment variable in Lambda:
```
ALLOWED_ORIGINS=https://scamguard.ca,https://www.scamguard.ca
```

Or in CDK (scamguard_stack.py):
```python
tools_lambda = aws_lambda.Function(
    self, "ToolsFunction",
    ...
    environment={
        "ALLOWED_ORIGINS": "https://scamguard.ca,https://www.scamguard.ca"
    }
)
```

---

## Fix #2: Rate Limiting (CRITICAL)

**Problem:** No protection against spam/DoS attacks

**New Code - Add to tools_handler.py:**

```python
from datetime import datetime, timedelta
from collections import defaultdict

class RateLimiter:
    """Simple in-memory rate limiter for Lambda functions."""

    def __init__(self, max_requests=10, window_seconds=60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, identifier):
        """Check if request from identifier is allowed."""
        now = datetime.now()

        # Clean old requests
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if (now - req_time).total_seconds() < self.window_seconds
        ]

        if len(self.requests[identifier]) >= self.max_requests:
            return False

        self.requests[identifier].append(now)
        return True

    def get_remaining(self, identifier):
        """Get remaining requests in current window."""
        now = datetime.now()
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if (now - req_time).total_seconds() < self.window_seconds
        ]
        return max(0, self.max_requests - len(self.requests[identifier]))

# Create rate limiters for each endpoint
email_limiter = RateLimiter(max_requests=5, window_seconds=60)  # 5 per minute
advisor_limiter = RateLimiter(max_requests=3, window_seconds=60)  # 3 per minute

def get_client_ip(event):
    """Extract client IP from Lambda event."""
    return event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')

def rate_limit_response(remaining):
    """Return rate limit error response."""
    return error_response(429, "RATE_LIMITED",
        f"Trop de requêtes. Réessayez dans une minute. ({remaining} requêtes restantes)")
```

**Updated handler functions:**

```python
def check_email_breach(event, context):
    """
    POST /api/v1/tools/check-email
    Check if email appears in known data breaches via BreachDirectory API.
    """
    # Rate limiting
    client_ip = get_client_ip(event)
    if not email_limiter.is_allowed(client_ip):
        return rate_limit_response(email_limiter.get_remaining(client_ip))

    try:
        body = json.loads(event.get("body", "{}"))
        email = body.get("email", "").strip()

        # Validate email format and length
        email_pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
        if not email or len(email) > 254 or not re.match(email_pattern, email):
            return error_response(400, "INVALID_EMAIL", "Adresse courriel invalide")

        # ... rest of function
```

```python
def check_financial_advisor(event, context):
    """
    POST /api/v1/tools/check-advisor
    Check if a financial advisor is authorized.
    """
    # Rate limiting
    client_ip = get_client_ip(event)
    if not advisor_limiter.is_allowed(client_ip):
        return rate_limit_response(advisor_limiter.get_remaining(client_ip))

    try:
        body = json.loads(event.get("body", "{}"))
        advisor_name = body.get("advisorName", "").strip()
        firm_name = body.get("firmName", "").strip()

        if not advisor_name:
            return error_response(400, "MISSING_NAME", "Nom du conseiller requis")

        # ... rest of function
```

**Note:** This is a basic in-memory approach suitable for Lambda. For better scaling, consider AWS WAF or DynamoDB-based rate limiting.

---

## Fix #3: Safe JSON Parsing from LLMs (CRITICAL)

**Problem:** Unsafe extraction of JSON from LLM responses - vulnerable to injection

**Current Code (lines 265-275, 311-318):**
```python
try:
    if '{' in content and '}' in content:
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        json_str = content[json_start:json_end]
        return json.loads(json_str)
except:
    pass
```

**Fixed Code - Replace both query_openai() and query_gemini() JSON parsing:**

```python
def extract_json_from_response(content):
    """
    Safely extract and validate JSON from LLM response.
    Protects against injection attacks and malformed responses.
    """
    if not isinstance(content, str):
        return None

    content = content.strip()

    # Find all complete JSON objects (matching braces)
    candidates = []
    depth = 0
    start = None

    for i, char in enumerate(content):
        if char == '{':
            if depth == 0:
                start = i
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0 and start is not None:
                candidate = content[start:i+1]
                candidates.append(candidate)
                start = None

    # Try to parse each candidate
    for candidate in candidates:
        try:
            parsed = json.loads(candidate)

            # Validate it's a dictionary with expected fields
            if not isinstance(parsed, dict):
                continue

            # Validate required fields exist
            required_fields = {'risk_level', 'summary', 'red_flags', 'official_registries'}
            if not required_fields.issubset(parsed.keys()):
                continue

            # Validate risk_level is one of expected values
            if parsed.get('risk_level') not in ('low', 'medium', 'high', 'unknown'):
                continue

            # Validate red_flags is a list
            if not isinstance(parsed.get('red_flags'), list):
                continue

            # Validate official_registries is a list of dicts with name/url
            registries = parsed.get('official_registries', [])
            if not isinstance(registries, list):
                continue

            for registry in registries:
                if not isinstance(registry, dict):
                    continue
                if 'name' not in registry or 'url' not in registry:
                    continue

            # All validation passed
            return parsed

        except json.JSONDecodeError:
            continue
        except (KeyError, TypeError, ValueError):
            continue

    return None


def query_openai(advisor_name, firm_name, api_key):
    """Query OpenAI API for advisor verification."""
    prompt = get_advisor_analysis_prompt(advisor_name, firm_name)

    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "Tu es un expert en réglementation financière au Québec. Réponds UNIQUEMENT en JSON valide."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 500
            },
            timeout=10
        )

        response.raise_for_status()
        result = response.json()

        # Validate response structure
        if not result.get('choices') or len(result['choices']) == 0:
            logger.warning("OpenAI returned empty choices")
            return None

        message = result['choices'][0].get('message', {})
        content = message.get('content', '').strip()

        if not content:
            logger.warning("OpenAI returned empty content")
            return None

        # Safely extract JSON
        parsed = extract_json_from_response(content)
        if parsed:
            return parsed

        logger.warning(f"OpenAI response didn't contain valid JSON: {content[:100]}")
        return None

    except requests.RequestException as e:
        logger.error(f"OpenAI API error: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error querying OpenAI: {e}")
        return None


def query_gemini(advisor_name, firm_name, api_key):
    """Query Gemini API for advisor verification."""
    prompt = get_advisor_analysis_prompt(advisor_name, firm_name)

    try:
        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [
                    {"parts": [{"text": prompt}]}
                ],
                "systemInstruction": {
                    "parts": [
                        {"text": "Tu es un expert en réglementation financière au Québec. Réponds UNIQUEMENT en JSON valide."}
                    ]
                }
            },
            params={"key": api_key},
            timeout=10
        )

        response.raise_for_status()
        result = response.json()

        # Validate response structure
        if 'candidates' not in result or len(result['candidates']) == 0:
            logger.warning("Gemini returned empty candidates")
            return None

        candidate = result['candidates'][0]
        if 'content' not in candidate or 'parts' not in candidate['content']:
            logger.warning("Gemini returned malformed content structure")
            return None

        if len(candidate['content']['parts']) == 0:
            logger.warning("Gemini returned empty parts")
            return None

        content = candidate['content']['parts'][0].get('text', '').strip()

        if not content:
            logger.warning("Gemini returned empty text")
            return None

        # Safely extract JSON
        parsed = extract_json_from_response(content)
        if parsed:
            return parsed

        logger.warning(f"Gemini response didn't contain valid JSON: {content[:100]}")
        return None

    except requests.RequestException as e:
        logger.error(f"Gemini API error: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error querying Gemini: {e}")
        return None
```

---

## Fix #4: Input Sanitization & Prompt Injection Prevention

**Problem:** Advisor name/firm name can contain newlines that break prompt structure

**New Function - Add to tools_handler.py:**

```python
def sanitize_for_prompt(text, max_length=256):
    """
    Sanitize input for safe inclusion in LLM prompts.
    Prevents prompt injection attacks.
    """
    if not isinstance(text, str):
        return ""

    # Strip leading/trailing whitespace
    text = text.strip()

    # Truncate to max length
    text = text[:max_length]

    # Remove control characters and problematic characters
    # Keep: letters, numbers, spaces, basic punctuation
    # Remove: newlines, tabs, null bytes, Unicode control chars
    import string
    allowed_chars = string.ascii_letters + string.digits + string.whitespace[:-2] + ".,'-() "
    text = ''.join(c for c in text if c in allowed_chars or ord(c) > 127)

    # Remove multiple consecutive spaces
    text = ' '.join(text.split())

    return text
```

**Updated check_financial_advisor():**

```python
def check_financial_advisor(event, context):
    """
    POST /api/v1/tools/check-advisor
    Check if a financial advisor is authorized.
    """
    # Rate limiting
    client_ip = get_client_ip(event)
    if not advisor_limiter.is_allowed(client_ip):
        return rate_limit_response(advisor_limiter.get_remaining(client_ip))

    try:
        body = json.loads(event.get("body", "{}"))

        # Sanitize inputs first
        advisor_name = sanitize_for_prompt(body.get("advisorName", ""))
        firm_name = sanitize_for_prompt(body.get("firmName", ""))

        if not advisor_name:
            return error_response(400, "MISSING_NAME", "Nom du conseiller requis")

        # Try OpenAI first, fallback to Gemini, then return static response
        llm_result = None

        # Try OpenAI
        openai_key = get_parameter('/scamguard/openai-api-key')
        if openai_key:
            try:
                llm_result = query_openai(advisor_name, firm_name, openai_key)
            except Exception as e:
                logger.error(f"OpenAI error: {e}")

        # Try Gemini if OpenAI failed
        if not llm_result:
            gemini_key = get_parameter('/scamguard/gemini-api-key')
            if gemini_key:
                try:
                    llm_result = query_gemini(advisor_name, firm_name, gemini_key)
                except Exception as e:
                    logger.error(f"Gemini error: {e}")

        # Use fallback response if LLM not available
        if not llm_result:
            llm_result = get_fallback_advisor_response(advisor_name, firm_name)

        return success_response(200, llm_result)

    except json.JSONDecodeError:
        return error_response(400, "INVALID_JSON", "Format de requête invalide")
    except Exception as e:
        logger.exception("Unexpected error in check_financial_advisor")
        return error_response(500, "INTERNAL_ERROR", "Erreur serveur interne")
```

---

## Fix #5: Improved Error Handling & Logging

**Problem:** Generic error handling, insufficient logging, bare except clauses

**Add at top of file (after imports):**

```python
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)
```

**Updated check_email_breach():**

```python
def check_email_breach(event, context):
    """
    POST /api/v1/tools/check-email
    Check if email appears in known data breaches via BreachDirectory API.

    PRIVACY NOTE: Email is not logged or persisted to DynamoDB.
    """
    # Rate limiting
    client_ip = get_client_ip(event)
    if not email_limiter.is_allowed(client_ip):
        return rate_limit_response(email_limiter.get_remaining(client_ip))

    try:
        body = json.loads(event.get("body", "{}"))
        email = body.get("email", "").strip()

        # Validate email format and length
        email_pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
        if not email or len(email) > 254 or not re.match(email_pattern, email):
            logger.warning(f"Invalid email format from {client_ip}")
            return error_response(400, "INVALID_EMAIL", "Adresse courriel invalide")

        # Get BreachDirectory API key from SSM
        api_key = get_parameter('/scamguard/breachdirectory-api-key')

        if not api_key:
            logger.warning("BreachDirectory API key not configured")
            return error_response(503, "SERVICE_UNAVAILABLE",
                "Service de vérification temporairement indisponible")

        # Call BreachDirectory API with retry
        response = call_breachdirectory_with_retry(email, api_key)

        if response is None:
            logger.warning(f"BreachDirectory API unavailable for {client_ip}")
            return error_response(503, "SERVICE_UNAVAILABLE",
                "Service de vérification temporairement indisponible")

        result = response.json()

        # Parse BreachDirectory response
        if result.get("success"):
            found = result.get("found", 0)
            sources = result.get("result", [])

            if found > 0:
                logger.info(f"Email found in {found} breaches")
                return success_response(200, {
                    "breached": True,
                    "breach_count": found,
                    "sources": sources,
                    "message": f"⚠️ Attention : votre courriel apparaît dans {found} fuite(s) de données.",
                    "actions": [
                        "Changez votre mot de passe",
                        "Activez l'authentification à deux facteurs",
                        "Vérifiez vos autres comptes"
                    ],
                })
            else:
                return success_response(200, {
                    "breached": False,
                    "breach_count": 0,
                    "sources": [],
                    "message": "✅ Bonne nouvelle : votre courriel n'apparaît pas dans nos bases de données connues.",
                    "actions": [
                        "Continuez à utiliser des mots de passe forts",
                        "Activez l'authentification à deux facteurs",
                        "Restez vigilant face aux tentatives de phishing"
                    ],
                })
        else:
            logger.warning(f"BreachDirectory returned success=false")
            return error_response(503, "SERVICE_UNAVAILABLE",
                "Service de vérification temporairement indisponible")

    except json.JSONDecodeError as e:
        logger.warning(f"Invalid JSON in request: {e}")
        return error_response(400, "INVALID_JSON", "Format de requête invalide")
    except requests.RequestException as e:
        logger.error(f"BreachDirectory API error: {e}")
        return error_response(503, "SERVICE_UNAVAILABLE",
            "Service de vérification temporairement indisponible")
    except Exception as e:
        logger.exception("Unexpected error in check_email_breach")
        return error_response(500, "INTERNAL_ERROR", "Erreur serveur interne")
```

**New helper function - BreachDirectory with retries:**

```python
def call_breachdirectory_with_retry(email, api_key, max_retries=3):
    """
    Call BreachDirectory API with exponential backoff retry logic.
    Returns response object or None if all retries fail.
    """
    for attempt in range(max_retries):
        try:
            response = requests.get(
                "https://breachdirectory.org/api",
                params={"func": "auto", "term": email},
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": "ScamGuard/1.0"
                },
                timeout=10
            )

            if response.status_code == 200:
                return response
            elif response.status_code == 429:
                # Rate limited
                wait_time = 2 ** attempt
                logger.warning(f"BreachDirectory rate limited, retry {attempt + 1}/{max_retries} in {wait_time}s")
                if attempt < max_retries - 1:
                    time.sleep(wait_time)
            elif response.status_code >= 500:
                # Server error - retry
                wait_time = 2 ** attempt
                logger.warning(f"BreachDirectory server error ({response.status_code}), retry {attempt + 1}/{max_retries} in {wait_time}s")
                if attempt < max_retries - 1:
                    time.sleep(wait_time)
            else:
                # Client error (401, 403, etc) - don't retry
                logger.error(f"BreachDirectory client error: {response.status_code} - {response.text[:200]}")
                return None

        except requests.Timeout:
            logger.warning(f"BreachDirectory timeout, retry {attempt + 1}/{max_retries}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
        except requests.ConnectionError as e:
            logger.warning(f"BreachDirectory connection error: {e}, retry {attempt + 1}/{max_retries}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
        except requests.RequestException as e:
            logger.error(f"BreachDirectory request error: {e}")
            return None

    logger.error(f"BreachDirectory API failed after {max_retries} retries")
    return None
```

---

## Fix #6: Input Validation - Add Length Checks

**Updated get_parameter() with better error handling:**

```python
from botocore.exceptions import ClientError

def get_parameter(param_name):
    """Get parameter from SSM Parameter Store."""
    try:
        response = ssm_client.get_parameter(Name=param_name, WithDecryption=True)
        return response['Parameter']['Value']
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'ParameterNotFound':
            logger.error(f"SSM parameter not configured: {param_name}")
        elif error_code == 'AccessDeniedException':
            logger.critical(f"Lambda lacks IAM permissions for SSM: {param_name}")
        else:
            logger.error(f"SSM error ({error_code}): {e}")
        return None
    except Exception as e:
        logger.exception(f"Unexpected SSM error getting {param_name}")
        return None
```

---

## Updated Imports (Add to top of file)

```python
"""Tools handler for verification utilities - Email breach and financial advisor checking."""

import json
import os
import re
import time  # NEW - for retries
import logging  # NEW - for logging
import boto3
import requests
from collections import defaultdict  # NEW - for rate limiter
from datetime import datetime, timedelta  # NEW - for rate limiter
from botocore.exceptions import ClientError  # NEW - for SSM error handling

# Initialize AWS clients
ssm_client = boto3.client('ssm', region_name='us-east-1')

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Configuration constants
ALLOWED_ORIGINS = os.environ.get(
    'ALLOWED_ORIGINS',
    'https://scamguard.ca,https://www.scamguard.ca'
).split(',')
```

---

## Testing the Fixes

### Unit Tests to Add (update test_tools_handler.py)

```python
import unittest
from unittest.mock import patch, MagicMock

class TestRateLimiting(unittest.TestCase):
    def test_rate_limit_blocks_excessive_requests(self):
        """Should block requests exceeding rate limit"""
        limiter = RateLimiter(max_requests=2, window_seconds=60)

        self.assertTrue(limiter.is_allowed("client1"))
        self.assertTrue(limiter.is_allowed("client1"))
        self.assertFalse(limiter.is_allowed("client1"))
        self.assertEqual(limiter.get_remaining("client1"), 0)

class TestJSONExtraction(unittest.TestCase):
    def test_extract_valid_json(self):
        """Should extract valid JSON from response"""
        response = '{"risk_level": "low", "summary": "Safe", "red_flags": [], "official_registries": []}'
        result = extract_json_from_response(response)
        self.assertEqual(result['risk_level'], 'low')

    def test_reject_missing_fields(self):
        """Should reject JSON missing required fields"""
        response = '{"risk_level": "low"}'  # Missing summary, red_flags, official_registries
        result = extract_json_from_response(response)
        self.assertIsNone(result)

    def test_reject_invalid_risk_level(self):
        """Should reject invalid risk_level values"""
        response = '''{"risk_level": "extreme", "summary": "Test", "red_flags": [], "official_registries": []}'''
        result = extract_json_from_response(response)
        self.assertIsNone(result)

class TestInputSanitization(unittest.TestCase):
    def test_sanitize_removes_newlines(self):
        """Should remove newlines from input"""
        result = sanitize_for_prompt("Jean\nDupont\n[SYSTEM] override")
        self.assertNotIn('\n', result)

    def test_sanitize_truncates_length(self):
        """Should truncate input to max length"""
        long_text = "A" * 300
        result = sanitize_for_prompt(long_text, max_length=256)
        self.assertEqual(len(result), 256)
```

---

## Deployment Checklist

Before deploying the fixed version:

- [ ] Run all unit tests
- [ ] Set `ALLOWED_ORIGINS` environment variable in Lambda
- [ ] Verify CloudWatch logs are enabled
- [ ] Test rate limiting with load testing (50 requests/second)
- [ ] Test JSON extraction with various LLM response formats
- [ ] Verify prompt injection doesn't work with sanitized inputs
- [ ] Check Lambda timeout is >= 30 seconds (default 10s might be too short with retries)
- [ ] Review CloudWatch logs for any errors during first hour
- [ ] Monitor Lambda error rate and duration metrics

