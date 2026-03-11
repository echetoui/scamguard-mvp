/**
 * PhoneAuthScreen Component Tests - Expanded Coverage
 * Tests for phone formatting, OTP flow, and edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhoneAuthScreen from '../PhoneAuthScreen';
import * as authStorage from '../../utils/authStorage';

vi.mock('../../utils/authStorage', () => ({
  setAuth: vi.fn(),
  setUserId: vi.fn(),
}));

delete window.location;
window.location = { href: '' };

describe('PhoneAuthScreen Component - Expanded Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    window.location.href = '';
  });

  describe('Phone Formatting', () => {
    it('should format phone with leading +1', () => {
      const { container } = render(<PhoneAuthScreen />);
      const input = container.querySelector('input[type="tel"]');

      fireEvent.change(input, { target: { value: '5141234567' } });
      expect(input.value).toMatch(/\+1/);
    });

    it('should add area code parentheses', () => {
      const { container } = render(<PhoneAuthScreen />);
      const input = container.querySelector('input[type="tel"]');

      fireEvent.change(input, { target: { value: '5141234567' } });
      expect(input.value).toMatch(/\(\d{3}\)/);
    });

    it('should add hyphen in phone number', () => {
      const { container } = render(<PhoneAuthScreen />);
      const input = container.querySelector('input[type="tel"]');

      fireEvent.change(input, { target: { value: '5141234567' } });
      expect(input.value).toMatch(/-\d{4}/);
    });

    it('should handle leading 1 removal', () => {
      const { container } = render(<PhoneAuthScreen />);
      const input = container.querySelector('input[type="tel"]');

      fireEvent.change(input, { target: { value: '15141234567' } });
      // Should remove leading 1 and format correctly
      expect(input.value).toMatch(/\+1/);
    });

    it('should strip non-digit characters', () => {
      const { container } = render(<PhoneAuthScreen />);
      const input = container.querySelector('input[type="tel"]');

      fireEvent.change(input, { target: { value: '514-123-4567' } });
      // Non-digits should be removed during formatting
      expect(input.value).not.toMatch(/[^\d\s\(\)\+\-]/);
    });

    it('should handle partial phone input', () => {
      const { container } = render(<PhoneAuthScreen />);
      const input = container.querySelector('input[type="tel"]');

      fireEvent.change(input, { target: { value: '514' } });
      expect(input.value).toBe('+1 514');
    });

    it('should format 6 digit input', () => {
      const { container } = render(<PhoneAuthScreen />);
      const input = container.querySelector('input[type="tel"]');

      fireEvent.change(input, { target: { value: '514123' } });
      expect(input.value).toMatch(/\+1 \(\d{3}\) \d{3}/);
    });

    it('should format full 10 digit input', () => {
      const { container } = render(<PhoneAuthScreen />);
      const input = container.querySelector('input[type="tel"]');

      fireEvent.change(input, { target: { value: '5141234567' } });
      expect(input.value).toBe('+1 (514) 123-4567');
    });
  });

  describe('OTP Input Handling', () => {
    it('should have 6 OTP input fields', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const otpInputs = container.querySelectorAll('.otp-input');
        expect(otpInputs.length).toBe(6);
      });
    });

    it('should limit OTP input to 1 digit', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const firstOtpInput = container.querySelector('.otp-input');
        expect(firstOtpInput.maxLength).toBe(1);
      });
    });

    it('should accept only numeric input for OTP', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const firstOtpInput = container.querySelector('.otp-input');
        fireEvent.change(firstOtpInput, { target: { value: 'a' } });
        expect(firstOtpInput.value).toBe('');
      });
    });

    it('should auto-focus next field on digit entry', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const otpInputs = container.querySelectorAll('.otp-input');
        fireEvent.change(otpInputs[0], { target: { value: '1' } });
        // Next input should be focused (would be otpInputs[1])
        expect(document.activeElement).toBe(otpInputs[1]);
      });
    });

    it('should handle paste of multiple digits', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const otpInputs = container.querySelectorAll('.otp-input');
        fireEvent.change(otpInputs[0], { target: { value: '123456' } });
        // Should distribute digits across inputs
        expect(otpInputs[0].value).toBe('1');
        expect(otpInputs[5].value).toBe('6');
      });
    });
  });

  describe('OTP Verification', () => {
    it('should show error on invalid OTP code', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: 'Code invalide' } })
        });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const otpInputs = container.querySelectorAll('.otp-input');
        for (let i = 0; i < 6; i++) {
          fireEvent.change(otpInputs[i], { target: { value: '0' } });
        }
      });

      const verifyBtn = Array.from(container.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Vérifier'));
      fireEvent.click(verifyBtn);

      await waitFor(() => {
        expect(screen.getByText('Code invalide')).toBeTruthy();
      });
    });

    it('should require all 6 digits before submitting', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const verifyBtn = Array.from(container.querySelectorAll('button'))
          .find(btn => btn.textContent.includes('Vérifier'));
        expect(verifyBtn.disabled).toBe(true);
      });
    });

    it('should enable submit button with 6 digits', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const otpInputs = container.querySelectorAll('.otp-input');
        for (let i = 0; i < 6; i++) {
          fireEvent.change(otpInputs[i], { target: { value: String(i) } });
        }

        const verifyBtn = Array.from(container.querySelectorAll('button'))
          .find(btn => btn.textContent.includes('Vérifier'));
        expect(verifyBtn.disabled).toBe(false);
      });
    });
  });

  describe('Resend Functionality', () => {
    it('should show resend button on OTP step', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Renvoyer/)).toBeTruthy();
      });
    });

    it('should disable resend button with timer', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const resendBtn = Array.from(screen.getAllByRole('button'))
          .find(btn => btn.textContent.includes('Renvoyer'));
        expect(resendBtn.disabled).toBe(true);
      });
    });

    it('should show countdown timer', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const text = screen.getByText(/Renvoyer dans \d+s/);
        expect(text).toBeTruthy();
      });
    });
  });

  describe('Back Button', () => {
    it('should show back button on OTP step', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/← Retour/)).toBeTruthy();
      });
    });

    it('should go back to phone step', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const backBtn = Array.from(screen.getAllByRole('button'))
          .find(btn => btn.textContent.includes('Retour'));
        fireEvent.click(backBtn);

        expect(screen.getByText('Envoyer le code SMS')).toBeTruthy();
      });
    });

    it('should clear OTP on back button', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const otpInputs = container.querySelectorAll('.otp-input');
        for (let i = 0; i < 3; i++) {
          fireEvent.change(otpInputs[i], { target: { value: '1' } });
        }

        const backBtn = Array.from(screen.getAllByRole('button'))
          .find(btn => btn.textContent.includes('Retour'));
        fireEvent.click(backBtn);

        expect(screen.getByText('Envoyer le code SMS')).toBeTruthy();
      });
    });
  });

  describe('Success Step', () => {
    it('should have success step form element', () => {
      const { container } = render(<PhoneAuthScreen />);
      expect(container.querySelector('.phone-auth-screen')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on phone input', () => {
      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      expect(phoneInput.getAttribute('aria-label')).toBe('Numéro de téléphone');
    });

    it('should have aria-describedby on phone input', () => {
      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      expect(phoneInput.getAttribute('aria-describedby')).toBe('phone-hint');
    });

    it('should have aria-busy on submit button when loading', async () => {
      global.fetch = vi.fn(() => new Promise(() => {}));

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitBtn.getAttribute('aria-busy')).toBe('true');
      });
    });

    it('should have aria-label on OTP inputs', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const otpInputs = container.querySelectorAll('.otp-input');
        expect(otpInputs[0].getAttribute('aria-label')).toBe('Chiffre 1');
        expect(otpInputs[5].getAttribute('aria-label')).toBe('Chiffre 6');
      });
    });

    it('should have role="main" on main element', () => {
      const { container } = render(<PhoneAuthScreen />);
      const main = container.querySelector('[role="main"]');
      expect(main).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should show network error on fetch failure', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network failed'));

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/réseau/)).toBeTruthy();
      });
    });

    it('should show invalid phone error', () => {
      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');

      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.click(screen.getByText('Envoyer le code SMS'));

      expect(screen.getByText('Numéro de téléphone invalide')).toBeTruthy();
    });

    it('should clear error on form submit with valid input', () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { phone_masked: '+1 (514) 123-4567' } })
      });

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');

      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.click(screen.getByText('Envoyer le code SMS'));

      expect(screen.getByText('Numéro de téléphone invalide')).toBeTruthy();

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(screen.getByText('Envoyer le code SMS'));

      // Error should be cleared on new submission
      expect(screen.queryByText('Numéro de téléphone invalide')).toBeFalsy();
    });
  });

  describe('Loading States', () => {
    it('should disable input while loading', async () => {
      global.fetch = vi.fn(() => new Promise(() => {}));

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(phoneInput.disabled).toBe(true);
      });
    });

    it('should show loading text on button', async () => {
      global.fetch = vi.fn(() => new Promise(() => {}));

      const { container } = render(<PhoneAuthScreen />);
      const phoneInput = container.querySelector('input[type="tel"]');
      const submitBtn = screen.getByText('Envoyer le code SMS');

      fireEvent.change(phoneInput, { target: { value: '5141234567' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('⏳ Envoi...')).toBeTruthy();
      });
    });
  });
});
