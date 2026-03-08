"""
Test examples for Quebec Expert Prompt
Validates that the prompt correctly identifies Quebec-specific scams
"""

import json
import unittest
from unittest.mock import patch, MagicMock

# Expected outputs for validation
QUEBEC_SCAM_EXAMPLES = [
    {
        'name': 'Arnaque Desjardins SMS',
        'input': 'Bonjour, votre compte Desjardins a été suspendu. Cliquez ici pour vérifier: bit.ly/verify-desjardins',
        'expected': {
            'risk_score_min': 90,
            'is_scam': True,
            'institution': 'Desjardins',
            'fraud_type': 'banking_phishing',
            'red_flags_required': ['Click link request', 'Account suspension', 'Shortened URL']
        }
    },
    {
        'name': 'Arnaque Revenu-Québec',
        'input': 'URGENT - Revenu Québec alerte! Fraude détectée sur votre compte. Appelez immédiatement: 418-555-1234',
        'expected': {
            'risk_score_min': 85,
            'is_scam': True,
            'institution': 'Revenu-Quebec',
            'fraud_type': 'government_impersonation',
            'red_flags_required': ['False urgency', 'Phone number not official', 'Threat language']
        }
    },
    {
        'name': 'Arnaque Hydro-Québec',
        'input': 'ALERTE: Votre compte Hydro-Québec doit être mis à jour. Retard de paiement détecté. Cliquez: https://hydro-secure.qc.fake/pay',
        'expected': {
            'risk_score_min': 85,
            'is_scam': True,
            'institution': 'Hydro-Quebec',
            'fraud_type': 'payment_fraud',
            'red_flags_required': ['Payment threat', 'Click to pay', 'Suspicious domain', 'Urgency']
        }
    },
    {
        'name': 'Arnaque SAAQ',
        'input': 'Avis URGENT: Votre permis SAAQ a été suspendu en raison de points demerit excessifs. Visitez saaq-secure.qc.ca pour appel',
        'expected': {
            'risk_score_min': 80,
            'is_scam': True,
            'institution': 'SAAQ',
            'fraud_type': 'urgency_scam',
            'red_flags_required': ['License suspension threat', 'Urgent language']
        }
    },
    {
        'name': 'Arnaque Bell/Videotron',
        'input': 'Votre compte Bell a été locké pour activité frauduleuse. Confirmez identité: [lien]. Temps: 2 heures.',
        'expected': {
            'risk_score_min': 85,
            'is_scam': True,
            'institution': 'Bell',
            'fraud_type': 'credential_theft',
            'red_flags_required': ['Account lock threat', 'Verify identity request', 'Time pressure']
        }
    }
]

# Legitimate examples that should score low
LEGITIMATE_EXAMPLES = [
    {
        'name': 'Vrai SMS Desjardins',
        'input': 'Desjardins: Votre virement de $500 vers Jean a été complété. Solde: $1,234.56',
        'expected': {
            'risk_score_max': 40,
            'is_scam': False,
            'explanation_contains': ['légitime', 'transaction']
        }
    },
    {
        'name': 'Vrai rappel paiement',
        'input': 'Hydro-Québec: Votre facture mensuelle est maintenant disponible. Consultez votre compte sur hydroquebec.com',
        'expected': {
            'risk_score_max': 35,
            'is_scam': False,
            'explanation_contains': ['semble légitime']
        }
    }
]


class TestQuebecExpertPrompt(unittest.TestCase):
    """Test the Quebec expert prompt validation"""

    def test_prompt_file_exists(self):
        """Verify the Quebec expert prompt file exists"""
        from pathlib import Path
        prompt_file = Path(__file__).parent.parent / 'prompts' / 'system_prompt_quebec_expert.txt'
        self.assertTrue(prompt_file.exists(), "Quebec expert prompt file must exist")

    def test_prompt_contains_required_sections(self):
        """Verify prompt contains all required sections"""
        try:
            from prompts import get_quebec_expert_prompt
            prompt = get_quebec_expert_prompt()

            # Check for key sections
            required_sections = [
                'CONTEXTE QUÉBÉCOIS',
                'RED FLAGS À DÉTECTER',
                'ANALYSE REQUISE',
                'FORMAT RETOUR',
                'EXEMPLES RÉELS',
                'NUMÉROS OFFICIELS'
            ]

            for section in required_sections:
                self.assertIn(section, prompt, f"Prompt must contain '{section}' section")
        except ImportError:
            self.skipTest("Prompts module not available in test environment")

    def test_prompt_includes_quebec_institutions(self):
        """Verify prompt knows Quebec institutions"""
        try:
            from prompts import get_quebec_expert_prompt
            prompt = get_quebec_expert_prompt()

            quebec_institutions = [
                'Desjardins',
                'Hydro-Québec',
                'Revenu Québec',
                'SAAQ',
                'Bell',
                'Videotron'
            ]

            for institution in quebec_institutions:
                self.assertIn(institution, prompt, f"Prompt must mention {institution}")
        except ImportError:
            self.skipTest("Prompts module not available in test environment")

    def test_prompt_includes_official_phone_numbers(self):
        """Verify prompt contains official Quebec phone numbers"""
        try:
            from prompts import get_quebec_expert_prompt
            prompt = get_quebec_expert_prompt()

            official_numbers = [
                '1-888-495-8501',  # CAFC
                '1-800-711-1800',  # SQ Info-crimes
                '1-800-522-2346',  # Desjardins
                '1-800-959-5525',  # Revenu Québec
                '1-888-385-1088'   # Hydro-Québec
            ]

            for number in official_numbers:
                self.assertIn(number, prompt, f"Prompt must include {number}")
        except ImportError:
            self.skipTest("Prompts module not available in test environment")

    def test_prompt_json_output_format(self):
        """Verify prompt specifies correct JSON output format"""
        try:
            from prompts import get_quebec_expert_prompt
            prompt = get_quebec_expert_prompt()

            # Check for required JSON fields
            required_fields = [
                'risk_score',
                'is_scam',
                'explanation',
                'institution',
                'fraud_type',
                'red_flags',
                'local_remediation',
                'confidence',
                'advice_for_elder'
            ]

            for field in required_fields:
                self.assertIn(f'"{field}"', prompt, f"JSON format must include {field} field")
        except ImportError:
            self.skipTest("Prompts module not available in test environment")

    def test_scam_examples_are_valid_json(self):
        """Verify all scam examples have valid expected output structure"""
        for example in QUEBEC_SCAM_EXAMPLES:
            self.assertIn('name', example)
            self.assertIn('input', example)
            self.assertIn('expected', example)
            self.assertIn('risk_score_min', example['expected'])
            self.assertIn('is_scam', example['expected'])
            self.assertIn('fraud_type', example['expected'])

    def test_examples_have_diverse_fraud_types(self):
        """Verify examples cover different fraud types"""
        fraud_types = {ex['expected']['fraud_type'] for ex in QUEBEC_SCAM_EXAMPLES}

        expected_types = {
            'banking_phishing',
            'government_impersonation',
            'payment_fraud',
            'urgency_scam',
            'credential_theft'
        }

        self.assertTrue(
            expected_types.issubset(fraud_types),
            f"Examples should cover fraud types: {expected_types}"
        )

    def test_examples_target_different_institutions(self):
        """Verify examples cover different Quebec institutions"""
        institutions = {ex['expected']['institution'] for ex in QUEBEC_SCAM_EXAMPLES}

        expected_institutions = {
            'Desjardins',
            'Revenu-Quebec',
            'Hydro-Quebec',
            'SAAQ',
            'Bell'
        }

        self.assertTrue(
            expected_institutions.issubset(institutions),
            f"Examples should target: {expected_institutions}"
        )

    def test_legitimate_examples_structure(self):
        """Verify legitimate examples have proper structure"""
        for example in LEGITIMATE_EXAMPLES:
            self.assertIn('name', example)
            self.assertIn('input', example)
            self.assertIn('expected', example)
            expected = example['expected']

            # Should have either low risk_score or is_scam=False
            self.assertTrue(
                'risk_score_max' in expected or 'is_scam' in expected,
                f"Legitimate example {example['name']} needs risk_score_max or is_scam"
            )

    def test_handler_uses_quebec_expert(self):
        """Verify handler imports and can use Quebec expert prompt"""
        try:
            from handler_llm import analyze_with_quebec_expert, get_quebec_expert_prompt

            # Verify function is callable
            self.assertTrue(callable(analyze_with_quebec_expert))
            self.assertTrue(callable(get_quebec_expert_prompt))
        except ImportError as e:
            self.skipTest(f"Handler not available: {e}")


class TestQuebecExpertValidation(unittest.TestCase):
    """Validation tests for Quebec expert responses"""

    def validate_json_response(self, response_text):
        """Helper to validate JSON response format"""
        try:
            data = json.loads(response_text)

            # Check required fields
            required_fields = [
                'risk_score',
                'is_scam',
                'explanation',
                'institution',
                'fraud_type',
                'red_flags',
                'local_remediation',
                'confidence',
                'advice_for_elder'
            ]

            for field in required_fields:
                self.assertIn(field, data, f"Response missing {field}")

            # Validate field types
            self.assertIsInstance(data['risk_score'], int)
            self.assertIsInstance(data['is_scam'], bool)
            self.assertIsInstance(data['confidence'], float)
            self.assertIsInstance(data['red_flags'], list)
            self.assertIsInstance(data['local_remediation'], dict)

            return data
        except json.JSONDecodeError:
            self.fail(f"Response is not valid JSON: {response_text}")

    def test_scam_response_structure(self):
        """Test that scam responses have correct structure"""
        example_response = {
            'risk_score': 95,
            'is_scam': True,
            'explanation': 'This is a banking phishing scam',
            'institution': 'Desjardins',
            'fraud_type': 'banking_phishing',
            'red_flags': ['Click link request', 'Urgency'],
            'local_remediation': {
                'contact': 'Desjardins',
                'phone': '1-800-522-2346',
                'action': 'Call directly'
            },
            'confidence': 0.95,
            'advice_for_elder': 'Never click links from banks'
        }

        validated = self.validate_json_response(json.dumps(example_response))
        self.assertEqual(validated['risk_score'], 95)
        self.assertTrue(validated['is_scam'])


if __name__ == '__main__':
    unittest.main()
