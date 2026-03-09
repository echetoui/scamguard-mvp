/**
 * Email Authentication Form Component
 * Phase 4.4 - Email and password entry
 *
 * Handles email/password signup and login flows
 * Extracted from SMSAuthScreen for testability
 */

import React, { useState } from 'react';
import '../SMSAuthScreen.css';

export default function EmailAuthForm({
  email,
  setEmail,
  password,
  setPassword,
  mode,
  loading,
  error,
  onGeneratePassword,
  onCopyPassword,
  onSubmit,
  onModeChange,
}) {
  const isSignup = mode === 'signup';
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} role="form">
      <h2 className="form-title">
        {isSignup ? 'Créer un compte' : 'Se connecter'}
      </h2>

      {/* Email field */}
      <div className="form-group">
        <label htmlFor="email">Adresse email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          required
          disabled={loading}
          aria-label="Adresse email"
          aria-describedby="email-error"
        />
      </div>

      {/* Password field */}
      {isSignup && (
        <div className="form-group password-group">
          <div className="password-header">
            <label htmlFor="password">Mot de passe</label>
            <button
              type="button"
              onClick={onGeneratePassword}
              disabled={loading}
              className="btn-generate"
              aria-label="Générer un mot de passe sécurisé"
            >
              🔐 Générer
            </button>
          </div>

          <div className="password-input-wrapper">
            <input
              id="password"
              type={passwordVisible ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              disabled={loading}
              aria-label="Mot de passe"
              aria-describedby="password-hint"
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              disabled={loading}
              className="btn-toggle-password"
              aria-label={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {passwordVisible ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          {password && (
            <button
              type="button"
              onClick={onCopyPassword}
              disabled={loading}
              className="btn-copy-password"
              aria-label="Copier le mot de passe"
            >
              📋 Copier
            </button>
          )}

          <small id="password-hint" className="password-hint">
            Minimum 8 caractères, lettres majuscules, minuscules, chiffres et symboles
          </small>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div id="email-error" className="error-message" role="alert">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading || !email || (isSignup && !password)}
        className="btn-submit"
        aria-busy={loading}
      >
        {loading ? '⏳ Traitement...' : (isSignup ? 'Créer un compte' : 'Se connecter')}
      </button>

      {/* Toggle mode */}
      <div className="auth-mode-toggle">
        {isSignup ? (
          <>
            <span>Vous avez déjà un compte? </span>
            <button
              type="button"
              onClick={() => onModeChange('login')}
              className="btn-toggle-mode"
              aria-label="Accéder à la page de connexion"
            >
              Se connecter
            </button>
          </>
        ) : (
          <>
            <span>Pas de compte? </span>
            <button
              type="button"
              onClick={() => onModeChange('signup')}
              className="btn-toggle-mode"
              aria-label="Accéder à la page d'inscription"
            >
              Créer un compte
            </button>
          </>
        )}
      </div>
    </form>
  );
}
