/**
 * useAccountProfile Hook
 * Phase 4.2 - Account management and user profile
 *
 * Manages user profile, preferences, and account settings with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { analysisAPI } from '../services/api';

const STORAGE_KEY = 'scamguard_profile';

const DEFAULT_PROFILE = {
  name: 'Mon Profil',
  avatar: '🛡️',
  joinDate: Date.now(),
  preferences: {
    notifications: true,
    dailyReminder: true,
    soundEffects: false
  }
};

export default function useAccountProfile() {
  const [data, setData] = useState(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } else {
        // First time - set join date to now
        setData(DEFAULT_PROFILE);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist to localStorage on change (guarded by isLoading)
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        // Fire-and-forget cloud sync to DynamoDB (only if authenticated)
        try {
          const auth = JSON.parse(localStorage.getItem('scamguard_auth') || '{}');
          const token = auth.id_token || auth.idToken;

          // Only sync if user is authenticated
          if (token) {
            const userId = localStorage.getItem('userId') || 'anonymous';
            // Async call without awaiting
            analysisAPI.saveProfile(userId, data).catch((err) => {
              // Silently fail - user can still use app without cloud sync
              console.debug('Cloud sync skipped for profile:', err.message);
            });
          }
        } catch (err) {
          // Silently fail - not critical
          console.debug('Profile cloud sync error:', err.message);
        }
      } catch (error) {
        console.error('Error saving profile:', error);
      }
    }
  }, [data, isLoading]);

  /**
   * Update user name
   */
  const updateName = useCallback((name) => {
    if (name.trim()) {
      setData(prev => ({
        ...prev,
        name: name.trim()
      }));
    }
  }, []);

  /**
   * Update user avatar (emoji)
   */
  const updateAvatar = useCallback((emoji) => {
    setData(prev => ({
      ...prev,
      avatar: emoji
    }));
  }, []);

  /**
   * Toggle a preference (notifications, dailyReminder, etc)
   */
  const togglePreference = useCallback((key) => {
    setData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }));
  }, []);

  /**
   * Get full profile object
   */
  const getProfile = useCallback(() => data, [data]);

  /**
   * Get join date formatted as "Membre depuis le DD/MM/YYYY"
   */
  const getJoinDateFormatted = useCallback(() => {
    const date = new Date(data.joinDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `Membre depuis le ${day}/${month}/${year}`;
  }, [data.joinDate]);

  /**
   * Reset profile to defaults
   */
  const resetProfile = useCallback(() => {
    setData(DEFAULT_PROFILE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    profile: data,
    isLoading,
    updateName,
    updateAvatar,
    togglePreference,
    getProfile,
    getJoinDateFormatted,
    resetProfile
  };
}
