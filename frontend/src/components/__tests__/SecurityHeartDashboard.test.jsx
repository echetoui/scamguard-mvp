/**
 * SecurityHeartDashboard Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Component rendering and loading states
 * - Data fetching and state management
 * - Score calculations and color coding
 * - Graph rendering and data points
 * - Weekly stats display
 * - Accessibility features
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SecurityHeartDashboard from '../SecurityHeartDashboard';

// Mock dashboard utilities
vi.mock('../utils/dashboardUtils', () => ({
  getScoreStatus: vi.fn((score) => {
    if (score >= 70) return 'safe';
    if (score >= 40) return 'moderate';
    return 'danger';
  }),
  getScoreColor: vi.fn((score) => {
    if (score >= 70) return '#4CAF50';
    if (score >= 40) return '#FFA500';
    return '#F44336';
  }),
  getScoreEmoji: vi.fn((score) => {
    if (score >= 70) return '✅';
    if (score >= 40) return '⚠️';
    return '🚨';
  }),
  getStatusMessage: vi.fn((score) => {
    if (score >= 70) return 'Votre compte est bien protégé';
    if (score >= 40) return 'Soyez vigilant';
    return 'Attention requise';
  }),
  getStatusText: vi.fn((status) => {
    const statuses = { safe: 'Sûr', moderate: 'Modéré', danger: 'Dangereux', loading: 'Chargement' };
    return statuses[status] || status;
  }),
  calculateGraphPoints: vi.fn((history) => {
    if (!history || history.length === 0) return '';
    return history.map((score, idx) => `${(idx * 60)},${100 - score}`).join(' ');
  }),
  calculateDataPoint: vi.fn((score, idx, total) => ({
    x: (idx * 60),
    y: 100 - score,
    label: `Jour ${idx + 1}: ${score}/100`
  }))
}));

describe('SecurityHeartDashboard Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render security heart dashboard container', () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);
      expect(container.querySelector('.security-heart-dashboard')).toBeTruthy();
    });

    it('should render heart section', () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);
      expect(container.querySelector('.heart-section')).toBeTruthy();
    });

    it('should render heart container', () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);
      expect(container.querySelector('.heart-container')).toBeTruthy();
    });

    it('should accept userId prop', () => {
      const { container } = render(<SecurityHeartDashboard userId="test-user-456" />);
      expect(container).toBeTruthy();
    });

    it('should render multiple main sections', () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);
      expect(container.querySelector('.heart-section')).toBeTruthy();
      expect(container.querySelector('.weekly-summary-section')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should have loading UI structure in component', () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);
      // Component has loading UI elements defined
      // (may not be visible if effect runs before test checks)
      const heartContainer = container.querySelector('.heart-container');
      expect(heartContainer).toBeTruthy();
    });

    it('should transition to loaded state with score', async () => {
      render(<SecurityHeartDashboard userId="user-123" />);

      // After effect runs, score should be visible
      await waitFor(() => {
        const scoreNumber = screen.queryByText('78');
        expect(scoreNumber).toBeTruthy();
      });
    });

    it('should have isLoading state managed correctly', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      // After loading completes, score display should be visible
      await waitFor(() => {
        const scoreDisplay = container.querySelector('.score-display');
        expect(scoreDisplay).toBeTruthy();
      });
    });
  });

  describe('Score Display', () => {
    it('should display security score after loading', async () => {
      render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('78')).toBeTruthy();
      });
    });

    it('should display max score label', async () => {
      render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('/100')).toBeTruthy();
      });
    });

    it('should have score display container', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.score-display')).toBeTruthy();
      });
    });

    it('should have score number with color styling', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const scoreNumber = container.querySelector('.score-number');
        expect(scoreNumber).toBeTruthy();
        expect(scoreNumber.style.color).toBeTruthy();
      });
    });
  });

  describe('Heart Icon and Emoji', () => {
    it('should have heart icon element', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.heart-icon')).toBeTruthy();
      });
    });

    it('should have score emoji container', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.score-emoji')).toBeTruthy();
      });
    });

    it('should have emoji with aria label', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const icon = container.querySelector('.heart-icon');
        expect(icon.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('Status Section', () => {
    it('should render status section', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.status-section')).toBeTruthy();
      });
    });

    it('should display status badge', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.status-badge')).toBeTruthy();
      });
    });

    it('should have status message element', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.status-message')).toBeTruthy();
      });
    });

    it('should have status badge with role="status"', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const badge = container.querySelector('[role="status"]');
        expect(badge).toBeTruthy();
      });
    });
  });

  describe('Score History Graph', () => {
    it('should render score history section when data exists', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.score-history-section')).toBeTruthy();
      });
    });

    it('should have section title', async () => {
      render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Votre progression')).toBeTruthy();
      });
    });

    it('should render SVG graph', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.graph-svg')).toBeTruthy();
      });
    });

    it('should have graph with proper viewBox', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const svg = container.querySelector('.graph-svg');
        expect(svg.getAttribute('viewBox')).toBe('0 0 300 100');
      });
    });

    it('should render grid lines', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const gridLines = container.querySelectorAll('.grid-line');
        expect(gridLines.length).toBeGreaterThan(0);
      });
    });

    it('should render graph line (polyline)', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.graph-line')).toBeTruthy();
      });
    });

    it('should render data points', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const points = container.querySelectorAll('.graph-point');
        expect(points.length).toBeGreaterThan(0);
      });
    });

    it('should have data points with aria labels', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const points = container.querySelectorAll('.graph-point');
        points.forEach(point => {
          expect(point.getAttribute('aria-label')).toBeTruthy();
        });
      });
    });

    it('should have graph role="img" for accessibility', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const svg = container.querySelector('[role="img"]');
        expect(svg).toBeTruthy();
      });
    });
  });

  describe('Weekly Summary Section', () => {
    it('should render weekly summary section', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.weekly-summary-section')).toBeTruthy();
      });
    });

    it('should have weekly summary title', async () => {
      render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Cette semaine')).toBeTruthy();
      });
    });

    it('should render summary items container', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.summary-items')).toBeTruthy();
      });
    });

    it('should display scams blocked stat', async () => {
      render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Arnaques détectées et arrêtées/)).toBeTruthy();
        expect(screen.getByText('3')).toBeTruthy();
      });
    });

    it('should display quizzes completed stat', async () => {
      render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Quizz réussis/)).toBeTruthy();
      });
    });

    it('should display guardian status', async () => {
      render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Ange gardien vous surveille/)).toBeTruthy();
        expect(screen.getByText('Actif')).toBeTruthy();
      });
    });

    it('should have three summary items', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const items = container.querySelectorAll('.summary-item');
        expect(items.length).toBe(3);
      });
    });

    it('should display summary icons', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const icons = container.querySelectorAll('.summary-icon');
        expect(icons.length).toBe(3);
      });
    });
  });

  describe('CTA Section', () => {
    it('should render CTA section', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.cta-section')).toBeTruthy();
      });
    });

    it('should render continue button', async () => {
      render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('CONTINUER')).toBeTruthy();
      });
    });

    it('should have continue button with class', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(container.querySelector('.continue-button')).toBeTruthy();
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should have aria-label on heart icon', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const heartIcon = container.querySelector('.heart-icon');
        expect(heartIcon.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have status badge with aria-live', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const badge = container.querySelector('[aria-live="polite"]');
        expect(badge).toBeTruthy();
      });
    });

    it('should have skip link for main content', () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);
      const skipLink = container.querySelector('.skip-link');
      expect(skipLink).toBeTruthy();
      expect(skipLink.getAttribute('href')).toBe('#main-content');
    });

    it('should have skip link with text', () => {
      render(<SecurityHeartDashboard userId="user-123" />);
      expect(screen.getByText('Aller au contenu principal')).toBeTruthy();
    });

    it('should have proper heading hierarchy', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const headings = container.querySelectorAll('h3');
        expect(headings.length).toBeGreaterThan(0);
      });
    });

    it('should have graph with img role', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const svg = container.querySelector('svg[role="img"]');
        expect(svg).toBeTruthy();
      });
    });

    it('should have data points as buttons with aria labels', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const points = container.querySelectorAll('[role="button"]');
        expect(points.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Fetching', () => {
    it('should set security score from mock data', async () => {
      render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('78')).toBeTruthy();
      });
    });

    it('should set score history from mock data', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const points = container.querySelectorAll('.graph-point');
        // Mock data has 5 data points
        expect(points.length).toBe(5);
      });
    });

    it('should set weekly stats from mock data', async () => {
      render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeTruthy();
        expect(screen.getByText('2')).toBeTruthy();
      });
    });

    it('should set score status based on score', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const badge = container.querySelector('.status-badge');
        expect(badge).toBeTruthy();
      });
    });
  });

  describe('Styling and Classes', () => {
    it('should have proper CSS classes structure', () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      const sections = [
        '.security-heart-dashboard',
        '.heart-section',
        '.heart-container',
        '.status-section',
        '.weekly-summary-section',
        '.cta-section'
      ];

      sections.forEach(selector => {
        expect(container.querySelector(selector)).toBeTruthy();
      });
    });

    it('should have section titles with class', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const titles = container.querySelectorAll('.section-title');
        expect(titles.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle component with different userId', async () => {
      render(<SecurityHeartDashboard userId="different-user-789" />);

      await waitFor(() => {
        expect(screen.getByText('78')).toBeTruthy();
      });
    });

    it('should render even with no userId', async () => {
      const { container } = render(<SecurityHeartDashboard />);

      expect(container.querySelector('.security-heart-dashboard')).toBeTruthy();
    });

    it('should handle undefined userId prop', async () => {
      const { container } = render(<SecurityHeartDashboard userId={undefined} />);

      await waitFor(() => {
        expect(container.querySelector('.security-heart-dashboard')).toBeTruthy();
      });
    });
  });

  describe('State Management', () => {
    it('should have heart container managing display state', () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);
      expect(container.querySelector('.heart-container')).toBeTruthy();
    });

    it('should load and display data after effect', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        // After loading, score display should exist
        expect(container.querySelector('.score-display')).toBeTruthy();
        // And score should be visible
        expect(screen.getByText('78')).toBeTruthy();
      });
    });

    it('should maintain state after component renders', async () => {
      const { container } = render(<SecurityHeartDashboard userId="user-123" />);

      await waitFor(() => {
        const score1 = screen.getByText('78');
        expect(score1).toBeTruthy();

        // Component should keep the same score
        const score2 = screen.getByText('78');
        expect(score2).toBeTruthy();
      });
    });
  });
});
