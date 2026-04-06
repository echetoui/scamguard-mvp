import React from 'react';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  touchTargets,
} from '@/styles/design-tokens';

export function Alert({
  variant = 'info',
  title,
  message,
  dismissable = false,
  onDismiss,
}) {
  const variantMap = {
    error: {
      borderColor: colors.error,
      backgroundColor: colors.errorContainer,
      icon: '⚠️',
      titleColor: colors.error,
    },
    warning: {
      borderColor: colors.warning,
      backgroundColor: colors.tertiaryContainer,
      icon: '⚠️',
      titleColor: colors.warning,
    },
    success: {
      borderColor: colors.success,
      backgroundColor: colors.secondaryContainer,
      icon: '✓',
      titleColor: colors.success,
    },
    info: {
      borderColor: colors.info,
      backgroundColor: colors.primaryContainer,
      icon: 'ℹ️',
      titleColor: colors.info,
    },
  };

  const variantConfig = variantMap[variant];

  const containerStyle = {
    width: '100%',
    padding: spacing.lg, // 16px
    borderRadius: borderRadius.md, // 8px
    borderLeft: `4px solid ${variantConfig.borderColor}`,
    backgroundColor: variantConfig.backgroundColor,
    display: 'flex',
    gap: spacing.lg, // 16px gap between icon and content
    alignItems: 'flex-start',
  };

  const iconStyle = {
    fontSize: '32px',
    minWidth: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const contentStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm, // 8px between title and message
  };

  const titleStyle = {
    fontSize: `${typography.fontSize.base}px`, // 16px
    fontWeight: typography.fontWeight.bold,
    color: variantConfig.titleColor,
    margin: 0,
  };

  const messageStyle = {
    fontSize: `${typography.fontSize.base}px`, // 16px
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.normal, // 1.5
    margin: 0,
  };

  const dismissButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: spacing.sm, // 8px
    minHeight: touchTargets.recommended, // 72px - clickable
    minWidth: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>{variantConfig.icon}</div>

      <div style={contentStyle}>
        {title && <h3 style={titleStyle}>{title}</h3>}
        {message && <p style={messageStyle}>{message}</p>}
      </div>

      {dismissable && (
        <button
          onClick={onDismiss}
          style={dismissButtonStyle}
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}

Alert.displayName = 'Alert';
