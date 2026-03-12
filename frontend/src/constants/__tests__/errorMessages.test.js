/**
 * Tests for errorMessages.js
 * Verifies all error message constants and utility functions
 */

import { ERROR_MESSAGES, getErrorMessage } from '../errorMessages';

describe('ERROR_MESSAGES', () => {
  describe('constant exports', () => {
    it('should export ERROR_MESSAGES object', () => {
      expect(ERROR_MESSAGES).toBeDefined();
      expect(typeof ERROR_MESSAGES).toBe('object');
    });

    it('should have all network error messages', () => {
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBe('Erreur réseau - Vérifiez votre connexion');
      expect(ERROR_MESSAGES.NETWORK_TIMEOUT).toBe('La requête a expiré - Essayez à nouveau');
      expect(ERROR_MESSAGES.API_ERROR).toBe('Erreur serveur - Veuillez réessayer plus tard');
      expect(ERROR_MESSAGES.INVALID_RESPONSE).toBe('Réponse invalide du serveur');
    });

    it('should have all authentication error messages', () => {
      expect(ERROR_MESSAGES.AUTH_REQUIRED).toBe('Authentification requise');
      expect(ERROR_MESSAGES.LOGIN_FAILED).toBe('Impossible de se connecter avec ces identifiants');
      expect(ERROR_MESSAGES.SIGNUP_FAILED).toBe('Impossible de créer le compte');
      expect(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS).toBe('Cet email est déjà enregistré');
      expect(ERROR_MESSAGES.INVALID_EMAIL).toBe('Adresse email invalide');
      expect(ERROR_MESSAGES.INVALID_PASSWORD).toBe('Le mot de passe ne respecte pas les critères');
      expect(ERROR_MESSAGES.PASSWORD_MISMATCH).toBe('Les mots de passe ne correspondent pas');
      expect(ERROR_MESSAGES.TOKEN_REFRESH_FAILED).toBe('Impossible de rafraîchir la session');
      expect(ERROR_MESSAGES.SESSION_EXPIRED).toBe('Votre session a expiré - Veuillez vous reconnecter');
    });

    it('should have all SMS/OTP error messages', () => {
      expect(ERROR_MESSAGES.SMS_REQUEST_FAILED).toBe('Impossible d\'envoyer le code SMS');
      expect(ERROR_MESSAGES.INVALID_PHONE).toBe('Numéro de téléphone invalide');
      expect(ERROR_MESSAGES.INVALID_OTP).toBe('Code OTP invalide');
      expect(ERROR_MESSAGES.OTP_EXPIRED).toBe('Le code OTP a expiré - Demandez un nouveau code');
      expect(ERROR_MESSAGES.OTP_TOO_MANY_ATTEMPTS).toBe('Trop de tentatives - Essayez plus tard');
    });

    it('should have all data operation error messages', () => {
      expect(ERROR_MESSAGES.FETCH_FAILED).toBe('Impossible de charger les données');
      expect(ERROR_MESSAGES.SAVE_FAILED).toBe('Impossible d\'enregistrer les modifications');
      expect(ERROR_MESSAGES.DELETE_FAILED).toBe('Impossible de supprimer');
      expect(ERROR_MESSAGES.UPDATE_FAILED).toBe('Impossible de mettre à jour');
    });

    it('should have all analysis error messages', () => {
      expect(ERROR_MESSAGES.ANALYSIS_FAILED).toBe('Impossible d\'analyser le message');
      expect(ERROR_MESSAGES.IMAGE_UPLOAD_FAILED).toBe('Impossible de télécharger l\'image');
      expect(ERROR_MESSAGES.INVALID_IMAGE_FORMAT).toBe('Format d\'image non supporté');
      expect(ERROR_MESSAGES.IMAGE_TOO_LARGE).toBe('L\'image est trop grande (max 5 MB)');
    });

    it('should have all tools error messages', () => {
      expect(ERROR_MESSAGES.EMAIL_CHECK_FAILED).toBe('Impossible de vérifier le courriel');
      expect(ERROR_MESSAGES.ADVISOR_CHECK_FAILED).toBe('Impossible de vérifier le conseiller');
    });

    it('should have all family dashboard error messages', () => {
      expect(ERROR_MESSAGES.FAMILY_LOAD_FAILED).toBe('Impossible de charger les données familiales');
      expect(ERROR_MESSAGES.FAMILY_UPDATE_FAILED).toBe('Impossible de mettre à jour le groupe familial');
    });

    it('should have all quiz error messages', () => {
      expect(ERROR_MESSAGES.QUIZ_LOAD_FAILED).toBe('Impossible de charger le quiz');
      expect(ERROR_MESSAGES.QUIZ_SUBMIT_FAILED).toBe('Impossible d\'enregistrer les résultats du quiz');
    });

    it('should have all profile error messages', () => {
      expect(ERROR_MESSAGES.PROFILE_LOAD_FAILED).toBe('Impossible de charger le profil');
      expect(ERROR_MESSAGES.PROFILE_UPDATE_FAILED).toBe('Impossible de mettre à jour le profil');
      expect(ERROR_MESSAGES.AVATAR_UPDATE_FAILED).toBe('Impossible de mettre à jour l\'avatar');
    });

    it('should have all generic error messages', () => {
      expect(ERROR_MESSAGES.UNKNOWN_ERROR).toBe('Une erreur s\'est produite - Veuillez réessayer');
      expect(ERROR_MESSAGES.SOMETHING_WENT_WRONG).toBe('Un problème est survenu - Veuillez réessayer');
      expect(ERROR_MESSAGES.TRY_AGAIN_LATER).toBe('Veuillez essayer à nouveau plus tard');
    });
  });

  describe('getErrorMessage()', () => {
    it('should return string as-is when error is a string', () => {
      const message = 'Custom error message';
      expect(getErrorMessage(message)).toBe(message);
    });

    it('should return error.message when error is a string', () => {
      const errorMsg = 'Error occurred';
      expect(getErrorMessage(errorMsg)).toBe(errorMsg);
    });

    it('should return error.message when it exists', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should match predefined error messages', () => {
      const error = new Error(ERROR_MESSAGES.NETWORK_ERROR);
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.NETWORK_ERROR);
    });

    it('should return 400 status code as INVALID_RESPONSE', () => {
      const error = { statusCode: 400 };
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.INVALID_RESPONSE);
    });

    it('should return 401 status code as SESSION_EXPIRED', () => {
      const error = { statusCode: 401 };
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.SESSION_EXPIRED);
    });

    it('should return 403 status code as AUTH_REQUIRED', () => {
      const error = { statusCode: 403 };
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.AUTH_REQUIRED);
    });

    it('should return 404 status code as FETCH_FAILED', () => {
      const error = { statusCode: 404 };
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.FETCH_FAILED);
    });

    it('should return 500 status code as API_ERROR', () => {
      const error = { statusCode: 500 };
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.API_ERROR);
    });

    it('should return 502 status code as API_ERROR', () => {
      const error = { statusCode: 502 };
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.API_ERROR);
    });

    it('should return 503 status code as API_ERROR', () => {
      const error = { statusCode: 503 };
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.API_ERROR);
    });

    it('should return API_ERROR for unknown status codes', () => {
      const error = { statusCode: 418 };
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.API_ERROR);
    });

    it('should return UNKNOWN_ERROR when error has no message or statusCode', () => {
      const error = {};
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
    });

    it('should return UNKNOWN_ERROR when error is null', () => {
      expect(getErrorMessage(null)).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
    });

    it('should return UNKNOWN_ERROR when error is undefined', () => {
      expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
    });

    it('should handle objects with message property that includes predefined error', () => {
      const error = { message: `Something went wrong: ${ERROR_MESSAGES.LOGIN_FAILED}` };
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.LOGIN_FAILED);
    });

    it('should prioritize matching predefined messages in error.message', () => {
      const error = { message: ERROR_MESSAGES.SIGNUP_FAILED, statusCode: 400 };
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.SIGNUP_FAILED);
    });
  });
});
