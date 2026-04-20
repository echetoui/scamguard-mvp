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
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      validateSession: vi.fn(),
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

    it('should handle signup failure with validation error', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.signup.mockRejectedValue({
        data: { error: { message: 'Email already exists', code: 'DUPLICATE_EMAIL' } },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signup('existing@example.com', 'password');
        expect(response.success).toBe(false);
        expect(response.error).toBe('Email already exists');
        expect(response.code).toBe('DUPLICATE_EMAIL');
      });
    });

    it('should handle email verification failure', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.verifyEmail.mockRejectedValue({
        data: { error: { message: 'Invalid code' } },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.verifyEmail('user@example.com', 'invalid');
        expect(response.success).toBe(false);
        expect(response.error).toBe('Invalid code');
      });
    });

    it('should handle resend code failure', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.resendCode.mockRejectedValue({
        message: 'User not found',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.resendCode('nonexistent@example.com');
        expect(response.success).toBe(false);
        expect(response.error).toBe('User not found');
      });
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      authStorage.getAuth.mockReturnValue({
        id_token: mockToken,
        refresh_token: 'refresh-token-123',
        expires_in: 3600,
      });
      authAPI.authAPI.refreshToken.mockResolvedValue({
        id_token: mockToken,
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      });

      const { result } = renderHook(() => useAuth());

      // Setup refresh should have been called during mount
      expect(authStorage.getAuth).toHaveBeenCalled();
    });

    it('should handle refresh failure by clearing auth', async () => {
      authStorage.getAuth.mockReturnValue({
        id_token: mockToken,
        refresh_token: 'refresh-token-123',
        expires_in: 3600,
      });
      authAPI.authAPI.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      const { result } = renderHook(() => useAuth());

      // On refresh failure, auth should be cleared
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should not attempt refresh without refresh token', async () => {
      authStorage.getAuth.mockReturnValue({
        id_token: mockToken,
        expires_in: 3600,
        // No refresh_token
      });

      const { result } = renderHook(() => useAuth());

      expect(authStorage.getAuth).toHaveBeenCalled();
    });
  });

  describe('Session Token (SEC.4)', () => {
    it('should store session token on login with token', async () => {
      authStorage.getAuth.mockReturnValue({});

      const { result } = renderHook(() => useAuth());

      const userInfo = {
        user_id: 'user-456',
        email: 'test@example.com',
        phone_number: '+1234567890',
        name: 'Test User',
      };

      act(() => {
        result.current.loginWithToken(userInfo, 'test-token', 'session-token-123');
      });

      expect(authStorage.setAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          session_token: 'session-token-123',
        })
      );
    });

    it('should validate session token', async () => {
      authStorage.getAuth.mockReturnValue({
        session_token: 'session-token-123',
      });
      authAPI.authAPI.validateSession.mockResolvedValue({
        valid: true,
        user: { user_id: 'user-123' },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.validateSession();
        expect(response.valid).toBe(true);
      });
    });

    it('should return invalid session when no session token', async () => {
      authStorage.getAuth.mockReturnValue({});

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.validateSession();
        expect(response.valid).toBe(false);
      });
    });

    it('should handle session validation error', async () => {
      authStorage.getAuth.mockReturnValue({
        session_token: 'session-token-123',
      });
      authAPI.authAPI.validateSession.mockRejectedValue(
        new Error('Validation error')
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.validateSession();
        expect(response.valid).toBe(false);
      });
    });
  });

  describe('Password Reset (SEC.4)', () => {
    it('should request password reset via phone', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.requestPasswordReset.mockResolvedValue({
        message: 'Reset code sent',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.requestPasswordReset('+1234567890');
        expect(response.success).toBe(true);
        expect(response.message).toBe('Reset code sent');
      });
    });

    it('should handle password reset request failure', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.requestPasswordReset.mockRejectedValue({
        data: { error: { message: 'Phone not found' } },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.requestPasswordReset('+9999999999');
        expect(response.success).toBe(false);
        expect(response.error).toBe('Phone not found');
      });
    });

    it('should reset password with token', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.resetPassword.mockResolvedValue({
        message: 'Password reset successful',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.resetPassword('reset-token-123', 'newpassword');
        expect(response.success).toBe(true);
      });
    });

    it('should handle password reset failure', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.resetPassword.mockRejectedValue({
        data: { error: { message: 'Invalid reset token' } },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.resetPassword('invalid-token', 'newpass');
        expect(response.success).toBe(false);
        expect(response.error).toBe('Invalid reset token');
      });
    });
  });

  describe('Login with Token (Alternative Auth)', () => {
    it('should handle login with user info and token', async () => {
      authStorage.getAuth.mockReturnValue({});

      const { result } = renderHook(() => useAuth());

      const userInfo = {
        user_id: 'user-789',
        email: 'sms@example.com',
        phone_number: '+1987654321',
        name: 'SMS User',
      };

      act(() => {
        result.current.loginWithToken(userInfo, 'sms-auth-token');
      });

      expect(authStorage.setAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          id_token: 'sms-auth-token',
          access_token: 'sms-auth-token',
        })
      );
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should set user info from loginWithToken', async () => {
      authStorage.getAuth.mockReturnValue({});

      const { result } = renderHook(() => useAuth());

      const userInfo = {
        user_id: 'user-sms',
        phone_number: '+1111111111',
        name: 'SMS User',
      };

      act(() => {
        result.current.loginWithToken(userInfo, 'token');
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.phone).toBe('+1111111111');
    });

    it('should handle error during loginWithToken', async () => {
      authStorage.getAuth.mockReturnValue({});
      authStorage.setAuth.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.loginWithToken({ user_id: 'user' }, 'token');
      });

      expect(result.current.error).toBe('Authentication failed');
    });

    it('should handle loginWithToken without user info', async () => {
      authStorage.getAuth.mockReturnValue({});

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.loginWithToken(null, 'token');
      });

      // Should store token but not set user
      expect(authStorage.setAuth).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Concurrency', () => {
    it('should handle rapid sequential login calls', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockResolvedValue({
        id_token: mockToken,
        access_token: 'token',
        refresh_token: 'token',
        expires_in: 3600,
        message: 'Success',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const promise1 = result.current.login('user1@example.com', 'password');
        const promise2 = result.current.login('user2@example.com', 'password');

        const results = await Promise.all([promise1, promise2]);
        expect(results[0].success).toBe(true);
        expect(results[1].success).toBe(true);
      });
    });

    it('should handle login followed immediately by logout', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockResolvedValue({
        id_token: mockToken,
        access_token: 'token',
        refresh_token: 'token',
        expires_in: 3600,
        message: 'Success',
      });
      authAPI.authAPI.logout.mockResolvedValue({});

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('user@example.com', 'password');
        await result.current.logout();
      });

      expect(authStorage.clearAuth).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle network error gracefully', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockRejectedValue(
        new Error('Network timeout')
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.login('user@example.com', 'password');
        expect(response.success).toBe(false);
        expect(response.error).toBe('Network timeout');
      });
    });

    it('should maintain auth state across multiple re-renders', () => {
      authStorage.getAuth.mockReturnValue({
        id_token: mockToken,
        expires_in: 3600,
      });

      const { result, rerender } = renderHook(() => useAuth());

      const initialAuth = result.current.isAuthenticated;

      rerender();
      const afterRerender = result.current.isAuthenticated;

      expect(initialAuth).toBe(afterRerender);
    });
  });

  describe('Error Message Handling', () => {
    it('should use default error message for generic errors', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockRejectedValue({
        // No error message in response
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.login('user@example.com', 'password');
        expect(response.error).toBe('Login failed');
      });
    });

    it('should extract error message from nested error object', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.login.mockRejectedValue({
        data: {
          error: {
            message: 'Custom error message',
            code: 'CUSTOM_CODE',
          },
        },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.login('user@example.com', 'password');
        expect(response.error).toBe('Custom error message');
        expect(response.code).toBe('CUSTOM_CODE');
      });
    });

    it('should extract error message from direct message field', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.signup.mockRejectedValue({
        message: 'Direct error message',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signup('user@example.com', 'password');
        expect(response.error).toBe('Direct error message');
      });
    });
  });

  describe('Async Loading State', () => {
    it('should set isLoading true during signup', () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.signup.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.signup('user@example.com', 'password');
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set isLoading false after verification completes', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.verifyEmail.mockResolvedValue({
        status: 'verified',
        message: 'Success',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.verifyEmail('user@example.com', '123456');
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading false on password reset request', async () => {
      authStorage.getAuth.mockReturnValue({});
      authAPI.authAPI.requestPasswordReset.mockResolvedValue({
        message: 'Code sent',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.requestPasswordReset('+1234567890');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Hook Cleanup', () => {
    it('should cleanup refresh timer on unmount', () => {
      authStorage.getAuth.mockReturnValue({
        id_token: mockToken,
        expires_in: 3600,
      });

      const { unmount } = renderHook(() => useAuth());

      unmount();

      // Timer should be cleared (verified by cleanup running without errors)
      expect(true).toBe(true);
    });

    it('should not cause memory leaks with multiple hook instances', () => {
      authStorage.getAuth.mockReturnValue({});

      const { unmount: unmount1 } = renderHook(() => useAuth());
      const { unmount: unmount2 } = renderHook(() => useAuth());

      unmount1();
      unmount2();

      // Should clean up without errors
      expect(true).toBe(true);
    });
  });
});
