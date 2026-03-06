/**
 * Accessible Toast Component
 * Uses role="alert" for announcements without interrupting user
 *
 * Features:
 * ✅ WCAG 2.1 AA compliant (role="alert")
 * ✅ Auto-dismiss with customizable timeout
 * ✅ Respects prefers-reduced-motion
 * ✅ Mobile-friendly positioning
 */

import React, { useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, type = 'success', onClose, autoClose = 3000 }) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <div
      className={`toast toast-${type}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="toast-icon" aria-hidden="true">
        {type === 'success' && '✅'}
        {type === 'error' && '❌'}
        {type === 'info' && 'ℹ️'}
        {type === 'warning' && '⚠️'}
      </span>
      <span className="toast-message">{message}</span>
    </div>
  );
}
