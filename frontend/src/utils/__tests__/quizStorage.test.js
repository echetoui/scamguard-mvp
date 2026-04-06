/**
 * Test Suite: Quiz Storage Utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getQuizProgress,
  saveModuleResult,
  getModuleHighScore,
  isModulePassed,
  getModuleAttempts,
  getCompletedModules,
  getEarnedBadges,
  getAllBadges,
  clearQuizProgress,
  getModuleState,
  addXp,
  getXpData,
} from '../quizStorage';

describe('quizStorage utility', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getQuizProgress', () => {
    it('should return empty object when no progress saved', () => {
      const progress = getQuizProgress();
      expect(progress).toEqual({});
    });

    it('should return stored progress object', () => {
      const mockProgress = {
        phishing: { attempts: 2, highScore: 85, passed: true },
      };
      localStorage.setItem('scamguard_quiz_progress', JSON.stringify(mockProgress));
      const progress = getQuizProgress();
      expect(progress).toEqual(mockProgress);
    });
  });

  describe('saveModuleResult', () => {
    it('should save first attempt correctly', () => {
      saveModuleResult('phishing', 80, true);
      const progress = getQuizProgress();

      expect(progress.phishing).toBeDefined();
      expect(progress.phishing.attempts).toBe(1);
      expect(progress.phishing.highScore).toBe(80);
      expect(progress.phishing.passed).toBe(true);
      expect(progress.phishing.lastAttempt).toBeDefined();
    });

    it('should increment attempts on repeated saves', () => {
      saveModuleResult('phishing', 70, true);
      saveModuleResult('phishing', 75, true);

      const progress = getQuizProgress();
      expect(progress.phishing.attempts).toBe(2);
      expect(progress.phishing.highScore).toBe(75); // Max of 70 and 75
    });

    it('should track highest score across attempts', () => {
      saveModuleResult('phishing', 60, false);
      saveModuleResult('phishing', 85, true);
      saveModuleResult('phishing', 75, true);

      const progress = getQuizProgress();
      expect(progress.phishing.highScore).toBe(85);
    });

    it('should keep passed flag once set to true', () => {
      saveModuleResult('phishing', 75, true);
      saveModuleResult('phishing', 50, false); // Lower score, but already passed

      const progress = getQuizProgress();
      expect(progress.phishing.passed).toBe(true); // Should stay true
    });

    it('should warn on invalid arguments', () => {
      const warnSpy = vi.spyOn(console, 'warn');
      saveModuleResult(null, 80, true);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should handle multiple modules independently', () => {
      saveModuleResult('phishing', 80, true);
      saveModuleResult('telephone', 65, false);
      saveModuleResult('online', 90, true);

      const progress = getQuizProgress();
      expect(progress.phishing.highScore).toBe(80);
      expect(progress.telephone.highScore).toBe(65);
      expect(progress.online.highScore).toBe(90);
    });
  });

  describe('getModuleHighScore', () => {
    it('should return 0 for unsaved module', () => {
      const score = getModuleHighScore('phishing');
      expect(score).toBe(0);
    });

    it('should return saved high score', () => {
      saveModuleResult('phishing', 85, true);
      const score = getModuleHighScore('phishing');
      expect(score).toBe(85);
    });
  });

  describe('isModulePassed', () => {
    it('should return false for unsaved module', () => {
      const passed = isModulePassed('phishing');
      expect(passed).toBe(false);
    });

    it('should return true for passed module', () => {
      saveModuleResult('phishing', 75, true);
      const passed = isModulePassed('phishing');
      expect(passed).toBe(true);
    });

    it('should return false for failed module', () => {
      saveModuleResult('phishing', 60, false);
      const passed = isModulePassed('phishing');
      expect(passed).toBe(false);
    });
  });

  describe('getModuleAttempts', () => {
    it('should return 0 for unsaved module', () => {
      const attempts = getModuleAttempts('phishing');
      expect(attempts).toBe(0);
    });

    it('should count attempts correctly', () => {
      saveModuleResult('phishing', 70, true);
      saveModuleResult('phishing', 75, true);
      saveModuleResult('phishing', 80, true);

      const attempts = getModuleAttempts('phishing');
      expect(attempts).toBe(3);
    });
  });

  describe('getCompletedModules', () => {
    it('should return empty array when no modules completed', () => {
      const completed = getCompletedModules();
      expect(completed).toEqual([]);
    });

    it('should return only passed modules', () => {
      saveModuleResult('phishing', 75, true);
      saveModuleResult('telephone', 60, false);
      saveModuleResult('online', 80, true);

      const completed = getCompletedModules();
      expect(completed).toContain('phishing');
      expect(completed).toContain('online');
      expect(completed).not.toContain('telephone');
      expect(completed).toHaveLength(2);
    });
  });

  describe('getEarnedBadges', () => {
    it('should return empty array when no modules completed', () => {
      const badges = getEarnedBadges();
      expect(badges).toEqual([]);
    });

    it('should return badge for phishing module', () => {
      saveModuleResult('phishing', 75, true);
      const badges = getEarnedBadges();

      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe('phishing_defender');
      expect(badges[0].emoji).toBe('🛡️');
    });

    it('should return badge for telephone module', () => {
      saveModuleResult('telephone', 75, true);
      const badges = getEarnedBadges();

      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe('phone_vigilant');
      expect(badges[0].emoji).toBe('📞');
    });

    it('should return badge for online module', () => {
      saveModuleResult('online', 75, true);
      const badges = getEarnedBadges();

      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe('online_expert');
      expect(badges[0].emoji).toBe('🛒');
    });

    it('should return all badges when all modules completed', () => {
      saveModuleResult('phishing', 75, true);
      saveModuleResult('telephone', 75, true);
      saveModuleResult('online', 75, true);

      const badges = getEarnedBadges();
      // Should include at least the 3 module badges
      expect(badges.length).toBeGreaterThanOrEqual(3);
      expect(badges.map((b) => b.id)).toContain('phishing_defender');
      expect(badges.map((b) => b.id)).toContain('phone_vigilant');
      expect(badges.map((b) => b.id)).toContain('online_expert');
    });
  });

  describe('getAllBadges', () => {
    it('should return all 9 badges', () => {
      const badges = getAllBadges();
      expect(badges).toHaveLength(9);
      expect(badges.map((b) => b.id)).toEqual([
        'phishing_defender',
        'phone_vigilant',
        'online_expert',
        'quiz_master',
        'perfect_score',
        'difficulty_expert',
        'speed_learner',
        'persistent_learner',
        'simulator_ace',
      ]);
    });

    it('should include all badge properties', () => {
      const badges = getAllBadges();
      badges.forEach((badge) => {
        expect(badge.id).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.emoji).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(badge.condition).toBeDefined();
        // moduleId is optional - not all badges have a linked module
      });
    });
  });

  describe('clearQuizProgress', () => {
    it('should clear all progress data', () => {
      saveModuleResult('phishing', 80, true);
      saveModuleResult('telephone', 75, true);

      clearQuizProgress();
      const progress = getQuizProgress();
      expect(progress).toEqual({});
    });
  });

  describe('getModuleState', () => {
    it('should return "not-started" for unsaved module', () => {
      const state = getModuleState('phishing');
      expect(state).toBe('not-started');
    });

    it('should return "completed" for passed module', () => {
      saveModuleResult('phishing', 75, true);
      const state = getModuleState('phishing');
      expect(state).toBe('completed');
    });

    it('should return "in-progress" for attempted but not passed', () => {
      saveModuleResult('phishing', 60, false);
      const state = getModuleState('phishing');
      expect(state).toBe('in-progress');
    });
  });

  describe('addXp', () => {
    it('should accumulate XP over multiple calls', () => {
      addXp(50);
      addXp(30);
      const data = getXpData();
      expect(data.totalXp).toBe(80);
    });

    it('should reject negative XP', () => {
      addXp(100);
      addXp(-50); // Should be ignored
      const data = getXpData();
      expect(data.totalXp).toBe(100);
    });

    it('should reject non-number values', () => {
      addXp(100);
      addXp('invalid'); // Should be ignored
      const data = getXpData();
      expect(data.totalXp).toBe(100);
    });

    it('should persist XP to localStorage', () => {
      addXp(75);
      const progress = getQuizProgress();
      expect(progress._xp.totalXp).toBe(75);
    });

    it('should handle zero XP gracefully', () => {
      addXp(0);
      const data = getXpData();
      expect(data.totalXp).toBe(0);
    });
  });

  describe('getXpData', () => {
    it('should return defaults when no XP earned', () => {
      const data = getXpData();
      expect(data.totalXp).toBe(0);
      expect(data.level).toBe(1);
      expect(data.xpInLevel).toBe(0);
      expect(data.xpNeeded).toBe(500);
    });

    it('should calculate level 1 at 0 XP', () => {
      addXp(250);
      const data = getXpData();
      expect(data.level).toBe(1);
      expect(data.xpInLevel).toBe(250);
    });

    it('should reach level 2 at exactly 500 XP', () => {
      addXp(500);
      const data = getXpData();
      expect(data.level).toBe(2);
      expect(data.xpInLevel).toBe(0);
      expect(data.xpNeeded).toBe(1000);
    });

    it('should calculate progress correctly in level 2', () => {
      addXp(600);
      const data = getXpData();
      expect(data.level).toBe(2);
      expect(data.xpInLevel).toBe(100);
      expect(data.xpNeeded).toBe(1000);
    });

    it('should wrap xpInLevel when crossing level boundary', () => {
      addXp(550);
      const data = getXpData();
      expect(data.level).toBe(2);
      expect(data.xpInLevel).toBe(50);
    });

    it('should calculate level 3 correctly', () => {
      addXp(1100);
      const data = getXpData();
      expect(data.level).toBe(3);
      expect(data.xpInLevel).toBe(100);
    });
  });

  describe('clearQuizProgress clears XP', () => {
    it('should clear XP when clearing all progress', () => {
      addXp(500);
      clearQuizProgress();
      const data = getXpData();
      expect(data.totalXp).toBe(0);
      expect(data.level).toBe(1);
    });
  });
});
