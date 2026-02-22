/**
 * useAuth - Authentication state management hook
 * Integrates with Cognito via API Lambda and manages JWT tokens
 */

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

/**
 * Decode JWT token to extract claims (without verification)
 */
function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
}

/**
 * Check if token is still valid (hasn't expired)
 */
function isTokenValid(token) {
  if (!token) return false;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp > now;
}

/**
 * Extract user info from token
 */
function getUserFromToken(token) {
  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    sub: decoded.sub,
    email: decoded.email,
  };
}

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check for existing valid token on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const auth = JSON.parse(localStorage.getItem('scamguard_auth') || '{}');
        const token = auth.id_token || auth.idToken;

        if (token && isTokenValid(token)) {
          const userData = getUserFromToken(token);
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
            // Store userId for backward compatibility
            localStorage.setItem('userId', userData.sub);
          }
        } else {
          // Token is invalid or missing
          localStorage.removeItem('scamguard_auth');
          localStorage.removeItem('userId');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Signup new user
   */
  const signup = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authAPI.signup(email, password);
      return {
        success: true,
        userId: result.user_id,
        status: result.status,
        message: result.message,
      };
    } catch (err) {
      const errorMsg = err.data?.error?.message || err.message || 'Signup failed';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
        code: err.data?.error?.code,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verify email with code
   */
  const verifyEmail = useCallback(async (email, code) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authAPI.verifyEmail(email, code);
      return {
        success: true,
        status: result.status,
        message: result.message,
      };
    } catch (err) {
      const errorMsg = err.data?.error?.message || err.message || 'Verification failed';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
        code: err.data?.error?.code,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Resend verification code
   */
  const resendCode = useCallback(async (email) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authAPI.resendCode(email);
      return {
        success: true,
        message: result.message,
      };
    } catch (err) {
      const errorMsg = err.data?.error?.message || err.message || 'Resend failed';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
        code: err.data?.error?.code,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login with credentials
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authAPI.login(email, password);

      // Store tokens
      const authData = {
        id_token: result.id_token,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
        timestamp: Date.now(),
      };
      localStorage.setItem('scamguard_auth', JSON.stringify(authData));

      // Extract user info from token
      const userData = getUserFromToken(result.id_token);
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        // Store userId for backward compatibility
        localStorage.setItem('userId', userData.sub);
      }

      return {
        success: true,
        user: userData,
        message: result.message,
      };
    } catch (err) {
      const errorMsg = err.data?.error?.message || err.message || 'Login failed';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
        code: err.data?.error?.code,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call logout endpoint (fire-and-forget)
      await authAPI.logout();
    } catch (err) {
      console.warn('Logout API call failed:', err);
    }

    // Clear local auth state
    localStorage.removeItem('scamguard_auth');
    localStorage.removeItem('userId');
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);

    return { success: true };
  }, []);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Methods
    signup,
    verifyEmail,
    resendCode,
    login,
    logout,

    // Utilities
    clearError: () => setError(null),
  };
}
