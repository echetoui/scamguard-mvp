/**
 * ConsentBanner Component
 *
 * Displays consent banner for Loi 25 compliance (Quebec GDPR)
 * Features:
 * - WCAG AAA accessibility (7:1 contrast, 20px+ fonts)
 * - Keyboard navigation (Tab, Enter)
 * - Screen reader friendly (ARIA labels)
 * - localStorage persistence
 * - Blocks app until consent given
 *
 * Usage:
 *   <ConsentBanner onConsent={() => setAppReady(true)} />
 */

import { useState, useEffect } from 'react';
import { getConsent, setConsent } from '../utils/consentManager';
import './ConsentBanner.css';

export default function ConsentBanner({ onConsent }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  // Check on mount if user has already consented
  useEffect(() => {
    if (!getConsent()) {
      setIsVisible(true);
    } else {
      // User already consented, notify parent
      if (onConsent) {
        onConsent();
      }
    }
  }, [onConsent]);

  const handleCheckboxChange = (e) => {
    setIsChecked(e.target.checked);
  };

  const handleAccept = () => {
    if (isChecked) {
      // Store consent in localStorage
      setConsent(true);
      setIsVisible(false);

      // Notify parent component
      if (onConsent) {
        onConsent();
      }
    }
  };

  const handleKeyDown = (e) => {
    // Allow Enter to submit if checkbox is checked
    if (e.key === 'Enter' && isChecked && e.target.className === 'btn-accept') {
      handleAccept();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="consent-overlay" role="presentation">
      <div className="consent-modal" role="alertdialog" aria-labelledby="consent-title" aria-live="polite">
        {/* Header */}
        <div className="consent-header">
          <h1 id="consent-title" className="consent-title">
            🛡️ Votre Sécurité Avant Tout
          </h1>
        </div>

        {/* Main Content */}
        <div className="consent-content">
          <div className="consent-section">
            <h2 className="section-title">Pourquoi nous collectons vos réponses</h2>
            <p className="consent-text">
              Nous utilisons vos réponses pour améliorer la détection des arnèles et vous offrir des conseils personnalisés pour vous protéger.
            </p>
          </div>

          <div className="consent-section">
            <h2 className="section-title">Vos données sont protégées</h2>
            <ul className="consent-benefits">
              <li className="benefit-item">
                <span className="checkmark" aria-hidden="true">✓</span>
                <span>Vos données sont chiffrées</span>
              </li>
              <li className="benefit-item">
                <span className="checkmark" aria-hidden="true">✓</span>
                <span>Jamais vendues à tiers</span>
              </li>
              <li className="benefit-item">
                <span className="checkmark" aria-hidden="true">✓</span>
                <span>Conservées 30 jours maximum</span>
              </li>
              <li className="benefit-item">
                <span className="checkmark" aria-hidden="true">✓</span>
                <span>Protégeant les aînés québécois</span>
              </li>
            </ul>
          </div>

          {/* Checkbox */}
          <div className="consent-checkbox-wrapper">
            <label htmlFor="consent-checkbox" className="consent-checkbox-label">
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                className="consent-checkbox-input"
                aria-required="true"
              />
              <span className="checkbox-custom" aria-hidden="true"></span>
              <span className="checkbox-text">
                Je comprends et j'accepte les conditions de confidentialité
              </span>
            </label>
          </div>

          {/* Policy Link */}
          <div className="consent-policy-link">
            <button
              onClick={() => setShowPolicy(!showPolicy)}
              className="btn-policy"
              aria-expanded={showPolicy}
              aria-controls="policy-content"
            >
              Lire notre politique complète →
            </button>
          </div>

          {/* Expandable Policy Content */}
          {showPolicy && (
            <div id="policy-content" className="policy-content" role="region" aria-label="Politique de confidentialité complète">
              <h3 className="policy-title">Politique de Confidentialité Complète</h3>
              <p className="policy-text">
                <strong>Collecte de données:</strong> Nous collectons uniquement les réponses que vous fournissez à nos scénarios d'entraînement et les images que vous analysez.
              </p>
              <p className="policy-text">
                <strong>Utilisation:</strong> Vos données sont utilisées uniquement pour améliorer la détection des arnèles et vous fournir du coaching personnalisé.
              </p>
              <p className="policy-text">
                <strong>Sécurité:</strong> Toutes les données sont chiffrées en transit (HTTPS) et au repos. Vos ID d'utilisateur sont pseudonymisés avec hachage SHA-256.
              </p>
              <p className="policy-text">
                <strong>Rétention:</strong> Les données sont automatiquement supprimées après 30 jours, conformément à la Loi 25 (RGPD québécois).
              </p>
              <p className="policy-text">
                <strong>Vos droits:</strong> Vous pouvez retirer votre consentement à tout moment. Pour plus d'informations, contactez: privacy@scamguard.ca
              </p>
            </div>
          )}
        </div>

        {/* Footer - Action Buttons */}
        <div className="consent-footer">
          <button
            onClick={handleAccept}
            onKeyDown={handleKeyDown}
            className="btn-accept"
            disabled={!isChecked}
            aria-label="Accepter les conditions et continuer"
          >
            Accepter et Continuer
          </button>

          <p className="consent-note">
            Vous devez accepter pour utiliser ScamGuard
          </p>
        </div>
      </div>
    </div>
  );
}
