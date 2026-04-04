/**
 * API Key Management Module
 * Generate, manage, and track API keys with rate limiting
 * Story Points: 5
 */

import React, { useState } from 'react';
import '../styles/APIKeyManagement.css';

const APIKeyManagement = ({ institutionId }) => {
  const [apiKeys, setApiKeys] = useState([
    {
      id: 'key_123abc',
      name: 'Production API Key',
      createdAt: '2026-01-15',
      lastUsed: '2026-03-12T15:30:00',
      rateLimit: 1000,
      requestsToday: 456,
      status: 'active'
    },
    {
      id: 'key_456def',
      name: 'Development API Key',
      createdAt: '2026-02-01',
      lastUsed: '2026-03-10T10:00:00',
      rateLimit: 100,
      requestsToday: 12,
      status: 'active'
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      alert('Veuillez entrer un nom pour la clé');
      return;
    }

    const newKey = {
      id: `key_${Math.random().toString(36).substr(2, 9)}`,
      name: newKeyName,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: null,
      rateLimit: newKeyRateLimit,
      requestsToday: 0,
      status: 'active'
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    setNewKeyRateLimit(1000);
    setShowCreateForm(false);
  };

  const handleRevokeKey = (keyId) => {
    if (window.confirm('Êtes-vous sûr de vouloir révoquer cette clé? Cela arrêtera toutes les requêtes utilisant cette clé.')) {
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    }
  };

  const handleCopyKey = (keyId) => {
    navigator.clipboard.writeText(keyId);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUpdateRateLimit = (keyId, newLimit) => {
    setApiKeys(apiKeys.map(k =>
      k.id === keyId ? { ...k, rateLimit: newLimit } : k
    ));
  };

  const usagePercentage = (requests, limit) => {
    return Math.min(100, (requests / limit) * 100);
  };

  return (
    <div className="api-key-management-container">
      {/* Header */}
      <div className="api-key-header">
        <h2>Gestion des Clés API</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✕ Annuler' : '➕ Créer Nouvelle Clé'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="api-key-create-form">
          <h3>Créer une Nouvelle Clé API</h3>
          <div className="form-group">
            <label htmlFor="key-name">Nom de la Clé</label>
            <input
              id="key-name"
              type="text"
              placeholder="Ex: Production, Développement, Test..."
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="rate-limit">Limite de Taux (requêtes/jour)</label>
            <input
              id="rate-limit"
              type="number"
              min="10"
              max="10000"
              step="10"
              value={newKeyRateLimit}
              onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value))}
              className="form-input"
            />
            <small>Nombre maximum de requêtes autorisées par jour</small>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleCreateKey}>
              Créer la Clé
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="api-keys-list">
        {apiKeys.length === 0 ? (
          <div className="no-keys-message">
            <p>Aucune clé API créée. Créez une nouvelle clé pour commencer.</p>
          </div>
        ) : (
          apiKeys.map(key => (
            <div key={key.id} className="api-key-card">
              <div className="key-header">
                <div>
                  <h3>{key.name}</h3>
                  <p className="key-id-label">ID: {key.id}</p>
                </div>
                <span className={`status-badge status-${key.status}`}>
                  {key.status === 'active' ? '✓ Active' : '✕ Révoquée'}
                </span>
              </div>

              <div className="key-details">
                <div className="detail-item">
                  <span className="detail-label">Créée le:</span>
                  <span className="detail-value">{key.createdAt}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Dernière utilisation:</span>
                  <span className="detail-value">
                    {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString('fr-FR') : 'Jamais'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Limite de Taux:</span>
                  <span className="detail-value">{key.rateLimit} requêtes/jour</span>
                </div>
              </div>

              {/* Usage Bar */}
              <div className="usage-section">
                <div className="usage-header">
                  <span className="usage-label">Utilisation Aujourd'hui</span>
                  <span className="usage-stats">
                    {key.requestsToday} / {key.rateLimit} requêtes
                    ({usagePercentage(key.requestsToday, key.rateLimit).toFixed(1)}%)
                  </span>
                </div>
                <div className="usage-bar">
                  <div
                    className={`usage-fill ${
                      usagePercentage(key.requestsToday, key.rateLimit) > 80 ? 'warning' : ''
                    }`}
                    style={{ '--usage-percent': `${usagePercentage(key.requestsToday, key.rateLimit)}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="key-actions">
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => handleCopyKey(key.id)}
                  title="Copy key to clipboard"
                >
                  {copiedKey === key.id ? '✓ Copié!' : '📋 Copier Clé'}
                </button>
                <button
                  className="btn btn-small btn-secondary"
                  title="Regenerate key"
                >
                  🔄 Régénérer
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => handleRevokeKey(key.id)}
                  title="Revoke key"
                >
                  🗑️ Révoquer
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Documentation */}
      <div className="api-documentation">
        <h3>Documentation API</h3>
        <div className="docs-section">
          <h4>Point de Terminaison Principal</h4>
          <code className="code-block">https://api.scamguard.ca/v1/analyze</code>
        </div>
        <div className="docs-section">
          <h4>Authentification</h4>
          <p>Inclure votre clé API dans l'en-tête:</p>
          <code className="code-block">Authorization: Bearer YOUR_API_KEY</code>
        </div>
        <div className="docs-section">
          <h4>Exemple de Requête</h4>
          <code className="code-block">
{`curl -X POST https://api.scamguard.ca/v1/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Votre compte a été suspendu. Cliquez ici.",
    "type": "sms"
  }'`}
          </code>
        </div>
      </div>
    </div>
  );
};

export default APIKeyManagement;
