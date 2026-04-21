/**
 * Centralized API service for ScamGuard backend
 * Handles authentication, request/response formatting, and token management
 */

import { getAuthToken, getRefreshToken, setAuth, clearAuth } from '../utils/authStorage';

// Configuration-driven API base URL
// Falls back to localhost for development, but respects VITE_API_BASE_URL env var for staging/prod
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.DEV ? 'http://localhost:3001/api/v1' : '/api/v1'
);

/**
 * Attempt to refresh the JWT token using refresh_token
 */
async function refreshAccessToken() {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const result = data.data || data;

    // Store new tokens
    setAuth({
      id_token: result.id_token,
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: result.expires_in,
    });

    return true;
  } catch (err) {
    console.error('Token refresh failed:', err);
    return false;
  }
}

/**
 * Make an authenticated API request with automatic token refresh on 401
 */
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  let token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Retry once on 401 (token might have expired, try to refresh)
  if (response.status === 401 && token) {
    // Try to refresh the token
    const refreshSuccess = await refreshAccessToken();

    if (refreshSuccess) {
      // Get new token and retry request
      token = getAuthToken();
      const retryHeaders = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        retryHeaders['Authorization'] = `Bearer ${token}`;
      }

      response = await fetch(url, {
        ...options,
        headers: retryHeaders,
      });
    } else {
      // Refresh failed, clear auth and retry without token
      clearAuth();

      const retryHeaders = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      response = await fetch(url, {
        ...options,
        headers: retryHeaders,
      });
    }
  }

  // Parse response
  let data;
  try {
    data = await response.json();
  } catch {
    data = { error: 'Invalid response from server' };
  }

  if (!response.ok) {
    const error = new Error(data.error?.message || 'API request failed');
    error.statusCode = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Authentication endpoints
 */
export const authAPI = {
  signup: async (email, password) => {
    const response = await apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.data;
  },

  verifyEmail: async (email, code) => {
    const response = await apiCall('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    return response.data;
  },

  resendCode: async (email) => {
    const response = await apiCall('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.data;
  },

  logout: async () => {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } catch {
      // Logout from backend failed, but clear local auth anyway
    }
  },

  // Phase 4B: Token refresh
  refreshToken: async (refreshToken) => {
    const response = await apiCall('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return response.data;
  },

  // Phase 4.4: SMS OTP authentication
  requestSmsOtp: async (email, phone, password) => {
    const response = await apiCall('/auth/request-sms-otp', {
      method: 'POST',
      body: JSON.stringify({ email, phone, password }),
    });
    return response.data;
  },

  verifySmsOtp: async (email, phone, code, password) => {
    const response = await apiCall('/auth/verify-sms-otp', {
      method: 'POST',
      body: JSON.stringify({ email, phone, code, password }),
    });
    return response.data;
  },

  // SEC.4: Password reset
  requestPasswordReset: async (phone) => {
    const response = await apiCall('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    return response.data;
  },

  resetPassword: async (resetToken, newPassword) => {
    const response = await apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
    });
    return response.data;
  },

  // SEC.4: Session management
  validateSession: async (sessionToken) => {
    const response = await apiCall('/auth/validate-session', {
      method: 'POST',
      body: JSON.stringify({ session_token: sessionToken }),
    });
    return response.data;
  },

  refreshSession: async (sessionToken) => {
    const response = await apiCall('/auth/refresh-session', {
      method: 'POST',
      body: JSON.stringify({ session_token: sessionToken }),
    });
    return response.data;
  },

  // SEC.4: Security status (development only)
  getSecurityStatus: async () => {
    const response = await apiCall('/auth/security-status', {
      method: 'GET',
    });
    return response.data;
  },
};

/**
 * Analysis endpoints
 */
export const analysisAPI = {
  analyze: async (userResponse, userId = 'anonymous', scenario = null, imageBase64 = null) => {
    const response = await apiCall('/analysis', {
      method: 'POST',
      body: JSON.stringify({
        action: 'analyze',
        userId,
        userResponse,
        scenario,
        imageBase64,
      }),
    });
    return response.data;
  },

  generateScenario: async (userId = 'anonymous') => {
    const response = await apiCall('/api/v1/scenarios', {
      method: 'POST',
      body: JSON.stringify({
        action: 'generate_scenario',
        userId,
      }),
    });
    return response.data;
  },

  getProfile: async (userId = 'anonymous') => {
    const response = await apiCall('/profile', {
      method: 'POST',
      body: JSON.stringify({
        action: 'get_profile',
        userId,
      }),
    });
    return response.data;
  },

  saveProfile: async (userId = 'anonymous', profile = {}) => {
    const response = await apiCall('/profile', {
      method: 'POST',
      body: JSON.stringify({
        action: 'save_profile',
        userId,
        profile,
      }),
    });
    return response.data;
  },

  getAnalytics: async (userId = 'anonymous') => {
    const response = await apiCall('/analytics', {
      method: 'POST',
      body: JSON.stringify({
        action: 'get_analytics',
        userId,
      }),
    });
    return response.data;
  },
};

/**
 * Tools endpoints - Phase 5C
 */
export const toolsAPI = {
  checkEmailBreach: async (email) => {
    const response = await apiCall('/tools/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response.data;
  },

  checkFinancialAdvisor: async (advisorName, firmName = '') => {
    const response = await apiCall('/tools/check-advisor', {
      method: 'POST',
      body: JSON.stringify({ advisorName, firmName }),
    });
    return response.data;
  },
};

const api = {
  authAPI,
  analysisAPI,
  toolsAPI,
  apiCall,
};

export default api;
