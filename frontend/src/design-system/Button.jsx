/**
 * New Design System - Button Component
 *
 * Adheres to the Phase 3 Design System Refresh Plan.
 *
 * Core Principles:
 * - Clarity First: Clear, understandable button labels.
 * - High Contrast & Readability: Meets WCAG AAA contrast ratios. Font size is 18px.
 * - Large Touch Targets: Minimum touch target size of 56x56 pixels.
 * - Simplicity: Clean design with ample padding.
 */
import React from 'react';
import './Button.css';

/**
 * Renders a button with design system styles.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The content to display inside the button.
 * @param {function} props.onClick - The function to call when the button is clicked.
 * @param {'primary' | 'secondary'} [props.variant='primary'] - The visual style of the button.
 * @param {'medium' | 'small'} [props.size] - The size of the button.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {string} [props.className=''] - Additional class names to apply.
 */
const Button = ({
  children,
  onClick,
  variant = 'primary',
  size,
  disabled = false,
  className = '',
}) => {
  const buttonClasses = `
    ds-button
    ds-button--${variant}
    ${size ? `ds-button--${size}` : ''}
    ${className}
  `.trim();

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
