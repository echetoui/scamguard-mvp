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
 * @param {string} moduleId - Module identifier (phishing, telephone, online, simulator)
 * @param {number} score - Final score (0-100)
 * @param {boolean} passed - Whether score >= 70
 * @param {string} difficulty - Difficulty level ('debutant', 'intermediaire', 'expert')
 * @param {number} durationSec - Time taken in seconds
 */
export const saveModuleResult = (moduleId, score, passed, difficulty = 'intermediaire', durationSec = null) => {
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
  moduleProgress.lastDifficulty = difficulty;

  // Track best difficulty achieved
  if (passed) {
    const difficultyRank = { 'debutant': 1, 'intermediaire': 2, 'expert': 3 };
    const currentRank = difficultyRank[moduleProgress.bestDifficulty] || 0;
    if (difficultyRank[difficulty] > currentRank) {
      moduleProgress.bestDifficulty = difficulty;
    }
  }

  // Track fastest completion
  if (durationSec !== null) {
    if (!moduleProgress.fastestDuration || durationSec < moduleProgress.fastestDuration) {
      moduleProgress.fastestDuration = durationSec;
    }
  }

  progress[moduleId] = moduleProgress;

  // Update streak on successful completion
  if (passed) {
    updateStreak(progress);
  }

  // Add leaderboard entry
  if (durationSec !== null) {
    addLeaderboardEntry(moduleId, score, difficulty, durationSec);
  }

  localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(progress));
};

/**
 * Update streak tracking
 * @param {Object} progress - Current progress object
 */
const updateStreak = (progress) => {
  if (!progress._meta) {
    progress._meta = { currentStreak: 0, longestStreak: 0, lastPlayedDate: null };
  }

  const today = new Date().toISOString().split('T')[0];
  const lastDate = progress._meta.lastPlayedDate;

  if (lastDate === today) {
    // Same day - no change to streak
    return;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (lastDate === yesterday) {
    // Consecutive day - increment streak
    progress._meta.currentStreak = (progress._meta.currentStreak || 0) + 1;
  } else {
    // Gap - reset streak to 1
    progress._meta.currentStreak = 1;
  }

  // Update longest streak
  progress._meta.longestStreak = Math.max(progress._meta.longestStreak || 0, progress._meta.currentStreak);
  progress._meta.lastPlayedDate = today;
};

/**
 * Get current streak data
 * @returns {Object} Streak info { currentStreak, longestStreak, lastPlayedDate }
 */
export const getStreakData = () => {
  const progress = getQuizProgress();
  return progress._meta || { currentStreak: 0, longestStreak: 0, lastPlayedDate: null };
};

/**
 * Add entry to leaderboard
 * @param {string} moduleId - Module identifier
 * @param {number} score - Score achieved
 * @param {string} difficulty - Difficulty level
 * @param {number} durationSec - Duration in seconds
 */
export const addLeaderboardEntry = (moduleId, score, difficulty, durationSec) => {
  const progress = getQuizProgress();
  if (!progress._leaderboard) {
    progress._leaderboard = {};
  }
  if (!progress._leaderboard[moduleId]) {
    progress._leaderboard[moduleId] = [];
  }

  const entry = {
    score,
    difficulty,
    durationSec,
    date: new Date().toISOString().split('T')[0],
  };

  progress._leaderboard[moduleId].push(entry);

  // Sort by score desc, then by duration asc, keep top 10
  progress._leaderboard[moduleId] = progress._leaderboard[moduleId]
    .sort((a, b) => b.score - a.score || a.durationSec - b.durationSec)
    .slice(0, 10);

  localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(progress));
};

/**
 * Get leaderboard for a module
 * @param {string} moduleId - Module identifier
 * @returns {Array} Top 10 scores [{ score, difficulty, durationSec, date }, ...]
 */
export const getLeaderboard = (moduleId) => {
  const progress = getQuizProgress();
  return progress._leaderboard?.[moduleId] || [];
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
 * All available badges definition (9 total: 3 legacy + 6 new)
 */
const ALL_BADGES_DEF = [
  // Legacy badges - unlocked by module completion
  {
    id: 'phishing_defender',
    name: 'Défenseur Numérique',
    emoji: '🛡️',
    description: 'Complétez le module Phishing & Arnaques Numériques',
    moduleId: 'phishing',
    condition: (progress) => progress.phishing?.passed,
  },
  {
    id: 'phone_vigilant',
    name: 'Vigilant Téléphonique',
    emoji: '📞',
    description: 'Complétez le module Arnaques Téléphoniques',
    moduleId: 'telephone',
    condition: (progress) => progress.telephone?.passed,
  },
  {
    id: 'online_expert',
    name: 'Expert Commerce',
    emoji: '🛒',
    description: 'Complétez le module Arnaques en Ligne',
    moduleId: 'online',
    condition: (progress) => progress.online?.passed,
  },
  // New achievement badges
  {
    id: 'quiz_master',
    name: 'Maître Quiz',
    emoji: '🏆',
    description: 'Complétez les 3 modules de base (Phishing, Téléphone, En ligne)',
    condition: (progress) =>
      progress.phishing?.passed && progress.telephone?.passed && progress.online?.passed,
  },
  {
    id: 'perfect_score',
    name: 'Score Parfait',
    emoji: '⭐',
    description: 'Obtenez un score de 100% dans n\'importe quel module',
    condition: (progress) =>
      Object.values(progress).some(mod => mod?.highScore === 100),
  },
  {
    id: 'difficulty_expert',
    name: 'Expert Avancé',
    emoji: '🎯',
    description: 'Passez un module au niveau Expert',
    condition: (progress) =>
      Object.values(progress).some(mod => mod?.bestDifficulty === 'expert'),
  },
  {
    id: 'speed_learner',
    name: 'Apprenant Rapide',
    emoji: '⚡',
    description: 'Complétez un module en moins d\'une minute',
    condition: (progress) =>
      Object.values(progress).some(mod => mod?.fastestDuration && mod.fastestDuration < 60),
  },
  {
    id: 'persistent_learner',
    name: 'Apprenant Persévérant',
    emoji: '💪',
    description: 'Faites au moins 3 tentatives cumulées dans les modules',
    condition: (progress) => {
      const totalAttempts = Object.values(progress)
        .reduce((sum, mod) => sum + (mod?.attempts || 0), 0);
      return totalAttempts >= 3;
    },
  },
  {
    id: 'simulator_ace',
    name: 'Simulateur As',
    emoji: '📱',
    description: 'Complétez le simulateur SMS avec succès',
    moduleId: 'simulator',
    condition: (progress) => progress.simulator?.passed,
  },
];

/**
 * Get earned badges based on progress
 * @returns {Array<Object>} Array of earned badge objects
 */
export const getEarnedBadges = () => {
  const progress = getQuizProgress();
  return ALL_BADGES_DEF.filter((badge) => badge.condition(progress));
};

/**
 * Get all available badges
 * @returns {Array<Object>} Array of all badge definitions (9 total)
 */
export const getAllBadges = () => {
  return ALL_BADGES_DEF;
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

/**
 * Add XP to player total
 * @param {number} xp - Amount of XP to add
 */
export const addXp = (xp) => {
  if (typeof xp !== 'number' || xp < 0) return;
  const progress = getQuizProgress();
  if (!progress._xp) progress._xp = { totalXp: 0 };
  progress._xp.totalXp = (progress._xp.totalXp || 0) + xp;
  localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(progress));
};

/**
 * Get XP data (total, level, progress in level)
 * @returns {Object} { totalXp, level, xpInLevel, xpNeeded }
 */
export const getXpData = () => {
  const progress = getQuizProgress();
  const totalXp = progress._xp?.totalXp || 0;
  const level = Math.floor(totalXp / 500) + 1;
  const xpInLevel = totalXp % 500;
  const xpNeeded = level * 500;
  return { totalXp, level, xpInLevel, xpNeeded };
};
