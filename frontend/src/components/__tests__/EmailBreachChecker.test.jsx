/**
 * EmailBreachChecker Component Tests
 * Phase 6 - Coverage Push to 40%+
 *
 * Tests for email breach checking functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailBreachChecker from '../EmailBreachChecker';

// Mock ERROR_MESSAGES
vi.mock('../../constants/errorMessages', () => ({
  ERROR_MESSAGES: {
    EMAIL_CHECK_FAILED: 'Impossible de vérifier le courriel'
  }
}));

describe('EmailBreachChecker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Input Step - Rendering', () => {
    it('should display email input form', () => {
      render(<EmailBreachChecker />);
      expect(screen.getByText(/Vérifier si votre courriel/)).toBeTruthy();
    });

    it('should have email input field', () => {
      const { container } = render(<EmailBreachChecker />);
      expect(container.querySelector('#email-input')).toBeTruthy();
    });

    it('should display form description', () => {
      render(<EmailBreachChecker />);
      expect(screen.getByText(/Découvrez si votre adresse courriel/)).toBeTruthy();
    });

    it('should have submit button', () => {
      render(<EmailBreachChecker />);
      expect(screen.getByText(/Vérifier mon courriel/)).toBeTruthy();
    });
  });

  describe('Form Input', () => {
    it('should update input value on change', () => {
      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');

      fireEvent.change(input, { target: { value: 'test@example.com' } });

      expect(input.value).toBe('test@example.com');
    });

    it('should have email type input', () => {
      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');

      expect(input.type).toBe('email');
    });

    it('should have placeholder text', () => {
      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');

      expect(input.placeholder).toContain('@');
    });

    it('should disable submit button when input empty', () => {
      const { container } = render(<EmailBreachChecker />);
      const button = screen.getByText(/Vérifier mon courriel/);

      expect(button.disabled).toBe(true);
    });

    it('should enable submit button when input filled', () => {
      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'test@example.com' } });

      expect(button.disabled).toBe(false);
    });
  });

  describe('Form Submission - Safe Result', () => {
    it('should submit form with email', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            breached: false,
            message: 'Votre courriel est sûr'
          }
        })
      });

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'safe@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should show safe status when not breached', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            breached: false,
            message: 'Votre courriel est sûr'
          }
        })
      });

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'safe@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Résultat de la vérification')).toBeTruthy();
      });
    });

    it('should show success icon for safe email', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            breached: false,
            message: 'Votre courriel est sûr'
          }
        })
      });

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'safe@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('✅')).toBeTruthy();
      });
    });
  });

  describe('Form Submission - Breached Result', () => {
    it('should show breached status when compromised', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            breached: true,
            message: 'Votre courriel a été trouvé dans une fuite',
            sources: ['Data breach 1', 'Data breach 2']
          }
        })
      });

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'breached@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeTruthy();
      });
    });

    it('should display breach sources when compromised', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            breached: true,
            message: 'Compromised',
            sources: ['Database breach', 'Password leak']
          }
        })
      });

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'breached@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Fuites de données/)).toBeTruthy();
      });
    });

    it('should display recommended actions', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            breached: true,
            message: 'Compromised',
            sources: ['Data breach'],
            actions: ['Change password', 'Enable 2FA']
          }
        })
      });

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'breached@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Actions recommandées/)).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Impossible de vérifier/)).toBeTruthy();
      });
    });

    it('should handle network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Impossible de vérifier/)).toBeTruthy();
      });
    });

    it('should show loading state during check', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(button);

      expect(screen.getByText(/Vérification/)).toBeTruthy();
    });
  });

  describe('Reset Functionality', () => {
    it('should show reset button in result step', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            breached: false,
            message: 'Safe'
          }
        })
      });

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Vérifier un autre courriel/)).toBeTruthy();
      });
    });

    it('should return to input form on reset', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            breached: false,
            message: 'Safe'
          }
        })
      });

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      let button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        const resetButton = screen.getByText(/Vérifier un autre courriel/);
        fireEvent.click(resetButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Vérifier mon courriel/)).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have required attribute on input', () => {
      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');

      expect(input.required).toBe(true);
    });

    it('should have aria-required on input', () => {
      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');

      expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('should have aria-label on input', () => {
      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');

      expect(input.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have role="alert" on error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        const errorDiv = container.querySelector('[role="alert"]');
        expect(errorDiv).toBeTruthy();
      });
    });

    it('should have aria-busy on button during loading', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<EmailBreachChecker />);
      const input = container.querySelector('#email-input');
      const button = screen.getByText(/Vérifier mon courriel/);

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(button);

      expect(button.getAttribute('aria-busy')).toBe('true');
    });
  });
});
