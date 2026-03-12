/**
 * Analytics Dashboard Module
 * Displays DAU/MAU trends, threat analysis, and retention metrics
 * Story Points: 8
 */

import React, { useState, useEffect } from 'react';
import '../styles/AnalyticsDashboard.css';

const AnalyticsDashboard = ({ institutionId }) => {
  const [analytics, setAnalytics] = useState({
    dau: 1250,
    mau: 4850,
    totalAnalyses: 18750,
    threatDetected: 1240,
    retention: 68,
    avgTimePerAnalysis: 2.3
  });

  const [timeRange, setTimeRange] = useState('month'); // day, week, month, year

  useEffect(() => {
    // TODO: Fetch analytics data from API
    // For MVP, using mock data
  }, [institutionId, timeRange]);

  const metricsData = [
    {
      label: 'Utilisateurs Actifs Quotidiens',
      value: analytics.dau,
      unit: 'utilisateurs',
      icon: '👥',
      color: '#3498db'
    },
    {
      label: 'Utilisateurs Actifs Mensuels',
      value: analytics.mau,
      unit: 'utilisateurs',
      icon: '📊',
      color: '#2ecc71'
    },
    {
      label: 'Total Analyses',
      value: analytics.totalAnalyses,
      unit: 'analyses',
      icon: '🔍',
      color: '#f39c12'
    },
    {
      label: 'Menaces Détectées',
      value: analytics.threatDetected,
      unit: 'arnaques',
      icon: '⚠️',
      color: '#e74c3c'
    },
    {
      label: 'Taux de Rétention',
      value: analytics.retention,
      unit: '%',
      icon: '📈',
      color: '#9b59b6'
    },
    {
      label: 'Temps Moyen par Analyse',
      value: analytics.avgTimePerAnalysis,
      unit: 's',
      icon: '⏱️',
      color: '#1abc9c'
    }
  ];

  return (
    <div className="analytics-dashboard-container">
      {/* Header with Time Range Selector */}
      <div className="analytics-header">
        <h2>Analytiques et Statistiques</h2>
        <div className="time-range-selector">
          <button
            className={`time-btn ${timeRange === 'day' ? 'active' : ''}`}
            onClick={() => setTimeRange('day')}
          >
            Jour
          </button>
          <button
            className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Semaine
          </button>
          <button
            className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Mois
          </button>
          <button
            className={`time-btn ${timeRange === 'year' ? 'active' : ''}`}
            onClick={() => setTimeRange('year')}
          >
            Année
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        {metricsData.map((metric, index) => (
          <div
            key={index}
            className="metric-card"
            style={{ borderLeftColor: metric.color }}
          >
            <div className="metric-icon">{metric.icon}</div>
            <div className="metric-content">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">
                {metric.value.toLocaleString('fr-FR')}
                <span className="metric-unit">{metric.unit}</span>
              </div>
            </div>
            <div className="metric-trend">↑ 12%</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Tendance DAU/MAU</h3>
          <div className="chart-placeholder">
            <p>📈 Graphique DAU/MAU (à implémenter avec Chart.js ou Recharts)</p>
            <div className="chart-bars">
              <div className="bar" style={{ height: '30%' }}></div>
              <div className="bar" style={{ height: '45%' }}></div>
              <div className="bar" style={{ height: '60%' }}></div>
              <div className="bar" style={{ height: '55%' }}></div>
              <div className="bar" style={{ height: '70%' }}></div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Analyses par Type</h3>
          <div className="chart-placeholder">
            <p>🥧 Graphique camembert par type d'arnaque</p>
            <div className="pie-chart">
              <div className="pie-segment" style={{ width: '40%', backgroundColor: '#3498db' }}></div>
              <div className="pie-segment" style={{ width: '30%', backgroundColor: '#e74c3c' }}></div>
              <div className="pie-segment" style={{ width: '20%', backgroundColor: '#f39c12' }}></div>
              <div className="pie-segment" style={{ width: '10%', backgroundColor: '#2ecc71' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Threats */}
      <div className="threats-section">
        <h3>Menaces les Plus Fréquentes</h3>
        <table className="threats-table">
          <thead>
            <tr>
              <th>Type d'Arnaque</th>
              <th>Détections</th>
              <th>% du Total</th>
              <th>Tendance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SMS Phishing Bancaire</td>
              <td>456</td>
              <td>36.8%</td>
              <td><span className="trend-up">↑ +15%</span></td>
            </tr>
            <tr>
              <td>Email Faux Paiement</td>
              <td>234</td>
              <td>18.9%</td>
              <td><span className="trend-down">↓ -5%</span></td>
            </tr>
            <tr>
              <td>Arnaque au Support Client</td>
              <td>187</td>
              <td>15.1%</td>
              <td><span className="trend-up">↑ +8%</span></td>
            </tr>
            <tr>
              <td>Fraude Identité</td>
              <td>156</td>
              <td>12.6%</td>
              <td><span className="trend-stable">→ 0%</span></td>
            </tr>
            <tr>
              <td>Arnaque Au Legs</td>
              <td>107</td>
              <td>8.6%</td>
              <td><span className="trend-down">↓ -3%</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Health Status */}
      <div className="health-status">
        <h3>État de Santé de la Plateforme</h3>
        <div className="health-items">
          <div className="health-item">
            <span className="health-indicator healthy"></span>
            <span>API Response Time: 145ms</span>
          </div>
          <div className="health-item">
            <span className="health-indicator healthy"></span>
            <span>Database: Connected</span>
          </div>
          <div className="health-item">
            <span className="health-indicator healthy"></span>
            <span>LLM Service: Operational</span>
          </div>
          <div className="health-item">
            <span className="health-indicator healthy"></span>
            <span>Email Service: Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
