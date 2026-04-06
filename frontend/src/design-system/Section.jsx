import React from 'react';
import {
  colors,
  typography,
  spacing,
} from '@/styles/design-tokens';

export function Section({
  title,
  subtitle,
  children,
  showDivider = false,
  style = {},
}) {
  const containerStyle = {
    padding: spacing['2xl'], // 24px - generous senior padding
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg, // 16px between children
    ...style,
  };

  const titleStyle = {
    fontSize: `${typography.fontSize.h3}px`, // 24px
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    margin: 0,
    marginBottom: spacing.sm, // 8px extra below title
  };

  const subtitleStyle = {
    fontSize: `${typography.fontSize.base}px`, // 16px
    color: colors.textSecondary,
    margin: 0,
    fontWeight: typography.fontWeight.regular,
  };

  const dividerStyle = {
    height: '1px',
    backgroundColor: colors.divider,
    border: 'none',
    margin: `${spacing.lg} 0`, // 16px top/bottom
  };

  return (
    <section style={containerStyle}>
      {title && (
        <div>
          <h2 style={titleStyle}>{title}</h2>
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
          {showDivider && <hr style={dividerStyle} />}
        </div>
      )}
      {children}
    </section>
  );
}

Section.displayName = 'Section';
