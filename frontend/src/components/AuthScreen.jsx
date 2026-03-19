/**
 * AuthScreen Component - Modern Authentication Interface
 * Signup, email verification, and login with clean design
 *
 * Refactored to use inline styles based on design tokens, removing the
 * dependency on AuthScreen.css.
 */
import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import './SMSAuthScreen.css';


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
      setSuccessMessage(result.message || 'Inscription réussie! Vérifiez votre courriel.');
      setAuthState('verify');
      setEmail(signupEmail);
    } else {
      const errorMessage = {
        INVALID_EMAIL: 'Adresse courriel invalide.',
        WEAK_PASSWORD: 'Le mot de passe doit contenir au moins 12 caractères avec des majuscules, minuscules, chiffres et symboles.',
        EMAIL_EXISTS: 'Ce courriel est déjà enregistré.',
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
        INVALID_CREDENTIALS: 'Courriel ou mot de passe incorrect.',
        COGNITO_EMAIL_NOT_VERIFIED: 'Veuillez vérifier votre courriel d\'abord.',
        USER_NOT_FOUND: 'Ce courriel n\'existe pas.',
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
      setSuccessMessage('Courriel vérifié avec succès! Veuillez vous connecter.');
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
      setSuccessMessage('Code de vérification renvoyé! Vérifiez votre courriel.');
    } else {
      setLocalError(result.error || 'Erreur lors de l\'envoi du code.');
    }
  };

  const renderMessage = () => {
    if (localError) {
      return <div className="error-message" role="alert">⚠️ {localError}</div>;
    }
    if (successMessage) {
      return (
        <div style={{
          padding: '15px', backgroundColor: '#E8F5E9', color: '#2E7D32',
          border: '1px solid #C8E6C9', borderRadius: '8px', marginBottom: '20px',
          fontSize: '15px', textAlign: 'center', borderLeft: '4px solid #2E7D32'
        }}>
          ✅ {successMessage}
        </div>
      );
    }
    return null;
  };

  return (
    <main className="sms-auth-screen" role="main">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <h1>🛡️ ScamGuard</h1>
          <p>La sécurité, simplement.</p>
        </div>

        {/* Login State */}
        {authState === 'login' && (
          <div className="auth-form">
            <h2>Connexion à votre compte</h2>
            
            {renderMessage()}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">Adresse courriel</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@courriel.com"
                  aria-invalid={localError.toLowerCase().includes('courriel')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Mot de passe</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  aria-invalid={localError.toLowerCase().includes('passe')}
                />
              </div>

              <button type="submit" className="auth-button" disabled={auth.isLoading}>
                {auth.isLoading ? '⏳ Connexion...' : '✅ Se connecter'}
              </button>
            </form>

            <div style={{ textAlign: 'center', margin: '24px 0', color: 'var(--text-light)', position: 'relative' }}>
              <span style={{ background: 'white', padding: '0 10px', position: 'relative', zIndex: 1 }}>ou</span>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e0e0e0', zIndex: 0 }}></div>
            </div>

            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                setAuthState('signup');
                setLocalError('');
                setSuccessMessage('');
              }}
            >
              Pas encore de compte? M'inscrire
            </button>
          </div>
        )}

        {/* Signup State */}
        {authState === 'signup' && (
          <div className="auth-form">
            <h2>Créer votre compte</h2>
            <p className="step-description">Rejoignez ScamGuard pour protéger votre navigation.</p>
            
            {renderMessage()}

            <form onSubmit={handleSignupSubmit}>
              <div className="form-group">
                <label htmlFor="signup-email">Adresse courriel</label>
                <input
                  id="signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="exemple@courriel.com"
                  aria-invalid={localError.toLowerCase().includes('courriel')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-password">Mot de passe</label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 12 caractères"
                  aria-invalid={localError.toLowerCase().includes('passe')}
                />
                <small>Minimum 12 caractères, avec au moins une majuscule, un chiffre et un symbole (!@#$%^&*)</small>
              </div>

              <button type="submit" className="auth-button" disabled={auth.isLoading}>
                {auth.isLoading ? '⏳ Inscription...' : '✅ M\'inscrire'}
              </button>
            </form>

            <div style={{ textAlign: 'center', margin: '24px 0', color: 'var(--text-light)', position: 'relative' }}>
              <span style={{ background: 'white', padding: '0 10px', position: 'relative', zIndex: 1 }}>ou</span>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e0e0e0', zIndex: 0 }}></div>
            </div>

            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                setAuthState('login');
                setLocalError('');
                setSuccessMessage('');
              }}
            >
              Vous avez un compte? Se connecter
            </button>
          </div>
        )}

        {/* Verify State */}
        {authState === 'verify' && (
          <div className="auth-form">
            <h2>📧 Vérifier votre courriel</h2>
            <p className="step-description">
              Un code de vérification a été envoyé à <br/><strong>{email}</strong>
            </p>

            {renderMessage()}

            <form onSubmit={handleVerifySubmit}>
              <div className="form-group">
                <label htmlFor="verify-code">Code de vérification (6 chiffres)</label>
                <input
                  id="verify-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  inputMode="numeric"
                  style={{ textAlign: 'center', fontSize: '28px', letterSpacing: '12px', fontWeight: 'bold' }}
                  aria-invalid={localError.toLowerCase().includes('code')}
                />
              </div>

              <button type="submit" className="auth-button" disabled={auth.isLoading || verificationCode.length < 6}>
                {auth.isLoading ? '⏳ Vérification...' : '✅ Vérifier mon courriel'}
              </button>
            </form>

            <button
              type="button"
              className="auth-link-button"
              onClick={handleResendCode}
              disabled={auth.isLoading}
              style={{ marginTop: '16px' }}
            >
              Vous n'avez pas reçu le code? Renvoyer
            </button>
          </div>
        )}
      </div>

      {/* Footer conforming to SMSAuthScreen footer styles */}
      <footer className="auth-footer">
        <p className="privacy">
          En continuant, vous acceptez nos conditions d'utilisation.<br/>
          Protégez-vous contre les arnaques par courriel.
        </p>
      </footer>
    </main>
  );
}
