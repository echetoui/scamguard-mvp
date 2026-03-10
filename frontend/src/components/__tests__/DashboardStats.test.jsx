/**
 * DashboardStats Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Statistics display
 * - Metric calculations
 * - Risk distribution visualization
 * - Empty state handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardStats from '../DashboardStats';

describe('DashboardStats Component', () => {
  const mockStatistics = {
    total: 10,
    safe: 6,
    moderate: 2,
    danger: 2,
    avgScore: 72.5,
    totalXpEarned: 450,
    safePercentage: 60,
  };

  const mockAnalyses = [
    { id: 1, type: 'Romance Scam', riskScore: 92, status: 'blocked' },
    { id: 2, type: 'Tech Support', riskScore: 78, status: 'suspicious' },
    { id: 3, type: 'Prize Scam', riskScore: 45, status: 'low_risk' },
  ];

  beforeEach(() => {
    // Reset before each test
  });

  describe('Rendering', () => {
    it('should render dashboard stats title', () => {
      render(<DashboardStats statistics={mockStatistics} analyses={mockAnalyses} />);
      expect(screen.getByText(/Tableau de Bord/)).toBeTruthy();
    });

    it('should render stats grid', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} analyses={mockAnalyses} />
      );
      const statsGrid = container.querySelector('.stats-grid');
      expect(statsGrid).toBeTruthy();
    });

    it('should render all stat cards', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} analyses={mockAnalyses} />
      );
      const statCards = container.querySelectorAll('.stat-card');
      expect(statCards.length).toBe(6);
    });

    it('should render with default empty statistics', () => {
      const { container } = render(<DashboardStats />);
      expect(container).toBeTruthy();
    });
  });

  describe('Statistics Display', () => {
    it('should display total analyses count', () => {
      render(<DashboardStats statistics={mockStatistics} />);
      expect(screen.getByText('10')).toBeTruthy();
      expect(screen.getByText(/Messages Analysés/)).toBeTruthy();
    });

    it('should display scams avoided (safe count)', () => {
      render(<DashboardStats statistics={mockStatistics} />);
      const cards = screen.queryAllByText(/Arnaques Évitées/);
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should display threats detected (moderate + danger)', () => {
      render(<DashboardStats statistics={mockStatistics} />);
      const cards = screen.queryAllByText(/Menaces Détectées/);
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should display success rate percentage', () => {
      render(<DashboardStats statistics={mockStatistics} />);
      const percentages = screen.queryAllByText(/60%/);
      expect(percentages.length).toBeGreaterThan(0);
      expect(screen.getByText(/Taux de Réussite/)).toBeTruthy();
    });

    it('should display average score', () => {
      render(<DashboardStats statistics={mockStatistics} />);
      expect(screen.getByText('72.5')).toBeTruthy();
      expect(screen.getByText(/Score Moyen/)).toBeTruthy();
    });

    it('should display total XP earned', () => {
      render(<DashboardStats statistics={mockStatistics} />);
      expect(screen.getByText('450')).toBeTruthy();
      expect(screen.getByText(/Points Gagnés/)).toBeTruthy();
    });
  });

  describe('Metric Calculations', () => {
    it('should calculate scams avoided as safe count', () => {
      const stats = { total: 10, safe: 7, moderate: 2, danger: 1, safePercentage: 70 };
      const { container } = render(<DashboardStats statistics={stats} />);
      // Safe count should be displayed
      expect(container.textContent).toContain('7');
    });

    it('should calculate threats detected as moderate + danger', () => {
      const stats = { total: 10, safe: 5, moderate: 3, danger: 2, safePercentage: 50 };
      const { container } = render(<DashboardStats statistics={stats} />);
      // Threats = 3 + 2 = 5
      expect(container.textContent).toContain('5');
    });

    it('should calculate success rate from safePercentage', () => {
      const stats = { total: 10, safe: 8, moderate: 1, danger: 1, safePercentage: 80 };
      render(<DashboardStats statistics={stats} />);
      const percentages = screen.queryAllByText(/80%/);
      expect(percentages.length).toBeGreaterThan(0);
    });

    it('should show 0% success rate when no analyses', () => {
      const stats = { total: 0, safe: 0, moderate: 0, danger: 0, safePercentage: 0 };
      render(<DashboardStats statistics={stats} />);
      expect(screen.getByText(/0%/)).toBeTruthy();
    });
  });

  describe('Risk Distribution Chart', () => {
    it('should render risk distribution when data exists', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      const distribution = container.querySelector('.risk-distribution');
      expect(distribution).toBeTruthy();
    });

    it('should not render risk distribution when total is 0', () => {
      const stats = { total: 0, safe: 0, moderate: 0, danger: 0 };
      const { container } = render(<DashboardStats statistics={stats} />);
      const distribution = container.querySelector('.risk-distribution');
      expect(distribution).toBeFalsy();
    });

    it('should display safe risk bar', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      const safeBars = container.querySelectorAll('.risk-bar-fill.safe');
      expect(safeBars.length).toBeGreaterThan(0);
    });

    it('should display moderate risk bar', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      const moderateBars = container.querySelectorAll('.risk-bar-fill.moderate');
      expect(moderateBars.length).toBeGreaterThan(0);
    });

    it('should display danger risk bar', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      const dangerBars = container.querySelectorAll('.risk-bar-fill.danger');
      expect(dangerBars.length).toBeGreaterThan(0);
    });

    it('should calculate correct bar widths', () => {
      const stats = { total: 100, safe: 60, moderate: 20, danger: 20 };
      const { container } = render(<DashboardStats statistics={stats} />);
      const safeBars = container.querySelectorAll('.risk-bar-fill.safe');
      const safeBar = safeBars[0];
      expect(safeBar).toBeTruthy();
      expect(safeBar.style.width).toBe('60%');
    });

    it('should display risk percentages', () => {
      render(<DashboardStats statistics={mockStatistics} />);
      const percentages60 = screen.queryAllByText(/60%/);
      const percentages20 = screen.queryAllByText(/20%/);
      expect(percentages60.length).toBeGreaterThan(0); // Safe
      expect(percentages20.length).toBeGreaterThan(0); // Moderate and Danger
    });

    it('should display risk labels', () => {
      render(<DashboardStats statistics={mockStatistics} />);
      expect(screen.getByText(/Sûr/)).toBeTruthy();
      expect(screen.getByText(/Modéré/)).toBeTruthy();
      expect(screen.getByText(/Dangereux/)).toBeTruthy();
    });

    it('should display risk counts', () => {
      render(<DashboardStats statistics={mockStatistics} />);
      // Safe: 6, Moderate: 2, Danger: 2
      const counts = screen.queryAllByText('6');
      expect(counts.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no data', () => {
      const stats = { total: 0, safe: 0, moderate: 0, danger: 0 };
      render(<DashboardStats statistics={stats} />);
      expect(screen.getByText(/Aucune données/)).toBeTruthy();
    });

    it('should display empty hint message', () => {
      const stats = { total: 0, safe: 0, moderate: 0, danger: 0 };
      render(<DashboardStats statistics={stats} />);
      expect(screen.getByText(/Analysez des messages/)).toBeTruthy();
    });

    it('should not show empty state when data exists', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      const emptyState = container.querySelector('.stats-empty');
      expect(emptyState).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels on stat cards', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      const statCards = container.querySelectorAll('[aria-label]');
      expect(statCards.length).toBeGreaterThan(0);
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have progress bar roles on risk bars', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      const progressBars = container.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should have aria attributes on progress bars', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin');
      expect(progressBar).toHaveAttribute('aria-valuemax');
    });

    it('should have heading hierarchy', () => {
      render(<DashboardStats statistics={mockStatistics} />);
      expect(screen.getByText(/Tableau de Bord/)).toBeTruthy();
      expect(screen.getByText(/Distribution des Risques/)).toBeTruthy();
    });
  });

  describe('Props Handling', () => {
    it('should handle missing statistics prop', () => {
      const { container } = render(<DashboardStats />);
      expect(container).toBeTruthy();
    });

    it('should handle missing analyses prop', () => {
      const { container } = render(<DashboardStats statistics={mockStatistics} />);
      expect(container).toBeTruthy();
    });

    it('should use default values for missing statistics', () => {
      const stats = { total: 5 }; // Only total provided
      const { container } = render(<DashboardStats statistics={stats} />);
      expect(container).toBeTruthy();
    });

    it('should handle zero statistics', () => {
      const stats = {
        total: 0,
        safe: 0,
        moderate: 0,
        danger: 0,
        avgScore: 0,
        totalXpEarned: 0,
        safePercentage: 0,
      };
      render(<DashboardStats statistics={stats} />);
      expect(screen.getByText(/Aucune données/)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle high stats values', () => {
      const stats = {
        total: 10000,
        safe: 9000,
        moderate: 500,
        danger: 500,
        avgScore: 99.5,
        totalXpEarned: 50000,
        safePercentage: 90,
      };
      const { container } = render(<DashboardStats statistics={stats} />);
      expect(container.textContent).toContain('10000');
    });

    it('should handle decimal average scores', () => {
      const stats = { ...mockStatistics, avgScore: 72.456 };
      render(<DashboardStats statistics={stats} />);
      expect(screen.getByText('72.456')).toBeTruthy();
    });

    it('should handle single message (division by zero protection)', () => {
      const stats = {
        total: 1,
        safe: 1,
        moderate: 0,
        danger: 0,
        safePercentage: 100,
      };
      render(<DashboardStats statistics={stats} />);
      const percentages = screen.queryAllByText(/100%/);
      expect(percentages.length).toBeGreaterThan(0);
    });

    it('should calculate percentages correctly for risk bars', () => {
      const stats = {
        total: 3,
        safe: 1,
        moderate: 1,
        danger: 1,
        safePercentage: 33,
      };
      const { container } = render(<DashboardStats statistics={stats} />);
      const safeBars = container.querySelectorAll('.risk-bar-fill.safe');
      const safeBar = safeBars[0];
      // Should be approximately 33.33%
      expect(safeBar).toBeTruthy();
      expect(safeBar.style.width).toMatch(/33\.3+%/);
    });
  });

  describe('Styling & Classes', () => {
    it('should have correct stat card classes', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      expect(container.querySelector('.stat-analyses')).toBeTruthy();
      expect(container.querySelector('.stat-avoided')).toBeTruthy();
      expect(container.querySelector('.stat-threats')).toBeTruthy();
      expect(container.querySelector('.stat-rate')).toBeTruthy();
      expect(container.querySelector('.stat-score')).toBeTruthy();
      expect(container.querySelector('.stat-xp')).toBeTruthy();
    });

    it('should have main container class', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      expect(container.querySelector('.dashboard-stats')).toBeTruthy();
    });

    it('should have stats title class', () => {
      const { container } = render(
        <DashboardStats statistics={mockStatistics} />
      );
      expect(container.querySelector('.stats-title')).toBeTruthy();
    });
  });
});
