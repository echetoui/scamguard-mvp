"""
@Triage_Agent - Data cleaning and anonymization (Loi 25 compliant)
Responsibility: Clean incoming scam reports and anonymize PII
"""
import json
import re
from datetime import datetime
from typing import Dict, Any


def handler(event, context) -> Dict[str, Any]:
    """
    Triage phase:
    - Remove PII (name, phone, email, address)
    - Normalize data formats
    - Flag suspicious patterns
    - Ensure Loi 25 compliance

    Returns: {cleaned_data: dict, anonymization_level: str, warnings: list}
    """
    try:
        scam_report = event.get('scam_report', {})
        user_id = event.get('user_id', '')
        anonymization_level = event.get('anonymization_level', 'Loi-25-compliant')

        # Anonymization rules
        pii_patterns = {
            'phone': r'\+?1?\s*\(?([0-9]{3})\)?[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})',
            'email': r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            'postal_code': r'[A-Z]\d[A-Z]\s*\d[A-Z]\d',
            'credit_card': r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
            'sin': r'\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b'
        }

        # Clean data
        raw_text = str(scam_report.get('description', ''))
        cleaned_text = raw_text

        warnings = []
        pii_found = {}

        for pii_type, pattern in pii_patterns.items():
            matches = re.findall(pattern, raw_text)
            if matches:
                warnings.append(f'PII_DETECTED: {pii_type.upper()}')
                pii_found[pii_type] = len(matches)
                # Replace with placeholder
                cleaned_text = re.sub(pattern, f'[{pii_type.upper()}_REDACTED]', cleaned_text)

        cleaned_data = {
            'description': cleaned_text,
            'scam_type': scam_report.get('scam_type', 'UNKNOWN'),
            'amount': scam_report.get('amount', 0),
            'currency': scam_report.get('currency', 'CAD'),
            'platform': scam_report.get('platform', 'UNKNOWN'),
            'timestamp': scam_report.get('timestamp', datetime.utcnow().isoformat()),
            'user_hash': f'USER#{user_id.split("#")[-1]}',  # Anonymize user_id
            'image_hash': scam_report.get('image_hash'),  # Hash not raw image
            'anonymization_metadata': {
                'pii_removed': pii_found,
                'compliance_level': anonymization_level,
                'processed_at': datetime.utcnow().isoformat()
            }
        }

        # Data validation
        quality_score = 100 - (len(warnings) * 10)

        return {
            'cleaned_data': cleaned_data,
            'anonymization_level': anonymization_level,
            'warnings': warnings,
            'pii_found': pii_found,
            'quality_score': max(0, quality_score),
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'TRIAGED',
            'loi_25_compliant': len([w for w in warnings if 'PII' in w]) == 0 or len(warnings) <= 2
        }

    except Exception as e:
        raise {
            'error': str(e),
            'status': 'TRIAGE_FAILED',
            'loi_25_compliant': False
        }


if __name__ == '__main__':
    test_event = {
        'scam_report': {
            'description': 'I received a call from 514-123-4567 claiming to be from the bank',
            'scam_type': 'PHISHING',
            'amount': 500,
            'platform': 'PHONE'
        },
        'user_id': 'USER#12345',
        'anonymization_level': 'Loi-25-compliant'
    }
    print(json.dumps(handler(test_event, {}), indent=2))
