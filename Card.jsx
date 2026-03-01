import React from 'react';

/**
 * Conteneur "Carte" pour grouper l'information.
 * Fond blanc sur fond gris clair pour contraste.
 */
const Card = ({ children, title, className = '', variant = 'default' }) => {
  
  const baseStyles = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '24px', // Espace généreux
    boxShadow: 'var(--shadow-card)',
    marginBottom: '20px',
    border: '1px solid var(--color-border-subtle)',
  };

  const variants = {
    default: {},
    alert: {
      border: '2px solid var(--color-danger)',
    },
    info: {
      backgroundColor: 'var(--color-primary-light)',
      border: '1px solid var(--color-border-info)',
    }
  };

  const headerStyles = {
    marginTop: 0,
    color: variant === 'alert' ? 'var(--color-danger)' : 'var(--color-primary)',
    borderBottom: '1px solid var(--color-border-subtle)',
    borderColor: variant === 'info' ? 'var(--color-border-info)' : 'var(--color-border-subtle)',
    paddingBottom: '12px',
    marginBottom: '16px'
  };

  return (
    <div style={{ ...baseStyles, ...variants[variant] }} className={className}>
      {title && <h2 style={headerStyles}>{title}</h2>}
      {children}
    </div>
  );
};

export default Card;