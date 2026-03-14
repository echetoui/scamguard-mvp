import React, { useState } from 'react';
import '../styles/ThreatCard.css';

/**
 * ThreatCard Component
 * Individual threat display card showing threat details
 *
 * Props:
 * - threat: threat object with threat_level, message, institution, etc.
 * - onSelect: callback when card is selected
 * - expandable: whether card can be expanded
 */
const ThreatCard = ({ threat, onSelect = null, expandable = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const threatEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };

  const threatColor = {
    high: 'danger',
    medium: 'warning',
    low: 'success',
  };

  const typeEmoji = {
    SMS: '📱',
    Email: '💌',
    Call: '☎️',
    Phishing: '🎣',
  };

  const handleCardClick = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
    if (onSelect) {
      onSelect(threat);
    }
  };

  return (
    <div
      className={`threat-card threat-card-${threatColor[threat.threat_level]} ${isExpanded ? 'threat-card-expanded' : ''}`}
      onClick={handleCardClick}
      role="article"
      aria-expanded={isExpanded}
      aria-label={`Menace ${threat.threat_level}: ${threat.institution}`}
    >
      {/* Card Header */}
      <div className="threat-card-header">
        <div className="threat-card-header-left">
          <div className="threat-card-threat-badge">
            <span className="threat-card-threat-emoji">{threatEmoji[threat.threat_level]}</span>
            <span className="threat-card-threat-level">{threat.threat_level.toUpperCase()}</span>
          </div>
          <div className="threat-card-info">
            <p className="threat-card-institution">{threat.institution}</p>
            <p className="threat-card-type">
              <span className="threat-card-type-emoji">{typeEmoji[threat.type] || '📨'}</span>
              {threat.type}
            </p>
          </div>
        </div>
        <div className="threat-card-date">
          {new Date(threat.date_detected).toLocaleDateString('fr-CA')}
        </div>
      </div>

      {/* Message Preview */}
      <div className="threat-card-message">
        <p className="threat-card-message-text">
          {threat.message.length > 100 ? threat.message.substring(0, 100) + '...' : threat.message}
        </p>
      </div>

      {/* Threat Indicators (Preview) */}
      {threat.threat_indicators && threat.threat_indicators.length > 0 && !isExpanded && (
        <div className="threat-card-indicators-preview">
          <p className="threat-card-indicators-label">Signes d'alerte:</p>
          <div className="threat-card-indicators-list">
            {threat.threat_indicators.slice(0, 2).map((indicator, idx) => (
              <span key={idx} className="threat-card-indicator-tag">
                {indicator}
              </span>
            ))}
            {threat.threat_indicators.length > 2 && (
              <span className="threat-card-indicator-tag threat-card-indicator-more">
                +{threat.threat_indicators.length - 2}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="threat-card-expanded-content">
          {/* Full message */}
          <div className="threat-card-expanded-section">
            <p className="threat-card-expanded-label">Message complet:</p>
            <p className="threat-card-expanded-message">{threat.message}</p>
          </div>

          {/* Full threat indicators */}
          {threat.threat_indicators && threat.threat_indicators.length > 0 && (
            <div className="threat-card-expanded-section">
              <p className="threat-card-expanded-label">Tous les signes d'alerte:</p>
              <ul className="threat-card-expanded-indicators">
                {threat.threat_indicators.map((indicator, idx) => (
                  <li key={idx}>• {indicator}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Explanation */}
          {threat.explanation_fr && (
            <div className="threat-card-expanded-section">
              <p className="threat-card-expanded-label">Explication:</p>
              <p className="threat-card-expanded-explanation">{threat.explanation_fr}</p>
            </div>
          )}

          {/* Source */}
          <div className="threat-card-source">
            <span className="threat-card-source-label">Source:</span>
            <span className="threat-card-source-value">{threat.source || 'N/A'}</span>
          </div>
        </div>
      )}

      {/* Click to expand indicator */}
      {expandable && !isExpanded && (
        <div className="threat-card-expand-hint">
          <p>Cliquez pour plus de détails</p>
        </div>
      )}
    </div>
  );
};

export default ThreatCard;
