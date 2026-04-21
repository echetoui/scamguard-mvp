/**
 * GuardianAngelPanel Component
 * Sprint 9 - Guardian Angel Mode
 *
 * Allows family caregivers (role='family') to monitor and protect their seniors.
 * Features:
 *  ✅ List of seniors in the family
 *  ✅ Activity status (Actif/Inactif)
 *  ✅ Quick-action buttons to analyze messages or report scams
 *  ✅ Senior-friendly design (56px+ touch targets, 18px+ fonts)
 *  ✅ WCAG AAA accessibility
 */

import React from 'react';
import './GuardianAngelPanel.css';

export default function GuardianAngelPanel({ members = [], onAnalyzeMessage, onReportScam }) {
  // Filter to seniors only
  const seniors = members.filter(member => member.role === 'senior');

  // Check if member is currently active (within last 60 minutes)
  const isActive = (lastActive) => {
    if (!lastActive) return false;
    const minutesAgo = (Date.now() - new Date(lastActive).getTime()) / 60000;
    return minutesAgo < 60;
  };

  // Get activity badge style
  const getActivityStatus = (lastActive) => {
    if (!lastActive) return { icon: '⚪', label: 'Inactif', ariaLabel: 'Inactif' };
    const minutesAgo = (Date.now() - new Date(lastActive).getTime()) / 60000;
    if (minutesAgo < 5) return { icon: '🟢', label: 'Actif', ariaLabel: 'Actif' };
    if (minutesAgo < 60) return { icon: '🟡', label: 'Récent', ariaLabel: 'Actif récemment' };
    return { icon: '⚪', label: 'Inactif', ariaLabel: 'Inactif' };
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Jamais';
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'À l\'instant';
  };

  if (seniors.length === 0) {
    return (
      <div className="guardian-angel-panel" role="region" aria-label="Mode Ange Gardien">
        <div className="guardian-header">
          <h3>👼 Mode Ange Gardien</h3>
          <p className="guardian-description">Vous n'avez aucun aîné à surveiller dans votre groupe familial.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guardian-angel-panel" role="region" aria-label="Mode Ange Gardien">
      <div className="guardian-header">
        <h3>👼 Mode Ange Gardien</h3>
        <p className="guardian-description">
          Surveillez et protégez vos proches aînés contre les arnaques
        </p>
      </div>

      <div className="seniors-list" role="list">
        {seniors.map((senior, index) => {
          const activityStatus = getActivityStatus(senior.lastActive);
          const username = senior.email?.split('@')[0] || 'Utilisateur';

          return (
            <div
              key={index}
              className="senior-card"
              role="listitem"
              aria-label={`${username}, ${activityStatus.ariaLabel}`}
            >
              <div className="senior-header">
                <div className="senior-icon">🧓</div>
                <div className="senior-info">
                  <h4 className="senior-name">{username}</h4>
                  <div className="senior-activity">
                    <span
                      className="activity-badge"
                      aria-label={activityStatus.ariaLabel}
                      title={activityStatus.label}
                    >
                      {activityStatus.icon} {activityStatus.label}
                    </span>
                    <span className="activity-time">
                      {senior.lastActive ? `Actif il y a ${formatTimeAgo(senior.lastActive)}` : 'Jamais actif'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="senior-actions">
                <button
                  className="action-btn analyze-btn"
                  onClick={() => onAnalyzeMessage && onAnalyzeMessage(senior)}
                  aria-label={`Analyser un message de ${username}`}
                  title="Analyser un message suspect"
                >
                  📊 Analyser
                </button>
                <button
                  className="action-btn report-btn"
                  onClick={() => onReportScam && onReportScam(senior)}
                  aria-label={`Signaler une arnaque pour ${username}`}
                  title="Signaler une arnaque"
                >
                  🚨 Signaler
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
