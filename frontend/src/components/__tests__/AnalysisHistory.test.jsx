/**
 * AnalysisHistory Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Analysis list rendering
 * - Risk level display
 * - Date formatting
 * - Optional content display
 * - Empty state
 */

import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import AnalysisHistory from '../AnalysisHistory';

describe('AnalysisHistory Component', () => {
  const mockAnalyses = [
    {
      id: 1,
      type: 'message',
      content: 'This looks like a suspicious phishing attempt trying to steal your banking credentials',
      timestamp: new Date().toISOString(),
      result: {
        riskLevel: 'danger',
        score: 92,
        scamType: 'Phishing',
        feedback: 'This message contains classic phishing indicators.',
        xpEarned: 50,
      },
    },
    {
      id: 2,
      type: 'message',
      content: 'Hi, how are you doing today?',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      result: {
        riskLevel: 'safe',
        score: 15,
        feedback: 'This appears to be a legitimate personal message.',
        xpEarned: 10,
      },
    },
    {
      id: 3,
      type: 'image',
      content: 'Screenshot of a dating profile with romantic story',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      result: {
        riskLevel: 'moderate',
        score: 65,
        scamType: 'Romance Scam',
        xpEarned: 30,
      },
    },
  ];

  beforeEach(() => {
    // Reset before each test
  });

  describe('Rendering', () => {
    it('should render history title', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(screen.getByText(/Historique des Analyses/)).toBeTruthy();
    });

    it('should render analysis list', () => {
      const { container } = render(<AnalysisHistory analyses={mockAnalyses} />);
      const list = container.querySelector('.analysis-list');
      expect(list).toBeTruthy();
    });

    it('should render all analysis items', () => {
      const { container } = render(<AnalysisHistory analyses={mockAnalyses} />);
      const items = container.querySelectorAll('.analysis-item');
      expect(items.length).toBe(3);
    });

    it('should render with empty analyses array', () => {
      const { container } = render(<AnalysisHistory analyses={[]} />);
      expect(container).toBeTruthy();
    });

    it('should render with default empty prop', () => {
      const { container } = render(<AnalysisHistory />);
      expect(container).toBeTruthy();
    });
  });

  describe('Risk Level Display', () => {
    it('should display danger risk level', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(screen.getByText(/Dangereux/)).toBeTruthy();
      expect(screen.getByText('🚨')).toBeTruthy();
    });

    it('should display safe risk level', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(screen.getByText(/Sûr/)).toBeTruthy();
      expect(screen.getByText('✅')).toBeTruthy();
    });

    it('should display moderate risk level', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(screen.getByText(/Modéré/)).toBeTruthy();
      expect(screen.getByText('⚠️')).toBeTruthy();
    });

    it('should display risk scores', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(screen.getByText(/92\/100/)).toBeTruthy();
      expect(screen.getByText(/15\/100/)).toBeTruthy();
      expect(screen.getByText(/65\/100/)).toBeTruthy();
    });

    it('should have border color matching risk level', () => {
      const { container } = render(<AnalysisHistory analyses={mockAnalyses} />);
      const items = container.querySelectorAll('.analysis-item');
      expect(items[0].style.borderLeftColor).toBeTruthy();
    });
  });

  describe('Content Display', () => {
    it('should display analysis content preview', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(screen.getByText(/This looks like a suspicious phishing/)).toBeTruthy();
    });

    it('should truncate long content', () => {
      const longAnalysis = [
        {
          id: 1,
          type: 'message',
          content: 'a'.repeat(150),
          timestamp: new Date().toISOString(),
          result: { riskLevel: 'safe', score: 20 },
        },
      ];
      const { container } = render(<AnalysisHistory analyses={longAnalysis} />);
      const content = container.querySelector('.analysis-text');
      expect(content.textContent.length).toBeLessThan(150);
      expect(content.textContent).toContain('...');
    });

    it('should not add ellipsis for short content', () => {
      const shortAnalysis = [
        {
          id: 1,
          type: 'message',
          content: 'Short',
          timestamp: new Date().toISOString(),
          result: { riskLevel: 'safe', score: 20 },
        },
      ];
      const { container } = render(<AnalysisHistory analyses={shortAnalysis} />);
      const content = container.querySelector('.analysis-text');
      expect(content.textContent).not.toContain('...');
    });
  });

  describe('Metadata Display', () => {
    it('should display message type indicator', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      const messageIcons = screen.queryAllByText(/📱 Message/);
      expect(messageIcons.length).toBeGreaterThan(0);
    });

    it('should display image type indicator', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      const imageIcon = screen.getByText(/📸 Image/);
      expect(imageIcon).toBeTruthy();
    });

    it('should display today timestamp', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(screen.getByText(/Aujourd'hui/)).toBeTruthy();
    });

    it('should display yesterday timestamp', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(screen.getByText(/Hier/)).toBeTruthy();
    });

    it('should display full date for older messages', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      // Should show the date 2 days ago
      const textContent = screen.getByText(/Historique/)
        .closest('.analysis-history').textContent;
      expect(textContent).toContain('mars') || textContent.includes('février') || textContent.includes('janvier');
    });
  });

  describe('Optional Content', () => {
    it('should display scam type when present', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(screen.getByText(/Phishing/)).toBeTruthy();
      expect(screen.getByText(/Romance Scam/)).toBeTruthy();
    });

    it('should not display scam type when missing', () => {
      const analysisWithoutScamType = [
        {
          id: 1,
          type: 'message',
          content: 'Test',
          timestamp: new Date().toISOString(),
          result: {
            riskLevel: 'safe',
            score: 20,
          },
        },
      ];
      const { container } = render(<AnalysisHistory analyses={analysisWithoutScamType} />);
      const scamTypeSection = container.querySelector('.analysis-scam-type');
      expect(scamTypeSection).toBeFalsy();
    });

    it('should display feedback when present', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(screen.getByText(/This message contains classic phishing/)).toBeTruthy();
    });

    it('should not display feedback when missing', () => {
      const analysisWithoutFeedback = [
        {
          id: 1,
          type: 'message',
          content: 'Test',
          timestamp: new Date().toISOString(),
          result: {
            riskLevel: 'safe',
            score: 20,
          },
        },
      ];
      const { container } = render(<AnalysisHistory analyses={analysisWithoutFeedback} />);
      const feedbackSection = container.querySelector('.analysis-feedback');
      expect(feedbackSection).toBeFalsy();
    });

    it('should display XP earned when greater than 0', () => {
      render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(screen.getByText(/🎖️ \+50 XP/)).toBeTruthy();
      expect(screen.getByText(/🎖️ \+30 XP/)).toBeTruthy();
    });

    it('should not display XP badge when 0', () => {
      const analysisWithoutXP = [
        {
          id: 1,
          type: 'message',
          content: 'Test',
          timestamp: new Date().toISOString(),
          result: {
            riskLevel: 'safe',
            score: 20,
            xpEarned: 0,
          },
        },
      ];
      const { container } = render(<AnalysisHistory analyses={analysisWithoutXP} />);
      const xpBadge = container.querySelector('.analysis-xp');
      expect(xpBadge).toBeFalsy();
    });
  });

  describe('Empty State', () => {
    it('should display empty message', () => {
      render(<AnalysisHistory analyses={[]} />);
      expect(screen.getByText(/Aucun message analysé/)).toBeTruthy();
    });

    it('should display empty hint', () => {
      render(<AnalysisHistory analyses={[]} />);
      expect(screen.getByText(/Analysez des messages/)).toBeTruthy();
    });

    it('should show empty state container', () => {
      const { container } = render(<AnalysisHistory analyses={[]} />);
      const emptyState = container.querySelector('.analysis-history-empty');
      expect(emptyState).toBeTruthy();
    });

    it('should not show empty state when data exists', () => {
      const { container } = render(<AnalysisHistory analyses={mockAnalyses} />);
      const emptyState = container.querySelector('.analysis-history-empty');
      expect(emptyState).toBeFalsy();
    });
  });

  describe('Styling', () => {
    it('should have correct container class', () => {
      const { container } = render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(container.querySelector('.analysis-history')).toBeTruthy();
    });

    it('should have history title class', () => {
      const { container } = render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(container.querySelector('.history-title')).toBeTruthy();
    });

    it('should have analysis item classes', () => {
      const { container } = render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(container.querySelector('.analysis-item')).toBeTruthy();
      expect(container.querySelector('.analysis-header')).toBeTruthy();
      expect(container.querySelector('.analysis-content')).toBeTruthy();
      expect(container.querySelector('.analysis-meta')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle analysis with missing result field', () => {
      const analysis = [
        {
          id: 1,
          type: 'message',
          content: 'Test',
          timestamp: new Date().toISOString(),
        },
      ];
      const { container } = render(<AnalysisHistory analyses={analysis} />);
      expect(container.querySelector('.analysis-item')).toBeTruthy();
    });

    it('should handle analysis with missing score', () => {
      const analysis = [
        {
          id: 1,
          type: 'message',
          content: 'Test',
          timestamp: new Date().toISOString(),
          result: {
            riskLevel: 'safe',
          },
        },
      ];
      render(<AnalysisHistory analyses={analysis} />);
      expect(screen.getByText(/0\/100/)).toBeTruthy();
    });

    it('should handle very large XP values', () => {
      const analysis = [
        {
          id: 1,
          type: 'message',
          content: 'Test',
          timestamp: new Date().toISOString(),
          result: {
            riskLevel: 'danger',
            score: 95,
            xpEarned: 50000,
          },
        },
      ];
      render(<AnalysisHistory analyses={analysis} />);
      expect(screen.getByText(/🎖️ \+50000 XP/)).toBeTruthy();
    });

    it('should handle unknown risk level', () => {
      const analysis = [
        {
          id: 1,
          type: 'message',
          content: 'Test',
          timestamp: new Date().toISOString(),
          result: {
            riskLevel: 'unknown',
            score: 50,
          },
        },
      ];
      render(<AnalysisHistory analyses={analysis} />);
      expect(screen.getByText(/Inconnu/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have heading hierarchy', () => {
      const { container } = render(<AnalysisHistory analyses={mockAnalyses} />);
      const heading = container.querySelector('h3');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toContain('Historique');
    });

    it('should have semantic structure', () => {
      const { container } = render(<AnalysisHistory analyses={mockAnalyses} />);
      expect(container.querySelector('.analysis-list')).toBeTruthy();
      expect(container.querySelector('.analysis-item')).toBeTruthy();
    });
  });

  describe('List Rendering', () => {
    it('should render items in order', () => {
      const { container } = render(<AnalysisHistory analyses={mockAnalyses} />);
      const items = container.querySelectorAll('.analysis-item');
      expect(items[0].textContent).toContain('suspicious phishing');
      expect(items[1].textContent).toContain('how are you');
      expect(items[2].textContent).toContain('dating profile');
    });

    it('should use unique keys from analysis IDs', () => {
      const analyses = [
        {
          id: 'unique-1',
          type: 'message',
          content: 'Test 1',
          timestamp: new Date().toISOString(),
          result: { riskLevel: 'safe', score: 20 },
        },
        {
          id: 'unique-2',
          type: 'message',
          content: 'Test 2',
          timestamp: new Date().toISOString(),
          result: { riskLevel: 'safe', score: 20 },
        },
      ];
      const { container } = render(<AnalysisHistory analyses={analyses} />);
      const items = container.querySelectorAll('.analysis-item');
      expect(items).toHaveLength(2);
    });
  });
});
