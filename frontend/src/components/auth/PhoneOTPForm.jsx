/**
 * Phone OTP Form Component
 * Phase 4.4 - Phone entry and OTP verification
 *
 * Handles phone number input and SMS OTP verification
 * Extracted from SMSAuthScreen for testability
 */

import React, { useRef, useEffect } from 'react';
import '../SMSAuthScreen.css';

export default function PhoneOTPForm({
  phone,
  setPhone,
  otp,
  setOtp,
  step,
  setStep,
  loading,
  error,
  resendTimer,
  onRequestOtp,
  onVerifyOtp,
  onResendOtp,
}) {
  const otpRefs = useRef([]);

  // Auto-focus OTP input when ready
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  // Handle OTP digit input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next field
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    onRequestOtp(phone);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    onVerifyOtp(otpCode);
  };

  if (step === 'phone') {
    return (
      <form className="phone-form" onSubmit={handlePhoneSubmit}>
        <h2 className="form-title">Numéro de téléphone</h2>
        <p className="form-subtitle">
          Nous enverrons un code SMS pour vérifier votre identité
        </p>

        <div className="form-group">
          <label htmlFor="phone">Numéro de téléphone</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (514) 123-4567"
            required
            disabled={loading}
            aria-label="Numéro de téléphone"
            aria-describedby="phone-error"
          />
          <small className="phone-hint">Format: +1 (514) 123-4567</small>
        </div>

        {error && (
          <div id="phone-error" className="error-message" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !phone}
          className="btn-submit"
          aria-busy={loading}
        >
          {loading ? '⏳ Envoi...' : 'Envoyer le code SMS'}
        </button>
      </form>
    );
  }

  // OTP verification step
  if (step === 'otp') {
    return (
      <form className="otp-form" onSubmit={handleOtpSubmit}>
        <h2 className="form-title">Vérifier le code SMS</h2>
        <p className="form-subtitle">
          Entrez le code à 6 chiffres reçu par SMS
        </p>

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
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              disabled={loading}
              aria-label={`Chiffre ${index + 1} du code`}
              className="otp-input"
            />
          ))}
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || otp.join('').length !== 6}
          className="btn-submit"
          aria-busy={loading}
        >
          {loading ? '⏳ Vérification...' : 'Vérifier le code'}
        </button>

        {/* Resend OTP */}
        <div className="otp-actions">
          <button
            type="button"
            onClick={onResendOtp}
            disabled={loading || resendTimer > 0}
            className="btn-resend"
            aria-label="Renvoyer le code SMS"
          >
            {resendTimer > 0 ? `Renvoyer dans ${resendTimer}s` : 'Renvoyer le code'}
          </button>

          <button
            type="button"
            onClick={() => setStep('phone')}
            disabled={loading}
            className="btn-back"
            aria-label="Retour à l'entrée du numéro de téléphone"
          >
            ← Retour
          </button>
        </div>
      </form>
    );
  }

  return null;
}
