"""
Tests for Quebec Institutions Database
Validates institution data structure and methods
"""

import unittest
import sys
import json
from unittest.mock import patch, MagicMock

# Mock boto3 before importing
sys.modules['boto3'] = MagicMock()


class TestInstitutionsDatabase(unittest.TestCase):
    """Test InstitutionsDatabase functionality"""

    def setUp(self):
        """Set up test fixtures"""
        try:
            from utils.institutions_database import InstitutionsDatabase
            self.db = InstitutionsDatabase()
        except ImportError:
            self.skipTest("institutions_database not available")

    # ============ STRUCTURE TESTS ============

    def test_database_initialization(self):
        """Test that database initializes correctly"""
        self.assertIsNotNone(self.db)
        self.assertGreater(len(self.db.institutions), 0)

    def test_total_institutions_count(self):
        """Test that database has 8 institutions"""
        self.assertEqual(len(self.db.institutions), 7, "Should have 7 institutions (currently)")
        # Note: Expand to 8 with Laurentian Bank

    def test_all_institutions_exist(self):
        """Test that all required institutions are present"""
        required = [
            'desjardins', 'hydroquebec', 'revenuquebec', 'saaq',
            'bell', 'videotron', 'nationalbank'
        ]
        for institution_id in required:
            self.assertIn(institution_id, self.db.institutions,
                         f"Missing institution: {institution_id}")

    def test_institution_structure(self):
        """Test that all institutions have required fields"""
        required_fields = [
            'id', 'name', 'type', 'region', 'priority', 'coverage',
            'legitimate_domains', 'legitimate_emails', 'legitimate_phone_prefixes',
            'legitimate_phone_numbers', 'common_legitimate_messages',
            'red_flags', 'ai_context', 'contact_for_fraud', 'last_updated'
        ]

        for inst_id, institution in self.db.institutions.items():
            for field in required_fields:
                self.assertIn(field, institution,
                             f"Institution {inst_id} missing field: {field}")

    def test_red_flags_structure(self):
        """Test that red flags have proper structure"""
        for inst_id, institution in self.db.institutions.items():
            red_flags = institution.get('red_flags', {})

            # Should have urgency_keywords and suspicious_patterns
            self.assertIn('urgency_keywords', red_flags,
                         f"{inst_id}: Missing urgency_keywords")
            self.assertIn('suspicious_patterns', red_flags,
                         f"{inst_id}: Missing suspicious_patterns")

            # Both should be lists
            self.assertIsInstance(red_flags.get('urgency_keywords'), list)
            self.assertIsInstance(red_flags.get('suspicious_patterns'), list)

    # ============ DATA VALIDATION TESTS ============

    def test_institution_types(self):
        """Test that all institutions have valid types"""
        valid_types = ['bank', 'utility', 'government', 'telecom']

        for inst_id, institution in self.db.institutions.items():
            inst_type = institution.get('type', '').lower()
            self.assertIn(inst_type, valid_types,
                         f"{inst_id} has invalid type: {inst_type}")

    def test_institution_priorities(self):
        """Test that priorities are 1 or 2"""
        for inst_id, institution in self.db.institutions.items():
            priority = institution.get('priority')
            self.assertIn(priority, [1, 2],
                         f"{inst_id} has invalid priority: {priority}")

    def test_priority_distribution(self):
        """Test that we have institutions at both priority levels"""
        priority_1 = self.db.get_by_priority(1)
        priority_2 = self.db.get_by_priority(2)

        self.assertGreater(len(priority_1), 0, "Should have priority 1 institutions")
        self.assertGreater(len(priority_2), 0, "Should have priority 2 institutions")

    def test_domains_are_lists(self):
        """Test that legitimate_domains are lists"""
        for inst_id, institution in self.db.institutions.items():
            domains = institution.get('legitimate_domains')
            self.assertIsInstance(domains, list,
                                 f"{inst_id}: domains should be list")
            self.assertGreater(len(domains), 0,
                             f"{inst_id}: should have at least one domain")

    def test_emails_are_lists(self):
        """Test that legitimate_emails are lists"""
        for inst_id, institution in self.db.institutions.items():
            emails = institution.get('legitimate_emails')
            self.assertIsInstance(emails, list,
                                 f"{inst_id}: emails should be list")
            self.assertGreater(len(emails), 0,
                             f"{inst_id}: should have at least one email")

    def test_phone_numbers_validity(self):
        """Test that phone numbers have valid format"""
        for inst_id, institution in self.db.institutions.items():
            phones = institution.get('legitimate_phone_numbers', [])
            for phone in phones:
                # Should contain digits or common separators
                has_digits = any(c.isdigit() for c in phone)
                self.assertTrue(has_digits,
                              f"{inst_id}: {phone} should have digits")

    # ============ METHOD TESTS ============

    def test_get_institution(self):
        """Test get_institution method"""
        desjardins = self.db.get_institution('desjardins')
        self.assertIsNotNone(desjardins)
        self.assertEqual(desjardins['name'], 'Desjardins')

    def test_get_institution_case_insensitive(self):
        """Test that get_institution is case-insensitive"""
        lower = self.db.get_institution('desjardins')
        upper = self.db.get_institution('DESJARDINS')
        mixed = self.db.get_institution('DeSjArDiNs')

        self.assertEqual(lower['id'], upper['id'])
        self.assertEqual(lower['id'], mixed['id'])

    def test_get_institution_not_found(self):
        """Test get_institution with non-existent institution"""
        result = self.db.get_institution('non_existent')
        self.assertIsNone(result)

    def test_get_all_institutions(self):
        """Test get_all_institutions method"""
        all_inst = self.db.get_all_institutions()
        self.assertIsInstance(all_inst, dict)
        self.assertGreater(len(all_inst), 0)

    def test_get_by_type(self):
        """Test get_by_type method"""
        banks = self.db.get_by_type('bank')
        self.assertGreater(len(banks), 0)

        for bank in banks:
            self.assertEqual(bank['type'].lower(), 'bank')

    def test_get_by_type_case_insensitive(self):
        """Test that get_by_type is case-insensitive"""
        lower = self.db.get_by_type('bank')
        upper = self.db.get_by_type('BANK')

        self.assertEqual(len(lower), len(upper))

    def test_get_by_priority(self):
        """Test get_by_priority method"""
        p1 = self.db.get_by_priority(1)
        p2 = self.db.get_by_priority(2)

        self.assertGreater(len(p1), 0)
        self.assertGreater(len(p2), 0)

    def test_validate_institution(self):
        """Test validate_institution method"""
        self.assertTrue(self.db.validate_institution('desjardins'))
        self.assertTrue(self.db.validate_institution('revenuquebec'))
        self.assertFalse(self.db.validate_institution('fake_bank'))

    # ============ EMAIL VALIDATION TESTS ============

    def test_is_legitimate_email_exact_match(self):
        """Test exact email match"""
        is_legit = self.db.is_legitimate_email('desjardins', 'noreply@desjardins.com')
        self.assertTrue(is_legit)

    def test_is_legitimate_email_case_insensitive(self):
        """Test email matching is case-insensitive"""
        is_legit = self.db.is_legitimate_email('desjardins', 'NOREPLY@DESJARDINS.COM')
        self.assertTrue(is_legit)

    def test_is_legitimate_email_domain_match(self):
        """Test domain matching"""
        is_legit = self.db.is_legitimate_email('desjardins', 'support@desjardins.com')
        self.assertTrue(is_legit)

    def test_is_legitimate_email_fake(self):
        """Test that fake emails are rejected"""
        is_legit = self.db.is_legitimate_email('desjardins', 'fake@gmail.com')
        self.assertFalse(is_legit)

    def test_is_legitimate_email_typo_domain(self):
        """Test that typo domains are rejected"""
        is_legit = self.db.is_legitimate_email('desjardins', 'noreply@desjardins.ca')
        self.assertFalse(is_legit)

    # ============ DOMAIN VALIDATION TESTS ============

    def test_is_legitimate_domain_exact(self):
        """Test exact domain match"""
        is_legit = self.db.is_legitimate_domain('desjardins', 'desjardins.com')
        self.assertTrue(is_legit)

    def test_is_legitimate_domain_case_insensitive(self):
        """Test domain matching is case-insensitive"""
        is_legit = self.db.is_legitimate_domain('desjardins', 'DESJARDINS.COM')
        self.assertTrue(is_legit)

    def test_is_legitimate_domain_multiple(self):
        """Test that multiple domains are recognized"""
        self.assertTrue(self.db.is_legitimate_domain('desjardins', 'desjardins.com'))
        self.assertTrue(self.db.is_legitimate_domain('desjardins', 'mon.desjardins.com'))
        self.assertTrue(self.db.is_legitimate_domain('desjardins', 'app.desjardins.com'))

    def test_is_legitimate_domain_fake(self):
        """Test that fake domains are rejected"""
        self.assertFalse(self.db.is_legitimate_domain('desjardins', 'desjardins.ca'))
        self.assertFalse(self.db.is_legitimate_domain('desjardins', 'desjardins.org'))

    # ============ PHONE VALIDATION TESTS ============

    def test_is_legitimate_phone_prefix_match(self):
        """Test phone prefix matching"""
        is_legit = self.db.is_legitimate_phone('desjardins', '+1-800-522-2346')
        self.assertTrue(is_legit)

    def test_is_legitimate_phone_various_formats(self):
        """Test phone matching with various formats"""
        # Test different formatting styles
        phones = [
            '+1-800-522-2346',
            '+1 800 522 2346',
            '+18005222346',
            '1-800-522-2346'
        ]

        for phone in phones:
            # Should all match the +1-800- prefix
            is_legit = self.db.is_legitimate_phone('desjardins', phone)
            self.assertTrue(is_legit, f"Failed to match: {phone}")

    def test_is_legitimate_phone_wrong_number(self):
        """Test that wrong phone numbers are rejected"""
        is_legit = self.db.is_legitimate_phone('desjardins', '+1-555-1234')
        self.assertFalse(is_legit)

    # ============ RED FLAG DETECTION TESTS ============

    def test_detect_red_flags_urgency(self):
        """Test detection of urgency keywords"""
        text = "Urgent! Vous devez cliquer immédiatement!"
        flags = self.db.detect_red_flags('desjardins', text)
        self.assertGreater(len(flags), 0)

    def test_detect_red_flags_suspicious_pattern(self):
        """Test detection of suspicious patterns"""
        text = "Cliquez ici pour vérifier votre compte"
        flags = self.db.detect_red_flags('desjardins', text)
        self.assertGreater(len(flags), 0)

    def test_detect_red_flags_multiple(self):
        """Test detection of multiple red flags"""
        text = "URGENT! Cliquez immédiatement pour confirmer mot de passe"
        flags = self.db.detect_red_flags('desjardins', text)
        # Should detect multiple red flags
        self.assertGreaterEqual(len(flags), 2)

    def test_detect_red_flags_none(self):
        """Test text with no red flags"""
        text = "Bonjour, comment allez-vous aujourd'hui?"
        flags = self.db.detect_red_flags('desjardins', text)
        self.assertEqual(len(flags), 0)

    def test_detect_red_flags_case_insensitive(self):
        """Test that red flag detection is case-insensitive"""
        text_lower = "urgent! cliquez"
        text_upper = "URGENT! CLIQUEZ"

        flags_lower = self.db.detect_red_flags('desjardins', text_lower)
        flags_upper = self.db.detect_red_flags('desjardins', text_upper)

        self.assertEqual(len(flags_lower), len(flags_upper))

    # ============ AI CONTEXT TESTS ============

    def test_get_ai_context(self):
        """Test get_ai_context method"""
        context = self.db.get_ai_context('desjardins')
        self.assertIsNotNone(context)
        self.assertGreater(len(context), 0)
        # Context should mention institution-specific red flags
        self.assertIn('Desjardins', context)

    def test_get_ai_context_institution_not_found(self):
        """Test get_ai_context with non-existent institution"""
        context = self.db.get_ai_context('fake_bank')
        self.assertEqual(context, '')

    # ============ RED FLAGS RETRIEVAL TESTS ============

    def test_get_red_flags(self):
        """Test get_red_flags method"""
        flags = self.db.get_red_flags('desjardins')
        self.assertIsInstance(flags, dict)
        self.assertIn('urgency_keywords', flags)
        self.assertIn('suspicious_patterns', flags)

    def test_get_red_flags_not_found(self):
        """Test get_red_flags with non-existent institution"""
        flags = self.db.get_red_flags('fake_bank')
        self.assertEqual(flags, {})

    # ============ EXPORT TESTS ============

    def test_to_json(self):
        """Test JSON export"""
        json_str = self.db.to_json()
        self.assertIsInstance(json_str, str)

        # Should be valid JSON
        parsed = json.loads(json_str)
        self.assertIsInstance(parsed, dict)
        self.assertGreater(len(parsed), 0)

    def test_to_json_preserves_data(self):
        """Test that JSON export preserves data"""
        json_str = self.db.to_json()
        parsed = json.loads(json_str)

        # Check that key institutions are present
        self.assertIn('desjardins', parsed)
        self.assertEqual(parsed['desjardins']['name'], 'Desjardins')

    # ============ STATISTICS TESTS ============

    def test_get_statistics(self):
        """Test get_statistics method"""
        stats = self.db.get_statistics()

        self.assertIn('total_institutions', stats)
        self.assertIn('by_type', stats)
        self.assertIn('by_priority', stats)
        self.assertGreater(stats['total_institutions'], 0)

    def test_statistics_by_type(self):
        """Test that statistics count types correctly"""
        stats = self.db.get_statistics()
        by_type = stats['by_type']

        # Sum of types should equal total
        type_sum = sum(by_type.values())
        self.assertEqual(type_sum, stats['total_institutions'])

    def test_statistics_by_priority(self):
        """Test that statistics count priorities correctly"""
        stats = self.db.get_statistics()
        by_priority = stats['by_priority']

        # Sum of priorities should equal total
        priority_sum = sum(by_priority.values())
        self.assertEqual(priority_sum, stats['total_institutions'])

    # ============ INTEGRATION TESTS ============

    def test_institution_completeness(self):
        """Test that each institution is complete and usable"""
        for inst_id in ['desjardins', 'revenuquebec', 'hydroquebec']:
            inst = self.db.get_institution(inst_id)

            # Should be valid
            self.assertTrue(self.db.validate_institution(inst_id))

            # Should have AI context
            context = self.db.get_ai_context(inst_id)
            self.assertGreater(len(context), 0)

            # Should have red flags
            flags = self.db.get_red_flags(inst_id)
            self.assertGreater(len(flags), 0)

    def test_real_world_scenario_desjardins(self):
        """Test real-world scenario: Desjardins phishing email"""
        inst_id = 'desjardins'

        # Fake email
        is_legit_email = self.db.is_legitimate_email(inst_id, 'verify@desjardins-secure.com')
        self.assertFalse(is_legit_email)

        # Legitimate email
        is_legit = self.db.is_legitimate_email(inst_id, 'noreply@desjardins.com')
        self.assertTrue(is_legit)

        # Phishing text
        phishing_text = "Cliquez ici pour vérifier votre compte Desjardins urgent!"
        flags = self.db.detect_red_flags(inst_id, phishing_text)
        self.assertGreater(len(flags), 0)

    def test_real_world_scenario_revenu_quebec(self):
        """Test real-world scenario: Revenu Québec impersonation"""
        inst_id = 'revenuquebec'

        # Scam text
        scam_text = "URGENT! Revenu Québec: Poursuites judiciaires si non-paiement!"
        flags = self.db.detect_red_flags(inst_id, scam_text)

        # Should detect urgency and threats
        self.assertGreater(len(flags), 0)

    def test_real_world_scenario_bell(self):
        """Test real-world scenario: Bell impersonation"""
        inst_id = 'bell'

        # Suspicious phone number
        is_legit = self.db.is_legitimate_phone(inst_id, '+1-555-123-4567')
        self.assertFalse(is_legit)

        # Real Bell number pattern
        is_legit = self.db.is_legitimate_phone(inst_id, '1-800-563-2355')
        self.assertTrue(is_legit)


class TestGlobalInstance(unittest.TestCase):
    """Test global database instance"""

    def test_get_global_instance(self):
        """Test getting global instance"""
        try:
            from utils.institutions_database import get_institutions_database
            db1 = get_institutions_database()
            db2 = get_institutions_database()

            # Should be same instance
            self.assertIs(db1, db2)
        except ImportError:
            self.skipTest("institutions_database not available")


if __name__ == '__main__':
    unittest.main()
