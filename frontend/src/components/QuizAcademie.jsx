/**
 * QuizAcademie Component
 * Phase 1 Sprint 3 - Quiz Academy with Progress Tracking
 *
 * Multi-module quiz academy with badge system and progress tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import QuizModule from './QuizModule';
import SMSSimulator from './SMSSimulator';
import Leaderboard from './Leaderboard';
import {
  getModuleHighScore,
  isModulePassed,
  getModuleAttempts,
  getModuleState,
  saveModuleResult,
  getEarnedBadges,
  getStreakData,
  getXpData,
  getAllBadges,
} from '../utils/quizStorage';
import '../styles/QuizAcademie.css';
import '../styles/utility-classes.css';

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
  const [activeLeaderboardModule, setActiveLeaderboardModule] = useState(null);
  const [xpData, setXpData] = useState(getXpData());
  const [allBadges] = useState(getAllBadges());

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

        // Update badges list and streak
        const prevBadgeIds = earnedBadges.map(b => b.id);
        const newBadgeList = getEarnedBadges();
        const newlyEarned = newBadgeList.filter(b => !prevBadgeIds.includes(b.id));

        // Trigger badge animation if newly earned
        if (newlyEarned.length > 0) {
          setBadgeAnimation(newlyEarned[0].id);
          setTimeout(() => setBadgeAnimation(null), 3000);
        }

        setEarnedBadges(newBadgeList);
        setStreakData(getStreakData());
        setXpData(getXpData());

        // Call parent onComplete callback if provided (for credit system)
        if (onQuizComplete) {
          onQuizComplete(score, passed, selectedDifficulty);
        }
      }
    },
    [activeModule, selectedDifficulty, onQuizComplete, earnedBadges]
  );

  // Handle simulator completion
  const handleSimulatorComplete = useCallback(
    (result) => {
      if (activeModule) {
        // Determine if passed (>= 70% is a pass)
        const passed = result.percentage >= 70;

        // Save result to localStorage
        saveModuleResult(activeModule, result.percentage, passed);

        // Update badges list
        const prevBadgeIds = earnedBadges.map(b => b.id);
        const newBadgeList = getEarnedBadges();
        const newlyEarned = newBadgeList.filter(b => !prevBadgeIds.includes(b.id));

        // Trigger badge animation if newly earned
        if (newlyEarned.length > 0) {
          setBadgeAnimation(newlyEarned[0].id);
          setTimeout(() => setBadgeAnimation(null), 3000);
        }

        setEarnedBadges(newBadgeList);
        setXpData(getXpData());

        // Call parent onComplete callback if provided (for credit system)
        if (onQuizComplete) {
          onQuizComplete(result.percentage, passed);
        }
      }
    },
    [activeModule, onQuizComplete, earnedBadges]
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
              style={{
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
      <div className="quiz-module-wrapper" data-testid="quiz-module">
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

      {/* XP Level Bar */}
      <div className="xp-level-bar" role="progressbar" aria-valuenow={xpData.xpInLevel} aria-valuemax={xpData.xpNeeded}>
        <div className="xp-level-header">
          <span>Niveau {xpData.level}</span>
          <span>{xpData.xpInLevel} / {xpData.xpNeeded} XP</span>
        </div>
        <div className="xp-progress-track">
          <div className="xp-progress-fill"
            style={{ '--xp-progress': `${(xpData.xpInLevel / xpData.xpNeeded) * 100}%` }} />
        </div>
      </div>

      {/* Streak Indicator */}
      {streakData.currentStreak > 0 && (
        <div className="flex justify-center mb-lg p-md bg-warning-light rounded-sm text-lg font-semibold">
          🔥 Série: {streakData.currentStreak} jour{streakData.currentStreak > 1 ? 's' : ''} consécutif{streakData.currentStreak > 1 ? 's' : ''}
        </div>
      )}

      {/* Badges Section */}
      {(earnedBadges.length > 0 || allBadges.length > 0) && (
        <div className="earned-badges-section">
          {earnedBadges.length > 0 && (
            <>
              <h3 className="badges-title">✨ Vos Badges</h3>
              <div className="badges-container">
                {earnedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`badge-item ${badgeAnimation === badge.id ? 'animate' : ''}`}
                    title={badge.description}
                  >
                    <span className="badge-emoji">{badge.emoji}</span>
                    <span className="badge-name">{badge.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Locked Badges Section */}
          {allBadges.filter(b => !earnedBadges.find(e => e.id === b.id)).length > 0 && (
            <div className={earnedBadges.length > 0 ? 'locked-badges-container' : ''}>
              {earnedBadges.length > 0 && <p className="locked-badges-label">À débloquer :</p>}
              {earnedBadges.length === 0 && <h3 className="badges-title">🔒 Badges à débloquer</h3>}
              <div className="badges-container">
                {allBadges.filter(b => !earnedBadges.find(e => e.id === b.id)).map(badge => (
                  <div key={badge.id} className="badge-item badge-item--locked" title={badge.description}>
                    <span className="badge-emoji">🔒</span>
                    <span className="badge-name">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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

              {/* Leaderboard Toggle */}
              <button
                className="module-leaderboard-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLeaderboardModule(activeLeaderboardModule === module.id ? null : module.id);
                }}
              >
                {activeLeaderboardModule === module.id ? '▲ Masquer scores' : '📊 Voir scores'}
              </button>

              {/* Leaderboard */}
              {activeLeaderboardModule === module.id && (
                <Leaderboard moduleId={module.id} title={`Scores - ${module.title}`} />
              )}
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
