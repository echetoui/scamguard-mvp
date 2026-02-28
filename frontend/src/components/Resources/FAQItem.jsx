import React from 'react';

const FAQItem = ({ faq, isExpanded, onToggle }) => {
  return (
    <div className="faq-item">
      <div
        className="faq-question"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onToggle();
          }
        }}
      >
        <div className="question-header">
          <span className="faq-icon">{faq.icon}</span>
          <h4>{faq.question}</h4>
        </div>
        <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>

      {isExpanded && (
        <div className="faq-answer">
          <p>{faq.answer.split('\n').map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              <br />
            </React.Fragment>
          ))}</p>
        </div>
      )}
    </div>
  );
};

export default FAQItem;
