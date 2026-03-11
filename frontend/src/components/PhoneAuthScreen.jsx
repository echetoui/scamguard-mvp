/**
 * PhoneAuthScreen - Simplified Phone-Only Authentication
 * Pattern: Phone → SMS Code → Dashboard
 *
 * Features:
 * ✅ Phone number input (E.164 format)
 * ✅ SMS OTP verification
 * ✅ Auto user creation on first login
 * ✅ Accessible (WCAG AA)
 * ✅ Mobile-optimized
 */

import React, { useState, useRef } from 'react';
import Toast from './Toast';
import { setAuth, setUserId } from '../utils/authStorage';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import './PhoneAuthScreen.css';

export default function PhoneAuthScreen() {
  // State
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const otpRefs = useRef([]);

  const API_URL = process.env.REACT_APP_API_URL || 'https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1';

  // Format phone number to E.164
  const formatPhone = (value) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('1')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.length <= 3) {
      return `+1 ${cleaned}`;
    } else if (cleaned.length <= 6) {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const getE164Phone = (displayPhone) => {
    const cleaned = displayPhone.replace(/\D/g, '');
    const lastTen = cleaned.slice(-10);
    return `+1${lastTen}`;
  };

  // Request OTP
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const e164Phone = getE164Phone(phone);
    if (!e164Phone || e164Phone.length < 12) {
      setError('Numéro de téléphone invalide');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/request-sms-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: e164Phone,
          // Auto-create user - no email/password needed
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Erreur lors de la demande de code');
        setLoading(false);
        return;
      }

      setSuccessMessage(`Code envoyé à ${data.data.phone_masked}`);
      setStep('otp');
      setResendTimer(60);

      // Start countdown
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit input
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '');

    if (digit.length > 1) {
      // Paste handling
      const digits = digit.split('');
      const newOtp = [...otp];
      for (let i = 0; i < digits.length && i + index < 6; i++) {
        newOtp[i + index] = digits[i];
      }
      setOtp(newOtp);

      if (digits.length + index >= 6) {
        otpRefs.current[5]?.focus();
      } else {
        otpRefs.current[digits.length + index]?.focus();
      }
    } else {
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      if (digit && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }

    setError('');
  };

  // Verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const code = otp.join('');
    if (code.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    setLoading(true);
    const e164Phone = getE164Phone(phone);

    try {
      const response = await fetch(`${API_URL}/auth/verify-sms-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: e164Phone,
          code
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Code invalide');
        setLoading(false);
        return;
      }

      // Store tokens
      setAuth({
        id_token: data.data.id_token,
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        expires_in: data.data.expires_in,
      });

      setUserId(data.data.user.sub);

      setSuccessMessage('✅ Bienvenue! Vous êtes connecté');
      setStep('success');

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err) {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setLoading(true);

    const e164Phone = getE164Phone(phone);

    try {
      const response = await fetch(`${API_URL}/auth/request-sms-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164Phone })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Erreur lors du renvoi');
        setLoading(false);
        return;
      }

      setSuccessMessage(`Code renvoyé à ${data.data.phone_masked}`);
      setResendTimer(60);

      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="phone-auth-screen" role="main">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <h1>🛡️ ScamGuard</h1>
          <p>Connectez-vous avec votre numéro</p>
        </div>

        {/* Phone Entry */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="auth-form">
            <h2 className="form-title">Numéro de téléphone</h2>
            <p className="form-subtitle">
              Nous enverrons un code SMS pour vérifier votre identité
            </p>

            {error && <div className="message message-error">{error}</div>}
            {successMessage && <div className="message message-success">{successMessage}</div>}

            <div className="form-group">
              <label htmlFor="phone">Numéro de téléphone</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="+1 (514) 123-4567"
                className="form-input"
                required
                disabled={loading}
                aria-label="Numéro de téléphone"
                aria-describedby="phone-hint"
              />
              <small id="phone-hint" className="phone-hint">Format: +1 (514) 123-4567</small>
            </div>

            <button
              type="submit"
              disabled={loading || !phone}
              className="btn-submit"
              aria-busy={loading}
            >
              {loading ? '⏳ Envoi...' : 'Envoyer le code SMS'}
            </button>
          </form>
        )}

        {/* OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="auth-form">
            <h2 className="form-title">Vérifier le code</h2>
            <p className="form-subtitle">
              Entrez le code à 6 chiffres reçu par SMS
            </p>

            {error && <div className="message message-error">{error}</div>}
            {successMessage && <div className="message message-success">{successMessage}</div>}

            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  disabled={loading}
                  aria-label={`Chiffre ${index + 1}`}
                  className="otp-input"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="btn-submit"
              aria-busy={loading}
            >
              {loading ? '⏳ Vérification...' : 'Vérifier le code'}
            </button>

            {/* Resend */}
            <div className="otp-actions">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resendTimer > 0}
                className="btn-resend"
                aria-label="Renvoyer le code SMS"
              >
                {resendTimer > 0 ? `Renvoyer dans ${resendTimer}s` : 'Renvoyer le code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp(['', '', '', '', '', '']);
                  setError('');
                  setSuccessMessage('');
                }}
                disabled={loading}
                className="btn-back"
                aria-label="Retour à l'entrée du numéro"
              >
                ← Retour
              </button>
            </div>
          </form>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="auth-form success">
            <h2>✅ Bienvenue!</h2>
            <p>{successMessage}</p>
            <p className="step-description">Redirection en cours...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="auth-footer">
        <p className="privacy">
          Protégez-vous contre les arnaques par SMS
        </p>
      </footer>

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </main>
  );
}
