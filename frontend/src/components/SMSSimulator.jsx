import React, { useState, useEffect, useRef } from 'react';
import { THREAT_SCENARIOS, getRandomScenarios } from '../data/scenarios';
import '../styles/SMSSimulator.css';

/**
 * SMSSimulator Component
 * Interactive SMS scam detection training simulator
 *
 * Features:
 * - Display realistic SMS scenarios
 * - User identifies scam or legitimate
 * - Immediate feedback with explanation
 * - Score tracking
 * - Senior-friendly design (18px font, 56px touch targets)
 * - Full WCAG AAA accessibility
 */
const SMSSimulator = ({ onComplete = null, initialScenarios = null, scenarioCount = 10 }) => {
  const containerRef = useRef(null);
  const [scenarios, setScenarios] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [simulatorStatus, setSimulatorStatus] = useState('loading'); // loading | running | complete

  useEffect(() => {
    // Initialize scenarios on mount
    const initialScenarioSet = initialScenarios || getRandomScenarios(scenarioCount);
    setScenarios(initialScenarioSet);
    setSimulatorStatus('running');
  }, [initialScenarios, scenarioCount]);

  useEffect(() => {
    // Focus management
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, [currentIndex, showAnswer]);

  const currentScenario = scenarios[currentIndex];
  const isLastQuestion = currentIndex === scenarios.length - 1;
  const completionPercentage = Math.round(((currentIndex + 1) / scenarios.length) * 100);

  /**
   * Handle user selection (scam or legitimate)
   */
  const handleSelection = (selectedAnswer) => {
    if (userAnswer !== null) return; // Already answered

    const correct = selectedAnswer === currentScenario.is_scam;
    setUserAnswer(selectedAnswer);
    setIsCorrect(correct);
    if (correct) {
      setScore(score + 1);
    }
    setShowAnswer(true);
  };

  /**
   * Move to next scenario
   */
  const handleNext = () => {
    if (isLastQuestion) {
      setSimulatorStatus('complete');
      if (onComplete) {
        onComplete({
          score,
          total: scenarios.length,
          percentage: Math.round((score / scenarios.length) * 100),
        });
      }
    } else {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer(null);
      setIsCorrect(null);
      setShowAnswer(false);
    }
  };

  /**
   * Restart the simulator
   */
  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer(null);
    setShowAnswer(false);
    setIsCorrect(null);
    setSimulatorStatus('running');
    const newScenarios = getRandomScenarios(scenarioCount);
    setScenarios(newScenarios);
  };

  // Loading state
  if (simulatorStatus === 'loading') {
    return (
      <div className="sms-simulator-container" ref={containerRef} tabIndex={-1}>
        <div className="sms-simulator-loading">
          <p>Chargement des scénarios...</p>
        </div>
      </div>
    );
  }

  // Completion state
  if (simulatorStatus === 'complete') {
    const percentage = Math.round((score / scenarios.length) * 100);
    let messageColor = 'success'; // green
    let resultMessage = '🎉 Excellent! Vous êtes bien protégé contre les arnaque par SMS.';
    if (percentage < 60) {
      messageColor = 'danger';
      resultMessage = '⚠️ Continuez à vous entraîner. Les arnaques par SMS sont très courantes.';
    } else if (percentage < 80) {
      messageColor = 'warning';
      resultMessage = '✅ Bien joué! Quelques améliorations possibles.';
    }

    return (
      <div className="sms-simulator-container" ref={containerRef} tabIndex={-1}>
        <div className={`sms-simulator-completion sms-simulator-completion-${messageColor}`}>
          <h2>Simulation terminée</h2>
          <div className="sms-simulator-final-score">
            <p className="sms-simulator-score-value">{score}/{scenarios.length}</p>
            <p className="sms-simulator-score-percentage">{percentage}%</p>
          </div>
          <p className="sms-simulator-result-message">{resultMessage}</p>
          <button
            className="sms-simulator-btn sms-simulator-btn-primary"
            onClick={handleRestart}
            aria-label="Recommencer la simulation"
          >
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  // Main simulator view
  if (!currentScenario) {
    return (
      <div className="sms-simulator-container" ref={containerRef} tabIndex={-1}>
        <div className="sms-simulator-error">
          <p>Erreur: Aucun scénario disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sms-simulator-container" ref={containerRef} tabIndex={-1}>
      {/* Progress bar */}
      <div className="sms-simulator-progress-section">
        <div className="sms-simulator-progress-info">
          <span>Question {currentIndex + 1}/{scenarios.length}</span>
          <span className="sms-simulator-score-badge">Score: {score}</span>
        </div>
        <div className="sms-simulator-progress-bar">
          <div
            className="sms-simulator-progress-fill"
            style={{ '--progress': `${completionPercentage}%` }}
            role="progressbar"
            aria-valuenow={completionPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progression: ${completionPercentage}%`}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="sms-simulator-content">
        {/* Header with threat level indicator */}
        <div className="sms-simulator-header">
          <div className={`sms-simulator-threat-badge sms-simulator-threat-${currentScenario.threat_level}`}>
            {currentScenario.threat_level === 'high' && '🔴'}
            {currentScenario.threat_level === 'medium' && '🟡'}
            {currentScenario.threat_level === 'low' && '🟢'}
            <span>{currentScenario.threat_level.toUpperCase()}</span>
          </div>
          <p className="sms-simulator-institution">{currentScenario.institution}</p>
        </div>

        {/* SMS Message display */}
        <div className="sms-simulator-message-container">
          <div className="sms-simulator-message">
            <p className="sms-simulator-message-text">{currentScenario.message}</p>
          </div>
        </div>

        {/* User hasn't answered yet */}
        {!showAnswer && (
          <div className="sms-simulator-question">
            <p className="sms-simulator-question-text">Est-ce une arnaque ou un vrai message?</p>
            <div className="sms-simulator-button-group">
              <button
                className="sms-simulator-btn sms-simulator-btn-scam"
                onClick={() => handleSelection(true)}
                disabled={userAnswer !== null}
                aria-label="C'est une arnaque"
              >
                🚨 C'est une arnaque
              </button>
              <button
                className="sms-simulator-btn sms-simulator-btn-legitimate"
                onClick={() => handleSelection(false)}
                disabled={userAnswer !== null}
                aria-label="C'est un vrai message"
              >
                ✅ Vrai message
              </button>
            </div>
          </div>
        )}

        {/* Answer revealed */}
        {showAnswer && (
          <div className={`sms-simulator-answer sms-simulator-answer-${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="sms-simulator-answer-header">
              {isCorrect && <p className="sms-simulator-answer-icon">✅ Correct!</p>}
              {!isCorrect && <p className="sms-simulator-answer-icon">❌ Incorrect</p>}
            </div>

            <div className="sms-simulator-answer-content">
              <p className="sms-simulator-answer-truth">
                <strong>Réponse:</strong> {currentScenario.is_scam ? 'C\'est une arnaque' : 'C\'est un vrai message'}
              </p>
              <p className="sms-simulator-answer-explanation">
                <strong>Explication:</strong> {currentScenario.explanation_fr}
              </p>

              {/* Threat indicators */}
              {currentScenario.threat_indicators && currentScenario.threat_indicators.length > 0 && (
                <div className="sms-simulator-threat-indicators">
                  <p className="sms-simulator-indicators-title">
                    <strong>Signes d'alerte:</strong>
                  </p>
                  <ul className="sms-simulator-indicators-list">
                    {currentScenario.threat_indicators.map((indicator, idx) => (
                      <li key={idx}>• {indicator}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Next button */}
            <button
              className="sms-simulator-btn sms-simulator-btn-primary"
              onClick={handleNext}
              aria-label={isLastQuestion ? 'Voir les résultats' : 'Question suivante'}
            >
              {isLastQuestion ? 'Voir les résultats' : 'Suivant →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSSimulator;
