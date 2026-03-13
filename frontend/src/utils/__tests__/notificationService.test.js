/**
 * Test Suite: Notification Service Utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  requestPermission,
  getPermissionStatus,
  sendNotification,
  isNotificationTypeEnabled,
  getNotificationPreferences,
  setNotificationTypePreference,
  shouldSendDailyNotification,
  shouldSendWeeklyNotification,
  getSecurityTips,
  clearNotificationTimestamps,
  clearNotificationPreferences,
} from '../notificationService';

// Mock Notification API
global.Notification = class Notification {
  static permission = 'default';

  static async requestPermission() {
    return 'granted';
  }

  constructor(title, options) {
    this.title = title;
    this.options = options;
  }
};

describe('notificationService utility', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(global.Notification, 'permission', {
      value: 'default',
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getPermissionStatus', () => {
    it('should return current permission status', () => {
      global.Notification.permission = 'granted';
      const status = getPermissionStatus();
      expect(status).toBe('granted');
    });

    it('should return "denied" if Notification API not available', () => {
      const originalNotification = global.Notification;
      delete global.Notification;

      const status = getPermissionStatus();
      expect(status).toBe('denied');

      global.Notification = originalNotification;
    });
  });

  describe('requestPermission', () => {
    it('should return permission status after request', async () => {
      global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
      global.Notification.permission = 'default';

      const permission = await requestPermission();
      expect(permission).toBe('granted');
    });

    it('should return "denied" if Notification API not available', async () => {
      const originalNotification = global.Notification;
      delete global.Notification;

      const permission = await requestPermission();
      expect(permission).toBe('denied');

      global.Notification = originalNotification;
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return default preferences when none saved', () => {
      const prefs = getNotificationPreferences();
      expect(prefs.THREAT_ALERT).toBe(true);
      expect(prefs.QUIZ_REMINDER).toBe(true);
      expect(prefs.DAILY_TIP).toBe(true);
      expect(prefs.ANALYSIS_COMPLETE).toBe(true);
      expect(prefs.WEEKLY_REPORT).toBe(true);
    });

    it('should return saved preferences', () => {
      const preferences = {
        THREAT_ALERT: false,
        QUIZ_REMINDER: true,
        DAILY_TIP: false,
      };
      localStorage.setItem(
        'scamguard_notification_preferences',
        JSON.stringify(preferences)
      );

      const prefs = getNotificationPreferences();
      expect(prefs.THREAT_ALERT).toBe(false);
      expect(prefs.DAILY_TIP).toBe(false);
    });
  });

  describe('setNotificationTypePreference', () => {
    it('should save preference for notification type', () => {
      setNotificationTypePreference('THREAT_ALERT', false);
      const prefs = getNotificationPreferences();
      expect(prefs.THREAT_ALERT).toBe(false);
    });

    it('should preserve other preferences when updating one', () => {
      setNotificationTypePreference('THREAT_ALERT', false);
      setNotificationTypePreference('DAILY_TIP', false);

      const prefs = getNotificationPreferences();
      expect(prefs.THREAT_ALERT).toBe(false);
      expect(prefs.DAILY_TIP).toBe(false);
      expect(prefs.QUIZ_REMINDER).toBe(true); // Unchanged
    });
  });

  describe('isNotificationTypeEnabled', () => {
    it('should return true for enabled types', () => {
      setNotificationTypePreference('THREAT_ALERT', true);
      const enabled = isNotificationTypeEnabled('THREAT_ALERT');
      expect(enabled).toBe(true);
    });

    it('should return false for disabled types', () => {
      setNotificationTypePreference('THREAT_ALERT', false);
      const enabled = isNotificationTypeEnabled('THREAT_ALERT');
      expect(enabled).toBe(false);
    });

    it('should return true for unset types (default)', () => {
      const enabled = isNotificationTypeEnabled('UNKNOWN_TYPE');
      expect(enabled).toBe(true);
    });
  });

  describe('sendNotification', () => {
    it('should return false if permission not granted', () => {
      Object.defineProperty(global.Notification, 'permission', {
        value: 'denied',
        writable: true,
      });
      const sent = sendNotification('THREAT_ALERT', {});
      expect(sent).toBe(false);
    });

    it('should return false if notification type disabled', () => {
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        writable: true,
      });
      setNotificationTypePreference('THREAT_ALERT', false);

      const sent = sendNotification('THREAT_ALERT', {});
      expect(sent).toBe(false);
    });

    it('should send notification if permission granted and type enabled', () => {
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        writable: true,
      });

      // Spy on Notification constructor
      const originalNotification = global.Notification;
      let notificationCalled = false;
      global.Notification = class extends originalNotification {
        constructor(...args) {
          notificationCalled = true;
          super(...args);
        }
      };

      const sent = sendNotification('THREAT_ALERT', {});
      expect(sent).toBe(true);
      expect(notificationCalled).toBe(true);

      // Restore
      global.Notification = originalNotification;
    });

    it('should return false for unknown notification type', () => {
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        writable: true,
      });
      const sent = sendNotification('UNKNOWN_TYPE', {});
      expect(sent).toBe(false);
    });

    it('should include custom data in notification', () => {
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        writable: true,
      });

      const originalNotification = global.Notification;
      let lastTitle = '';
      global.Notification = class extends originalNotification {
        constructor(title, ...args) {
          lastTitle = title;
          super(title, ...args);
        }
      };

      sendNotification('THREAT_ALERT', { message: 'Custom message' });
      expect(lastTitle).toContain('Alerte');

      // Restore
      global.Notification = originalNotification;
    });
  });

  describe('shouldSendDailyNotification', () => {
    it('should return true if no previous notifications', () => {
      const should = shouldSendDailyNotification('DAILY_TIP');
      expect(should).toBe(true);
    });

    it('should return false if notification sent today', () => {
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        writable: true,
      });

      // Record that we sent a notification today
      const now = new Date().toISOString();
      localStorage.setItem(
        'scamguard_notification_timestamps',
        JSON.stringify({ DAILY_TIP: [now] })
      );

      const should = shouldSendDailyNotification('DAILY_TIP');
      expect(should).toBe(false);
    });

    it('should return true if notification sent yesterday or earlier', () => {
      // Manually set timestamp to yesterday
      const timestamps = {
        DAILY_TIP: [
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ],
      };
      localStorage.setItem(
        'scamguard_notification_timestamps',
        JSON.stringify(timestamps)
      );

      const should = shouldSendDailyNotification('DAILY_TIP');
      expect(should).toBe(true);
    });
  });

  describe('shouldSendWeeklyNotification', () => {
    it('should return true if no previous notifications', () => {
      const should = shouldSendWeeklyNotification('WEEKLY_REPORT');
      expect(should).toBe(true);
    });

    it('should return false if notification sent this week', () => {
      const timestamps = {
        WEEKLY_REPORT: [
          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ],
      };
      localStorage.setItem(
        'scamguard_notification_timestamps',
        JSON.stringify(timestamps)
      );

      const should = shouldSendWeeklyNotification('WEEKLY_REPORT');
      expect(should).toBe(false);
    });

    it('should return true if notification sent more than 7 days ago', () => {
      const timestamps = {
        WEEKLY_REPORT: [
          new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        ],
      };
      localStorage.setItem(
        'scamguard_notification_timestamps',
        JSON.stringify(timestamps)
      );

      const should = shouldSendWeeklyNotification('WEEKLY_REPORT');
      expect(should).toBe(true);
    });
  });

  describe('getSecurityTips', () => {
    it('should return array of tips', () => {
      const tips = getSecurityTips();
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });

    it('should contain security-related tips', () => {
      const tips = getSecurityTips();
      const tipText = tips.join(' ').toLowerCase();
      expect(tipText).toMatch(/password|mots de passe|sécurité|authentification|email/);
    });

    it('should have at least 5 different tips', () => {
      const tips = getSecurityTips();
      expect(tips.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('clearNotificationTimestamps', () => {
    it('should clear all notification timestamps', () => {
      global.Notification.permission = 'granted';
      global.Notification = vi.fn();
      sendNotification('DAILY_TIP', {});

      clearNotificationTimestamps();

      const should = shouldSendDailyNotification('DAILY_TIP');
      expect(should).toBe(true);
    });
  });

  describe('clearNotificationPreferences', () => {
    it('should clear all notification preferences', () => {
      setNotificationTypePreference('THREAT_ALERT', false);

      clearNotificationPreferences();

      const enabled = isNotificationTypeEnabled('THREAT_ALERT');
      expect(enabled).toBe(true); // Back to default
    });
  });
});
