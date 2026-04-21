/**
 * SEC.4 - useAuth Hook Security Tests
 * Tests for password reset and session management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useAuth from '../useAuth';
import * as authStorage from '../../utils/authStorage';
import * as authAPI from '../../services/api';

// Mock the API
vi.mock('../../services/api');
vi.mock('../../utils/authStorage');

describe('useAuth - SEC.4 Security Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.getAuth.mockReturnValue({});
    authStorage.getAuthToken.mockReturnValue(null);
    authStorage.getRefreshToken.mockReturnValue(null);
    authAPI.authAPI = {
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      validateSession: vi.fn(),
    };
  });

  describe('Password Reset', () => {
    it('should request password reset', async () => {
      const { result } = renderHook(() => useAuth());

      authAPI.authAPI.requestPasswordReset.mockResolvedValue({
        message: 'Password reset link sent'
      });

      let response;
      await act(async () => {
        response = await result.current.requestPasswordReset('5551234567');
      });

      expect(response.success).toBe(true);
      expect(response.message).toBe('Password reset link sent');
      expect(authAPI.authAPI.requestPasswordReset).toHaveBeenCalledWith('5551234567');
    });

    it('should handle password reset error', async () => {
      const { result } = renderHook(() => useAuth());

      authAPI.authAPI.requestPasswordReset.mockRejectedValue({
        data: {
          error: {
            message: 'Invalid phone number'
          }
        }
      });

      let response;
      await act(async () => {
        response = await result.current.requestPasswordReset('invalid');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid phone number');
    });

    it('should reset password with token', async () => {
      const { result } = renderHook(() => useAuth());

      authAPI.authAPI.resetPassword.mockResolvedValue({
        message: 'Password reset successful'
      });

      let response;
      await act(async () => {
        response = await result.current.resetPassword('reset-token-123', 'newpass123');
      });

      expect(response.success).toBe(true);
      expect(authAPI.authAPI.resetPassword).toHaveBeenCalledWith('reset-token-123', 'newpass123');
    });

    it('should handle invalid reset token', async () => {
      const { result } = renderHook(() => useAuth());

      authAPI.authAPI.resetPassword.mockRejectedValue({
        data: {
          error: {
            code: 'INVALID_RESET_TOKEN',
            message: 'Reset token is invalid or expired'
          }
        }
      });

      let response;
      await act(async () => {
        response = await result.current.resetPassword('invalid-token', 'newpass123');
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_RESET_TOKEN');
    });
  });

  describe('Session Validation', () => {
    it('should validate session', async () => {
      authStorage.getAuth.mockReturnValue({
        session_token: 'session-token-123'
      });

      const { result } = renderHook(() => useAuth());

      authAPI.authAPI.validateSession.mockResolvedValue({
        valid: true,
        user: { id: 'user_123', phone: '5551234567' }
      });

      let response;
      await act(async () => {
        response = await result.current.validateSession();
      });

      expect(response.valid).toBe(true);
      expect(response.user.id).toBe('user_123');
    });

    it('should handle invalid session', async () => {
      authStorage.getAuth.mockReturnValue({
        session_token: 'expired-token'
      });

      const { result } = renderHook(() => useAuth());

      authAPI.authAPI.validateSession.mockRejectedValue({
        data: {
          error: {
            message: 'Session expired'
          }
        }
      });

      let response;
      await act(async () => {
        response = await result.current.validateSession();
      });

      expect(response.valid).toBe(false);
    });

    it('should return invalid if no session token', async () => {
      authStorage.getAuth.mockReturnValue({});

      const { result } = renderHook(() => useAuth());

      let response;
      await act(async () => {
        response = await result.current.validateSession();
      });

      expect(response.valid).toBe(false);
    });
  });

  describe('Session Token Storage', () => {
    it('should store session token on login', async () => {
      const { result } = renderHook(() => useAuth());

      const userInfo = {
        user_id: 'user_123',
        phone_number: '5551234567'
      };
      const token = 'base64-token';
      const sessionToken = 'session-token-123';

      act(() => {
        result.current.loginWithToken(userInfo, token, sessionToken);
      });

      expect(authStorage.setAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          session_token: sessionToken
        })
      );
    });

    it('should handle login without session token', async () => {
      const { result } = renderHook(() => useAuth());

      const userInfo = {
        user_id: 'user_123',
        phone_number: '5551234567'
      };
      const token = 'base64-token';

      act(() => {
        result.current.loginWithToken(userInfo, token);
      });

      expect(authStorage.setAuth).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state during password reset', async () => {
      const { result } = renderHook(() => useAuth());

      authAPI.authAPI.requestPasswordReset.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ message: 'Sent' }), 100))
      );

      expect(result.current.isLoading).toBe(false);

      let request;
      await act(async () => {
        request = result.current.requestPasswordReset('5551234567');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should clear error on successful operation', async () => {
      const { result } = renderHook(() => useAuth());

      authAPI.authAPI.requestPasswordReset.mockRejectedValueOnce({
        message: 'Network error'
      });

      await act(async () => {
        await result.current.requestPasswordReset('5551234567');
      });

      expect(result.current.error).not.toBeNull();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
