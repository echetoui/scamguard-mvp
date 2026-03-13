/**
 * Quiz Storage Utility
 * Phase 1 Sprint 3 - Quiz Academy Progress Tracking
 *
 * Manages localStorage persistence for quiz module progress, scores, and earned badges
 */

const QUIZ_PROGRESS_KEY = 'scamguard_quiz_progress';

/**
 * Get the entire quiz progress object from localStorage
 * @returns {Object} Progress object with module data
 */
export const getQuizProgress = () => {
  const stored = localStorage.getItem(QUIZ_PROGRESS_KEY);
  return stored ? JSON.parse(stored) : {};
};

/**
 * Save a module completion result
 * @param {string} moduleId - Module identifier (phishing, telephone, online)
 * @param {number} score - Final score (0-100)
 * @param {boolean} passed - Whether score >= 70
 */
export const saveModuleResult = (moduleId, score, passed) => {
  if (!moduleId || typeof score !== 'number') {
    console.warn('Invalid arguments to saveModuleResult');
    return;
  }

  const progress = getQuizProgress();
  const moduleProgress = progress[moduleId] || { attempts: 0, highScore: 0, passed: false };

  moduleProgress.attempts = (moduleProgress.attempts || 0) + 1;
  moduleProgress.highScore = Math.max(moduleProgress.highScore || 0, score);
  moduleProgress.passed = moduleProgress.passed || passed; // Once passed, stay passed
  moduleProgress.lastAttempt = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  progress[moduleId] = moduleProgress;
  localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(progress));
};

/**
 * Get the high score for a specific module
 * @param {string} moduleId - Module identifier
 * @returns {number} High score or 0 if no attempts
 */
export const getModuleHighScore = (moduleId) => {
  const progress = getQuizProgress();
  return progress[moduleId]?.highScore || 0;
};

/**
 * Check if a module has been completed (passed)
 * @param {string} moduleId - Module identifier
 * @returns {boolean} Whether the module was passed
 */
export const isModulePassed = (moduleId) => {
  const progress = getQuizProgress();
  return progress[moduleId]?.passed || false;
};

/**
 * Get number of attempts for a module
 * @param {string} moduleId - Module identifier
 * @returns {number} Number of attempts
 */
export const getModuleAttempts = (moduleId) => {
  const progress = getQuizProgress();
  return progress[moduleId]?.attempts || 0;
};

/**
 * Get all completed (passed) module IDs
 * @returns {Array<string>} Array of module IDs that were passed
 */
export const getCompletedModules = () => {
  const progress = getQuizProgress();
  return Object.keys(progress).filter((moduleId) => progress[moduleId].passed);
};

/**
 * Get earned badges based on completed modules
 * @returns {Array<Object>} Array of badge objects { id, name, emoji, description }
 */
export const getEarnedBadges = () => {
  const badges = [
    {
      id: 'phishing_defender',
      name: 'Défenseur Numérique',
      emoji: '🛡️',
      description: 'Complétez le module Phishing & Arnaques Numériques',
      moduleId: 'phishing',
    },
    {
      id: 'phone_vigilant',
      name: 'Vigilant Téléphonique',
      emoji: '📞',
      description: 'Complétez le module Arnaques Téléphoniques',
      moduleId: 'telephone',
    },
    {
      id: 'online_expert',
      name: 'Expert Commerce',
      emoji: '🛒',
      description: 'Complétez le module Arnaques en Ligne',
      moduleId: 'online',
    },
  ];

  const completedModules = getCompletedModules();
  return badges.filter((badge) => completedModules.includes(badge.moduleId));
};

/**
 * Get all available badges
 * @returns {Array<Object>} Array of all badge definitions
 */
export const getAllBadges = () => {
  return [
    {
      id: 'phishing_defender',
      name: 'Défenseur Numérique',
      emoji: '🛡️',
      description: 'Complétez le module Phishing & Arnaques Numériques',
      moduleId: 'phishing',
    },
    {
      id: 'phone_vigilant',
      name: 'Vigilant Téléphonique',
      emoji: '📞',
      description: 'Complétez le module Arnaques Téléphoniques',
      moduleId: 'telephone',
    },
    {
      id: 'online_expert',
      name: 'Expert Commerce',
      emoji: '🛒',
      description: 'Complétez le module Arnaques en Ligne',
      moduleId: 'online',
    },
  ];
};

/**
 * Reset all quiz progress (for account reset)
 */
export const clearQuizProgress = () => {
  localStorage.removeItem(QUIZ_PROGRESS_KEY);
};

/**
 * Get progress state for a module (for UI display)
 * @param {string} moduleId - Module identifier
 * @returns {string} 'not-started', 'in-progress', 'completed'
 */
export const getModuleState = (moduleId) => {
  const progress = getQuizProgress();
  const module = progress[moduleId];

  if (!module) return 'not-started';
  if (module.passed) return 'completed';
  return 'in-progress';
};
