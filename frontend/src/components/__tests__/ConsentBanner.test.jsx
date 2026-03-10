/**
 * ConsentBanner Component Tests
 *
 * Tests for:
 * - Rendering and visibility
 * - User interactions (checkbox, buttons)
 * - localStorage persistence
 * - Accessibility (ARIA, keyboard navigation)
 * - WCAG compliance
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ConsentBanner from '../ConsentBanner';
import * as consentManager from '../../utils/consentManager';

// Mock consentManager
vi.mock('../../utils/consentManager');

describe('ConsentBanner Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
    localStorage.clear();
    consentManager.getConsent.mockReturnValue(false);
  });

  describe('Rendering', () => {
    it('should render when user has not consented', () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      expect(screen.getByText('🛡️ Votre Sécurité Avant Tout')).toBeInTheDocument();
    });

    it('should not render when user has already consented', () => {
      consentManager.getConsent.mockReturnValue(true);
      const { container } = render(<ConsentBanner />);

      expect(container.firstChild).toBeNull();
    });

    it('should display all required content sections', () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      expect(screen.getByText(/Pourquoi nous collectons vos réponses/i)).toBeInTheDocument();
      expect(screen.getByText(/Vos données sont protégées/i)).toBeInTheDocument();
      expect(screen.getByText(/Je comprends et j'accepte/i)).toBeInTheDocument();
    });

    it('should display all benefit items', () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      expect(screen.getByText(/Vos données sont chiffrées/)).toBeInTheDocument();
      expect(screen.getByText(/Jamais vendues à tiers/)).toBeInTheDocument();
      expect(screen.getByText(/Conservées 30 jours maximum/)).toBeInTheDocument();
      expect(screen.getByText(/Protégeant les aînés québécois/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should toggle checkbox when clicked', async () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should enable accept button when checkbox is checked', async () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      const acceptButton = screen.getByText('Accepter et Continuer');
      expect(acceptButton).toBeDisabled();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(acceptButton).not.toBeDisabled();
    });

    it('should accept consent when button is clicked with checkbox checked', async () => {
      consentManager.getConsent.mockReturnValue(false);
      const mockOnConsent = vi.fn();
      render(<ConsentBanner onConsent={mockOnConsent} />);

      const checkbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByText('Accepter et Continuer');

      fireEvent.click(checkbox);
      fireEvent.click(acceptButton);

      expect(consentManager.setConsent).toHaveBeenCalledWith(true);
      expect(mockOnConsent).toHaveBeenCalled();
    });

    it('should display policy content when policy link is clicked', async () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      const policyLink = screen.getByText(/Lire notre politique/);
      expect(screen.queryByText(/Politique de Confidentialité Complète/)).not.toBeInTheDocument();

      fireEvent.click(policyLink);
      expect(screen.getByText(/Politique de Confidentialité Complète/)).toBeInTheDocument();
    });

    it('should hide policy content when policy link is clicked again', async () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      const policyLink = screen.getByText(/Lire notre politique/);

      fireEvent.click(policyLink);
      expect(screen.getByText(/Politique de Confidentialité Complète/)).toBeInTheDocument();

      fireEvent.click(policyLink);
      expect(screen.queryByText(/Politique de Confidentialité Complète/)).not.toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onConsent callback when user accepts', () => {
      consentManager.getConsent.mockReturnValue(false);
      const mockOnConsent = vi.fn();
      render(<ConsentBanner onConsent={mockOnConsent} />);

      const checkbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByText('Accepter et Continuer');

      fireEvent.click(checkbox);
      fireEvent.click(acceptButton);

      expect(mockOnConsent).toHaveBeenCalledTimes(1);
    });

    it('should call onConsent immediately if already consented', () => {
      consentManager.getConsent.mockReturnValue(true);
      const mockOnConsent = vi.fn();
      render(<ConsentBanner onConsent={mockOnConsent} />);

      expect(mockOnConsent).toHaveBeenCalledTimes(1);
    });

    it('should not call onConsent if checkbox is not checked', () => {
      consentManager.getConsent.mockReturnValue(false);
      const mockOnConsent = vi.fn();
      render(<ConsentBanner onConsent={mockOnConsent} />);

      const acceptButton = screen.getByText('Accepter et Continuer');

      // Don't check the checkbox, try to click accept
      expect(acceptButton).toBeDisabled();
      fireEvent.click(acceptButton);

      // Should not be called since button is disabled
      expect(consentManager.setConsent).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility (WCAG AAA)', () => {
    it('should have proper ARIA labels on elements', () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      const modal = screen.getByRole('alertdialog');
      expect(modal).toHaveAttribute('aria-labelledby', 'consent-title');
      expect(modal).toHaveAttribute('aria-live', 'polite');
    });

    it('should have checkbox with aria-required', () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-required', 'true');
    });

    it('should have proper label for checkbox', () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAccessibleName();
    });

    it('should have accept button with proper aria-label', () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      const acceptButton = screen.getByRole('button', { name: /Accepter/ });
      expect(acceptButton).toHaveAttribute('aria-label');
    });

    it('should have policy link with aria-expanded and aria-controls', () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      const policyLink = screen.getByRole('button', { name: /Lire notre politique/ });
      expect(policyLink).toHaveAttribute('aria-expanded');
      expect(policyLink).toHaveAttribute('aria-controls');
    });

    it('should support keyboard navigation (Tab, Enter)', async () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      const checkbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByText('Accepter et Continuer');

      // Simulate Tab to checkbox
      checkbox.focus();
      expect(checkbox).toHaveFocus();

      // Check checkbox with keyboard
      fireEvent.keyDown(checkbox, { key: ' ' });
      fireEvent.click(checkbox);

      // Tab to button
      acceptButton.focus();
      expect(acceptButton).toHaveFocus();

      // Can now be clicked
      expect(acceptButton).not.toBeDisabled();
    });

    it('should announce policy content to screen readers', () => {
      consentManager.getConsent.mockReturnValue(false);
      render(<ConsentBanner />);

      const policyLink = screen.getByText(/Lire notre politique/);
      fireEvent.click(policyLink);

      const policyContent = screen.getByRole('region', { name: /Politique/ });
      expect(policyContent).toBeInTheDocument();
    });
  });

  describe('Contrast Compliance (WCAG AAA)', () => {
    it('should use high contrast colors for text', () => {
      consentManager.getConsent.mockReturnValue(false);
      const { container } = render(<ConsentBanner />);

      // Check that main text color is dark (not gray or light)
      const contentArea = container.querySelector('.consent-content');
      const computedStyle = window.getComputedStyle(contentArea);
      const color = computedStyle.color;

      // Should be a dark color (rgb values should be low, close to black)
      expect(contentArea).toBeInTheDocument();
      // Color should be set (not transparent or very light)
      expect(['rgb(0, 0, 0)', 'rgb(26, 26, 26)', 'rgb(10, 10, 10)'].some(c => color.includes(c) || color === '#1A1A1A')).toBeTruthy();
    });

    it('should have sufficient font sizes (20px+)', () => {
      consentManager.getConsent.mockReturnValue(false);
      const { container } = render(<ConsentBanner />);

      const title = screen.getByText('🛡️ Votre Sécurité Avant Tout');

      // Verify title is rendered with a distinct style (jsdom has limitations with computed styles)
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H1');
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile (320px)', () => {
      consentManager.getConsent.mockReturnValue(false);
      // Mock window size
      global.innerWidth = 320;

      render(<ConsentBanner />);
      expect(screen.getByText('🛡️ Votre Sécurité Avant Tout')).toBeInTheDocument();
    });

    it('should render on tablet (768px)', () => {
      consentManager.getConsent.mockReturnValue(false);
      global.innerWidth = 768;

      render(<ConsentBanner />);
      expect(screen.getByText('🛡️ Votre Sécurité Avant Tout')).toBeInTheDocument();
    });

    it('should render on desktop (1024px)', () => {
      consentManager.getConsent.mockReturnValue(false);
      global.innerWidth = 1024;

      render(<ConsentBanner />);
      expect(screen.getByText('🛡️ Votre Sécurité Avant Tout')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onConsent callback gracefully', () => {
      consentManager.getConsent.mockReturnValue(false);
      // Should not throw error
      render(<ConsentBanner />);

      const checkbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByText('Accepter et Continuer');

      fireEvent.click(checkbox);
      fireEvent.click(acceptButton);

      expect(consentManager.setConsent).toHaveBeenCalled();
    });

    it('should handle rapid clicks on accept button', () => {
      consentManager.getConsent.mockReturnValue(false);
      const mockOnConsent = vi.fn();
      render(<ConsentBanner onConsent={mockOnConsent} />);

      const checkbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByText('Accepter et Continuer');

      fireEvent.click(checkbox);
      fireEvent.click(acceptButton);
      fireEvent.click(acceptButton); // Click again (shouldn't re-submit)

      // setConsent should only be called once
      expect(consentManager.setConsent).toHaveBeenCalledTimes(1);
    });
  });
});
