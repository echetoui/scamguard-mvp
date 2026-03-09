/**
 * ToolsTab Component
 * Phase 5C - Verification Tools
 *
 * Features:
 * ✅ Email breach checking (BreachDirectory API)
 * ✅ Financial advisor authorization checking (LLM + registry links)
 * ✅ Sub-tab navigation (Email / Advisor)
 * ✅ WCAG AAA accessibility
 * ✅ Senior-friendly UI (large touch targets, clear language)
 */

import React, { useState } from 'react';
import './ToolsTab.css';

export default function ToolsTab() {
  const [activeSubTab, setActiveSubTab] = useState('email');

  // Handle keyboard navigation for tabs (arrow keys)
  const handleTabKeyDown = (e) => {
    const tabs = ['email', 'advisor'];
    const currentIndex = tabs.indexOf(activeSubTab);

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      let newIndex;
      if (e.key === 'ArrowLeft') {
        newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
      }
      setActiveSubTab(tabs[newIndex]);
      // Focus the newly activated tab button
      setTimeout(() => {
        const buttons = document.querySelectorAll('[role="tab"]');
        if (buttons[newIndex]) buttons[newIndex].focus();
      }, 0);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveSubTab(tabs[0]);
      setTimeout(() => {
        const buttons = document.querySelectorAll('[role="tab"]');
        if (buttons[0]) buttons[0].focus();
      }, 0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveSubTab(tabs[tabs.length - 1]);
      setTimeout(() => {
        const buttons = document.querySelectorAll('[role="tab"]');
        if (buttons[buttons.length - 1]) buttons[buttons.length - 1].focus();
      }, 0);
    }
  };

  // Email breach state
  const [emailInput, setEmailInput] = useState('');
  const [emailResult, setEmailResult] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailStep, setEmailStep] = useState('input'); // 'input' or 'result'

  // Advisor check state
  const [advisorName, setAdvisorName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [advisorResult, setAdvisorResult] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState('');
  const [advisorStep, setAdvisorStep] = useState('input'); // 'input' or 'result'

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1';

  // Email breach checking function
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setEmailLoading(true);
    setEmailError('');

    try {
      const response = await fetch(`${API_BASE_URL}/tools/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailInput }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setEmailResult(data.data);
      setEmailStep('result');
    } catch (err) {
      setEmailError('Impossible de vérifier le courriel. Réessayez plus tard.');
      console.error('Email check error:', err);
    } finally {
      setEmailLoading(false);
    }
  };

  // Financial advisor checking function
  const handleCheckAdvisor = async (e) => {
    e.preventDefault();
    if (!advisorName.trim()) return;

    setAdvisorLoading(true);
    setAdvisorError('');

    try {
      const response = await fetch(`${API_BASE_URL}/tools/check-advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advisorName: advisorName,
          firmName: firmName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setAdvisorResult(data.data);
      setAdvisorStep('result');
    } catch (err) {
      setAdvisorError('Impossible de vérifier le conseiller. Réessayez plus tard.');
      console.error('Advisor check error:', err);
    } finally {
      setAdvisorLoading(false);
    }
  };

  // Reset email form
  const resetEmailForm = () => {
    setEmailInput('');
    setEmailResult(null);
    setEmailError('');
    setEmailStep('input');
  };

  // Reset advisor form
  const resetAdvisorForm = () => {
    setAdvisorName('');
    setFirmName('');
    setAdvisorResult(null);
    setAdvisorError('');
    setAdvisorStep('input');
  };

  return (
    <div className="tools-tab">
      {/* Header */}
      <div className="tools-header">
        <h1 className="tools-title">🔧 Outils de Vérification</h1>
        <p className="tools-subtitle">Protégez-vous en vérifiant vos risques en ligne</p>
      </div>

      {/* Sub-tab navigation */}
      <div className="sub-tabs-nav" role="tablist">
        <button
          id="email-tab"
          className={`sub-tab-btn ${activeSubTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('email')}
          onKeyDown={handleTabKeyDown}
          role="tab"
          aria-selected={activeSubTab === 'email'}
          aria-controls="email-panel"
          tabIndex={activeSubTab === 'email' ? 0 : -1}
        >
          📧 Courriel compromis
        </button>
        <button
          id="advisor-tab"
          className={`sub-tab-btn ${activeSubTab === 'advisor' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('advisor')}
          onKeyDown={handleTabKeyDown}
          role="tab"
          aria-selected={activeSubTab === 'advisor'}
          aria-controls="advisor-panel"
          tabIndex={activeSubTab === 'advisor' ? 0 : -1}
        >
          💼 Conseiller autorisé
        </button>
      </div>

      {/* Email Breach Section */}
      <div
        id="email-panel"
        role="tabpanel"
        aria-labelledby="email-tab"
        hidden={activeSubTab !== 'email'}
        className="sub-tab-panel"
        tabIndex={0}
      >
        {emailStep === 'input' ? (
          <form onSubmit={handleCheckEmail} className="tool-form">
            <div className="form-section">
              <h2>📧 Vérifier si votre courriel est compromis</h2>
              <p className="form-description">
                Découvrez si votre adresse courriel a été exposée dans une fuite de données connue.
                Cette vérification ne stocke pas votre adresse courriel.
              </p>

              <div className="form-group">
                <label htmlFor="email-input" className="form-label">
                  Votre adresse courriel
                </label>
                <input
                  id="email-input"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="exemple@gmail.com"
                  className="form-input"
                  required
                  aria-required="true"
                  aria-label="Entrez votre adresse courriel"
                />
              </div>

              {emailError && (
                <div className="error-message" role="alert">
                  ❌ {emailError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary large-touch"
                disabled={emailLoading || !emailInput.trim()}
                aria-busy={emailLoading}
              >
                {emailLoading ? '⏳ Vérification...' : '🔍 Vérifier mon courriel'}
              </button>
            </div>
          </form>
        ) : (
          <div className="result-section">
            {emailResult && (
              <>
                <h2>Résultat de la vérification</h2>

                {/* Status indicator */}
                <div className={`status-indicator ${emailResult.breached === true ? 'breached' : emailResult.breached === false ? 'safe' : 'unknown'}`}>
                  <div className="status-icon">
                    {emailResult.breached === true ? '⚠️' : emailResult.breached === false ? '✅' : 'ℹ️'}
                  </div>
                  <div className="status-message">
                    {emailResult.message}
                  </div>
                </div>

                {/* Breach details */}
                {emailResult.breached === true && emailResult.sources && emailResult.sources.length > 0 && (
                  <div className="breach-details">
                    <h3>Fuites de données impliquées :</h3>
                    <ul className="sources-list">
                      {emailResult.sources.map((source, idx) => (
                        <li key={idx} className="source-item">{source}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended actions */}
                {emailResult.actions && emailResult.actions.length > 0 && (
                  <div className="actions-box">
                    <h3>Actions recommandées :</h3>
                    <ul className="actions-list">
                      {emailResult.actions.map((action, idx) => (
                        <li key={idx} className="action-item">✓ {action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Fallback link */}
                {emailResult.fallback_url && (
                  <div className="fallback-link">
                    <p>Vous pouvez aussi vérifier directement sur :</p>
                    <a
                      href={emailResult.fallback_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-link"
                    >
                      {emailResult.fallback_url.replace('https://', '')} →
                    </a>
                  </div>
                )}

                <button
                  onClick={resetEmailForm}
                  className="btn-secondary large-touch"
                  aria-label="Vérifier un autre courriel"
                >
                  🔄 Vérifier un autre courriel
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Advisor Check Section */}
      <div
        id="advisor-panel"
        role="tabpanel"
        aria-labelledby="advisor-tab"
        hidden={activeSubTab !== 'advisor'}
        className="sub-tab-panel"
        tabIndex={0}
      >
        {advisorStep === 'input' ? (
          <form onSubmit={handleCheckAdvisor} className="tool-form">
            <div className="form-section">
              <h2>💼 Vérifier si un conseiller est autorisé</h2>
              <p className="form-description">
                Découvrez si un conseiller financier est dûment autorisé au Québec.
                Vérifiez toujours sur les registres officiels avant de confier votre argent.
              </p>

              <div className="form-group">
                <label htmlFor="advisor-name-input" className="form-label">
                  Nom du conseiller *
                </label>
                <input
                  id="advisor-name-input"
                  type="text"
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="form-input"
                  required
                  aria-required="true"
                  aria-label="Entrez le nom du conseiller"
                />
              </div>

              <div className="form-group">
                <label htmlFor="firm-name-input" className="form-label">
                  Nom de la firme ou de la banque (optionnel)
                </label>
                <input
                  id="firm-name-input"
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="Ex: Banque Royale"
                  className="form-input"
                  aria-label="Entrez le nom de la firme ou banque"
                />
              </div>

              {advisorError && (
                <div className="error-message" role="alert">
                  ❌ {advisorError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary large-touch"
                disabled={advisorLoading || !advisorName.trim()}
                aria-busy={advisorLoading}
              >
                {advisorLoading ? '⏳ Vérification...' : '🔍 Vérifier le conseiller'}
              </button>
            </div>
          </form>
        ) : (
          <div className="result-section">
            {advisorResult && (
              <>
                <h2>Résultat de la vérification</h2>

                {/* Risk level indicator */}
                <div className={`risk-indicator risk-${advisorResult.risk_level || 'unknown'}`}>
                  <div className="risk-icon">
                    {advisorResult.risk_level === 'low' ? '✅' : advisorResult.risk_level === 'medium' ? '⚠️' : advisorResult.risk_level === 'high' ? '🚨' : 'ℹ️'}
                  </div>
                  <div className="risk-level">
                    Niveau de risque: <strong>{advisorResult.risk_level || 'Inconnu'}</strong>
                  </div>
                </div>

                {/* Summary */}
                <div className="summary-box">
                  <p>{advisorResult.summary}</p>
                </div>

                {/* Red flags */}
                {advisorResult.red_flags && advisorResult.red_flags.length > 0 && (
                  <div className="red-flags-box">
                    <h3>⚠️ Points d'attention :</h3>
                    <ul className="flags-list">
                      {advisorResult.red_flags.map((flag, idx) => (
                        <li key={idx} className="flag-item">{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Official registries */}
                {advisorResult.official_registries && advisorResult.official_registries.length > 0 && (
                  <div className="registries-box">
                    <h3>📋 Registres officiels à consulter :</h3>
                    <ul className="registries-list">
                      {advisorResult.official_registries.map((registry, idx) => (
                        <li key={idx} className="registry-item">
                          <a
                            href={registry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="registry-link"
                          >
                            {registry.name} →
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disclaimer */}
                {advisorResult.disclaimer && (
                  <div className="disclaimer-box">
                    <p>{advisorResult.disclaimer}</p>
                  </div>
                )}

                <button
                  onClick={resetAdvisorForm}
                  className="btn-secondary large-touch"
                  aria-label="Vérifier un autre conseiller"
                >
                  🔄 Vérifier un autre conseiller
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
