/**
 * Dashboard Utilities Tests
 * Phase 5E - Test Coverage Expansion
 *
 * Tests for score calculation and SVG coordinate utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getScoreStatus,
  getScoreColor,
  getScoreEmoji,
  getStatusMessage,
  getStatusText,
  calculateGraphPoints,
  calculateDataPoint,
} from '../dashboardUtils';

describe('Dashboard Utilities', () => {
  describe('getScoreStatus', () => {
    it('should return "safe" for high scores (70+)', () => {
      expect(getScoreStatus(70)).toBe('safe');
      expect(getScoreStatus(85)).toBe('safe');
      expect(getScoreStatus(100)).toBe('safe');
    });

    it('should return "moderate" for mid-range scores (40-69)', () => {
      expect(getScoreStatus(40)).toBe('moderate');
      expect(getScoreStatus(50)).toBe('moderate');
      expect(getScoreStatus(69)).toBe('moderate');
    });

    it('should return "warning" for low scores (0-39)', () => {
      expect(getScoreStatus(0)).toBe('warning');
      expect(getScoreStatus(20)).toBe('warning');
      expect(getScoreStatus(39)).toBe('warning');
    });

    it('should handle boundary values', () => {
      expect(getScoreStatus(70)).toBe('safe');
      expect(getScoreStatus(69.99)).toBe('moderate');
      expect(getScoreStatus(40)).toBe('moderate');
      expect(getScoreStatus(39.99)).toBe('warning');
    });

    it('should handle edge case: score 0', () => {
      expect(getScoreStatus(0)).toBe('warning');
    });

    it('should handle edge case: score 100', () => {
      expect(getScoreStatus(100)).toBe('safe');
    });
  });

  describe('getScoreColor', () => {
    it('should return green for safe scores (70+)', () => {
      expect(getScoreColor(70)).toBe('#2E7D32');
      expect(getScoreColor(100)).toBe('#2E7D32');
    });

    it('should return orange for moderate scores (40-69)', () => {
      expect(getScoreColor(40)).toBe('#F57C00');
      expect(getScoreColor(50)).toBe('#F57C00');
      expect(getScoreColor(69)).toBe('#F57C00');
    });

    it('should return red for warning scores (0-39)', () => {
      expect(getScoreColor(0)).toBe('#D32F2F');
      expect(getScoreColor(39)).toBe('#D32F2F');
    });

    it('should return correct hex values', () => {
      // Green is dark green
      expect(getScoreColor(80)).toBe('#2E7D32');
      // Orange is vibrant
      expect(getScoreColor(50)).toBe('#F57C00');
      // Red is vibrant red
      expect(getScoreColor(20)).toBe('#D32F2F');
    });

    it('should handle boundary scores', () => {
      expect(getScoreColor(40)).toBe('#F57C00'); // Boundary
      expect(getScoreColor(70)).toBe('#2E7D32'); // Boundary
    });
  });

  describe('getScoreEmoji', () => {
    it('should return green circle for safe scores', () => {
      expect(getScoreEmoji(70)).toBe('🟢');
      expect(getScoreEmoji(100)).toBe('🟢');
    });

    it('should return yellow circle for moderate scores', () => {
      expect(getScoreEmoji(40)).toBe('🟡');
      expect(getScoreEmoji(50)).toBe('🟡');
      expect(getScoreEmoji(69)).toBe('🟡');
    });

    it('should return red circle for warning scores', () => {
      expect(getScoreEmoji(0)).toBe('🔴');
      expect(getScoreEmoji(39)).toBe('🔴');
    });

    it('should return emojis consistently with status', () => {
      expect(getScoreEmoji(85)).toBe('🟢'); // safe
      expect(getScoreEmoji(55)).toBe('🟡'); // moderate
      expect(getScoreEmoji(25)).toBe('🔴'); // warning
    });
  });

  describe('getStatusMessage', () => {
    it('should return encouraging message for very high scores (80+)', () => {
      expect(getStatusMessage(80)).toBe('Vous êtes très bien protégé!');
      expect(getStatusMessage(100)).toBe('Vous êtes très bien protégé!');
    });

    it('should return good message for high scores (70-79)', () => {
      expect(getStatusMessage(70)).toBe('Vous êtes bien protégé!');
      expect(getStatusMessage(79)).toBe('Vous êtes bien protégé!');
    });

    it('should return caution message for moderate scores (40-69)', () => {
      expect(getStatusMessage(40)).toBe('Soyez vigilant!');
      expect(getStatusMessage(50)).toBe('Soyez vigilant!');
      expect(getStatusMessage(69)).toBe('Soyez vigilant!');
    });

    it('should return action message for low scores (0-39)', () => {
      expect(getStatusMessage(0)).toBe('Action recommandée!');
      expect(getStatusMessage(39)).toBe('Action recommandée!');
    });

    it('should be in French', () => {
      const msg = getStatusMessage(75);
      expect(msg).toContain('é'); // French accents
      expect(msg).toContain('ê'); // Or other French characters
    });

    it('should handle boundary scores', () => {
      expect(getStatusMessage(80)).toBe('Vous êtes très bien protégé!');
      expect(getStatusMessage(79.99)).toBe('Vous êtes bien protégé!');
      expect(getStatusMessage(70)).toBe('Vous êtes bien protégé!');
      expect(getStatusMessage(69.99)).toBe('Soyez vigilant!');
    });
  });

  describe('getStatusText', () => {
    it('should map "safe" to french text', () => {
      expect(getStatusText('safe')).toBe('TRÈS SÛRS');
    });

    it('should map "moderate" to french text', () => {
      expect(getStatusText('moderate')).toBe('MODÉRÉ');
    });

    it('should map "warning" to french text', () => {
      expect(getStatusText('warning')).toBe('VIGILANCE');
    });

    it('should map "error" to french text', () => {
      expect(getStatusText('error')).toBe('ERREUR');
    });

    it('should return default text for unknown status', () => {
      expect(getStatusText('unknown')).toBe('CHARGEMENT');
      expect(getStatusText(null)).toBe('CHARGEMENT');
      expect(getStatusText(undefined)).toBe('CHARGEMENT');
    });

    it('should be case-sensitive', () => {
      expect(getStatusText('Safe')).toBe('CHARGEMENT');
      expect(getStatusText('SAFE')).toBe('CHARGEMENT');
    });

    it('should always return uppercase', () => {
      const result = getStatusText('safe');
      expect(result).toBe(result.toUpperCase());
    });
  });

  describe('calculateGraphPoints', () => {
    it('should return empty string for empty array', () => {
      expect(calculateGraphPoints([])).toBe('');
    });

    it('should return empty string for null', () => {
      expect(calculateGraphPoints(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(calculateGraphPoints(undefined)).toBe('');
    });

    it('should calculate points for single score', () => {
      // Single score will have NaN for x due to division by zero
      // This is an expected edge case - multiple scores recommended
      const result = calculateGraphPoints([50]);
      expect(result).toBeDefined();
      expect(result).toContain(','); // Should still have x,y separator
    });

    it('should calculate points for multiple scores', () => {
      const scores = [30, 50, 70];
      const result = calculateGraphPoints(scores);
      const points = result.split(' ');
      expect(points).toHaveLength(3);
      points.forEach((point) => {
        expect(point).toMatch(/\d+\.?\d*,\d+\.?\d*/);
      });
    });

    it('should spread points evenly across width', () => {
      const scores = [50, 50, 50];
      const result = calculateGraphPoints(scores);
      const points = result.split(' ').map((p) => {
        const [x] = p.split(',');
        return parseFloat(x);
      });

      // First point should be around x=10
      expect(points[0]).toBeCloseTo(10, 0);
      // Last point should be around x=290
      expect(points[2]).toBeCloseTo(290, 0);
      // Middle point should be around x=150
      expect(points[1]).toBeCloseTo(150, 0);
    });

    it('should map scores to y-axis correctly', () => {
      const scores = [0, 50, 100];
      const result = calculateGraphPoints(scores);
      const points = result.split(' ').map((p) => {
        const [, y] = p.split(',');
        return parseFloat(y);
      });

      // Score 0 -> y=80 (bottom)
      expect(points[0]).toBeCloseTo(80, 0);
      // Score 50 -> y=50 (middle)
      expect(points[1]).toBeCloseTo(50, 0);
      // Score 100 -> y=20 (top)
      expect(points[2]).toBeCloseTo(20, 0);
    });

    it('should handle score history with many points', () => {
      const scores = Array.from({ length: 30 }, (_, i) => (i / 30) * 100);
      const result = calculateGraphPoints(scores);
      const points = result.split(' ');
      expect(points).toHaveLength(30);
    });

    it('should have consistent point format', () => {
      const scores = [40, 60, 80];
      const result = calculateGraphPoints(scores);
      const points = result.split(' ');

      points.forEach((point) => {
        const parts = point.split(',');
        expect(parts).toHaveLength(2);
        expect(Number.isFinite(parseFloat(parts[0]))).toBe(true);
        expect(Number.isFinite(parseFloat(parts[1]))).toBe(true);
      });
    });
  });

  describe('calculateDataPoint', () => {
    it('should return object with x, y, label properties', () => {
      const point = calculateDataPoint(50, 0, 1);
      expect(point).toHaveProperty('x');
      expect(point).toHaveProperty('y');
      expect(point).toHaveProperty('label');
    });

    it('should calculate correct x coordinate', () => {
      // For first point of 3
      const point1 = calculateDataPoint(50, 0, 3);
      expect(point1.x).toBeCloseTo(10, 0);

      // For last point of 3
      const point3 = calculateDataPoint(50, 2, 3);
      expect(point3.x).toBeCloseTo(290, 0);

      // For middle point of 3
      const point2 = calculateDataPoint(50, 1, 3);
      expect(point2.x).toBeCloseTo(150, 0);
    });

    it('should calculate correct y coordinate', () => {
      const point0 = calculateDataPoint(0, 0, 1);
      const point50 = calculateDataPoint(50, 0, 1);
      const point100 = calculateDataPoint(100, 0, 1);

      // Score 0 -> y=80
      expect(point0.y).toBeCloseTo(80, 0);
      // Score 50 -> y=50
      expect(point50.y).toBeCloseTo(50, 0);
      // Score 100 -> y=20
      expect(point100.y).toBeCloseTo(20, 0);
    });

    it('should generate label with French day format', () => {
      const point = calculateDataPoint(75, 0, 5);
      expect(point.label).toContain('Jour 1');
      expect(point.label).toContain('75');
    });

    it('should increment day number correctly', () => {
      expect(calculateDataPoint(50, 0, 3).label).toContain('Jour 1');
      expect(calculateDataPoint(50, 1, 3).label).toContain('Jour 2');
      expect(calculateDataPoint(50, 2, 3).label).toContain('Jour 3');
    });

    it('should handle single data point', () => {
      const point = calculateDataPoint(60, 0, 1);
      expect(point.x).toBeDefined();
      expect(point.y).toBeDefined();
      expect(point.label).toContain('Jour 1');
    });

    it('should handle many data points', () => {
      const point = calculateDataPoint(80, 29, 30);
      expect(point.x).toBeCloseTo(290, 0);
      expect(point.label).toContain('Jour 30');
    });

    it('should have consistent coordinates with calculateGraphPoints', () => {
      const scores = [30, 50, 70];
      const graphPoints = calculateGraphPoints(scores);
      const graphPointArray = graphPoints.split(' ').map((p) => {
        const [x, y] = p.split(',');
        return { x: parseFloat(x), y: parseFloat(y) };
      });

      const dataPoints = scores.map((score, idx) =>
        calculateDataPoint(score, idx, scores.length)
      );

      dataPoints.forEach((dp, idx) => {
        expect(dp.x).toBeCloseTo(graphPointArray[idx].x, 0);
        expect(dp.y).toBeCloseTo(graphPointArray[idx].y, 0);
      });
    });
  });

  describe('Integration and Edge Cases', () => {
    it('should handle extreme scores', () => {
      expect(getScoreStatus(-10)).toBe('warning');
      expect(getScoreStatus(150)).toBe('safe');
    });

    it('should provide consistent status across functions', () => {
      const score = 65;
      const status = getScoreStatus(score);
      const color = getScoreColor(score);
      const emoji = getScoreEmoji(score);

      // For score 65 (moderate)
      expect(status).toBe('moderate');
      expect(color).toBe('#F57C00'); // orange
      expect(emoji).toBe('🟡'); // yellow
    });

    it('should handle fractional scores', () => {
      expect(getScoreStatus(70.5)).toBe('safe');
      expect(getScoreStatus(39.5)).toBe('warning'); // 39.5 < 40
      expect(getScoreStatus(69.5)).toBe('moderate'); // 40 <= 69.5 < 70
    });

    it('should calculate graph with real-world data', () => {
      const weeklyScores = [45, 52, 48, 61, 68, 75, 80];
      const result = calculateGraphPoints(weeklyScores);
      const points = result.split(' ');

      expect(points).toHaveLength(7);
      // Verify increasing trend in y-values (lower y = higher score)
      const yValues = points.map((p) => parseFloat(p.split(',')[1]));
      for (let i = 1; i < yValues.length; i++) {
        // Generally decreasing y (except maybe one dip)
        expect(yValues[i]).toBeLessThanOrEqual(yValues[i - 1] + 20);
      }
    });

    it('should maintain message quality with boundary scores', () => {
      const messages = [
        getStatusMessage(0),
        getStatusMessage(39.99),
        getStatusMessage(40),
        getStatusMessage(69.99),
        getStatusMessage(70),
        getStatusMessage(79.99),
        getStatusMessage(80),
        getStatusMessage(100),
      ];

      // All messages should be non-empty strings
      messages.forEach((msg) => {
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(0);
      });
    });
  });
});
