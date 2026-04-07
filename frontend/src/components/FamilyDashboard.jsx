/**
 * FamilyDashboard Component
 * Phase 5A - Family Protection Dashboard
 *
 * Features:
 *  ✅ Display family members with protection status
 *  ✅ Show recent threats reported in family
 *  ✅ Invite code management
 *  ✅ Member role display (Senior, Family/Aidant)
 *  ✅ Last active timestamp
 *  ✅ WCAG AAA accessibility
 *  ✅ Automne Québécois design system
 */

import React, { useState } from 'react';
import { Alert, Badge } from '@/design-system';
import { getAuthToken } from '../utils/authStorage';
import useFamilyDashboard from '../hooks/useFamilyDashboard';
import GuardianAngelPanel from './GuardianAngelPanel';
import './FamilyDashboard.css';

export default function FamilyDashboard({ onAnalyzeMessage, onReportScam }) {
  const { familyData, loading, error } = useFamilyDashboard();
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [mode, setMode] = useState('join'); // 'join' or 'create'
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  const API_URL = 'http://localhost:3001/api/v1';

  const handleCopyInviteCode = () => {
    if (familyData.inviteCode) {
      navigator.clipboard.writeText(familyData.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinFamily = async () => {
    if (!joinCode || joinCode.length !== 6) {
      setJoinError('Le code doit contenir 6 caractères');
      return;
    }
    setJoinLoading(true);
    setJoinError('');
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/family/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinCode.toUpperCase() }),
      });
      if (!response.ok) throw new Error('Code invalide');
      setJoinSuccess(true);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setJoinError('Code invalide ou expiré. Vérifiez avec votre proche.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    setCreateLoading(true);
    setCreateError('');
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/family/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyName: createName || 'Ma Famille' }),
      });
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 400 && data.error?.code === 'ALREADY_IN_FAMILY') {
          setCreateError('Vous êtes déjà membre d\'une famille');
        } else {
          setCreateError('Erreur lors de la création de la famille');
        }
        return;
      }
      setCreateSuccess(true);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setCreateError('Erreur lors de la création. Vérifiez votre connexion.');
    } finally {
      setCreateLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'senior': return '🧓';
      case 'family': return '👨‍👩‍👦';
      default: return '👤';
    }
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'senior': return 'Aîné';
      case 'family': return 'Aidant Familial';
      default: return 'Indépendant';
    }
  };

  const getStatusIcon = (lastActive) => {
    if (!lastActive) return '⚪';
    const minutesAgo = (Date.now() - new Date(lastActive).getTime()) / 60000;
    if (minutesAgo < 5) return '🟢'; // Active
    if (minutesAgo < 60) return '🟡'; // Recent
    return '⚪'; // Inactive
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Jamais';
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'À l\'instant';
  };

  const formatThreatLevel = (level) => {
    switch(level?.toUpperCase()) {
      case 'CRITICAL': return { icon: '🔴', label: 'Critique' };
      case 'HIGH': return { icon: '🟠', label: 'Élevé' };
      case 'MEDIUM': return { icon: '🟡', label: 'Moyen' };
      case 'LOW': return { icon: '🟢', label: 'Faible' };
      default: return { icon: '⚪', label: 'Inconnu' };
    }
  };

  if (loading) {
    return (
      <div className="family-dashboard loading" aria-live="polite" aria-busy="true">
        <div className="spinner" aria-hidden="true">⏳</div>
        <p>Chargement de votre famille...</p>
      </div>
    );
  }

  if (!familyData || (!familyData.familyName && familyData.members.length === 0)) {
    return (
      <div className="family-dashboard">
        <div className="container">
          <div className="join-family-section">
            <div className="empty-icon">👨‍👩‍👧‍👦</div>
            <h2>Groupe Familial</h2>
            <p>Vous n'avez pas encore de groupe familial.</p>

            {/* Mode Toggle */}
            <div className="family-mode-toggle">
              <button
                className={`mode-btn ${mode === 'join' ? 'active' : ''}`}
                onClick={() => setMode('join')}
                aria-label="Mode rejoindre une famille"
              >
                🤝 Rejoindre
              </button>
              <button
                className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
                onClick={() => setMode('create')}
                aria-label="Mode créer une famille"
              >
                ➕ Créer
              </button>
            </div>

            {/* Join Family Form */}
            {mode === 'join' && (
              <div className="join-code-form">
                <p className="hint">Demandez le code d'invitation à votre proche aidant.</p>
                <label htmlFor="join-code-input">Code d'invitation (6 caractères) :</label>
                <input
                  id="join-code-input"
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="Ex: ABC123"
                  className="join-code-input"
                  maxLength={6}
                  disabled={joinLoading || joinSuccess}
                  aria-label="Entrez le code d'invitation de 6 caractères"
                />
                <button
                  onClick={handleJoinFamily}
                  className="btn-join"
                  disabled={joinLoading || joinCode.length !== 6 || joinSuccess}
                >
                  {joinLoading ? '⏳ Connexion...' : joinSuccess ? '✅ Rejoint!' : '🤝 Rejoindre'}
                </button>
                {joinError && <p className="join-error" role="alert">{joinError}</p>}
              </div>
            )}

            {/* Create Family Form */}
            {mode === 'create' && (
              <div className="create-family-form">
                <p className="hint">Créez un nouveau groupe familial et invitez vos proches.</p>
                <label htmlFor="create-name-input">Nom de la famille (optionnel) :</label>
                <input
                  id="create-name-input"
                  type="text"
                  value={createName}
                  onChange={e => setCreateName(e.target.value.slice(0, 50))}
                  placeholder="Ex: Famille Tremblay"
                  className="create-name-input"
                  maxLength={50}
                  disabled={createLoading || createSuccess}
                  aria-label="Entrez le nom de votre famille"
                />
                <button
                  onClick={handleCreateFamily}
                  className="btn-create"
                  disabled={createLoading || createSuccess}
                >
                  {createLoading ? '⏳ Création...' : createSuccess ? '✅ Créée!' : '➕ Créer'}
                </button>
                {createError && <p className="create-error" role="alert">{createError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="family-dashboard">
      <div className="container">
        {/* Header */}
        <div className="family-header">
          <h2>{familyData.familyName}</h2>
          <p className="family-description">
            Gérez et surveillez la protection de votre famille
          </p>
        </div>

        {error && <Alert variant="error" title="Erreur" message={error} />}

        {/* Invite Code Section */}
        {familyData.inviteCode && (
          <div className="invite-section">
            <h3>🎟️ Code d'invitation</h3>
            <p className="invite-description">
              Partagez ce code avec vos proches pour les ajouter à votre groupe familial.
            </p>
            <div className="invite-code-box">
              <code className="invite-code">{familyData.inviteCode}</code>
              <button
                onClick={handleCopyInviteCode}
                className="btn-copy"
                aria-label="Copier le code d'invitation"
              >
                {copied ? '✅ Copié!' : '📋 Copier'}
              </button>
            </div>
          </div>
        )}

        {/* Members Section */}
        <div className="members-section">
          <h3>👥 Membres du groupe ({familyData.members.length})</h3>

          {familyData.members.length === 0 ? (
            <div className="empty-members">
              <p>Aucun membre dans votre groupe familial.</p>
              <p className="hint">Partagez votre code d'invitation pour ajouter des proches.</p>
            </div>
          ) : (
            <div className="members-grid">
              {familyData.members.map((member, index) => (
                <div
                  key={index}
                  className="member-card"
                  aria-label={`${member.email?.split('@')[0]}, ${getRoleLabel(member.role)}, actif il y a ${formatTimeAgo(member.lastActive)}`}
                >
                  <div className="member-header">
                    <div className="member-icon">
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="member-status">
                      {getStatusIcon(member.lastActive)}
                    </div>
                  </div>

                  <div className="member-content">
                    <h4 className="member-name">{member.email?.split('@')[0]}</h4>
                    <div className="member-role">
                      <Badge variant="tonal" color={member.role === 'senior' ? 'primary' : 'secondary'} size="small">
                        {getRoleLabel(member.role)}
                      </Badge>
                    </div>
                    <div className="member-activity">
                      <small>
                        Actif il y a {formatTimeAgo(member.lastActive)}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guardian Angel Panel (for family caregivers) */}
        {familyData.currentUserRole === 'family' && familyData.members.length > 0 && (
          <GuardianAngelPanel
            members={familyData.members}
            onAnalyzeMessage={onAnalyzeMessage || (() => {})}
            onReportScam={onReportScam || (() => {})}
          />
        )}

        {/* Recent Threats Section */}
        {familyData.threats && familyData.threats.length > 0 && (
          <div className="threats-section">
            <h3>🚨 Menaces récentes dans la famille</h3>

            <div className="threats-list" role="list">
              {familyData.threats.map((threat, index) => {
                const threatLevel = formatThreatLevel(threat.severity);
                return (
                  <div key={index} className="threat-item" role="listitem">
                    <div className="threat-level-indicator" aria-hidden="true">
                      {threatLevel.icon}
                    </div>

                    <div className="threat-content">
                      <div className="threat-header">
                        <span className="threat-type">{threat.scamType || 'Arnaque'}</span>
                        <span className="threat-level">{threatLevel.label}</span>
                      </div>
                      <div className="threat-reported">
                        <small>
                          Signalé par {threat.reportedBy?.split('@')[0] || 'Utilisateur'}
                          {threat.reportedAt && ` • ${formatTimeAgo(threat.reportedAt)}`}
                        </small>
                      </div>
                      {threat.content && (
                        <div className="threat-description">
                          <p>{threat.content.substring(0, 150)}...</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty Threats State */}
        {(!familyData.threats || familyData.threats.length === 0) && (
          <div className="threats-empty">
            <div className="empty-icon">✅</div>
            <p>Aucune menace signalée dans votre groupe familial.</p>
            <p className="hint">C'est excellent ! Votre famille est bien protégée.</p>
          </div>
        )}
      </div>
    </div>
  );
}
