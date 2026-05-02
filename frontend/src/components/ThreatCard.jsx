/**
 * ThreatCard Component - ScamGuard Design System
 * Figma Component: Threat Card / Low | Medium | Danger
 *
 * Displays threat information with severity-based visual hierarchy
 */

import React from 'react';
import { colors } from '../styles/design-tokens';
import './ThreatCard.css';

/**
 * @param {object} props
 * @param {'low' | 'medium' | 'danger'} props.severity - Threat severity
 * @param {string} props.title - Threat title
 * @param {string} props.description - Threat description
 * @param {React.ReactNode} [props.icon] - Optional icon element
 * @param {function} [props.onAction] - Callback for action button
 */
const ThreatCard = ({
  severity = 'medium',
  title,
  description,
  icon,
  onAction
}) => {
  const severityMap = {
    low: {
      color: colors.tertiary,       // #7A5900 - Ambre
      label: 'Menace faible'
    },
    medium: {
      color: '#FF8A00',             // Orange (extended palette)
      label: 'Menace modérée'
    },
    danger: {
      color: colors.error,          // #BA1A1A - Rouge
      label: 'Menace élevée'
    }
  };

  const config = severityMap[severity];

  return (
    <div
      className="threat-card"
      style={{ borderLeftColor: config.color }}
      role="article"
      aria-label={`${config.label}: ${title}`}
    >
      {/* Left Border Accent */}
      <div
        className="threat-card__accent"
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="threat-card__content">
        {icon && (
          <div className="threat-card__icon">
            {icon}
          </div>
        )}

        <div className="threat-card__text">
          <h3 className="threat-card__title">{title}</h3>
          <p className="threat-card__description">{description}</p>
        </div>
      </div>

      {/* Action Button */}
      {onAction && (
        <button
          className="threat-card__action"
          onClick={onAction}
          style={{
            color: config.color,
            borderColor: config.color
          }}
          aria-label={`En savoir plus sur ${title}`}
        >
          En savoir plus →
        </button>
      )}
    </div>
  );
};

export default ThreatCard;
