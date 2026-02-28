import React, { useState } from 'react';
import StepCard from './StepCard';

const GuideCard = ({ guide }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="guide-card">
      <div
        className="guide-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setExpanded(!expanded);
          }
        }}
      >
        <div className="guide-title-section">
          <span className="guide-icon">{guide.icon}</span>
          <div className="guide-info">
            <h4>{guide.title}</h4>
            <p>{guide.description}</p>
          </div>
        </div>
        <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>▼</span>
      </div>

      {expanded && (
        <div className="guide-content">
          {guide.methods && guide.methods.length > 0 ? (
            <div className="methods-container">
              {guide.methods.map((method, index) => (
                <div key={method.id} className="method">
                  {guide.methods.length > 1 && (
                    <h5 className="method-title">Méthode {index + 1}: {method.title}</h5>
                  )}
                  <div className="steps">
                    {method.steps.map((step) => (
                      <StepCard key={`${method.id}-${step.number}`} step={step} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GuideCard;
