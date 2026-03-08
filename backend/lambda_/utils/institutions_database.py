"""
Quebec Institutions Database
Stores legitimate communication patterns for 8 major Quebec institutions
Used by AI to improve scam detection accuracy
"""

import json
from typing import Dict, List, Optional
from datetime import datetime


class InstitutionsDatabase:
    """Manages institution data and legitimate communication patterns"""

    INSTITUTIONS = {
        # PRIORITY 1: Banks
        "desjardins": {
            "id": "desjardins",
            "name": "Desjardins",
            "type": "bank",
            "region": "Quebec",
            "priority": 1,
            "coverage": "Largest cooperative bank in Quebec",

            "legitimate_domains": [
                "desjardins.com",
                "mon.desjardins.com",
                "moinsjeune.desjardins.com",
                "mail.desjardins.com",
                "app.desjardins.com"
            ],

            "legitimate_emails": [
                "noreply@desjardins.com",
                "support@desjardins.com",
                "service@desjardins.com",
                "contact@desjardins.com"
            ],

            "legitimate_phone_prefixes": [
                "+1-800-522-",  # Main line
                "+1-514-",      # Montreal
                "+1-418-",      # Quebec City
                "+1-819-",      # Mauricie
                "+1-450-",      # Laurentians
            ],

            "legitimate_phone_numbers": [
                "1-800-522-DESJARDINS (1-800-522-2346)",
                "1-800-CAISSE (1-800-222-4773)"
            ],

            "common_legitimate_messages": [
                "Activer votre compte",
                "Confirmer votre identité",
                "Mettre à jour vos coordonnées",
                "Nouvelle limite de crédit approuvée",
                "Renouvellement de votre carte",
                "Vérifier une transaction",
                "Accès à votre compte établi",
                "Promotion exclusive pour vous"
            ],

            "red_flags": {
                "urgency_keywords": [
                    "urgent",
                    "immédiatement",
                    "action requise",
                    "À faire tout de suite",
                    "Dépêchez-vous",
                    "Deadline: 24h",
                    "Urgent: avant demain"
                ],

                "suspicious_patterns": [
                    "Cliquez ici pour vérifier",
                    "Confirmer votre mot de passe",
                    "Entrer vos identifiants",
                    "Vérifier vos numéros de carte",
                    "Mettre à jour vos informations personnelles",
                    "Compte suspendu",
                    "Activité inhabituelle détectée",
                    "Veuillez confirmer...",
                    "Cliquez pour plus de détails"
                ],

                "url_red_flags": [
                    "bit.ly",
                    "tinyurl",
                    "shortened URLs",
                    "desjardins.org",
                    "desjardins.ca (not .com)",
                    "desjardin.com (typo)"
                ]
            },

            "ai_context": "Desjardins NEVER asks to click links or confirm passwords via SMS. Legitimate Desjardins communications are always from @desjardins.com domains. Check if sender is in legitimate_emails list.",

            "contact_for_fraud": "1-800-522-2346",

            "last_updated": "2026-02-18"
        },

        # PRIORITY 1: Utilities
        "hydroquebec": {
            "id": "hydroquebec",
            "name": "Hydro-Québec",
            "type": "utility",
            "region": "Quebec",
            "priority": 1,
            "coverage": "Provincial electricity provider",

            "legitimate_domains": [
                "hydroquebec.com",
                "portail.hydroquebec.com",
                "app.hydroquebec.com",
                "mail.hydroquebec.com"
            ],

            "legitimate_emails": [
                "noreply@hydroquebec.com",
                "service@hydroquebec.com",
                "support@hydroquebec.com",
                "contact@hydroquebec.com"
            ],

            "legitimate_phone_prefixes": [
                "+1-514-",
                "+1-418-",
                "+1-819-",
                "+1-450-",
                "+1-888-"
            ],

            "legitimate_phone_numbers": [
                "1-888-385-3792 (Customer Service)",
                "1-514-287-6555 (Montreal)"
            ],

            "common_legitimate_messages": [
                "Votre consommation est élevée",
                "Avis d'augmentation tarifaire",
                "Renouvellement de votre contrat",
                "Relevé de compte disponible",
                "Nouveau service disponible pour vous",
                "Programme d'efficacité énergétique",
                "Paiement détecté",
                "Invitation à participer à un sondage"
            ],

            "red_flags": {
                "urgency_keywords": [
                    "coupe de service immédiate",
                    "déconnexion urgente",
                    "paiement immédiat",
                    "action requise TODAY",
                    "Coupure prévue demain"
                ],

                "suspicious_patterns": [
                    "Cliquer pour éviter coupure",
                    "Paiement par iTunes card",
                    "Paiement par carte-cadeau",
                    "Envoyer argent rapidement",
                    "Cliquez ici immédiatement",
                    "Compte sera fermé",
                    "Activité suspecte détectée",
                    "Vous devez confirmer..."
                ],

                "url_red_flags": [
                    "hydro.quebec.com (typo)",
                    "hydroquebec.ca",
                    "hydroquebec.org",
                    "shortened URLs"
                ]
            },

            "ai_context": "Hydro-Québec NEVER sends urgent SMS demanding payment. Legitimate bills are sent by mail. Check for legitimate domain and phone number.",

            "contact_for_fraud": "1-888-385-3792",

            "last_updated": "2026-02-18"
        },

        # PRIORITY 1: Government
        "revenuquebec": {
            "id": "revenuquebec",
            "name": "Revenu Québec",
            "type": "government",
            "region": "Quebec",
            "priority": 1,
            "coverage": "Quebec tax authority (linked to CRA)",

            "legitimate_domains": [
                "revenuquebec.ca",
                "cra-arc.gc.ca",
                "servicecanada.gc.ca"
            ],

            "legitimate_emails": [
                "noreply@revenuquebec.ca",
                "information@revenuquebec.ca",
                "servicecanada@servicecanada.gc.ca"
            ],

            "legitimate_phone_prefixes": [
                "+1-418-",
                "+1-514-",
                "+1-1-800-"
            ],

            "legitimate_phone_numbers": [
                "1-800-959-5525 (Revenu Québec)",
                "1-800-959-8281 (Impôt)",
                "1-888-745-6487 (CRA)"
            ],

            "common_legitimate_messages": [
                "Votre déclaration est prête",
                "Votre remboursement a été envoyé",
                "Mise à jour de vos informations",
                "Nouvelle cotisation disponible",
                "Paiement reçu",
                "Relance fiscale",
                "Avis de cotisation",
                "Important: Document d'impôt"
            ],

            "red_flags": {
                "urgency_keywords": [
                    "action légale",
                    "poursuites judiciaires",
                    "arrestation imminente",
                    "mandat d'arrêt",
                    "paiement immédiat",
                    "sinon...",
                    "mandat CRA"
                ],

                "suspicious_patterns": [
                    "Cliquez pour vérifier",
                    "Entrer vos numéros SIN",
                    "Confirmer votre identité",
                    "Aller à servicecanada.gc.com (typo)",
                    "Paiement par cartes-cadeaux",
                    "Envoyer argent maintenant",
                    "Appel d'une fausse agence",
                    "Menaces de saisie"
                ],

                "url_red_flags": [
                    "revenuquebec.org",
                    "revenuquebec.com",
                    "cra.gc.ca (typo)",
                    "servicecanada.com (typo)"
                ]
            },

            "ai_context": "CRITICAL: Revenu Québec/CRA NEVER calls first with threats. Real notices come by mail. ALWAYS be suspicious of phone calls claiming to be from tax authorities.",

            "contact_for_fraud": "1-800-959-5525",

            "last_updated": "2026-02-18"
        },

        # PRIORITY 1: Government
        "saaq": {
            "id": "saaq",
            "name": "SAAQ (Société de l'assurance automobile du Québec)",
            "type": "government",
            "region": "Quebec",
            "priority": 1,
            "coverage": "Quebec auto insurance authority",

            "legitimate_domains": [
                "saaq.gouv.qc.ca",
                "immatriculation.gouv.qc.ca"
            ],

            "legitimate_emails": [
                "noreply@saaq.gouv.qc.ca",
                "service@saaq.gouv.qc.ca"
            ],

            "legitimate_phone_prefixes": [
                "+1-418-",
                "+1-514-",
                "+1-888-"
            ],

            "legitimate_phone_numbers": [
                "1-800-361-7227 (SAAQ Main)",
                "1-800-636-7381 (Service clientèle)"
            ],

            "common_legitimate_messages": [
                "Votre permis expire bientôt",
                "Renouvellement de votre immatriculation",
                "Nouvelle assurance automobile",
                "Avis de révision médicale",
                "Document d'assurance disponible",
                "Résultat de test de conduite",
                "Modification à votre dossier"
            ],

            "red_flags": {
                "urgency_keywords": [
                    "suspension immédiate",
                    "permis révoqué",
                    "amende de 1000$",
                    "action légale",
                    "court date",
                    "pénalité importante"
                ],

                "suspicious_patterns": [
                    "Cliquez pour renouveler",
                    "Paiement urgent requis",
                    "Envoyer copie de permis",
                    "Envoyer carte crédit",
                    "Confirmer numéro d'assurance",
                    "Télécharger formulaire",
                    "Contacter agent immédiatement"
                ],

                "url_red_flags": [
                    "saaq.qc.ca (typo)",
                    "saaq.gouv.ca",
                    "immatriculation.qc.ca"
                ]
            },

            "ai_context": "SAAQ never asks for payment by gift card or urgent wire transfer. Official correspondence comes by registered mail. Verify phone numbers against official 1-800 numbers.",

            "contact_for_fraud": "1-800-361-7227",

            "last_updated": "2026-02-18"
        },

        # PRIORITY 2: Telecommunications
        "bell": {
            "id": "bell",
            "name": "Bell Canada",
            "type": "telecom",
            "region": "Canada",
            "priority": 2,
            "coverage": "Major telecom provider across Canada",

            "legitimate_domains": [
                "bell.ca",
                "bellaliant.ca",
                "bellmts.ca"
            ],

            "legitimate_emails": [
                "noreply@bell.ca",
                "support@bell.ca",
                "service@bell.ca"
            ],

            "legitimate_phone_prefixes": [
                "+1-514-",
                "+1-416-",
                "+1-800-",
                "+1-866-"
            ],

            "legitimate_phone_numbers": [
                "1-800-563-2355 (Fraud Department)",
                "1-800-268-4080 (Customer Service)"
            ],

            "common_legitimate_messages": [
                "Votre facturation a changé",
                "Nouveau service disponible",
                "Offre exclusive pour vous",
                "Renouvellement de contrat",
                "Service technique disponible",
                "Mise à jour de compte",
                "Paiement reçu"
            ],

            "red_flags": {
                "urgency_keywords": [
                    "service sera coupé",
                    "déconnexion demain",
                    "paiement immédiat",
                    "action requise maintenant"
                ],

                "suspicious_patterns": [
                    "Cliquez pour renouveler",
                    "Paiement par iTunes",
                    "Confirmer numéro de compte",
                    "Mettre à jour informations bancaires",
                    "Envoyer donnees card"
                ]
            },

            "ai_context": "Bell has legitimate SMS alerts about bills. Verify domain and phone number. Never ask for password or SIN.",

            "contact_for_fraud": "1-800-563-2355",

            "last_updated": "2026-02-18"
        },

        # PRIORITY 2: Banks
        "nationalbank": {
            "id": "nationalbank",
            "name": "National Bank of Canada",
            "type": "bank",
            "region": "Quebec",
            "priority": 2,
            "coverage": "Major bank with strong Quebec presence",

            "legitimate_domains": [
                "nbc.ca",
                "nationalbank.ca",
                "app.nationalbank.ca"
            ],

            "legitimate_emails": [
                "noreply@nbc.ca",
                "service@nbc.ca"
            ],

            "legitimate_phone_prefixes": [
                "+1-514-",
                "+1-800-"
            ],

            "legitimate_phone_numbers": [
                "1-800-387-9449 (Fraud - 24/7)",
                "1-514-394-8888 (Main)"
            ],

            "common_legitimate_messages": [
                "Vérifier une transaction",
                "Alerte de sécurité",
                "Renouvellement de carte",
                "Limite de crédit augmentée",
                "Offre bancaire spéciale"
            ],

            "red_flags": {
                "urgency_keywords": [
                    "compte fermé",
                    "accès bloqué",
                    "action immédiate"
                ],

                "suspicious_patterns": [
                    "Cliquez pour vérifier",
                    "Confirmez mot de passe",
                    "Numéro de carte requis"
                ]
            },

            "ai_context": "National Bank never asks for passwords via email/SMS. Always call their fraud line if suspicious.",

            "contact_for_fraud": "1-800-387-9449",

            "last_updated": "2026-02-18"
        },

        # PRIORITY 2: Telecommunications (Quebec-specific)
        "videotron": {
            "id": "videotron",
            "name": "Videotron",
            "type": "telecom",
            "region": "Quebec",
            "priority": 2,
            "coverage": "Quebec-based telecom and cable provider",

            "legitimate_domains": [
                "videotron.com",
                "app.videotron.com"
            ],

            "legitimate_emails": [
                "noreply@videotron.com",
                "service@videotron.com"
            ],

            "legitimate_phone_prefixes": [
                "+1-514-",
                "+1-418-",
                "+1-888-"
            ],

            "legitimate_phone_numbers": [
                "1-888-926-8338 (Fraud)",
                "1-514-524-1010 (Montreal)"
            ],

            "common_legitimate_messages": [
                "Facturation mise à jour",
                "Promotion exclusive",
                "Service technique",
                "Renouvellement de service",
                "Mise à jour de compte"
            ],

            "red_flags": {
                "urgency_keywords": [
                    "service coupe demain",
                    "paiement urgent"
                ],

                "suspicious_patterns": [
                    "Cliquez immédiatement",
                    "Confirmez informations"
                ]
            },

            "ai_context": "Videotron is Quebec-specific. Verify phone numbers and domains carefully.",

            "contact_for_fraud": "1-888-926-8338",

            "last_updated": "2026-02-18"
        }
    }

    def __init__(self):
        """Initialize institutions database"""
        self.institutions = self.INSTITUTIONS
        self.loaded_at = datetime.utcnow().isoformat()

    def get_institution(self, institution_id: str) -> Optional[Dict]:
        """
        Get institution by ID

        Args:
            institution_id: Institution identifier (lowercase, e.g., 'desjardins')

        Returns:
            Institution dictionary or None if not found
        """
        return self.institutions.get(institution_id.lower())

    def get_all_institutions(self) -> Dict:
        """Get all institutions"""
        return self.institutions

    def get_by_type(self, institution_type: str) -> List[Dict]:
        """
        Get all institutions by type

        Args:
            institution_type: Type (bank, utility, government, telecom)

        Returns:
            List of institutions
        """
        return [
            inst for inst in self.institutions.values()
            if inst['type'].lower() == institution_type.lower()
        ]

    def get_by_priority(self, priority: int) -> List[Dict]:
        """
        Get institutions by priority

        Args:
            priority: Priority level (1 or 2)

        Returns:
            List of institutions sorted by priority
        """
        return [
            inst for inst in self.institutions.values()
            if inst['priority'] == priority
        ]

    def validate_institution(self, institution_id: str) -> bool:
        """Check if institution exists and is valid"""
        institution = self.get_institution(institution_id)
        if not institution:
            return False

        # Validate required fields
        required_fields = [
            'name', 'type', 'legitimate_domains', 'legitimate_emails',
            'common_legitimate_messages', 'red_flags', 'ai_context'
        ]

        return all(field in institution for field in required_fields)

    def get_ai_context(self, institution_id: str) -> str:
        """
        Get AI context/prompt for institution

        Args:
            institution_id: Institution identifier

        Returns:
            AI context string for the institution
        """
        institution = self.get_institution(institution_id)
        if not institution:
            return ""

        return institution.get('ai_context', '')

    def get_red_flags(self, institution_id: str) -> Dict:
        """
        Get red flags for an institution

        Args:
            institution_id: Institution identifier

        Returns:
            Dictionary with red flags
        """
        institution = self.get_institution(institution_id)
        if not institution:
            return {}

        return institution.get('red_flags', {})

    def is_legitimate_email(self, institution_id: str, email: str) -> bool:
        """
        Check if email is legitimate for institution

        Args:
            institution_id: Institution identifier
            email: Email address to verify

        Returns:
            True if email is in legitimate_emails list
        """
        institution = self.get_institution(institution_id)
        if not institution:
            return False

        email_lower = email.lower()
        legitimate_emails = institution.get('legitimate_emails', [])

        # Exact match
        if email_lower in [e.lower() for e in legitimate_emails]:
            return True

        # Domain match (if starts with known email prefix)
        for legit_email in legitimate_emails:
            if email_lower.endswith(legit_email.split('@')[1]):
                return True

        return False

    def is_legitimate_domain(self, institution_id: str, domain: str) -> bool:
        """
        Check if domain is legitimate for institution

        Args:
            institution_id: Institution identifier
            domain: Domain to verify

        Returns:
            True if domain is in legitimate_domains list
        """
        institution = self.get_institution(institution_id)
        if not institution:
            return False

        domain_lower = domain.lower()
        legitimate_domains = institution.get('legitimate_domains', [])

        return domain_lower in [d.lower() for d in legitimate_domains]

    def is_legitimate_phone(self, institution_id: str, phone: str) -> bool:
        """
        Check if phone number matches legitimate prefixes

        Args:
            institution_id: Institution identifier
            phone: Phone number to verify

        Returns:
            True if phone matches legitimate prefixes
        """
        institution = self.get_institution(institution_id)
        if not institution:
            return False

        phone_clean = phone.replace('-', '').replace(' ', '').replace('.', '').replace('+', '')
        legitimate_prefixes = institution.get('legitimate_phone_prefixes', [])

        for prefix in legitimate_prefixes:
            prefix_clean = prefix.replace('-', '').replace(' ', '').replace('+', '')
            if phone_clean.startswith(prefix_clean):
                return True

        return False

    def detect_red_flags(self, institution_id: str, text: str) -> List[str]:
        """
        Detect red flags in text for specific institution

        Args:
            institution_id: Institution identifier
            text: Text to analyze

        Returns:
            List of detected red flags
        """
        institution = self.get_institution(institution_id)
        if not institution:
            return []

        red_flags = institution.get('red_flags', {})
        text_lower = text.lower()
        detected = []

        # Check urgency keywords
        for keyword in red_flags.get('urgency_keywords', []):
            if keyword.lower() in text_lower:
                detected.append(f"Urgency keyword: {keyword}")

        # Check suspicious patterns
        for pattern in red_flags.get('suspicious_patterns', []):
            if pattern.lower() in text_lower:
                detected.append(f"Suspicious pattern: {pattern}")

        return detected

    def to_json(self) -> str:
        """Export institutions database as JSON"""
        return json.dumps(self.institutions, indent=2, ensure_ascii=False)

    def get_statistics(self) -> Dict:
        """Get statistics about institutions database"""
        return {
            "total_institutions": len(self.institutions),
            "by_type": {
                "bank": len(self.get_by_type("bank")),
                "utility": len(self.get_by_type("utility")),
                "government": len(self.get_by_type("government")),
                "telecom": len(self.get_by_type("telecom"))
            },
            "by_priority": {
                1: len(self.get_by_priority(1)),
                2: len(self.get_by_priority(2))
            },
            "loaded_at": self.loaded_at
        }


# Global instance for easy access
_database_instance = None


def get_institutions_database() -> InstitutionsDatabase:
    """Get or create global institutions database instance"""
    global _database_instance
    if _database_instance is None:
        _database_instance = InstitutionsDatabase()
    return _database_instance
