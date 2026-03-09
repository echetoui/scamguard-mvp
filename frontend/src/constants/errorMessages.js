/**
 * Centralized Error Messages
 * Single source of truth for all error messages in the application
 *
 * Benefits:
 * - Consistency across UI
 * - Easy to maintain and update
 * - Enables translations (i18n)
 * - Reduces duplication
 */

export const ERROR_MESSAGES = {
  // Network & API errors
  NETWORK_ERROR: 'Erreur réseau - Vérifiez votre connexion',
  NETWORK_TIMEOUT: 'La requête a expiré - Essayez à nouveau',
  API_ERROR: 'Erreur serveur - Veuillez réessayer plus tard',
  INVALID_RESPONSE: 'Réponse invalide du serveur',

  // Authentication errors
  AUTH_REQUIRED: 'Authentification requise',
  LOGIN_FAILED: 'Impossible de se connecter avec ces identifiants',
  SIGNUP_FAILED: 'Impossible de créer le compte',
  EMAIL_ALREADY_EXISTS: 'Cet email est déjà enregistré',
  INVALID_EMAIL: 'Adresse email invalide',
  INVALID_PASSWORD: 'Le mot de passe ne respecte pas les critères',
  PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas',
  TOKEN_REFRESH_FAILED: 'Impossible de rafraîchir la session',
  SESSION_EXPIRED: 'Votre session a expiré - Veuillez vous reconnecter',

  // SMS/OTP errors
  SMS_REQUEST_FAILED: 'Impossible d\'envoyer le code SMS',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  INVALID_OTP: 'Code OTP invalide',
  OTP_EXPIRED: 'Le code OTP a expiré - Demandez un nouveau code',
  OTP_TOO_MANY_ATTEMPTS: 'Trop de tentatives - Essayez plus tard',

  // Data fetch/save errors
  FETCH_FAILED: 'Impossible de charger les données',
  SAVE_FAILED: 'Impossible d\'enregistrer les modifications',
  DELETE_FAILED: 'Impossible de supprimer',
  UPDATE_FAILED: 'Impossible de mettre à jour',

  // Analysis errors
  ANALYSIS_FAILED: 'Impossible d\'analyser le message',
  IMAGE_UPLOAD_FAILED: 'Impossible de télécharger l\'image',
  INVALID_IMAGE_FORMAT: 'Format d\'image non supporté',
  IMAGE_TOO_LARGE: 'L\'image est trop grande (max 5 MB)',

  // Tools tab errors
  EMAIL_CHECK_FAILED: 'Impossible de vérifier le courriel',
  ADVISOR_CHECK_FAILED: 'Impossible de vérifier le conseiller',

  // Family dashboard errors
  FAMILY_LOAD_FAILED: 'Impossible de charger les données familiales',
  FAMILY_UPDATE_FAILED: 'Impossible de mettre à jour le groupe familial',

  // Quiz errors
  QUIZ_LOAD_FAILED: 'Impossible de charger le quiz',
  QUIZ_SUBMIT_FAILED: 'Impossible d\'enregistrer les résultats du quiz',

  // Profile errors
  PROFILE_LOAD_FAILED: 'Impossible de charger le profil',
  PROFILE_UPDATE_FAILED: 'Impossible de mettre à jour le profil',
  AVATAR_UPDATE_FAILED: 'Impossible de mettre à jour l\'avatar',

  // Generic errors
  UNKNOWN_ERROR: 'Une erreur s\'est produite - Veuillez réessayer',
  SOMETHING_WENT_WRONG: 'Un problème est survenu - Veuillez réessayer',
  TRY_AGAIN_LATER: 'Veuillez essayer à nouveau plus tard',
};

/**
 * Get user-friendly error message from error object
 * @param {Error|string} error - Error object or message
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    // Check if message matches any predefined error
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (error.message.includes(message)) {
        return message;
      }
    }
    return error.message;
  }

  if (error?.statusCode) {
    // HTTP error codes
    switch (error.statusCode) {
      case 400:
        return ERROR_MESSAGES.INVALID_RESPONSE;
      case 401:
        return ERROR_MESSAGES.SESSION_EXPIRED;
      case 403:
        return ERROR_MESSAGES.AUTH_REQUIRED;
      case 404:
        return ERROR_MESSAGES.FETCH_FAILED;
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGES.API_ERROR;
      default:
        return ERROR_MESSAGES.API_ERROR;
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

export default ERROR_MESSAGES;
