/**
 * AuthScreen Component
 * Authentication interface for signup, email verification, and login
 * Optimized for elderly users with large buttons and clear French text
 */

import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

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

  // Styles for senior-friendly UI
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      padding: '40px',
      maxWidth: '500px',
      width: '100%',
    },
    header: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '10px',
      textAlign: 'center',
      color: '#333',
    },
    subheader: {
      fontSize: '16px',
      color: '#666',
      textAlign: 'center',
      marginBottom: '30px',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    label: {
      fontSize: '16px',
      fontWeight: '500',
      color: '#333',
      marginBottom: '4px',
    },
    input: {
      fontSize: '16px',
      padding: '14px',
      border: '2px solid #ddd',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
      transition: 'border-color 0.3s',
    },
    inputFocus: {
      borderColor: '#0066cc',
      outline: 'none',
    },
    buttonPrimary: {
      fontSize: '18px',
      fontWeight: 'bold',
      padding: '16px 24px',
      backgroundColor: '#0066cc',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
      minHeight: '54px',
      marginTop: '8px',
    },
    buttonPrimaryHover: {
      backgroundColor: '#0052a3',
    },
    buttonSecondary: {
      fontSize: '16px',
      padding: '12px 20px',
      backgroundColor: '#f0f0f0',
      color: '#333',
      border: '2px solid #ddd',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
    buttonSecondaryHover: {
      backgroundColor: '#e0e0e0',
    },
    linkButton: {
      fontSize: '16px',
      color: '#0066cc',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline',
      padding: '8px 0',
    },
    errorMessage: {
      backgroundColor: '#ffebee',
      color: '#c62828',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '12px',
      border: '1px solid #ef5350',
    },
    successMessage: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '12px',
      border: '1px solid #66bb6a',
    },
    divider: {
      textAlign: 'center',
      margin: '24px 0',
      fontSize: '14px',
      color: '#999',
    },
    buttonsContainer: {
      display: 'flex',
      gap: '12px',
      marginTop: '12px',
    },
    buttonFlex: {
      flex: 1,
    },
  };

  if (authState === 'login') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>🛡️ ScamGuard</h1>
          <p style={styles.subheader}>Connexion à votre compte</p>

          {localError && <div style={styles.errorMessage}>{localError}</div>}
          {successMessage && <div style={styles.successMessage}>{successMessage}</div>}

          <form onSubmit={handleLoginSubmit} style={styles.form}>
            <div>
              <label htmlFor="email" style={styles.label}>
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                style={styles.input}
                required
              />
            </div>

            <div>
              <label htmlFor="password" style={styles.label}>
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={styles.input}
                required
              />
            </div>

            <button
              type="submit"
              style={styles.buttonPrimary}
              disabled={auth.isLoading}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#0052a3';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#0066cc';
              }}
            >
              {auth.isLoading ? '⏳ Connexion...' : '✅ Se connecter'}
            </button>
          </form>

          <div style={styles.divider}>ou</div>

          <button
            style={styles.linkButton}
            onClick={() => {
              setAuthState('signup');
              setLocalError('');
              setSuccessMessage('');
            }}
          >
            Je n'ai pas encore de compte. Créer un compte
          </button>
        </div>
      </div>
    );
  }

  if (authState === 'signup') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>🛡️ Créer un compte</h1>
          <p style={styles.subheader}>Inscription à ScamGuard</p>

          {localError && <div style={styles.errorMessage}>{localError}</div>}
          {successMessage && <div style={styles.successMessage}>{successMessage}</div>}

          <form onSubmit={handleSignupSubmit} style={styles.form}>
            <div>
              <label htmlFor="signup-email" style={styles.label}>
                Adresse email
              </label>
              <input
                id="signup-email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="exemple@email.com"
                style={styles.input}
                required
              />
            </div>

            <div>
              <label htmlFor="signup-password" style={styles.label}>
                Mot de passe
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="12+ caractères avec majuscules, chiffres et symboles"
                style={styles.input}
                required
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Minimum 12 caractères, avec au moins une majuscule, un chiffre et un symbole (!@#$%^&*)
              </p>
            </div>

            <button
              type="submit"
              style={styles.buttonPrimary}
              disabled={auth.isLoading}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#0052a3';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#0066cc';
              }}
            >
              {auth.isLoading ? '⏳ Inscription...' : '✅ Créer mon compte'}
            </button>
          </form>

          <div style={styles.divider}>ou</div>

          <button
            style={styles.linkButton}
            onClick={() => {
              setAuthState('login');
              setLocalError('');
              setSuccessMessage('');
            }}
          >
            J'ai déjà un compte. Me connecter
          </button>
        </div>
      </div>
    );
  }

  if (authState === 'verify') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>📧 Vérifier votre email</h1>
          <p style={styles.subheader}>
            Un code de vérification a été envoyé à <strong>{email}</strong>
          </p>

          {localError && <div style={styles.errorMessage}>{localError}</div>}
          {successMessage && <div style={styles.successMessage}>{successMessage}</div>}

          <form onSubmit={handleVerifySubmit} style={styles.form}>
            <div>
              <label htmlFor="code" style={styles.label}>
                Code de vérification (6 chiffres)
              </label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={styles.input}
                required
                maxLength="6"
              />
            </div>

            <button
              type="submit"
              style={styles.buttonPrimary}
              disabled={auth.isLoading || verificationCode.length < 6}
              onMouseOver={(e) => {
                if (!e.target.disabled) e.target.style.backgroundColor = '#0052a3';
              }}
              onMouseOut={(e) => {
                if (!e.target.disabled) e.target.style.backgroundColor = '#0066cc';
              }}
            >
              {auth.isLoading ? '⏳ Vérification...' : '✅ Vérifier mon email'}
            </button>
          </form>

          <button
            style={styles.linkButton}
            onClick={handleResendCode}
            disabled={auth.isLoading}
          >
            Je n'ai pas reçu le code. Renvoyer
          </button>
        </div>
      </div>
    );
  }

  return null;
}
