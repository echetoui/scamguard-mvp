import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import EmailAuthForm from '../EmailAuthForm';

describe('EmailAuthForm', () => {
  it('renders email field and submit button', () => {
    const mockOnSubmit = vi.fn();
    render(
      <EmailAuthForm
        email=""
        setEmail={vi.fn()}
        password=""
        setPassword={vi.fn()}
        mode="login"
        loading={false}
        error=""
        onSubmit={mockOnSubmit}
        onGeneratePassword={vi.fn()}
        onCopyPassword={vi.fn()}
        onModeChange={vi.fn()}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0); // email input at minimum
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0); // submit button
  });

  it('shows generate/copy password buttons in signup mode', () => {
    render(
      <EmailAuthForm
        email=""
        setEmail={vi.fn()}
        password="test123"
        setPassword={vi.fn()}
        mode="signup"
        loading={false}
        error=""
        onSubmit={vi.fn()}
        onGeneratePassword={vi.fn()}
        onCopyPassword={vi.fn()}
        onModeChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /générer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copier/i })).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();

    const { getByRole } = render(
      <EmailAuthForm
        email="test@example.com"
        setEmail={vi.fn()}
        password="password123"
        setPassword={vi.fn()}
        mode="login"
        loading={false}
        error=""
        onSubmit={mockOnSubmit}
        onGeneratePassword={vi.fn()}
        onCopyPassword={vi.fn()}
        onModeChange={vi.fn()}
      />
    );

    const submitButton = getByRole('button', { name: /se connecter|s'inscrire/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('displays error message when error prop is provided', () => {
    const errorMsg = 'Identifiants invalides';
    render(
      <EmailAuthForm
        email=""
        setEmail={vi.fn()}
        password=""
        setPassword={vi.fn()}
        mode="login"
        loading={false}
        error={errorMsg}
        onSubmit={vi.fn()}
        onGeneratePassword={vi.fn()}
        onCopyPassword={vi.fn()}
        onModeChange={vi.fn()}
      />
    );

    expect(screen.getByText(new RegExp(errorMsg, 'i'))).toBeInTheDocument();
  });
});
