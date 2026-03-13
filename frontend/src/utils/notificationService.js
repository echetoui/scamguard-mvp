/**
 * Notification Service Utility
 * Phase 1 Sprint 3 - Push Notifications
 *
 * Manages browser push notifications using the Notifications API
 */

const NOTIFICATION_PREFERENCES_KEY = 'scamguard_notification_preferences';
const NOTIFICATION_TIMESTAMPS_KEY = 'scamguard_notification_timestamps';

/**
 * Request permission from the user to show notifications
 * @returns {Promise<string>} 'granted', 'denied', or 'default'
 */
export const requestPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission !== 'default') {
    // Permission already granted or denied
    return Notification.permission;
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Get current permission status
 * @returns {string} 'granted', 'denied', or 'default'
 */
export const getPermissionStatus = () => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Check if notifications are enabled for a specific type
 * @param {string} notificationType - Type of notification
 * @returns {boolean}
 */
export const isNotificationTypeEnabled = (notificationType) => {
  const preferences = getNotificationPreferences();
  return preferences[notificationType] !== false; // Default to true if not set
};

/**
 * Send a notification
 * @param {string} type - Notification type (THREAT_ALERT, QUIZ_REMINDER, DAILY_TIP, etc.)
 * @param {Object} data - Additional data for the notification
 * @returns {boolean} True if notification was sent, false otherwise
 */
export const sendNotification = (type, data = {}) => {
  const permission = getPermissionStatus();
  if (permission !== 'granted') {
    return false;
  }

  // Check if this notification type is enabled
  if (!isNotificationTypeEnabled(type)) {
    return false;
  }

  const notificationConfig = getNotificationConfig(type, data);
  if (!notificationConfig) {
    console.warn(`Unknown notification type: ${type}`);
    return false;
  }

  try {
    new Notification(notificationConfig.title, {
      icon: '🛡️',
      badge: '🛡️',
      body: notificationConfig.body,
      tag: type, // Replace previous notifications of same type
      ...notificationConfig.options,
    });

    // Record timestamp for daily/weekly limit checks
    recordNotificationTimestamp(type);
    return true;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
};

/**
 * Get notification configuration based on type
 * @private
 */
const getNotificationConfig = (type, data) => {
  const configs = {
    THREAT_ALERT: {
      title: '⚠️ Alerte de Menace Détectée',
      body: data.message || 'Un contenu potentiellement malveillant a été analysé.',
      options: { tag: 'threat-alert' },
    },
    QUIZ_REMINDER: {
      title: '📚 Rappel Académie',
      body: 'Continuez votre apprentissage avec nos modules de formation!',
      options: { tag: 'quiz-reminder' },
    },
    DAILY_TIP: {
      title: '💡 Conseil de Sécurité',
      body: data.tip || 'Activez l\'authentification deux facteurs sur tous vos comptes importants.',
      options: { tag: 'daily-tip' },
    },
    ANALYSIS_COMPLETE: {
      title: '✅ Analyse Terminée',
      body: data.verdict || 'Votre analyse a été complétée.',
      options: { tag: 'analysis-complete' },
    },
    WEEKLY_REPORT: {
      title: '📊 Rapport Hebdomadaire',
      body: data.summary || 'Consultez votre bilan de sécurité hebdomadaire.',
      options: { tag: 'weekly-report' },
    },
  };

  return configs[type];
};

/**
 * Get notification preferences from localStorage
 * @returns {Object}
 */
export const getNotificationPreferences = () => {
  const stored = localStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
  return stored
    ? JSON.parse(stored)
    : {
        THREAT_ALERT: true,
        QUIZ_REMINDER: true,
        DAILY_TIP: true,
        ANALYSIS_COMPLETE: true,
        WEEKLY_REPORT: true,
      };
};

/**
 * Set preference for a notification type
 * @param {string} notificationType - Type of notification
 * @param {boolean} enabled - Whether to enable this notification type
 */
export const setNotificationTypePreference = (notificationType, enabled) => {
  const preferences = getNotificationPreferences();
  preferences[notificationType] = enabled;
  localStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(preferences));
};

/**
 * Record when a notification was sent (for rate limiting daily/weekly notifications)
 * @private
 */
const recordNotificationTimestamp = (type) => {
  const timestamps = getNotificationTimestamps();
  if (!timestamps[type]) {
    timestamps[type] = [];
  }
  timestamps[type].push(new Date().toISOString());
  localStorage.setItem(NOTIFICATION_TIMESTAMPS_KEY, JSON.stringify(timestamps));
};

/**
 * Get notification timestamps
 * @private
 */
const getNotificationTimestamps = () => {
  const stored = localStorage.getItem(NOTIFICATION_TIMESTAMPS_KEY);
  return stored ? JSON.parse(stored) : {};
};

/**
 * Check if a daily notification should be sent (max once per day)
 * @param {string} type - Notification type
 * @returns {boolean}
 */
export const shouldSendDailyNotification = (type) => {
  const timestamps = getNotificationTimestamps();
  const typeTimestamps = timestamps[type] || [];

  if (typeTimestamps.length === 0) {
    return true;
  }

  // Check if last notification was sent today
  const lastTimestamp = new Date(typeTimestamps[typeTimestamps.length - 1]);
  const now = new Date();

  return (
    lastTimestamp.toDateString() !== now.toDateString()
  );
};

/**
 * Check if a weekly notification should be sent (max once per week)
 * @param {string} type - Notification type
 * @returns {boolean}
 */
export const shouldSendWeeklyNotification = (type) => {
  const timestamps = getNotificationTimestamps();
  const typeTimestamps = timestamps[type] || [];

  if (typeTimestamps.length === 0) {
    return true;
  }

  // Check if last notification was sent more than 7 days ago
  const lastTimestamp = new Date(typeTimestamps[typeTimestamps.length - 1]);
  const now = new Date();
  const daysSince = Math.floor((now - lastTimestamp) / (1000 * 60 * 60 * 24));

  return daysSince >= 7;
};

/**
 * Get array of security tips for DAILY_TIP notifications
 * @returns {Array<string>}
 */
export const getSecurityTips = () => {
  return [
    'Utilisez des mots de passe uniques et forts pour chaque compte important.',
    'Vérifiez toujours l\'adresse email complète de l\'expéditeur avant de cliquer sur un lien.',
    'N\'activez jamais le partage de localisation pour les applications non essentielles.',
    'Mettez à jour régulièrement votre système d\'exploitation et vos applications.',
    'Activez l\'authentification deux facteurs sur tous vos comptes sensibles.',
    'Ne partagez jamais votre code PIN ou vos codes de sécurité par téléphone ou email.',
    'Vérifiez les paramètres de confidentialité de vos comptes de réseaux sociaux chaque mois.',
  ];
};

/**
 * Clear all notification timestamps (for testing/reset)
 */
export const clearNotificationTimestamps = () => {
  localStorage.removeItem(NOTIFICATION_TIMESTAMPS_KEY);
};

/**
 * Clear all notification preferences (for testing/reset)
 */
export const clearNotificationPreferences = () => {
  localStorage.removeItem(NOTIFICATION_PREFERENCES_KEY);
};
