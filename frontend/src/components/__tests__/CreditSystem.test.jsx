/**
 * CreditSystem Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Credit balance display
 * - Subscription plan cards
 * - Ways to earn credits
 * - Transaction history
 * - Empty state
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import CreditSystem from '../CreditSystem';

describe('CreditSystem Component', () => {
  const mockStats = {
    totalEarned: 500,
    totalSpent: 200
  };

  const mockTransactions = [
    {
      id: '1',
      type: 'earn',
      description: 'Message analysé',
      amount: 10,
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      type: 'spend',
      description: 'Rapport détaillé généré',
      amount: 50,
      timestamp: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render credit system container', () => {
      const { container } = render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(container.querySelector('.credit-system')).toBeTruthy();
    });

    it('should render hero section', () => {
      const { container } = render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(container.querySelector('.credit-hero')).toBeTruthy();
    });

    it('should display credit title', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText(/Mes Crédits/)).toBeTruthy();
    });
  });

  describe('Balance Display', () => {
    it('should display current balance', () => {
      const { container } = render(
        <CreditSystem balance={250} transactions={[]} stats={mockStats} />
      );

      const balanceDisplay = container.querySelector('.credit-amount');
      expect(balanceDisplay.textContent).toContain('250');
    });

    it('should display balance label', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText('crédits disponibles')).toBeTruthy();
    });

    it('should display zero balance', () => {
      const { container } = render(
        <CreditSystem balance={0} transactions={[]} stats={mockStats} />
      );

      const balanceDisplay = container.querySelector('.credit-amount');
      expect(balanceDisplay.textContent).toContain('0');
    });

    it('should default to 0 when balance not provided', () => {
      render(
        <CreditSystem transactions={[]} stats={mockStats} />
      );

      const balanceDisplay = screen.getByText('crédits disponibles');
      expect(balanceDisplay).toBeTruthy();
    });
  });

  describe('Credit Summary', () => {
    it('should display total earned', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText(/Total gagné: 500/)).toBeTruthy();
    });

    it('should display total spent', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText(/Dépensé: 200/)).toBeTruthy();
    });

    it('should default summary values to 0', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={{}} />
      );

      expect(screen.getByText(/Total gagné: 0/)).toBeTruthy();
      expect(screen.getByText(/Dépensé: 0/)).toBeTruthy();
    });
  });

  describe('Subscription Plans', () => {
    it('should display plans section title', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText(/Plans d'abonnement/)).toBeTruthy();
    });

    it('should display all three plans', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText('Gratuit')).toBeTruthy();
      expect(screen.getByText('Starter')).toBeTruthy();
      expect(screen.getByText('Premium')).toBeTruthy();
    });

    it('should display plan icons', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText('🆓')).toBeTruthy(); // Free
      expect(screen.getByText('⭐')).toBeTruthy(); // Starter
      expect(screen.getByText('🏆')).toBeTruthy(); // Premium
    });

    it('should display plan prices', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText('0 €')).toBeTruthy();
      expect(screen.getByText('9,99 €')).toBeTruthy();
      expect(screen.getByText('24,99 €')).toBeTruthy();
    });

    it('should display monthly credit amounts', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText(/50 crédits\/mois/)).toBeTruthy();
      expect(screen.getByText(/200 crédits\/mois/)).toBeTruthy();
      expect(screen.getByText('Illimité')).toBeTruthy();
    });

    it('should mark free plan as current', () => {
      const { container } = render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      const planCards = container.querySelectorAll('.plan-card');
      expect(planCards[0].classList.contains('current')).toBe(true);
    });

    it('should mark starter plan as popular', () => {
      const { container } = render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      const planCards = container.querySelectorAll('.plan-card');
      expect(planCards[1].classList.contains('popular')).toBe(true);
    });

    it('should display plan features', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText('3 analyses/jour')).toBeTruthy();
      expect(screen.getByText('Quiz illimitée')).toBeTruthy();
      expect(screen.getByText('Analyses illimitées')).toBeTruthy();
    });

    it('should display plan buttons', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3); // One button per plan
    });

    it('should disable free plan button', () => {
      const { container } = render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons[0].disabled).toBe(true);
    });

    it('should show "Plan actuel" for free plan', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText('Plan actuel')).toBeTruthy();
    });

    it('should show "Choisir" for other plans', () => {
      const { container } = render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      const buttons = container.querySelectorAll('button');
      const chooseButtons = Array.from(buttons).filter(btn => btn.textContent === 'Choisir');
      expect(chooseButtons.length).toBe(2); // Starter and Premium
    });
  });

  describe('Ways to Earn', () => {
    it('should display earn section title', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText(/Comment gagner des crédits/)).toBeTruthy();
    });

    it('should display all four earning methods', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText('Analyser un message')).toBeTruthy();
      expect(screen.getByText('Réussir un quiz')).toBeTruthy();
      expect(screen.getByText('Connexion quotidienne')).toBeTruthy();
      expect(screen.getByText('Parrainer un ami')).toBeTruthy();
    });

    it('should display earn method icons', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText('🔍')).toBeTruthy();
      expect(screen.getByText('🎓')).toBeTruthy();
      expect(screen.getByText('📅')).toBeTruthy();
      expect(screen.getByText('👥')).toBeTruthy();
    });

    it('should display credit amounts for each method', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText('+10 cr')).toBeTruthy();
      expect(screen.getByText('+20 cr')).toBeTruthy();
      expect(screen.getByText('+5 cr')).toBeTruthy();
      expect(screen.getByText('+100 cr')).toBeTruthy();
    });
  });

  describe('Transaction History', () => {
    it('should display transaction history section when transactions exist', () => {
      render(
        <CreditSystem balance={100} transactions={mockTransactions} stats={mockStats} />
      );

      expect(screen.getByText(/Historique transactions/)).toBeTruthy();
    });

    it('should display transaction descriptions', () => {
      render(
        <CreditSystem balance={100} transactions={mockTransactions} stats={mockStats} />
      );

      expect(screen.getByText('Message analysé')).toBeTruthy();
      expect(screen.getByText('Rapport détaillé généré')).toBeTruthy();
    });

    it('should display transaction amounts with correct sign', () => {
      const { container } = render(
        <CreditSystem balance={100} transactions={mockTransactions} stats={mockStats} />
      );

      const amounts = container.querySelectorAll('.transaction-amount');
      expect(amounts[0].textContent).toBe('+10 cr');
      expect(amounts[1].textContent).toBe('−50 cr');
    });

    it('should show only first 5 transactions', () => {
      const manyTransactions = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        type: 'earn',
        description: `Transaction ${i}`,
        amount: 10,
        timestamp: new Date().toISOString()
      }));

      const { container } = render(
        <CreditSystem balance={100} transactions={manyTransactions} stats={mockStats} />
      );

      const items = container.querySelectorAll('.transaction-item');
      expect(items.length).toBe(5);
    });

    it('should display earn badge for earn transactions', () => {
      render(
        <CreditSystem balance={100} transactions={mockTransactions} stats={mockStats} />
      );

      const badges = screen.getAllByText('+');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should display spend badge for spend transactions', () => {
      render(
        <CreditSystem balance={100} transactions={mockTransactions} stats={mockStats} />
      );

      const badges = screen.getAllByText('−');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should call formatTimeAgo when provided', () => {
      const mockFormatTimeAgo = vi.fn(() => '2 hours ago');

      render(
        <CreditSystem
          balance={100}
          transactions={mockTransactions}
          stats={mockStats}
          formatTimeAgo={mockFormatTimeAgo}
        />
      );

      expect(mockFormatTimeAgo).toHaveBeenCalled();
    });

    it('should format date when formatTimeAgo not provided', () => {
      render(
        <CreditSystem balance={100} transactions={mockTransactions} stats={mockStats} />
      );

      const timeElements = screen.getAllByText(/\//);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no transactions', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText(/Aucune transaction/)).toBeTruthy();
    });

    it('should display empty state hint', () => {
      render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      expect(screen.getByText(/Complétez une analyse/)).toBeTruthy();
    });

    it('should not show history section when no transactions', () => {
      const { container } = render(
        <CreditSystem balance={100} transactions={[]} stats={mockStats} />
      );

      const historySection = container.querySelector('.history-section');
      expect(historySection).toBeFalsy();
    });

    it('should hide empty state when transactions exist', () => {
      const { container } = render(
        <CreditSystem balance={100} transactions={mockTransactions} stats={mockStats} />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeFalsy();
    });
  });

  describe('Default Props', () => {
    it('should render with minimal props', () => {
      const { container } = render(<CreditSystem />);

      expect(container.querySelector('.credit-system')).toBeTruthy();
    });

    it('should handle undefined transactions array', () => {
      const { container } = render(
        <CreditSystem balance={100} stats={mockStats} />
      );

      expect(container.querySelector('.empty-state')).toBeTruthy();
    });

    it('should handle undefined stats object', () => {
      render(
        <CreditSystem balance={100} transactions={[]} />
      );

      expect(screen.getByText(/Total gagné: 0/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have heading structure', () => {
      const { container } = render(
        <CreditSystem balance={100} transactions={mockTransactions} stats={mockStats} />
      );

      const headings = container.querySelectorAll('h2, h3, h4');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have descriptive text content', () => {
      render(
        <CreditSystem balance={100} transactions={mockTransactions} stats={mockStats} />
      );

      expect(screen.getByText(/Mes Crédits/)).toBeTruthy();
      expect(screen.getByText(/crédits disponibles/)).toBeTruthy();
    });

    it('should have semantic button structure', () => {
      const { container } = render(
        <CreditSystem balance={100} transactions={mockTransactions} stats={mockStats} />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(3); // Plan buttons
    });
  });

  describe('Edge Cases', () => {
    it('should handle large balance number', () => {
      const { container } = render(
        <CreditSystem balance={999999} transactions={[]} stats={mockStats} />
      );

      const balanceDisplay = container.querySelector('.credit-amount');
      expect(balanceDisplay.textContent).toContain('999999');
    });

    it('should handle large transaction amounts', () => {
      const largeTransaction = {
        id: '1',
        type: 'earn',
        description: 'Large bonus',
        amount: 50000,
        timestamp: new Date().toISOString()
      };

      render(
        <CreditSystem
          balance={100}
          transactions={[largeTransaction]}
          stats={mockStats}
        />
      );

      expect(screen.getByText('+50000 cr')).toBeTruthy();
    });

    it('should display all sections correctly', () => {
      const { container } = render(
        <CreditSystem
          balance={100}
          transactions={mockTransactions}
          stats={mockStats}
        />
      );

      expect(container.querySelector('.credit-hero')).toBeTruthy();
      expect(container.querySelector('.plans-section')).toBeTruthy();
      expect(container.querySelector('.earn-section')).toBeTruthy();
      expect(container.querySelector('.history-section')).toBeTruthy();
    });
  });
});
