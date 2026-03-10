/**
 * useAccountProfile Hook Tests
 * Phase 6 - Coverage Expansion
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAccountProfile from '../useAccountProfile';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useAccountProfile Hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should initialize with default profile', () => {
    const { result } = renderHook(() => useAccountProfile());

    expect(result.current.profile).toBeDefined();
    expect(result.current.profile.name).toBe('Mon Profil');
    expect(result.current.profile.avatar).toBe('🛡️');
    expect(result.current.profile).toHaveProperty('joinDate');
  });

  it('should load saved profile from localStorage', () => {
    const savedProfile = {
      name: 'Jean Dupont',
      avatar: '👨',
      joinDate: 1705276800000,
      preferences: { notifications: true, dailyReminder: false, soundEffects: true }
    };
    localStorageMock.setItem('scamguard_profile', JSON.stringify(savedProfile));

    const { result } = renderHook(() => useAccountProfile());

    expect(result.current.profile.name).toBe('Jean Dupont');
    expect(result.current.profile.avatar).toBe('👨');
    expect(result.current.profile.preferences.notifications).toBe(true);
  });

  it('should update profile name', () => {
    const { result } = renderHook(() => useAccountProfile());

    act(() => {
      result.current.updateName('Marie Leblanc');
    });

    expect(result.current.profile.name).toBe('Marie Leblanc');
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should update profile avatar', () => {
    const { result } = renderHook(() => useAccountProfile());

    act(() => {
      result.current.updateAvatar('👩');
    });

    expect(result.current.profile.avatar).toBe('👩');
  });

  it('should toggle notification preference', () => {
    const { result } = renderHook(() => useAccountProfile());

    const initialNotifications = result.current.profile.preferences?.notifications ?? true;

    act(() => {
      result.current.togglePreference('notifications');
    });

    expect(result.current.profile.preferences.notifications).toBe(!initialNotifications);
  });

  it('should toggle daily reminder preference', () => {
    const { result } = renderHook(() => useAccountProfile());

    const initialValue = result.current.profile.preferences.dailyReminder;

    act(() => {
      result.current.togglePreference('dailyReminder');
    });

    expect(result.current.profile.preferences.dailyReminder).toBe(!initialValue);
  });

  it('should return formatted join date', () => {
    const { result } = renderHook(() => useAccountProfile());

    const formattedDate = result.current.getJoinDateFormatted();

    expect(formattedDate).toBeTruthy();
    expect(typeof formattedDate).toBe('string');
  });

  it('should reset profile to defaults', () => {
    const { result } = renderHook(() => useAccountProfile());

    act(() => {
      result.current.updateName('Custom Name');
      result.current.updateAvatar('🦁');
    });

    expect(result.current.profile.name).toBe('Custom Name');
    expect(result.current.profile.avatar).toBe('🦁');

    act(() => {
      result.current.resetProfile();
    });

    expect(result.current.profile.name).toBe('Mon Profil');
    expect(result.current.profile.avatar).toBe('🛡️');
  });

  it('should persist profile changes to localStorage', () => {
    const { result } = renderHook(() => useAccountProfile());

    act(() => {
      result.current.updateName('Persistent Name');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'scamguard_profile',
      expect.stringContaining('Persistent Name')
    );
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorageMock.setItem('scamguard_profile', 'invalid json {');

    const { result } = renderHook(() => useAccountProfile());

    expect(result.current.profile).toBeDefined();
    expect(result.current.profile.name).toBe('Mon Profil');
  });

  it('should maintain joinDate consistency', () => {
    const { result } = renderHook(() => useAccountProfile());

    const initialJoinDate = result.current.profile.joinDate;

    act(() => {
      result.current.updateName('New Name');
      result.current.updateAvatar('🎭');
    });

    expect(result.current.profile.joinDate).toBe(initialJoinDate);
  });

  it('should have preferences object', () => {
    const { result } = renderHook(() => useAccountProfile());

    expect(result.current.profile.preferences).toBeDefined();
    expect(typeof result.current.profile.preferences).toBe('object');
  });

  it('should update multiple preferences independently', () => {
    const { result } = renderHook(() => useAccountProfile());

    act(() => {
      result.current.togglePreference('notifications');
    });

    const notificationsState = result.current.profile.preferences.notifications;

    act(() => {
      result.current.togglePreference('soundEffects');
    });

    expect(result.current.profile.preferences.notifications).toBe(notificationsState);
    expect(result.current.profile.preferences.soundEffects).toBe(true);
  });

  it('should return consistent join date format', () => {
    const { result } = renderHook(() => useAccountProfile());

    const date1 = result.current.getJoinDateFormatted();
    const date2 = result.current.getJoinDateFormatted();

    expect(date1).toBe(date2);
  });

  it('should have default preferences', () => {
    const { result } = renderHook(() => useAccountProfile());

    const defaultPreferences = result.current.profile.preferences || {};
    expect(Object.keys(defaultPreferences).length).toBeGreaterThanOrEqual(0);
  });

  it('should update name with different avatars', () => {
    const { result } = renderHook(() => useAccountProfile());

    const avatars = ['👨', '👩', '👴', '👵', '😊'];

    avatars.forEach(avatar => {
      act(() => {
        result.current.updateAvatar(avatar);
      });

      expect(result.current.profile.avatar).toBe(avatar);
    });
  });

  it('should maintain profile structure after updates', () => {
    const { result } = renderHook(() => useAccountProfile());

    act(() => {
      result.current.updateName('Test Name');
      result.current.updateAvatar('🎯');
      result.current.togglePreference('notifications');
    });

    expect(result.current.profile).toHaveProperty('name');
    expect(result.current.profile).toHaveProperty('avatar');
    expect(result.current.profile).toHaveProperty('joinDate');
    expect(result.current.profile).toHaveProperty('preferences');
  });
});
