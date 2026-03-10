/**
 * AdvisorVerifier Component Tests
 * Phase 6 - Coverage Expansion Continuation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdvisorVerifier from '../AdvisorVerifier';

vi.mock('../../constants/errorMessages', () => ({
  ERROR_MESSAGES: {
    ADVISOR_CHECK_FAILED: 'Impossible de vérifier le conseiller'
  }
}));

describe('AdvisorVerifier Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Input Step - Rendering', () => {
    it('should display advisor verification form', () => {
      render(<AdvisorVerifier />);
      expect(screen.getByText(/Vérifier si un conseiller/)).toBeTruthy();
    });

    it('should have advisor name input', () => {
      const { container } = render(<AdvisorVerifier />);
      expect(container.querySelector('#advisor-name-input')).toBeTruthy();
    });

    it('should have firm name input (optional)', () => {
      const { container } = render(<AdvisorVerifier />);
      expect(container.querySelector('#firm-name-input')).toBeTruthy();
    });

    it('should display form description', () => {
      render(<AdvisorVerifier />);
      expect(screen.getByText(/Découvrez si un conseiller financier/)).toBeTruthy();
    });

    it('should have submit button', () => {
      render(<AdvisorVerifier />);
      expect(screen.getByText(/Vérifier le conseiller/)).toBeTruthy();
    });
  });

  describe('Form Input - Advisor Name', () => {
    it('should update advisor name on change', () => {
      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');

      fireEvent.change(input, { target: { value: 'Jean Dupont' } });

      expect(input.value).toBe('Jean Dupont');
    });

    it('should have text type input for advisor name', () => {
      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');

      expect(input.type).toBe('text');
    });

    it('should have advisor name placeholder', () => {
      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');

      expect(input.placeholder).toContain('Dupont');
    });

    it('should mark advisor name as required', () => {
      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');

      expect(input.required).toBe(true);
    });
  });

  describe('Form Input - Firm Name', () => {
    it('should update firm name on change', () => {
      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#firm-name-input');

      fireEvent.change(input, { target: { value: 'Banque Royale' } });

      expect(input.value).toBe('Banque Royale');
    });

    it('should have firm name input not required', () => {
      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#firm-name-input');

      expect(input.required).toBeFalsy();
    });

    it('should have firm name placeholder', () => {
      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#firm-name-input');

      expect(input.placeholder).toContain('Banque');
    });
  });

  describe('Form Submission - Low Risk', () => {
    it('should submit form with advisor name', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            risk_level: 'low',
            summary: 'Advisor is authorized'
          }
        })
      });

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'John Smith' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should show low risk status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            risk_level: 'low',
            summary: 'Authorized advisor'
          }
        })
      });

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'John Smith' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Résultat de la vérification')).toBeTruthy();
      });
    });

    it('should show success icon for low risk', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            risk_level: 'low',
            summary: 'Safe'
          }
        })
      });

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'John Smith' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('✅')).toBeTruthy();
      });
    });
  });

  describe('Form Submission - High Risk', () => {
    it('should show high risk status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            risk_level: 'high',
            summary: 'Not authorized',
            red_flags: ['No registration found']
          }
        })
      });

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'Unknown Advisor' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('🚨')).toBeTruthy();
      });
    });

    it('should display red flags when present', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            risk_level: 'high',
            summary: 'Risk detected',
            red_flags: ['No registration', 'Unverified']
          }
        })
      });

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'Risky Advisor' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Points d'attention/)).toBeTruthy();
      });
    });

    it('should display official registries', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            risk_level: 'medium',
            summary: 'Verify',
            official_registries: [
              { name: 'AMF', url: 'https://amf.org' },
              { name: 'ACVM', url: 'https://acvm.org' }
            ]
          }
        })
      });

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'Some Advisor' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Registres officiels/)).toBeTruthy();
      });
    });

    it('should display disclaimer when present', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            risk_level: 'low',
            summary: 'OK',
            disclaimer: 'Always verify independently'
          }
        })
      });

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'John Smith' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Always verify/)).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'Test Advisor' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Impossible de vérifier/)).toBeTruthy();
      });
    });

    it('should handle network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Impossible de vérifier/)).toBeTruthy();
      });
    });

    it('should show loading state during check', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'Test Advisor' } });
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
            risk_level: 'low',
            summary: 'OK'
          }
        })
      });

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'John Smith' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Vérifier un autre conseiller/)).toBeTruthy();
      });
    });

    it('should clear form on reset', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            risk_level: 'low',
            summary: 'OK'
          }
        })
      });

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      let button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'John Smith' } });
      fireEvent.click(button);

      await waitFor(() => {
        const resetButton = screen.getByText(/Vérifier un autre conseiller/);
        fireEvent.click(resetButton);
      });

      await waitFor(() => {
        const resetInput = container.querySelector('#advisor-name-input');
        expect(resetInput.value).toBe('');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have required attribute on advisor name', () => {
      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');

      expect(input.required).toBe(true);
    });

    it('should have aria-required on advisor name', () => {
      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');

      expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('should have aria-labels on inputs', () => {
      const { container } = render(<AdvisorVerifier />);
      const nameInput = container.querySelector('#advisor-name-input');
      const firmInput = container.querySelector('#firm-name-input');

      expect(nameInput.getAttribute('aria-label')).toBeTruthy();
      expect(firmInput.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have role="alert" on error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(button);

      await waitFor(() => {
        const errorDiv = container.querySelector('[role="alert"]');
        expect(errorDiv).toBeTruthy();
      });
    });

    it('should have aria-busy on button during loading', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<AdvisorVerifier />);
      const input = container.querySelector('#advisor-name-input');
      const button = screen.getByText(/Vérifier le conseiller/);

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(button);

      expect(button.getAttribute('aria-busy')).toBe('true');
    });

    it('should disable submit button when advisor name empty', () => {
      const { container } = render(<AdvisorVerifier />);
      const button = screen.getByText(/Vérifier le conseiller/);

      expect(button.disabled).toBe(true);
    });
  });
});
