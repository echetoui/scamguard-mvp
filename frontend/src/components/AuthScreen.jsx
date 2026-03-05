/**
 * AuthScreen Component - Modern Authentication Interface
 * Signup, email verification, and login with clean design
 */

import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import './AuthScreen.css';

export default function AuthScreen() {
  const auth = useAuth();
  const [authState, setAuthState] = useState('login'); // 'login', 'signup', 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!signupEmail || !password) {
      setLocalError('Veuillez remplir tous les champs.');
      return;
    }

    const result = await auth.signup(signupEmail, password);

    if (result.success) {
      setSuccessMessage(result.message || 'Inscription réussie! Vérifiez votre email.');
      setAuthState('verify');
      setEmail(signupEmail);
    } else {
      const errorMessage = {
        INVALID_EMAIL: 'Adresse email invalide.',
        WEAK_PASSWORD: 'Le mot de passe doit contenir au moins 12 caractères avec des majuscules, minuscules, chiffres et symboles.',
        EMAIL_EXISTS: 'Cet email est déjà enregistré.',
      };
      setLocalError(errorMessage[result.code] || result.error || 'Erreur lors de l\'inscription.');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!email || !password) {
      setLocalError('Veuillez remplir tous les champs.');
      return;
    }

    const result = await auth.login(email, password);

    if (result.success) {
      setSuccessMessage('Connexion réussie!');
      // App.jsx will automatically detect isAuthenticated change
    } else {
      const errorMessage = {
        INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
        COGNITO_EMAIL_NOT_VERIFIED: 'Veuillez vérifier votre email d\'abord.',
        USER_NOT_FOUND: 'Cet email n\'existe pas.',
      };
      setLocalError(errorMessage[result.code] || result.error || 'Erreur lors de la connexion.');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!verificationCode) {
      setLocalError('Veuillez entrer le code de vérification.');
      return;
    }

    const result = await auth.verifyEmail(email, verificationCode);

    if (result.success) {
      setSuccessMessage('Email vérifié avec succès! Veuillez vous connecter.');
      setAuthState('login');
      setPassword('');
      setVerificationCode('');
    } else {
      const errorMessage = {
        CODE_INVALID: 'Code de vérification invalide.',
        CODE_EXPIRED: 'Le code de vérification a expiré.',
      };
      setLocalError(errorMessage[result.code] || result.error || 'Erreur lors de la vérification.');
    }
  };

  const handleResendCode = async () => {
    setLocalError('');
    setSuccessMessage('');

    const result = await auth.resendCode(email);

    if (result.success) {
      setSuccessMessage('Code de vérification renvoyé! Vérifiez votre email.');
    } else {
      setLocalError(result.error || 'Erreur lors de l\'envoi du code.');
    }
  };


  if (authState === 'login') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-header">🛡️ ScamGuard</h1>
          <p className="auth-subheader">Connexion à votre compte</p>

          {localError && <div className="message message-error">{localError}</div>}
          {successMessage && <div className="message message-success">{successMessage}</div>}

          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Adresse email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={auth.isLoading}
            >
              {auth.isLoading ? '⏳ Connexion...' : '✅ Se connecter'}
            </button>
          </form>

          <div className="divider"><span>ou</span></div>

          <button
            className="btn btn-link"
            onClick={() => {
              setAuthState('signup');
              setLocalError('');
              setSuccessMessage('');
            }}
          >
            Pas encore de compte? <strong>S'inscrire</strong>
          </button>
        </div>
      </div>
    );
  }

  if (authState === 'signup') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-header">🛡️ S'inscrire</h1>
          <p className="auth-subheader">Créez votre compte ScamGuard</p>

          {localError && <div className="message message-error">{localError}</div>}
          {successMessage && <div className="message message-success">{successMessage}</div>}

          <form onSubmit={handleSignupSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="signup-email" className="form-label">Adresse email</label>
              <input
                id="signup-email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password" className="form-label">Mot de passe</label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 12 caractères"
                className="form-input"
                required
              />
              <p className="form-hint">
                Minimum 12 caractères, avec au moins une majuscule, un chiffre et un symbole (!@#$%^&*)
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={auth.isLoading}
            >
              {auth.isLoading ? '⏳ Inscription...' : '✅ S\'inscrire'}
            </button>
          </form>

          <div className="divider"><span>ou</span></div>

          <button
            className="btn btn-link"
            onClick={() => {
              setAuthState('login');
              setLocalError('');
              setSuccessMessage('');
            }}
          >
            Vous avez un compte? <strong>Se connecter</strong>
          </button>
        </div>
      </div>
    );
  }

  if (authState === 'verify') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-header">📧 Vérifier votre email</h1>
          <p className="auth-subheader">
            Un code de vérification a été envoyé à <strong>{email}</strong>
          </p>

          {localError && <div className="message message-error">{localError}</div>}
          {successMessage && <div className="message message-success">{successMessage}</div>}

          <form onSubmit={handleVerifySubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="code" className="form-label">Code de vérification (6 chiffres)</label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="form-input"
                required
                maxLength="6"
                inputMode="numeric"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={auth.isLoading || verificationCode.length < 6}
            >
              {auth.isLoading ? '⏳ Vérification...' : '✅ Vérifier mon email'}
            </button>
          </form>

          <button
            className="btn btn-link"
            onClick={handleResendCode}
            disabled={auth.isLoading}
          >
            Vous n'avez pas reçu le code? <strong>Renvoyer</strong>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
