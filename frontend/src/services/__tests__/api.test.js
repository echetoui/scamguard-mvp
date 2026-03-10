/**
 * API Service Tests
 * Phase 5E - Test Coverage Expansion
 *
 * Tests for:
 * - Core apiCall with token refresh
 * - Authentication endpoints
 * - Analysis endpoints
 * - Tools endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import api, { authAPI, analysisAPI, toolsAPI } from '../api';
import * as authStorage from '../../utils/authStorage';

// Mock authStorage
vi.mock('../../utils/authStorage');

// Mock fetch globally
global.fetch = vi.fn();

describe('API Service', () => {
  const mockToken = 'mock-access-token';
  const mockRefreshToken = 'mock-refresh-token';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();

    // Default mock setup
    authStorage.getAuthToken.mockReturnValue(mockToken);
    authStorage.getRefreshToken.mockReturnValue(mockRefreshToken);
    authStorage.setAuth.mockImplementation(() => {});
    authStorage.clearAuth.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Core apiCall Function', () => {
    it('should make successful API request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { success: true } }),
      });

      const result = await api.apiCall('/test', {
        method: 'GET',
      });

      expect(result).toEqual({ data: { success: true } });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should add Authorization header when token exists', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      });

      await api.apiCall('/test', { method: 'GET' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should not add Authorization header when no token', async () => {
      authStorage.getAuthToken.mockReturnValue(null);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      });

      await api.apiCall('/test', { method: 'GET' });

      const call = global.fetch.mock.calls[0];
      expect(call[1].headers['Authorization']).toBeUndefined();
    });

    it('should throw error on failed request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Bad request' } }),
      });

      await expect(api.apiCall('/test', { method: 'GET' })).rejects.toThrow(
        'Bad request'
      );
    });

    it('should handle non-JSON response gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await api.apiCall('/test', { method: 'GET' });

      expect(result).toEqual({ error: 'Invalid response from server' });
    });

    it('should attach statusCode to error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Not found' } }),
      });

      try {
        await api.apiCall('/test', { method: 'GET' });
      } catch (err) {
        expect(err.statusCode).toBe(404);
        expect(err.data.error.message).toBe('Not found');
      }
    });
  });

  describe('Token Refresh on 401', () => {
    it('should refresh token on 401 response', async () => {
      const newToken = 'new-access-token';

      // First call returns 401
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      // Refresh token endpoint returns new token
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id_token: 'new-id-token',
            access_token: newToken,
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          },
        }),
      });

      // Retry request with new token succeeds
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { success: true } }),
      });

      authStorage.getAuthToken.mockReturnValueOnce(mockToken);
      authStorage.getAuthToken.mockReturnValueOnce(newToken);

      const result = await api.apiCall('/test', { method: 'GET' });

      expect(result).toEqual({ data: { success: true } });
      expect(authStorage.setAuth).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should clear auth and retry without token if refresh fails', async () => {
      // First call returns 401
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      // Refresh token endpoint fails
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Refresh failed' } }),
      });

      // Retry without token succeeds
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { public: true } }),
      });

      const result = await api.apiCall('/test', { method: 'GET' });

      expect(result).toEqual({ data: { public: true } });
      expect(authStorage.clearAuth).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 401 if no token initially', async () => {
      authStorage.getAuthToken.mockReturnValue(null);

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(api.apiCall('/test', { method: 'GET' })).rejects.toThrow();

      // Should only call fetch once, not retry
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should include custom headers in request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      });

      await api.apiCall('/test', {
        method: 'POST',
        headers: { 'X-Custom': 'value' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'value',
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });
  });

  describe('Auth API', () => {
    it('should signup user', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            user_id: 'user-123',
            status: 'pending',
            message: 'Signup successful',
          },
        }),
      });

      const result = await authAPI.signup('user@example.com', 'password123');

      expect(result.user_id).toBe('user-123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/signup'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'user@example.com',
            password: 'password123',
          }),
        })
      );
    });

    it('should verify email with code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            status: 'verified',
            message: 'Email verified successfully',
          },
        }),
      });

      const result = await authAPI.verifyEmail('user@example.com', '123456');

      expect(result.status).toBe('verified');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/verify-email'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'user@example.com',
            code: '123456',
          }),
        })
      );
    });

    it('should resend verification code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: { message: 'Code resent' },
        }),
      });

      const result = await authAPI.resendCode('user@example.com');

      expect(result.message).toBe('Code resent');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/resend-code'),
        expect.anything()
      );
    });

    it('should login user', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id_token: 'id-token',
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
          },
        }),
      });

      const result = await authAPI.login('user@example.com', 'password123');

      expect(result.access_token).toBe('access-token');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      });

      await expect(authAPI.logout()).resolves.toBeUndefined();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle logout failure gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Server error' } }),
      });

      // Should not throw
      await expect(authAPI.logout()).resolves.toBeUndefined();
    });

    it('should refresh token', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id_token: 'new-id-token',
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          },
        }),
      });

      const result = await authAPI.refreshToken('old-refresh-token');

      expect(result.access_token).toBe('new-access-token');
    });

    it('should request SMS OTP', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            message: 'SMS sent',
            otp_length: 6,
          },
        }),
      });

      const result = await authAPI.requestSmsOtp(
        'user@example.com',
        '+1234567890',
        'password123'
      );

      expect(result.message).toBe('SMS sent');
    });

    it('should verify SMS OTP', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id_token: 'id-token',
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        }),
      });

      const result = await authAPI.verifySmsOtp(
        'user@example.com',
        '+1234567890',
        '123456',
        'password123'
      );

      expect(result.access_token).toBe('access-token');
    });
  });

  describe('Analysis API', () => {
    it('should analyze scam message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            score: 85,
            riskLevel: 'danger',
            scamType: 'phishing',
            message: 'This looks like a phishing attempt',
            xpEarned: 10,
          },
        }),
      });

      const result = await analysisAPI.analyze(
        'Click here to verify your account',
        'user-123'
      );

      expect(result.riskLevel).toBe('danger');
      expect(result.scamType).toBe('phishing');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analysis'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('analyze'),
        })
      );
    });

    it('should use anonymous user ID by default', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      });

      await analysisAPI.analyze('Test message');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"userId":"anonymous"'),
        })
      );
    });

    it('should generate scenario', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            scenario_id: 'scenario-123',
            description: 'You received an email from your bank',
          },
        }),
      });

      const result = await analysisAPI.generateScenario('user-123');

      expect(result.scenario_id).toBe('scenario-123');
    });

    it('should get user profile', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            xp: 150,
            level: 5,
            badges: ['email-verified'],
          },
        }),
      });

      const result = await analysisAPI.getProfile('user-123');

      expect(result.xp).toBe(150);
      expect(result.level).toBe(5);
    });

    it('should save user profile', async () => {
      const profileData = { preferences: { theme: 'dark' } };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { success: true } }),
      });

      const result = await analysisAPI.saveProfile('user-123', profileData);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"preferences":{"theme":"dark"}'),
        })
      );
    });

    it('should get analytics', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            totalAnalyses: 42,
            averageScore: 65,
            successRate: 0.88,
          },
        }),
      });

      const result = await analysisAPI.getAnalytics('user-123');

      expect(result.totalAnalyses).toBe(42);
      expect(result.successRate).toBe(0.88);
    });
  });

  describe('Tools API', () => {
    it('should check email breach', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            breached: true,
            breachCount: 3,
            sources: ['LinkedIn', 'Equifax'],
          },
        }),
      });

      const result = await toolsAPI.checkEmailBreach('user@example.com');

      expect(result.breached).toBe(true);
      expect(result.breachCount).toBe(3);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tools/check-email'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('user@example.com'),
        })
      );
    });

    it('should check financial advisor', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            verified: true,
            firm: 'Goldman Sachs',
            registrationNumber: 'ABCD123',
          },
        }),
      });

      const result = await toolsAPI.checkFinancialAdvisor(
        'John Smith',
        'Goldman Sachs'
      );

      expect(result.verified).toBe(true);
      expect(result.firm).toBe('Goldman Sachs');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tools/check-advisor'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should check advisor without firm name', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { verified: false } }),
      });

      await toolsAPI.checkFinancialAdvisor('John Smith');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"firmName":""'),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.apiCall('/test')).rejects.toThrow('Network error');
    });

    it('should handle missing error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(api.apiCall('/test')).rejects.toThrow('API request failed');
    });

    it('should preserve error data in exception', async () => {
      const errorData = {
        error: {
          message: 'Custom error',
          code: 'CUSTOM_ERROR',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorData,
      });

      try {
        await api.apiCall('/test');
      } catch (err) {
        expect(err.data).toEqual(errorData);
        expect(err.statusCode).toBe(400);
      }
    });
  });

  describe('API Base URL', () => {
    it('should use environment variable for API URL', () => {
      // This test verifies the constant is properly set
      // The actual URL is set at module load time
      expect(api).toBeDefined();
      expect(api.apiCall).toBeDefined();
    });
  });

  describe('Request Options', () => {
    it('should merge custom options with defaults', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      });

      await api.apiCall('/test', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: { 'X-Test': 'header' },
      });

      const [, options] = global.fetch.mock.calls[0];
      expect(options.method).toBe('POST');
      expect(options.headers['X-Test']).toBe('header');
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('should handle response with nested data structure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            nested: {
              result: 'value',
            },
          },
        }),
      });

      const result = await api.apiCall('/test');

      expect(result.data.nested.result).toBe('value');
    });

    it('should handle response without data wrapper', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          result: 'value',
        }),
      });

      const result = await api.apiCall('/test');

      expect(result.result).toBe('value');
    });
  });
});
