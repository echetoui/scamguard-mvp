/**
 * Centralized API Configuration
 * Single source of truth for API endpoints across the application
 *
 * Prevents duplication and ensures consistency across all components
 */

const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001/api/v1'
    : 'https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1');

export const API_CONFIG = {
  baseUrl: API_BASE_URL,

  // Staging endpoint (for development/testing)
  staging: 'https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1',

  // Production endpoint (when ready)
  production: 'https://scamguard-api.ca/api/v1',

  // Development endpoint
  development: 'http://localhost:3001/api/v1',

  // Request timeout (ms)
  timeout: 10000,

  // Max retries for failed requests
  maxRetries: 3,

  // Retry delay (ms) - will use exponential backoff
  retryDelay: 1000,
};

/**
 * Get the appropriate API URL based on environment
 */
export function getApiUrl() {
  return API_BASE_URL;
}

/**
 * Get API endpoint (full URL)
 * @param {string} path - Endpoint path (e.g., '/auth/login')
 * @returns {string} Full API URL
 */
export function getApiEndpoint(path) {
  return `${API_BASE_URL}${path}`;
}

export default API_CONFIG;
