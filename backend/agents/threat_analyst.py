"""
@Threat_Analyst Agent - Risk scoring and threat intelligence comparison
Responsibility: Score threats and compare against SQ/AMF databases
"""
import json
from datetime import datetime
from typing import Dict, Any


def handler(event, context) -> Dict[str, Any]:
    """
    Threat analysis phase:
    - Calculate risk score (0-100)
    - Compare against threat intelligence (SQ, AMF databases)
    - Identify known scam patterns
    - Flag emerging threats

    Returns: {threat_score: int, risk_level: str, risk_factors: list, match_database: dict}
    """
    try:
        cleaned_data = event.get('cleaned_data', {})
        threat_intelligence = event.get('threat_intelligence', [])
        scoring_model = event.get('scoring_model', 'v2.1')

        # Risk scoring factors
        risk_factors = []
        score = 0

        # Factor 1: Scam type risk weight
        scam_type_weights = {
            'PHISHING': 85,
            'FRAUD': 80,
            'RANSOMWARE': 95,
            'SOCIAL_ENGINEERING': 75,
            'IMPERSONATION': 80,
            'UNKNOWN': 50
        }

        scam_type = cleaned_data.get('scam_type', 'UNKNOWN')
        base_score = scam_type_weights.get(scam_type, 50)
        score += base_score / 2

        # Factor 2: Amount involved
        amount = cleaned_data.get('amount', 0)
        if amount > 10000:
            risk_factors.append('HIGH_AMOUNT')
            score += 20
        elif amount > 1000:
            risk_factors.append('MODERATE_AMOUNT')
            score += 10

        # Factor 3: Platform risk
        platform_weights = {
            'PHONE': 30,
            'EMAIL': 20,
            'SMS': 25,
            'SOCIAL_MEDIA': 15,
            'WEBSITE': 20,
            'UNKNOWN': 10
        }
        platform_score = platform_weights.get(cleaned_data.get('platform', 'UNKNOWN'), 10)
        score += platform_score / 2

        # Factor 4: Threat intelligence match
        match_database = {
            'SQ_database': False,
            'AMF_alerts': False,
            'international_watchlist': False
        }

        # Simulated database match
        if 'bank' in cleaned_data.get('description', '').lower():
            match_database['SQ_database'] = True
            risk_factors.append('MATCHES_SQ_KNOWN_SCAM')
            score += 15

        if amount > 5000:
            match_database['AMF_alerts'] = True
            risk_factors.append('MATCHES_AMF_PATTERN')
            score += 10

        # Calculate final score
        threat_score = min(100, int(score))

        # Risk level classification
        if threat_score >= 80:
            risk_level = 'CRITICAL'
        elif threat_score >= 60:
            risk_level = 'HIGH'
        elif threat_score >= 40:
            risk_level = 'MODERATE'
        else:
            risk_level = 'LOW'

        return {
            'threat_score': threat_score,
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'match_database': match_database,
            'scoring_model': scoring_model,
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'ANALYZED',
            'confidence': 0.85
        }

    except Exception as e:
        raise {
            'error': str(e),
            'threat_score': 0,
            'status': 'ANALYSIS_FAILED'
        }


if __name__ == '__main__':
    test_event = {
        'cleaned_data': {
            'scam_type': 'PHISHING',
            'amount': 5000,
            'platform': 'PHONE',
            'description': '[PHONE_REDACTED] claiming to be from bank'
        },
        'threat_intelligence': ['SQ_database', 'AMF_alerts'],
        'scoring_model': 'v2.1'
    }
    print(json.dumps(handler(test_event, {}), indent=2))
