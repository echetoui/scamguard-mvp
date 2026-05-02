/**
 * Test Suite: Leaderboard Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Leaderboard from '../Leaderboard';
import * as quizStorage from '../../utils/quizStorage';

// Mock quizStorage
vi.mock('../../utils/quizStorage', () => ({
  getLeaderboard: vi.fn(() => []),
}));

describe('Leaderboard Component', () => {
  describe('Empty State', () => {
    it('should render leaderboard container', () => {
      const { container } = render(<Leaderboard moduleId="phishing" />);
      expect(container.querySelector('.leaderboard')).toBeInTheDocument();
    });

    it('should display empty message when no entries', () => {
      render(<Leaderboard moduleId="phishing" />);
      expect(screen.getByText(/Aucun score enregistré/i)).toBeInTheDocument();
    });

    it('should not render list when empty', () => {
      const { container } = render(<Leaderboard moduleId="phishing" />);
      expect(container.querySelector('.leaderboard-list')).not.toBeInTheDocument();
    });
  });

  describe('Entries Rendering', () => {
    beforeEach(() => {
      quizStorage.getLeaderboard.mockReturnValue([
        { score: 100, difficulty: 'expert', durationSec: 120, date: '2026-04-06' },
        { score: 85, difficulty: 'intermediaire', durationSec: 150, date: '2026-04-05' },
        { score: 70, difficulty: 'debutant', durationSec: 180, date: '2026-04-04' },
      ]);
    });

    it('should render leaderboard list', () => {
      const { container } = render(<Leaderboard moduleId="phishing" />);
      expect(container.querySelector('.leaderboard-list')).toBeInTheDocument();
    });

    it('should display all entries', () => {
      render(<Leaderboard moduleId="phishing" />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('should apply difficulty class to entries', () => {
      const { container } = render(<Leaderboard moduleId="phishing" />);
      expect(container.querySelector('.difficulty-expert')).toBeInTheDocument();
      expect(container.querySelector('.difficulty-intermediaire')).toBeInTheDocument();
      expect(container.querySelector('.difficulty-debutant')).toBeInTheDocument();
    });

    it('should display entry dates', () => {
      render(<Leaderboard moduleId="phishing" />);
      expect(screen.getByText('2026-04-06')).toBeInTheDocument();
      expect(screen.getByText('2026-04-05')).toBeInTheDocument();
    });
  });

  describe('Rank Medals', () => {
    it('should display gold medal for 1st place', () => {
      quizStorage.getLeaderboard.mockReturnValue([
        { score: 100, difficulty: 'expert', durationSec: 120, date: '2026-04-06' },
      ]);
      render(<Leaderboard moduleId="phishing" />);
      expect(screen.getByText('🥇')).toBeInTheDocument();
    });

    it('should display silver medal for 2nd place', () => {
      quizStorage.getLeaderboard.mockReturnValue([
        { score: 100, difficulty: 'expert', durationSec: 120, date: '2026-04-06' },
        { score: 85, difficulty: 'intermediaire', durationSec: 150, date: '2026-04-05' },
      ]);
      render(<Leaderboard moduleId="phishing" />);
      expect(screen.getByText('🥈')).toBeInTheDocument();
    });

    it('should display bronze medal for 3rd place', () => {
      quizStorage.getLeaderboard.mockReturnValue([
        { score: 100, difficulty: 'expert', durationSec: 120, date: '2026-04-06' },
        { score: 85, difficulty: 'intermediaire', durationSec: 150, date: '2026-04-05' },
        { score: 75, difficulty: 'debutant', durationSec: 180, date: '2026-04-04' },
      ]);
      render(<Leaderboard moduleId="phishing" />);
      expect(screen.getByText('🥉')).toBeInTheDocument();
    });

    it('should display position number for 4th place and beyond', () => {
      quizStorage.getLeaderboard.mockReturnValue([
        { score: 100, difficulty: 'expert', durationSec: 120, date: '2026-04-06' },
        { score: 85, difficulty: 'intermediaire', durationSec: 150, date: '2026-04-05' },
        { score: 75, difficulty: 'debutant', durationSec: 180, date: '2026-04-04' },
        { score: 65, difficulty: 'debutant', durationSec: 200, date: '2026-04-03' },
      ]);
      render(<Leaderboard moduleId="phishing" />);
      expect(screen.getByText('4.')).toBeInTheDocument();
    });
  });

  describe('Duration Formatting', () => {
    it('should format duration under 60 seconds', () => {
      quizStorage.getLeaderboard.mockReturnValue([
        { score: 100, difficulty: 'expert', durationSec: 45, date: '2026-04-06' },
      ]);
      render(<Leaderboard moduleId="phishing" />);
      expect(screen.getByText('45s')).toBeInTheDocument();
    });

    it('should format duration over 60 seconds as minutes and seconds', () => {
      quizStorage.getLeaderboard.mockReturnValue([
        { score: 100, difficulty: 'expert', durationSec: 125, date: '2026-04-06' },
      ]);
      render(<Leaderboard moduleId="phishing" />);
      expect(screen.getByText('2m 5s')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      quizStorage.getLeaderboard.mockReturnValue([
        { score: 100, difficulty: 'expert', durationSec: 120, date: '2026-04-06' },
      ]);
    });

    it('should have proper region role', () => {
      const { container } = render(<Leaderboard moduleId="phishing" />);
      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      const { container } = render(<Leaderboard moduleId="phishing" />);
      expect(container.querySelector('[aria-label="Tableau des scores"]')).toBeInTheDocument();
    });
  });
});
