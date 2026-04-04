/**
 * QuizAcademie Component
 * Phase 1 Sprint 3 - Quiz Academy with Progress Tracking
 *
 * Multi-module quiz academy with badge system and progress tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import QuizModule from './QuizModule';
import SMSSimulator from './SMSSimulator';
import {
  getModuleHighScore,
  isModulePassed,
  getModuleAttempts,
  getModuleState,
  saveModuleResult,
  getEarnedBadges,
  getStreakData,
} from '../utils/quizStorage';
import '../styles/QuizAcademie.css';

import '../../styles/utility-classes.css';
// Module definitions
const MODULES = [
  {
    id: 'phishing',
    title: 'Phishing & Arnaques Numériques',
    icon: '🛡️',
    description: 'Apprenez à identifier les tentatives de phishing et les arnaques numériques',
    difficulty: 'Facile à Moyen',
    type: 'quiz',
  },
  {
    id: 'telephone',
    title: 'Arnaques Téléphoniques',
    icon: '📞',
    description: 'Découvrez comment reconnaître et éviter les appels d\'arnaqueurs',
    difficulty: 'Facile à Moyen',
    type: 'quiz',
  },
  {
    id: 'online',
    title: 'Arnaques en Ligne',
    icon: '🛒',
    description: 'Protégez-vous lors de vos achats et interactions en ligne',
    difficulty: 'Facile à Moyen',
    type: 'quiz',
  },
  {
    id: 'simulator',
    title: 'Simulateur SMS',
    icon: '📱',
    description: 'Entraînez-vous à détecter les arnaques par SMS en temps réel',
    difficulty: 'Facile à Moyen',
    type: 'simulator',
  },
];

export default function QuizAcademie({ onQuizComplete, speak, isVoiceGuidanceEnabled }) {
  const [activeModule, setActiveModule] = useState(null);
  const [pendingModule, setPendingModule] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediaire');
  const [badgeAnimation, setBadgeAnimation] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [streakData, setStreakData] = useState(getStreakData());

  // Load earned badges on mount
  useEffect(() => {
    setEarnedBadges(getEarnedBadges());
    setStreakData(getStreakData());
  }, []);

  // Handle quiz completion
  const handleQuizComplete = useCallback(
    (score, passed, durationSec) => {
      if (activeModule) {
        // Save result to localStorage
        saveModuleResult(activeModule, score, passed, selectedDifficulty, durationSec);

        // Trigger badge animation if newly earned
        if (passed) {
          setBadgeAnimation(activeModule);
          setTimeout(() => setBadgeAnimation(null), 3000);
        }

        // Update badges list and streak
        setEarnedBadges(getEarnedBadges());
        setStreakData(getStreakData());

        // Call parent onComplete callback if provided (for credit system)
        if (onQuizComplete) {
          onQuizComplete(score, passed, selectedDifficulty);
        }
      }
    },
    [activeModule, selectedDifficulty, onQuizComplete]
  );

  // Handle simulator completion
  const handleSimulatorComplete = useCallback(
    (result) => {
      if (activeModule) {
        // Determine if passed (>= 70% is a pass)
        const passed = result.percentage >= 70;

        // Save result to localStorage
        saveModuleResult(activeModule, result.percentage, passed);

        // Trigger badge animation if newly earned
        if (passed) {
          setBadgeAnimation(activeModule);
          setTimeout(() => setBadgeAnimation(null), 3000);
        }

        // Update badges list
        setEarnedBadges(getEarnedBadges());

        // Call parent onComplete callback if provided (for credit system)
        if (onQuizComplete) {
          onQuizComplete(result.percentage, passed);
        }
      }
    },
    [activeModule, onQuizComplete]
  );

  // Handle back from quiz
  const handleBackFromQuiz = useCallback(() => {
    setActiveModule(null);
    setPendingModule(null);
    setSelectedDifficulty('intermediaire');
  }, []);

  // Handle difficulty selection
  const handleDifficultySelect = useCallback((difficulty) => {
    setSelectedDifficulty(difficulty);
    setActiveModule(pendingModule);
    setPendingModule(null);
  }, [pendingModule]);

  const handleDifficultyCancel = useCallback(() => {
    setPendingModule(null);
    setSelectedDifficulty('intermediaire');
  }, []);

  // Render difficulty selector if a module is pending
  if (pendingModule) {
    const currentModule = MODULES.find(m => m.id === pendingModule);
    return (
      <div className="quiz-module-wrapper">
        <div className="p-lg max-w-md mx-auto">
          <h3 className="text-xl font-bold mb-xl text-center">
            Choisissez votre niveau
          </h3>
          <div className="flex-col gap-sm">
            <button
              onClick={() => handleDifficultySelect('debutant')}
              className="p-lg text-lg font-medium bg-success-light border-success rounded-sm min-h-60"
            >
              🟢 Débutant - Questions faciles
            </button>
            <button
              onClick={() => handleDifficultySelect('intermediaire')}
              className="p-lg text-lg font-medium bg-warning-light border-warning rounded-sm min-h-60"
            >
              🟡 Intermédiaire (Recommandé) - Questions mixtes
            </button>
            <button
              onClick={() => handleDifficultySelect('expert')}
              className="p-lg text-lg font-medium bg-error-light border-error rounded-sm min-h-60"
            >
              🔴 Expert - Questions difficiles
            </button>
            <button
              onClick={handleDifficultyCancel}
              className="p-lg text-lg font-semibold bg-light border-primary rounded-sm min-h-60"
                backgroundColor: '#F3F4F6',
                color: '#1E40AF',
                border: '2px solid #1E40AF',
                borderRadius: '8px',
                cursor: 'pointer',
                minHeight: '60px',
              }}
            >
              ← Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render quiz or simulator screen if a module is selected
  if (activeModule) {
    const currentModule = MODULES.find(m => m.id === activeModule);

    if (currentModule && currentModule.type === 'simulator') {
      return (
        <div className="quiz-module-wrapper">
          <div className="p-lg max-w-xl mx-auto">
            <button
              onClick={handleBackFromQuiz}
              className="mb-xl px-lg py-md bg-light text-primary border-primary rounded-sm text-lg font-semibold min-h-60"
            >
              ← Retour
            </button>
            <SMSSimulator
              onComplete={handleSimulatorComplete}
              scenarioCount={10}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="quiz-module-wrapper">
        <QuizModule
          moduleId={activeModule}
          difficultyFilter={selectedDifficulty}
          onComplete={handleQuizComplete}
          onBack={handleBackFromQuiz}
          speak={speak}
          isVoiceGuidanceEnabled={isVoiceGuidanceEnabled}
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

      {/* Streak Indicator */}
      {streakData.currentStreak > 0 && (
        <div className="flex justify-center mb-lg p-md bg-warning-light rounded-sm text-lg font-semibold">
          🔥 Série: {streakData.currentStreak} jour{streakData.currentStreak > 1 ? 's' : ''} consécutif{streakData.currentStreak > 1 ? 's' : ''}
        </div>
      )}

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
              onClick={() => {
                if (module.type === 'quiz') {
                  setPendingModule(module.id);
                } else {
                  setActiveModule(module.id);
                }
              }}
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
          Modules complétés: <strong>{Math.min(earnedBadges.filter(b => ['phishing_defender', 'phone_vigilant', 'online_expert'].includes(b.id)).length, 3)}/3</strong>
        </p>
        <p>
          Succès obtenus: <strong>{earnedBadges.length}</strong>
        </p>
        {earnedBadges.filter(b => ['phishing_defender', 'phone_vigilant', 'online_expert'].includes(b.id)).length === 3 && (
          <p className="completion-message">🏆 Félicitations! Vous avez complété tous les modules de base!</p>
        )}
      </div>
    </div>
  );
}
