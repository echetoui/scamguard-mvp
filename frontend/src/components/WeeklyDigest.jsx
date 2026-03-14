import React, { useMemo } from 'react';
import '../styles/WeeklyDigest.css';

/**
 * WeeklyDigest Component
 * Shows threats from past 7 days and safety tips
 *
 * Props:
 * - threats: array of threat objects
 * - matchedThreats: array of threats matching user profile
 * - onViewThreat: callback when user wants to view threat details
 */
const WeeklyDigest = ({ threats = [], matchedThreats = [], onViewThreat = null }) => {
  // Get threats from past 7 days
  const recentThreats = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return threats.filter((threat) => {
      const threatDate = new Date(threat.date_detected);
      return threatDate >= sevenDaysAgo;
    });
  }, [threats]);

  const threatsByLevel = useMemo(() => {
    return {
      high: recentThreats.filter((t) => t.threat_level === 'high').length,
      medium: recentThreats.filter((t) => t.threat_level === 'medium').length,
      low: recentThreats.filter((t) => t.threat_level === 'low').length,
    };
  }, [recentThreats]);

  const threatsByType = useMemo(() => {
    const types = {};
    recentThreats.forEach((threat) => {
      types[threat.type] = (types[threat.type] || 0) + 1;
    });
    return types;
  }, [recentThreats]);

  const safetyTips = [
    {
      title: 'Vérifiez l\'expéditeur',
      description: 'Les vraies banques n\'envoient jamais de SMS ou emails avec des liens à cliquer.',
    },
    {
      title: 'Appelez directement',
      description: 'Si vous recevez un message suspect d\'une institution, appelez le numéro officiel sur votre carte bancaire.',
    },
    {
      title: 'Signes d\'alerte courants',
      description: 'Urgence, demandes de confirmation, liens suspects, montants spécifiques: tous des signes d\'arnaque.',
    },
    {
      title: 'Ne cliquez pas sur les liens',
      description: 'Les liens dans les SMS frauduleux mènent à des pages contrefaites qui volent vos données.',
    },
    {
      title: 'Mises à jour de sécurité',
      description: 'Les vraies mises à jour se font via l\'application officielle ou le site web officiel, pas par SMS.',
    },
    {
      title: 'Signalez les arnaques',
      description: 'Signalez les messages suspects à CAFC (cafc.ca) pour aider à protéger d\'autres personnes.',
    },
  ];

  return (
    <div className="weekly-digest">
      {/* Header */}
      <div className="weekly-digest-header">
        <h2>📋 Résumé de la semaine</h2>
        <p className="weekly-digest-subtitle">
          Derniers 7 jours: {recentThreats.length} arnaque{recentThreats.length !== 1 ? 's détectée' : ' détectée'}s
        </p>
      </div>

      {/* Threats Summary */}
      {recentThreats.length > 0 && (
        <div className="weekly-digest-section">
          <h3 className="weekly-digest-section-title">📊 Statistiques des menaces</h3>

          {/* Threat Levels */}
          <div className="weekly-digest-stats">
            <div className="weekly-digest-stat-card weekly-digest-stat-high">
              <p className="weekly-digest-stat-icon">🔴</p>
              <p className="weekly-digest-stat-label">Haute priorité</p>
              <p className="weekly-digest-stat-value">{threatsByLevel.high}</p>
            </div>
            <div className="weekly-digest-stat-card weekly-digest-stat-medium">
              <p className="weekly-digest-stat-icon">🟡</p>
              <p className="weekly-digest-stat-label">Moyenne</p>
              <p className="weekly-digest-stat-value">{threatsByLevel.medium}</p>
            </div>
            <div className="weekly-digest-stat-card weekly-digest-stat-low">
              <p className="weekly-digest-stat-icon">🟢</p>
              <p className="weekly-digest-stat-label">Basse</p>
              <p className="weekly-digest-stat-value">{threatsByLevel.low}</p>
            </div>
          </div>

          {/* Threat Types */}
          <div className="weekly-digest-types">
            <p className="weekly-digest-types-label">Par type d'arnaque:</p>
            <div className="weekly-digest-type-tags">
              {Object.entries(threatsByType).map(([type, count]) => (
                <span key={type} className="weekly-digest-type-tag">
                  {type}: <strong>{count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Threats Matching User Profile */}
      {matchedThreats.length > 0 && (
        <div className="weekly-digest-section">
          <h3 className="weekly-digest-section-title">⚠️ Menaces pour VOUS</h3>
          <p className="weekly-digest-matched-intro">
            {matchedThreats.length} arnaque{matchedThreats.length !== 1 ? 's' : ''} cible
            {matchedThreats.length !== 1 ? 'nt' : ''} les institutions de votre profil.
          </p>
          <ul className="weekly-digest-matched-list">
            {matchedThreats.slice(0, 5).map((threat) => (
              <li key={threat.id} className="weekly-digest-matched-item">
                <span className="weekly-digest-matched-icon">
                  {threat.threat_level === 'high' ? '🔴' : threat.threat_level === 'medium' ? '🟡' : '🟢'}
                </span>
                <span className="weekly-digest-matched-text">
                  {threat.institution} - {threat.type}
                </span>
                {onViewThreat && (
                  <button
                    className="weekly-digest-matched-btn"
                    onClick={() => onViewThreat(threat)}
                    aria-label={`Voir les détails de la menace ${threat.institution}`}
                  >
                    Détails →
                  </button>
                )}
              </li>
            ))}
          </ul>
          {matchedThreats.length > 5 && (
            <p className="weekly-digest-matched-more">
              ... et {matchedThreats.length - 5} autre{matchedThreats.length - 5 !== 1 ? 's' : ''} menace{matchedThreats.length - 5 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Safety Tips */}
      <div className="weekly-digest-section">
        <h3 className="weekly-digest-section-title">💡 Conseils de sécurité</h3>
        <div className="weekly-digest-tips">
          {safetyTips.map((tip, idx) => (
            <div key={idx} className="weekly-digest-tip-card">
              <h4 className="weekly-digest-tip-title">{tip.title}</h4>
              <p className="weekly-digest-tip-description">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="weekly-digest-cta">
        <p className="weekly-digest-cta-text">
          Restez vigilant! Les arnaques par SMS deviennent de plus en plus sophistiquées.
        </p>
        <p className="weekly-digest-cta-text">
          Continuez à vous entraîner avec le simulateur SMS pour améliorer vos compétences en détection.
        </p>
      </div>

      {/* No Data Message */}
      {recentThreats.length === 0 && (
        <div className="weekly-digest-empty">
          <p className="weekly-digest-empty-icon">✨</p>
          <p className="weekly-digest-empty-message">Aucune menace détectée cette semaine. Continuez à rester vigilant!</p>
        </div>
      )}
    </div>
  );
};

export default WeeklyDigest;
