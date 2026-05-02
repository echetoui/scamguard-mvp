/**
 * SMSMessage Component - ScamGuard Design System
 * Figma Component: SMS Message / Scam | Legitimate | Suspicious
 *
 * Displays SMS verdict with color-coded background
 */

import React from 'react';
import { colors } from '../styles/design-tokens';
import './SMSMessage.css';

/**
 * @param {object} props
 * @param {'scam' | 'legitimate' | 'suspicious'} props.verdict - SMS verdict
 * @param {string} props.message - SMS text content
 * @param {string} [props.sender] - Sender identifier
 * @param {function} [props.onReport] - Callback for report action
 */
const SMSMessage = ({
  verdict = 'suspicious',
  message,
  sender,
  onReport
}) => {
  const verdictMap = {
    scam: {
      bgColor: colors.errorContainer,     // #F9DEDC
      borderColor: colors.error,          // #BA1A1A
      label: 'Arnaque détectée',
      icon: '⚠️'
    },
    legitimate: {
      bgColor: colors.secondaryContainer, // #D5EDDC
      borderColor: colors.secondary,      // #1B6B3A
      label: 'Légitime',
      icon: '✓'
    },
    suspicious: {
      bgColor: colors.tertiaryContainer,  // #FFDDB8
      borderColor: colors.tertiary,       // #7A5900
      label: 'Suspect',
      icon: '?'
    }
  };

  const config = verdictMap[verdict];

  return (
    <div
      className="sms-message"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }}
      role="article"
      aria-label={`${config.label}: ${message}`}
    >
      <div className="sms-message__header">
        <span className="sms-message__icon">{config.icon}</span>
        <h3
          className="sms-message__verdict"
          style={{ color: config.borderColor }}
        >
          {config.label}
        </h3>
      </div>

      {sender && (
        <p className="sms-message__sender">
          De : <strong>{sender}</strong>
        </p>
      )}

      <p className="sms-message__text">{message}</p>

      {onReport && (
        <button
          className="sms-message__action"
          onClick={onReport}
          style={{ color: config.borderColor, borderColor: config.borderColor }}
        >
          Signaler ce message
        </button>
      )}
    </div>
  );
};

export default SMSMessage;
