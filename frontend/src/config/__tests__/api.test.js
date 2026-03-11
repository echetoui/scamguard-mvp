/**
 * API Configuration Tests
 * Tests for API_CONFIG, getApiUrl, and getApiEndpoint functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { API_CONFIG, getApiUrl, getApiEndpoint } from '../api';

describe('API Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset process.env to original values
    process.env = { ...originalEnv };
    // Clear any mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;
  });

  describe('API_CONFIG Object', () => {
    it('should have baseUrl property', () => {
      expect(API_CONFIG).toHaveProperty('baseUrl');
      expect(typeof API_CONFIG.baseUrl).toBe('string');
    });

    it('should have staging endpoint', () => {
      expect(API_CONFIG).toHaveProperty('staging');
      expect(API_CONFIG.staging).toBe('https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1');
    });

    it('should have production endpoint', () => {
      expect(API_CONFIG).toHaveProperty('production');
      expect(API_CONFIG.production).toBe('https://scamguard-api.ca/api/v1');
    });

    it('should have development endpoint', () => {
      expect(API_CONFIG).toHaveProperty('development');
      expect(API_CONFIG.development).toBe('http://localhost:3001/api/v1');
    });

    it('should have timeout property set to 10000ms', () => {
      expect(API_CONFIG).toHaveProperty('timeout');
      expect(API_CONFIG.timeout).toBe(10000);
    });

    it('should have maxRetries property set to 3', () => {
      expect(API_CONFIG).toHaveProperty('maxRetries');
      expect(API_CONFIG.maxRetries).toBe(3);
    });

    it('should have retryDelay property set to 1000ms', () => {
      expect(API_CONFIG).toHaveProperty('retryDelay');
      expect(API_CONFIG.retryDelay).toBe(1000);
    });

    it('should have all required properties', () => {
      const requiredProps = ['baseUrl', 'staging', 'production', 'development', 'timeout', 'maxRetries', 'retryDelay'];
      requiredProps.forEach(prop => {
        expect(API_CONFIG).toHaveProperty(prop);
      });
    });
  });

  describe('getApiUrl function', () => {
    it('should return a string', () => {
      const url = getApiUrl();
      expect(typeof url).toBe('string');
    });

    it('should return baseUrl from API_CONFIG', () => {
      const url = getApiUrl();
      expect(url).toBe(API_CONFIG.baseUrl);
    });

    it('should start with https:// or http://', () => {
      const url = getApiUrl();
      expect(url).toMatch(/^https?:\/\//);
    });

    it('should contain api/v1 path', () => {
      const url = getApiUrl();
      expect(url).toMatch(/api\/v1/);
    });
  });

  describe('getApiEndpoint function', () => {
    it('should concatenate base URL with path', () => {
      const path = '/auth/login';
      const endpoint = getApiEndpoint(path);
      expect(endpoint).toContain(API_CONFIG.baseUrl);
      expect(endpoint).toContain(path);
    });

    it('should construct valid URL for auth endpoints', () => {
      const endpoint = getApiEndpoint('/auth/login');
      expect(endpoint).toMatch(/^https?:.*\/auth\/login$/);
    });

    it('should construct valid URL for analysis endpoints', () => {
      const endpoint = getApiEndpoint('/analyze/sms');
      expect(endpoint).toMatch(/^https?:.*\/analyze\/sms$/);
    });

    it('should construct valid URL for user endpoints', () => {
      const endpoint = getApiEndpoint('/user/profile');
      expect(endpoint).toMatch(/^https?:.*\/user\/profile$/);
    });

    it('should handle paths with parameters', () => {
      const endpoint = getApiEndpoint('/user/123/settings');
      expect(endpoint).toContain('/user/123/settings');
    });

    it('should handle paths with query strings', () => {
      const endpoint = getApiEndpoint('/search?q=scam');
      expect(endpoint).toContain('q=scam');
    });

    it('should work with empty path', () => {
      const endpoint = getApiEndpoint('');
      expect(endpoint).toBe(API_CONFIG.baseUrl);
    });

    it('should work with paths that have leading slash', () => {
      const endpoint = getApiEndpoint('/api/endpoint');
      expect(endpoint).toContain('/api/endpoint');
    });

    it('should return consistent results for same path', () => {
      const path = '/auth/verify-otp';
      const endpoint1 = getApiEndpoint(path);
      const endpoint2 = getApiEndpoint(path);
      expect(endpoint1).toBe(endpoint2);
    });

    it('should construct proper path without adjacent slashes', () => {
      const endpoint = getApiEndpoint('/auth/login');
      // Should have format: https://domain/path/api/v1/auth/login
      // Not: https://domain/path/api/v1//auth/login
      expect(endpoint).toMatch(/api\/v1\/\w+/);
    });
  });

  describe('Environment-specific URLs', () => {
    it('should use staging URL for production builds', () => {
      // The API config defaults to staging URL
      const url = getApiUrl();
      expect(url).toContain('mzkwpdt7m3.execute-api.us-east-1.amazonaws.com');
    });

    it('endpoints should be properly formatted URLs', () => {
      const endpoints = [
        API_CONFIG.staging,
        API_CONFIG.production,
        API_CONFIG.development
      ];

      endpoints.forEach(endpoint => {
        expect(endpoint).toMatch(/^https?:\/\/.+\/api\/v1$/);
      });
    });

    it('should have different endpoints for different environments', () => {
      const urls = [API_CONFIG.staging, API_CONFIG.production, API_CONFIG.development];
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(3);
    });
  });

  describe('API Configuration Constants', () => {
    it('timeout should be positive number', () => {
      expect(API_CONFIG.timeout).toBeGreaterThan(0);
    });

    it('maxRetries should be non-negative', () => {
      expect(API_CONFIG.maxRetries).toBeGreaterThanOrEqual(0);
    });

    it('retryDelay should be positive number', () => {
      expect(API_CONFIG.retryDelay).toBeGreaterThan(0);
    });

    it('retryDelay should be reasonable (less than 10 seconds)', () => {
      expect(API_CONFIG.retryDelay).toBeLessThan(10000);
    });

    it('timeout should be greater than retryDelay', () => {
      expect(API_CONFIG.timeout).toBeGreaterThan(API_CONFIG.retryDelay);
    });
  });

  describe('API Endpoint Paths', () => {
    const commonPaths = [
      '/auth/request-sms-otp',
      '/auth/verify-sms-otp',
      '/auth/refresh-token',
      '/analyze/sms',
      '/analyze/email',
      '/user/profile',
      '/user/settings',
      '/resources/faq',
      '/resources/tips'
    ];

    it('should construct valid URLs for all common paths', () => {
      commonPaths.forEach(path => {
        const endpoint = getApiEndpoint(path);
        expect(endpoint).toBeTruthy();
        expect(endpoint).toMatch(/^https?:\/\/.+\/api\/v1.+/);
      });
    });

    it('should not modify the path', () => {
      commonPaths.forEach(path => {
        const endpoint = getApiEndpoint(path);
        expect(endpoint).toContain(path);
      });
    });
  });

  describe('Module Exports', () => {
    it('should export API_CONFIG as object', () => {
      expect(typeof API_CONFIG).toBe('object');
    });

    it('should export getApiUrl as function', () => {
      expect(typeof getApiUrl).toBe('function');
    });

    it('should export getApiEndpoint as function', () => {
      expect(typeof getApiEndpoint).toBe('function');
    });
  });
});
