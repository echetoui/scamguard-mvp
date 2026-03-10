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

import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/authStorage';
import './FamilyDashboard.css';

export default function FamilyDashboard() {
  const [familyData, setFamilyData] = useState({
    familyName: 'Ma Famille',
    members: [],
    threats: [],
    inviteCode: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1';

  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();

        if (!token) {
          setError('Authentification requise');
          return;
        }

        const response = await fetch(`${API_URL}/family/dashboard`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            // User doesn't have a family
            setFamilyData({
              familyName: '',
              members: [],
              threats: [],
              inviteCode: ''
            });
            return;
          }
          throw new Error(`Erreur ${response.status}`);
        }

        const data = await response.json();
        setFamilyData({
          familyName: data.data?.familyName || 'Ma Famille',
          members: data.data?.members || [],
          threats: data.data?.threats || [],
          inviteCode: data.data?.inviteCode || ''
        });
      } catch (err) {
        setError('Impossible de charger les données familiales');
        console.error('Family dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, [API_URL]);

  const handleCopyInviteCode = () => {
    if (familyData.inviteCode) {
      navigator.clipboard.writeText(familyData.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  if (!familyData.familyName && familyData.members.length === 0) {
    return (
      <div className="family-dashboard empty">
        <div className="empty-state">
          <div className="empty-icon">👨‍👩‍👧‍👦</div>
          <h2>Pas de famille créée</h2>
          <p>Vous n'avez pas encore créé de groupe familial.</p>
          <p className="hint">Sélectionnez "Je protège ma famille" lors de votre inscription pour créer un groupe.</p>
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

        {error && (
          <div className="error-message" role="alert">
            ⚠️ {error}
          </div>
        )}

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
                      <span className="role-badge">{getRoleLabel(member.role)}</span>
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
