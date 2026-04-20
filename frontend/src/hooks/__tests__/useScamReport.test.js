/**
 * Test Suite: useScamReport Hook
 * Tests for API integration, error handling, retry logic, and localStorage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useScamReport from '../useScamReport';

// Mock getAuthToken
vi.mock('../../utils/authStorage', () => ({
  getAuthToken: vi.fn()
}));

import { getAuthToken } from '../../utils/authStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = vi.fn();

describe('useScamReport Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getAuthToken.mockReturnValue('test-token-123');
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ============================================================================
  // 1. INITIALIZATION & STATE (4 tests)
  // ============================================================================
  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useScamReport());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBe(false);
      expect(result.current.reportId).toBeNull();
      expect(typeof result.current.submitReport).toBe('function');
    });

    it('should have draft management methods', () => {
      const { result } = renderHook(() => useScamReport());

      expect(typeof result.current.loadDraft).toBe('function');
      expect(typeof result.current.saveDraft).toBe('function');
      expect(typeof result.current.clearDraft).toBe('function');
    });

    it('should not have auth token throw on submission if missing', async () => {
      getAuthToken.mockReturnValue(null);
      const { result } = renderHook(() => useScamReport());

      const response = await act(async () => {
        return result.current.submitReport({
          scamType: 'sms',
          description: 'Test'
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('connecté');
    });

    it('should require scamType for submission', async () => {
      const { result } = renderHook(() => useScamReport());

      const response = await act(async () => {
        return result.current.submitReport({
          scamType: '',
          description: 'Test'
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Type de signalement');
    });
  });

  // ============================================================================
  // 2. SUCCESSFUL SUBMISSION (3 tests)
  // ============================================================================
  describe('Successful Submission', () => {
    it('should submit report successfully with FormData', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reportId: 'REPORT-123', id: 'REPORT-123' })
      });

      const { result } = renderHook(() => useScamReport());

      const formData = {
        scamType: 'email',
        description: 'Phishing attempt'
      };

      const response = await act(async () => {
        return result.current.submitReport(formData);
      });

      expect(response.success).toBe(true);
      expect(response.reportId).toBe('REPORT-123');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBe(true);
    });

    it('should clear draft after successful submission', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reportId: 'REPORT-456' })
      });

      const { result } = renderHook(() => useScamReport());

      // Save draft first
      act(() => {
        result.current.saveDraft({
          scamType: 'sms',
          description: 'Test'
        });
      });

      expect(localStorage.getItem('scamReportDraft')).toBeTruthy();

      // Submit
      await act(async () => {
        result.current.submitReport({
          scamType: 'sms',
          description: 'Test'
        });
      });

      // Draft should be cleared
      expect(localStorage.getItem('scamReportDraft')).toBeNull();
    });

    it('should upload file in FormData', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reportId: 'REPORT-789' })
      });

      const { result } = renderHook(() => useScamReport());

      const file = new File(['test'], 'screenshot.png', { type: 'image/png' });
      const formData = {
        scamType: 'social',
        description: 'Fake profile',
        rawFile: file,
        screenshot: 'blob:http://localhost/test'
      };

      await act(async () => {
        result.current.submitReport(formData);
      });

      // Verify fetch was called with FormData
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[0]).toContain('/reports');
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].headers['Authorization']).toBe('Bearer test-token-123');
      expect(callArgs[1].body).toBeInstanceOf(FormData);
    });
  });

  // ============================================================================
  // 3. ERROR HANDLING (7 tests)
  // ============================================================================
  describe('Error Handling', () => {
    it('should handle 400 validation error without retry', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid scam type' })
      });

      const { result } = renderHook(() => useScamReport());

      await act(async () => {
        await result.current.submitReport({
          scamType: 'invalid',
          description: 'Test'
        });
      });

      expect(result.current.error).toBeTruthy();
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retry on 400
    });

    it('should handle 413 file size error without retry', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: async () => ({ message: 'File too large' })
      });

      const { result } = renderHook(() => useScamReport());

      await act(async () => {
        await result.current.submitReport({
          scamType: 'sms',
          description: 'Test'
        });
      });

      expect(result.current.error).toBeTruthy();
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retry on 413
    });

    it('should handle 429 rate limit error without retry', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Too many requests' })
      });

      const { result } = renderHook(() => useScamReport());

      await act(async () => {
        await result.current.submitReport({
          scamType: 'sms',
          description: 'Test'
        });
      });

      expect(result.current.error).toBeTruthy();
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retry on 429
    });

    it('should handle 401 Unauthorized by clearing token', async () => {
      localStorage.setItem('authToken', 'old-token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' })
      });

      const { result } = renderHook(() => useScamReport());

      await act(async () => {
        await result.current.submitReport({
          scamType: 'sms',
          description: 'Test'
        });
      });

      expect(result.current.error).toBeTruthy();
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should handle 500 server error with retry', async () => {
      // Mock 3 failures
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' })
        });

      const { result } = renderHook(() => useScamReport());

      await act(async () => {
        await result.current.submitReport({
          scamType: 'sms',
          description: 'Test'
        });
      });

      expect(result.current.error).toBeTruthy();
      expect(global.fetch).toHaveBeenCalledTimes(3); // Retried 3 times
    });

    it('should succeed on retry after transient failure', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 502,
          json: async () => ({ message: 'Bad Gateway' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reportId: 'REPORT-RETRY' })
        });

      const { result } = renderHook(() => useScamReport());

      await act(async () => {
        await result.current.submitReport({
          scamType: 'sms',
          description: 'Test'
        });
      });

      expect(result.current.success).toBe(true);
      expect(result.current.reportId).toBe('REPORT-RETRY');
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('should update state with error message on failure', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' })
        });

      const { result } = renderHook(() => useScamReport());

      await act(async () => {
        await result.current.submitReport({
          scamType: 'sms',
          description: 'Test'
        });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.success).toBe(false);
    });
  });

  // ============================================================================
  // 4. DRAFT PERSISTENCE (3 tests)
  // ============================================================================
  describe('Draft Persistence', () => {
    it('should save draft to localStorage on saveDraft call', () => {
      const { result } = renderHook(() => useScamReport());

      const draftData = {
        scamType: 'email',
        description: 'Suspicious email',
        screenshotName: 'screenshot.png'
      };

      act(() => {
        result.current.saveDraft(draftData);
      });

      const saved = JSON.parse(localStorage.getItem('scamReportDraft'));
      expect(saved.scamType).toBe('email');
      expect(saved.description).toBe('Suspicious email');
      expect(saved.timestamp).toBeTruthy();
    });

    it('should load draft from localStorage', () => {
      const draftData = {
        scamType: 'sms',
        description: 'Test SMS',
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('scamReportDraft', JSON.stringify(draftData));

      const { result } = renderHook(() => useScamReport());

      const loaded = result.current.loadDraft();
      expect(loaded.scamType).toBe('sms');
      expect(loaded.description).toBe('Test SMS');
    });

    it('should clear draft from localStorage', () => {
      localStorage.setItem('scamReportDraft', JSON.stringify({ test: 'data' }));

      const { result } = renderHook(() => useScamReport());

      act(() => {
        result.current.clearDraft();
      });

      expect(localStorage.getItem('scamReportDraft')).toBeNull();
    });
  });

  // ============================================================================
  // 5. FILE HANDLING (2 tests)
  // ============================================================================
  describe('File Handling', () => {
    it('should reject files larger than 5MB', async () => {
      const { result } = renderHook(() => useScamReport());

      // Create a mock file larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });

      const response = await act(async () => {
        return result.current.submitReport({
          scamType: 'sms',
          description: 'Test',
          rawFile: largeFile,
          screenshot: 'blob:http://localhost/test'
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('5MB');
    });

    it('should clean up object URLs after submission', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reportId: 'REPORT-URL-TEST' })
      });

      const { result } = renderHook(() => useScamReport());

      // Mock URL.revokeObjectURL
      const revokespy = vi.spyOn(URL, 'revokeObjectURL');

      const file = new File(['test'], 'screenshot.png', { type: 'image/png' });
      const blobUrl = 'blob:http://localhost/abc123';

      await act(async () => {
        result.current.submitReport({
          scamType: 'sms',
          description: 'Test',
          rawFile: file,
          screenshot: blobUrl
        });
      });

      // Should have called revokeObjectURL for cleanup
      expect(revokespy).toHaveBeenCalledWith(blobUrl);
    });
  });

  // ============================================================================
  // 6. STATE MANAGEMENT (3 tests)
  // ============================================================================
  describe('State Management', () => {
    it('should set reportId on successful submission', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reportId: 'UNIQUE-ID-789' })
      });

      const { result } = renderHook(() => useScamReport());

      await act(async () => {
        await result.current.submitReport({
          scamType: 'sms',
          description: 'Test'
        });
      });

      expect(result.current.reportId).toBe('UNIQUE-ID-789');
      expect(result.current.success).toBe(true);
    });

    it('should clear error and success on new submission attempt', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Error' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Error' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Error' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reportId: 'REPORT-456' })
        });

      const { result } = renderHook(() => useScamReport());

      // First submission (fails with retries)
      await act(async () => {
        await result.current.submitReport({
          scamType: 'sms',
          description: 'Test 1'
        });
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.success).toBe(false);

      // Reset mocks for second submission
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reportId: 'REPORT-456' })
      });

      // Second submission (succeeds)
      await act(async () => {
        await result.current.submitReport({
          scamType: 'email',
          description: 'Test 2'
        });
      });

      expect(result.current.error).toBeNull();
      expect(result.current.success).toBe(true);
      expect(result.current.reportId).toBe('REPORT-456');
    });

    it('should reset state on new submission', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reportId: 'REPORT-1' })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reportId: 'REPORT-2' })
      });

      const { result } = renderHook(() => useScamReport());

      await act(async () => {
        await result.current.submitReport({
          scamType: 'sms',
          description: 'Test 1'
        });
      });

      expect(result.current.success).toBe(true);
      expect(result.current.reportId).toBe('REPORT-1');

      await act(async () => {
        await result.current.submitReport({
          scamType: 'email',
          description: 'Test 2'
        });
      });

      expect(result.current.success).toBe(true);
      expect(result.current.reportId).toBe('REPORT-2');
      expect(result.current.error).toBeNull();
    });
  });

  // ============================================================================
  // 7. AUTHENTICATION (2 tests)
  // ============================================================================
  describe('Authentication', () => {
    it('should include Bearer token in Authorization header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reportId: 'REPORT-123' })
      });

      const { result } = renderHook(() => useScamReport());

      await act(async () => {
        await result.current.submitReport({
          scamType: 'sms',
          description: 'Test'
        });
      });

      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[1].headers['Authorization']).toBe('Bearer test-token-123');
    });

    it('should not send request without auth token', async () => {
      getAuthToken.mockReturnValue(null);

      const { result } = renderHook(() => useScamReport());

      await act(async () => {
        await result.current.submitReport({
          scamType: 'sms',
          description: 'Test'
        });
      });

      expect(result.current.error).toBeTruthy();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
