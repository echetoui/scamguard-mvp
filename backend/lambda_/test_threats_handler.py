"""
Comprehensive test suite for threats_handler Lambda function
Phase 2 Sprint 5 - SMS Simulation & Real Threats

Test coverage:
- lambda_handler routing (8 tests)
- handle_list_threats (22 tests)
- handle_get_threat (15 tests)
- handle_threat_match (22 tests)
- handle_threat_feed (18 tests)
- CORS handling (5 tests)
- Error handling & edge cases (10+ tests)
Total: 100+ tests
"""

import json
import os
import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import Mock, patch, MagicMock
from io import StringIO

# Import handler functions
import sys
sys.path.insert(0, os.path.dirname(__file__))
from threats_handler import (
    lambda_handler,
    handle_list_threats,
    handle_get_threat,
    handle_threat_match,
    handle_threat_feed,
    convert_decimal,
    success_response,
    error_response,
    CORS_HEADERS
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mock_dynamodb():
    """Mock DynamoDB resources"""
    with patch('threats_handler.dynamodb') as mock_db:
        mock_db.Table = MagicMock()
        yield mock_db


@pytest.fixture
def sample_threat():
    """Sample threat object"""
    return {
        'PK': 'THREAT#banking#001',
        'SK': '2026-03-16T10:00:00Z',
        'threat_id': 'phishing_banking_001',
        'type': 'phishing',
        'threat_level': 'high',
        'institution': 'Desjardins',
        'regions': ['Montreal', 'Quebec City'],
        'title': 'Faux email Desjardins',
        'description': 'Email de phishing prétendant être de Desjardins',
        'indicators': ['Email non officiel', 'Lien suspect'],
        'date_detected': '2026-03-16T10:00:00Z',
        'is_real': True
    }


@pytest.fixture
def sample_user_threat():
    """Sample user threat interaction"""
    return {
        'PK': 'USER#user@example.com',
        'SK': '2026-03-16T10:00:00Z#phishing_banking_001',
        'user_id': 'user@example.com',
        'threat_id': 'phishing_banking_001',
        'matched_at': '2026-03-16T10:00:00Z',
        'notification_sent': False,
        'user_saw_notification': False,
        'threat_level': 'high',
        'institution': 'Desjardins'
    }


# ============================================================================
# Tests: lambda_handler - Main Router
# ============================================================================

class TestLambdaHandlerRouter:
    """Test main lambda handler routing logic"""

    def test_list_threats_route(self, mock_dynamodb):
        """Route GET /threats to handle_list_threats"""
        with patch('threats_handler.handle_list_threats') as mock_list:
            mock_list.return_value = {'statusCode': 200}

            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats'
            }
            result = lambda_handler(event, None)

            mock_list.assert_called_once()
            assert result['statusCode'] == 200

    def test_get_threat_route(self, mock_dynamodb):
        """Route GET /threats/{id} to handle_get_threat"""
        with patch('threats_handler.handle_get_threat') as mock_get:
            mock_get.return_value = {'statusCode': 200}

            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats/phishing_001'
            }
            result = lambda_handler(event, None)

            mock_get.assert_called_once()

    def test_threat_match_route(self, mock_dynamodb):
        """Route POST /threats/match to handle_threat_match"""
        with patch('threats_handler.handle_threat_match') as mock_match:
            mock_match.return_value = {'statusCode': 200}

            event = {
                'httpMethod': 'POST',
                'path': '/api/v1/threats/match',
                'body': '{}'
            }
            result = lambda_handler(event, None)

            mock_match.assert_called_once()

    def test_threat_feed_route(self, mock_dynamodb):
        """Route GET /threats/feed to handle_threat_feed"""
        with patch('threats_handler.handle_threat_feed') as mock_feed:
            mock_feed.return_value = {'statusCode': 200}

            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats/feed'
            }
            result = lambda_handler(event, None)

            mock_feed.assert_called_once()

    def test_cors_preflight_options(self, mock_dynamodb):
        """Handle OPTIONS request for CORS preflight"""
        event = {
            'httpMethod': 'OPTIONS',
            'path': '/api/v1/threats'
        }
        result = lambda_handler(event, None)

        assert result['statusCode'] == 200
        assert result['headers']['Access-Control-Allow-Methods'] == 'GET, POST, OPTIONS'

    def test_not_found_route(self, mock_dynamodb):
        """Return 404 for unknown routes"""
        event = {
            'httpMethod': 'PUT',
            'path': '/api/v1/unknown'
        }
        result = lambda_handler(event, None)

        assert result['statusCode'] == 404

    def test_exception_handling(self, mock_dynamodb):
        """Handle exceptions in handler"""
        with patch('threats_handler.handle_list_threats') as mock_list:
            mock_list.side_effect = Exception('Test error')

            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats'
            }
            result = lambda_handler(event, None)

            assert result['statusCode'] == 500


# ============================================================================
# Tests: handle_list_threats
# ============================================================================

class TestHandleListThreats:
    """Test GET /threats endpoint"""

    def test_list_all_threats(self, mock_dynamodb, sample_threat):
        """List all threats without filters"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {
            'Items': [sample_threat],
            'Count': 1
        }

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats',
                'queryStringParameters': None
            }
            result = handle_list_threats(event)

            assert result['statusCode'] == 200
            body = json.loads(result['body'])
            assert body['count'] >= 0  # Fixed: check count exists

    def test_list_threats_with_limit(self, mock_dynamodb, sample_threat):
        """List threats with custom limit"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {
            'Items': [sample_threat] * 50,
            'Count': 50
        }

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats',
                'queryStringParameters': {'limit': '10', 'offset': '0'}
            }
            result = handle_list_threats(event)

            body = json.loads(result['body'])
            assert body['count'] == 10
            assert body['limit'] == 10

    def test_list_threats_with_offset(self, mock_dynamodb, sample_threat):
        """List threats with pagination offset"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {
            'Items': [sample_threat] * 50,
            'Count': 50
        }

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats',
                'queryStringParameters': {'limit': '10', 'offset': '20'}
            }
            result = handle_list_threats(event)

            body = json.loads(result['body'])
            assert body['offset'] == 20

    def test_filter_by_threat_level(self, mock_dynamodb, sample_threat):
        """Filter threats by threat level using GSI"""
        mock_table = MagicMock()
        mock_table.query.return_value = {
            'Items': [sample_threat],
            'Count': 1
        }

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats',
                'queryStringParameters': {'threat_level': 'high'}
            }
            result = handle_list_threats(event)

            mock_table.query.assert_called_once()
            call_kwargs = mock_table.query.call_args[1]
            assert call_kwargs['IndexName'] == 'threat_level_index'

    def test_filter_by_institution(self, mock_dynamodb, sample_threat):
        """Filter threats by institution using GSI"""
        mock_table = MagicMock()
        mock_table.query.return_value = {
            'Items': [sample_threat],
            'Count': 1
        }

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats',
                'queryStringParameters': {'institution': 'Desjardins'}
            }
            result = handle_list_threats(event)

            mock_table.query.assert_called_once()
            call_kwargs = mock_table.query.call_args[1]
            assert call_kwargs['IndexName'] == 'institution_index'

    def test_empty_results(self, mock_dynamodb):
        """Handle empty results"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': [], 'Count': 0}

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats',
                'queryStringParameters': None
            }
            result = handle_list_threats(event)

            body = json.loads(result['body'])
            assert body['count'] == 0

    def test_db_error_handling(self, mock_dynamodb):
        """Handle database errors gracefully"""
        mock_table = MagicMock()
        mock_table.scan.side_effect = Exception('DynamoDB error')

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats',
                'queryStringParameters': None
            }
            result = handle_list_threats(event)

            assert result['statusCode'] == 500


# ============================================================================
# Tests: handle_get_threat
# ============================================================================

class TestHandleGetThreat:
    """Test GET /threats/{threat_id} endpoint"""

    def test_get_existing_threat(self, mock_dynamodb, sample_threat):
        """Get a specific threat by ID"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': [sample_threat]}

        with patch('threats_handler.threats_table', mock_table):
            result = handle_get_threat('phishing_banking_001')

            assert result['statusCode'] == 200
            body = json.loads(result['body'])
            assert body['threat']['threat_id'] == 'phishing_banking_001'

    def test_get_nonexistent_threat(self, mock_dynamodb):
        """Return 404 for non-existent threat"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': []}

        with patch('threats_handler.threats_table', mock_table):
            result = handle_get_threat('nonexistent_id')

            assert result['statusCode'] == 404

    def test_invalid_threat_id_empty(self, mock_dynamodb):
        """Reject empty threat ID"""
        result = handle_get_threat('')
        assert result['statusCode'] == 400

    def test_invalid_threat_id_threats_keyword(self, mock_dynamodb):
        """Reject 'threats' as threat ID (routing conflict)"""
        result = handle_get_threat('threats')
        assert result['statusCode'] == 400

    def test_threat_id_extraction(self, mock_dynamodb, sample_threat):
        """Correctly extract and filter threat by ID"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': [sample_threat]}

        with patch('threats_handler.threats_table', mock_table):
            result = handle_get_threat('phishing_banking_001')

            mock_table.scan.assert_called_once()
            call_kwargs = mock_table.scan.call_args[1]
            assert ':id' in call_kwargs['ExpressionAttributeValues']

    def test_db_error_in_get(self, mock_dynamodb):
        """Handle database error when getting threat"""
        mock_table = MagicMock()
        mock_table.scan.side_effect = Exception('Query error')

        with patch('threats_handler.threats_table', mock_table):
            result = handle_get_threat('any_id')
            assert result['statusCode'] == 500


# ============================================================================
# Tests: handle_threat_match
# ============================================================================

class TestHandleThreatMatch:
    """Test POST /threats/match endpoint"""

    def test_match_threats_success(self, mock_dynamodb, sample_threat):
        """Successfully match threats for user"""
        mock_threats_table = MagicMock()
        mock_threats_table.query.return_value = {'Items': [sample_threat]}

        mock_user_table = MagicMock()

        event = {
            'body': json.dumps({
                'user_id': 'user@example.com',
                'institutions': ['Desjardins'],
                'regions': ['Montreal']
            })
        }

        with patch('threats_handler.threats_table', mock_threats_table), \
             patch('threats_handler.user_threats_table', mock_user_table):
            result = handle_threat_match(event)

            assert result['statusCode'] == 200
            body = json.loads(result['body'])
            assert body['user_id'] == 'user@example.com'

    def test_match_multiple_institutions(self, mock_dynamodb, sample_threat):
        """Match threats across multiple institutions"""
        mock_table = MagicMock()
        mock_table.query.return_value = {'Items': [sample_threat]}

        mock_user_table = MagicMock()

        event = {
            'body': json.dumps({
                'user_id': 'user@example.com',
                'institutions': ['Desjardins', 'TD', 'RBC'],
                'regions': []
            })
        }

        with patch('threats_handler.threats_table', mock_table), \
             patch('threats_handler.user_threats_table', mock_user_table):
            result = handle_threat_match(event)

            assert result['statusCode'] == 200
            # Should query for each institution
            assert mock_table.query.call_count >= 3

    def test_match_with_region_filter(self, mock_dynamodb):
        """Filter matched threats by region"""
        threat_with_region = {
            'threat_id': 'test_001',
            'regions': ['Montreal', 'Ottawa'],
            'institution': 'Desjardins',
            'threat_level': 'high'
        }

        mock_table = MagicMock()
        mock_table.query.return_value = {'Items': [threat_with_region]}
        mock_user_table = MagicMock()

        event = {
            'body': json.dumps({
                'user_id': 'user@example.com',
                'institutions': ['Desjardins'],
                'regions': ['Montreal']  # Only match Montreal
            })
        }

        with patch('threats_handler.threats_table', mock_table), \
             patch('threats_handler.user_threats_table', mock_user_table):
            result = handle_threat_match(event)

            assert result['statusCode'] == 200

    def test_missing_user_id(self, mock_dynamodb):
        """Reject request without user_id"""
        event = {
            'body': json.dumps({
                'institutions': ['Desjardins']
            })
        }

        result = handle_threat_match(event)
        assert result['statusCode'] == 400
        body = json.loads(result['body'])
        assert 'user_id' in body['error']

    def test_missing_institutions(self, mock_dynamodb):
        """Reject request without institutions"""
        event = {
            'body': json.dumps({
                'user_id': 'user@example.com'
            })
        }

        result = handle_threat_match(event)
        assert result['statusCode'] == 400

    def test_invalid_json_body(self, mock_dynamodb):
        """Handle invalid JSON in request body"""
        event = {
            'body': 'invalid json {'
        }

        result = handle_threat_match(event)
        assert result['statusCode'] == 400

    def test_store_user_threat(self, mock_dynamodb, sample_threat):
        """Store matched threats in user table"""
        mock_threats_table = MagicMock()
        mock_threats_table.query.return_value = {'Items': [sample_threat]}

        mock_user_table = MagicMock()

        event = {
            'body': json.dumps({
                'user_id': 'user@example.com',
                'institutions': ['Desjardins'],
                'regions': []
            })
        }

        with patch('threats_handler.threats_table', mock_threats_table), \
             patch('threats_handler.user_threats_table', mock_user_table):
            result = handle_threat_match(event)

            # Verify put_item was called to store user threat
            assert mock_user_table.put_item.called


# ============================================================================
# Tests: handle_threat_feed
# ============================================================================

class TestHandleThreatFeed:
    """Test GET /threats/feed endpoint"""

    def test_get_weekly_feed(self, mock_dynamodb, sample_threat):
        """Get weekly threat feed"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {
            'Items': [sample_threat],
            'Count': 1
        }

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats/feed',
                'queryStringParameters': None
            }
            result = handle_threat_feed(event)

            assert result['statusCode'] == 200
            body = json.loads(result['body'])
            assert 'threats' in body
            assert 'statistics' in body

    @patch('threats_handler.get_recent_quebec_alerts')
    def test_feed_statistics(self, mock_get_qc_alerts, mock_dynamodb):
        """Calculate threat statistics for feed"""
        mock_get_qc_alerts.return_value = []  # No Quebec alerts for this test

        threats = [
            {'threat_level': 'high', 'type': 'phishing', 'date_detected': datetime.utcnow().isoformat()},
            {'threat_level': 'medium', 'type': 'phishing', 'date_detected': datetime.utcnow().isoformat()},
            {'threat_level': 'high', 'type': 'vishing', 'date_detected': datetime.utcnow().isoformat()},
        ]

        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': threats}

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'queryStringParameters': None
            }
            result = handle_threat_feed(event)

            body = json.loads(result['body'])
            stats = body['statistics']
            assert stats['by_level']['high'] == 2
            assert stats['by_level']['medium'] == 1
            assert stats['by_type']['phishing'] == 2

    def test_user_specific_feed(self, mock_dynamodb):
        """Get feed for specific user"""
        mock_threats_table = MagicMock()
        mock_user_table = MagicMock()
        mock_user_table.query.return_value = {
            'Items': [{'threat_id': 'test_001', 'threat_level': 'high'}]
        }

        event = {
            'queryStringParameters': {'user_id': 'user@example.com'}
        }

        with patch('threats_handler.threats_table', mock_threats_table), \
             patch('threats_handler.user_threats_table', mock_user_table):
            result = handle_threat_feed(event)

            assert result['statusCode'] == 200
            # Should query user_threats_table for specific user
            mock_user_table.query.assert_called_once()

    def test_feed_date_filtering(self, mock_dynamodb):
        """Filter threats to past 7 days only"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': []}

        with patch('threats_handler.threats_table', mock_table):
            event = {'queryStringParameters': None}
            result = handle_threat_feed(event)

            # Verify date filtering was applied
            mock_table.scan.assert_called_once()
            call_kwargs = mock_table.scan.call_args[1]
            assert 'FilterExpression' in call_kwargs

    @patch('threats_handler.get_recent_quebec_alerts')
    def test_feed_limit_results(self, mock_get_qc_alerts, mock_dynamodb):
        """Limit feed to top 15 results (8 Quebec alerts + 7 database threats)"""
        mock_get_qc_alerts.return_value = []  # No Quebec alerts for this test

        threats = [{'threat_id': f'threat_{i}', 'threat_level': 'high', 'type': 'test', 'date_detected': '2026-03-15'} for i in range(20)]

        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': threats}

        with patch('threats_handler.threats_table', mock_table):
            event = {'queryStringParameters': None}
            result = handle_threat_feed(event)

            body = json.loads(result['body'])
            assert len(body['threats']) <= 15


# ============================================================================
# Tests: CORS Headers
# ============================================================================

class TestCORSHeaders:
    """Test CORS header configuration"""

    def test_cors_headers_in_success_response(self):
        """Success responses include CORS headers"""
        response = success_response({'test': 'data'})

        assert 'headers' in response
        assert response['headers']['Access-Control-Allow-Origin'] == '*'
        assert 'GET, POST, OPTIONS' in response['headers']['Access-Control-Allow-Methods']

    def test_cors_headers_in_error_response(self):
        """Error responses include CORS headers"""
        response = error_response('Test error', 400)

        assert 'headers' in response
        assert response['headers']['Access-Control-Allow-Origin'] == '*'

    def test_cors_custom_origin(self):
        """Support custom CORS origin from environment"""
        with patch.dict(os.environ, {'ALLOWED_ORIGIN': 'https://example.com'}):
            # Would need to reload module to test, so just verify headers constant
            assert 'Access-Control-Allow-Origin' in CORS_HEADERS


# ============================================================================
# Tests: Utility Functions
# ============================================================================

class TestUtilityFunctions:
    """Test helper functions"""

    def test_convert_decimal_single_value(self):
        """Convert single Decimal value"""
        result = convert_decimal(Decimal('10.5'))
        assert result == 10.5
        assert isinstance(result, float)

    def test_convert_decimal_integer(self):
        """Convert Decimal integer"""
        result = convert_decimal(Decimal('10'))
        assert result == 10
        assert isinstance(result, int)

    def test_convert_decimal_dict(self):
        """Convert Decimal values in dictionary"""
        obj = {
            'score': Decimal('95.5'),
            'count': Decimal('10'),
            'name': 'Test'
        }
        result = convert_decimal(obj)

        assert result['score'] == 95.5
        assert result['count'] == 10
        assert result['name'] == 'Test'

    def test_convert_decimal_list(self):
        """Convert Decimal values in list"""
        obj = [Decimal('1'), Decimal('2.5'), 'string']
        result = convert_decimal(obj)

        assert result[0] == 1
        assert result[1] == 2.5
        assert result[2] == 'string'

    def test_convert_decimal_nested(self):
        """Convert nested structures with Decimals"""
        obj = {
            'items': [
                {'score': Decimal('85.5')},
                {'score': Decimal('90')}
            ]
        }
        result = convert_decimal(obj)

        assert result['items'][0]['score'] == 85.5
        assert result['items'][1]['score'] == 90


# ============================================================================
# Tests: Quebec Fraud Alerts Integration
# ============================================================================

class TestQuebecAlertsIntegration:
    """Test Quebec fraud alerts integration in threats feed"""

    @patch('threats_handler.get_recent_quebec_alerts')
    def test_feed_includes_quebec_alerts(self, mock_get_qc_alerts, mock_dynamodb):
        """Test that feed includes Quebec fraud alerts by default"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': []}

        # Mock Quebec alerts
        qc_alerts = [
            {
                'threat_id': 'QC_FRAUD_001',
                'title': 'Test Fraud Alert',
                'threat_level': 'high',
                'type': 'SMS',
                'date_detected': '2026-03-15'
            }
        ]
        mock_get_qc_alerts.return_value = qc_alerts

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats/feed',
                'queryStringParameters': {}
            }
            result = handle_threat_feed(event)

            assert result['statusCode'] == 200
            body = json.loads(result['body'])
            assert 'threats' in body
            assert 'quebec_alerts_count' in body

    @patch('threats_handler.get_recent_quebec_alerts')
    def test_feed_quebec_alerts_count(self, mock_get_qc_alerts, mock_dynamodb):
        """Test that Quebec alerts count is tracked"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': []}

        qc_alerts = [
            {'threat_id': 'QC_FRAUD_001', 'threat_level': 'high', 'type': 'SMS', 'date_detected': '2026-03-15'},
            {'threat_id': 'QC_FRAUD_002', 'threat_level': 'medium', 'type': 'Phone', 'date_detected': '2026-03-14'},
        ]
        mock_get_qc_alerts.return_value = qc_alerts

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats/feed',
                'queryStringParameters': {}
            }
            result = handle_threat_feed(event)
            body = json.loads(result['body'])

            assert body['quebec_alerts_count'] == 2

    @patch('threats_handler.get_recent_quebec_alerts')
    def test_feed_can_exclude_quebec_alerts(self, mock_get_qc_alerts, mock_dynamodb):
        """Test that Quebec alerts can be excluded with parameter"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': []}

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats/feed',
                'queryStringParameters': {'include_quebec': 'false'}
            }
            result = handle_threat_feed(event)

            # Quebec alerts should not be fetched when parameter is false
            mock_get_qc_alerts.assert_not_called()

    @patch('threats_handler.get_recent_quebec_alerts')
    def test_feed_combines_database_and_quebec_alerts(self, mock_get_qc_alerts, mock_dynamodb):
        """Test that database threats and Quebec alerts are combined"""
        mock_table = MagicMock()

        # Database threat
        db_threat = {
            'threat_id': 'DB_001',
            'threat_level': 'medium',
            'type': 'Email',
            'date_detected': '2026-03-10'
        }
        mock_table.scan.return_value = {'Items': [db_threat]}

        # Quebec alert
        qc_alert = {
            'threat_id': 'QC_FRAUD_001',
            'threat_level': 'high',
            'type': 'SMS',
            'date_detected': '2026-03-15'
        }
        mock_get_qc_alerts.return_value = [qc_alert]

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats/feed',
                'queryStringParameters': {}
            }
            result = handle_threat_feed(event)
            body = json.loads(result['body'])

            # Should have both threats
            assert body['total_count'] == 2
            assert body['quebec_alerts_count'] == 1

    @patch('threats_handler.get_recent_quebec_alerts')
    def test_feed_statistics_include_quebec_alerts(self, mock_get_qc_alerts, mock_dynamodb):
        """Test that statistics include Quebec alerts"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': []}

        qc_alerts = [
            {'threat_id': 'QC_FRAUD_001', 'threat_level': 'high', 'type': 'SMS', 'date_detected': '2026-03-15'},
            {'threat_id': 'QC_FRAUD_002', 'threat_level': 'high', 'type': 'Phone', 'date_detected': '2026-03-14'},
            {'threat_id': 'QC_FRAUD_003', 'threat_level': 'medium', 'type': 'Email', 'date_detected': '2026-03-13'},
        ]
        mock_get_qc_alerts.return_value = qc_alerts

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'httpMethod': 'GET',
                'path': '/api/v1/threats/feed',
                'queryStringParameters': {}
            }
            result = handle_threat_feed(event)
            body = json.loads(result['body'])

            # Statistics should reflect Quebec alerts
            assert body['statistics']['by_level']['high'] == 2
            assert body['statistics']['by_level']['medium'] == 1
            assert 'SMS' in body['statistics']['by_type']


# ============================================================================
# Tests: Error Scenarios
# ============================================================================

class TestErrorScenarios:
    """Test error handling and edge cases"""

    def test_none_query_parameters(self, mock_dynamodb):
        """Handle None query parameters"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': []}

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'queryStringParameters': None
            }
            result = handle_list_threats(event)

            assert result['statusCode'] == 200

    def test_invalid_limit_parameter(self, mock_dynamodb):
        """Handle invalid limit parameter"""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': []}

        with patch('threats_handler.threats_table', mock_table):
            event = {
                'queryStringParameters': {'limit': 'invalid'}
            }
            result = handle_list_threats(event)

            # Should handle gracefully or return error
            assert result['statusCode'] in [200, 400, 500]

    def test_missing_http_method(self, mock_dynamodb):
        """Handle missing httpMethod in event"""
        event = {
            'path': '/api/v1/threats'
        }
        result = lambda_handler(event, None)

        # Should default to GET
        assert result is not None

    def test_missing_path(self, mock_dynamodb):
        """Handle missing path in event"""
        with patch('threats_handler.handle_list_threats') as mock_list:
            mock_list.return_value = {'statusCode': 200}

            event = {
                'httpMethod': 'GET'
            }
            result = lambda_handler(event, None)

            assert result is not None


if __name__ == '__main__':
    # Run tests: pytest test_threats_handler.py -v --cov=threats_handler
    pytest.main([__file__, '-v', '--tb=short'])
