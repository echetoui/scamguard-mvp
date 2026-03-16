/**
 * AuthScreen Component - Modern Authentication Interface
 * Signup, email verification, and login with clean design
 *
 * Refactored to use inline styles based on design tokens, removing the
 * dependency on AuthScreen.css.
 */
import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import Button from '../design-system/Button';
import Input from '../design-system/Input';
import Card from '../design-system/Card';

// --- Style Definitions based on design-tokens.css ---

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '20px',
  },
  card: {
    maxWidth: '460px',
    width: '100%',
    padding: '48px',
  },
  header: {
    fontSize: 'var(--font-size-h1)',
    fontWeight: 'var(--font-weight-bold)',
    marginBottom: 'var(--spacing-sm)',
    textAlign: 'center',
    color: 'var(--color-text-primary)',
  },
  subheader: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
    marginBottom: 'var(--spacing-3xl)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xl)',
  },
  formHint: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
    marginTop: `calc(-1 * var(--spacing-md))`,
    paddingLeft: 'var(--spacing-xs)',
  },
  message: {
    padding: 'var(--spacing-lg)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    marginBottom: 'var(--spacing-lg)',
    borderLeft: '4px solid',
  },
  messageError: {
    background: 'var(--color-danger-bg-light)',
    color: 'var(--color-danger-dark)',
    borderLeftColor: 'var(--color-danger)',
  },
  messageSuccess: {
    background: 'var(--color-success-bg-light)',
    color: 'var(--color-success-dark)',
    borderLeftColor: 'var(--color-success)',
  },
  dividerContainer: {
    textAlign: 'center',
    margin: 'var(--spacing-2xl) 0',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--color-border)',
  },
  dividerText: {
    background: 'var(--color-background)',
    padding: '0 var(--spacing-md)',
  }
};

// --- Helper Component for the Divider ---

const Divider = ({ children }) => (
  <div style={styles.dividerContainer}>
    <div style={styles.dividerLine} />
    <span style={styles.dividerText}>{children}</span>
    <div style={styles.dividerLine} />
  </div>
);


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

  const renderMessage = () => {
    if (localError) {
      return <div style={{...styles.message, ...styles.messageError}}>{localError}</div>;
    }
    if (successMessage) {
      return <div style={{...styles.message, ...styles.messageSuccess}}>{successMessage}</div>;
    }
    return null;
  };


  if (authState === 'login') {
    return (
      <div style={styles.container}>
        <Card>
          <div style={styles.card}>
            <h1 style={styles.header}>🛡️ ScamGuard</h1>
            <p style={styles.subheader}>Connexion à votre compte</p>

            {renderMessage()}

            <form onSubmit={handleLoginSubmit} style={styles.form}>
              <Input
                label="Adresse email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                error={localError.includes('Email') ? localError : null}
              />

              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                error={localError.includes('passe') ? localError : null}
              />

              <Button
                type="submit"
                variant="primary"
                disabled={auth.isLoading}
              >
                {auth.isLoading ? '⏳ Connexion...' : '✅ Se connecter'}
              </Button>
            </form>

            <Divider>ou</Divider>

            <Button
              variant="secondary"
              onClick={() => {
                setAuthState('signup');
                setLocalError('');
                setSuccessMessage('');
              }}
            >
              Pas encore de compte? <strong>S'inscrire</strong>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (authState === 'signup') {
    return (
      <div style={styles.container}>
        <Card>
          <div style={styles.card}>
            <h1 style={styles.header}>🛡️ S'inscrire</h1>
            <p style={styles.subheader}>Créez votre compte ScamGuard</p>

            {renderMessage()}

            <form onSubmit={handleSignupSubmit} style={styles.form}>
              <Input
                label="Adresse email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="exemple@email.com"
                error={localError.includes('email') ? localError : null}
              />

              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 12 caractères"
                error={localError.includes('passe') ? localError : null}
              />
              <p style={styles.formHint}>
                  Minimum 12 caractères, avec au moins une majuscule, un chiffre et un symbole (!@#$%^&*)
                </p>

              <Button
                type="submit"
                variant="primary"
                disabled={auth.isLoading}
              >
                {auth.isLoading ? '⏳ Inscription...' : '✅ S\'inscrire'}
              </Button>
            </form>

            <Divider>ou</Divider>

            <Button
              variant="secondary"
              onClick={() => {
                setAuthState('login');
                setLocalError('');
                setSuccessMessage('');
              }}
            >
              Vous avez un compte? <strong>Se connecter</strong>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (authState === 'verify') {
    return (
      <div style={styles.container}>
        <Card>
          <div style={styles.card}>
            <h1 style={styles.header}>📧 Vérifier votre email</h1>
            <p style={styles.subheader}>
              Un code de vérification a été envoyé à <strong>{email}</strong>
            </p>

            {renderMessage()}

            <form onSubmit={handleVerifySubmit} style={styles.form}>
              <Input
                label="Code de vérification (6 chiffres)"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                inputMode="numeric"
                error={localError.includes('code') ? localError : null}
              />

              <Button
                type="submit"
                variant="primary"
                disabled={auth.isLoading || verificationCode.length < 6}
              >
                {auth.isLoading ? '⏳ Vérification...' : '✅ Vérifier mon email'}
              </Button>
            </form>

            <Button
              variant="secondary"
              onClick={handleResendCode}
              disabled={auth.isLoading}
            >
              Vous n'avez pas reçu le code? <strong>Renvoyer</strong>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
