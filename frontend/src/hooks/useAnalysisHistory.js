/**
 * useAnalysisHistory Hook
 * Phase 4.0.1 - Persistent Analysis Storage
 *
 * Manages scam analysis history with localStorage persistence
 * Tracks all verified messages/images with results and dates
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'scamguard_analysis_history';

/**
 * Analysis object structure:
 * {
 *   id: string (timestamp-based),
 *   timestamp: number (Date.now()),
 *   type: 'message' | 'image',
 *   content: string (message text or image description),
 *   result: {
 *     score: number (0-100),
 *     riskLevel: 'safe' | 'moderate' | 'danger',
 *     message: string,
 *     scamType: string,
 *     feedback: string,
 *     xpEarned: number
 *   }
 * }
 */

export const useAnalysisHistory = () => {
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAnalyses(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever analyses change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
      } catch (error) {
        console.error('Error saving analysis history:', error);
      }
    }
  }, [analyses, isLoading]);

  /**
   * Add new analysis to history
   */
  const addAnalysis = useCallback((analysisData) => {
    const newAnalysis = {
      id: `analysis_${Date.now()}`,
      timestamp: Date.now(),
      ...analysisData,
    };

    setAnalyses((prev) => [newAnalysis, ...prev]);
    return newAnalysis.id;
  }, []);

  /**
   * Get all analyses
   */
  const getAnalyses = useCallback(() => {
    return analyses;
  }, [analyses]);

  /**
   * Get analyses for last N days
   */
  const getAnalysesForDays = useCallback((days = 30) => {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    return analyses.filter((a) => a.timestamp >= cutoffTime);
  }, [analyses]);

  /**
   * Get analysis by ID
   */
  const getAnalysisById = useCallback(
    (id) => {
      return analyses.find((a) => a.id === id);
    },
    [analyses]
  );

  /**
   * Delete analysis by ID
   */
  const deleteAnalysis = useCallback((id) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /**
   * Clear all analyses
   */
  const clearHistory = useCallback(() => {
    setAnalyses([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Get statistics
   */
  const getStatistics = useCallback(() => {
    const total = analyses.length;
    const safe = analyses.filter((a) => a.result?.riskLevel === 'safe').length;
    const moderate = analyses.filter(
      (a) => a.result?.riskLevel === 'moderate'
    ).length;
    const danger = analyses.filter(
      (a) => a.result?.riskLevel === 'danger'
    ).length;
    const avgScore =
      total > 0
        ? Math.round(
            analyses.reduce((sum, a) => sum + (a.result?.score || 0), 0) /
              total
          )
        : 0;
    const totalXpEarned = analyses.reduce(
      (sum, a) => sum + (a.result?.xpEarned || 0),
      0
    );

    return {
      total,
      safe,
      moderate,
      danger,
      avgScore,
      totalXpEarned,
      safePercentage: total > 0 ? Math.round((safe / total) * 100) : 0,
      riskPercentage: total > 0 ? Math.round(((moderate + danger) / total) * 100) : 0,
    };
  }, [analyses]);

  /**
   * Get scam type distribution
   */
  const getScamTypeDistribution = useCallback(() => {
    const distribution = {};
    analyses.forEach((a) => {
      const type = a.result?.scamType || 'unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    return distribution;
  }, [analyses]);

  return {
    analyses,
    isLoading,
    addAnalysis,
    getAnalyses,
    getAnalysesForDays,
    getAnalysisById,
    deleteAnalysis,
    clearHistory,
    getStatistics,
    getScamTypeDistribution,
  };
};

export default useAnalysisHistory;
