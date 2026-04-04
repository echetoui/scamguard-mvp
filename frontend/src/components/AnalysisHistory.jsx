/**
 * AnalysisHistory Component
 * Phase 4.0.1 - Display verified message history
 *
 * Shows list of all analyzed messages/images with results
 */

import React from 'react';
import '../styles/AnalysisHistory.css';

export default function AnalysisHistory({ analyses = [] }) {
  if (analyses.length === 0) {
    return (
      <div className="analysis-history-empty">
        <p>📭 Aucun message analysé yet</p>
        <p className="empty-hint">Analysez des messages pour voir l'historique</p>
      </div>
    );
  }

  const getRiskClass = (riskLevel) => {
    switch (riskLevel) {
      case 'safe':
        return 'risk-safe';
      case 'moderate':
        return 'risk-moderate';
      case 'danger':
        return 'risk-danger';
      default:
        return '';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'safe':
        return '✅';
      case 'moderate':
        return '⚠️';
      case 'danger':
        return '🚨';
      default:
        return '❓';
    }
  };

  const getRiskLabel = (riskLevel) => {
    switch (riskLevel) {
      case 'safe':
        return 'Sûr';
      case 'moderate':
        return 'Modéré';
      case 'danger':
        return 'Dangereux';
      default:
        return 'Inconnu';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <div className="analysis-history">
      <h3 className="history-title">📋 Historique des Analyses</h3>

      <div className="analysis-list">
        {analyses.map((analysis) => (
          <div
            key={analysis.id}
            className={`analysis-item ${getRiskClass(analysis.result?.riskLevel)}`}
          >
            <div className="analysis-header">
              <div className="analysis-risk">
                <span className="risk-icon">
                  {getRiskIcon(analysis.result?.riskLevel)}
                </span>
                <span className="risk-label">
                  {getRiskLabel(analysis.result?.riskLevel)}
                </span>
              </div>

              <div className="analysis-score">
                <span className="score-number">
                  {analysis.result?.score || 0}/100
                </span>
              </div>
            </div>

            <div className="analysis-content">
              <p className="analysis-text">
                {analysis.content.substring(0, 100)}
                {analysis.content.length > 100 ? '...' : ''}
              </p>
            </div>

            <div className="analysis-meta">
              <span className="analysis-type">
                {analysis.type === 'message' ? '📱 Message' : '📸 Image'}
              </span>
              <span className="analysis-date">
                {formatDate(analysis.timestamp)}
              </span>
            </div>

            {analysis.result?.scamType && (
              <div className="analysis-scam-type">
                <span className="scam-label">Type:</span>
                <span className="scam-type">{analysis.result.scamType}</span>
              </div>
            )}

            {analysis.result?.feedback && (
              <div className="analysis-feedback">
                <p>{analysis.result.feedback}</p>
              </div>
            )}

            {analysis.result?.xpEarned > 0 && (
              <div className="analysis-xp">
                <span className="xp-badge">
                  🎖️ +{analysis.result.xpEarned} XP
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
