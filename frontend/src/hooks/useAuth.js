/**
 * useAuth - Authentication state management hook
 * Integrates with Cognito via API Lambda and manages JWT tokens
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';
import { getAuth, setAuth, clearAuth, setUserId, getAuthToken } from '../utils/authStorage';

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
  const refreshTimerRef = useRef(null);

  // Refresh token using refresh_token
  const refreshAuthToken = useCallback(async () => {
    try {
      const auth = getAuth();
      const refreshToken = auth.refresh_token;

      if (!refreshToken) {
        console.warn('No refresh token available');
        return false;
      }

      // Call refresh token endpoint
      const result = await authAPI.refreshToken(refreshToken);

      // Store new tokens
      setAuth({
        id_token: result.id_token,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
      });

      // Update user from new token
      const userData = getUserFromToken(result.id_token);
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }

      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      // Refresh failed, clear auth
      clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // Setup token refresh timer
  const setupRefreshTimer = useCallback((expiresIn) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Refresh token 5 minutes before expiration
    const refreshBeforeExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
    const timeUntilRefresh = Math.max(expiresIn * 1000 - refreshBeforeExpiry, 1000);

    const newTimer = setTimeout(async () => {
      const success = await refreshAuthToken();
      if (success) {
        // Recursively setup next refresh
        setupRefreshTimer(expiresIn);
      }
    }, timeUntilRefresh);

    refreshTimerRef.current = newTimer;
  }, [refreshAuthToken]);

  // Check for existing valid token on mount and setup refresh
  useEffect(() => {
    const checkAuth = () => {
      try {
        const auth = getAuth();
        const token = auth.id_token || auth.idToken;
        const expiresIn = auth.expires_in || 3600;

        if (token && isTokenValid(token)) {
          const userData = getUserFromToken(token);
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
            // Store userId for backward compatibility
            setUserId(userData.sub);
            // Setup auto-refresh timer
            setupRefreshTimer(expiresIn);
          }
        } else {
          // Token is invalid or missing
          clearAuth();
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

    // Cleanup timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [setupRefreshTimer]);

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
      setAuth({
        id_token: result.id_token,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
      });

      // Extract user info from token
      const userData = getUserFromToken(result.id_token);
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        // Store userId for backward compatibility
        setUserId(userData.sub);
        // Setup auto-refresh timer
        setupRefreshTimer(result.expires_in);
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
  }, [setupRefreshTimer]);

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
    clearAuth();
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);

    return { success: true };
  }, []);

  /**
   * Request a password reset link (SEC.4)
   */
  const requestPasswordReset = useCallback(async (phone) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authAPI.requestPasswordReset(phone);
      return {
        success: true,
        message: result.message,
      };
    } catch (err) {
      const errorMsg = err.data?.error?.message || err.message || 'Password reset request failed';
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
   * Reset password using a reset token (SEC.4)
   */
  const resetPassword = useCallback(async (token, newPassword) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authAPI.resetPassword(token, newPassword);
      return {
        success: true,
        message: result.message,
      };
    } catch (err) {
      const errorMsg = err.data?.error?.message || err.message || 'Password reset failed';
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
   * Validate the current session token (SEC.4)
   */
  const validateSession = useCallback(async () => {
    const auth = getAuth();
    const sessionToken = auth.session_token;

    if (!sessionToken) {
      return { valid: false };
    }

    try {
      const result = await authAPI.validateSession(sessionToken);
      return {
        valid: result.valid,
        user: result.user,
      };
    } catch (err) {
      return { valid: false };
    }
  }, []);

  /**
   * Login with token (SMS OTP or direct token)
   * Used for SMS-based authentication where we get token directly
   */
  const loginWithToken = useCallback((userInfo, token, sessionToken) => {
    try {
      // Store token (SMS tokens are base64-encoded JSON, not JWT with 3 parts)
      // For now, treat as simple token storage
      setAuth({
        id_token: token,
        access_token: token,
        refresh_token: token,
        expires_in: 3600,
        ...(sessionToken ? { session_token: sessionToken } : {}),
      });

      // Set user info
      if (userInfo) {
        setUser({
          sub: userInfo.user_id || userInfo.id,
          phone: userInfo.phone_number,
          name: userInfo.name || 'User',
        });
        setUserId(userInfo.user_id || userInfo.id);
        setIsAuthenticated(true);
        setupRefreshTimer(3600);
      }

      return {
        success: true,
        user: userInfo,
      };
    } catch (err) {
      console.error('Login with token failed:', err);
      setError('Authentication failed');
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }, [setupRefreshTimer]);

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
    loginWithToken,
    logout,

    // SEC.4: Password reset & session management
    requestPasswordReset,
    resetPassword,
    validateSession,

    // Utilities
    clearError: () => setError(null),
  };
}
