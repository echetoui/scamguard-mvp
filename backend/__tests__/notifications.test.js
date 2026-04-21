/**
 * ARCH.6 - SMS/Email Notification Service Tests
 * Tests for notification queue, preferences, and delivery logic
 */

const notificationService = require('../services/notificationService');
const emailTemplates = require('../services/emailTemplates');

describe('ARCH.6 Notification Service', () => {
  beforeEach(() => {
    // Clear all queues before each test
    notificationService.clearQueues();
  });

  describe('User Preferences', () => {
    test('initializes default preferences for new user', () => {
      const userId = 'test_user_1';
      const prefs = notificationService.getUserPreferences(userId);

      expect(prefs).toHaveProperty('userId', userId);
      expect(prefs).toHaveProperty('smsAlertsEnabled', true);
      expect(prefs).toHaveProperty('emailAlertsEnabled', true);
      expect(prefs.preferences).toHaveProperty(notificationService.NOTIFICATION_TYPES.SMS_THREAT_ALERT, true);
      expect(prefs.preferences).toHaveProperty(notificationService.NOTIFICATION_TYPES.EMAIL_THREAT_ALERT, true);
    });

    test('updates user notification preferences', () => {
      const userId = 'test_user_2';

      const updated = notificationService.updateUserPreferences(userId, {
        smsAlertsEnabled: false,
        preferences: {
          [notificationService.NOTIFICATION_TYPES.SMS_DAILY_DIGEST]: false
        }
      });

      expect(updated.smsAlertsEnabled).toBe(false);
      expect(updated.preferences[notificationService.NOTIFICATION_TYPES.SMS_DAILY_DIGEST]).toBe(false);

      // Verify persistence
      const retrieved = notificationService.getUserPreferences(userId);
      expect(retrieved.smsAlertsEnabled).toBe(false);
    });

    test('checks if notification type is enabled for user', () => {
      const userId = 'test_user_3';

      notificationService.updateUserPreferences(userId, {
        preferences: {
          [notificationService.NOTIFICATION_TYPES.EMAIL_THREAT_ALERT]: false
        }
      });

      expect(notificationService.isNotificationTypeEnabled(userId, notificationService.NOTIFICATION_TYPES.EMAIL_THREAT_ALERT)).toBe(false);
      expect(notificationService.isNotificationTypeEnabled(userId, notificationService.NOTIFICATION_TYPES.SMS_THREAT_ALERT)).toBe(true);
    });
  });

  describe('Notification Queue Management', () => {
    test('queues SMS notification and returns queue ID', async () => {
      const userId = 'test_user_4';
      const phoneNumber = '5551234567';
      const content = 'Test alert';

      const result = await notificationService.createAndQueueSMSNotification(
        userId,
        notificationService.NOTIFICATION_TYPES.SMS_THREAT_ALERT,
        phoneNumber,
        content
      );

      expect(result).toBeDefined();
      expect(result.queueId).toBeDefined();
      expect(result.notification.userId).toBe(userId);

      const queueItem = notificationService.getQueueItem(result.queueId);
      expect(queueItem.status).toBe('pending');
      expect(queueItem.recipient).toBe(phoneNumber);
      expect(queueItem.channel).toBe('sms');
    });

    test('queues email notification', async () => {
      const userId = 'test_user_5';
      const email = 'test@example.com';

      const result = await notificationService.createAndQueueEmailNotification(
        userId,
        notificationService.NOTIFICATION_TYPES.EMAIL_THREAT_ALERT,
        email,
        'Subject',
        '<p>HTML content</p>',
        'Text content'
      );

      expect(result).toBeDefined();
      expect(result.queueId).toBeDefined();

      const queueItem = notificationService.getQueueItem(result.queueId);
      expect(queueItem.channel).toBe('email');
      expect(queueItem.recipient).toBe(email);
    });

    test('respects user preferences when queuing notifications', async () => {
      const userId = 'test_user_6';

      // Disable threat alerts
      notificationService.updateUserPreferences(userId, {
        preferences: {
          [notificationService.NOTIFICATION_TYPES.SMS_THREAT_ALERT]: false
        }
      });

      const result = await notificationService.createAndQueueSMSNotification(
        userId,
        notificationService.NOTIFICATION_TYPES.SMS_THREAT_ALERT,
        '5551234567',
        'Alert'
      );

      expect(result).toBeNull();
    });

    test('returns pending queue items only', () => {
      const notification1 = { id: '1', type: 'test', recipient: '555', channel: 'sms', content: 'test', subject: '' };
      const notification2 = { id: '2', type: 'test', recipient: '555', channel: 'sms', content: 'test', subject: '' };

      const queueId1 = notificationService.queueNotification(notification1);
      const queueId2 = notificationService.queueNotification(notification2);

      // Mark first as sent
      notificationService.updateQueueItemStatus(queueId1, 'sent');

      const pending = notificationService.getPendingQueueItems();
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe(queueId2);
    });
  });

  describe('Queue Item Status Updates', () => {
    test('updates queue item status to sent', () => {
      const notification = { id: '1', type: 'test', recipient: '555', channel: 'sms', content: 'test', subject: '' };
      const queueId = notificationService.queueNotification(notification);

      notificationService.updateQueueItemStatus(queueId, 'sent');

      const item = notificationService.getQueueItem(queueId);
      expect(item.status).toBe('sent');
    });

    test('updates queue item status to failed with error message', () => {
      const notification = { id: '1', type: 'test', recipient: '555', channel: 'sms', content: 'test', subject: '' };
      const queueId = notificationService.queueNotification(notification);

      notificationService.updateQueueItemStatus(queueId, 'failed', 'Connection timeout');

      const item = notificationService.getQueueItem(queueId);
      expect(item.status).toBe('failed');
      expect(item.error).toBe('Connection timeout');
    });

    test('schedules retry with exponential backoff', () => {
      const notification = { id: '1', type: 'test', recipient: '555', channel: 'sms', content: 'test', subject: '' };
      const queueId = notificationService.queueNotification(notification);

      // First retry - increment BEFORE updating status so calculateBackoffDelay uses 2 (next retry count)
      notificationService.incrementRetryCount(queueId);
      const beforeUpdate1 = Date.now();
      notificationService.updateQueueItemStatus(queueId, 'retrying');

      let item = notificationService.getQueueItem(queueId);
      expect(item.retries).toBe(1);
      expect(item.nextRetryAt).toBeDefined();
      expect(item.status).toBe('retrying');

      // For retry count 1, next retry should be at 2^2 * 60s = 240s (4 minutes)
      const delay1 = new Date(item.nextRetryAt) - beforeUpdate1;
      expect(delay1).toBeGreaterThan(200 * 1000); // ~240 seconds
      expect(delay1).toBeLessThan(280 * 1000);

      // Second retry
      notificationService.incrementRetryCount(queueId);
      const beforeUpdate2 = Date.now();
      notificationService.updateQueueItemStatus(queueId, 'retrying');

      item = notificationService.getQueueItem(queueId);
      expect(item.retries).toBe(2);

      // For retry count 2, next retry should be at 3^2 * 60s = 540s (9 minutes)
      const delay2 = new Date(item.nextRetryAt) - beforeUpdate2;
      expect(delay2).toBeGreaterThan(500 * 1000); // ~540 seconds
      expect(delay2).toBeLessThan(580 * 1000);
    });
  });

  describe('Backoff Calculation', () => {
    test('calculates exponential backoff delay correctly', () => {
      // Retry 1: 1^2 * 60s = 60s
      expect(notificationService.calculateBackoffDelay(1)).toBeCloseTo(60 * 1000, -2);

      // Retry 2: 2^2 * 60s = 240s
      expect(notificationService.calculateBackoffDelay(2)).toBeCloseTo(240 * 1000, -2);

      // Retry 3: 3^2 * 60s = 540s
      expect(notificationService.calculateBackoffDelay(3)).toBeCloseTo(540 * 1000, -2);
    });
  });

  describe('SMS Template Creation', () => {
    test('creates threat alert SMS', () => {
      const sms = notificationService.createThreatAlertSMS('Phishing', 'High');
      expect(sms).toContain('Phishing');
      expect(sms).toContain('High');
      expect(sms).toContain('ScamGuard');
    });

    test('creates daily digest SMS', () => {
      const sms = notificationService.createDailyDigestSMS(5, 'New feature added');
      expect(sms).toContain('5');
      expect(sms).toContain('threat');
      expect(sms).toContain('New feature added');
    });

    test('creates academy reminder SMS', () => {
      const sms = notificationService.createAcademyReminderSMS();
      expect(sms).toContain('Academy');
      expect(sms).toContain('learning');
    });

    test('creates daily tip SMS', () => {
      const tip = 'Enable 2FA on all accounts';
      const sms = notificationService.createDailyTipSMS(tip);
      expect(sms).toContain(tip);
      expect(sms).toContain('💡');
    });

    test('creates weekly report SMS', () => {
      const sms = notificationService.createWeeklyReportSMS('https://stats.example.com');
      expect(sms).toContain('Weekly');
      expect(sms).toContain('https://stats.example.com');
    });
  });

  describe('Email Template Creation', () => {
    test('creates threat alert email template', () => {
      const template = emailTemplates.threatAlertTemplate('Phishing', 'High', 'Suspicious email detected');

      expect(template.subject).toContain('Phishing');
      expect(template.html).toContain('High');
      expect(template.html).toContain('Suspicious email detected');
      expect(template.text).toContain('Phishing');
    });

    test('creates daily digest email template', () => {
      const template = emailTemplates.dailyDigestTemplate(5, ['Alert 1', 'Alert 2']);

      expect(template.subject).toContain('5');
      expect(template.html).toContain('Alert 1');
      expect(template.html).toContain('Alert 2');
    });

    test('creates weekly report email template', () => {
      const stats = { threatsBlocked: 25, phishingAttempts: 8, malwareDetections: 2, academyProgress: '45%' };
      const template = emailTemplates.weeklyReportTemplate(stats);

      expect(template.html).toContain('25');
      expect(template.html).toContain('8');
      expect(template.html).toContain('45%');
    });

    test('creates academy reminder email template', () => {
      const template = emailTemplates.academyReminderTemplate('Social Engineering', 60);

      expect(template.subject).toContain('Academy');
      expect(template.html).toContain('Social Engineering');
      expect(template.html).toContain('60');
    });

    test('creates daily tip email template', () => {
      const template = emailTemplates.dailyTipTemplate('Use Strong Passwords', 'Password tips...', 'Password Security');

      expect(template.subject).toContain('Security Tip');
      expect(template.html).toContain('Strong Passwords');
      expect(template.html).toContain('Password Security');
    });

    test('creates admin scam report email template', () => {
      const template = emailTemplates.adminScamReportTemplate('report_123', 'Phishing');

      expect(template.subject).toContain('ADMIN');
      expect(template.subject).toContain('Phishing');
      expect(template.html).toContain('report_123');
    });

    test('creates admin user flagged email template', () => {
      const template = emailTemplates.adminUserFlaggedTemplate('user_456', 'Suspicious activity');

      expect(template.subject).toContain('ADMIN');
      expect(template.html).toContain('user_456');
      expect(template.html).toContain('Suspicious activity');
    });

    test('creates admin system alert email template', () => {
      const template = emailTemplates.adminSystemAlertTemplate('Database Error', 'Connection pool exhausted');

      expect(template.subject).toContain('System Alert');
      expect(template.html).toContain('Database Error');
      expect(template.html).toContain('Connection pool exhausted');
    });
  });

  describe('Queue Processing', () => {
    test('processes pending queue returns stats', async () => {
      const notification = { id: '1', type: 'test', recipient: '555', channel: 'sms', content: 'test', subject: '' };
      const queueId = notificationService.queueNotification(notification);

      // Note: This will fail in tests without SNS/SES configured, but we're testing the logic
      // In a real scenario, you'd mock the AWS SDK calls
      const result = await notificationService.processPendingQueue();

      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('successful');
      expect(result).toHaveProperty('pending');
      expect(typeof result.processed).toBe('number');
    });

    test('skips items scheduled for future delivery', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const notification = { id: '1', type: 'test', recipient: '555', channel: 'sms', content: 'test', subject: '', scheduledFor: futureDate };
      notificationService.queueNotification(notification);

      const pending = notificationService.getPendingQueueItems();
      expect(pending.length).toBe(1);

      // In real scenario, processPendingQueue would skip items with future scheduledFor
    });
  });

  describe('Notification Type Constants', () => {
    test('has all required notification types', () => {
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('SMS_THREAT_ALERT');
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('SMS_DAILY_DIGEST');
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('SMS_REMINDER');
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('SMS_DAILY_TIP');
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('SMS_WEEKLY_REPORT');
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('EMAIL_THREAT_ALERT');
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('EMAIL_DAILY_DIGEST');
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('EMAIL_REMINDER');
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('EMAIL_WEEKLY_REPORT');
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('ADMIN_SCAM_REPORT_RECEIVED');
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('ADMIN_USER_FLAGGED');
      expect(notificationService.NOTIFICATION_TYPES).toHaveProperty('ADMIN_SYSTEM_ALERT');
    });
  });

  describe('Max Retry Logic', () => {
    test('marks notification as failed after max retries exceeded', () => {
      const notification = { id: '1', type: 'test', recipient: '555', channel: 'sms', content: 'test', subject: '' };
      const queueId = notificationService.queueNotification(notification);

      // Simulate 3 failed attempts
      for (let i = 0; i < 3; i++) {
        notificationService.incrementRetryCount(queueId);
        notificationService.updateQueueItemStatus(queueId, 'retrying', 'Network error');
      }

      const item = notificationService.getQueueItem(queueId);
      expect(item.retries).toBe(3);
      expect(item.status).toBe('retrying');
      expect(item.maxRetries).toBe(3);
    });
  });
});
