/**
 * NotificationPreferences Component
 * Phase 1 Sprint 3 - Push Notification Configuration
 *
 * Allows users to manage notification settings and test notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  getPermissionStatus,
  requestPermission,
  isNotificationTypeEnabled,
  setNotificationTypePreference,
  sendNotification,
  getSecurityTips,
} from '../utils/notificationService';
import '../styles/NotificationPreferences.css';

const NOTIFICATION_TYPES = [
  {
    id: 'THREAT_ALERT',
    label: 'Alerte de Menace',
    description: 'Notification quand un contenu potentiellement malveillant est détecté',
    icon: '⚠️',
  },
  {
    id: 'ANALYSIS_COMPLETE',
    label: 'Analyse Terminée',
    description: 'Notification quand votre analyse de message est complétée',
    icon: '✅',
  },
  {
    id: 'QUIZ_REMINDER',
    label: 'Rappel Académie',
    description: 'Rappel quotidien pour continuer votre apprentissage',
    icon: '📚',
  },
  {
    id: 'DAILY_TIP',
    label: 'Conseil Quotidien',
    description: 'Un conseil de sécurité différent chaque jour',
    icon: '💡',
  },
  {
    id: 'WEEKLY_REPORT',
    label: 'Rapport Hebdomadaire',
    description: 'Résumé de votre activité de sécurité chaque semaine',
    icon: '📊',
  },
];

export default function NotificationPreferences() {
  const [expanded, setExpanded] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [preferences, setPreferences] = useState({});
  const [testingSentTo, setTestingSentTo] = useState(null);

  // Load permission status and preferences on mount
  useEffect(() => {
    setPermissionStatus(getPermissionStatus());

    const newPrefs = {};
    NOTIFICATION_TYPES.forEach((type) => {
      newPrefs[type.id] = isNotificationTypeEnabled(type.id);
    });
    setPreferences(newPrefs);
  }, []);

  // Handle permission request
  const handleRequestPermission = useCallback(async () => {
    const permission = await requestPermission();
    setPermissionStatus(permission);
  }, []);

  // Handle preference toggle
  const handleTogglePreference = useCallback((notificationType) => {
    const newValue = !preferences[notificationType];
    setNotificationTypePreference(notificationType, newValue);
    setPreferences((prev) => ({
      ...prev,
      [notificationType]: newValue,
    }));
  }, [preferences]);

  // Handle test notification
  const handleTestNotification = useCallback((notificationType) => {
    let data = {};

    if (notificationType === 'DAILY_TIP') {
      const tips = getSecurityTips();
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      data = { tip: randomTip };
    } else if (notificationType === 'THREAT_ALERT') {
      data = { message: 'Ceci est une notification de test' };
    }

    const sent = sendNotification(notificationType, data);
    if (sent) {
      setTestingSentTo(notificationType);
      setTimeout(() => setTestingSentTo(null), 2000);
    }
  }, []);

  const permissionGranted = permissionStatus === 'granted';
  const permissionDenied = permissionStatus === 'denied';

  return (
    <div className="notification-preferences">
      {/* Header with Toggle */}
      <div className="notification-header">
        <div
          className="notification-toggle-section"
          onClick={() => setExpanded(!expanded)}
        >
          <h3 className="notification-title">🔔 Notifications</h3>
          <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>▼</span>
        </div>

        {/* Permission Status Badge */}
        {permissionGranted && (
          <span className="permission-badge granted">✓ Autorisé</span>
        )}
        {permissionDenied && (
          <span className="permission-badge denied">✗ Refusé</span>
        )}
        {!permissionGranted && !permissionDenied && (
          <span className="permission-badge pending">- Non défini</span>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="notification-content">
          {/* Permission Section */}
          {!permissionGranted && (
            <div className="permission-section">
              <p className="permission-message">
                {permissionDenied
                  ? 'Les notifications sont actuellement bloquées. Vous pouvez les réactiver dans les paramètres de votre navigateur.'
                  : 'Cliquez sur le bouton ci-dessous pour activer les notifications de sécurité.'}
              </p>
              {!permissionDenied && (
                <button
                  onClick={handleRequestPermission}
                  className="btn-request-permission"
                >
                  🔔 Activer les Notifications
                </button>
              )}
            </div>
          )}

          {/* Notification Types List */}
          <div className="notification-types-list">
            {NOTIFICATION_TYPES.map((type) => (
              <div key={type.id} className="notification-type-item">
                <div className="type-info">
                  <span className="type-icon">{type.icon}</span>
                  <div className="type-details">
                    <h4 className="type-label">{type.label}</h4>
                    <p className="type-description">{type.description}</p>
                  </div>
                </div>

                <div className="type-controls">
                  {/* Toggle Switch */}
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferences[type.id] ?? true}
                      onChange={() => handleTogglePreference(type.id)}
                      disabled={!permissionGranted}
                    />
                    <span className="toggle-slider"></span>
                  </label>

                  {/* Test Button */}
                  <button
                    className={`btn-test ${
                      testingSentTo === type.id ? 'sent' : ''
                    }`}
                    onClick={() => handleTestNotification(type.id)}
                    disabled={!permissionGranted}
                    title="Envoyer une notification de test"
                  >
                    {testingSentTo === type.id ? '✓' : '📤'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="notification-footer">
            <p className="footer-text">
              💡 Les notifications sont envoyées uniquement si les permissions du navigateur
              sont accordées et si vos préférences les autorisent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
