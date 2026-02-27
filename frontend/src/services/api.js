/**
 * Centralized API service for ScamGuard backend
 * Handles authentication, request/response formatting, and token management
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

/**
 * Retrieve the stored JWT token from localStorage
 */
function getAuthToken() {
  try {
    const auth = JSON.parse(localStorage.getItem('scamguard_auth') || '{}');
    return auth.id_token || auth.idToken || null;
  } catch {
    return null;
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

  // Retry once on 401 (token might have expired)
  if (response.status === 401 && token) {
    // In a real app, would refresh token here
    // For now, clear auth and require re-login
    localStorage.removeItem('scamguard_auth');
    localStorage.removeItem('userId');

    // Retry without token
    token = null;
    const retryHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    response = await fetch(url, {
      ...options,
      headers: retryHeaders,
    });
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

const api = {
  authAPI,
  analysisAPI,
  apiCall,
};

export default api;
