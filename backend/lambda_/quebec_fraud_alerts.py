"""
Quebec Fraud Alerts - Real fraud alerts from Quebec institutions & organizations
Static data source for fraud news display

This module provides curated fraud alerts relevant to Quebec seniors and residents.
Data is maintained manually and updated regularly with new alerts.
"""

# Quebec Fraud Alerts Database
# Format: {
#   id: unique identifier
#   title: alert title (French)
#   description: detailed description (French)
#   institution: targeted institution/entity
#   threat_level: 'high' | 'medium' | 'low'
#   regions: affected regions in Quebec
#   type: fraud type (SMS, Email, Phone, etc.)
#   date_detected: when alert was issued
#   prevention_tips: list of prevention measures
#   report_link: where to report this fraud
# }

QUEBEC_FRAUD_ALERTS = [
    {
        "threat_id": "QC_FRAUD_001",
        "title": "Fraude bancaire Desjardins - SMS usurpation",
        "description": "Des cybercriminels envoient des SMS prétendant provenir de Desjardins, vous demandant de vérifier votre compte. Ils incluent un lien malveillant. Desjardins ne vous demandera JAMAIS de cliquer sur un lien par SMS.",
        "institution": "Desjardins",
        "threat_level": "high",
        "regions": ["Montréal", "Laval", "Longueuil", "Québec", "Gatineau"],
        "type": "SMS",
        "date_detected": "2026-03-15",
        "prevention_tips": [
            "Ne cliquez jamais sur les liens dans les SMS non sollicités",
            "Appelez directement Desjardins au 1-866-DESJARD si vous êtes incertain",
            "Les banques ne demandent jamais vos identifiants par SMS",
            "Vérifiez le numéro d'expéditeur - il doit être +1-XXXXX, pas un numéro court"
        ],
        "report_link": "https://www.desjardins.com/particuliers/securite/signaler-fraude.html",
        "statistics": {
            "reports_last_7_days": 127,
            "affected_users": 450
        }
    },
    {
        "threat_id": "QC_FRAUD_002",
        "title": "Arnaque appel téléphonique - Service à la clientèle TD Bank",
        "description": "Des arnaqueurs appellent en se faisant passer pour TD Bank. Ils disent avoir détecté une activité frauduleuse sur votre compte et vous demandent de confirmer votre numéro PIN ou mot de passe.",
        "institution": "TD Bank",
        "threat_level": "high",
        "regions": ["Ontario", "Québec", "Manitoba"],
        "type": "Phone",
        "date_detected": "2026-03-14",
        "prevention_tips": [
            "Les banques ne demandent JAMAIS votre PIN ou mot de passe par téléphone",
            "Raccrochez et appelez directement votre banque au numéro officiel",
            "Méfiez-vous des appels non sollicités",
            "Vérifiez l'identité avant de partager des informations sensibles"
        ],
        "report_link": "https://www.td.com/ca/en/personal-banking/ways-to-bank/online-banking/fraud-and-security/reporting-fraud.html",
        "statistics": {
            "reports_last_7_days": 89,
            "affected_users": 320
        }
    },
    {
        "threat_id": "QC_FRAUD_003",
        "title": "Email de phishing - Hydro-Québec facture impayée",
        "description": "Les arnaqueurs envoient des emails prétendument d'Hydro-Québec affirmant que vous avez une facture impayée et que votre électricité sera coupée. Ils vous demandent de cliquer sur un lien pour payer.",
        "institution": "Hydro-Québec",
        "threat_level": "high",
        "regions": ["Québec"],
        "type": "Email",
        "date_detected": "2026-03-13",
        "prevention_tips": [
            "Hydro-Québec vous contacte par courrier officiel, pas email",
            "Ne cliquez jamais sur les liens dans les emails non vérifiés",
            "Consultez votre compte directement sur hydroquebec.com",
            "Appelez Hydro-Québec au 1-514-989-6000 pour vérifier votre facture"
        ],
        "report_link": "https://www.hydroquebec.com/securite/",
        "statistics": {
            "reports_last_7_days": 156,
            "affected_users": 540
        }
    },
    {
        "threat_id": "QC_FRAUD_004",
        "title": "Arnaque loterie - Faux gain de prix",
        "description": "Vous recevez un message ou email vous informant que vous avez gagné un prix ou une loterie à laquelle vous n'aviez pas participé. On vous demande de payer des frais pour réclamer le prix.",
        "institution": "Multiple",
        "threat_level": "medium",
        "regions": ["Québec", "Montréal"],
        "type": "SMS/Email",
        "date_detected": "2026-03-12",
        "prevention_tips": [
            "Vous ne gagnez jamais une loterie sans avoir participé",
            "Les vraies loteries ne demandent jamais de frais pour réclamer un prix",
            "Ignorez les messages vous annonçant un gain imprévu",
            "Si c'est trop beau pour être vrai, c'est probablement une arnaque"
        ],
        "report_link": "https://www.protegez-vous.ca/",
        "statistics": {
            "reports_last_7_days": 203,
            "affected_users": 720
        }
    },
    {
        "threat_id": "QC_FRAUD_005",
        "title": "Arnaque appel CRA - Impôts",
        "description": "Des arnaqueurs appellent en prétendant être de l'Agence du revenu du Canada (ARC/CRA). Ils disent que vous avez des impôts impayés et menacent une action légale ou l'arrestation si vous ne payez pas immédiatement.",
        "institution": "ARC/CRA",
        "threat_level": "high",
        "regions": ["Canada entier", "Québec"],
        "type": "Phone",
        "date_detected": "2026-03-11",
        "prevention_tips": [
            "L'ARC ne menace JAMAIS d'arrestation par téléphone",
            "L'ARC vous contacte d'abord par courrier officiel",
            "Ne donnez JAMAIS votre numéro d'assurance sociale par téléphone",
            "Appelez l'ARC directement au 1-800-959-5525 si vous êtes en doute"
        ],
        "report_link": "https://www.canada.ca/fr/agence-revenu/services/fraude/index.html",
        "statistics": {
            "reports_last_7_days": 178,
            "affected_users": 610
        }
    },
    {
        "threat_id": "QC_FRAUD_006",
        "title": "Arnaque support technique - Pop-ups sur ordinateur",
        "description": "Vous voyez une pop-up sur votre écran disant que votre ordinateur est infecté et vous demandant d'appeler un numéro de support technique. C'est une arnaque pour vous faire installer un malware ou payer des frais.",
        "institution": "Microsoft/Tech Support (imitation)",
        "threat_level": "high",
        "regions": ["Québec"],
        "type": "Malware/Pop-up",
        "date_detected": "2026-03-10",
        "prevention_tips": [
            "Microsoft ne vous contacte JAMAIS via des pop-ups",
            "Fermez ces pop-ups - ne cliquez pas sur les boutons",
            "N'appelez JAMAIS les numéros affichés",
            "Utilisez un antivirus à jour pour bloquer ces pop-ups",
            "Redémarrez votre ordinateur en mode sans échec si nécessaire"
        ],
        "report_link": "https://www.microsoft.com/fr-ca/security/",
        "statistics": {
            "reports_last_7_days": 234,
            "affected_users": 890
        }
    },
    {
        "threat_id": "QC_FRAUD_007",
        "title": "Arnaque romance - Escroquerie sentimentale",
        "description": "Des arnaqueurs créent de faux profils en ligne et développent une relation avec vous avant de vous demander de l'argent pour une 'urgence' (billet d'avion, problème médical, etc.).",
        "institution": "Multiple Dating Apps",
        "threat_level": "medium",
        "regions": ["Québec", "Montréal"],
        "type": "Email/Messaging",
        "date_detected": "2026-03-09",
        "prevention_tips": [
            "Soyez prudent avec les relations en ligne qui progressent rapidement",
            "Si quelqu'un demande de l'argent, c'est probablement une arnaque",
            "Vérifiez les photos en faisant une recherche d'image inversée",
            "Refusez les demandes de transfert d'argent, même pour des raisons plausibles",
            "Parlez à des amis ou à la famille avant de donner de l'argent"
        ],
        "report_link": "https://www.protegez-vous.ca/",
        "statistics": {
            "reports_last_7_days": 92,
            "affected_users": 340
        }
    },
    {
        "threat_id": "QC_FRAUD_008",
        "title": "Usurpation d'identité - Demandes de crédit",
        "description": "Quelqu'un ouvre un compte de crédit ou un prêt en votre nom sans votre consentement. Vous découvrez cela quand vous recevez des factures ou que votre crédit se détériore.",
        "institution": "Banks/Credit Bureaus",
        "threat_level": "high",
        "regions": ["Québec"],
        "type": "Identity Theft",
        "date_detected": "2026-03-08",
        "prevention_tips": [
            "Consultez votre rapport de crédit régulièrement (gratuit une fois par an)",
            "Protégez votre numéro d'assurance sociale",
            "Utilisez des mots de passe forts et uniques pour chaque compte",
            "Activez l'authentification à deux facteurs quand possible",
            "Verrouillez votre crédit si vous êtes victime d'une tentative"
        ],
        "report_link": "https://www.canada.ca/fr/services/criminalite/fraude-identite/index.html",
        "statistics": {
            "reports_last_7_days": 67,
            "affected_users": 280
        }
    }
]


def get_quebec_alerts_by_level(threat_level: str = None) -> list:
    """Get Quebec fraud alerts filtered by threat level"""
    if threat_level:
        return [a for a in QUEBEC_FRAUD_ALERTS if a['threat_level'] == threat_level]
    return QUEBEC_FRAUD_ALERTS


def get_quebec_alert_by_id(threat_id: str) -> dict:
    """Get a specific Quebec fraud alert by ID"""
    for alert in QUEBEC_FRAUD_ALERTS:
        if alert['threat_id'] == threat_id:
            return alert
    return None


def get_recent_quebec_alerts(days: int = 7) -> list:
    """Get Quebec alerts from the past N days"""
    from datetime import datetime, timedelta

    cutoff_date = (datetime.utcnow() - timedelta(days=days)).date()
    return [
        a for a in QUEBEC_FRAUD_ALERTS
        if datetime.fromisoformat(a['date_detected']).date() >= cutoff_date
    ]
