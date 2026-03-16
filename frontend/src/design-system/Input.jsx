import React from 'react';
import './Input.css';

const Input = ({ type = 'text', label, value, onChange, placeholder, disabled = false, error = null }) => {
  const inputId = `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const hasError = !!error;

  return (
    <div className="ds-input-wrapper">
      <label htmlFor={inputId} className="ds-input-label">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`ds-input ${hasError ? 'ds-input--error' : ''}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : null}
      />
      {hasError && <p id={`${inputId}-error`} className="ds-input-error-message">{error}</p>}
    </div>
  );
};

export default Input;
