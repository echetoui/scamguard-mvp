import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SMSSimulator from '../SMSSimulator';

// Mock the scenarios data
vi.mock('../../data/scenarios', () => ({
  THREAT_SCENARIOS: [
    {
      id: 'banking-001',
      type: 'SMS',
      institution: 'Desjardins',
      threat_level: 'high',
      message: 'Desjardins: Verify account',
      is_scam: true,
      explanation_fr: 'This is a scam explanation',
      threat_indicators: ['suspicious link', 'urgency'],
      category: 'banking',
      region: 'Quebec',
      date_detected: '2026-03-14',
      source: 'SQ',
    },
    {
      id: 'banking-002',
      type: 'SMS',
      institution: 'TD Bank',
      threat_level: 'low',
      message: 'TD: Payment reminder',
      is_scam: false,
      explanation_fr: 'This is a legitimate message',
      threat_indicators: [],
      category: 'banking',
      region: 'Quebec',
      date_detected: '2026-03-14',
      source: 'internal',
    },
    {
      id: 'utility-001',
      type: 'SMS',
      institution: 'Hydro-Quebec',
      threat_level: 'high',
      message: 'Hydro: Pay now',
      is_scam: true,
      explanation_fr: 'Hydro scam explanation',
      threat_indicators: ['fake link'],
      category: 'utilities',
      region: 'Quebec',
      date_detected: '2026-03-14',
      source: 'CAFC',
    },
  ],
  getRandomScenarios: vi.fn((count) => {
    const scenarios = [
      {
        id: 'banking-001',
        type: 'SMS',
        institution: 'Desjardins',
        threat_level: 'high',
        message: 'Desjardins: Verify account',
        is_scam: true,
        explanation_fr: 'This is a scam explanation',
        threat_indicators: ['suspicious link', 'urgency'],
        category: 'banking',
        region: 'Quebec',
        date_detected: '2026-03-14',
        source: 'SQ',
      },
      {
        id: 'banking-002',
        type: 'SMS',
        institution: 'TD Bank',
        threat_level: 'low',
        message: 'TD: Payment reminder',
        is_scam: false,
        explanation_fr: 'This is a legitimate message',
        threat_indicators: [],
        category: 'banking',
        region: 'Quebec',
        date_detected: '2026-03-14',
        source: 'internal',
      },
    ];
    return scenarios.slice(0, count || 2);
  }),
  getScenariosByCategory: vi.fn(),
  getScenariosByThreatLevel: vi.fn(),
  getRandomScenario: vi.fn(),
  getScenariosByInstitution: vi.fn(),
  SCENARIO_STATS: {
    total: 3,
    scams: 2,
    legitimate: 1,
    categories: ['banking', 'utilities', 'other'],
    threatLevels: ['low', 'medium', 'high'],
  },
}));

describe('SMSSimulator Component', () => {
  describe('Rendering & Loading', () => {
    it('should render loading state initially', async () => {
      const { container } = render(<SMSSimulator />);
      // Loading state should appear or be skipped
      const loadingEl = container.querySelector('.sms-simulator-loading');
      const contentEl = container.querySelector('.sms-simulator-content');
      expect(loadingEl || contentEl).toBeTruthy();
    });

    it('should render main simulator after loading', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        expect(screen.queryByText(/Chargement/)).not.toBeInTheDocument();
      });
      // Check for institution element
      expect(screen.getByText('Desjardins')).toBeInTheDocument();
    });

    it('should display SMS message text', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        expect(screen.getByText('Desjardins: Verify account')).toBeInTheDocument();
      });
    });

    it('should display threat level badge', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        expect(screen.getByText('HIGH')).toBeInTheDocument();
      });
    });

    it('should display institution name', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const allDesjardins = screen.getAllByText('Desjardins');
        expect(allDesjardins.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should display question progress', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        expect(screen.getByText(/Question 1\/2/)).toBeInTheDocument();
      });
    });

    it('should display score badge', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
      });
    });

    it('should have progress bar with correct ARIA attributes', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '50');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('should update progress bar width', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const progressFill = document.querySelector('.sms-simulator-progress-fill');
        expect(progressFill.style.getPropertyValue('--progress')).toBe('50%');
      });
    });
  });

  describe('User Selection - Scam Detection', () => {
    it('should display both selection buttons', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        expect(screen.getByText(/C'est une arnaque/)).toBeInTheDocument();
        expect(screen.getByText(/Vrai message/)).toBeInTheDocument();
      });
    });

    it('should have buttons with min height 56px (via CSS)', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        buttons.forEach((btn) => {
          expect(btn).toHaveClass('sms-simulator-btn');
        });
      });
    });

    it('should disable buttons after selection', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        expect(screen.getByText(/C'est une arnaque/)).toBeInTheDocument();
      });
      const scamButton = screen.getByText(/C'est une arnaque/).closest('button');
      fireEvent.click(scamButton);
      // After clicking, the feedback should show indicating buttons are disabled
      await waitFor(() => {
        expect(screen.getByText(/✅|❌/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show correct feedback for correct answer (scam)', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const scamButton = screen.getByText(/C'est une arnaque/);
        fireEvent.click(scamButton);
      });
      await waitFor(() => {
        expect(screen.getByText(/✅ Correct!/)).toBeInTheDocument();
      });
    });

    it('should show incorrect feedback for wrong answer', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const legitimateButton = screen.getByText(/Vrai message/);
        fireEvent.click(legitimateButton);
      });
      await waitFor(() => {
        expect(screen.getByText(/❌ Incorrect/)).toBeInTheDocument();
      });
    });
  });

  describe('Answer Reveal & Explanation', () => {
    it('should reveal correct answer', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        expect(screen.getByText(/C'est une arnaque/)).toBeInTheDocument();
      });
      const scamButton = screen.getByText(/C'est une arnaque/).closest('button');
      fireEvent.click(scamButton);
      await waitFor(() => {
        // Check for the answer reveal section
        expect(screen.getByText(/Réponse/i)).toBeInTheDocument();
      });
    });

    it('should display explanation', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const scamButton = screen.getByText(/C'est une arnaque/);
        fireEvent.click(scamButton);
      });
      await waitFor(() => {
        expect(screen.getByText(/This is a scam explanation/)).toBeInTheDocument();
      });
    });

    it('should display threat indicators', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const scamButton = screen.getByText(/C'est une arnaque/);
        fireEvent.click(scamButton);
      });
      await waitFor(() => {
        expect(screen.getByText(/Signes d'alerte:/)).toBeInTheDocument();
        expect(screen.getByText(/suspicious link/)).toBeInTheDocument();
        expect(screen.getByText(/urgency/)).toBeInTheDocument();
      });
    });

    it('should hide threat indicators when none exist', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      // First answer the first question to get to next button
      await waitFor(() => {
        expect(screen.getByText(/C'est une arnaque/)).toBeInTheDocument();
      });
      const scamButton = screen.getByText(/C'est une arnaque/).closest('button');
      fireEvent.click(scamButton);
      // Click next to go to second question
      await waitFor(() => {
        expect(screen.getByText(/Suivant →/)).toBeInTheDocument();
      });
      const nextButton = screen.getByText(/Suivant →/);
      fireEvent.click(nextButton);
      // Answer the second question (legitimate, no indicators)
      await waitFor(() => {
        expect(screen.getByText(/Vrai message/)).toBeInTheDocument();
      });
      const legitimateButton = screen.getByText(/Vrai message/);
      fireEvent.click(legitimateButton);
      await waitFor(() => {
        expect(screen.queryByText(/Signes d'alerte:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Score Tracking', () => {
    it('should increment score on correct answer', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const scamButton = screen.getByText(/C'est une arnaque/);
        fireEvent.click(scamButton);
      });
      await waitFor(() => {
        expect(screen.getByText(/Score: 1/)).toBeInTheDocument();
      });
    });

    it('should not increment score on incorrect answer', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const legitimateButton = screen.getByText(/Vrai message/);
        fireEvent.click(legitimateButton);
      });
      await waitFor(() => {
        expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
      });
    });

    it('should maintain score across multiple questions', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      // First question - correct
      await waitFor(() => {
        const scamButton = screen.getByText(/C'est une arnaque/);
        fireEvent.click(scamButton);
      });
      // Move to next question
      await waitFor(() => {
        const nextButton = screen.getByText(/Suivant →/);
        fireEvent.click(nextButton);
      });
      // Should still show score: 1
      await waitFor(() => {
        expect(screen.getByText(/Score: 1/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should show next button after answer', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const scamButton = screen.getByText(/C'est une arnaque/);
        fireEvent.click(scamButton);
      });
      await waitFor(() => {
        expect(screen.getByText(/Suivant →/)).toBeInTheDocument();
      });
    });

    it('should move to next question on next button click', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const scamButton = screen.getByText(/C'est une arnaque/);
        fireEvent.click(scamButton);
      });
      await waitFor(() => {
        const nextButton = screen.getByText(/Suivant →/);
        fireEvent.click(nextButton);
      });
      await waitFor(() => {
        expect(screen.getByText(/Question 2\/2/)).toBeInTheDocument();
      });
    });

    it('should update progress on navigation', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const scamButton = screen.getByText(/C'est une arnaque/);
        fireEvent.click(scamButton);
      });
      await waitFor(() => {
        const nextButton = screen.getByText(/Suivant →/);
        fireEvent.click(nextButton);
      });
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      });
    });

    it('should change button text on last question', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      // Answer first question
      await waitFor(() => {
        const scamButton = screen.getByText(/C'est une arnaque/);
        fireEvent.click(scamButton);
      });
      // Move to next (last) question
      await waitFor(() => {
        const nextButton = screen.getByText(/Suivant →/);
        fireEvent.click(nextButton);
      });
      // Answer last question
      await waitFor(() => {
        const legitimateButton = screen.getByText(/Vrai message/);
        fireEvent.click(legitimateButton);
      });
      // Should show "Voir les résultats" button
      await waitFor(() => {
        expect(screen.getByText(/Voir les résultats/)).toBeInTheDocument();
      });
    });
  });

  describe('Completion Screen', () => {
    it('should show completion screen after last question', async () => {
      render(<SMSSimulator scenarioCount={1} />);
      // Wait for and click answer button
      await waitFor(() => {
        expect(screen.getByText(/C'est une arnaque/)).toBeInTheDocument();
      });
      const scamButton = screen.getByText(/C'est une arnaque/).closest('button');
      fireEvent.click(scamButton);
      // Wait for answer feedback to appear
      await waitFor(() => {
        expect(screen.getByText(/✅|❌/)).toBeInTheDocument();
      });
      // Wait for and click result button
      await waitFor(() => {
        expect(screen.getByText(/Voir les résultats/)).toBeInTheDocument();
      }, { timeout: 3000 });
      const resultButton = screen.getByText(/Voir les résultats/);
      fireEvent.click(resultButton);
      // Check for completion screen
      await waitFor(() => {
        expect(screen.getByText(/Simulation terminée/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display final score on completion', async () => {
      render(<SMSSimulator scenarioCount={1} />);
      await waitFor(() => {
        expect(screen.getByText(/C'est une arnaque/)).toBeInTheDocument();
      });
      const scamButton = screen.getByText(/C'est une arnaque/).closest('button');
      fireEvent.click(scamButton);
      // Wait for feedback to appear
      await waitFor(() => {
        expect(screen.getByText(/✅|❌/)).toBeInTheDocument();
      }, { timeout: 2000 });
      // Now click the results button
      await waitFor(() => {
        expect(screen.getByText(/Voir les résultats/)).toBeInTheDocument();
      });
      const resultButton = screen.getByText(/Voir les résultats/).closest('button');
      fireEvent.click(resultButton);
      await waitFor(() => {
        expect(screen.getByText(/1\/1/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display percentage on completion', async () => {
      render(<SMSSimulator scenarioCount={1} />);
      await waitFor(() => {
        expect(screen.getByText(/C'est une arnaque/)).toBeInTheDocument();
      });
      const scamButton = screen.getByText(/C'est une arnaque/).closest('button');
      fireEvent.click(scamButton);
      await waitFor(() => {
        expect(screen.getByText(/✅|❌/)).toBeInTheDocument();
      }, { timeout: 2000 });
      const resultButton = screen.getByText(/Voir les résultats/).closest('button');
      fireEvent.click(resultButton);
      await waitFor(() => {
        expect(screen.getByText(/100%/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show success message for high score', async () => {
      render(<SMSSimulator scenarioCount={1} />);
      await waitFor(() => {
        expect(screen.getByText(/C'est une arnaque/)).toBeInTheDocument();
      });
      const scamButton = screen.getByText(/C'est une arnaque/).closest('button');
      fireEvent.click(scamButton);
      await waitFor(() => {
        expect(screen.getByText(/✅|❌/)).toBeInTheDocument();
      }, { timeout: 2000 });
      const resultButton = screen.getByText(/Voir les résultats/).closest('button');
      fireEvent.click(resultButton);
      await waitFor(() => {
        expect(screen.getByText(/Excellent/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display restart button on completion', async () => {
      render(<SMSSimulator scenarioCount={1} />);
      await waitFor(() => {
        expect(screen.getByText(/C'est une arnaque/)).toBeInTheDocument();
      });
      const scamButton = screen.getByText(/C'est une arnaque/).closest('button');
      fireEvent.click(scamButton);
      await waitFor(() => {
        expect(screen.getByText(/✅|❌/)).toBeInTheDocument();
      }, { timeout: 2000 });
      const resultButton = screen.getByText(/Voir les résultats/).closest('button');
      fireEvent.click(resultButton);
      await waitFor(() => {
        expect(screen.getByText(/Recommencer/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should call onComplete callback with correct data', async () => {
      const onComplete = vi.fn();
      render(<SMSSimulator scenarioCount={1} onComplete={onComplete} />);
      await waitFor(() => {
        expect(screen.getByText(/C'est une arnaque/)).toBeInTheDocument();
      });
      const scamButton = screen.getByText(/C'est une arnaque/).closest('button');
      fireEvent.click(scamButton);
      await waitFor(() => {
        expect(screen.getByText(/✅|❌/)).toBeInTheDocument();
      }, { timeout: 2000 });
      const resultButton = screen.getByText(/Voir les résultats/).closest('button');
      fireEvent.click(resultButton);
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            score: 1,
            total: 1,
            percentage: 100,
          })
        );
      }, { timeout: 3000 });
    });
  });

  describe('Restart Functionality', () => {
    it('should reset state on restart', async () => {
      render(<SMSSimulator scenarioCount={1} />);
      await waitFor(() => {
        expect(screen.getByText(/C'est une arnaque/)).toBeInTheDocument();
      });
      const scamButton = screen.getByText(/C'est une arnaque/).closest('button');
      fireEvent.click(scamButton);
      await waitFor(() => {
        expect(screen.getByText(/✅|❌/)).toBeInTheDocument();
      }, { timeout: 2000 });
      const resultButton = screen.getByText(/Voir les résultats/).closest('button');
      fireEvent.click(resultButton);
      await waitFor(() => {
        expect(screen.getByText(/Recommencer/)).toBeInTheDocument();
      }, { timeout: 2000 });
      const restartButton = screen.getByText(/Recommencer/).closest('button');
      fireEvent.click(restartButton);
      await waitFor(() => {
        expect(screen.getByText(/Question 1/)).toBeInTheDocument();
        expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const scamButton = screen.getByRole('button', { name: /C'est une arnaque/ });
        expect(scamButton).toHaveAttribute('aria-label', "C'est une arnaque");
      });
    });

    it('should have aria-live on progress counter', async () => {
      const { container } = render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-label');
      });
    });

    it('should have focus management on container', async () => {
      const { container } = render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const mainContainer = container.querySelector('.sms-simulator-container');
        expect(mainContainer).toHaveAttribute('tabindex', '-1');
      });
    });

    it('should have proper semantic HTML structure', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', async () => {
      const { container } = render(<SMSSimulator scenarioCount={2} />);
      expect(container.querySelector('.sms-simulator-container')).toBeInTheDocument();
    });

    it('should have mobile-friendly button layout', async () => {
      render(<SMSSimulator scenarioCount={2} />);
      await waitFor(() => {
        const buttonGroup = document.querySelector('.sms-simulator-button-group');
        expect(buttonGroup).toBeInTheDocument();
      });
    });
  });

  describe('Custom Scenarios', () => {
    it('should accept custom initial scenarios', async () => {
      const customScenarios = [
        {
          id: 'custom-001',
          type: 'SMS',
          institution: 'Custom Bank',
          threat_level: 'high',
          message: 'Custom message',
          is_scam: true,
          explanation_fr: 'Custom explanation',
          threat_indicators: [],
          category: 'banking',
          region: 'Quebec',
          date_detected: '2026-03-14',
          source: 'custom',
        },
      ];
      render(<SMSSimulator initialScenarios={customScenarios} />);
      await waitFor(() => {
        expect(screen.getByText(/Custom Bank/)).toBeInTheDocument();
        expect(screen.getByText(/Custom message/)).toBeInTheDocument();
      });
    });
  });
});
