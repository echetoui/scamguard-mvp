/**
 * ARCH.6 - Notification Service API Integration Tests
 * Tests for notification endpoints and full workflow
 */

const request = require('supertest');
const express = require('express');
const notificationService = require('../services/notificationService');
const emailTemplates = require('../services/emailTemplates');

// Create test server with notification endpoints
const createTestServer = () => {
  const app = express();
  app.use(express.json());

  // Helper to extract user ID (simplified version)
  function extractUserIdFromToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return 'test-user-' + Math.random().toString(36).substr(2, 9);
    }
    try {
      const token = authHeader.substring(7);
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      return payload.userId || 'test-user';
    } catch {
      return 'test-user-' + Math.random().toString(36).substr(2, 9);
    }
  }

  // Endpoints
  app.post('/api/v1/notifications/preferences', (req, res) => {
    const userId = extractUserIdFromToken(req.headers.authorization);
    const prefs = notificationService.getUserPreferences(userId);
    res.json({ data: prefs });
  });

  app.put('/api/v1/notifications/preferences', (req, res) => {
    const userId = extractUserIdFromToken(req.headers.authorization);
    const { smsAlertsEnabled, emailAlertsEnabled, preferences } = req.body;
    const updated = notificationService.updateUserPreferences(userId, {
      smsAlertsEnabled,
      emailAlertsEnabled,
      preferences
    });
    res.json({ data: updated, message: 'Preferences updated successfully' });
  });

  app.post('/api/v1/notifications/test-sms', async (req, res) => {
    const userId = extractUserIdFromToken(req.headers.authorization);
    const { phoneNumber, type } = req.body;

    if (!phoneNumber || !type) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'phoneNumber and type are required' }
      });
    }

    // Check if SMS alerts are enabled globally
    const prefs = notificationService.getUserPreferences(userId);
    if (!prefs.smsAlertsEnabled) {
      return res.status(400).json({
        error: { code: 'DISABLED', message: 'SMS notifications are disabled for your account' }
      });
    }

    let content = '';
    if (type === 'THREAT_ALERT') {
      content = notificationService.createThreatAlertSMS('Phishing', 'High');
    } else if (type === 'DAILY_DIGEST') {
      content = notificationService.createDailyDigestSMS(5);
    }

    const result = await notificationService.createAndQueueSMSNotification(userId, type, phoneNumber, content);

    if (!result) {
      return res.status(400).json({
        error: { code: 'DISABLED', message: 'This notification type is disabled' }
      });
    }

    res.json({
      data: {
        queueId: result.queueId,
        notificationId: result.notification.id,
        message: 'Test SMS queued for delivery'
      }
    });
  });

  app.post('/api/v1/notifications/test-email', async (req, res) => {
    const userId = extractUserIdFromToken(req.headers.authorization);
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'email and type are required' }
      });
    }

    let template = {};
    if (type === 'THREAT_ALERT') {
      template = emailTemplates.threatAlertTemplate('Phishing', 'High');
    }

    const result = await notificationService.createAndQueueEmailNotification(
      userId,
      type,
      email,
      template.subject,
      template.html,
      template.text
    );

    if (!result) {
      return res.status(400).json({
        error: { code: 'DISABLED', message: 'This notification type is disabled' }
      });
    }

    res.json({
      data: {
        queueId: result.queueId,
        notificationId: result.notification.id,
        message: 'Test email queued for delivery'
      }
    });
  });

  app.get('/api/v1/notifications/queue', (req, res) => {
    const queue = notificationService.getNotificationQueue();
    const pending = notificationService.getPendingQueueItems();

    const stats = {
      total: queue.size,
      pending: pending.length,
      sent: Array.from(queue.values()).filter(q => q.status === 'sent').length,
      failed: Array.from(queue.values()).filter(q => q.status === 'failed').length,
      retrying: Array.from(queue.values()).filter(q => q.status === 'retrying').length
    };

    res.json({
      data: {
        stats,
        items: pending.slice(0, 10)
      }
    });
  });

  app.post('/api/v1/notifications/process-queue', async (req, res) => {
    const result = await notificationService.processPendingQueue();
    res.json({
      data: result,
      message: 'Queue processing completed'
    });
  });

  return app;
};

describe('ARCH.6 Notification Service API', () => {
  let server;

  beforeEach(() => {
    server = createTestServer();
    notificationService.clearQueues();
  });

  describe('GET/POST /notifications/preferences', () => {
    test('gets user notification preferences', async () => {
      const response = await request(server)
        .post('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer dGVzdA==')
        .expect(200);

      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('smsAlertsEnabled');
      expect(response.body.data).toHaveProperty('emailAlertsEnabled');
      expect(response.body.data).toHaveProperty('preferences');
    });

    test('updates user notification preferences', async () => {
      const updates = {
        smsAlertsEnabled: false,
        preferences: {
          [notificationService.NOTIFICATION_TYPES.SMS_DAILY_DIGEST]: false
        }
      };

      const response = await request(server)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', 'Bearer dGVzdA==')
        .send(updates)
        .expect(200);

      expect(response.body.data.smsAlertsEnabled).toBe(false);
      expect(response.body.message).toContain('updated successfully');
    });

    test('persists preferences across requests', async () => {
      // Create consistent token for this test
      const token = Buffer.from(JSON.stringify({ userId: 'persist-test-user' })).toString('base64');

      // First request: update preferences
      await request(server)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          smsAlertsEnabled: false
        })
        .expect(200);

      // Second request: retrieve preferences
      const response = await request(server)
        .post('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.smsAlertsEnabled).toBe(false);
    });
  });

  describe('POST /notifications/test-sms', () => {
    test('queues test SMS notification', async () => {
      const response = await request(server)
        .post('/api/v1/notifications/test-sms')
        .set('Authorization', 'Bearer dGVzdA==')
        .send({
          phoneNumber: '5551234567',
          type: notificationService.NOTIFICATION_TYPES.SMS_THREAT_ALERT
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('queueId');
      expect(response.body.data).toHaveProperty('notificationId');
      expect(response.body.data.message).toContain('queued');
    });

    test('rejects test SMS without required fields', async () => {
      const response = await request(server)
        .post('/api/v1/notifications/test-sms')
        .set('Authorization', 'Bearer dGVzdA==')
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    test('respects user preferences when queuing SMS', async () => {
      const token = Buffer.from(JSON.stringify({ userId: 'sms-pref-test-user' })).toString('base64');

      // Disable SMS alerts
      await request(server)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          smsAlertsEnabled: false
        });

      // Try to queue SMS
      const response = await request(server)
        .post('/api/v1/notifications/test-sms')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: '5551234567',
          type: notificationService.NOTIFICATION_TYPES.SMS_THREAT_ALERT
        })
        .expect(400);

      expect(response.body.error.code).toBe('DISABLED');
    });
  });

  describe('POST /notifications/test-email', () => {
    test('queues test email notification', async () => {
      const response = await request(server)
        .post('/api/v1/notifications/test-email')
        .set('Authorization', 'Bearer dGVzdA==')
        .send({
          email: 'test@example.com',
          type: notificationService.NOTIFICATION_TYPES.EMAIL_THREAT_ALERT
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('queueId');
      expect(response.body.data).toHaveProperty('notificationId');
    });

    test('rejects test email without required fields', async () => {
      const response = await request(server)
        .post('/api/v1/notifications/test-email')
        .set('Authorization', 'Bearer dGVzdA==')
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });
  });

  describe('GET /notifications/queue', () => {
    test('returns queue status statistics', async () => {
      // Queue a notification first
      await notificationService.queueNotification({
        id: 'test_1',
        type: 'test',
        recipient: '555',
        channel: 'sms',
        content: 'test',
        subject: ''
      });

      const response = await request(server)
        .get('/api/v1/notifications/queue')
        .expect(200);

      expect(response.body.data.stats).toHaveProperty('total');
      expect(response.body.data.stats).toHaveProperty('pending');
      expect(response.body.data.stats).toHaveProperty('sent');
      expect(response.body.data.stats).toHaveProperty('failed');
      expect(response.body.data.stats).toHaveProperty('retrying');
      expect(response.body.data).toHaveProperty('items');
    });

    test('shows correct queue counts', async () => {
      // Queue 3 items
      for (let i = 0; i < 3; i++) {
        notificationService.queueNotification({
          id: `test_${i}`,
          type: 'test',
          recipient: '555',
          channel: 'sms',
          content: 'test',
          subject: ''
        });
      }

      const response = await request(server)
        .get('/api/v1/notifications/queue')
        .expect(200);

      expect(response.body.data.stats.total).toBe(3);
      expect(response.body.data.stats.pending).toBe(3);
    });
  });

  describe('POST /notifications/process-queue', () => {
    test('returns processing statistics', async () => {
      const response = await request(server)
        .post('/api/v1/notifications/process-queue')
        .expect(200);

      expect(response.body.data).toHaveProperty('processed');
      expect(response.body.data).toHaveProperty('successful');
      expect(response.body.data).toHaveProperty('pending');
      expect(response.body.message).toContain('completed');
    });
  });

  describe('End-to-end notification workflow', () => {
    test('complete SMS notification workflow', async () => {
      const token = Buffer.from(JSON.stringify({ userId: 'e2e-sms-user' })).toString('base64');
      const phoneNumber = '5551234567';
      const type = notificationService.NOTIFICATION_TYPES.SMS_THREAT_ALERT;

      // Step 1: Get initial preferences
      const prefsResponse1 = await request(server)
        .post('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(prefsResponse1.body.data.smsAlertsEnabled).toBe(true);

      // Step 2: Queue SMS
      const queueResponse = await request(server)
        .post('/api/v1/notifications/test-sms')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber, type })
        .expect(200);

      const queueId = queueResponse.body.data.queueId;
      expect(queueId).toBeDefined();

      // Step 3: Check queue status
      const queueStatusResponse = await request(server)
        .get('/api/v1/notifications/queue')
        .expect(200);

      expect(queueStatusResponse.body.data.stats.pending).toBeGreaterThan(0);

      // Step 4: Disable SMS alerts
      await request(server)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ smsAlertsEnabled: false })
        .expect(200);

      // Step 5: Verify preferences updated
      const prefsResponse2 = await request(server)
        .post('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(prefsResponse2.body.data.smsAlertsEnabled).toBe(false);
    });

    test('complete email notification workflow', async () => {
      const email = 'test@example.com';
      const type = notificationService.NOTIFICATION_TYPES.EMAIL_THREAT_ALERT;

      // Queue email
      const queueResponse = await request(server)
        .post('/api/v1/notifications/test-email')
        .set('Authorization', 'Bearer dGVzdA==')
        .send({ email, type })
        .expect(200);

      expect(queueResponse.body.data.queueId).toBeDefined();

      // Check queue
      const queueStatus = await request(server)
        .get('/api/v1/notifications/queue')
        .expect(200);

      expect(queueStatus.body.data.stats.total).toBeGreaterThan(0);
    });

    test('multiple users have isolated preferences', async () => {
      // User 1: Create token
      const token1 = Buffer.from(JSON.stringify({ userId: 'user1' })).toString('base64');

      // User 2: Create token
      const token2 = Buffer.from(JSON.stringify({ userId: 'user2' })).toString('base64');

      // User 1: Disable SMS
      await request(server)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${token1}`)
        .send({ smsAlertsEnabled: false })
        .expect(200);

      // User 2: Check SMS still enabled
      const user2Prefs = await request(server)
        .post('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(user2Prefs.body.data.smsAlertsEnabled).toBe(true);

      // User 1: Check SMS disabled
      const user1Prefs = await request(server)
        .post('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(user1Prefs.body.data.smsAlertsEnabled).toBe(false);
    });
  });
});
