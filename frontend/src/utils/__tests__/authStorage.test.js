import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setAuth,
  getAuth,
  clearAuth,
  isAuthenticated,
  isTokenExpired,
  getAuthToken,
  getRefreshToken,
  getUserId,
  setUserId,
  getTokenExpiryTime,
  updateToken,
} from '../authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('setAuth and getAuth', () => {
    it('stores and retrieves auth object', () => {
      const authData = {
        id_token: 'token123',
        access_token: 'access123',
        refresh_token: 'refresh123',
        expires_in: 3600,
      };

      setAuth(authData);
      const retrieved = getAuth();

      expect(retrieved.id_token).toBe('token123');
      expect(retrieved.access_token).toBe('access123');
      expect(retrieved.refresh_token).toBe('refresh123');
      expect(retrieved.expires_in).toBe(3600);
    });

    it('returns empty object when no auth stored', () => {
      const result = getAuth();
      expect(result).toEqual({});
    });
  });

  describe('clearAuth', () => {
    it('removes all auth data from localStorage', () => {
      const authData = {
        id_token: 'token123',
        refresh_token: 'refresh123',
        expires_in: 3600,
      };
      setAuth(authData);
      setUserId('user123');

      clearAuth();

      expect(getAuth()).toEqual({});
      expect(getUserId()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when valid token exists', () => {
      setAuth({
        id_token: 'token123',
        expires_in: 3600,
      });

      expect(isAuthenticated()).toBe(true);
    });

    it('returns false when no token exists', () => {
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('returns true for expired token', () => {
      const expiredAuth = {
        id_token: 'token123',
        expires_in: 1, // 1 second (will be expired almost immediately)
        timestamp: Date.now() - 10000, // 10 seconds ago
      };
      localStorage.setItem('scamguard_auth', JSON.stringify(expiredAuth));

      expect(isTokenExpired()).toBe(true);
    });

    it('returns false for valid token', () => {
      const validAuth = {
        id_token: 'token123',
        expires_in: 3600, // 1 hour
        timestamp: Date.now(),
      };
      localStorage.setItem('scamguard_auth', JSON.stringify(validAuth));

      expect(isTokenExpired()).toBe(false);
    });

    it('returns true when no token exists', () => {
      expect(isTokenExpired()).toBe(true);
    });
  });

  describe('getAuthToken', () => {
    it('returns id_token when stored', () => {
      setAuth({
        id_token: 'mytoken123',
        expires_in: 3600,
      });

      expect(getAuthToken()).toBe('mytoken123');
    });

    it('returns null when no token exists', () => {
      expect(getAuthToken()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('returns refresh_token when stored', () => {
      setAuth({
        id_token: 'token123',
        refresh_token: 'refreshtoken456',
        expires_in: 3600,
      });

      expect(getRefreshToken()).toBe('refreshtoken456');
    });

    it('returns null when no refresh token exists', () => {
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe('getUserId and setUserId', () => {
    it('stores and retrieves user ID', () => {
      setUserId('user123');
      expect(getUserId()).toBe('user123');
    });

    it('returns null when no user ID is stored', () => {
      expect(getUserId()).toBeNull();
    });
  });

  describe('getTokenExpiryTime', () => {
    it('returns positive milliseconds for valid token', () => {
      const futureAuth = {
        id_token: 'token123',
        expires_in: 3600, // 1 hour
        timestamp: Date.now(),
      };
      localStorage.setItem('scamguard_auth', JSON.stringify(futureAuth));

      const expiryTime = getTokenExpiryTime();
      expect(expiryTime).toBeGreaterThan(0);
    });

    it('returns -1 for expired token', () => {
      const expiredAuth = {
        id_token: 'token123',
        expires_in: 1,
        timestamp: Date.now() - 10000,
      };
      localStorage.setItem('scamguard_auth', JSON.stringify(expiredAuth));

      expect(getTokenExpiryTime()).toBe(-1);
    });
  });

  describe('updateToken', () => {
    it('updates token in existing auth', () => {
      const originalAuth = {
        id_token: 'oldtoken',
        refresh_token: 'refresh123',
        expires_in: 3600,
      };
      setAuth(originalAuth);

      updateToken('newtoken');

      const updated = getAuth();
      expect(updated.id_token).toBe('newtoken');
      expect(updated.access_token).toBe('newtoken');
      expect(updated.refresh_token).toBe('refresh123');
    });
  });
});
