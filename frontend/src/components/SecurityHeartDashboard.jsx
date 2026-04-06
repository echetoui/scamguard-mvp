import React, { useState, useEffect } from 'react';
import { Section } from '@/design-system';
import { Card } from '@/design-system';
import { Button } from '@/design-system';
import { Badge } from '@/design-system';
import { Alert } from '@/design-system';
import { colors, typography, spacing } from '@/styles/design-tokens';
import {
  getScoreStatus,
  getScoreEmoji,
  getStatusMessage,
  getStatusText,
  calculateGraphPoints,
  calculateDataPoint
} from '../utils/dashboardUtils';
import './SecurityHeartDashboard.css';

/**
 * Generate dynamic alerts based on score and stats
 * @param {number} score - Security score 0-100
 * @param {object} stats - Weekly stats {scamsBlocked, quizzesCompleted, guardianActive}
 * @returns {array} Array of alert objects
 */
const generateAlerts = (score, stats) => {
  const generatedAlerts = [];

  // Critical score alert (highest priority)
  if (score < 30) {
    generatedAlerts.push({
      id: 'critical',
      variant: 'error',
      title: 'Sécurité Critique',
      message: 'Votre score est très faible. Nous recommandons une action immédiate.'
    });
  }
  // Low score alert
  else if (score < 50) {
    generatedAlerts.push({
      id: 'low-score',
      variant: 'warning',
      title: 'Score Faible',
      message: 'Votre score de sécurité a baissé. Complétez un quiz pour l\'améliorer.'
    });
  }

  // Quiz recommendation (lowest priority)
  if (stats.quizzesCompleted < 2) {
    generatedAlerts.push({
      id: 'quiz-recommend',
      variant: 'info',
      title: 'Conseil',
      message: `Vous avez complété ${stats.quizzesCompleted} quiz. Un de plus vous aiderait!`
    });
  }

  // Return max 3 alerts
  return generatedAlerts.slice(0, 3);
};

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
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

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
      const generatedAlerts = generateAlerts(mockScore, mockStats);
      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Error fetching security data:', error);
      setScoreStatus('error');
      setAlerts([{
        id: 'error',
        variant: 'error',
        title: 'Erreur de Chargement',
        message: 'Nous n\'avons pas pu charger vos données. Veuillez rafraîchir.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSecurityData, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissAlert = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  return (
    <div className="security-heart-dashboard">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: spacing.lg, marginBottom: spacing['2xl'] }}>
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.variant}
              title={alert.title}
              message={alert.message}
              dismissable={true}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </div>
      )}

      {/* Score Section */}
      {!isLoading && (
        <Section
          title="Votre Sécurité"
          subtitle="Protection actuelle"
        >
          <Card variant="elevated">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.lg }}>
              {/* Heart Icon */}
              <div style={{ fontSize: '120px', lineHeight: 1 }}>❤️</div>

              {/* Score Display */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: `${typography.fontSize.displaySm}px`, fontWeight: typography.fontWeight.bold, color: colors.textPrimary }}>
                  {securityScore}
                </div>
                <div style={{ fontSize: `${typography.fontSize.base}px`, color: colors.textSecondary }}>
                  /100
                </div>
              </div>

              {/* Status Badge */}
              <Badge
                variant="filled"
                size="large"
                color={scoreStatus === 'safe' ? 'secondary' : scoreStatus === 'moderate' ? 'tertiary' : 'error'}
              >
                {getStatusText(scoreStatus)}
              </Badge>

              {/* Encouraging Message */}
              <p style={{ marginTop: spacing.lg, textAlign: 'center', fontSize: `${typography.fontSize.base}px`, color: colors.textSecondary, margin: 0 }}>
                {getStatusMessage(securityScore)}
              </p>
            </div>
          </Card>
        </Section>
      )}

      {/* Loading State */}
      {isLoading && (
        <Section title="Chargement...">
          <Card variant="elevated">
            <div style={{ textAlign: 'center', padding: `${spacing['2xl']} ${spacing.lg}` }}>
              <div className="heart-spinner">
                <div className="spinner"></div>
                <p style={{ fontSize: `${typography.fontSize.base}px`, color: colors.textPrimary, margin: 0, marginTop: spacing.lg }}>Calcul en cours...</p>
              </div>
            </div>
          </Card>
        </Section>
      )}

      {/* Progress Section */}
      {scoreHistory.length > 0 && !isLoading && (
        <Section
          title="Votre Progression"
          subtitle="Derniers 5 jours"
        >
          <Card variant="outlined">
            <svg
              viewBox="0 0 300 100"
              className="graph-svg"
              style={{ width: '100%', height: 'auto', minHeight: '150px' }}
              role="img"
              aria-label="Graphique de progression du score de sécurité"
            >
              {/* Grid lines */}
              <line x1="0" y1="75" x2="300" y2="75" className="grid-line" />
              <line x1="0" y1="50" x2="300" y2="50" className="grid-line" />
              <line x1="0" y1="25" x2="300" y2="25" className="grid-line" />

              {/* Plot line */}
              <polyline
                points={calculateGraphPoints(scoreHistory)}
                className="graph-line"
                fill="none"
              />

              {/* Data points */}
              {scoreHistory.map((score, idx) => {
                const point = calculateDataPoint(score, idx, scoreHistory.length);
                return (
                  <circle
                    key={idx}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    className="graph-point"
                  />
                );
              })}
            </svg>
          </Card>
        </Section>
      )}

      {/* Weekly Stats Section */}
      {!isLoading && (
        <Section
          title="Cette Semaine"
          subtitle="Vos activités"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing.lg }}>
            {/* Scams Blocked Card */}
            <Card variant="filled">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.md, textAlign: 'center' }}>
                <div style={{ fontSize: '40px', lineHeight: 1 }}>🛡️</div>
                <div style={{ fontSize: `${typography.fontSize.base}px`, color: colors.textSecondary }}>
                  Arnaques détectées
                </div>
                <Badge variant="filled" size="large" color="secondary">
                  {weeklyStats.scamsBlocked}
                </Badge>
              </div>
            </Card>

            {/* Quizzes Completed Card */}
            <Card variant="filled">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.md, textAlign: 'center' }}>
                <div style={{ fontSize: '40px', lineHeight: 1 }}>✓</div>
                <div style={{ fontSize: `${typography.fontSize.base}px`, color: colors.textSecondary }}>
                  Quizz réussis
                </div>
                <Badge variant="filled" size="large" color="primary">
                  {weeklyStats.quizzesCompleted}
                </Badge>
              </div>
            </Card>

            {/* Guardian Status Card */}
            <Card variant="filled">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.md, textAlign: 'center' }}>
                <div style={{ fontSize: '40px', lineHeight: 1 }}>👁️</div>
                <div style={{ fontSize: `${typography.fontSize.base}px`, color: colors.textSecondary }}>
                  Ange gardien
                </div>
                <Badge
                  variant="tonal"
                  size="large"
                  color={weeklyStats.guardianActive ? 'secondary' : 'error'}
                >
                  {weeklyStats.guardianActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </Card>
          </div>
        </Section>
      )}

      {/* CTA Section */}
      {!isLoading && (
        <Section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, width: '100%' }}>
            <Button
              variant="primary"
              size="large"
              onClick={() => window.location.href = '/main'}
              style={{ width: '100%' }}
            >
              CONTINUER
            </Button>
            <Button
              variant="secondary"
              size="large"
              onClick={() => console.log('Settings clicked')}
              style={{ width: '100%' }}
            >
              PARAMÈTRES
            </Button>
          </div>
        </Section>
      )}
    </div>
  );
};

export default SecurityHeartDashboard;
