import React, { useState } from 'react';

// Constantes issues de BRAND_GUIDELINES.md
const COLORS = {
  primary: '#1E40AF',
  background: '#F3F4F6',
  textMain: '#111827',
  textSecondary: '#555555',
  surface: '#ffffff',
  focus: '#92400E',
};

export default function PhoneInputScreen({ onRequestCode, errorMsg }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Simple formatting: Keep only digits and '+'
  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^0-9+]/g, '');
    setPhoneNumber(cleaned);
  };

  const handleSubmit = async () => {
    // Ensure at least 10 digits (standard Canadian format)
    if (phoneNumber.length < 10) return;

    setIsLoading(true);
    try {
      // Call the function passed as prop (which will make the API call to Lambda)
      await onRequestCode(phoneNumber);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>

        <div style={styles.header}>
          <div style={styles.icon} aria-hidden="true">🛡️</div>
          <h1 style={styles.title}>
            Bienvenue sur ScamGuard
          </h1>
          <p style={styles.subtitle}>
            Votre bouclier contre la fraude. Connectez-vous simplement avec votre numéro de cellulaire.
          </p>
        </div>

        <div style={styles.formContainer}>
          <label htmlFor="phoneInput" style={styles.label}>
            Quel est votre numéro de téléphone ?
          </label>

          {errorMsg ? (
            <div style={styles.errorContainer}>
              <p style={styles.errorText}>{errorMsg}</p>
            </div>
          ) : null}

          <input
            id="phoneInput"
            type="tel"
            style={[
              styles.input,
              isFocused && styles.inputFocused
            ]}
            value={phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Ex: 514 123 4567"
            aria-label="Quel est votre numéro de téléphone ?"
            aria-describedby="phoneHint"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={15}
          />
          <p id="phoneHint" style={{ fontSize: '14px', color: '#6B7280', marginTop: '-16px', marginBottom: '16px' }}>
            Entrez votre numéro pour recevoir un code par SMS
          </p>

          <button
            style={[
              styles.button,
              (phoneNumber.length < 10 || isLoading) && styles.buttonDisabled
            ]}
            onClick={handleSubmit}
            disabled={phoneNumber.length < 10 || isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
            ) : (
              <span style={styles.buttonText}>Continuer</span>
            )}
          </button>

          <p style={styles.privacyText}>
            🔒 Nous ne partagerons jamais votre numéro. Il sert uniquement à sécuriser votre compte.
          </p>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    minHeight: '100vh',
    padding: '20px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingLeft: '24px',
    paddingRight: '24px',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '16px',
    display: 'block',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '20px',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: '28px',
    margin: '0',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: '22px',
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: '12px',
    display: 'block',
  },
  input: {
    height: '70px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    border: '2px solid #D1D5DB',
    fontSize: '24px',
    paddingLeft: '20px',
    paddingRight: '20px',
    color: COLORS.textMain,
    marginBottom: '24px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  button: {
    height: '70px',
    backgroundColor: COLORS.primary,
    borderRadius: '12px',
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
    cursor: 'pointer',
    fontSize: '24px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    cursor: 'not-allowed',
  },
  buttonText: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  privacyText: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: '24px',
    margin: '0',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  errorText: {
    color: '#DC2626',
    fontSize: '16px',
    textAlign: 'center',
    margin: '0',
  }
};
