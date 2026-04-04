import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';

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

  // Formatage ultra-simple : On ne garde que les chiffres et le '+'
  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^0-9+]/g, '');
    setPhoneNumber(cleaned);
  };

  const handleSubmit = async () => {
    // On s'assure qu'il y a au moins 10 chiffres (format canadien standard)
    if (phoneNumber.length < 10) return;
    
    setIsLoading(true);
    try {
      // Appelle la fonction passée en prop (qui fera l'appel API vers ton Lambda)
      await onRequestCode(phoneNumber);
    } finally {
      setIsLoading(false);
    }
  };

  const Wrapper = Platform.OS === 'web' ? View : KeyboardAvoidingView;
  const wrapperProps = Platform.OS === 'web' ? { style: styles.container } : {
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
    style: styles.container
  };

  return (
    <Wrapper {...wrapperProps}>
      <View style={styles.content}>
        
        <View style={styles.header}>
          <Text style={styles.icon} accessibilityElementsHidden={true}>🛡️</Text>
          <Text style={styles.title} accessibilityRole="header">
            Bienvenue sur ScamGuard
          </Text>
          <Text style={styles.subtitle}>
            Votre bouclier contre la fraude. Connectez-vous simplement avec votre numéro de cellulaire.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label} nativeID="phoneLabel">
            Quel est votre numéro de téléphone ?
          </Text>

          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
          
          <TextInput
            style={[
              styles.input,
              isFocused && styles.inputFocused
            ]}
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            placeholder="Ex: 514 123 4567"
            placeholderTextColor="#9CA3AF" // Gris clair
            accessibilityLabelledBy="phoneLabel"
            accessibilityHint="Entrez votre numéro pour recevoir un code par SMS"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={15}
          />

          <TouchableOpacity 
            style={[
              styles.button,
              (phoneNumber.length < 10 || isLoading) && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={phoneNumber.length < 10 || isLoading}
            accessibilityRole="button"
            accessibilityState={{ disabled: phoneNumber.length < 10 || isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.surface} size="large" />
            ) : (
              <Text style={styles.buttonText}>Continuer</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.privacyText}>
            🔒 Nous ne partagerons jamais votre numéro. Il sert uniquement à sécuriser votre compte.
          </Text>
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
    justifyContent: 'center', // Centrer verticalement pour faciliter l'accès
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32, // Typo H1
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 20, // Grand Body pour les aînés
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 12,
  },
  input: {
    height: 70, // Règle des >60px : Immense champ de texte
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    fontSize: 24, // Typographie très grande
    paddingHorizontal: 20,
    color: COLORS.textMain,
    marginBottom: 24,
  },
  inputFocused: {
    borderColor: COLORS.primary, // Contour net quand sélectionné
  },
  button: {
    height: 70, // Règle des >60px
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF', // Gris désactivé
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  privacyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
  }
});