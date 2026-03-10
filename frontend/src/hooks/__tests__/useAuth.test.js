/**
 * useAuth Hook Tests
 * Phase 5E - Test Coverage Expansion
 *
 * Tests for:
 * - Authentication state management
 * - Login/logout flows
 * - Token refresh
 * - Auth persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useAuth from '../useAuth';
import * as authStorage from '../../utils/authStorage';
import * as authAPI from '../../services/api';

// Mock dependencies
vi.mock('../../utils/authStorage');
vi.mock('../../services/api');

describe('useAuth Hook', () => {
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OX0.test';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock setup
    authStorage.getAuth.mockReturnValue({});
    authStorage.setAuth.mockImplementation(() => {});
    authStorage.clearAuth.mockImplementation(() => {});
    authStorage.setUserId.mockImplementation(() => {});
    authStorage.getAuthToken.mockReturnValue(null);
    authAPI.authAPI = {
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      verifyEmail: vi.fn(),
      resendCode: vi.fn(),
      refreshToken: vi.fn(),
    };
  });

  describe('Initial State', () => {
    it('should initialize with unauthenticated state when no token', () => {
      authStorage.getAuth.mockReturnValue({});

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should load and validate auth token on mount', () => {
      authStorage.getAuth.mockReturnValue({
        id_token: mockToken,
        expires_in: 3600,
      });

      const { result } = renderHook(() => useAuth());

      expect(authStorage.getAuth).toHaveBeenCalled();
    });

    it('should initialize isLoading as false', () => {
      authStorage.getAuth.mockReturnValue({});

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize error as null', () => {
      authStorage.getAuth.mockReturnValue({});

      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBe(null);
    });
  });

  describe('Login Flow', () => {
    it('should set authenticated state on successful login', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockResolvedValue({
        id_token: mockToken,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        message: 'Login successful',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('user@example.com', 'password');
      });

      // Should call setAuth with tokens
      expect(authStorage.setAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          id_token: mockToken,
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        })
      );
    });

    it('should set error on login failure', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockRejectedValue({
        data: { error: { message: 'Invalid credentials' } },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.login('user@example.com', 'wrongpass');
        expect(response.success).toBe(false);
        expect(response.error).toBe('Invalid credentials');
      });
    });

    it('should set loading state during login', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          id_token: mockToken,
          access_token: 'token',
          refresh_token: 'token',
          expires_in: 3600,
        }), 100))
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.login('user@example.com', 'password');
      });

      // Immediately after dispatch, should be loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Logout Flow', () => {
    it('should clear authentication on logout', async () => {
      authStorage.getAuth.mockReturnValue({
        id_token: mockToken,
        expires_in: 3600,
      });
      authAPI.authAPI.logout.mockResolvedValue({});

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(authStorage.clearAuth).toHaveBeenCalled();
    });

    it('should reset auth state even if logout API fails', async () => {
      authStorage.getAuth.mockReturnValue({
        id_token: mockToken,
        expires_in: 3600,
      });
      authAPI.authAPI.logout.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.logout();
        expect(response.success).toBe(true);
      });

      expect(authStorage.clearAuth).toHaveBeenCalled();
    });
  });

  describe('Token Management', () => {
    it('should call getAuth during initialization', () => {
      authStorage.getAuth.mockReturnValue({});

      renderHook(() => useAuth());

      expect(authStorage.getAuth).toHaveBeenCalled();
    });

    it('should handle tokens from auth storage', () => {
      authStorage.getAuth.mockReturnValue({
        id_token: mockToken,
        access_token: 'access-token',
        expires_in: 3600,
      });

      const { result } = renderHook(() => useAuth());

      expect(authStorage.getAuth).toHaveBeenCalled();
    });

    it('should clear auth when token is invalid', () => {
      authStorage.getAuth.mockReturnValue({
        id_token: 'invalid-token',
        expires_in: 3600,
      });

      const { result } = renderHook(() => useAuth());

      expect(authStorage.clearAuth).toHaveBeenCalled();
    });
  });

  describe('User Info', () => {
    it('should extract user info from token on successful login', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockResolvedValue({
        id_token: mockToken,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        message: 'Login successful',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('user@example.com', 'password');
      });

      expect(authStorage.setUserId).toHaveBeenCalledWith('user-123');
    });

    it('should not authenticate with malformed token', () => {
      authStorage.getAuth.mockReturnValue({
        id_token: 'not.enough.parts',
        expires_in: 3600,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Auth Persistence', () => {
    it('should restore auth state from storage on mount', () => {
      authStorage.getAuth.mockReturnValue({
        id_token: mockToken,
        expires_in: 3600,
      });

      const { result } = renderHook(() => useAuth());

      expect(authStorage.getAuth).toHaveBeenCalled();
    });

    it('should call setAuth when storing new tokens', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockResolvedValue({
        id_token: mockToken,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        message: 'Login successful',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('user@example.com', 'password');
      });

      expect(authStorage.setAuth).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle getAuth errors gracefully', () => {
      authStorage.getAuth.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        renderHook(() => useAuth());
      }).not.toThrow();
    });

    it('should set error state on auth failure', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockRejectedValue({
        message: 'Network error',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('user@example.com', 'password');
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should clear error when clearError is called', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockRejectedValue({
        message: 'Error',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('user@example.com', 'password');
      });

      expect(result.current.error).toBe('Error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Hook Integration', () => {
    it('should provide consistent state across re-renders', () => {
      authStorage.getAuth.mockReturnValue({});

      const { result, rerender } = renderHook(() => useAuth());
      const firstAuth = result.current.isAuthenticated;

      rerender();
      const secondAuth = result.current.isAuthenticated;

      expect(firstAuth).toBe(secondAuth);
    });

    it('should provide all necessary auth methods', () => {
      authStorage.getAuth.mockReturnValue({});

      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.signup).toBe('function');
      expect(typeof result.current.verifyEmail).toBe('function');
      expect(typeof result.current.resendCode).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('Signup and Verification', () => {
    it('should handle signup requests', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.signup.mockResolvedValue({
        user_id: 'new-user-123',
        status: 'pending',
        message: 'Signup successful',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signup('new@example.com', 'password');
        expect(response.success).toBe(true);
        expect(response.userId).toBe('new-user-123');
      });
    });

    it('should handle email verification', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.verifyEmail.mockResolvedValue({
        status: 'verified',
        message: 'Email verified',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.verifyEmail('user@example.com', '123456');
        expect(response.success).toBe(true);
      });
    });

    it('should handle code resend', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.resendCode.mockResolvedValue({
        message: 'Code sent',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.resendCode('user@example.com');
        expect(response.success).toBe(true);
      });
    });
  });
});
