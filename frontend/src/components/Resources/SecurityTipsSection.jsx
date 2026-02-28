import React, { useState } from 'react';
import tipsData from '../../data/securityTips.json';

const SecurityTipsSection = () => {
  const [expandedChecklist, setExpandedChecklist] = useState('before-block');

  const renderChecklist = (checklist) => {
    if (checklist.id === 'before-block' || checklist.id === 'after-block') {
      return (
        <div className="checklist-items">
          {checklist.items.map((item, index) => (
            <div key={index} className="checklist-item">
              <input
                type="checkbox"
                id={`${checklist.id}-${index}`}
                disabled
                className="checklist-checkbox"
              />
              <label htmlFor={`${checklist.id}-${index}`} className="checklist-label">
                <span className="item-text">{item.text}</span>
                {item.details && <span className="item-details">{item.details}</span>}
              </label>
            </div>
          ))}
        </div>
      );
    }

    // For after-block with sections
    if (checklist.sections) {
      return (
        <div className="checklist-sections">
          {checklist.sections.map((section) => (
            <div key={section.id} className="section">
              <h5>{section.title}</h5>
              <ul className="section-items">
                {section.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="security-tips-section">
      <div className="section-intro">
        <h2>Conseils de Sécurité</h2>
        <p>Protégez-vous avant et après avoir bloqué</p>
      </div>

      {/* Main Checklists */}
      <div className="checklists-container">
        {tipsData.checklists.map((checklist) => {
          if (checklist.id === 'fraud-recovery') return null;

          return (
            <div key={checklist.id} className="checklist-card">
              <div
                className="checklist-header"
                onClick={() => setExpandedChecklist(checklist.id)}
                role="button"
                tabIndex={0}
                aria-expanded={expandedChecklist === checklist.id}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setExpandedChecklist(checklist.id);
                  }
                }}
              >
                <div className="header-content">
                  <span className="checklist-icon">{checklist.icon}</span>
                  <div>
                    <h3>{checklist.title}</h3>
                    <p>{checklist.description}</p>
                  </div>
                </div>
                <span className={`expand-icon ${expandedChecklist === checklist.id ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>

              {expandedChecklist === checklist.id && (
                <div className="checklist-body">
                  {renderChecklist(checklist)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Emergency Card */}
      <div className="emergency-card">
        <div className="emergency-header">
          <span className="emergency-icon">🆘</span>
          <h3>En Cas d'Arnaque Financière</h3>
        </div>
        <div className="emergency-content">
          <div className="emergency-timeline">
            <div className="timeline-item urgent">
              <div className="timeline-time">⏰ 24 HEURES</div>
              <div className="timeline-actions">
                <p>✅ Contactez votre banque</p>
                <p>✅ Demandez un blocage de compte</p>
                <p>✅ Signalez la transaction</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-time">📋 48 HEURES</div>
              <div className="timeline-actions">
                <p>✅ Déposez plainte à la police</p>
                <p>✅ Conservez tous les documents</p>
                <p>✅ Photographiez les messages/emails</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signaling Instructions */}
      <div className="signaling-container">
        <h3>Comment Signaler</h3>
        <div className="signaling-grid">
          {tipsData.signaling.map((signal) => (
            <div key={signal.id} className="signaling-card">
              <div className="signal-header">
                <span className="signal-icon">{signal.icon}</span>
                <h4>{signal.title}</h4>
              </div>
              <div className="signal-body">
                {signal.instructions && (
                  <ol className="instructions-list">
                    {signal.instructions.map((instr, idx) => (
                      <li key={idx}>{instr}</li>
                    ))}
                  </ol>
                )}
                {signal.links && (
                  <div className="signal-links">
                    {signal.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="signal-link"
                      >
                        {link.country}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {signal.urgency && <div className="urgency-badge">{signal.urgency}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityTipsSection;
