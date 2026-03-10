/**
 * EmailBreachChecker Component
 * Extracted from ToolsTab - Phase 5D.4 Performance Optimization
 *
 * Features:
 * ✅ Email breach checking (BreachDirectory API)
 * ✅ WCAG AAA accessibility
 * ✅ Senior-friendly UI (large touch targets, clear language)
 */

import React, { useState } from 'react';
import { ERROR_MESSAGES } from '../constants/errorMessages';

export default function EmailBreachChecker() {
  const [emailInput, setEmailInput] = useState('');
  const [emailResult, setEmailResult] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailStep, setEmailStep] = useState('input'); // 'input' or 'result'

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
      setEmailError(ERROR_MESSAGES.EMAIL_CHECK_FAILED);
      console.error('Email check error:', err);
    } finally {
      setEmailLoading(false);
    }
  };

  // Reset email form
  const resetEmailForm = () => {
    setEmailInput('');
    setEmailResult(null);
    setEmailError('');
    setEmailStep('input');
  };

  return (
    <>
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
    </>
  );
}
