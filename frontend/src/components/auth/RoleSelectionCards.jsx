/**
 * Role Selection Cards Component
 * Phase 4.4 - Role selection for Senior-First Authentication
 *
 * Displays role options with warm, accessible design
 * Extracted from SMSAuthScreen for reusability and testability
 */

import React from 'react';
import '../SMSAuthScreen.css';

export default function RoleSelectionCards({ selectedRole, onSelectRole, loading }) {
  const roles = [
    {
      id: 'senior',
      label: 'Je suis un Aîné',
      description: 'Je souhaite protéger ma sécurité en ligne',
      icon: '🧓',
      gradient: 'gold',
    },
    {
      id: 'family',
      label: 'Je protège ma famille',
      description: 'Aidant familial ou membre de la famille',
      icon: '👨‍👩‍👦',
      gradient: 'primary',
    },
    {
      id: 'individual',
      label: 'Je souhaite une protection personnelle',
      description: 'Protection individuelle générale',
      icon: '👤',
      gradient: 'sage',
    },
  ];

  return (
    <div className="role-selection-container">
      <h2 className="role-title">Qui êtes-vous?</h2>
      <p className="role-subtitle">
        Choisissez votre rôle pour une expérience personnalisée
      </p>

      <div className="role-cards">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            disabled={loading}
            className={`role-card role-${role.gradient} ${
              selectedRole === role.id ? 'selected' : ''
            }`}
            aria-pressed={selectedRole === role.id}
            aria-label={`${role.label}. ${role.description}`}
          >
            <div className="role-icon">{role.icon}</div>
            <h3 className="role-name">{role.label}</h3>
            <p className="role-description">{role.description}</p>

            {selectedRole === role.id && (
              <div className="role-checkmark" aria-hidden="true">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
