/**
 * Notification Service
 * ARCH.6 - SMS/Email Notification Service
 *
 * Handles SMS alerts, email notifications, notification queue management,
 * and user subscription preferences
 */

const AWS = require('aws-sdk');

// Initialize AWS services
const sns = new AWS.SNS({ region: process.env.AWS_REGION || 'us-east-1' });
const ses = new AWS.SES({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Notification Types
 */
const NOTIFICATION_TYPES = {
  // SMS Alerts
  SMS_THREAT_ALERT: 'SMS_THREAT_ALERT',
  SMS_DAILY_DIGEST: 'SMS_DAILY_DIGEST',
  SMS_REMINDER: 'SMS_REMINDER',
  SMS_DAILY_TIP: 'SMS_DAILY_TIP',
  SMS_WEEKLY_REPORT: 'SMS_WEEKLY_REPORT',

  // Email
  EMAIL_THREAT_ALERT: 'EMAIL_THREAT_ALERT',
  EMAIL_DAILY_DIGEST: 'EMAIL_DAILY_DIGEST',
  EMAIL_REMINDER: 'EMAIL_REMINDER',
  EMAIL_WEEKLY_REPORT: 'EMAIL_WEEKLY_REPORT',

  // Admin
  ADMIN_SCAM_REPORT_RECEIVED: 'ADMIN_SCAM_REPORT_RECEIVED',
  ADMIN_USER_FLAGGED: 'ADMIN_USER_FLAGGED',
  ADMIN_SYSTEM_ALERT: 'ADMIN_SYSTEM_ALERT'
};

/**
 * In-memory notification queue (in production, use RDS/DynamoDB)
 * Structure: { notificationId -> { type, recipient, content, status, retries, createdAt, scheduledFor } }
 */
const notificationQueue = new Map();

/**
 * User notification preferences (in production, use DynamoDB)
 * Structure: { userId -> { smsAlertsEnabled, emailAlertsEnabled, preferences: { type -> enabled } } }
 */
const userPreferences = new Map();

/**
 * Initialize default preferences for a user
 */
function initializeUserPreferences(userId) {
  if (!userPreferences.has(userId)) {
    userPreferences.set(userId, {
      userId,
      smsAlertsEnabled: true,
      emailAlertsEnabled: true,
      preferences: {
        [NOTIFICATION_TYPES.SMS_THREAT_ALERT]: true,
        [NOTIFICATION_TYPES.SMS_DAILY_DIGEST]: true,
        [NOTIFICATION_TYPES.SMS_REMINDER]: true,
        [NOTIFICATION_TYPES.SMS_DAILY_TIP]: true,
        [NOTIFICATION_TYPES.SMS_WEEKLY_REPORT]: true,
        [NOTIFICATION_TYPES.EMAIL_THREAT_ALERT]: true,
        [NOTIFICATION_TYPES.EMAIL_DAILY_DIGEST]: true,
        [NOTIFICATION_TYPES.EMAIL_REMINDER]: true,
        [NOTIFICATION_TYPES.EMAIL_WEEKLY_REPORT]: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  return userPreferences.get(userId);
}

/**
 * Get user notification preferences
 */
function getUserPreferences(userId) {
  return initializeUserPreferences(userId);
}

/**
 * Update user notification preferences
 */
function updateUserPreferences(userId, updates) {
  const prefs = initializeUserPreferences(userId);

  if (updates.smsAlertsEnabled !== undefined) {
    prefs.smsAlertsEnabled = updates.smsAlertsEnabled;
  }

  if (updates.emailAlertsEnabled !== undefined) {
    prefs.emailAlertsEnabled = updates.emailAlertsEnabled;
  }

  if (updates.preferences) {
    prefs.preferences = {
      ...prefs.preferences,
      ...updates.preferences
    };
  }

  prefs.updatedAt = new Date().toISOString();
  userPreferences.set(userId, prefs);

  return prefs;
}

/**
 * Check if a notification type is enabled for user
 */
function isNotificationTypeEnabled(userId, notificationType) {
  const prefs = getUserPreferences(userId);
  return prefs.preferences[notificationType] !== false;
}

/**
 * Generate unique notification ID
 */
function generateNotificationId() {
  return 'notif_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate unique queue ID
 */
function generateQueueId() {
  return 'queue_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Queue a notification for delivery
 * Returns the queue item ID
 */
function queueNotification(notification) {
  const queueId = generateQueueId();

  const queueItem = {
    id: queueId,
    notificationId: notification.id,
    type: notification.type,
    recipient: notification.recipient, // phone or email
    channel: notification.channel, // 'sms' or 'email'
    content: notification.content,
    subject: notification.subject,
    status: 'pending', // pending, sent, failed, retrying
    retries: 0,
    maxRetries: 3,
    createdAt: new Date().toISOString(),
    scheduledFor: notification.scheduledFor || new Date().toISOString(),
    lastAttemptAt: null,
    nextRetryAt: null,
    error: null
  };

  notificationQueue.set(queueId, queueItem);
  return queueId;
}

/**
 * Get queue item by ID
 */
function getQueueItem(queueId) {
  return notificationQueue.get(queueId);
}

/**
 * Get all pending queue items
 */
function getPendingQueueItems() {
  const items = [];
  for (const item of notificationQueue.values()) {
    if (item.status === 'pending' || item.status === 'retrying') {
      items.push(item);
    }
  }
  return items;
}

/**
 * Calculate exponential backoff delay (in milliseconds)
 * Retry 1: 1 minute, Retry 2: 4 minutes, Retry 3: 9 minutes
 */
function calculateBackoffDelay(retryCount) {
  const baseDelay = 60 * 1000; // 1 minute
  return baseDelay * Math.pow(retryCount, 2);
}

/**
 * Update queue item status
 */
function updateQueueItemStatus(queueId, status, error = null) {
  const item = notificationQueue.get(queueId);
  if (!item) return false;

  item.status = status;
  item.lastAttemptAt = new Date().toISOString();

  if (error) {
    item.error = error;
  }

  if (status === 'retrying' && item.retries < item.maxRetries) {
    const delayMs = calculateBackoffDelay(item.retries + 1);
    item.nextRetryAt = new Date(Date.now() + delayMs).toISOString();
  }

  notificationQueue.set(queueId, item);
  return true;
}

/**
 * Increment retry count for queue item
 */
function incrementRetryCount(queueId) {
  const item = notificationQueue.get(queueId);
  if (!item) return false;

  item.retries++;
  notificationQueue.set(queueId, item);
  return true;
}

/**
 * Send SMS via AWS SNS
 * @private
 */
async function sendSMSViaSNS(phoneNumber, message) {
  const topicArn = process.env.SNS_TOPIC_ARN;
  if (!topicArn) {
    throw new Error('SNS_TOPIC_ARN not configured');
  }

  // Convert to E.164 format
  const e164Phone = '+1' + phoneNumber.replace(/\D/g, '').slice(-10);

  try {
    const params = {
      TopicArn: topicArn,
      Subject: 'ScamGuard SMS Alert',
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    };

    const result = await sns.publish(params).promise();
    console.log(`[SMS] Sent to ${e164Phone} (MessageId: ${result.MessageId})`);
    return result.MessageId;
  } catch (error) {
    console.error(`[SMS] Error sending to ${e164Phone}:`, error.message);
    throw error;
  }
}

/**
 * Send email via AWS SES
 * @private
 */
async function sendEmailViaSES(toAddress, subject, htmlContent, textContent) {
  const fromAddress = process.env.SES_FROM_EMAIL || 'noreply@scamguard.app';

  try {
    const params = {
      Source: fromAddress,
      Destination: {
        ToAddresses: [toAddress]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8'
          },
          Text: {
            Data: textContent,
            Charset: 'UTF-8'
          }
        }
      }
    };

    const result = await ses.sendEmail(params).promise();
    console.log(`[EMAIL] Sent to ${toAddress} (MessageId: ${result.MessageId})`);
    return result.MessageId;
  } catch (error) {
    console.error(`[EMAIL] Error sending to ${toAddress}:`, error.message);
    throw error;
  }
}

/**
 * Create and queue SMS notification
 */
async function createAndQueueSMSNotification(userId, type, phoneNumber, content) {
  if (!isNotificationTypeEnabled(userId, type)) {
    return null;
  }

  const notification = {
    id: generateNotificationId(),
    userId,
    type,
    channel: 'sms',
    recipient: phoneNumber,
    content
  };

  const queueId = queueNotification({
    ...notification,
    channel: 'sms'
  });

  return { notification, queueId };
}

/**
 * Create and queue email notification
 */
async function createAndQueueEmailNotification(userId, type, emailAddress, subject, htmlContent, textContent) {
  if (!isNotificationTypeEnabled(userId, type)) {
    return null;
  }

  const notification = {
    id: generateNotificationId(),
    userId,
    type,
    channel: 'email',
    recipient: emailAddress,
    subject,
    htmlContent,
    textContent
  };

  const queueId = queueNotification({
    ...notification,
    channel: 'email',
    subject,
    content: textContent
  });

  return { notification, queueId };
}

/**
 * Process a queue item - attempt delivery with retry logic
 */
async function processQueueItem(queueId) {
  const item = getQueueItem(queueId);

  if (!item) {
    console.warn(`[QUEUE] Item not found: ${queueId}`);
    return false;
  }

  if (item.status === 'sent' || item.status === 'failed') {
    return item.status === 'sent';
  }

  try {
    if (item.channel === 'sms') {
      await sendSMSViaSNS(item.recipient, item.content);
    } else if (item.channel === 'email') {
      await sendEmailViaSES(item.recipient, item.subject, item.content, item.content);
    } else {
      throw new Error(`Unknown channel: ${item.channel}`);
    }

    updateQueueItemStatus(queueId, 'sent');
    console.log(`[QUEUE] Successfully sent: ${queueId}`);
    return true;
  } catch (error) {
    console.error(`[QUEUE] Error processing ${queueId}:`, error.message);

    // Check if we should retry
    if (item.retries < item.maxRetries) {
      incrementRetryCount(queueId);
      updateQueueItemStatus(queueId, 'retrying', error.message);
      console.log(`[QUEUE] Scheduled retry ${item.retries} for ${queueId}`);
      return false;
    } else {
      updateQueueItemStatus(queueId, 'failed', error.message);
      console.error(`[QUEUE] Max retries exceeded for ${queueId}`);
      return false;
    }
  }
}

/**
 * Process all pending queue items
 * Should be called periodically (e.g., every 5 minutes)
 */
async function processPendingQueue() {
  const pending = getPendingQueueItems();
  let processed = 0;
  let successful = 0;

  for (const item of pending) {
    // Check if it's time to process this item (based on scheduledFor)
    const scheduledTime = new Date(item.scheduledFor);
    if (scheduledTime > new Date()) {
      continue;
    }

    // For retrying items, check if backoff delay has passed
    if (item.status === 'retrying' && item.nextRetryAt) {
      const nextRetry = new Date(item.nextRetryAt);
      if (nextRetry > new Date()) {
        continue;
      }
    }

    const success = await processQueueItem(item.id);
    processed++;
    if (success) successful++;
  }

  return { processed, successful, pending: getPendingQueueItems().length };
}

/**
 * Create threat alert SMS
 */
function createThreatAlertSMS(threatType, severity) {
  return `⚠️ ScamGuard Alert: ${threatType} detected (${severity}). Check app for details.`;
}

/**
 * Create daily digest SMS
 */
function createDailyDigestSMS(threatCount, newFeatures) {
  return `📊 ScamGuard Daily: ${threatCount} threat(s) blocked today. ${newFeatures || 'Stay safe!'}`;
}

/**
 * Create academy reminder SMS
 */
function createAcademyReminderSMS() {
  return `📚 ScamGuard Academy: Continue learning! Complete today's module and earn points.`;
}

/**
 * Create daily tip SMS
 */
function createDailyTipSMS(tip) {
  return `💡 Daily Security Tip: ${tip}`;
}

/**
 * Create weekly report SMS
 */
function createWeeklyReportSMS(statsUrl) {
  return `📈 Weekly Report ready! Check your stats: ${statsUrl}`;
}

/**
 * Admin notification - scam report received
 */
function createAdminScamReportNotification(reportId, scamType) {
  return {
    subject: `New Scam Report: ${scamType}`,
    text: `A new scam report (${reportId}) has been submitted with type: ${scamType}. Review in admin dashboard.`,
    html: `<p>A new scam report has been submitted.</p><p><strong>Report ID:</strong> ${reportId}</p><p><strong>Type:</strong> ${scamType}</p>`
  };
}

/**
 * Admin notification - user flagged
 */
function createAdminUserFlaggedNotification(userId, reason) {
  return {
    subject: `User Flagged: ${userId}`,
    text: `User ${userId} has been flagged for review. Reason: ${reason}. See admin dashboard for details.`,
    html: `<p>User <strong>${userId}</strong> has been flagged for review.</p><p><strong>Reason:</strong> ${reason}</p>`
  };
}

/**
 * Admin notification - system alert
 */
function createAdminSystemAlert(alertType, details) {
  return {
    subject: `System Alert: ${alertType}`,
    text: `A system alert has been triggered: ${alertType}. Details: ${details}`,
    html: `<p>A system alert has been triggered.</p><p><strong>Type:</strong> ${alertType}</p><p><strong>Details:</strong> ${details}</p>`
  };
}

// Export functions
module.exports = {
  // Constants
  NOTIFICATION_TYPES,

  // User Preferences
  getUserPreferences,
  updateUserPreferences,
  isNotificationTypeEnabled,
  initializeUserPreferences,

  // Queue Management
  queueNotification,
  getQueueItem,
  getPendingQueueItems,
  updateQueueItemStatus,
  incrementRetryCount,
  processQueueItem,
  processPendingQueue,

  // Notification Creation
  createAndQueueSMSNotification,
  createAndQueueEmailNotification,

  // SMS Helpers
  createThreatAlertSMS,
  createDailyDigestSMS,
  createAcademyReminderSMS,
  createDailyTipSMS,
  createWeeklyReportSMS,

  // Admin Notifications
  createAdminScamReportNotification,
  createAdminUserFlaggedNotification,
  createAdminSystemAlert,

  // Internal (for testing)
  sendSMSViaSNS,
  sendEmailViaSES,
  generateNotificationId,
  generateQueueId,
  calculateBackoffDelay,

  // Dev/Debug
  getNotificationQueue: () => notificationQueue,
  getUserPreferencesStore: () => userPreferences,
  clearQueues: () => {
    notificationQueue.clear();
    userPreferences.clear();
  }
};
