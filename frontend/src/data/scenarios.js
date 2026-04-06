/**
 * SMS Scam Scenarios for Training
 * 8 diverse scenarios covering different scam techniques
 *
 * Scenario Structure:
 * - is_scam: boolean - whether the message is a scam
 * - threat_level: 'high' | 'medium' | 'low'
 * - institution: string - the organization being impersonated
 * - message: string - the SMS message text
 * - explanation_fr: string - why it's a scam or legitimate
 * - threat_indicators: array - warning signs to watch for
 */

export const THREAT_SCENARIOS = [
  {
    id: 1,
    is_scam: true,
    threat_level: 'high',
    institution: 'BANQUE HYPOTHÉCAIRE DU CANADA',
    message: 'URGENT: Votre compte a été compromis. Cliquez ici pour vérifier votre identité: bit.ly/verify2024',
    explanation_fr: 'Les vraies banques ne demandent jamais votre confirmation d\'identité par SMS avec des liens. C\'est une phishing classique.',
    threat_indicators: [
      'Lien URL raccourci (bit.ly)',
      'Demande urgente de vérification',
      'Demande d\'identifiants par SMS',
      'Pas de personnalisation (cher client, pas votre nom)',
    ],
    category: 'phishing',
  },
  {
    id: 2,
    is_scam: false,
    threat_level: 'low',
    institution: 'HYDRO-QUÉBEC',
    message: 'Bonjour. Votre facture d\'électricité est prête. Vous pouvez la consulter sur hydroquebec.com. Numéro de compte: H123456',
    explanation_fr: 'Les services publics peuvent envoyer des notifications de facturation par SMS. Le message contient votre numéro de compte et propose un site officiel (hydroquebec.com).',
    threat_indicators: [],
    category: 'legitimate',
  },
  {
    id: 3,
    is_scam: true,
    threat_level: 'high',
    institution: 'APPLE SUPPORT',
    message: '⚠️ VOTRE IPHONE A ÉTÉ PIRATÉ! 6 tentatives de connexion détectées. Confirmez votre Apple ID maintenant: applesecuritycheck.com/verify',
    explanation_fr: 'Apple n\'envoie jamais de SMS pour les alertes de sécurité. Les vrais Apple IDs ne sont jamais vérifiés par des liens SMS.',
    threat_indicators: [
      'Message en majuscules (crée l\'urgence)',
      'Domaine imitant Apple mais différent',
      'Demande de confirmation d\'Apple ID',
      'Alerte de sécurité suspecte',
    ],
    category: 'urgency',
  },
  {
    id: 4,
    is_scam: true,
    threat_level: 'high',
    institution: 'GOUVERNEMENT DU QUÉBEC',
    message: 'Impôt Québec: Vous avez une taxe à payer. Vous avez 24h pour payer ou des poursuites légales seront entreprises. Payez ici: taxation-gov-qc.online',
    explanation_fr: 'Le gouvernement ne menace jamais par SMS. C\'est une arnaque classique utilisant l\'autorité gouvernementale pour créer de la peur.',
    threat_indicators: [
      'Menace de poursuites légales',
      'Ultimatum de 24 heures',
      'Domaine imitant le gouvernement mais incorrect',
      'Demande de paiement immédiat',
    ],
    category: 'authority',
  },
  {
    id: 5,
    is_scam: false,
    threat_level: 'low',
    institution: 'BELL CANADA',
    message: 'Bonjour. Votre facture Bell de 89,99$ est prête à payer. Paiement automatique prévu le 15 juin. Pour modifier: bell.ca ou 1-855-960-0034',
    explanation_fr: 'Les fournisseurs de services peuvent envoyer des rappels de facturation. Celui-ci inclut le montant précis, la date, et les options de contact officielles.',
    threat_indicators: [],
    category: 'legitimate',
  },
  {
    id: 6,
    is_scam: true,
    threat_level: 'high',
    institution: 'LOTO-QUÉBEC',
    message: '🎉 FÉLICITATIONS! Vous avez remporté 50,000$ à la LOTO-QUÉBEC! Cliquez ici pour réclamer: lotoquebec-winner.co.uk/claim',
    explanation_fr: 'Vous ne pouvez pas gagner à une loterie à laquelle vous n\'avez pas participé. C\'est une arnaque aux faux prix classique.',
    threat_indicators: [
      'Annonce d\'une victoire non demandée',
      'Domaine frauduleux (.co.uk, pas .com ou .ca)',
      'Offre trop belle pour être vraie',
      'Demande de cliquer immédiatement',
    ],
    category: 'fake_offer',
  },
  {
    id: 7,
    is_scam: true,
    threat_level: 'medium',
    institution: 'AMAZON',
    message: 'Votre compte Amazon a été verrouillé pour des raisons de sécurité. Réactivez-le dans les 2 heures: amazon-verify.click/unlock',
    explanation_fr: 'Amazon ne verrouille jamais les comptes par SMS. C\'est une tentative de phishing pour accéder à votre compte et à vos données de paiement.',
    threat_indicators: [
      'Délai limite (2 heures)',
      'Domaine frauduleux (amazon-verify.click)',
      'Demande de vérification d\'accès',
      'Menace de verrouillage de compte',
    ],
    category: 'account_compromise',
  },
  {
    id: 8,
    is_scam: false,
    threat_level: 'low',
    institution: 'SANTÉ QUÉBEC',
    message: 'Rappel: Votre rendez-vous de vaccination est programmé pour le 20 juin à 14h à la Clinique Gérald-Vallée. Confirmez: santequebec.ca',
    explanation_fr: 'Les services de santé publique peuvent envoyer des rappels d\'apparel. Le message inclut des détails spécifiques et un site officiel.',
    threat_indicators: [],
    category: 'legitimate',
  },
];

/**
 * Get random scenarios from the pool
 * @param {number} count - number of scenarios to return
 * @returns {array} - array of random scenarios
 */
export function getRandomScenarios(count) {
  if (count > THREAT_SCENARIOS.length) {
    console.warn(`Requested ${count} scenarios but only ${THREAT_SCENARIOS.length} available`);
    return THREAT_SCENARIOS;
  }

  const shuffled = [...THREAT_SCENARIOS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get scenarios by category
 * @param {string} category - 'phishing', 'urgency', 'authority', 'fake_offer', 'account_compromise', 'legitimate'
 * @returns {array} - scenarios matching the category
 */
export function getScenariosByCategory(category) {
  return THREAT_SCENARIOS.filter(scenario => scenario.category === category);
}

/**
 * Get a specific scenario by ID
 * @param {number} id - scenario ID
 * @returns {object|null} - scenario object or null if not found
 */
export function getScenarioById(id) {
  return THREAT_SCENARIOS.find(scenario => scenario.id === id) || null;
}
