/**
 * QuizAcademie Component
 * Phase 1 Sprint 3 - Quiz Academy with Progress Tracking
 *
 * Multi-module quiz academy with badge system and progress tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import QuizModule from './QuizModule';
import {
  getModuleHighScore,
  isModulePassed,
  getModuleAttempts,
  getModuleState,
  saveModuleResult,
  getEarnedBadges,
} from '../utils/quizStorage';
import '../styles/QuizAcademie.css';

// Module definitions
const MODULES = [
  {
    id: 'phishing',
    title: 'Phishing & Arnaques Numériques',
    icon: '🛡️',
    description: 'Apprenez à identifier les tentatives de phishing et les arnaques numériques',
    difficulty: 'Facile à Moyen',
  },
  {
    id: 'telephone',
    title: 'Arnaques Téléphoniques',
    icon: '📞',
    description: 'Découvrez comment reconnaître et éviter les appels d\'arnaqueurs',
    difficulty: 'Facile à Moyen',
  },
  {
    id: 'online',
    title: 'Arnaques en Ligne',
    icon: '🛒',
    description: 'Protégez-vous lors de vos achats et interactions en ligne',
    difficulty: 'Facile à Moyen',
  },
];

export default function QuizAcademie({ onQuizComplete }) {
  const [activeModule, setActiveModule] = useState(null);
  const [badgeAnimation, setBadgeAnimation] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);

  // Load earned badges on mount
  useEffect(() => {
    setEarnedBadges(getEarnedBadges());
  }, []);

  // Handle quiz completion
  const handleQuizComplete = useCallback(
    (score, passed) => {
      if (activeModule) {
        // Save result to localStorage
        saveModuleResult(activeModule, score, passed);

        // Trigger badge animation if newly earned
        if (passed) {
          setBadgeAnimation(activeModule);
          setTimeout(() => setBadgeAnimation(null), 3000);
        }

        // Update badges list
        setEarnedBadges(getEarnedBadges());

        // Call parent onComplete callback if provided (for credit system)
        if (onQuizComplete) {
          onQuizComplete(score, passed);
        }
      }
    },
    [activeModule, onQuizComplete]
  );

  // Handle back from quiz
  const handleBackFromQuiz = useCallback(() => {
    setActiveModule(null);
  }, []);

  // Render quiz screen if a module is selected
  if (activeModule) {
    return (
      <div className="quiz-module-wrapper">
        <QuizModule
          moduleId={activeModule}
          onComplete={handleQuizComplete}
          onBack={handleBackFromQuiz}
        />
      </div>
    );
  }

  // Render module selection screen
  return (
    <div className="quiz-academie">
      {/* Header */}
      <div className="academy-header">
        <h2 className="academy-title">🎓 Académie de Sécurité</h2>
        <p className="academy-subtitle">
          Complétez les modules de formation pour maîtriser la détection des arnaque
        </p>
      </div>

      {/* Earned Badges Section */}
      {earnedBadges.length > 0 && (
        <div className="earned-badges-section">
          <h3 className="badges-title">✨ Vos Badges</h3>
          <div className="badges-container">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className={`badge-item ${badgeAnimation === badge.moduleId ? 'animate' : ''}`}
                title={badge.description}
              >
                <span className="badge-emoji">{badge.emoji}</span>
                <span className="badge-name">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Cards Grid */}
      <div className="modules-grid">
        {MODULES.map((module) => {
          const state = getModuleState(module.id);
          const highScore = getModuleHighScore(module.id);
          const attempts = getModuleAttempts(module.id);
          const isPassed = isModulePassed(module.id);

          return (
            <div
              key={module.id}
              className={`module-card module-${state}`}
              onClick={() => setActiveModule(module.id)}
            >
              {/* Module Icon */}
              <div className="module-icon">{module.icon}</div>

              {/* Module Title */}
              <h3 className="module-title">{module.title}</h3>

              {/* Module Description */}
              <p className="module-description">{module.description}</p>

              {/* Difficulty */}
              <div className="module-difficulty">Niveau: {module.difficulty}</div>

              {/* Progress State */}
              <div className="progress-state">
                {state === 'not-started' && (
                  <div className="state-badge not-started">Non commencé</div>
                )}
                {state === 'in-progress' && (
                  <div className="state-badge in-progress">
                    En cours ({attempts} tentative{attempts > 1 ? 's' : ''})
                  </div>
                )}
                {state === 'completed' && (
                  <div className="state-badge completed">
                    ✓ Réussi - Score: {highScore}%
                  </div>
                )}
              </div>

              {/* High Score Display */}
              {isPassed && (
                <div className="high-score">
                  Meilleur score: <span className="score-value">{highScore}%</span>
                </div>
              )}

              {/* CTA Button */}
              <button className="module-cta">
                {isPassed ? '🔄 Refaire' : '▶ Commencer'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Completion Summary */}
      <div className="completion-summary">
        <p>
          Modules complétés: <strong>{earnedBadges.length}/3</strong>
        </p>
        {earnedBadges.length === 3 && (
          <p className="completion-message">🏆 Félicitations! Vous avez complété tous les modules!</p>
        )}
      </div>
    </div>
  );
}
