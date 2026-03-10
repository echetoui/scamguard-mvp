import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import PhoneOTPForm from '../PhoneOTPForm';

describe('PhoneOTPForm', () => {
  it('renders phone input field', () => {
    render(
      <PhoneOTPForm
        phone=""
        setPhone={vi.fn()}
        otp={['', '', '', '', '', '']}
        setOtp={vi.fn()}
        step="phone"
        loading={false}
        error=""
        resendTimer={0}
        onRequestOtp={vi.fn()}
        onSubmitOtp={vi.fn()}
      />
    );

    const phoneInput = screen.getByRole('textbox', { name: /téléphone/i });
    expect(phoneInput).toBeInTheDocument();
  });

  it('calls onRequestOtp when phone form is submitted', async () => {
    const mockOnRequestOtp = vi.fn();
    const user = userEvent.setup();

    render(
      <PhoneOTPForm
        phone="+1 (555) 123-4567"
        setPhone={vi.fn()}
        otp={['', '', '', '', '', '']}
        setOtp={vi.fn()}
        step="phone"
        loading={false}
        error=""
        resendTimer={0}
        onRequestOtp={mockOnRequestOtp}
        onSubmitOtp={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    // Just verify a button exists that can be clicked
    if (buttons.length > 0) {
      await user.click(buttons[0]);
      expect(mockOnRequestOtp).toHaveBeenCalled();
    }
  });

  it('renders 6 digit OTP inputs when step is otp', () => {
    render(
      <PhoneOTPForm
        phone="+1 (555) 123-4567"
        setPhone={vi.fn()}
        otp={['', '', '', '', '', '']}
        setOtp={vi.fn()}
        step="otp"
        loading={false}
        error=""
        resendTimer={0}
        onRequestOtp={vi.fn()}
        onSubmitOtp={vi.fn()}
      />
    );

    const otpInputs = screen.getAllByRole('textbox');
    expect(otpInputs.length).toBeGreaterThanOrEqual(6);
  });

  it('disables resend button when resendTimer > 0', () => {
    render(
      <PhoneOTPForm
        phone="+1 (555) 123-4567"
        setPhone={vi.fn()}
        otp={['', '', '', '', '', '']}
        setOtp={vi.fn()}
        step="otp"
        loading={false}
        error=""
        resendTimer={30}
        onRequestOtp={vi.fn()}
        onSubmitOtp={vi.fn()}
      />
    );

    const resendButton = screen.getByRole('button', { name: /renvoi|renvoyer/i });
    expect(resendButton).toBeDisabled();
  });
});
