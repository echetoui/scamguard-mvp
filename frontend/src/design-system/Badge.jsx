// frontend/src/design-system/Badge.jsx
import React from 'react';
import {
  colors,
  typography,
  borderRadius,
} from '@/styles/design-tokens';

export function Badge({
  variant = 'filled',
  size = 'large',
  color = 'primary',
  children,
}) {
  const sizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px', // Default for seniors
  };

  const colorMap = {
    primary: {
      filled: { bg: colors.primary, text: colors.onPrimary },
      outlined: { bg: 'transparent', text: colors.primary, border: `2px solid ${colors.primary}` },
      tonal: { bg: colors.primaryContainer, text: colors.onPrimaryContainer },
    },
    secondary: {
      filled: { bg: colors.secondary, text: colors.onSecondary },
      outlined: { bg: 'transparent', text: colors.secondary, border: `2px solid ${colors.secondary}` },
      tonal: { bg: colors.secondaryContainer, text: colors.onSecondaryContainer },
    },
    error: {
      filled: { bg: colors.error, text: colors.onError },
      outlined: { bg: 'transparent', text: colors.error, border: `2px solid ${colors.error}` },
      tonal: { bg: colors.errorContainer, text: colors.onErrorContainer },
    },
  };

  const colorConfig = colorMap[color][variant];

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px', // Min padding for readability
    borderRadius: borderRadius.md, // 8px
    fontSize: sizeMap[size],
    fontWeight: typography.fontWeight.semibold, // 600
    backgroundColor: colorConfig.bg,
    color: colorConfig.text,
    border: colorConfig.border || 'none',
    whiteSpace: 'nowrap',
  };

  return (
    <span style={badgeStyle}>
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';
