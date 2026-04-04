import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Pressable
} from 'react-native';

// Constantes issues de BRAND_GUIDELINES.md
const COLORS = {
  primary: '#1E40AF',
  background: '#F3F4F6',
  textMain: '#111827',
  textSecondary: '#555555',
  surface: '#ffffff',
  focus: '#92400E', // Utilisé pour le contour de focus (Ambre Alerte pour visibilité)
  success: '#166534'
};

const CODE_LENGTH = 4;
const TIMER_MINUTES = 5; // 5 minutes pour réduire le stress

export default function OTPVerificationScreen({ phoneNumber, onVerifySuccess, errorMsg }) {
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_MINUTES * 60);
  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef(null);

  // Minuteur rassurant de 5 minutes
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  // Formatage du temps (ex: 04:59)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (value) => {
    // On n'accepte que les chiffres
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= CODE_LENGTH) {
      setCode(numericValue);
      // Auto-soumission quand les 4 chiffres sont entrés
      if (numericValue.length === CODE_LENGTH) {
        onVerifySuccess(numericValue);
      }
    }
  };

  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  const Wrapper = Platform.OS === 'web' ? View : KeyboardAvoidingView;
  const wrapperProps = Platform.OS === 'web' ? { style: styles.container } : {
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
    style: styles.container
  };

  return (
    <Wrapper {...wrapperProps}>
      <View style={styles.content}>
        
        {/* En-tête rassurant et éducatif */}
        <Text style={styles.title} accessibilityRole="header">
          Vérification sécurisée
        </Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.instructionText}>
            Nous avons envoyé un code à 4 chiffres au <Text style={styles.boldText}>{phoneNumber}</Text>.
          </Text>
          <Text style={styles.educationText}>
            🛡️ ScamGuard ne vous appellera JAMAIS pour vous demander ce code.
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Zone de saisie du code */}
        <View style={styles.codeContainer}>
          <Pressable style={styles.boxesContainer} onPress={handleBoxPress}>
            {[...Array(CODE_LENGTH)].map((_, index) => {
              const digit = code[index] || '';
              const isCurrentDigit = index === code.length;
              const isActive = isCurrentDigit && isFocused;

              return (
                <View 
                  key={index} 
                  style={[
                    styles.codeBox, 
                    isActive && styles.codeBoxActive,
                    digit && styles.codeBoxFilled
                  ]}
                >
                  <Text style={styles.codeText}>{digit}</Text>
                </View>
              );
            })}
          </Pressable>

          {/* 
            Le champ TextInput caché qui fait la magie : 
            - textContentType="oneTimeCode" (iOS AutoFill)
            - autoComplete="sms-otp" (Android AutoFill)
          */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={CODE_LENGTH}
            style={styles.hiddenInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            accessibilityLabel="Entrez le code à 4 chiffres reçu par SMS"
            autoFocus
          />
        </View>

        {/* Compte à rebours et renvoi généreux */}
        <View style={styles.timerContainer}>
          {timeLeft > 0 ? (
            <Text style={styles.timerText}>
              Prenez votre temps. Code valide pour : <Text style={styles.boldText}>{formatTime(timeLeft)}</Text>
            </Text>
          ) : (
            <TouchableOpacity 
              style={styles.resendButton} 
              accessibilityRole="button"
              accessibilityHint="Renvoie un nouveau code par SMS"
            >
              <Text style={styles.resendButtonText}>Renvoyer un nouveau code</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 32, // Typographie H1 de la charte
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 2, // Ombre légère pour Android
        shadowColor: '#000', // Ombre pour iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }
    })
  },
  instructionText: {
    fontSize: 20, // Plus grand que le Body standard (18px) pour les seniors
    color: COLORS.textMain,
    lineHeight: 30,
    marginBottom: 16,
  },
  educationText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  boldText: {
    fontWeight: 'bold',
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  codeBox: {
    width: 65,
    height: 75, // Règle des >60px respectée (très grand pour les tremblements)
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB', // Gris bordure standard
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxActive: {
    borderColor: COLORS.focus, // Double validation visuelle (Focus)
    borderWidth: 3,
  },
  codeBoxFilled: {
    borderColor: COLORS.primary,
  },
  codeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.textMain,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  resendButton: {
    minHeight: 60, // Règle des 60px
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#E5E7EB', // Bouton secondaire
    borderRadius: 12,
  },
  resendButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
  }
});