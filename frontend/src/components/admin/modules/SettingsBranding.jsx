/**
 * Settings & Branding Module
 * Configure white-label customization, email templates, compliance docs
 * Story Points: 7
 */

import React, { useState } from 'react';
import '../styles/SettingsBranding.css';

const SettingsBranding = ({ institutionId }) => {
  const [settings, setSettings] = useState({
    institutionName: 'Institution Partner',
    primaryColor: '#3498db',
    secondaryColor: '#2ecc71',
    logoUrl: '/logo.png',
    emailTemplate: 'default',
    customDomain: '',
    complianceLevel: 'hipaa'
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Call API to save settings
    // await fetch(`/api/admin/settings/${institutionId}`, {
    //   method: 'PUT',
    //   body: JSON.stringify(settings)
    // });
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className="settings-branding-container">
      {/* Header */}
      <div className="settings-header">
        <h2>Paramètres et Branding</h2>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '⏳ Enregistrement...' : '💾 Enregistrer'}
        </button>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          Paramètres Généraux
        </button>
        <button
          className={`tab-btn ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          Branding
        </button>
        <button
          className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          Modèles Email
        </button>
        <button
          className={`tab-btn ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          Conformité
        </button>
      </div>

      {/* Tab Content */}
      <div className="settings-content">
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="settings-panel">
            <h3>Paramètres Généraux</h3>
            <div className="form-group">
              <label htmlFor="institution-name">Nom de l'Institution</label>
              <input
                id="institution-name"
                type="text"
                value={settings.institutionName}
                onChange={(e) => handleSettingChange('institutionName', e.target.value)}
                placeholder="Nom complet de l'institution"
              />
              <small>Le nom affiché aux utilisateurs finaux</small>
            </div>

            <div className="form-group">
              <label htmlFor="custom-domain">Domaine Personnalisé</label>
              <input
                id="custom-domain"
                type="text"
                value={settings.customDomain}
                onChange={(e) => handleSettingChange('customDomain', e.target.value)}
                placeholder="https://custom.monentreprise.ca"
              />
              <small>Laissez vide pour utiliser le domaine par défaut ScamGuard</small>
            </div>

            <div className="form-group">
              <label htmlFor="compliance-level">Niveau de Conformité</label>
              <select
                id="compliance-level"
                value={settings.complianceLevel}
                onChange={(e) => handleSettingChange('complianceLevel', e.target.value)}
              >
                <option value="standard">Standard (Aucune réglementation spéciale)</option>
                <option value="hipaa">HIPAA (Santé - États-Unis)</option>
                <option value="gdpr">GDPR (Union Européenne)</option>
                <option value="pipeda">PIPEDA (Canada)</option>
                <option value="all">Toutes les conformités</option>
              </select>
              <small>Détermine les règles de stockage des données et de confidentialité</small>
            </div>
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="settings-panel">
            <h3>Personnalisation de la Marque</h3>

            <div className="branding-grid">
              <div className="form-group">
                <label htmlFor="primary-color">Couleur Primaire</label>
                <div className="color-picker-container">
                  <input
                    id="primary-color"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                  />
                  <span className="color-value">{settings.primaryColor}</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="secondary-color">Couleur Secondaire</label>
                <div className="color-picker-container">
                  <input
                    id="secondary-color"
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                  />
                  <span className="color-value">{settings.secondaryColor}</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="logo">Logo (URL)</label>
              <input
                id="logo"
                type="text"
                value={settings.logoUrl}
                onChange={(e) => handleSettingChange('logoUrl', e.target.value)}
                placeholder="https://votre-cdn.com/logo.png"
              />
            </div>

            <div className="preview-section">
              <h4>Aperçu du Branding</h4>
              <div
                className="preview-card"
                style={{
                  '--primary-color': settings.primaryColor,
                  '--secondary-color': settings.secondaryColor
                }}
              >
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="preview-logo"
                  onError={(e) => (e.target.style.display = 'none')}
                />
                <h2>{settings.institutionName}</h2>
                <p>Votre texte personnalisé ici</p>
                <button
                  className="preview-button"
                  style={{ '--secondary-color': settings.secondaryColor }}
                >
                  Bouton Principal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Templates Tab */}
        {activeTab === 'email' && (
          <div className="settings-panel">
            <h3>Modèles Email</h3>

            <div className="form-group">
              <label htmlFor="email-template">Modèle Prédéfini</label>
              <select
                id="email-template"
                value={settings.emailTemplate}
                onChange={(e) => handleSettingChange('emailTemplate', e.target.value)}
              >
                <option value="default">ScamGuard Standard</option>
                <option value="professional">Professionnel</option>
                <option value="friendly">Amical</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>

            <div className="email-templates-list">
              <div className="template-card">
                <h4>Email de Bienvenue</h4>
                <p>Envoyé quand un nouvel utilisateur s'inscrit</p>
                <button className="btn btn-secondary btn-small">Éditer</button>
              </div>

              <div className="template-card">
                <h4>Alerte de Menace</h4>
                <p>Notifie l'utilisateur d'une arnaque détectée</p>
                <button className="btn btn-secondary btn-small">Éditer</button>
              </div>

              <div className="template-card">
                <h4>Rapport Hebdomadaire</h4>
                <p>Résumé hebdomadaire des activités</p>
                <button className="btn btn-secondary btn-small">Éditer</button>
              </div>

              <div className="template-card">
                <h4>Réinitialisation Mot de Passe</h4>
                <p>Aide l'utilisateur à réinitialiser son mot de passe</p>
                <button className="btn btn-secondary btn-small">Éditer</button>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="settings-panel">
            <h3>Documents de Conformité</h3>

            <div className="compliance-documents">
              <div className="document-card">
                <h4>📋 Accord de Traitement des Données (DPA)</h4>
                <p>
                  Accord juridique définissant comment les données sont traitées et protégées
                </p>
                <div className="document-status">
                  <span className="status-badge status-signed">✓ Signé</span>
                  <span className="status-date">15 janvier 2026</span>
                </div>
                <button className="btn btn-secondary btn-small">Télécharger</button>
              </div>

              <div className="document-card">
                <h4>🔐 Politique de Sécurité</h4>
                <p>
                  Documentation des mesures de sécurité et contrôles d'accès
                </p>
                <div className="document-status">
                  <span className="status-badge status-signed">✓ Approuvé</span>
                  <span className="status-date">1er mars 2026</span>
                </div>
                <button className="btn btn-secondary btn-small">Télécharger</button>
              </div>

              <div className="document-card">
                <h4>🛡️ Certifications de Conformité</h4>
                <p>
                  HIPAA, GDPR, PIPEDA - Certificats d'audit et d'attestation
                </p>
                <div className="document-status">
                  <span className="status-badge status-pending">⏳ En Révision</span>
                  <span className="status-date">Audit en cours</span>
                </div>
                <button className="btn btn-secondary btn-small">Détails</button>
              </div>

              <div className="document-card">
                <h4>📜 Politique de Confidentialité</h4>
                <p>
                  Explication claire de comment nous utilisons et protégeons les données
                </p>
                <div className="document-status">
                  <span className="status-badge status-signed">✓ Publié</span>
                  <span className="status-date">10 février 2026</span>
                </div>
                <button className="btn btn-secondary btn-small">Éditer</button>
              </div>
            </div>

            <div className="compliance-info">
              <h4>Niveau de Conformité Actuel</h4>
              <p>Vous êtes configuré pour <strong>{settings.complianceLevel.toUpperCase()}</strong></p>
              <p className="compliance-note">
                Vous pouvez mettre à jour le niveau de conformité dans les paramètres généraux.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsBranding;
