import React from 'react';
import './Card.css';

const Card = ({ children, title, className = '' }) => {
  return (
    <div className={`ds-card ${className}`}>
      {title && <h3 className="ds-card-title">{title}</h3>}
      <div className="ds-card-content">
        {children}
      </div>
    </div>
  );
};

export default Card;
