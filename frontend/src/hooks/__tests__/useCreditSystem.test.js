/**
 * useCreditSystem Hook Tests
 * Phase 5E - Test Coverage Expansion
 *
 * Tests for:
 * - Credit balance management
 * - Transactions (earn/spend)
 * - localStorage persistence
 * - Credit statistics
 * - Time formatting utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useCreditSystem from '../useCreditSystem';

describe('useCreditSystem Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should initialize with default balance of 50 credits', () => {
      const { result } = renderHook(() => useCreditSystem());

      expect(result.current.balance).toBe(50);
    });

    it('should initialize with welcome transaction', () => {
      const { result } = renderHook(() => useCreditSystem());

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0].source).toBe('welcome');
    });

    it('should start with isLoading as false after mount', async () => {
      const { result } = renderHook(() => useCreditSystem());

      // isLoading should be false after the useEffect that loads from storage completes
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize totalEarned and totalSpent', () => {
      const { result } = renderHook(() => useCreditSystem());
      const stats = result.current.getStats();

      expect(stats.totalEarned).toBe(50);
      expect(stats.totalSpent).toBe(0);
    });
  });

  describe('Earn Credits', () => {
    it('should add credits to balance', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(25, 'activity', 'Completed security check');
      });

      expect(result.current.balance).toBe(75);
    });

    it('should update totalEarned', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(30, 'bonus', 'Referral bonus');
      });

      const stats = result.current.getStats();
      expect(stats.totalEarned).toBe(80); // 50 initial + 30
    });

    it('should create transaction record', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(20, 'survey', 'Completed survey');
      });

      const transactions = result.current.getTransactions();
      expect(transactions).toHaveLength(2); // Welcome + new
      expect(transactions[0].type).toBe('earn');
      expect(transactions[0].amount).toBe(20);
      expect(transactions[0].description).toBe('Completed survey');
    });

    it('should handle multiple earn operations', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(10, 'activity', 'Task 1');
        result.current.earnCredits(15, 'activity', 'Task 2');
        result.current.earnCredits(5, 'bonus', 'Bonus');
      });

      expect(result.current.balance).toBe(80); // 50 + 10 + 15 + 5
      const stats = result.current.getStats();
      expect(stats.totalEarned).toBe(80);
    });

    it('should generate unique transaction IDs', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(10, 'activity', 'Task 1');
        result.current.earnCredits(10, 'activity', 'Task 2');
      });

      const transactions = result.current.getTransactions();
      const ids = transactions.map(t => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Spend Credits', () => {
    it('should deduct credits from balance when sufficient', () => {
      const { result } = renderHook(() => useCreditSystem());

      let spent;
      act(() => {
        spent = result.current.spendCredits(20, 'Email verification');
      });

      expect(spent).toBe(true);
      expect(result.current.balance).toBe(30); // 50 - 20
    });

    it('should return false when insufficient balance', () => {
      const { result } = renderHook(() => useCreditSystem());

      let spent;
      act(() => {
        spent = result.current.spendCredits(100, 'Expensive service');
      });

      expect(spent).toBe(false);
      expect(result.current.balance).toBe(50); // Unchanged
    });

    it('should update totalSpent', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.spendCredits(15, 'Service');
      });

      const stats = result.current.getStats();
      expect(stats.totalSpent).toBe(15);
    });

    it('should create transaction record on successful spend', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.spendCredits(25, 'Email breach check');
      });

      const transactions = result.current.getTransactions();
      expect(transactions[0].type).toBe('spend');
      expect(transactions[0].amount).toBe(25);
      expect(transactions[0].source).toBe('usage');
      expect(transactions[0].description).toBe('Email breach check');
    });

    it('should not create transaction on insufficient balance', () => {
      const { result } = renderHook(() => useCreditSystem());
      const initialTxCount = result.current.transactions.length;

      let spent;
      act(() => {
        spent = result.current.spendCredits(100, 'Expensive operation');
      });

      expect(spent).toBe(false);
      expect(result.current.transactions).toHaveLength(initialTxCount);
    });

    it('should handle multiple spend operations', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.spendCredits(10, 'Check 1');
        result.current.spendCredits(15, 'Check 2');
        result.current.spendCredits(5, 'Check 3');
      });

      expect(result.current.balance).toBe(20); // 50 - 10 - 15 - 5
      const stats = result.current.getStats();
      expect(stats.totalSpent).toBe(30);
    });
  });

  describe('Balance and Transactions', () => {
    it('should return current balance via getBalance()', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(20, 'activity', 'Task');
      });

      const balance = result.current.getBalance();
      expect(balance).toBe(70);
    });

    it('should return sorted transactions (newest first)', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(10, 'activity', 'First');
        result.current.earnCredits(20, 'activity', 'Second');
        result.current.earnCredits(30, 'activity', 'Third');
      });

      const transactions = result.current.getTransactions();

      // Should be sorted by timestamp descending (newest first)
      for (let i = 0; i < transactions.length - 1; i++) {
        expect(transactions[i].timestamp).toBeGreaterThanOrEqual(
          transactions[i + 1].timestamp
        );
      }
    });

    it('should provide transaction with proper structure', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(25, 'bonus', 'Welcome bonus');
      });

      const transaction = result.current.transactions[0];

      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('timestamp');
      expect(transaction).toHaveProperty('type');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('source');
      expect(transaction).toHaveProperty('description');
    });
  });

  describe('Statistics', () => {
    it('should return stats object with all fields', () => {
      const { result } = renderHook(() => useCreditSystem());

      const stats = result.current.getStats();

      expect(stats).toHaveProperty('balance');
      expect(stats).toHaveProperty('totalEarned');
      expect(stats).toHaveProperty('totalSpent');
      expect(stats).toHaveProperty('transactionCount');
      expect(stats).toHaveProperty('lastTransaction');
    });

    it('should calculate correct statistics', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(30, 'activity', 'Task 1');
        result.current.spendCredits(10, 'Check 1');
        result.current.earnCredits(20, 'activity', 'Task 2');
      });

      const stats = result.current.getStats();

      expect(stats.balance).toBe(90); // 50 + 30 + 20 - 10
      expect(stats.totalEarned).toBe(100); // 50 + 30 + 20
      expect(stats.totalSpent).toBe(10);
      expect(stats.transactionCount).toBe(4); // Welcome + 3 operations
    });

    it('should return last transaction in stats', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(20, 'activity', 'Latest transaction');
      });

      const stats = result.current.getStats();

      expect(stats.lastTransaction).toBeDefined();
      expect(stats.lastTransaction.description).toBe('Latest transaction');
    });

    it('should return null lastTransaction when no transactions', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.resetCredits();
      });

      const stats = result.current.getStats();

      expect(stats.lastTransaction).toBeNull();
    });
  });

  describe('Reset Credits', () => {
    it('should reset balance to zero', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(100, 'activity', 'Bonus');
      });

      expect(result.current.balance).toBe(150);

      act(() => {
        result.current.resetCredits();
      });

      expect(result.current.balance).toBe(0);
    });

    it('should clear all transactions', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(50, 'activity', 'Task 1');
        result.current.earnCredits(50, 'activity', 'Task 2');
      });

      expect(result.current.transactions).toHaveLength(3);

      act(() => {
        result.current.resetCredits();
      });

      expect(result.current.transactions).toHaveLength(0);
    });

    it('should reset totalEarned and totalSpent', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(100, 'activity', 'Task');
        result.current.spendCredits(50, 'Check');
      });

      act(() => {
        result.current.resetCredits();
      });

      const stats = result.current.getStats();

      expect(stats.totalEarned).toBe(0);
      expect(stats.totalSpent).toBe(0);
    });

    it('should clear localStorage data on reset', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(50, 'activity', 'Task');
      });

      const dataBefore = localStorage.getItem('scamguard_credits');
      expect(dataBefore).toBeTruthy();
      const parsed = JSON.parse(dataBefore);
      expect(parsed.balance).toBe(100); // 50 + 50

      act(() => {
        result.current.resetCredits();
      });

      const dataAfter = localStorage.getItem('scamguard_credits');
      const parsedAfter = JSON.parse(dataAfter);

      // After reset, data should be empty
      expect(parsedAfter.balance).toBe(0);
      expect(parsedAfter.transactions).toHaveLength(0);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist credit data to localStorage', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(30, 'activity', 'Task');
        result.current.spendCredits(10, 'Check');
      });

      const stored = localStorage.getItem('scamguard_credits');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored);
      expect(parsed.balance).toBe(70);
      expect(parsed.totalEarned).toBe(80);
    });

    it('should restore credit data from localStorage on mount', () => {
      // First hook instance
      const { result: result1 } = renderHook(() => useCreditSystem());

      act(() => {
        result1.current.earnCredits(25, 'activity', 'Task 1');
        result1.current.earnCredits(25, 'activity', 'Task 2');
      });

      // Unmount first instance
      // Create new hook instance
      const { result: result2 } = renderHook(() => useCreditSystem());

      // Should restore state from localStorage
      expect(result2.current.balance).toBe(100); // 50 + 25 + 25
      const stats = result2.current.getStats();
      expect(stats.totalEarned).toBe(100);
      expect(stats.transactionCount).toBe(3); // Welcome + 2 tasks
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('scamguard_credits', 'invalid json {[[');

      expect(() => {
        renderHook(() => useCreditSystem());
      }).not.toThrow();
    });

    it('should handle missing localStorage gracefully', () => {
      localStorage.clear();

      const { result } = renderHook(() => useCreditSystem());

      expect(result.current.balance).toBe(50); // Default balance
      expect(result.current.transactions).toHaveLength(1); // Welcome transaction
    });
  });

  describe('Time Formatting', () => {
    it('should format recent timestamps as "à l\'instant"', () => {
      const { result } = renderHook(() => useCreditSystem());
      const now = Date.now();

      const formatted = result.current.formatTimeAgo(now - 30000); // 30 seconds ago

      expect(formatted).toBe('à l\'instant');
    });

    it('should format minute-ago timestamps', () => {
      const { result } = renderHook(() => useCreditSystem());
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

      const formatted = result.current.formatTimeAgo(fiveMinutesAgo);

      expect(formatted).toMatch(/il y a \d+m/);
    });

    it('should format hour-ago timestamps', () => {
      const { result } = renderHook(() => useCreditSystem());
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

      const formatted = result.current.formatTimeAgo(twoHoursAgo);

      expect(formatted).toMatch(/il y a \d+h/);
    });

    it('should format day-ago timestamps', () => {
      const { result } = renderHook(() => useCreditSystem());
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

      const formatted = result.current.formatTimeAgo(threeDaysAgo);

      expect(formatted).toMatch(/il y a \d+j/);
    });

    it('should format old timestamps as localized date', () => {
      const { result } = renderHook(() => useCreditSystem());
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;

      const formatted = result.current.formatTimeAgo(tenDaysAgo);

      // Should not contain "il y a" for dates more than 7 days old
      expect(formatted).not.toContain('il y a');
      expect(formatted).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero credit transactions', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(0, 'test', 'Zero earn');
      });

      expect(result.current.balance).toBe(50); // Unchanged
      expect(result.current.transactions).toHaveLength(2);
    });

    it('should handle negative amounts (should still update)', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(-10, 'test', 'Negative earn');
      });

      expect(result.current.balance).toBe(40); // 50 - 10
    });

    it('should handle large credit amounts', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(1000000, 'test', 'Large amount');
      });

      expect(result.current.balance).toBe(1000050);
    });

    it('should handle rapid sequential operations', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.earnCredits(1, 'rapid', `Operation ${i}`);
        }
      });

      expect(result.current.balance).toBe(150); // 50 + 100
      expect(result.current.transactions).toHaveLength(101); // Welcome + 100
    });

    it('should maintain data consistency after mixed operations', () => {
      const { result } = renderHook(() => useCreditSystem());

      act(() => {
        result.current.earnCredits(100, 'bonus', 'Bonus 1');
        result.current.spendCredits(50, 'Service 1');
        result.current.earnCredits(50, 'bonus', 'Bonus 2');
        result.current.spendCredits(30, 'Service 2');
      });

      const stats = result.current.getStats();

      // balance = 50 + 100 + 50 - 50 - 30 = 120
      // totalEarned = 50 + 100 + 50 = 200
      // totalSpent = 50 + 30 = 80
      expect(stats.balance).toBe(120);
      expect(stats.totalEarned).toBe(200);
      expect(stats.totalSpent).toBe(80);
      expect(stats.balance).toBe(stats.totalEarned - stats.totalSpent);
    });
  });
});
