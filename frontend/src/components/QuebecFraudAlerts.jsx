/**
 * Quebec Fraud Alerts Component
 * Phase 2 Sprint 5 - Display real Quebec fraud alerts and news
 *
 * Features:
 * - Fetch alerts from /api/v1/threats/feed endpoint
 * - Display 8 Quebec fraud alerts with details
 * - Color-coded threat levels (high/medium/low)
 * - Prevention tips collapsible
 * - Direct links to reporting channels
 * - Senior-friendly design (large text, clear icons)
 */

import React, { useState, useEffect } from 'react';
import './QuebecFraudAlerts.css';

export default function QuebecFraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAlert, setExpandedAlert] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/threats/feed?include_quebec=true`);

        if (!response.ok) {
          throw new Error('Failed to fetch alerts');
        }

        const data = await response.json();

        // Filter Quebec alerts only
        const quebecAlerts = data.threats?.filter(t => t.threat_id?.startsWith('QC_')) || [];
        setAlerts(quebecAlerts);
        setError('');
      } catch (err) {
        console.error('Error fetching Quebec alerts:', err);
        setError('Impossible de charger les actualités. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [API_URL]);

  const getThreatLevelClass = (level) => {
    switch (level) {
      case 'high':
        return 'threat-high';
      case 'medium':
        return 'threat-medium';
      case 'low':
        return 'threat-low';
      default:
        return 'threat-unknown';
    }
  };

  const getThreatLevelLabel = (level) => {
    switch (level) {
      case 'high':
        return '🔴 DANGER ÉLEVÉ';
      case 'medium':
        return '🟠 DANGER MOYEN';
      case 'low':
        return '🟡 DANGER FAIBLE';
      default:
        return 'INCONNU';
    }
  };

  const getThreatIcon = (type) => {
    switch (type) {
      case 'SMS':
        return '📱';
      case 'Email':
        return '📧';
      case 'Phone':
        return '☎️';
      case 'Identity Theft':
        return '🪪';
      case 'Malware/Pop-up':
        return '💻';
      case 'SMS/Email':
        return '📬';
      default:
        return '⚠️';
    }
  };

  if (loading) {
    return (
      <div className="quebec-alerts-container loading">
        <div className="loading-spinner"></div>
        <p>Chargement des alertes de fraude Québec...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quebec-alerts-container error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="quebec-alerts-container empty">
        <p>Aucune alerte de fraude actuellement.</p>
      </div>
    );
  }

  return (
    <div className="quebec-alerts-container">
      <div className="alerts-header">
        <h2 className="alerts-title">🛡️ Alertes Fraude Québec</h2>
        <p className="alerts-subtitle">
          {alerts.length} alerte{alerts.length > 1 ? 's' : ''} actuell{alerts.length > 1 ? 'e' : 'e'} de fraude au Québec
        </p>
      </div>

      <div className="alerts-grid">
        {alerts.map((alert) => (
          <div
            key={alert.threat_id}
            className={`alert-card ${getThreatLevelClass(alert.threat_level)}`}
          >
            {/* Card Header */}
            <div className="alert-header-content">
              <div className="alert-icon">
                {getThreatIcon(alert.type)}
              </div>
              <div className="alert-header-text">
                <h3 className="alert-title">{alert.title}</h3>
                <span className={`threat-level ${getThreatLevelClass(alert.threat_level)}`}>
                  {getThreatLevelLabel(alert.threat_level)}
                </span>
              </div>
            </div>

            {/* Alert Details */}
            <div className="alert-details">
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{alert.type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ciblant:</span>
                <span className="detail-value">{alert.institution}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Régions:</span>
                <span className="detail-value">
                  {alert.regions?.slice(0, 2).join(', ')}
                  {alert.regions?.length > 2 ? '...' : ''}
                </span>
              </div>
              <div className="detail-row stats">
                <span className="stat">
                  <span className="stat-icon">📊</span>
                  <span>{alert.statistics?.reports_last_7_days || 0} signalements (7j)</span>
                </span>
                <span className="stat">
                  <span className="stat-icon">👥</span>
                  <span>{alert.statistics?.affected_users || 0} utilisateurs</span>
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="alert-description">{alert.description}</p>

            {/* Expandable Prevention Tips */}
            <div className="alert-prevention">
              <button
                className="prevention-toggle"
                onClick={() => setExpandedAlert(
                  expandedAlert === alert.threat_id ? null : alert.threat_id
                )}
                aria-expanded={expandedAlert === alert.threat_id}
              >
                <span className="toggle-icon">
                  {expandedAlert === alert.threat_id ? '▼' : '▶'}
                </span>
                {alert.prevention_tips?.length || 0} Conseil{(alert.prevention_tips?.length || 0) > 1 ? 's' : ''} de prévention
              </button>

              {expandedAlert === alert.threat_id && (
                <ul className="prevention-tips">
                  {alert.prevention_tips?.map((tip, idx) => (
                    <li key={idx} className="prevention-tip">
                      <span className="tip-number">{idx + 1}</span>
                      <span className="tip-text">{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Action Button */}
            {alert.report_link && (
              <a
                href={alert.report_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-report"
              >
                📞 Signaler cette fraude
                <span className="external-icon">↗</span>
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="alerts-footer">
        <p className="footer-text">
          <span className="info-icon">ℹ️</span>
          Ces alertes sont mises à jour régulièrement. Si vous êtes victime d'une tentative d'arnaque, veuillez la signaler immédiatement.
        </p>
      </div>
    </div>
  );
}
