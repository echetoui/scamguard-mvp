/**
 * EmergencyPanel Component
 * Sprint 10 - Emergency Services Integration
 *
 * Provides quick access to Quebec-specific emergency contacts.
 * Features:
 *  ✅ 4 key emergency numbers (Police, CAFC, AMF, SQ)
 *  ✅ One-tap calling via tel: protocol
 *  ✅ Quick link to CAFC online reporting
 *  ✅ Senior-friendly design (72px+ touch targets, 20px+ fonts)
 *  ✅ WCAG AAA accessibility (role="dialog" aria-modal="true")
 *  ✅ High contrast colors for elderly users
 */

import React from 'react';
import './EmergencyPanel.css';

export default function EmergencyPanel({ onClose }) {
  // Emergency contacts for Quebec
  const contacts = [
    {
      id: 'police',
      icon: '🚨',
      label: 'Police',
      number: '911',
      description: 'En cas d\'urgence immédiate'
    },
    {
      id: 'cafc',
      icon: '🛡️',
      label: 'CAFC',
      number: '1-888-495-8501',
      description: 'Centre Antifraude du Canada'
    },
    {
      id: 'amf',
      icon: '⚖️',
      label: 'AMF Québec',
      number: '1-877-525-0337',
      description: 'Autorité des marchés financiers'
    },
    {
      id: 'sq',
      icon: '👮',
      label: 'Sûreté du Québec',
      number: '310-4141',
      description: 'Police provinciale du Québec'
    }
  ];

  // Handle phone call
  const handleCall = (number) => {
    // Remove non-numeric characters for tel: protocol
    const cleanNumber = number.replace(/\D/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

  // Handle online reporting
  const handleReportCAFC = () => {
    window.open('https://www.antifraudcentre.ca/fr', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="emergency-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Numéros d'Urgence - Québec"
    >
      <div className="emergency-panel-inner">
        {/* Header */}
        <div className="emergency-panel-header">
          <h2>🚨 Numéros d'Urgence</h2>
          <p className="emergency-description">
            Contactez rapidement les services d'urgence et de fraude au Québec
          </p>
          {onClose && (
            <button
              className="emergency-close-btn"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Contacts Grid */}
        <div className="emergency-contacts" role="list">
          {contacts.map(contact => (
            <div
              key={contact.id}
              className="emergency-contact-row"
              role="listitem"
              aria-label={`${contact.label}: ${contact.number}`}
            >
              <div className="contact-info">
                <div className="emergency-contact-icon" aria-hidden="true">
                  {contact.icon}
                </div>
                <div className="contact-details">
                  <div className="emergency-contact-label">{contact.label}</div>
                  <div className="emergency-contact-number">{contact.number}</div>
                  <div className="contact-description">{contact.description}</div>
                </div>
              </div>

              <button
                className="emergency-contact-btn"
                onClick={() => handleCall(contact.number)}
                aria-label={`Appeler ${contact.label} au ${contact.number}`}
                title={`Appeler ${contact.number}`}
              >
                📞
              </button>
            </div>
          ))}
        </div>

        {/* Online Reporting */}
        <div className="emergency-online-section">
          <p className="online-description">
            Vous pouvez aussi signaler une fraude en ligne auprès du CAFC
          </p>
          <button
            className="emergency-report-btn"
            onClick={handleReportCAFC}
            aria-label="Signaler une fraude au Centre Antifraude du Canada en ligne"
          >
            🌐 Signaler en Ligne (CAFC)
          </button>
        </div>

        {/* Disclaimer */}
        <div className="emergency-disclaimer">
          <small>
            En cas d'urgence immédiale, appelez le 911. Ces numéros sont valides au Québec.
          </small>
        </div>
      </div>
    </div>
  );
}
