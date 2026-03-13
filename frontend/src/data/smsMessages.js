/**
 * SMS Messages for Simulator Training
 * Phase 2 Sprint 5 - Real SMS scam examples
 *
 * Data sources: Sûreté du Québec, CAFC, user submissions
 * All messages anonymized: removed phone numbers, bank names replaced with [BANK]
 */

export const SMS_MESSAGES = [
  // EASY LEVEL (1-4 difficulty) - Obvious scams
  {
    id: 'sms-001',
    text: 'Cliquez ici maintenant!!! URGENT!!!',
    anonymized: true,
    source: 'user',
    category: 'phishing',
    difficulty: 'easy',
    threatLevel: 3,
    correctResponse: 'delete',
    redFlags: ['Multiple exclamation marks', 'Urgency language', 'Suspicious link'],
    explanation:
      'Les vrais messages ne demandent jamais des actions urgentes avec autant de points d\'exclamation. C\'est un signal classique d\'arnaque.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-002',
    text: 'GAGNANT!!! Vous avez gagné 10,000$ - Cliquez pour réclamer',
    anonymized: true,
    source: 'CAFC',
    category: 'prize_scam',
    difficulty: 'easy',
    threatLevel: 2,
    correctResponse: 'delete',
    redFlags: ['Prize claim', 'Unsolicited', 'Too good to be true'],
    explanation:
      'Si vous n\'avez pas participé à un concours, c\'est une arnaque. Les vrais gagnants sont contactés par courrier, pas SMS.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-003',
    text: 'Vérifiez votre compte maintenant!!! Cliquez: bit.ly/verify123',
    anonymized: true,
    source: 'SQ',
    category: 'phishing',
    difficulty: 'easy',
    threatLevel: 4,
    correctResponse: 'delete',
    redFlags: ['Shortened URL', 'Urgency', 'Account verification claim'],
    explanation:
      'Les banques ne demandent JAMAIS de vérifier votre compte par SMS. C\'est une tactique classique de phishing.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-004',
    text: 'Votre colis est arrivé! Tracez-le ici: amazon-tracking.xyz',
    anonymized: true,
    source: 'CAFC',
    category: 'delivery_scam',
    difficulty: 'easy',
    threatLevel: 3,
    correctResponse: 'delete',
    redFlags: ['Fake domain', 'Unsolicited tracking', 'Generic message'],
    explanation:
      'Amazon envoie toujours des notifications depuis amazon.com, jamais depuis des domaines bizarres. Allez directement sur amazon.ca pour vérifier votre commande.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-005',
    text: 'APPEL GRATUIT pour gagner un iPhone 15! Cliquez maintenant!',
    anonymized: true,
    source: 'user',
    category: 'prize_scam',
    difficulty: 'easy',
    threatLevel: 2,
    correctResponse: 'delete',
    redFlags: ['Prize offer', 'Free gift', 'Too good to be true'],
    explanation:
      'Aucune compagnie légitime ne donne des iPhone gratuits par SMS. C\'est toujours une arnaque.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  // MEDIUM LEVEL (5-7 difficulty) - Moderately convincing
  {
    id: 'sms-006',
    text: 'Alerte [BANK]: Tentative de connexion suspecte détectée. Appelez le 1-800-123-4567 immédiatement.',
    anonymized: true,
    source: 'SQ',
    category: 'banking_fraud',
    difficulty: 'medium',
    threatLevel: 7,
    correctResponse: 'delete',
    redFlags: [
      'Fake security alert',
      'Urgency and fear',
      'Phone number (not bank\'s real number)',
      'Asks for callback',
    ],
    explanation:
      'Votre banque ne vous demandera JAMAIS de rappeler par SMS. Raccrochez et appelez le numéro OFFICIEL au verso de votre carte bancaire ou sur leur site web.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-007',
    text: 'Confirmation [BANK]: Votre compte a été limité. Vérifiez: https://[BANK]-security.ca/verify',
    anonymized: true,
    source: 'CAFC',
    category: 'phishing',
    difficulty: 'medium',
    threatLevel: 7,
    correctResponse: 'delete',
    redFlags: ['Domain spoofing', 'Account limitation claim', 'Verification link', 'Phishing URL'],
    explanation:
      'Les domaines qui ressemblent à des banques mais ne sont pas exactes (ex: [BANK]-security.ca au lieu de [BANK].ca) sont des faux. Ne cliquez JAMAIS sur ces liens.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-008',
    text: 'Service client [TELECOM]: Confirmez votre numéro de compte: [account-verify-link]',
    anonymized: true,
    source: 'user',
    category: 'phishing',
    difficulty: 'medium',
    threatLevel: 6,
    correctResponse: 'delete',
    redFlags: ['Account confirmation request', 'Click link', 'Personal info request'],
    explanation:
      'Aucun service client ne vous demandera de confirmer votre compte par SMS. Appelez le numéro officiel de votre fournisseur.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-009',
    text: 'Révenu Québec: Vous êtes admissible à un remboursement de $1,247. Confirmez votre identité: [link]',
    anonymized: true,
    source: 'SQ',
    category: 'government_impersonation',
    difficulty: 'medium',
    threatLevel: 7,
    correctResponse: 'delete',
    redFlags: [
      'Government impersonation',
      'Unexpected refund',
      'Identity confirmation request',
      'Phishing link',
    ],
    explanation:
      'Revenu Québec ne vous contactera JAMAIS par SMS pour vous demander des informations personnelles. Les remboursements sont versés par dépôt direct automatiquement.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-010',
    text: 'Bienvenue chez [BANK]! Nous avons remarqué 3 nouveaux appareils sur votre compte. Cliquez pour examiner.',
    anonymized: true,
    source: 'CAFC',
    category: 'banking_fraud',
    difficulty: 'medium',
    threatLevel: 6,
    correctResponse: 'delete',
    redFlags: ['Device activity claim', 'Suspicious activity alert', 'Click link'],
    explanation:
      'Bien que cela ressemble à une alerte légitime, les vraies banques ne vous demanderont jamais de cliquer sur un lien SMS pour des alertes de sécurité.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  // HARD LEVEL (8-10 difficulty) - Very convincing, almost legitimate
  {
    id: 'sms-011',
    text: 'Alerte de sécurité [BANK]: Accès non autorisé détecté sur votre compte. Changement de mot de passe requis. Visitez mon[BANK].ca immédiatement.',
    anonymized: true,
    source: 'SQ',
    category: 'banking_fraud',
    difficulty: 'hard',
    threatLevel: 9,
    correctResponse: 'delete',
    redFlags: [
      'Very realistic messaging',
      'Legitimate-looking URL',
      'Urgency but professional tone',
      'Security language',
      'Slightly suspicious URL (mon[BANK] vs official)',
    ],
    explanation:
      'C\'est très convaincant! Mais remarquez l\'URL: les vraies banques utilisent leurs domaines officiels (ex: mondesjardins.ca, pas mon[BANK].ca). N\'ENTREZ JAMAIS de mot de passe via SMS. Appelez votre banque directement.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-012',
    text: 'Service client [BANK]: Nous avons remarqué une transaction de $847.23 en Chine. Est-ce autorisé? Répondez OUI ou NON.',
    anonymized: true,
    source: 'user',
    category: 'banking_fraud',
    difficulty: 'hard',
    threatLevel: 8,
    correctResponse: 'delete',
    redFlags: [
      'Realistic transaction claim',
      'Specific amount',
      'Suspicious location',
      'Interactive response request',
      'Could be social engineering',
    ],
    explanation:
      'Ceci est très réaliste! Mais c\'est une tactique: en répondant "OUI" ou "NON", vous confirmez que le numéro est actif. Votre vraie banque ne demandera jamais de confirmation par SMS d\'une transaction. Appelez directement votre banque avec le numéro au dos de votre carte.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-013',
    text: 'Confirmation de paiement Apple: Transaction refusée pour votre compte. Informations de paiement requises. Confirmez: appleid-verify.com',
    anonymized: true,
    source: 'CAFC',
    category: 'phishing',
    difficulty: 'hard',
    threatLevel: 9,
    correctResponse: 'delete',
    redFlags: [
      'Mimics Apple style',
      'Payment issue claim',
      'Domain spoofing (appleid-verify vs apple.com)',
      'Account verification request',
      'Urgency',
    ],
    explanation:
      'Très convaincant! Mais Apple n\'envoie JAMAIS de SMS demandant des informations de paiement. Et le domaine appleid-verify.com n\'est pas Apple (le vrai domaine est apple.com). Allez toujours directement sur le site officiel sans cliquer les liens SMS.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-014',
    text: 'Notification [INSURANCE]: Votre assurance automobile expire dans 2 jours. Renouvez immédiatement pour éviter l\'annulation. Cliquez: car-insurance-renew.ca',
    anonymized: true,
    source: 'SQ',
    category: 'impersonation',
    difficulty: 'hard',
    threatLevel: 8,
    correctResponse: 'delete',
    redFlags: [
      'Expiration claim',
      'Urgency (2 days)',
      'Policy cancellation threat',
      'Click link',
      'Generic insurance name',
      'Fake domain',
    ],
    explanation:
      'Les compagnies d\'assurance ne vous contactent JAMAIS par SMS pour le renouvellement. C\'est une arnaque courante ciblant les aînés. Ignorez et vérifiez votre assurance directement en contactant votre courtier.',
    usage_count: 0,
    avg_accuracy: 0,
  },

  {
    id: 'sms-015',
    text: 'Bienvenue chez Hydro-Québec en ligne! Activez votre compte maintenant pour payer votre facture en ligne: hydro-quebec.ca/activate',
    anonymized: true,
    source: 'user',
    category: 'phishing',
    difficulty: 'hard',
    threatLevel: 8,
    correctResponse: 'delete',
    redFlags: [
      'Looks official',
      'Service activation claim',
      'Legitimate domain-like URL',
      'Account setup request',
      'Credible premise (paying bills)',
    ],
    explanation:
      'Très réaliste! Mais Hydro-Québec ne vous contactera pas par SMS pour vous demander d\'activer votre compte. De plus, le domaine hydro-quebec.ca/activate semble réaliste, mais ce type d\'activation se fait toujours depuis le site officiel (sans SMS). Allez directement sur le site officiel en tapant l\'adresse vous-même.',
    usage_count: 0,
    avg_accuracy: 0,
  },
];

/**
 * Get SMS by ID
 */
export const getSMSById = (id) => SMS_MESSAGES.find((sms) => sms.id === id);

/**
 * Get random SMS of specific difficulty
 */
export const getRandomSMS = (difficulty = null) => {
  const filtered = difficulty ? SMS_MESSAGES.filter((sms) => sms.difficulty === difficulty) : SMS_MESSAGES;
  return filtered[Math.floor(Math.random() * filtered.length)];
};

/**
 * Get daily SMS (deterministic based on date)
 */
export const getDailySMS = () => {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % SMS_MESSAGES.length;
  return SMS_MESSAGES[index];
};

/**
 * Get SMS by category
 */
export const getSMSByCategory = (category) => SMS_MESSAGES.filter((sms) => sms.category === category);

/**
 * Get SMS statistics
 */
export const getSMSStats = () => ({
  total: SMS_MESSAGES.length,
  byDifficulty: {
    easy: SMS_MESSAGES.filter((s) => s.difficulty === 'easy').length,
    medium: SMS_MESSAGES.filter((s) => s.difficulty === 'medium').length,
    hard: SMS_MESSAGES.filter((s) => s.difficulty === 'hard').length,
  },
  byCategory: {
    banking: SMS_MESSAGES.filter((s) => s.category === 'banking_fraud').length,
    phishing: SMS_MESSAGES.filter((s) => s.category === 'phishing').length,
    prize: SMS_MESSAGES.filter((s) => s.category === 'prize_scam').length,
    government: SMS_MESSAGES.filter((s) => s.category === 'government_impersonation').length,
    delivery: SMS_MESSAGES.filter((s) => s.category === 'delivery_scam').length,
    other: SMS_MESSAGES.filter(
      (s) =>
        ![
          'banking_fraud',
          'phishing',
          'prize_scam',
          'government_impersonation',
          'delivery_scam',
        ].includes(s.category)
    ).length,
  },
});
