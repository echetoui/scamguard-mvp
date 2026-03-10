import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PhoneOTPForm from '../PhoneOTPForm';

describe('PhoneOTPForm', () => {
  const defaultProps = {
    phone: '',
    setPhone: vi.fn(),
    otp: ['', '', '', '', '', ''],
    setOtp: vi.fn(),
    step: 'phone',
    setStep: vi.fn(),
    loading: false,
    error: '',
    resendTimer: 0,
    onRequestOtp: vi.fn(),
    onVerifyOtp: vi.fn(),
    onResendOtp: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phone Step - Rendering', () => {
    it('renders phone input field', () => {
      render(<PhoneOTPForm {...defaultProps} step="phone" />);
      const phoneInput = screen.getByRole('textbox');
      expect(phoneInput).toBeInTheDocument();
    });

    it('displays phone step title', () => {
      const { container } = render(<PhoneOTPForm {...defaultProps} step="phone" />);
      const title = container.querySelector('.form-title');
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe('Numéro de téléphone');
    });

    it('displays form subtitle', () => {
      render(<PhoneOTPForm {...defaultProps} step="phone" />);
      expect(screen.getByText(/Nous enverrons un code SMS/)).toBeInTheDocument();
    });

    it('displays phone hint text', () => {
      render(<PhoneOTPForm {...defaultProps} step="phone" />);
      expect(screen.getByText(/Format:/)).toBeInTheDocument();
    });

    it('has correct phone input placeholder', () => {
      const { container } = render(<PhoneOTPForm {...defaultProps} step="phone" />);
      const phoneInput = container.querySelector('input[type="tel"]');
      expect(phoneInput.placeholder).toContain('+1');
    });
  });

  describe('Phone Step - Form Submission', () => {
    it('calls onRequestOtp when phone form is submitted', async () => {
      const mockOnRequestOtp = vi.fn();
      const user = userEvent.setup();

      render(
        <PhoneOTPForm {...defaultProps} phone="+1 (555) 123-4567" onRequestOtp={mockOnRequestOtp} step="phone" />
      );

      const submitBtn = screen.getByRole('button', { name: /Envoyer/ });
      await user.click(submitBtn);

      expect(mockOnRequestOtp).toHaveBeenCalledWith('+1 (555) 123-4567');
    });

    it('disables submit button when phone is empty', () => {
      render(<PhoneOTPForm {...defaultProps} phone="" step="phone" />);
      const submitBtn = screen.getByRole('button', { name: /Envoyer/ });
      expect(submitBtn).toBeDisabled();
    });

    it('enables submit button when phone is filled', () => {
      render(<PhoneOTPForm {...defaultProps} phone="+1 (555) 123-4567" step="phone" />);
      const submitBtn = screen.getByRole('button', { name: /Envoyer/ });
      expect(submitBtn).not.toBeDisabled();
    });

    it('shows loading text during submission', () => {
      render(<PhoneOTPForm {...defaultProps} phone="+1 (555) 123-4567" loading={true} step="phone" />);
      expect(screen.getByText(/Envoi/)).toBeInTheDocument();
    });

    it('disables phone input during loading', () => {
      const { container } = render(<PhoneOTPForm {...defaultProps} loading={true} step="phone" />);
      const phoneInput = container.querySelector('input[type="tel"]');
      expect(phoneInput).toBeDisabled();
    });
  });

  describe('Phone Step - Input Handling', () => {
    it('calls setPhone when phone input changes', async () => {
      const mockSetPhone = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <PhoneOTPForm {...defaultProps} setPhone={mockSetPhone} step="phone" />
      );

      const phoneInput = container.querySelector('input[type="tel"]');
      await user.type(phoneInput, '+1');

      expect(mockSetPhone).toHaveBeenCalled();
    });

    it('has aria-label on phone input', () => {
      const { container } = render(<PhoneOTPForm {...defaultProps} step="phone" />);
      const phoneInput = container.querySelector('input[type="tel"]');
      expect(phoneInput).toHaveAttribute('aria-label');
    });
  });

  describe('Phone Step - Error Handling', () => {
    it('displays error message when error prop provided', () => {
      const errorMsg = 'Numéro de téléphone invalide';
      render(<PhoneOTPForm {...defaultProps} error={errorMsg} step="phone" />);
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('displays error with alert role', () => {
      render(<PhoneOTPForm {...defaultProps} error="Test error" step="phone" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not display error when error is empty', () => {
      const { queryByRole } = render(<PhoneOTPForm {...defaultProps} error="" step="phone" />);
      expect(queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('OTP Step - Rendering', () => {
    it('renders 6 OTP digit inputs when step is otp', () => {
      render(<PhoneOTPForm {...defaultProps} step="otp" />);
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThanOrEqual(6);
    });

    it('displays OTP step title', () => {
      render(<PhoneOTPForm {...defaultProps} step="otp" />);
      expect(screen.getByText('Vérifier le code SMS')).toBeInTheDocument();
    });

    it('displays OTP subtitle', () => {
      render(<PhoneOTPForm {...defaultProps} step="otp" />);
      expect(screen.getByText(/Entrez le code à 6 chiffres/)).toBeInTheDocument();
    });

    it('has numeric inputMode on OTP inputs', () => {
      const { container } = render(<PhoneOTPForm {...defaultProps} step="otp" />);
      const otpInputs = container.querySelectorAll('.otp-input');
      otpInputs.forEach(input => {
        expect(input.getAttribute('inputMode')).toBe('numeric');
      });
    });

    it('has maxLength 1 on OTP inputs', () => {
      const { container } = render(<PhoneOTPForm {...defaultProps} step="otp" />);
      const otpInputs = container.querySelectorAll('.otp-input');
      otpInputs.forEach(input => {
        expect(input.getAttribute('maxLength')).toBe('1');
      });
    });
  });

  describe('OTP Step - Form Submission', () => {
    it('calls onVerifyOtp when OTP form is submitted', async () => {
      const mockOnVerifyOtp = vi.fn();
      const user = userEvent.setup();

      render(
        <PhoneOTPForm
          {...defaultProps}
          otp={['1', '2', '3', '4', '5', '6']}
          onVerifyOtp={mockOnVerifyOtp}
          step="otp"
        />
      );

      const submitBtn = screen.getByRole('button', { name: /Vérifier/ });
      await user.click(submitBtn);

      expect(mockOnVerifyOtp).toHaveBeenCalledWith('123456');
    });

    it('disables submit button when OTP incomplete', () => {
      render(
        <PhoneOTPForm
          {...defaultProps}
          otp={['1', '2', '', '', '', '']}
          step="otp"
        />
      );

      const submitBtn = screen.getByRole('button', { name: /Vérifier/ });
      expect(submitBtn).toBeDisabled();
    });

    it('enables submit button when OTP complete', () => {
      render(
        <PhoneOTPForm
          {...defaultProps}
          otp={['1', '2', '3', '4', '5', '6']}
          step="otp"
        />
      );

      const submitBtn = screen.getByRole('button', { name: /Vérifier/ });
      expect(submitBtn).not.toBeDisabled();
    });

    it('shows loading text during verification', () => {
      render(
        <PhoneOTPForm
          {...defaultProps}
          otp={['1', '2', '3', '4', '5', '6']}
          loading={true}
          step="otp"
        />
      );

      expect(screen.getByText(/Vérification/)).toBeInTheDocument();
    });
  });

  describe('OTP Step - Resend Button', () => {
    it('enables resend button when resendTimer is 0', () => {
      render(
        <PhoneOTPForm {...defaultProps} resendTimer={0} step="otp" />
      );

      const resendBtn = screen.getByRole('button', { name: /Renvoyer le code/ });
      expect(resendBtn).not.toBeDisabled();
    });

    it('disables resend button when resendTimer > 0', () => {
      render(
        <PhoneOTPForm {...defaultProps} resendTimer={30} step="otp" />
      );

      const resendBtn = screen.getByRole('button', { name: /Renvoyer/ });
      expect(resendBtn).toBeDisabled();
    });

    it('displays countdown on resend button', () => {
      render(
        <PhoneOTPForm {...defaultProps} resendTimer={45} step="otp" />
      );

      expect(screen.getByText(/Renvoyer dans 45s/)).toBeInTheDocument();
    });

    it('calls onResendOtp when resend is clicked', async () => {
      const mockOnResendOtp = vi.fn();
      const user = userEvent.setup();

      render(
        <PhoneOTPForm {...defaultProps} onResendOtp={mockOnResendOtp} resendTimer={0} step="otp" />
      );

      const resendBtn = screen.getByRole('button', { name: /Renvoyer le code/ });
      await user.click(resendBtn);

      expect(mockOnResendOtp).toHaveBeenCalled();
    });
  });

  describe('OTP Step - Back Button', () => {
    it('has back button on OTP step', () => {
      render(<PhoneOTPForm {...defaultProps} step="otp" />);
      expect(screen.getByRole('button', { name: /Retour/ })).toBeInTheDocument();
    });

    it('calls setStep when back button is clicked', async () => {
      const mockSetStep = vi.fn();
      const user = userEvent.setup();

      render(
        <PhoneOTPForm {...defaultProps} setStep={mockSetStep} step="otp" />
      );

      const backBtn = screen.getByRole('button', { name: /Retour/ });
      await user.click(backBtn);

      expect(mockSetStep).toHaveBeenCalledWith('phone');
    });

    it('disables back button when loading', () => {
      render(
        <PhoneOTPForm {...defaultProps} loading={true} step="otp" />
      );

      const backBtn = screen.getByRole('button', { name: /Retour/ });
      expect(backBtn).toBeDisabled();
    });
  });

  describe('OTP Step - Error Handling', () => {
    it('displays error on OTP verification failure', () => {
      const errorMsg = 'Code incorrect';
      render(
        <PhoneOTPForm
          {...defaultProps}
          error={errorMsg}
          step="otp"
        />
      );

      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('displays error with alert role on OTP step', () => {
      render(
        <PhoneOTPForm {...defaultProps} error="Test error" step="otp" />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('OTP Step - Accessibility', () => {
    it('has aria-label on each OTP input', () => {
      const { container } = render(<PhoneOTPForm {...defaultProps} step="otp" />);
      const otpInputs = container.querySelectorAll('.otp-input');
      otpInputs.forEach((input, index) => {
        expect(input).toHaveAttribute('aria-label');
        expect(input.getAttribute('aria-label')).toContain(`Chiffre ${index + 1}`);
      });
    });
  });

  describe('Null Step', () => {
    it('returns null for invalid step', () => {
      const { container } = render(
        <PhoneOTPForm {...defaultProps} step="invalid" />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Form Element Roles', () => {
    it('has form role on phone step', () => {
      const { container } = render(<PhoneOTPForm {...defaultProps} step="phone" />);
      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('has form role on OTP step', () => {
      const { container } = render(<PhoneOTPForm {...defaultProps} step="otp" />);
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('phone input has aria-describedby', () => {
      const { container } = render(<PhoneOTPForm {...defaultProps} step="phone" />);
      const phoneInput = container.querySelector('input[type="tel"]');
      expect(phoneInput).toHaveAttribute('aria-describedby');
    });

    it('submit button has aria-busy on phone step', () => {
      render(<PhoneOTPForm {...defaultProps} loading={true} step="phone" />);
      const submitBtn = screen.getByRole('button', { name: /Envoi/ });
      expect(submitBtn).toHaveAttribute('aria-busy', 'true');
    });

    it('submit button has aria-busy on OTP step', () => {
      render(
        <PhoneOTPForm
          {...defaultProps}
          otp={['1', '2', '3', '4', '5', '6']}
          loading={true}
          step="otp"
        />
      );
      const submitBtn = screen.getByRole('button', { name: /Vérification/ });
      expect(submitBtn).toHaveAttribute('aria-busy', 'true');
    });

    it('resend button has aria-label', () => {
      render(<PhoneOTPForm {...defaultProps} step="otp" />);
      const resendBtn = screen.getByRole('button', { name: /Renvoyer/ });
      expect(resendBtn).toHaveAttribute('aria-label');
    });

    it('back button has aria-label', () => {
      render(<PhoneOTPForm {...defaultProps} step="otp" />);
      const backBtn = screen.getByRole('button', { name: /Retour/ });
      expect(backBtn).toHaveAttribute('aria-label');
    });
  });

  describe('OTP Event Handling', () => {
    it('ignores non-digit input in OTP field', async () => {
      const setOtpMock = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <PhoneOTPForm
          {...defaultProps}
          step="otp"
          setOtp={setOtpMock}
          otp={['', '', '', '', '', '']}
        />
      );

      const otpInputs = container.querySelectorAll('.otp-input');
      await user.type(otpInputs[0], 'a');

      // Should not have called setOtp for non-digit input
      expect(setOtpMock).not.toHaveBeenCalled();
    });

    it('accepts digit input in OTP field', async () => {
      const setOtpMock = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <PhoneOTPForm
          {...defaultProps}
          step="otp"
          setOtp={setOtpMock}
          otp={['', '', '', '', '', '']}
        />
      );

      const otpInputs = container.querySelectorAll('.otp-input');
      await user.type(otpInputs[0], '1');

      expect(setOtpMock).toHaveBeenCalled();
    });

    it('disables OTP inputs when loading', () => {
      const { container } = render(
        <PhoneOTPForm
          {...defaultProps}
          step="otp"
          loading={true}
          otp={['', '', '', '', '', '']}
        />
      );

      const otpInputs = container.querySelectorAll('.otp-input');
      otpInputs.forEach(input => {
        expect(input).toHaveAttribute('disabled');
      });
    });

    it('enables OTP inputs when not loading', () => {
      const { container } = render(
        <PhoneOTPForm
          {...defaultProps}
          step="otp"
          loading={false}
          otp={['', '', '', '', '', '']}
        />
      );

      const otpInputs = container.querySelectorAll('.otp-input');
      otpInputs.forEach(input => {
        expect(input).not.toHaveAttribute('disabled');
      });
    });

    it('shows error message on OTP step', () => {
      render(
        <PhoneOTPForm
          {...defaultProps}
          step="otp"
          error="Code invalide"
          otp={['', '', '', '', '', '']}
        />
      );

      expect(screen.getByText('Code invalide')).toBeInTheDocument();
    });

    it('disables verify button when OTP incomplete', () => {
      render(
        <PhoneOTPForm
          {...defaultProps}
          step="otp"
          otp={['1', '2', '3', '', '', '']}
        />
      );

      const verifyBtn = screen.getByRole('button', { name: /Vérifier/ });
      expect(verifyBtn).toHaveAttribute('disabled');
    });

    it('enables verify button when OTP complete', () => {
      render(
        <PhoneOTPForm
          {...defaultProps}
          step="otp"
          otp={['1', '2', '3', '4', '5', '6']}
        />
      );

      const verifyBtn = screen.getByRole('button', { name: /Vérifier/ });
      expect(verifyBtn).not.toHaveAttribute('disabled');
    });

    it('handles backspace key event on OTP input', () => {
      const setOtpMock = vi.fn();
      const { container } = render(
        <PhoneOTPForm
          {...defaultProps}
          step="otp"
          setOtp={setOtpMock}
          otp={['1', '', '', '', '', '']}
        />
      );

      const otpInputs = container.querySelectorAll('.otp-input');

      // Simulate backspace on second field (empty)
      fireEvent.keyDown(otpInputs[1], { key: 'Backspace' });

      // Event handling should not throw
      expect(otpInputs[1]).toBeInTheDocument();
    });
  });
});
