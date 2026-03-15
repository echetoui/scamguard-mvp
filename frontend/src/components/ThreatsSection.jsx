import React, { useState, useMemo } from 'react';
import ThreatCard from './ThreatCard';
import '../styles/ThreatsSection.css';

/**
 * ThreatsSection Component
 * Displays current threats in user's region/institutions
 *
 * Props:
 * - threats: array of threat objects
 * - onThreatSelect: callback when threat is selected
 * - filterLevel: 'all' | 'high' | 'medium' | 'low'
 * - searchTerm: filter threats by text
 * - emptyMessage: message to show when no threats
 */
const ThreatsSection = ({
  threats = [],
  onThreatSelect = null,
  filterLevel = 'all',
  searchTerm = '',
  emptyMessage = 'Aucune menace détectée pour votre profil',
}) => {
  // Filter threats based on threat level and search term
  const filteredThreats = useMemo(() => {
    return threats.filter((threat) => {
      // Filter by threat level
      if (filterLevel !== 'all' && threat.threat_level !== filterLevel) {
        return false;
      }
      // Filter by search term
      if (searchTerm && searchTerm.length > 0) {
        const searchLower = searchTerm.toLowerCase();
        return (
          threat.institution.toLowerCase().includes(searchLower) ||
          threat.message.toLowerCase().includes(searchLower) ||
          threat.type.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [threats, filterLevel, searchTerm]);

  const threatCounts = useMemo(() => {
    return {
      total: threats.length,
      high: threats.filter((t) => t.threat_level === 'high').length,
      medium: threats.filter((t) => t.threat_level === 'medium').length,
      low: threats.filter((t) => t.threat_level === 'low').length,
    };
  }, [threats]);

  const handleThreatSelect = (threat) => {
    if (onThreatSelect) {
      onThreatSelect(threat);
    }
  };

  return (
    <div className="threats-section">
      {/* Section Header */}
      <div className="threats-section-header">
        <h2 className="threats-section-title">Menaces actuelles</h2>
        <p className="threats-section-subtitle">
          {threatCounts.total} menace{threatCounts.total !== 1 ? 's' : ''} détectée{threatCounts.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Threat Level Summary */}
      {threatCounts.total > 0 && (
        <div className="threats-section-stats" role="status" aria-live="polite">
          <div className="threats-section-stat">
            <span className="threats-section-stat-icon">🔴</span>
            <span className="threats-section-stat-label">Haute</span>
            <span className="threats-section-stat-value">{threatCounts.high}</span>
          </div>
          <div className="threats-section-stat">
            <span className="threats-section-stat-icon">🟡</span>
            <span className="threats-section-stat-label">Moyenne</span>
            <span className="threats-section-stat-value">{threatCounts.medium}</span>
          </div>
          <div className="threats-section-stat">
            <span className="threats-section-stat-icon">🟢</span>
            <span className="threats-section-stat-label">Basse</span>
            <span className="threats-section-stat-value">{threatCounts.low}</span>
          </div>
        </div>
      )}

      {/* No threats message */}
      {filteredThreats.length === 0 && (
        <div className="threats-section-empty">
          <p className="threats-section-empty-icon">✨</p>
          <p className="threats-section-empty-message">{emptyMessage}</p>
        </div>
      )}

      {/* Threats List */}
      {filteredThreats.length > 0 && (
        <div className="threats-section-list" role="list">
          {filteredThreats.map((threat) => (
            <div key={threat.id} role="listitem">
              <ThreatCard
                threat={threat}
                onSelect={handleThreatSelect}
                expandable={true}
              />
            </div>
          ))}
        </div>
      )}

      {/* Filtered Results Info */}
      {searchTerm && filteredThreats.length !== threats.length && threats.length > 0 && (
        <div className="threats-section-filter-info">
          <p>Affichage {filteredThreats.length} sur {threats.length} menaces</p>
        </div>
      )}
    </div>
  );
};

export default ThreatsSection;
