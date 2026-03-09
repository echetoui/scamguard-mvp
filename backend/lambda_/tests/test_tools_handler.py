"""
Unit tests for tools_handler module
Tests email breach checking and financial advisor verification endpoints
"""

import unittest
import json
from unittest.mock import patch, MagicMock

# Add parent directory to path for imports
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools_handler import (
    check_email_breach,
    check_financial_advisor,
    lambda_handler,
    error_response,
    success_response
)


class TestResponseFormatting(unittest.TestCase):
    """Test response formatting functions"""

    def test_success_response_format(self):
        """Success response should have correct structure"""
        data = {"test": "data"}
        response = success_response(200, data)

        self.assertEqual(response['statusCode'], 200)
        self.assertIn('body', response)
        self.assertIn('headers', response)

        body = json.loads(response['body'])
        self.assertIn('data', body)
        self.assertEqual(body['data'], data)

    def test_error_response_format(self):
        """Error response should have correct structure"""
        response = error_response(400, "TEST_ERROR", "Test message")

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('error', body)
        self.assertEqual(body['error']['code'], "TEST_ERROR")
        self.assertEqual(body['error']['message'], "Test message")

    def test_cors_headers_present(self):
        """All responses should include CORS headers"""
        response = success_response(200, {})
        headers = response['headers']

        self.assertIn('Access-Control-Allow-Origin', headers)
        self.assertIn('Access-Control-Allow-Methods', headers)
        self.assertIn('Content-Type', headers)


class TestEmailBreachChecking(unittest.TestCase):
    """Test email breach checking endpoint"""

    @patch('tools_handler.ssm_client')
    @patch('tools_handler.requests.get')
    def setUp(self, mock_requests, mock_ssm):
        """Set up test fixtures"""
        self.mock_requests = mock_requests
        self.mock_ssm = mock_ssm

    def test_invalid_email_format(self):
        """Should reject invalid email addresses"""
        event = {
            'path': '/api/v1/tools/check-email',
            'httpMethod': 'POST',
            'body': json.dumps({'email': 'invalid-email'})
        }

        response = check_email_breach(event, None)
        self.assertEqual(response['statusCode'], 400)

        body = json.loads(response['body'])
        self.assertEqual(body['error']['code'], 'INVALID_EMAIL')

    def test_missing_email(self):
        """Should reject request without email"""
        event = {
            'path': '/api/v1/tools/check-email',
            'httpMethod': 'POST',
            'body': json.dumps({})
        }

        response = check_email_breach(event, None)
        self.assertEqual(response['statusCode'], 400)

    @patch('tools_handler.get_parameter')
    def test_no_api_key_returns_fallback(self, mock_get_param):
        """Should return fallback response when API key not available"""
        mock_get_param.return_value = None

        event = {
            'path': '/api/v1/tools/check-email',
            'httpMethod': 'POST',
            'body': json.dumps({'email': 'test@example.com'})
        }

        response = check_email_breach(event, None)
        self.assertEqual(response['statusCode'], 200)

        body = json.loads(response['body'])
        data = body['data']
        self.assertIn('fallback_url', data)
        self.assertIn('haveibeenpwned.com', data['fallback_url'])

    def test_invalid_json_body(self):
        """Should handle invalid JSON in request body"""
        event = {
            'path': '/api/v1/tools/check-email',
            'httpMethod': 'POST',
            'body': 'invalid json'
        }

        response = check_email_breach(event, None)
        self.assertEqual(response['statusCode'], 400)


class TestAdvisorChecking(unittest.TestCase):
    """Test financial advisor checking endpoint"""

    def test_missing_advisor_name(self):
        """Should require advisor name"""
        event = {
            'path': '/api/v1/tools/check-advisor',
            'httpMethod': 'POST',
            'body': json.dumps({'firmName': 'Test Firm'})
        }

        response = check_financial_advisor(event, None)
        self.assertEqual(response['statusCode'], 400)

        body = json.loads(response['body'])
        self.assertEqual(body['error']['code'], 'MISSING_NAME')

    @patch('tools_handler.get_parameter')
    def test_fallback_response_without_llm(self, mock_get_param):
        """Should return fallback response when LLM not available"""
        mock_get_param.return_value = None

        event = {
            'path': '/api/v1/tools/check-advisor',
            'httpMethod': 'POST',
            'body': json.dumps({'advisorName': 'Jean Dupont', 'firmName': 'Test Firm'})
        }

        response = check_financial_advisor(event, None)
        self.assertEqual(response['statusCode'], 200)

        body = json.loads(response['body'])
        data = body['data']

        # Should include registry links
        self.assertIn('official_registries', data)
        self.assertTrue(len(data['official_registries']) > 0)

        # Should include AMF, CIRO, CSF
        registry_names = [r['name'] for r in data['official_registries']]
        self.assertTrue(any('AMF' in name for name in registry_names))
        self.assertTrue(any('CIRO' in name for name in registry_names))

    def test_invalid_json_body(self):
        """Should handle invalid JSON in request body"""
        event = {
            'path': '/api/v1/tools/check-advisor',
            'httpMethod': 'POST',
            'body': 'invalid json'
        }

        response = check_financial_advisor(event, None)
        self.assertEqual(response['statusCode'], 400)


class TestLambdaRouting(unittest.TestCase):
    """Test Lambda handler routing"""

    def test_cors_preflight_request(self):
        """Should handle OPTIONS requests"""
        event = {
            'path': '/api/v1/tools/check-email',
            'httpMethod': 'OPTIONS'
        }

        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 200)

    def test_invalid_endpoint(self):
        """Should return 404 for invalid endpoints"""
        event = {
            'path': '/api/v1/tools/invalid-endpoint',
            'httpMethod': 'POST',
            'body': '{}'
        }

        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 404)

        body = json.loads(response['body'])
        self.assertEqual(body['error']['code'], 'NOT_FOUND')

    @patch('tools_handler.get_parameter')
    def test_email_endpoint_routing(self, mock_get_param):
        """Should route to email check endpoint"""
        mock_get_param.return_value = None

        event = {
            'path': '/api/v1/tools/check-email',
            'httpMethod': 'POST',
            'body': json.dumps({'email': 'test@example.com'})
        }

        response = lambda_handler(event, None)
        # Should not be 404
        self.assertNotEqual(response['statusCode'], 404)

    @patch('tools_handler.get_parameter')
    def test_advisor_endpoint_routing(self, mock_get_param):
        """Should route to advisor check endpoint"""
        mock_get_param.return_value = None

        event = {
            'path': '/api/v1/tools/check-advisor',
            'httpMethod': 'POST',
            'body': json.dumps({'advisorName': 'Test'})
        }

        response = lambda_handler(event, None)
        # Should not be 404
        self.assertNotEqual(response['statusCode'], 404)


if __name__ == '__main__':
    unittest.main()
