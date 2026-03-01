import React from 'react';

const LoadingSpinner = ({ message = "Chargement..." }) => {
  return (
    <div className="container loading-screen" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true">⏳</div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;