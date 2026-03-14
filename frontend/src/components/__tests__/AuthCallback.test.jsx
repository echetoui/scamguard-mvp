/**
 * AuthCallback Component Tests
 * OAuth Cognito callback handler - Critical path authentication
 *
 * Test coverage:
 * - OAuth success flow (code → tokens → redirect)
 * - OAuth error handling
 * - Missing code scenarios
 * - Token exchange failures
 * - JWT parsing & user extraction
 * - UI state transitions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthCallback from '../AuthCallback';
import * as authStorage from '../../utils/authStorage';

// Mock authStorage
vi.mock('../../utils/authStorage', () => ({
  setAuth: vi.fn(),
  setUserId: vi.fn(),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock atob for JWT
const originalAtob = global.atob;
global.atob = (str) => Buffer.from(str, 'base64').toString('utf-8');

// Helper to encode JWT
const encodeJWT = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${header}.${body}.signature`;
};

// Helper to render with search params
const renderAuthCallback = (searchParams = '') => {
  delete window.location;
  window.location = new URL(`http://localhost/auth/callback${searchParams}`);

  return render(
    <MemoryRouter>
      <AuthCallback />
    </MemoryRouter>
  );
};

describe('AuthCallback Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // INITIAL RENDERING
  // ============================================================================
  describe('Initial Rendering', () => {
    it('should render processing spinner on mount', () => {
      renderAuthCallback('?code=test-code');
      expect(screen.getByText('Connexion en cours...')).toBeTruthy();
    });

    it('should display processing spinner element', () => {
      renderAuthCallback('?code=test-code');
      const spinner = document.querySelector('.auth-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should have auth-callback-container element', () => {
      renderAuthCallback('?code=test-code');
      const container = document.querySelector('.auth-callback-container');
      expect(container).toBeTruthy();
    });

    it('should not show success message initially', () => {
      renderAuthCallback('?code=test-code');
      expect(screen.queryByText('Connexion réussie ! Redirection...')).toBeFalsy();
    });

    it('should not show error message initially', () => {
      renderAuthCallback('?code=test-code');
      expect(screen.queryByText('Erreur de connexion. Redirection...')).toBeFalsy();
    });
  });

  // ============================================================================
  // OAUTH SUCCESS FLOW
  // ============================================================================
  describe('OAuth Success Flow', () => {
    const mockTokens = {
      id_token: encodeJWT({ sub: 'user-123', email: 'test@example.com' }),
      access_token: 'access-xyz',
      refresh_token: 'refresh-xyz',
      expires_in: 3600,
    };

    beforeEach(() => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens,
      });
    });

    it('should call fetch to exchange authorization code', async () => {
      renderAuthCallback('?code=auth-code-123');

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    it('should POST to token endpoint', async () => {
      renderAuthCallback('?code=auth-code-123');

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/oauth2/token'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('should include authorization code in request body', async () => {
      renderAuthCallback('?code=special-code-456');

      await waitFor(() => {
        const call = fetch.mock.calls[0];
        const body = new URLSearchParams(call[1].body);
        expect(body.get('code')).toBe('special-code-456');
      });
    });

    it('should include grant_type in request body', async () => {
      renderAuthCallback('?code=auth-code');

      await waitFor(() => {
        const call = fetch.mock.calls[0];
        const body = new URLSearchParams(call[1].body);
        expect(body.get('grant_type')).toBe('authorization_code');
      });
    });

    it('should set headers correctly', async () => {
      renderAuthCallback('?code=auth-code');

      await waitFor(() => {
        const headers = fetch.mock.calls[0][1].headers;
        expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      });
    });

    it('should call setAuth with token response', async () => {
      renderAuthCallback('?code=auth-code');

      await waitFor(() => {
        expect(authStorage.setAuth).toHaveBeenCalledWith(
          expect.objectContaining({
            id_token: mockTokens.id_token,
            access_token: mockTokens.access_token,
            refresh_token: mockTokens.refresh_token,
          })
        );
      });
    });

    it('should extract user ID from JWT and call setUserId', async () => {
      renderAuthCallback('?code=auth-code');

      await waitFor(() => {
        expect(authStorage.setUserId).toHaveBeenCalledWith('user-123');
      });
    });

    it('should show success message after token exchange', async () => {
      renderAuthCallback('?code=auth-code');

      await waitFor(() => {
        expect(screen.getByText('Connexion réussie ! Redirection...')).toBeTruthy();
      });
    });

    it('should display success icon', async () => {
      renderAuthCallback('?code=auth-code');

      await waitFor(() => {
        const icon = document.querySelector('.auth-success-icon');
        expect(icon).toBeTruthy();
      });
    });

    it('should display success mark symbol', async () => {
      renderAuthCallback('?code=auth-code');

      await waitFor(() => {
        const mark = document.querySelector('.auth-success-mark');
        expect(mark?.textContent).toContain('✓');
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING - OAUTH ERRORS
  // ============================================================================
  describe('OAuth Error Parameter', () => {
    it('should handle access_denied error', async () => {
      renderAuthCallback('?error=access_denied');

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });

    it('should handle invalid_request error', async () => {
      renderAuthCallback('?error=invalid_request');

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });

    it('should handle server_error', async () => {
      renderAuthCallback('?error=server_error');

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });

    it('should display error icon on error', async () => {
      renderAuthCallback('?error=access_denied');

      await waitFor(() => {
        const icon = document.querySelector('.auth-error-icon');
        expect(icon).toBeTruthy();
      });
    });

    it('should display error mark symbol', async () => {
      renderAuthCallback('?error=access_denied');

      await waitFor(() => {
        const mark = document.querySelector('.auth-error-mark');
        expect(mark?.textContent).toContain('✗');
      });
    });

    it('should not call fetch when error parameter present', async () => {
      renderAuthCallback('?error=access_denied');

      await waitFor(() => {
        expect(fetch).not.toHaveBeenCalled();
      });
    });

    it('should not call setAuth on OAuth error', async () => {
      renderAuthCallback('?error=access_denied');

      await waitFor(() => {
        expect(authStorage.setAuth).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // MISSING CODE SCENARIOS
  // ============================================================================
  describe('Missing Authorization Code', () => {
    it('should show error when no code parameter', async () => {
      renderAuthCallback('');

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });

    it('should show error with unrelated parameters only', async () => {
      renderAuthCallback('?unrelated=param&other=value');

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });

    it('should not call fetch without code', async () => {
      renderAuthCallback('?state=xyz');

      await waitFor(() => {
        expect(fetch).not.toHaveBeenCalled();
      });
    });

    it('should not call setAuth without code', async () => {
      renderAuthCallback('');

      await waitFor(() => {
        expect(authStorage.setAuth).not.toHaveBeenCalled();
      });
    });

    it('should display error icon', async () => {
      renderAuthCallback('');

      await waitFor(() => {
        const icon = document.querySelector('.auth-error-icon');
        expect(icon).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // TOKEN EXCHANGE FAILURES
  // ============================================================================
  describe('Token Exchange Failures', () => {
    it('should handle failed token response (400)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      renderAuthCallback('?code=bad-code');

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });

    it('should handle failed token response (401)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      renderAuthCallback('?code=unauthorized');

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });

    it('should handle network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      renderAuthCallback('?code=network-error');

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });

    it('should not call setAuth on token exchange failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      renderAuthCallback('?code=fail-code');

      await waitFor(() => {
        expect(authStorage.setAuth).not.toHaveBeenCalled();
      });
    });

    it('should not call setUserId on token exchange failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      renderAuthCallback('?code=fail-code');

      await waitFor(() => {
        expect(authStorage.setUserId).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // JWT PARSING & USER EXTRACTION
  // ============================================================================
  describe('JWT Parsing & User Data', () => {
    it('should correctly parse JWT and extract sub claim', async () => {
      const tokens = {
        id_token: encodeJWT({ sub: 'user-789' }),
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      });

      renderAuthCallback('?code=valid-code');

      await waitFor(() => {
        expect(authStorage.setUserId).toHaveBeenCalledWith('user-789');
      });
    });

    it('should handle JWT with additional claims', async () => {
      const tokens = {
        id_token: encodeJWT({
          sub: 'user-special',
          email: 'user@example.com',
          name: 'Test User',
          given_name: 'Test',
          family_name: 'User',
        }),
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      });

      renderAuthCallback('?code=claims-code');

      await waitFor(() => {
        expect(authStorage.setUserId).toHaveBeenCalledWith('user-special');
      });
    });

    it('should handle JWT with special characters', async () => {
      const tokens = {
        id_token: encodeJWT({
          sub: 'user-special-chars-123',
          email: 'user+test@example.com',
        }),
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      });

      renderAuthCallback('?code=special-code');

      await waitFor(() => {
        expect(authStorage.setUserId).toHaveBeenCalledWith('user-special-chars-123');
      });
    });

    it('should handle malformed JWT gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id_token: 'not.a.valid.jwt',
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
        }),
      });

      renderAuthCallback('?code=malformed-code');

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // UI STATE TRANSITIONS
  // ============================================================================
  describe('UI State Transitions', () => {
    it('should transition from processing to success', async () => {
      const tokens = {
        id_token: encodeJWT({ sub: 'user-123' }),
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      });

      renderAuthCallback('?code=auth-code');

      // Initially processing
      expect(screen.getByText('Connexion en cours...')).toBeTruthy();

      // Then success
      await waitFor(() => {
        expect(screen.getByText('Connexion réussie ! Redirection...')).toBeTruthy();
      });
    });

    it('should transition from processing to error on OAuth error', async () => {
      renderAuthCallback('?error=access_denied');

      // State changes very quickly, so we just verify the final error state
      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });

    it('should transition from processing to error on missing code', async () => {
      renderAuthCallback('');

      // State changes very quickly, so we just verify the final error state
      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });

    it('should not show multiple status messages', async () => {
      const tokens = {
        id_token: encodeJWT({ sub: 'user-123' }),
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      });

      renderAuthCallback('?code=auth-code');

      await waitFor(() => {
        expect(screen.getByText('Connexion réussie ! Redirection...')).toBeTruthy();
      });

      // Should not have error message
      expect(screen.queryByText('Erreur de connexion. Redirection...')).toBeFalsy();
      // Should not have processing message
      expect(screen.queryByText('Connexion en cours...')).toBeFalsy();
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle code with special URL characters', async () => {
      const tokens = {
        id_token: encodeJWT({ sub: 'user-123' }),
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      });

      renderAuthCallback('?code=code%2Fwith%2Fslashes');

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    it('should handle very long authorization code', async () => {
      const longCode = 'a'.repeat(500);
      const tokens = {
        id_token: encodeJWT({ sub: 'user-123' }),
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      });

      renderAuthCallback(`?code=${longCode}`);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    it('should handle missing expires_in', async () => {
      const tokens = {
        id_token: encodeJWT({ sub: 'user-123' }),
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      });

      renderAuthCallback('?code=auth-code');

      await waitFor(() => {
        expect(authStorage.setAuth).toHaveBeenCalled();
      });
    });

    it('should handle null response body', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      renderAuthCallback('?code=auth-code');

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Redirection...')).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // CSS & ACCESSIBILITY
  // ============================================================================
  describe('CSS Classes & Accessibility', () => {
    it('should have auth-callback-container class', () => {
      renderAuthCallback('?code=test');
      expect(document.querySelector('.auth-callback-container')).toBeTruthy();
    });

    it('should have auth-spinner for processing state', () => {
      renderAuthCallback('?code=test');
      expect(document.querySelector('.auth-spinner')).toBeTruthy();
    });

    it('should have auth-status-text for processing message', () => {
      renderAuthCallback('?code=test');
      const statusText = document.querySelector('.auth-status-text');
      expect(statusText).toBeTruthy();
      expect(statusText.textContent).toBe('Connexion en cours...');
    });

    it('should have success icon classes', async () => {
      const tokens = {
        id_token: encodeJWT({ sub: 'user-123' }),
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      });

      renderAuthCallback('?code=auth-code');

      await waitFor(() => {
        expect(document.querySelector('.auth-success-icon')).toBeTruthy();
        expect(document.querySelector('.auth-success-mark')).toBeTruthy();
      });
    });

    it('should have error icon classes', async () => {
      renderAuthCallback('?error=access_denied');

      await waitFor(() => {
        expect(document.querySelector('.auth-error-icon')).toBeTruthy();
        expect(document.querySelector('.auth-error-mark')).toBeTruthy();
      });
    });

    it('should have error text class', async () => {
      renderAuthCallback('?error=access_denied');

      await waitFor(() => {
        expect(document.querySelector('.auth-error-text')).toBeTruthy();
      });
    });
  });
});
