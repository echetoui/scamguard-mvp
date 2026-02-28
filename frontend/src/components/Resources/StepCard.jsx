import React from 'react';

const StepCard = ({ step }) => {
  return (
    <div className="step-card">
      <div className="step-number">{step.number}</div>
      <div className="step-content">
        <h6 className="step-instruction">{step.instruction}</h6>
        {step.details && <p className="step-details">{step.details}</p>}
      </div>
    </div>
  );
};

export default StepCard;
