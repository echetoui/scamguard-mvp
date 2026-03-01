import React from 'react';

/**
 * Bouton accessible ScamGuard
 * Respecte la règle des 60px de hauteur min pour l'accessibilité motrice.
 */
const Button = ({ 
  children, 
  variant = 'primary', // primary, secondary, danger, outline
  onClick, 
  type = 'button',
  className = '',
  disabled = false,
  icon = null,
  style = {},
  ...props
}) => {
  
  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 'var(--touch-target-min)', // 60px
    padding: '0 24px',
    fontSize: 'var(--font-size-button)',
    fontWeight: '700',
    borderRadius: 'var(--border-radius-lg)',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 0.1s ease, background-color 0.2s ease',
    gap: '12px', // Espace entre icône et texte
    opacity: disabled ? 0.6 : 1,
    textTransform: 'none', // Pas de majuscules forcées pour la lisibilité
    fontFamily: 'var(--font-family-base)',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-text-inverse)',
      border: '2px solid var(--color-primary)',
    },
    secondary: {
      backgroundColor: 'var(--color-success)',
      color: 'var(--color-text-inverse)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: 'var(--color-text-inverse)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary)',
      border: '2px solid var(--color-primary)',
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyles, ...variants[variant], ...style }}
      className={`sg-button ${className}`}
      aria-disabled={disabled}
      {...props}
    >
      {icon && <span style={{ fontSize: '24px' }}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;