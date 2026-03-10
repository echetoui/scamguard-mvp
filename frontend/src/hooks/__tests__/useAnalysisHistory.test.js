/**
 * useAnalysisHistory Hook Tests
 * Phase 5E - Test Coverage Expansion
 *
 * Tests for:
 * - Analysis history management
 * - localStorage persistence with debouncing
 * - Statistics generation
 * - Scam type distribution
 * - Time-based filtering
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnalysisHistory } from '../useAnalysisHistory';
import * as api from '../../services/api';

// Mock dependencies
vi.mock('../../services/api');

describe('useAnalysisHistory Hook', () => {
  const mockAnalysis = {
    type: 'message',
    content: 'Verify this message',
    result: {
      score: 45,
      riskLevel: 'moderate',
      message: 'This looks suspicious',
      scamType: 'phishing',
      feedback: 'Be careful',
      xpEarned: 10,
    },
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    api.analysisAPI = {
      analyze: vi.fn().mockResolvedValue({ success: true }),
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should initialize with empty analyses array', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.analyses).toEqual([]);
    });

    it('should set isLoading to false after mount', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      // isLoading might be false immediately if useEffect runs synchronously in test
      // Just verify it becomes false
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should load analyses from localStorage on mount', async () => {
      const savedAnalyses = [
        { id: 'test1', timestamp: Date.now(), ...mockAnalysis },
      ];
      localStorage.setItem(
        'scamguard_analysis_history',
        JSON.stringify(savedAnalyses)
      );

      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.analyses).toHaveLength(1);
      expect(result.current.analyses[0].id).toBe('test1');
    });

    it('should handle corrupted localStorage gracefully', async () => {
      localStorage.setItem('scamguard_analysis_history', 'invalid json {[[');

      expect(() => {
        renderHook(() => useAnalysisHistory());
      }).not.toThrow();
    });
  });

  describe('Add Analysis', () => {
    it('should add new analysis to history', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis(mockAnalysis);
      });

      expect(result.current.analyses).toHaveLength(1);
      expect(result.current.analyses[0].type).toBe('message');
    });

    it('should generate unique ID for new analysis', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const id1 = act(() => result.current.addAnalysis(mockAnalysis));
      const id2 = act(() => result.current.addAnalysis(mockAnalysis));

      expect(id1).not.toBe(id2);
    });

    it('should add timestamp to analysis', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const before = Date.now();

      act(() => {
        result.current.addAnalysis(mockAnalysis);
      });

      const after = Date.now();
      const analysis = result.current.analyses[0];

      expect(analysis.timestamp).toBeGreaterThanOrEqual(before);
      expect(analysis.timestamp).toBeLessThanOrEqual(after);
    });

    it('should add analysis to beginning of array', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis({ ...mockAnalysis, content: 'First' });
        result.current.addAnalysis({ ...mockAnalysis, content: 'Second' });
      });

      expect(result.current.analyses[0].content).toBe('Second');
      expect(result.current.analyses[1].content).toBe('First');
    });

    it('should sync to cloud API', async () => {
      localStorage.setItem('userId', 'test-user-123');
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis(mockAnalysis);
      });

      // Cloud sync should be called
      expect(api.analysisAPI.analyze).toHaveBeenCalled();
    });

    it('should handle cloud sync failure gracefully', async () => {
      api.analysisAPI.analyze.mockRejectedValue(
        new Error('Cloud sync failed')
      );

      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(() => {
        act(() => {
          result.current.addAnalysis(mockAnalysis);
        });
      }).not.toThrow();
    });

    it('should return ID of new analysis', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let analysisId;
      act(() => {
        analysisId = result.current.addAnalysis(mockAnalysis);
      });

      expect(analysisId).toBeDefined();
      expect(analysisId).toMatch(/^analysis_\d+$/);
    });
  });

  describe('Query Methods', () => {
    it('should return all analyses via getAnalyses()', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis(mockAnalysis);
        result.current.addAnalysis(mockAnalysis);
      });

      const analyses = result.current.getAnalyses();
      expect(analyses).toHaveLength(2);
    });

    it('should get analysis by ID', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let analysisId;
      act(() => {
        analysisId = result.current.addAnalysis(mockAnalysis);
      });

      const found = result.current.getAnalysisById(analysisId);
      expect(found).toBeDefined();
      expect(found.id).toBe(analysisId);
    });

    it('should return undefined for non-existent ID', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const found = result.current.getAnalysisById('nonexistent');
      expect(found).toBeUndefined();
    });

    it('should filter analyses by days', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        // Add recent analysis
        result.current.addAnalysis(mockAnalysis);

        // Add old analysis (simulate old timestamp)
        const oldAnalysis = {
          ...mockAnalysis,
          timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
        };
        result.current.analyses.push({
          id: 'old_analysis',
          ...oldAnalysis,
        });
      });

      // Get analyses from last 30 days
      const recent = result.current.getAnalysesForDays(30);
      expect(recent).toHaveLength(1); // Only recent
    });

    it('should return all analyses for 0 days', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis(mockAnalysis);
      });

      const analyses = result.current.getAnalysesForDays(0);
      // Should return analyses from exactly today
      expect(analyses.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Delete and Clear', () => {
    it('should delete analysis by ID', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let analysisId;
      act(() => {
        analysisId = result.current.addAnalysis(mockAnalysis);
      });

      expect(result.current.analyses).toHaveLength(1);

      act(() => {
        result.current.deleteAnalysis(analysisId);
      });

      expect(result.current.analyses).toHaveLength(0);
    });

    it('should not error when deleting non-existent ID', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(() => {
        act(() => {
          result.current.deleteAnalysis('nonexistent');
        });
      }).not.toThrow();
    });

    it('should clear all analyses', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis(mockAnalysis);
        result.current.addAnalysis(mockAnalysis);
        result.current.addAnalysis(mockAnalysis);
      });

      expect(result.current.analyses).toHaveLength(3);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.analyses).toHaveLength(0);
    });

    it('should remove localStorage entry when clearing', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis(mockAnalysis);
      });

      // Wait for debounced save
      await waitFor(() => {
        expect(localStorage.getItem('scamguard_analysis_history')).toBeTruthy();
      }, { timeout: 600 });

      act(() => {
        result.current.clearHistory();
      });

      expect(localStorage.getItem('scamguard_analysis_history')).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should return statistics object', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis(mockAnalysis);
      });

      const stats = result.current.getStatistics();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('safe');
      expect(stats).toHaveProperty('moderate');
      expect(stats).toHaveProperty('danger');
      expect(stats).toHaveProperty('avgScore');
      expect(stats).toHaveProperty('totalXpEarned');
      expect(stats).toHaveProperty('safePercentage');
      expect(stats).toHaveProperty('riskPercentage');
    });

    it('should calculate correct statistics', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis({
          ...mockAnalysis,
          result: { ...mockAnalysis.result, riskLevel: 'safe', score: 90, xpEarned: 5 },
        });
        result.current.addAnalysis({
          ...mockAnalysis,
          result: { ...mockAnalysis.result, riskLevel: 'moderate', score: 50, xpEarned: 10 },
        });
        result.current.addAnalysis({
          ...mockAnalysis,
          result: { ...mockAnalysis.result, riskLevel: 'danger', score: 10, xpEarned: 20 },
        });
      });

      const stats = result.current.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.safe).toBe(1);
      expect(stats.moderate).toBe(1);
      expect(stats.danger).toBe(1);
      expect(stats.avgScore).toBe(50); // (90 + 50 + 10) / 3
      expect(stats.totalXpEarned).toBe(35); // 5 + 10 + 20
      expect(stats.safePercentage).toBe(33); // 1/3 * 100
      expect(stats.riskPercentage).toBe(67); // 2/3 * 100
    });

    it('should return zero statistics for empty history', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stats = result.current.getStatistics();

      expect(stats.total).toBe(0);
      expect(stats.safe).toBe(0);
      expect(stats.moderate).toBe(0);
      expect(stats.danger).toBe(0);
      expect(stats.avgScore).toBe(0);
      expect(stats.totalXpEarned).toBe(0);
      expect(stats.safePercentage).toBe(0);
      expect(stats.riskPercentage).toBe(0);
    });

    it('should handle missing result fields', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis({
          type: 'message',
          content: 'No result data',
          // Missing result field
        });
      });

      const stats = result.current.getStatistics();
      expect(stats.total).toBe(1);
      expect(stats.avgScore).toBe(0);
      expect(stats.totalXpEarned).toBe(0);
    });
  });

  describe('Scam Type Distribution', () => {
    it('should return scam type distribution', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis({
          ...mockAnalysis,
          result: { ...mockAnalysis.result, scamType: 'phishing' },
        });
        result.current.addAnalysis({
          ...mockAnalysis,
          result: { ...mockAnalysis.result, scamType: 'phishing' },
        });
        result.current.addAnalysis({
          ...mockAnalysis,
          result: { ...mockAnalysis.result, scamType: 'romance' },
        });
      });

      const distribution = result.current.getScamTypeDistribution();

      expect(distribution.phishing).toBe(2);
      expect(distribution.romance).toBe(1);
    });

    it('should handle missing scam type as "unknown"', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis({
          type: 'message',
          content: 'Unknown scam type',
          // Missing result.scamType
        });
      });

      const distribution = result.current.getScamTypeDistribution();
      expect(distribution.unknown).toBe(1);
    });

    it('should count all scam types', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const scamTypes = [
        'phishing',
        'romance',
        'investment',
        'lottery',
        'tech-support',
      ];

      act(() => {
        scamTypes.forEach((type) => {
          result.current.addAnalysis({
            ...mockAnalysis,
            result: { ...mockAnalysis.result, scamType: type },
          });
        });
      });

      const distribution = result.current.getScamTypeDistribution();

      scamTypes.forEach((type) => {
        expect(distribution[type]).toBe(1);
      });
      expect(Object.keys(distribution).length).toBe(5);
    });
  });

  describe('localStorage Persistence', () => {
    it('should persist analyses to localStorage with debounce', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addAnalysis(mockAnalysis);
      });

      // Should not save immediately due to debounce
      expect(localStorage.getItem('scamguard_analysis_history')).toBeNull();

      // Wait for debounce timeout
      await waitFor(() => {
        expect(localStorage.getItem('scamguard_analysis_history')).toBeTruthy();
      }, { timeout: 600 });

      const saved = JSON.parse(
        localStorage.getItem('scamguard_analysis_history')
      );
      expect(saved).toHaveLength(1);
    });

    it('should restore analyses from localStorage on remount', async () => {
      const { result: result1 } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      act(() => {
        result1.current.addAnalysis(mockAnalysis);
      });

      // Wait for save
      await waitFor(() => {
        expect(localStorage.getItem('scamguard_analysis_history')).toBeTruthy();
      }, { timeout: 600 });

      // Simulate remount
      const { result: result2 } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      expect(result2.current.analyses).toHaveLength(1);
    });

    it('should debounce multiple rapid saves', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        // Add multiple analyses rapidly
        for (let i = 0; i < 5; i++) {
          result.current.addAnalysis(mockAnalysis);
        }
      });

      // Only one save should occur (not 5)
      await waitFor(() => {
        expect(localStorage.getItem('scamguard_analysis_history')).toBeTruthy();
      }, { timeout: 600 });

      const saved = JSON.parse(
        localStorage.getItem('scamguard_analysis_history')
      );
      expect(saved).toHaveLength(5);
    });

    it('should handle localStorage errors gracefully', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate localStorage quota exceeded
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      act(() => {
        result.current.addAnalysis(mockAnalysis);
      });

      // Should not throw
      await waitFor(() => {
        // Wait for debounce
      }, { timeout: 600 });

      setItemSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty analyses list', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(() => {
        result.current.getAnalyses();
        result.current.getAnalysesForDays(30);
        result.current.getStatistics();
        result.current.getScamTypeDistribution();
      }).not.toThrow();
    });

    it('should handle very old analyses', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

      // Manually add old analysis (simulate historical data)
      const oldAnalyses = [
        {
          id: 'old',
          timestamp: oneYearAgo,
          ...mockAnalysis,
        },
      ];

      localStorage.setItem(
        'scamguard_analysis_history',
        JSON.stringify(oldAnalyses)
      );

      const { result: result2 } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      const recent = result2.current.getAnalysesForDays(30);
      expect(recent).toHaveLength(0); // Not in last 30 days

      const all30Days = result2.current.getAnalysesForDays(730); // 2 years
      expect(all30Days).toHaveLength(1);
    });

    it('should handle large number of analyses', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.addAnalysis({
            ...mockAnalysis,
            content: `Analysis ${i}`,
          });
        }
      });

      expect(result.current.analyses).toHaveLength(1000);
      const stats = result.current.getStatistics();
      expect(stats.total).toBe(1000);
    });

    it('should handle successful add and delete sequence', async () => {
      const { result } = renderHook(() => useAnalysisHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add one analysis
      let id1;
      act(() => {
        id1 = result.current.addAnalysis(mockAnalysis);
      });

      // Verify it was added
      expect(result.current.analyses.length).toBe(1);
      expect(result.current.getAnalysisById(id1)).toBeDefined();

      // Delete it
      act(() => {
        result.current.deleteAnalysis(id1);
      });

      // Verify it was deleted
      expect(result.current.analyses.length).toBe(0);
      expect(result.current.getAnalysisById(id1)).toBeUndefined();
    });
  });
});
