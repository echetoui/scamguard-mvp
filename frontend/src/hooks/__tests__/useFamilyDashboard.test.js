/**
 * useFamilyDashboard Hook Tests
 * Phase 6 - Coverage Expansion
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useFamilyDashboard from '../useFamilyDashboard';

// Mock authStorage
vi.mock('../../utils/authStorage', () => ({
  getAuthToken: vi.fn(() => 'test-token'),
  getAuth: vi.fn(() => ({ access_token: 'test-token' }))
}));

describe('useFamilyDashboard Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty family data', () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({})
    });

    const { result } = renderHook(() => useFamilyDashboard());

    expect(result.current.familyData).toBeDefined();
    expect(result.current.familyData.familyName).toBe('');
    expect(result.current.familyData.members).toEqual([]);
  });

  it('should set loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useFamilyDashboard());

    expect(result.current.loading).toBe(true);
  });

  it('should fetch family data on mount', async () => {
    const mockFamilyData = {
      data: {
        familyName: 'Dupont Family',
        members: [{ name: 'Jean' }, { name: 'Marie' }],
        threats: [],
        inviteCode: 'ABC123'
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFamilyData,
      status: 200
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/family/dashboard'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token'
        })
      })
    );
  });

  it('should populate family data when API returns data', async () => {
    const mockFamilyData = {
      data: {
        familyName: 'Test Family',
        members: [{ name: 'User1' }, { name: 'User2' }],
        threats: [{ id: 1, type: 'phishing' }],
        inviteCode: 'TEST123'
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFamilyData,
      status: 200
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.familyData.familyName).toBe('Test Family');
    });

    expect(result.current.familyData.members.length).toBe(2);
    expect(result.current.familyData.threats.length).toBe(1);
    expect(result.current.familyData.inviteCode).toBe('TEST123');
  });

  it('should set hasFamily to true when members exist', async () => {
    const mockFamilyData = {
      data: {
        familyName: 'Dupont Family',
        members: [{ name: 'Jean' }],
        threats: [],
        inviteCode: 'ABC123'
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFamilyData
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.hasFamily).toBe(true);
    });
  });

  it('should set hasFamily to false on 404 response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({})
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasFamily).toBe(false);
  });

  it('should handle missing family name gracefully', async () => {
    const mockFamilyData = {
      data: {
        members: [{ name: 'Jean' }],
        threats: [],
        inviteCode: 'ABC123'
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFamilyData
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.familyData.familyName).toBe('Ma Famille');
  });

  it('should handle API error response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({})
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain('Impossible de charger');
  });

  it('should handle network error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network failed'));

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Impossible de charger les données familiales');
    expect(result.current.hasFamily).toBe(false);
  });

  it('should use authorization token in headers', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { familyName: 'Test' } })
    });

    renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  it('should clear error on successful fetch', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: ''
        }
      })
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.error).toBe('');
    });
  });

  it('should default to empty array for members if not provided', async () => {
    const mockFamilyData = {
      data: {
        familyName: 'Test Family',
        threats: [],
        inviteCode: 'ABC123'
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFamilyData
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.familyData.members).toEqual([]);
  });

  it('should default to empty array for threats if not provided', async () => {
    const mockFamilyData = {
      data: {
        familyName: 'Test Family',
        members: [{ name: 'User1' }],
        inviteCode: 'ABC123'
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFamilyData
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.familyData.threats).toEqual([]);
  });

  it('should include all family data in response object', async () => {
    const mockFamilyData = {
      data: {
        familyName: 'Complete Family',
        members: [{ name: 'Member1' }, { name: 'Member2' }],
        threats: [{ id: 1, severity: 'high' }],
        inviteCode: 'CODE123'
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFamilyData
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toHaveProperty('familyData');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('hasFamily');
  });

  it('should handle 400 bad request error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad request' })
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should handle 403 forbidden error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({})
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should set loading false after fetch completes', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { familyName: 'Test' } })
    });

    const { result } = renderHook(() => useFamilyDashboard());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should return initial state for missing data fields', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} })
    });

    const { result } = renderHook(() => useFamilyDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.familyData.familyName).toBe('Ma Famille');
    expect(result.current.familyData.members).toEqual([]);
    expect(result.current.familyData.threats).toEqual([]);
    expect(result.current.familyData.inviteCode).toBe('');
  });
});
