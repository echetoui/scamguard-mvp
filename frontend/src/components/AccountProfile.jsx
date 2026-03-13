/**
 * AccountProfile Component
 * Phase 4.2 - Account management and user profile
 * Phase 1 Sprint 3 - Integrated Notification Preferences
 *
 * Displays user profile, preferences, statistics, and data management options
 */

import React, { useState } from 'react';
import NotificationPreferences from './NotificationPreferences';
import '../styles/AccountProfile.css';

const AVATARS = ['🛡️', '👴', '👵', '🧑', '🦸'];

export default function AccountProfile({
  profile = {},
  statistics = {},
  onUpdateName,
  onUpdateAvatar,
  onTogglePreference,
  onResetProfile,
  joinDate = '',
  onExportData,
  onLogout
}) {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile.name || '');

  const handleNameSave = () => {
    if (newName.trim() && newName !== profile.name) {
      onUpdateName(newName);
    }
    setEditingName(false);
    setNewName(profile.name || '');
  };

  const handleNameCancel = () => {
    setEditingName(false);
    setNewName(profile.name || '');
  };

  const handleReset = () => {
    if (window.confirm('⚠️ Êtes-vous sûr? Ceci réinitialisera votre profil.')) {
      onResetProfile();
    }
  };

  return (
    <div className="account-profile">
      {/* Section 1: Profile Card */}
      <div className="profile-card">
        <div className="avatar-display">{profile.avatar || '🛡️'}</div>

        <div className="avatar-picker">
          {AVATARS.map(emoji => (
            <button
              key={emoji}
              className={`avatar-option ${emoji === profile.avatar ? 'selected' : ''}`}
              onClick={() => onUpdateAvatar(emoji)}
              title={`Select ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="name-section">
          {!editingName ? (
            <div className="name-display">
              <span className="name-label">Nom:</span>
              <span className="name-value">{profile.name}</span>
              <button
                className="btn-edit"
                onClick={() => {
                  setEditingName(true);
                  setNewName(profile.name);
                }}
              >
                ✏️
              </button>
            </div>
          ) : (
            <div className="name-edit">
              <span className="name-label">Nom:</span>
              <input
                type="text"
                className="name-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
                onKeyPress={e => e.key === 'Enter' && handleNameSave()}
              />
              <button className="btn-save" onClick={handleNameSave}>
                ✓
              </button>
              <button className="btn-cancel" onClick={handleNameCancel}>
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="join-date">{joinDate}</div>
      </div>

      {/* Section 2: Account Statistics */}
      <div className="stats-section">
        <h3 className="section-title">📊 Vos statistiques</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-icon">🔍</span>
            <span className="stat-value">{statistics.total || 0}</span>
            <span className="stat-label">Analyses</span>
          </div>
          <div className="stat-box">
            <span className="stat-icon">✅</span>
            <span className="stat-value">{statistics.safe || 0}</span>
            <span className="stat-label">Sûrs</span>
          </div>
          <div className="stat-box">
            <span className="stat-icon">🎖️</span>
            <span className="stat-value">{statistics.totalXpEarned || 0}</span>
            <span className="stat-label">Points XP</span>
          </div>
          <div className="stat-box">
            <span className="stat-icon">📈</span>
            <span className="stat-value">{statistics.safePercentage || 0}%</span>
            <span className="stat-label">Réussite</span>
          </div>
        </div>
      </div>

      {/* Section 3: Preferences */}
      <div className="preferences-section">
        <h3 className="section-title">⚙️ Préférences</h3>

        {/* Notification Preferences Component */}
        <NotificationPreferences />

        <div className="preferences-list">
          <div className="preference-item">
            <span className="pref-icon">📅</span>
            <span className="pref-label">Rappel quotidien</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={profile.preferences?.dailyReminder ?? true}
                onChange={() => onTogglePreference('dailyReminder')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <span className="pref-icon">🔊</span>
            <span className="pref-label">Effets sonores</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={profile.preferences?.soundEffects ?? false}
                onChange={() => onTogglePreference('soundEffects')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 4: Data & Privacy */}
      <div className="data-section">
        <h3 className="section-title">🔒 Données & Confidentialité</h3>
        <button className="btn-export" onClick={onExportData}>
          📤 Exporter mes données
        </button>
        <button className="btn-reset" onClick={handleReset}>
          🗑️ Réinitialiser le compte
        </button>
      </div>

      {/* Section 5: Authentication */}
      <div className="auth-section">
        <h3 className="section-title">🔐 Authentification</h3>
        <button
          className="btn-logout"
          onClick={() => {
            if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
              onLogout();
            }
          }}
          title="Déconnexion"
        >
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );
}
