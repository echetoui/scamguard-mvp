import React, { useState, useEffect } from 'react';
import './SecurityHeartDashboard.css';

/**
 * Security Heart Dashboard - Phase 3.1.1
 *
 * Senior-First design dashboard showing overall security score
 * and weekly activity summary.
 *
 * Features:
 * - Large emotional heart icon (❤️)
 * - Safety score 0-100
 * - Color-coded status (🟢 Green, 🟡 Yellow, 🔴 Red)
 * - Weekly activity summary
 * - Encouraging messages
 * - Large fonts (20px+) for seniors
 * - WCAG AAA accessibility
 *
 * @component
 * @returns {JSX.Element} Security Heart Dashboard
 */
const SecurityHeartDashboard = ({ userId }) => {
  const [securityScore, setSecurityScore] = useState(0);
  const [scoreStatus, setScoreStatus] = useState('loading');
  const [weeklyStats, setWeeklyStats] = useState({
    scamsBlocked: 0,
    quizzesCompleted: 0,
    guardianActive: true
  });
  const [scoreHistory, setScoreHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);

      // Mock data for MVP (in production, call backend API)
      const mockScore = 78;
      const mockHistory = [50, 58, 65, 72, 78]; // Last 5 days
      const mockStats = {
        scamsBlocked: 3,
        quizzesCompleted: 2,
        guardianActive: true
      };

      setSecurityScore(mockScore);
      setScoreHistory(mockHistory);
      setWeeklyStats(mockStats);
      setScoreStatus(getScoreStatus(mockScore));
    } catch (error) {
      console.error('Error fetching security data:', error);
      setScoreStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSecurityData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getScoreStatus = (score) => {
    if (score >= 70) return 'safe';
    if (score >= 40) return 'moderate';
    return 'warning';
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#2E7D32'; // Dark green
    if (score >= 40) return '#F57C00'; // Orange
    return '#D32F2F'; // Red
  };

  const getScoreEmoji = (score) => {
    if (score >= 70) return '🟢';
    if (score >= 40) return '🟡';
    return '🔴';
  };

  const getStatusMessage = (score) => {
    if (score >= 80) return 'Vous êtes très bien protégé!';
    if (score >= 70) return 'Vous êtes bien protégé!';
    if (score >= 40) return 'Soyez vigilant!';
    return 'Action recommandée!';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'safe': 'TRÈS SÛRS',
      'moderate': 'MODÉRÉ',
      'warning': 'VIGILANCE',
      'error': 'ERREUR'
    };
    return statusMap[status] || 'CHARGEMENT';
  };

  return (
    <div className="security-heart-dashboard">
      {/* Main Heart Section */}
      <div className="heart-section">
        {/* Heart Icon and Score */}
        <div className="heart-container">
          {isLoading ? (
            <div className="heart-spinner">
              <div className="spinner"></div>
              <p>Calcul en cours...</p>
            </div>
          ) : (
            <>
              <div
                className="heart-icon"
                style={{ color: getScoreColor(securityScore) }}
                aria-label={`Cœur de Sécurité: ${securityScore} sur 100`}
              >
                ❤️
              </div>

              <div className="score-display">
                <div className="score-number" style={{ color: getScoreColor(securityScore) }}>
                  {securityScore}
                </div>
                <div className="score-max">/100</div>
              </div>

              <div className="score-emoji">
                {getScoreEmoji(securityScore)}
              </div>
            </>
          )}
        </div>

        {/* Status Text */}
        <div className="status-section">
          <div
            className="status-badge"
            style={{ borderColor: getScoreColor(securityScore) }}
            role="status"
            aria-live="polite"
          >
            {getStatusText(scoreStatus)}
          </div>
          <div className="status-message">
            {getStatusMessage(securityScore)}
          </div>
        </div>
      </div>

      {/* Score Evolution Graph */}
      {scoreHistory.length > 0 && (
        <div className="score-history-section">
          <h3 className="section-title">Votre progression</h3>
          <div className="score-graph">
            <svg
              viewBox="0 0 300 100"
              className="graph-svg"
              role="img"
              aria-label="Graphique de progression du score de sécurité"
            >
              {/* Grid lines */}
              <line x1="0" y1="75" x2="300" y2="75" className="grid-line" />
              <line x1="0" y1="50" x2="300" y2="50" className="grid-line" />
              <line x1="0" y1="25" x2="300" y2="25" className="grid-line" />

              {/* Plot line */}
              <polyline
                points={scoreHistory
                  .map((score, idx) => {
                    const x = (idx / (scoreHistory.length - 1)) * 280 + 10;
                    const y = 80 - (score / 100) * 60;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                className="graph-line"
                fill="none"
              />

              {/* Data points */}
              {scoreHistory.map((score, idx) => {
                const x = (idx / (scoreHistory.length - 1)) * 280 + 10;
                const y = 80 - (score / 100) * 60;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="3"
                    className="graph-point"
                    role="button"
                    tabIndex="0"
                    aria-label={`Jour ${idx + 1}: ${score} points`}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Weekly Summary */}
      <div className="weekly-summary-section">
        <h3 className="section-title">Cette semaine</h3>

        <div className="summary-items">
          {/* Scams Blocked */}
          <div className="summary-item">
            <div className="summary-icon">🛡️</div>
            <div className="summary-content">
              <div className="summary-label">Arnaques détectées et arrêtées</div>
              <div className="summary-value">{weeklyStats.scamsBlocked}</div>
            </div>
          </div>

          {/* Quizzes Completed */}
          <div className="summary-item">
            <div className="summary-icon">✓</div>
            <div className="summary-content">
              <div className="summary-label">Quizz réussis</div>
              <div className="summary-value">{weeklyStats.quizzesCompleted}</div>
            </div>
          </div>

          {/* Guardian Status */}
          <div className="summary-item">
            <div className="summary-icon">👁️</div>
            <div className="summary-content">
              <div className="summary-label">Ange gardien vous surveille</div>
              <div className="summary-value">
                {weeklyStats.guardianActive ? 'Actif' : 'Inactif'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <button
          className="continue-button"
          onClick={() => window.location.href = '/main'}
          aria-label="Continuer vers l'application principale"
        >
          CONTINUER
        </button>
      </div>

      {/* Accessibility Skip Link */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
    </div>
  );
};

export default SecurityHeartDashboard;
