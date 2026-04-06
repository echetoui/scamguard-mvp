import React from 'react';
import {
  colors,
  spacing,
  shadows,
  borderRadius,
} from '@/styles/design-tokens';

export function Card({
  variant = 'elevated',
  children,
  style = {},
  ...props
}) {
  const variantStyles = {
    elevated: {
      backgroundColor: colors.surface,
      boxShadow: shadows.md,
      border: 'none',
    },
    outlined: {
      backgroundColor: colors.surface,
      boxShadow: shadows.none,
      border: `2px solid ${colors.border}`,
    },
    filled: {
      backgroundColor: colors.surfaceVariant,
      boxShadow: shadows.none,
      border: 'none',
    },
  };

  const baseStyle = {
    padding: spacing.xl, // 20px - senior-friendly
    borderRadius: borderRadius.lg, // 12px
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg, // 16px between children
    ...variantStyles[variant],
  };

  return (
    <div
      style={{ ...baseStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

Card.displayName = 'Card';
