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
        <div className="stat-card stat-analyses" aria-label={`${total} messages analysés`}>
          <div className="stat-icon" aria-hidden="true">🔍</div>
          <div className="stat-content">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Messages Analysés</div>
          </div>
        </div>

        {/* Scams Avoided */}
        <div className="stat-card stat-avoided" aria-label={`${scamsAvoided} arnaques évitées`}>
          <div className="stat-icon" aria-hidden="true">✅</div>
          <div className="stat-content">
            <div className="stat-value">{scamsAvoided}</div>
            <div className="stat-label">Arnaques Évitées</div>
          </div>
        </div>

        {/* Threats Detected */}
        <div className="stat-card stat-threats" aria-label={`${threatsDetected} menaces détectées`}>
          <div className="stat-icon" aria-hidden="true">🚨</div>
          <div className="stat-content">
            <div className="stat-value">{threatsDetected}</div>
            <div className="stat-label">Menaces Détectées</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="stat-card stat-rate" aria-label={`Taux de réussite: ${successRate} pour cent`}>
          <div className="stat-icon" aria-hidden="true">📈</div>
          <div className="stat-content">
            <div className="stat-value">{successRate}%</div>
            <div className="stat-label">Taux de Réussite</div>
          </div>
        </div>

        {/* Average Score */}
        <div className="stat-card stat-score" aria-label={`Score moyen: ${avgScore}`}>
          <div className="stat-icon" aria-hidden="true">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{avgScore}</div>
            <div className="stat-label">Score Moyen</div>
          </div>
        </div>

        {/* Total XP */}
        <div className="stat-card stat-xp" aria-label={`${totalXpEarned} points gagnés`}>
          <div className="stat-icon" aria-hidden="true">🎖️</div>
          <div className="stat-content">
            <div className="stat-value">{totalXpEarned}</div>
            <div className="stat-label">Points Gagnés</div>
          </div>
        </div>
      </div>

      {/* Risk Distribution Chart */}
      {total > 0 && (
        <div className="risk-distribution">
          <h3 id="chart-title-distribution" className="chart-title">Distribution des Risques</h3>

          <div className="risk-bars" aria-labelledby="chart-title-distribution">
            {/* Safe */}
            <div className="risk-bar-item">
              <div className="risk-bar-label">
                <span className="label-text">Sûr</span>
                <span className="label-count">{safe}</span>
              </div>
              <div className="risk-bar-container">
                <div
                  className="risk-bar-fill safe"
                  role="progressbar"
                  aria-label="Messages sûrs"
                  aria-valuenow={Math.round((safe / total) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{ width: `${(safe / total) * 100}%` }}
                />
              </div>
              <div className="risk-bar-percentage" aria-hidden="true">
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
                  role="progressbar"
                  aria-label="Messages modérés"
                  aria-valuenow={Math.round((moderate / total) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{ width: `${(moderate / total) * 100}%` }}
                />
              </div>
              <div className="risk-bar-percentage" aria-hidden="true">
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
                  role="progressbar"
                  aria-label="Messages dangereux"
                  aria-valuenow={Math.round((danger / total) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{ width: `${(danger / total) * 100}%` }}
                />
              </div>
              <div className="risk-bar-percentage" aria-hidden="true">
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
