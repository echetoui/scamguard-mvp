import React, { useState, useEffect, useRef } from 'react';

// Constantes issues de BRAND_GUIDELINES.md
const COLORS = {
  primary: '#1E40AF',
  background: '#F3F4F6',
  textMain: '#111827',
  textSecondary: '#555555',
  surface: '#ffffff',
  focus: '#92400E',
  success: '#166534'
};

const CODE_LENGTH = 4;
const TIMER_MINUTES = 5;

export default function OTPVerificationScreen({ phoneNumber, onVerifySuccess, errorMsg }) {
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_MINUTES * 60);
  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef(null);

  // Timer: 5 minutes to enter the code
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (value) => {
    // Only accept digits
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= CODE_LENGTH) {
      setCode(numericValue);
      // Auto-submit when 4 digits entered
      if (numericValue.length === CODE_LENGTH) {
        onVerifySuccess(numericValue);
      }
    }
  };

  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>

        {/* Reassuring and educational header */}
        <h1 style={styles.title}>
          Vérification sécurisée
        </h1>

        <div style={styles.infoCard}>
          <p style={styles.instructionText}>
            Nous avons envoyé un code à 4 chiffres au <strong style={styles.boldText}>{phoneNumber}</strong>.
          </p>
          <p style={styles.educationText}>
            🛡️ ScamGuard ne vous appellera JAMAIS pour vous demander ce code.
          </p>
        </div>

        {errorMsg ? (
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>{errorMsg}</p>
          </div>
        ) : null}

        {/* Code input area */}
        <div style={styles.codeContainer}>
          <div style={styles.boxesContainer} onClick={handleBoxPress}>
            {[...Array(CODE_LENGTH)].map((_, index) => {
              const digit = code[index] || '';
              const isCurrentDigit = index === code.length;
              const isActive = isCurrentDigit && isFocused;

              return (
                <div
                  key={index}
                  style={{
                    ...styles.codeBox,
                    ...(isActive && styles.codeBoxActive),
                    ...(digit && styles.codeBoxFilled)
                  }}
                >
                  <span style={styles.codeText}>{digit}</span>
                </div>
              );
            })}
          </div>

          {/* Hidden input for keyboard entry and autofill */}
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            maxLength={CODE_LENGTH}
            style={styles.hiddenInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label="Entrez le code à 4 chiffres reçu par SMS"
            autoFocus
          />
        </div>

        {/* Timer and resend */}
        <div style={styles.timerContainer}>
          {timeLeft > 0 ? (
            <p style={styles.timerText}>
              Prenez votre temps. Code valide pour : <strong style={styles.boldText}>{formatTime(timeLeft)}</strong>
            </p>
          ) : (
            <button
              style={styles.resendButton}
              onClick={() => {
                setCode('');
                setTimeLeft(TIMER_MINUTES * 60);
              }}
              aria-label="Renvoyer un nouveau code par SMS"
            >
              Renvoyer un nouveau code
            </button>
          )}
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
    paddingLeft: '24px',
    paddingRight: '24px',
    paddingTop: '40px',
    minHeight: '100vh',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: '20px',
    margin: '0 0 20px 0',
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    padding: '20px',
    borderRadius: '16px',
    marginBottom: '40px',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  instructionText: {
    fontSize: '20px',
    color: COLORS.textMain,
    lineHeight: '30px',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },
  educationText: {
    fontSize: '18px',
    color: COLORS.textSecondary,
    lineHeight: '26px',
    fontStyle: 'italic',
    margin: '0',
  },
  boldText: {
    fontWeight: 'bold',
  },
  codeContainer: {
    textAlign: 'center',
    marginBottom: '40px',
    position: 'relative',
  },
  boxesContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    paddingLeft: '10px',
    paddingRight: '10px',
    cursor: 'pointer',
  },
  codeBox: {
    width: '65px',
    height: '75px',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    border: '2px solid #D1D5DB',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
  },
  codeBoxActive: {
    borderColor: COLORS.focus,
    borderWidth: '3px',
  },
  codeBoxFilled: {
    borderColor: COLORS.primary,
  },
  codeText: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: COLORS.textMain,
  },
  hiddenInput: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    opacity: '0',
    border: 'none',
  },
  timerContainer: {
    textAlign: 'center',
  },
  timerText: {
    fontSize: '18px',
    color: COLORS.textSecondary,
    textAlign: 'center',
    margin: '0',
  },
  resendButton: {
    minHeight: '60px',
    paddingLeft: '20px',
    paddingRight: '20px',
    backgroundColor: '#E5E7EB',
    borderRadius: '12px',
    border: 'none',
    fontSize: '20px',
    fontWeight: '600',
    color: COLORS.primary,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  errorText: {
    color: '#DC2626',
    fontSize: '16px',
    textAlign: 'center',
    margin: '0',
  }
};
