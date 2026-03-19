import React, { useState, useEffect } from 'react';
import Button from '../design-system/Button';
import QuebecFraudAlerts from './QuebecFraudAlerts';
import './DashboardStyles.css';

/**
 * ScamGuard Dashboard Component
 *
 * Main user dashboard showing:
 * - User greeting and overview
 * - Recent scam analyses with risk scores
 * - Gamification progress (XP, badges, level)
 * - Quick stats (analyses, protections, etc.)
 * - Quick access to main features
 * - Privacy controls and account settings
 *
 * @component
 * @returns {JSX.Element} Complete dashboard interface
 */
const Dashboard = ({ userEmail, userId, onAnalyzeClick, onSettingsClick }) => {
  const [userStats, setUserStats] = useState({
    analysesCount: 0,
    fraudBlockedCount: 0,
    xpPoints: 0,
    level: 1,
    badges: [],
    recentAnalyses: [],
    protectionStatus: 'active'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserStats();
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      // In production, this would call the backend API
      // For MVP, we use mock data
      const mockStats = {
        analysesCount: 12,
        fraudBlockedCount: 3,
        xpPoints: 450,
        level: 2,
        badges: ['first_analysis', 'fraud_fighter', 'trusted_user'],
        recentAnalyses: [
          {
            id: 1,
            date: '2026-02-18',
            type: 'Romance Scam',
            riskScore: 92,
            status: 'blocked'
          },
          {
            id: 2,
            date: '2026-02-17',
            type: 'Tech Support Scam',
            riskScore: 78,
            status: 'suspicious'
          },
          {
            id: 3,
            date: '2026-02-16',
            type: 'Prize Scam',
            riskScore: 45,
            status: 'low_risk'
          }
        ],
        protectionStatus: 'active'
      };
      setUserStats(mockStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'var(--color-danger)'; // Red - High risk
    if (score >= 50) return 'var(--color-warning)'; // Orange - Medium risk
    return 'var(--color-success)'; // Green - Low risk
  };

  const getRiskLabel = (score) => {
    if (score >= 80) return 'High Risk';
    if (score >= 50) return 'Medium Risk';
    return 'Low Risk';
  };

  const getBadgeName = (badgeId) => {
    const badgeMap = {
      'first_analysis': { name: 'First Step', icon: '🎯', color: 'var(--color-primary)' },
      'fraud_fighter': { name: 'Fraud Fighter', icon: '🛡️', color: 'var(--color-safe)' },
      'trusted_user': { name: 'Trusted User', icon: '⭐', color: 'var(--color-warning)' },
      'shield_master': { name: 'Shield Master', icon: '👑', color: 'var(--color-secondary)' }
    };
    return badgeMap[badgeId] || { name: 'Badge', icon: '🏆', color: 'var(--color-text-secondary)' };
  };

  const calculateProgress = () => {
    const nextLevelXP = userStats.level * 500; // XP needed for next level
    return Math.min((userStats.xpPoints % 500) / 500 * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="dashboard dashboard--loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header Section */}
      <header className="dashboard__header">
        <div className="dashboard__header-content">
          <h1 className="dashboard__title">Welcome, {userEmail.split('@')[0]}! 👋</h1>
          <p className="dashboard__subtitle">Your ScamGuard protection status</p>
        </div>
        <div className="dashboard__protection-status">
          <div className={`status-badge status-badge--${userStats.protectionStatus}`}>
            <span className="status-dot"></span>
            {userStats.protectionStatus === 'active' ? 'Protection Active' : 'Protection Inactive'}
          </div>
        </div>
      </header>

      {/* Quick Stats Section */}
      <section className="dashboard__stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon--analyses">📊</div>
          <div className="stat-content">
            <div className="stat-label">Analyses Performed</div>
            <div className="stat-value">{userStats.analysesCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon--protected">🛡️</div>
          <div className="stat-content">
            <div className="stat-label">Fraud Attempts Blocked</div>
            <div className="stat-value">{userStats.fraudBlockedCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon--level">⭐</div>
          <div className="stat-content">
            <div className="stat-label">Your Level</div>
            <div className="stat-value">Level {userStats.level}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon--xp">✨</div>
          <div className="stat-content">
            <div className="stat-label">Experience Points</div>
            <div className="stat-value">{userStats.xpPoints} XP</div>
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section className="dashboard__section">
        <h2 className="dashboard__section-title">🎮 Your Progress</h2>

        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-label">Progress to Level {userStats.level + 1}</span>
            <span className="progress-xp">{userStats.xpPoints % 500} / 500 XP</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${calculateProgress()}%` }}></div>
          </div>
        </div>

        {userStats.badges.length > 0 && (
          <div className="badges-section">
            <h3 className="badges-title">Your Badges</h3>
            <div className="badges-grid">
              {userStats.badges.map((badgeId) => {
                const badge = getBadgeName(badgeId);
                return (
                  <div key={badgeId} className="badge" title={badge.name}>
                    <span className="badge-icon">{badge.icon}</span>
                    <span className="badge-name">{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Recent Analyses Section */}
      <section className="dashboard__section">
        <div className="section-header">
          <h2 className="dashboard__section-title">📋 Recent Analyses</h2>
          <Button
            variant="primary"
            size="small"
            onClick={onAnalyzeClick}
          >
            + New Analysis
          </Button>
        </div>

        {userStats.recentAnalyses.length > 0 ? (
          <div className="analyses-list">
            {userStats.recentAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className={`analysis-card analysis-card--${analysis.status}`}
                onClick={() => setSelectedAnalysis(
                  selectedAnalysis?.id === analysis.id ? null : analysis
                )}
              >
                <div className="analysis-header">
                  <div className="analysis-info">
                    <h3 className="analysis-type">{analysis.type}</h3>
                    <span className="analysis-date">{analysis.date}</span>
                  </div>
                  <div className="analysis-risk">
                    <div
                      className="risk-score"
                      style={{ backgroundColor: getRiskColor(analysis.riskScore) }}
                    >
                      {analysis.riskScore}%
                    </div>
                    <span className="risk-label">{getRiskLabel(analysis.riskScore)}</span>
                  </div>
                </div>

                {selectedAnalysis?.id === analysis.id && (
                  <div className="analysis-details">
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value">
                        {analysis.status === 'blocked' && '🚫 Blocked'}
                        {analysis.status === 'suspicious' && '⚠️ Suspicious'}
                        {analysis.status === 'low_risk' && '✅ Safe'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Risk Assessment:</span>
                      <span className="detail-value">{getRiskLabel(analysis.riskScore)}</span>
                    </div>
                    <p className="detail-advice">
                      {analysis.riskScore >= 80 &&
                        'We recommend avoiding contact with this person/organization. This appears to be a scam.'}
                      {analysis.riskScore < 80 && analysis.riskScore >= 50 &&
                        'Be cautious. This has some characteristics of a scam. Ask trusted people for advice.'}
                      {analysis.riskScore < 50 &&
                        'This appears to be legitimate, but always stay vigilant.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-state-text">No analyses yet. Start by analyzing a potential scam.</p>
            <Button
              variant="primary"
              onClick={onAnalyzeClick}
            >
              Analyze a Scam
            </Button>
          </div>
        )}
      </section>

      {/* Quick Actions Section */}
      <section className="dashboard__section">
        <h2 className="dashboard__section-title">⚡ Quick Actions</h2>
        <div className="quick-actions">
          <button className="action-button" onClick={onAnalyzeClick}>
            <span className="action-icon">🔍</span>
            <span className="action-text">Analyze Scam</span>
          </button>
          <button className="action-button" onClick={onSettingsClick}>
            <span className="action-icon">⚙️</span>
            <span className="action-text">Settings</span>
          </button>
          <button className="action-button" onClick={() => {/* View Privacy Policy */}}>
            <span className="action-icon">📄</span>
            <span className="action-text">Privacy Policy</span>
          </button>
          <button className="action-button" onClick={() => {/* View Help */}}>
            <span className="action-icon">❓</span>
            <span className="action-text">Help & FAQ</span>
          </button>
        </div>
      </section>

      {/* Quebec Fraud Alerts Section */}
      <section className="dashboard__section dashboard__section--alerts">
        <QuebecFraudAlerts />
      </section>

      {/* Privacy & Data Control Section */}
      <section className="dashboard__section dashboard__section--privacy">
        <h2 className="dashboard__section-title">🔐 Your Privacy</h2>
        <div className="privacy-info">
          <div className="privacy-item">
            <span className="privacy-icon">✅</span>
            <div className="privacy-content">
              <p className="privacy-title">Your data is protected</p>
              <p className="privacy-description">
                All your data is encrypted and automatically deleted after 30 days
              </p>
            </div>
          </div>
          <div className="privacy-item">
            <span className="privacy-icon">📋</span>
            <div className="privacy-content">
              <p className="privacy-title">Access your data anytime</p>
              <p className="privacy-description">
                You can request a copy of all your data at any time
              </p>
            </div>
          </div>
          <div className="privacy-item">
            <span className="privacy-icon">🗑️</span>
            <div className="privacy-content">
              <p className="privacy-title">Delete your data</p>
              <p className="privacy-description">
                You can delete your account and all associated data immediately
              </p>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={onSettingsClick}>
          Manage Privacy Settings
        </Button>
      </section>

      {/* Footer Section */}
      <footer className="dashboard__footer">
        <p className="footer-text">
          Need help? Contact our Data Protection Officer at <strong>privacy@scamguard.ca</strong>
        </p>
        <p className="footer-text">
          Questions? See our <a href="/help" className="footer-link">Help & FAQ</a> or
          <a href="/privacy-policy" className="footer-link">Privacy Policy</a>
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
