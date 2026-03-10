/**
 * SMSAuthScreen Component Tests
 * Phase 6 - Coverage Expansion Continuation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SMSAuthScreen from '../SMSAuthScreen';

vi.mock('../auth/RoleSelectionCards', () => ({
  default: ({ selectedRole, onSelectRole, loading }) => (
    <div className="role-selection-mock">
      <button onClick={() => onSelectRole('senior')} disabled={loading}>
        Select Senior
      </button>
    </div>
  )
}));

vi.mock('../auth/EmailAuthForm', () => ({
  default: ({ email, setEmail, password, setPassword, mode, loading, error, onGeneratePassword, onCopyPassword, onSubmit, onModeChange }) => (
    <div className="email-auth-form-mock">
      <input id="email-input" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input id="password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={onGeneratePassword}>Generate</button>
      <button onClick={onCopyPassword}>Copy</button>
      <button onClick={() => onSubmit(email, password)} disabled={loading}>{mode === 'login' ? 'Se connecter' : 'S\'inscrire'}</button>
      {error && <div role="alert">{error}</div>}
    </div>
  )
}));

vi.mock('../Toast', () => ({
  default: ({ message }) => <div className="toast-mock" role="alert">{message}</div>
}));

vi.mock('../constants/errorMessages', () => ({
  ERROR_MESSAGES: { NETWORK_ERROR: 'Erreur réseau. Veuillez réessayer.' }
}));

vi.mock('../utils/authStorage', () => ({
  setAuth: vi.fn(),
  setUserId: vi.fn(),
}));

describe('SMSAuthScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.navigator.clipboard = { writeText: vi.fn() };
  });

  it('should render main auth screen', () => {
    const { container } = render(<SMSAuthScreen />);
    expect(container.querySelector('.sms-auth-screen')).toBeTruthy();
  });

  it('should display header with logo', () => {
    render(<SMSAuthScreen />);
    expect(screen.getByText('🛡️ ScamGuard')).toBeTruthy();
  });

  it('should display header subtitle', () => {
    render(<SMSAuthScreen />);
    expect(screen.getByText('Protégez-vous contre les arnaques')).toBeTruthy();
  });

  it('should have role="main"', () => {
    const { container } = render(<SMSAuthScreen />);
    expect(container.querySelector('[role="main"]')).toBeTruthy();
  });

  it('should display mode selection initially', () => {
    render(<SMSAuthScreen />);
    expect(screen.getByText('Que voulez-vous faire?')).toBeTruthy();
  });

  it('should display mode selection buttons', () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    expect(buttons.length).toBe(2);
  });

  it('should display login button', () => {
    render(<SMSAuthScreen />);
    expect(screen.getByText('🔐 Se connecter')).toBeTruthy();
  });

  it('should go to role selection on signup', () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[0]); // First button is signup
    expect(container.querySelector('.role-selection-mock')).toBeTruthy();
  });

  it('should display role selection cards', () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[0]);
    expect(screen.getByText('Select Senior')).toBeTruthy();
  });

  it('should go to email form after role selection', () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[0]);
    const selectRoleBtn = screen.getByText('Select Senior');
    fireEvent.click(selectRoleBtn);
    expect(container.querySelector('.email-auth-form-mock')).toBeTruthy();
  });

  it('should go to email form on login', () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[1]); // Second button is login
    expect(container.querySelector('.email-auth-form-mock')).toBeTruthy();
  });

  it('should have back button in email form', () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[1]);
    expect(screen.getByText('← Retour')).toBeTruthy();
  });

  it('should submit login form', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id_token: 'token', access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user: { sub: 'user123' } }
      })
    });

    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[1]);

    const emailInput = container.querySelector('#email-input');
    const passwordInput = container.querySelector('#password-input');
    const submitBtn = screen.getByText('Se connecter');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.any(Object));
    });
  });

  it('should show success message on successful login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id_token: 'token', access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user: { sub: 'user123' } }
      })
    });

    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[1]);

    const emailInput = container.querySelector('#email-input');
    const passwordInput = container.querySelector('#password-input');
    const submitBtn = screen.getByText('Se connecter');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('✅ Bienvenue!')).toBeTruthy();
    });
  });

  it('should show error on API failure', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Invalid' } })
    });

    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[1]);

    const emailInput = container.querySelector('#email-input');
    const passwordInput = container.querySelector('#password-input');
    const submitBtn = screen.getByText('Se connecter');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid')).toBeTruthy();
    });
  });

  it('should show network error on fetch failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[1]);

    const emailInput = container.querySelector('#email-input');
    const passwordInput = container.querySelector('#password-input');
    const submitBtn = screen.getByText('Se connecter');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Erreur réseau/)).toBeTruthy();
    });
  });

  it('should generate 16-char password', () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[0]);
    const selectRoleBtn = screen.getByText('Select Senior');
    fireEvent.click(selectRoleBtn);

    const generateBtn = screen.getByText('Generate');
    fireEvent.click(generateBtn);

    const passwordInput = container.querySelector('#password-input');
    expect(passwordInput.value.length).toBe(16);
  });

  it('should copy password to clipboard', async () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[0]);
    const selectRoleBtn = screen.getByText('Select Senior');
    fireEvent.click(selectRoleBtn);

    const generateBtn = screen.getByText('Generate');
    fireEvent.click(generateBtn);
    const copyBtn = screen.getByText('Copy');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('should show toast on password copy', async () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[0]);
    const selectRoleBtn = screen.getByText('Select Senior');
    fireEvent.click(selectRoleBtn);

    const generateBtn = screen.getByText('Generate');
    fireEvent.click(generateBtn);
    const copyBtn = screen.getByText('Copy');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Mot de passe copié/)).toBeTruthy();
    });
  });

  it('should go back from role selection', () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[0]);
    const backBtn = screen.getByText('← Retour');
    fireEvent.click(backBtn);
    expect(screen.getByText('Que voulez-vous faire?')).toBeTruthy();
  });

  it('should go back from email form', () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[1]);
    const backBtn = screen.getByText('← Retour');
    fireEvent.click(backBtn);
    expect(screen.getByText('Que voulez-vous faire?')).toBeTruthy();
  });

  it('should disable buttons during loading', async () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[1]);

    const emailInput = container.querySelector('#email-input');
    const passwordInput = container.querySelector('#password-input');
    const submitBtn = screen.getByText('Se connecter');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitBtn);

    expect(submitBtn.disabled).toBe(true);
  });

  it('should have proper heading structure', () => {
    const { container } = render(<SMSAuthScreen />);
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBeGreaterThan(0);
  });

  it('should normalize email to lowercase', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id_token: 'token', access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user: { sub: 'user123' } }
      })
    });

    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[1]);

    const emailInput = container.querySelector('#email-input');
    const passwordInput = container.querySelector('#password-input');
    const submitBtn = screen.getByText('Se connecter');

    fireEvent.change(emailInput, { target: { value: 'Test@Example.COM' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        body: expect.stringContaining('test@example.com')
      }));
    });
  });

  it('should have aria-labels on buttons', () => {
    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('[aria-label]');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should show success emoji', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id_token: 'token', access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user: { sub: 'user123' } }
      })
    });

    const { container } = render(<SMSAuthScreen />);
    const buttons = container.querySelectorAll('.auth-button');
    fireEvent.click(buttons[1]);

    const emailInput = container.querySelector('#email-input');
    const passwordInput = container.querySelector('#password-input');
    const submitBtn = screen.getByText('Se connecter');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('✅ Bienvenue!')).toBeTruthy();
    });
  });
});
