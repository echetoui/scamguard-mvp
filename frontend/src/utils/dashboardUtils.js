/**
 * Dashboard Utility Functions - Phase 5D.4 Performance Optimization
 *
 * Extracted calculations from SecurityHeartDashboard to prevent
 * unnecessary function recreation on each render.
 */

/**
 * Determine security score status based on score value
 * @param {number} score - Security score (0-100)
 * @returns {string} Status: 'safe', 'moderate', or 'warning'
 */
export const getScoreStatus = (score) => {
  if (score >= 70) return 'safe';
  if (score >= 40) return 'moderate';
  return 'warning';
};

/**
 * Get hex color for score display
 * @param {number} score - Security score (0-100)
 * @returns {string} Hex color code
 */
export const getScoreColor = (score) => {
  if (score >= 70) return '#2E7D32'; // Dark green
  if (score >= 40) return '#F57C00'; // Orange
  return '#D32F2F'; // Red
};

/**
 * Get emoji indicator for score
 * @param {number} score - Security score (0-100)
 * @returns {string} Emoji character
 */
export const getScoreEmoji = (score) => {
  if (score >= 70) return '🟢';
  if (score >= 40) return '🟡';
  return '🔴';
};

/**
 * Get encouraging/warning message based on score
 * @param {number} score - Security score (0-100)
 * @returns {string} Status message
 */
export const getStatusMessage = (score) => {
  if (score >= 80) return 'Vous êtes très bien protégé!';
  if (score >= 70) return 'Vous êtes bien protégé!';
  if (score >= 40) return 'Soyez vigilant!';
  return 'Action recommandée!';
};

/**
 * Map status enum to display text
 * @param {string} status - Status enum value
 * @returns {string} Display text
 */
export const getStatusText = (status) => {
  const statusMap = {
    'safe': 'TRÈS SÛRS',
    'moderate': 'MODÉRÉ',
    'warning': 'VIGILANCE',
    'error': 'ERREUR'
  };
  return statusMap[status] || 'CHARGEMENT';
};

/**
 * Calculate SVG coordinates for score history graph
 * @param {number[]} scoreHistory - Array of scores to plot
 * @returns {string} SVG polyline points string
 */
export const calculateGraphPoints = (scoreHistory) => {
  if (!scoreHistory || scoreHistory.length === 0) return '';

  return scoreHistory
    .map((score, idx) => {
      const x = (idx / (scoreHistory.length - 1)) * 280 + 10;
      const y = 80 - (score / 100) * 60;
      return `${x},${y}`;
    })
    .join(' ');
};

/**
 * Calculate SVG coordinates for a single data point
 * @param {number} score - Score value
 * @param {number} index - Index in the history array
 * @param {number} totalPoints - Total number of data points
 * @returns {object} Object with x, y, and label properties
 */
export const calculateDataPoint = (score, index, totalPoints) => {
  const x = (index / (totalPoints - 1)) * 280 + 10;
  const y = 80 - (score / 100) * 60;
  return {
    x,
    y,
    label: `Jour ${index + 1}: ${score} points`
  };
};
