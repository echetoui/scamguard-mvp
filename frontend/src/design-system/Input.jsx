import React, { useState } from 'react';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  transitions,
} from '@/styles/design-tokens';

export function Input({
  type = 'text',
  label,
  placeholder,
  error,
  helperText,
  disabled = false,
  onChange,
  value,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm, // 8px between label and input
    marginBottom: spacing.lg, // 16px after each input
  };

  const labelStyle = {
    fontSize: `${typography.fontSize.base}px`,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs, // 4px
  };

  const inputStyle = {
    height: '70px', // Senior-friendly touch target
    fontSize: '20px', // readable
    padding: `0 ${spacing.xl}`, // 20px left/right
    borderRadius: borderRadius.lg, // 12px
    border: `2px solid ${error ? colors.error : colors.border}`,
    backgroundColor: disabled ? colors.disabledBg : colors.surface,
    color: colors.textPrimary,
    transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
    fontFamily: typography.fontFamily.system,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'auto',
  };

  const focusedInputStyle = isFocused && !disabled ? {
    borderColor: colors.primary,
    boxShadow: `0 0 0 3px ${colors.focusShadow}`,
  } : {};

  const helperStyle = {
    fontSize: `${typography.fontSize.sm}px`, // 14px
    color: error ? colors.error : colors.textSecondary,
    marginTop: spacing.xs, // 4px
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            ...inputStyle,
            ...focusedInputStyle,
            flex: 1,
          }}
          {...props}
        />

        {type === 'password' && (
          <button
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '15px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '8px',
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
      </div>

      {(error || helperText) && (
        <p style={helperStyle}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

Input.displayName = 'Input';
