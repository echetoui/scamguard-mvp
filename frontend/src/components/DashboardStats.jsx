/**
 * DashboardStats Component
 * Phase 4.0.2 - Display analytics and statistics
 *
 * Shows key metrics: analyses count, scams avoided, success rate, etc
 */

import React from 'react';
import '../styles/DashboardStats.css';

export default function DashboardStats({ statistics = {}, analyses = [] }) {
  const {
    total = 0,
    safe = 0,
    moderate = 0,
    danger = 0,
    avgScore = 0,
    totalXpEarned = 0,
    safePercentage = 0,
  } = statistics;

  // Calculate additional metrics
  const scamsAvoided = safe; // Messages identified as safe
  const threatsDetected = moderate + danger;
  const successRate = total > 0 ? safePercentage : 0;

  return (
    <div className="dashboard-stats">
      <h2 className="stats-title">📊 Tableau de Bord</h2>

      {/* Main Metrics Grid */}
      <div className="stats-grid">
        {/* Total Analyses */}
        <div className="stat-card stat-analyses">
          <div className="stat-icon">🔍</div>
          <div className="stat-content">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Messages Analysés</div>
          </div>
        </div>

        {/* Scams Avoided */}
        <div className="stat-card stat-avoided">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{scamsAvoided}</div>
            <div className="stat-label">Arnaques Évitées</div>
          </div>
        </div>

        {/* Threats Detected */}
        <div className="stat-card stat-threats">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-value">{threatsDetected}</div>
            <div className="stat-label">Menaces Détectées</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="stat-card stat-rate">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{successRate}%</div>
            <div className="stat-label">Taux de Réussite</div>
          </div>
        </div>

        {/* Average Score */}
        <div className="stat-card stat-score">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{avgScore}</div>
            <div className="stat-label">Score Moyen</div>
          </div>
        </div>

        {/* Total XP */}
        <div className="stat-card stat-xp">
          <div className="stat-icon">🎖️</div>
          <div className="stat-content">
            <div className="stat-value">{totalXpEarned}</div>
            <div className="stat-label">Points Gagnés</div>
          </div>
        </div>
      </div>

      {/* Risk Distribution Chart */}
      {total > 0 && (
        <div className="risk-distribution">
          <h3 className="chart-title">Distribution des Risques</h3>

          <div className="risk-bars">
            {/* Safe */}
            <div className="risk-bar-item">
              <div className="risk-bar-label">
                <span className="label-text">Sûr</span>
                <span className="label-count">{safe}</span>
              </div>
              <div className="risk-bar-container">
                <div
                  className="risk-bar-fill safe"
                  style={{ width: `${(safe / total) * 100}%` }}
                />
              </div>
              <div className="risk-bar-percentage">
                {Math.round((safe / total) * 100)}%
              </div>
            </div>

            {/* Moderate */}
            <div className="risk-bar-item">
              <div className="risk-bar-label">
                <span className="label-text">Modéré</span>
                <span className="label-count">{moderate}</span>
              </div>
              <div className="risk-bar-container">
                <div
                  className="risk-bar-fill moderate"
                  style={{ width: `${(moderate / total) * 100}%` }}
                />
              </div>
              <div className="risk-bar-percentage">
                {Math.round((moderate / total) * 100)}%
              </div>
            </div>

            {/* Danger */}
            <div className="risk-bar-item">
              <div className="risk-bar-label">
                <span className="label-text">Dangereux</span>
                <span className="label-count">{danger}</span>
              </div>
              <div className="risk-bar-container">
                <div
                  className="risk-bar-fill danger"
                  style={{ width: `${(danger / total) * 100}%` }}
                />
              </div>
              <div className="risk-bar-percentage">
                {Math.round((danger / total) * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {total === 0 && (
        <div className="stats-empty">
          <p>📭 Aucune données yet</p>
          <p className="empty-hint">Analysez des messages pour voir les statistiques</p>
        </div>
      )}
    </div>
  );
}
