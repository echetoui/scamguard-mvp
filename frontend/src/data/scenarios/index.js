/**
 * Threat Scenario Library Index
 * Lists all SMS scam/legitimate scenarios for SMS Simulator training
 *
 * Total scenarios: 15
 * - 9 scams
 * - 6 legitimate messages
 * Categories: banking, utilities, other
 */

// Banking scenarios
import desjardinsVerifyAccount from './banking/desjardins-verify-account.json';
import desjardinsPaymentReminder from './banking/desjardins-payment-reminder.json';
import tdUrgentAlert from './banking/td-urgent-alert.json';
import rbcCardLocked from './banking/rbc-card-locked.json';
import bmoFraudAlert from './banking/bmo-fraud-alert.json';
import bmoCardReward from './banking/bmo-card-reward.json';
import scotiabankConfirm from './banking/scotiabank-confirm.json';

// Utility scenarios
import hydroQuebecBill from './utilities/hydro-quebec-bill.json';
import hydroQuebecSupport from './utilities/hydro-quebec-support.json';

// Other scenarios
import amazonDelivery from './other/amazon-delivery.json';
import paypalUnusualActivity from './other/paypal-unusual-activity.json';
import microsoftSupport from './other/microsoft-support.json';
import revenueCanadaTax from './other/revenue-canada-tax.json';
import appleSecurity from './other/apple-security.json';
import netflixPayment from './other/netflix-payment.json';

/**
 * Master scenario array - includes all training scenarios
 */
export const THREAT_SCENARIOS = [
  // Banking
  desjardinsVerifyAccount,
  desjardinsPaymentReminder,
  tdUrgentAlert,
  rbcCardLocked,
  bmoFraudAlert,
  bmoCardReward,
  scotiabankConfirm,
  // Utilities
  hydroQuebecBill,
  hydroQuebecSupport,
  // Other
  amazonDelivery,
  paypalUnusualActivity,
  microsoftSupport,
  revenueCanadaTax,
  appleSecurity,
  netflixPayment,
];

/**
 * Get scenarios by category
 */
export const getScenariosByCategory = (category) => {
  return THREAT_SCENARIOS.filter(scenario => scenario.category === category);
};

/**
 * Get scenarios by threat level
 */
export const getScenariosByThreatLevel = (level) => {
  return THREAT_SCENARIOS.filter(scenario => scenario.threat_level === level);
};

/**
 * Get random scenario (for quiz mode)
 */
export const getRandomScenario = () => {
  return THREAT_SCENARIOS[Math.floor(Math.random() * THREAT_SCENARIOS.length)];
};

/**
 * Get N random scenarios
 */
export const getRandomScenarios = (count) => {
  const shuffled = [...THREAT_SCENARIOS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, THREAT_SCENARIOS.length));
};

/**
 * Get scenarios by institution
 */
export const getScenariosByInstitution = (institution) => {
  return THREAT_SCENARIOS.filter(scenario => scenario.institution === institution);
};

/**
 * Statistics
 */
export const SCENARIO_STATS = {
  total: THREAT_SCENARIOS.length,
  scams: THREAT_SCENARIOS.filter(s => s.is_scam).length,
  legitimate: THREAT_SCENARIOS.filter(s => !s.is_scam).length,
  categories: ['banking', 'utilities', 'other'],
  threatLevels: ['low', 'medium', 'high'],
};

export default THREAT_SCENARIOS;
