"""
Tests for SQ/CAFC Alerts Polling Service
"""

import unittest
import json
from datetime import datetime
from unittest.mock import patch, MagicMock

# Mock boto3 before importing
import sys
sys.modules['boto3'] = MagicMock()


class TestAlertsPoller(unittest.TestCase):
    """Test AlertsPoller functionality"""

    def test_poller_initialization(self):
        """Test that AlertsPoller initializes correctly"""
        try:
            from alerts_poller import AlertsPoller
            poller = AlertsPoller()

            self.assertIsNotNone(poller)
            self.assertEqual(poller.processed_count, 0)
            self.assertEqual(poller.new_alerts_count, 0)
            self.assertEqual(poller.duplicate_count, 0)
        except ImportError:
            self.skipTest("alerts_poller not available")

    def test_mock_alerts_structure(self):
        """Test that mock alerts have correct structure"""
        try:
            from alerts_poller import AlertsPoller
            poller = AlertsPoller()

            # Check CAFC alerts
            self.assertGreater(len(poller.MOCK_CAFC_ALERTS), 0)
            for alert in poller.MOCK_CAFC_ALERTS:
                required_fields = [
                    'id', 'type', 'institution', 'title',
                    'description_fr', 'threat_level', 'date',
                    'keywords', 'regions', 'action'
                ]
                for field in required_fields:
                    self.assertIn(field, alert, f"CAFC alert missing {field}")

            # Check SQ alerts
            self.assertGreater(len(poller.MOCK_SQ_ALERTS), 0)
            for alert in poller.MOCK_SQ_ALERTS:
                for field in required_fields:
                    self.assertIn(field, alert, f"SQ alert missing {field}")

        except ImportError:
            self.skipTest("alerts_poller not available")

    def test_alert_threat_levels(self):
        """Test that all alerts have valid threat levels"""
        try:
            from alerts_poller import AlertsPoller
            poller = AlertsPoller()

            all_alerts = poller.MOCK_CAFC_ALERTS + poller.MOCK_SQ_ALERTS
            valid_levels = ['low', 'medium', 'high']

            for alert in all_alerts:
                self.assertIn(alert['threat_level'], valid_levels,
                            f"Invalid threat level: {alert['threat_level']}")

        except ImportError:
            self.skipTest("alerts_poller not available")

    def test_alert_fraud_types(self):
        """Test that all alerts have valid fraud types"""
        try:
            from alerts_poller import AlertsPoller
            poller = AlertsPoller()

            all_alerts = poller.MOCK_CAFC_ALERTS + poller.MOCK_SQ_ALERTS
            valid_types = [
                'banking_phishing',
                'government_impersonation',
                'urgency_scam',
                'credential_theft',
                'payment_fraud',
                'telecom_fraud',
                'other'
            ]

            for alert in all_alerts:
                self.assertIn(alert['type'], valid_types,
                            f"Invalid fraud type: {alert['type']}")

        except ImportError:
            self.skipTest("alerts_poller not available")

    def test_alert_ids_are_unique(self):
        """Test that all alert IDs are unique"""
        try:
            from alerts_poller import AlertsPoller
            poller = AlertsPoller()

            all_alerts = poller.MOCK_CAFC_ALERTS + poller.MOCK_SQ_ALERTS
            alert_ids = [alert['id'] for alert in all_alerts]

            self.assertEqual(len(alert_ids), len(set(alert_ids)),
                           "Duplicate alert IDs found")

        except ImportError:
            self.skipTest("alerts_poller not available")

    def test_alert_ids_have_correct_prefix(self):
        """Test that alert IDs have correct source prefixes"""
        try:
            from alerts_poller import AlertsPoller
            poller = AlertsPoller()

            for alert in poller.MOCK_CAFC_ALERTS:
                self.assertTrue(alert['id'].startswith('CAFC-'),
                              f"CAFC alert ID wrong: {alert['id']}")

            for alert in poller.MOCK_SQ_ALERTS:
                self.assertTrue(alert['id'].startswith('SQ-'),
                              f"SQ alert ID wrong: {alert['id']}")

        except ImportError:
            self.skipTest("alerts_poller not available")

    def test_alert_regions_are_valid_qc(self):
        """Test that alert regions are valid Quebec regions"""
        try:
            from alerts_poller import AlertsPoller
            poller = AlertsPoller()

            valid_regions = {
                'Montreal', 'Quebec', 'Gatineau', 'Hull',
                'Sherbrooke', 'Trois-Rivières', 'Laval'
            }

            all_alerts = poller.MOCK_CAFC_ALERTS + poller.MOCK_SQ_ALERTS
            for alert in all_alerts:
                regions = set(alert.get('regions', []))
                invalid = regions - valid_regions

                self.assertEqual(len(invalid), 0,
                               f"Invalid regions in {alert['id']}: {invalid}")

        except ImportError:
            self.skipTest("alerts_poller not available")

    def test_alert_keywords_are_lists(self):
        """Test that keywords are proper list structures"""
        try:
            from alerts_poller import AlertsPoller
            poller = AlertsPoller()

            all_alerts = poller.MOCK_CAFC_ALERTS + poller.MOCK_SQ_ALERTS
            for alert in all_alerts:
                self.assertIsInstance(alert['keywords'], list,
                                    f"Keywords not a list in {alert['id']}")
                self.assertGreater(len(alert['keywords']), 0,
                                 f"No keywords in {alert['id']}")

        except ImportError:
            self.skipTest("alerts_poller not available")


class TestAlertsSchema(unittest.TestCase):
    """Test AlertsTable schema management"""

    @patch('boto3.resource')
    def test_table_config_structure(self, mock_dynamodb):
        """Test that table configuration is valid"""
        try:
            from alerts_schema import ALERTS_TABLE_CONFIG

            # Check required sections
            self.assertIn('AttributeDefinitions', ALERTS_TABLE_CONFIG)
            self.assertIn('KeySchema', ALERTS_TABLE_CONFIG)
            self.assertIn('BillingMode', ALERTS_TABLE_CONFIG)
            self.assertIn('StreamSpecification', ALERTS_TABLE_CONFIG)
            self.assertIn('TimeToLiveSpecification', ALERTS_TABLE_CONFIG)

            # Check attributes
            attrs = ALERTS_TABLE_CONFIG['AttributeDefinitions']
            attr_names = {attr['AttributeName'] for attr in attrs}
            self.assertIn('alert_id', attr_names)
            self.assertIn('date_detected', attr_names)

        except ImportError:
            self.skipTest("alerts_schema not available")

    @patch('boto3.resource')
    def test_alerts_table_initialization(self, mock_dynamodb):
        """Test AlertsTable initializes correctly"""
        try:
            from alerts_schema import AlertsTable
            table = AlertsTable()

            self.assertIsNotNone(table)
            self.assertEqual(table.ALERTS_TABLE_NAME, 'Alerts_QC')

        except ImportError:
            self.skipTest("alerts_schema not available")

    @patch('boto3.resource')
    def test_valid_threat_levels(self, mock_dynamodb):
        """Test that valid threat levels are correct"""
        try:
            from alerts_schema import AlertsTable
            table = AlertsTable()

            expected = {'low', 'medium', 'high'}
            actual = set(table.VALID_THREAT_LEVELS)

            self.assertEqual(actual, expected)

        except ImportError:
            self.skipTest("alerts_schema not available")

    @patch('boto3.resource')
    def test_valid_fraud_types(self, mock_dynamodb):
        """Test that valid fraud types are comprehensive"""
        try:
            from alerts_schema import AlertsTable
            table = AlertsTable()

            self.assertGreater(len(table.VALID_FRAUD_TYPES), 5)
            self.assertIn('banking_phishing', table.VALID_FRAUD_TYPES)
            self.assertIn('government_impersonation', table.VALID_FRAUD_TYPES)

        except ImportError:
            self.skipTest("alerts_schema not available")

    @patch('boto3.resource')
    def test_valid_sources(self, mock_dynamodb):
        """Test that valid sources are correct"""
        try:
            from alerts_schema import AlertsTable
            table = AlertsTable()

            expected = {'CAFC', 'SQ', 'INTERNAL'}
            actual = set(table.VALID_SOURCES)

            self.assertEqual(actual, expected)

        except ImportError:
            self.skipTest("alerts_schema not available")


class TestAlertsIntegration(unittest.TestCase):
    """Integration tests for alerts system"""

    def test_alert_has_all_required_fields(self):
        """Test that example alerts have all required fields"""
        try:
            from alerts_poller import AlertsPoller

            poller = AlertsPoller()
            sample_alert = poller.MOCK_CAFC_ALERTS[0]

            required_for_storage = [
                'id', 'type', 'institution', 'threat_level',
                'description_fr', 'keywords'
            ]

            for field in required_for_storage:
                self.assertIn(field, sample_alert,
                            f"Alert missing: {field}")

        except ImportError:
            self.skipTest("alerts_poller not available")

    def test_quebec_institutions_coverage(self):
        """Test that alerts cover major Quebec institutions"""
        try:
            from alerts_poller import AlertsPoller

            poller = AlertsPoller()
            all_alerts = poller.MOCK_CAFC_ALERTS + poller.MOCK_SQ_ALERTS

            institutions = {alert['institution'] for alert in all_alerts}

            # Should cover major institutions
            major_institutions = {
                'Desjardins',
                'Hydro-Quebec',
                'Revenu-Quebec'
            }

            for institution in major_institutions:
                self.assertIn(institution, institutions,
                            f"Coverage missing: {institution}")

        except ImportError:
            self.skipTest("alerts_poller not available")


if __name__ == '__main__':
    unittest.main()
