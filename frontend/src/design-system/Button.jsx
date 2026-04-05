// frontend/src/design-system/Button.jsx
import React from 'react';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  transitions,
  touchTargets,
  shadows,
} from '@/styles/design-tokens';

export function Button({
  variant = 'primary',
  size = 'large',
  disabled = false,
  onClick,
  children,
  ...props
}) {
  const sizeMap = {
    small: 48,
    medium: 60,
    large: 72,
  };

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.onPrimary,
      border: 'none',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colors.primary,
      border: `2px solid ${colors.primary}`,
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: colors.primary,
      border: 'none',
    },
    destructive: {
      backgroundColor: colors.error,
      color: colors.onError,
      border: 'none',
    },
  };

  const baseStyle = {
    height: `${sizeMap[size]}px`,
    padding: `0 ${spacing.xl}`,
    fontSize: `${typography.fontSize.h4}px`,
    fontWeight: typography.fontWeight.bold,
    borderRadius: borderRadius.lg,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `background-color ${transitions.fast}, border-color ${transitions.fast}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    ...variantStyles[variant],
  };

  const disabledStyle = disabled ? {
    backgroundColor: colors.disabledBg,
    color: colors.textDisabled,
    border: 'none',
    opacity: 0.5,
    cursor: 'not-allowed',
  } : {};

  return (
    <button
      style={{
        ...baseStyle,
        ...disabledStyle,
      }}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

Button.displayName = 'Button';
