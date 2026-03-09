/**
 * Authentication Storage Utilities
 * Centralized auth token and credential management
 *
 * Replaces 14+ instances of direct localStorage access with consistent helpers
 * Provides type-safe, error-resistant token management
 */

const AUTH_KEY = 'scamguard_auth';
const USER_ID_KEY = 'userId';

/**
 * Get the complete auth object from localStorage
 * @returns {object} Auth object with id_token, refresh_token, etc.
 */
export function getAuth() {
  try {
    const auth = localStorage.getItem(AUTH_KEY);
    return auth ? JSON.parse(auth) : {};
  } catch (error) {
    console.error('Failed to parse auth from storage:', error);
    return {};
  }
}

/**
 * Get the access token (JWT) from localStorage
 * @returns {string|null} Access token or null if not found
 */
export function getAuthToken() {
  try {
    const auth = getAuth();
    return auth.id_token || auth.idToken || auth.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Get the refresh token from localStorage
 * @returns {string|null} Refresh token or null if not found
 */
export function getRefreshToken() {
  try {
    const auth = getAuth();
    return auth.refresh_token || null;
  } catch {
    return null;
  }
}

/**
 * Store auth tokens in localStorage
 * @param {object} authData - Auth data object
 * @param {string} authData.id_token - Access JWT token
 * @param {string} authData.refresh_token - Refresh token
 * @param {number} authData.expires_in - Token expiry in seconds
 */
export function setAuth(authData) {
  try {
    const auth = {
      id_token: authData.id_token,
      access_token: authData.access_token || authData.id_token,
      refresh_token: authData.refresh_token,
      expires_in: authData.expires_in,
      timestamp: Date.now(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    return true;
  } catch (error) {
    console.error('Failed to store auth:', error);
    return false;
  }
}

/**
 * Clear all auth from localStorage
 */
export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_ID_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear auth:', error);
    return false;
  }
}

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean}
 */
export function isAuthenticated() {
  const token = getAuthToken();
  return !!token;
}

/**
 * Get the stored user ID
 * @returns {string|null}
 */
export function getUserId() {
  try {
    return localStorage.getItem(USER_ID_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Store user ID
 * @param {string} userId
 */
export function setUserId(userId) {
  try {
    if (userId) {
      localStorage.setItem(USER_ID_KEY, userId);
    }
    return true;
  } catch (error) {
    console.error('Failed to store userId:', error);
    return false;
  }
}

/**
 * Check if token is expired
 * @returns {boolean}
 */
export function isTokenExpired() {
  try {
    const auth = getAuth();
    if (!auth.timestamp || !auth.expires_in) {
      return true;
    }

    const expiryTime = auth.timestamp + (auth.expires_in * 1000);
    return Date.now() > expiryTime;
  } catch {
    return true;
  }
}

/**
 * Get time until token expiry (ms)
 * @returns {number} Milliseconds until expiry, or -1 if expired
 */
export function getTokenExpiryTime() {
  try {
    const auth = getAuth();
    if (!auth.timestamp || !auth.expires_in) {
      return -1;
    }

    const expiryTime = auth.timestamp + (auth.expires_in * 1000);
    const timeLeft = expiryTime - Date.now();
    return timeLeft > 0 ? timeLeft : -1;
  } catch {
    return -1;
  }
}

/**
 * Update token in existing auth
 * @param {string} newToken - New access token
 */
export function updateToken(newToken) {
  try {
    const auth = getAuth();
    auth.id_token = newToken;
    auth.access_token = newToken;
    auth.timestamp = Date.now();
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    return true;
  } catch (error) {
    console.error('Failed to update token:', error);
    return false;
  }
}

export default {
  getAuth,
  getAuthToken,
  getRefreshToken,
  setAuth,
  clearAuth,
  isAuthenticated,
  getUserId,
  setUserId,
  isTokenExpired,
  getTokenExpiryTime,
  updateToken,
};
