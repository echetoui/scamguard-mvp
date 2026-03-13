/**
 * SMS Simulator Component
 * Phase 2 Sprint 5 - Interactive SMS scam training
 *
 * Train users by presenting real (anonymized) SMS scams
 * Users decide: "Je clique" (I click) or "Je supprime" (I delete)
 */

import { useState, useEffect } from 'react';
import { getDailySMS, getRandomSMS, getSMSStats } from '../data/smsMessages';
import '../styles/SMSSimulator.css';

export default function SMSSimulator() {
  const [currentSMS, setCurrentSMS] = useState(null);
  const [userResponse, setUserResponse] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [stats, setStats] = useState(null);
  const [difficulty, setDifficulty] = useState(null);

  useEffect(() => {
    // Load stats
    setStats(getSMSStats());
    // Load daily SMS on mount
    loadDailySMS();
  }, []);

  const loadDailySMS = () => {
    const sms = getDailySMS();
    setCurrentSMS(sms);
    setUserResponse(null);
    setFeedback('');
    setShowExplanation(false);
  };

  const handleResponse = (response) => {
    if (!currentSMS) return;

    setUserResponse(response);
    const isCorrect = response === currentSMS.correctResponse;

    if (isCorrect) {
      setScore(score + 1);
      setFeedback('✅ Correct! Bien joué!');
    } else {
      setFeedback(
        `❌ Incorrect. La bonne réponse était "${currentSMS.correctResponse === 'click' ? 'Je clique' : 'Je supprime'}"`
      );
    }

    setTotalAnswered(totalAnswered + 1);
    setShowExplanation(true);
  };

  const loadNextSMS = () => {
    const sms = difficulty ? getRandomSMS(difficulty) : getRandomSMS();
    setCurrentSMS(sms);
    setUserResponse(null);
    setFeedback('');
    setShowExplanation(false);
  };

  const accuracy =
    totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  if (!currentSMS) {
    return (
      <div className="sms-simulator loading">
        <p>Chargement du message SMS...</p>
      </div>
    );
  }

  return (
    <div className="sms-simulator">
      <div className="sms-header">
        <h2>📱 Entraînement SMS - Détectez les Arnaques</h2>
        <div className="sms-stats">
          <div className="stat-item">
            <span className="stat-label">Réponses:</span>
            <span className="stat-value">{totalAnswered}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Correctes:</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Précision:</span>
            <span className="stat-value accuracy-badge">{accuracy}%</span>
          </div>
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="difficulty-filter">
        <button
          className={`filter-btn ${difficulty === null ? 'active' : ''}`}
          onClick={() => setDifficulty(null)}
        >
          Tous les niveaux
        </button>
        <button
          className={`filter-btn ${difficulty === 'easy' ? 'active' : ''}`}
          onClick={() => setDifficulty('easy')}
        >
          Facile
        </button>
        <button
          className={`filter-btn ${difficulty === 'medium' ? 'active' : ''}`}
          onClick={() => setDifficulty('medium')}
        >
          Moyen
        </button>
        <button
          className={`filter-btn ${difficulty === 'hard' ? 'active' : ''}`}
          onClick={() => setDifficulty('hard')}
        >
          Difficile
        </button>
      </div>

      {/* SMS Message Display */}
      <div className="sms-message-container">
        <div className="sms-phone-frame">
          <div className="phone-header">
            <span className="phone-time">14:32</span>
            <span className="phone-carrier">QuébecMobile</span>
          </div>

          <div className="sms-message">
            <p className="sms-text">{currentSMS.text}</p>
            <span className="sms-time">Aujourd'hui 14:32</span>
          </div>
        </div>

        {/* Threat Level Indicator */}
        <div className="threat-indicator">
          <span className="threat-label">Niveau de menace:</span>
          <div className="threat-bar">
            <div
              className={`threat-fill threat-${Math.min(
                Math.ceil(currentSMS.threatLevel / 3),
                3
              )}`}
              style={{ width: `${(currentSMS.threatLevel / 10) * 100}%` }}
            />
          </div>
          <span className="threat-value">{currentSMS.threatLevel}/10</span>
        </div>
      </div>

      {/* User Decision Buttons */}
      {!showExplanation ? (
        <div className="sms-decision">
          <p className="decision-prompt">Que faites-vous?</p>
          <div className="decision-buttons">
            <button
              className="sms-btn sms-btn-click"
              onClick={() => handleResponse('click')}
              aria-label="Je clique sur le lien"
            >
              📱 Je clique
            </button>
            <button
              className="sms-btn sms-btn-delete"
              onClick={() => handleResponse('delete')}
              aria-label="Je supprime le message"
            >
              🗑️ Je supprime
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Feedback Section */}
          <div className={`sms-feedback ${userResponse === currentSMS.correctResponse ? 'correct' : 'incorrect'}`}>
            <p className="feedback-text">{feedback}</p>
          </div>

          {/* Explanation Section */}
          <div className="sms-explanation">
            <h4>💡 Pourquoi?</h4>
            <p>{currentSMS.explanation}</p>

            {/* Red Flags */}
            <div className="red-flags">
              <h5>🚩 Signaux d'alerte:</h5>
              <ul>
                {currentSMS.redFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>

            {/* Metadata */}
            <div className="sms-metadata">
              <span className="badge badge-source">{currentSMS.source}</span>
              <span className={`badge badge-category badge-${currentSMS.category}`}>
                {currentSMS.category === 'banking_fraud' && 'Arnaque Bancaire'}
                {currentSMS.category === 'phishing' && 'Phishing'}
                {currentSMS.category === 'prize_scam' && 'Faux Prix'}
                {currentSMS.category === 'delivery_scam' && 'Arnaque Livraison'}
                {currentSMS.category === 'government_impersonation' && 'Usurpation Gouvernement'}
                {currentSMS.category === 'impersonation' && 'Usurpation'}
              </span>
              <span className={`badge badge-difficulty badge-${currentSMS.difficulty}`}>
                {currentSMS.difficulty === 'easy' && 'Facile'}
                {currentSMS.difficulty === 'medium' && 'Moyen'}
                {currentSMS.difficulty === 'hard' && 'Difficile'}
              </span>
            </div>
          </div>

          {/* Next Button */}
          <button className="sms-btn sms-btn-next" onClick={loadNextSMS}>
            Message suivant →
          </button>
        </>
      )}

      {/* Statistics Panel */}
      {stats && (
        <div className="sms-stats-panel">
          <h4>📊 Statistiques des messages</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-title">Total</span>
              <span className="stat-number">{stats.total}</span>
            </div>
            <div className="stat-card">
              <span className="stat-title">Facile</span>
              <span className="stat-number">{stats.byDifficulty.easy}</span>
            </div>
            <div className="stat-card">
              <span className="stat-title">Moyen</span>
              <span className="stat-number">{stats.byDifficulty.medium}</span>
            </div>
            <div className="stat-card">
              <span className="stat-title">Difficile</span>
              <span className="stat-number">{stats.byDifficulty.hard}</span>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="sms-info">
        <p>
          <strong>💡 Conseil:</strong> Les vraies institutions ne demandent JAMAIS d'actions urgentes par SMS.
          Si vous avez un doute, raccrochez et appelez le numéro officiel au dos de votre carte bancaire.
        </p>
      </div>
    </div>
  );
}
