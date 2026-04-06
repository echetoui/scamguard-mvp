/**
 * RiskScore Component - ScamGuard Design System
 * Figma Component: Risk Score / Safe | Moderate | Danger
 *
 * Displays a visual risk assessment with color-coded severity levels
 * Adheres to WCAG AAA accessibility standards
 */

import React from 'react';
import { colors } from '../styles/design-tokens';
import './RiskScore.css';

/**
 * @param {object} props
 * @param {'safe' | 'moderate' | 'danger'} props.level - Risk severity level
 * @param {number} [props.score] - Optional risk score (0-100)
 * @param {string} [props.label] - Custom label for the risk
 * @param {boolean} [props.animated=true] - Show animation on mount
 */
const RiskScore = ({
  level = 'moderate',
  score,
  label,
  animated = true
}) => {
  const levelMap = {
    safe: {
      color: colors.secondary,      // #1B6B3A - Vert Sécurité
      label: 'Safe',
      description: 'Low risk detected'
    },
    moderate: {
      color: colors.tertiary,       // #7A5900 - Ambre Alerte
      label: 'Moderate',
      description: 'Caution advised'
    },
    danger: {
      color: colors.error,          // #BA1A1A - Rouge Danger
      label: 'Danger',
      description: 'High risk'
    }
  };

  const config = levelMap[level];

  return (
    <div
      className={`risk-score ${animated ? 'risk-score--animated' : ''}`}
      role="status"
      aria-label={`Risk level: ${config.label}`}
    >
      {/* Circular gauge */}
      <div
        className="risk-score__circle"
        style={{ borderColor: config.color }}
        aria-hidden="true"
      >
        {score !== undefined && (
          <div className="risk-score__score">
            <span className="risk-score__score-value">{score}</span>
            <span className="risk-score__score-unit">%</span>
          </div>
        )}
      </div>

      {/* Text Information */}
      <div className="risk-score__info">
        <h3
          className="risk-score__level"
          style={{ color: config.color }}
        >
          {label || config.label}
        </h3>
        <p className="risk-score__description">
          {config.description}
        </p>
      </div>
    </div>
  );
};

export default RiskScore;
