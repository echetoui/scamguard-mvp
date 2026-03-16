/**
 * Email Authentication Form Component
 * Phase 4.4 - Email and password entry
 *
 * Handles email/password signup and login flows
 * Extracted from SMSAuthScreen for testability
 * REFACTORED to use Design System components
 */

import React, { useState } from 'react';
import Input from '../../design-system/Input';
import Button from '../../design-system/Button';
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

      <Input
        label="Adresse email"
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="votre@email.com"
        disabled={loading}
        error={error && error.toLowerCase().includes('email') ? error : null}
      />

      {isSignup && (
        <div className="form-group password-group">
          <div className="password-header">
            <label htmlFor="password">Mot de passe</label>
            <Button
              type="button"
              onClick={onGeneratePassword}
              disabled={loading}
              variant="secondary"
            >
              🔐 Générer
            </Button>
          </div>

          <div className="password-input-wrapper">
             <Input
                label=""
                id="password"
                type={passwordVisible ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                disabled={loading}
                error={error && error.toLowerCase().includes('passe') ? error : null}
             />
            <Button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              disabled={loading}
              variant="secondary"
              className="btn-toggle-password"
            >
              {passwordVisible ? '👁️' : '👁️‍🗨️'}
            </Button>
          </div>

          {password && (
            <Button
              type="button"
              onClick={onCopyPassword}
              disabled={loading}
              variant="secondary"
              className="btn-copy-password"
            >
              📋 Copier
            </Button>
          )}

          <small id="password-hint" className="password-hint">
            Minimum 8 caractères, lettres majuscules, minuscules, chiffres et symboles
          </small>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={loading || !email || (isSignup && !password)}
        aria-busy={loading}
      >
        {loading ? '⏳ Traitement...' : (isSignup ? 'Créer un compte' : 'Se connecter')}
      </Button>

      <div className="auth-mode-toggle">
        {isSignup ? (
          <>
            <span>Vous avez déjà un compte? </span>
            <Button
              type="button"
              onClick={() => onModeChange('login')}
              variant="secondary"
            >
              Se connecter
            </Button>
          </>
        ) : (
          <>
            <span>Pas de compte? </span>
            <Button
              type="button"
              onClick={() => onModeChange('signup')}
              variant="secondary"
            >
              Créer un compte
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
