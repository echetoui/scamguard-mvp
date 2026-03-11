/**
 * AdvisorVerifier Component
 * Extracted from ToolsTab - Phase 5D.4 Performance Optimization
 *
 * Features:
 * ✅ Financial advisor authorization checking (LLM + registry links)
 * ✅ WCAG AAA accessibility
 * ✅ Senior-friendly UI (large touch targets, clear language)
 */

import React, { useState } from 'react';
import { ERROR_MESSAGES } from '../constants/errorMessages';

export default function AdvisorVerifier() {
  const [advisorName, setAdvisorName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [advisorResult, setAdvisorResult] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState('');
  const [advisorStep, setAdvisorStep] = useState('input'); // 'input' or 'result'

  const API_BASE_URL = 'http://localhost:3001/api/v1';

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
      setAdvisorError(ERROR_MESSAGES.ADVISOR_CHECK_FAILED);
      console.error('Advisor check error:', err);
    } finally {
      setAdvisorLoading(false);
    }
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
    <>
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
    </>
  );
}
