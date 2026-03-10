import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmailAuthForm from '../EmailAuthForm';

describe('EmailAuthForm', () => {
  const defaultProps = {
    email: '',
    setEmail: vi.fn(),
    password: '',
    setPassword: vi.fn(),
    mode: 'login',
    loading: false,
    error: '',
    onSubmit: vi.fn(),
    onGeneratePassword: vi.fn(),
    onCopyPassword: vi.fn(),
    onModeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - Login Mode', () => {
    it('renders email field and submit button', () => {
      render(<EmailAuthForm {...defaultProps} />);
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('displays login form title', () => {
      const { container } = render(<EmailAuthForm {...defaultProps} mode="login" />);
      const title = container.querySelector('.form-title');
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe('Se connecter');
    });

    it('displays submit button with login text', () => {
      render(<EmailAuthForm {...defaultProps} mode="login" />);
      expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
    });

    it('does not show password field in login mode', () => {
      const { container } = render(<EmailAuthForm {...defaultProps} mode="login" />);
      const passwordInputs = container.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length).toBe(0);
    });

    it('shows mode toggle to signup', () => {
      const { container } = render(<EmailAuthForm {...defaultProps} mode="login" />);
      expect(screen.getByText(/Pas de compte/)).toBeInTheDocument();
      const toggleSection = container.querySelector('.auth-mode-toggle');
      expect(toggleSection).toBeInTheDocument();
      const toggleBtn = toggleSection.querySelector('button');
      expect(toggleBtn).toBeInTheDocument();
    });

    it('disables submit button when email is empty', () => {
      render(<EmailAuthForm {...defaultProps} email="" />);
      const submitBtn = screen.getByRole('button', { name: /Se connecter/i });
      expect(submitBtn).toBeDisabled();
    });

    it('enables submit button when email is filled', () => {
      render(<EmailAuthForm {...defaultProps} email="test@example.com" />);
      const submitBtn = screen.getByRole('button', { name: /Se connecter/i });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  describe('Rendering - Signup Mode', () => {
    it('displays signup form title', () => {
      const { container } = render(<EmailAuthForm {...defaultProps} mode="signup" />);
      const title = container.querySelector('.form-title');
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe('Créer un compte');
    });

    it('displays password field in signup mode', () => {
      const { container } = render(<EmailAuthForm {...defaultProps} mode="signup" />);
      const passwordInputs = container.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length).toBeGreaterThan(0);
    });

    it('shows generate password button in signup mode', () => {
      render(<EmailAuthForm {...defaultProps} mode="signup" />);
      expect(screen.getByRole('button', { name: /Générer/i })).toBeInTheDocument();
    });

    it('shows copy password button when password is filled', () => {
      render(<EmailAuthForm {...defaultProps} mode="signup" password="testpass123" />);
      expect(screen.getByRole('button', { name: /Copier/i })).toBeInTheDocument();
    });

    it('hides copy password button when password is empty', () => {
      const { queryByRole } = render(<EmailAuthForm {...defaultProps} mode="signup" password="" />);
      expect(queryByRole('button', { name: /Copier/i })).not.toBeInTheDocument();
    });

    it('shows password visibility toggle button', () => {
      render(<EmailAuthForm {...defaultProps} mode="signup" />);
      const visibilityButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.includes('mot de passe')
      );
      expect(visibilityButtons.length).toBeGreaterThan(0);
    });

    it('displays password requirements text', () => {
      render(<EmailAuthForm {...defaultProps} mode="signup" />);
      expect(screen.getByText(/Minimum 8 caractères/i)).toBeInTheDocument();
    });

    it('shows mode toggle to login', () => {
      const { container } = render(<EmailAuthForm {...defaultProps} mode="signup" />);
      expect(screen.getByText(/Vous avez déjà un compte/)).toBeInTheDocument();
      const toggleSection = container.querySelector('.auth-mode-toggle');
      expect(toggleSection).toBeInTheDocument();
      const toggleBtn = toggleSection.querySelector('button');
      expect(toggleBtn).toBeInTheDocument();
    });

    it('disables submit button when email is empty', () => {
      render(<EmailAuthForm {...defaultProps} mode="signup" email="" password="pass123" />);
      const submitBtn = screen.getByRole('button', { name: /Créer un compte/i });
      expect(submitBtn).toBeDisabled();
    });

    it('disables submit button when password is empty', () => {
      render(<EmailAuthForm {...defaultProps} mode="signup" email="test@example.com" password="" />);
      const submitBtn = screen.getByRole('button', { name: /Créer un compte/i });
      expect(submitBtn).toBeDisabled();
    });

    it('enables submit button when both email and password are filled', () => {
      render(<EmailAuthForm {...defaultProps} mode="signup" email="test@example.com" password="pass123" />);
      const submitBtn = screen.getByRole('button', { name: /Créer un compte/i });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with email and password when form is submitted', async () => {
      const mockOnSubmit = vi.fn();
      const user = userEvent.setup();

      const { getByRole } = render(
        <EmailAuthForm
          {...defaultProps}
          email="test@example.com"
          password="password123"
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = getByRole('button', { name: /Se connecter/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('prevents default form submission', async () => {
      const mockOnSubmit = vi.fn();
      const user = userEvent.setup();

      const { getByRole } = render(
        <EmailAuthForm
          {...defaultProps}
          email="test@example.com"
          password="password123"
          onSubmit={mockOnSubmit}
        />
      );

      const form = screen.getByRole('form');
      await user.click(getByRole('button', { name: /Se connecter/i }));

      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe('Input Changes', () => {
    it('calls setEmail when email input changes', async () => {
      const mockSetEmail = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <EmailAuthForm {...defaultProps} setEmail={mockSetEmail} />
      );

      const emailInput = container.querySelector('input[type="email"]');
      await user.type(emailInput, 'new@example.com');

      expect(mockSetEmail).toHaveBeenCalled();
    });

    it('calls setPassword when password input changes in signup mode', async () => {
      const mockSetPassword = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <EmailAuthForm {...defaultProps} mode="signup" setPassword={mockSetPassword} />
      );

      const passwordInput = container.querySelector('input[type="password"]');
      await user.type(passwordInput, 'newpass123');

      expect(mockSetPassword).toHaveBeenCalled();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when toggle button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmailAuthForm {...defaultProps} mode="signup" password="testpass" />
      );

      const toggleBtn = container.querySelector('.btn-toggle-password');
      await user.click(toggleBtn);

      const passwordInput = container.querySelector('input[type="text"]');
      expect(passwordInput).toBeInTheDocument();
    });

    it('shows correct aria-label for password visibility toggle', () => {
      const { container } = render(<EmailAuthForm {...defaultProps} mode="signup" />);
      const toggleBtn = container.querySelector('.btn-toggle-password');
      expect(toggleBtn.getAttribute('aria-label')).toContain('Afficher');
    });
  });

  describe('Generator and Copy Buttons', () => {
    it('calls onGeneratePassword when generate button is clicked', async () => {
      const mockOnGeneratePassword = vi.fn();
      const user = userEvent.setup();

      render(
        <EmailAuthForm {...defaultProps} mode="signup" onGeneratePassword={mockOnGeneratePassword} />
      );

      const generateBtn = screen.getByRole('button', { name: /Générer/i });
      await user.click(generateBtn);

      expect(mockOnGeneratePassword).toHaveBeenCalled();
    });

    it('calls onCopyPassword when copy button is clicked', async () => {
      const mockOnCopyPassword = vi.fn();
      const user = userEvent.setup();

      render(
        <EmailAuthForm
          {...defaultProps}
          mode="signup"
          password="testpass123"
          onCopyPassword={mockOnCopyPassword}
        />
      );

      const copyBtn = screen.getByRole('button', { name: /Copier/i });
      await user.click(copyBtn);

      expect(mockOnCopyPassword).toHaveBeenCalled();
    });

    it('disables generate button when loading', () => {
      render(<EmailAuthForm {...defaultProps} mode="signup" loading={true} />);
      const generateBtn = screen.getByRole('button', { name: /Générer/i });
      expect(generateBtn).toBeDisabled();
    });

    it('disables copy button when loading', () => {
      render(
        <EmailAuthForm {...defaultProps} mode="signup" password="test" loading={true} />
      );
      const copyBtn = screen.getByRole('button', { name: /Copier/i });
      expect(copyBtn).toBeDisabled();
    });
  });

  describe('Mode Toggle', () => {
    it('calls onModeChange when signup toggle is clicked in login mode', async () => {
      const mockOnModeChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <EmailAuthForm {...defaultProps} mode="login" onModeChange={mockOnModeChange} />
      );

      const toggleBtn = container.querySelector('.btn-toggle-mode');
      await user.click(toggleBtn);

      expect(mockOnModeChange).toHaveBeenCalledWith('signup');
    });

    it('calls onModeChange when login toggle is clicked in signup mode', async () => {
      const mockOnModeChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <EmailAuthForm {...defaultProps} mode="signup" onModeChange={mockOnModeChange} />
      );

      const toggleBtn = container.querySelector('.btn-toggle-mode');
      await user.click(toggleBtn);

      expect(mockOnModeChange).toHaveBeenCalledWith('login');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when error prop is provided', () => {
      const errorMsg = 'Identifiants invalides';
      render(<EmailAuthForm {...defaultProps} error={errorMsg} />);
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('displays error with alert role', () => {
      const errorMsg = 'Erreur de connexion';
      render(<EmailAuthForm {...defaultProps} error={errorMsg} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not display error when error is empty', () => {
      const { queryByRole } = render(<EmailAuthForm {...defaultProps} error="" />);
      expect(queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('disables email input when loading', () => {
      const { container } = render(<EmailAuthForm {...defaultProps} loading={true} />);
      const emailInput = container.querySelector('input[type="email"]');
      expect(emailInput).toBeDisabled();
    });

    it('disables password input when loading in signup mode', () => {
      const { container } = render(
        <EmailAuthForm {...defaultProps} mode="signup" loading={true} />
      );
      const passwordInput = container.querySelector('input[type="password"]');
      expect(passwordInput).toBeDisabled();
    });

    it('disables submit button when loading', () => {
      render(<EmailAuthForm {...defaultProps} email="test@example.com" loading={true} />);
      const submitBtn = screen.getByRole('button', { name: /Traitement/i });
      expect(submitBtn).toBeDisabled();
    });

    it('shows loading text on submit button', () => {
      render(<EmailAuthForm {...defaultProps} email="test@example.com" loading={true} />);
      expect(screen.getByText(/Traitement/i)).toBeInTheDocument();
    });

    it('sets aria-busy on submit button when loading', () => {
      render(<EmailAuthForm {...defaultProps} email="test@example.com" loading={true} />);
      const submitBtn = screen.getByRole('button', { name: /Traitement/i });
      expect(submitBtn.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('Accessibility', () => {
    it('has proper form role', () => {
      render(<EmailAuthForm {...defaultProps} />);
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('has aria-label on email input', () => {
      const { container } = render(<EmailAuthForm {...defaultProps} />);
      const emailInput = container.querySelector('input[type="email"]');
      expect(emailInput).toHaveAttribute('aria-label');
    });

    it('has aria-label on password input in signup mode', () => {
      const { container } = render(<EmailAuthForm {...defaultProps} mode="signup" />);
      const passwordInput = container.querySelector('input[type="password"]');
      expect(passwordInput).toHaveAttribute('aria-label');
    });

    it('has proper label elements', () => {
      render(<EmailAuthForm {...defaultProps} />);
      expect(screen.getByText('Adresse email')).toBeInTheDocument();
    });

    it('email input has required attribute', () => {
      const { container } = render(<EmailAuthForm {...defaultProps} />);
      const emailInput = container.querySelector('input[type="email"]');
      expect(emailInput).toHaveAttribute('required');
    });
  });
});
