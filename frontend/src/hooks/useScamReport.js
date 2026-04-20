import { useState, useCallback } from 'react';
import { getAuthToken } from '../utils/authStorage';

/**
 * Hook pour gérer l'envoi des signalements d'arnaques vers le backend API.
 *
 * Fonctionnalités :
 * - Soumission asynchrone avec FormData multipart
 * - Gestion d'erreurs avec retry automatique (max 3 tentatives)
 * - État loading/error/success
 * - Persistance localStorage du brouillon
 * - Nettoyage des object URLs
 */
export default function useScamReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [reportId, setReportId] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
  const DRAFT_KEY = 'scamReportDraft';
  const MAX_RETRIES = 3;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Messages d'erreur localisés
  const getErrorMessage = (status, errorData) => {
    const messages = {
      400: errorData?.message || 'Données invalides. Veuillez vérifier vos informations.',
      401: 'Session expirée. Veuillez vous reconnecter.',
      413: 'Le fichier dépasse la limite de 5MB.',
      429: 'Trop de signalements. Veuillez réessayer plus tard.',
      500: 'Erreur serveur. Veuillez réessayer dans quelques instants.',
      network: 'Erreur réseau. Tentative de reconnexion...'
    };
    return messages[status] || messages[500];
  };

  // Charge le brouillon depuis localStorage
  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch (e) {
      console.warn('Erreur lors du chargement du brouillon:', e);
      return null;
    }
  }, []);

  // Sauvegarde le brouillon dans localStorage
  const saveDraft = useCallback((formData) => {
    try {
      const draftData = {
        scamType: formData.scamType,
        description: formData.description,
        screenshotName: formData.screenshotName,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    } catch (e) {
      console.warn('Erreur lors de la sauvegarde du brouillon:', e);
    }
  }, []);

  // Nettoie le brouillon après envoi réussi
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      console.warn('Erreur lors de la suppression du brouillon:', e);
    }
  }, []);

  // Construit FormData avec gestion du fichier
  const buildFormData = (reportData) => {
    const formData = new FormData();
    formData.append('scamType', reportData.scamType);
    formData.append('description', reportData.description || '');

    if (reportData.rawFile) {
      if (reportData.rawFile.size > MAX_FILE_SIZE) {
        throw new Error('Le fichier dépasse la limite de 5MB.');
      }
      formData.append('file', reportData.rawFile);
    }

    return formData;
  };

  // Détermine le type d'erreur et si une retry est appropriée
  const parseErrorResponse = async (response) => {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // JSON parsing failed, use status code only
    }

    return {
      status: response.status,
      data: errorData,
      shouldRetry: response.status >= 500 // Only retry on server errors (5xx)
    };
  };

  // Effectue une requête avec retry automatique
  const submitWithRetry = async (formDataObj, authToken, attemptCount = 1) => {
    try {
      // Rebuild FormData for each retry (FormData can only be read once)
      let body = formDataObj;
      if (attemptCount > 1) {
        body = buildFormData(formDataObj._original || formDataObj);
      } else {
        formDataObj._original = {
          scamType: formDataObj.get('scamType'),
          description: formDataObj.get('description'),
          rawFile: formDataObj.get('file')
        };
      }

      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body
      });

      const errorInfo = await parseErrorResponse(response);

      if (!response.ok) {
        // Determine if retry is appropriate (only on 5xx errors)
        const isServerError = response.status >= 500;

        // Retry logic - only for server errors
        if (isServerError && attemptCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, attemptCount - 1) * 1000;
          console.log(`Retry ${attemptCount}/${MAX_RETRIES} dans ${delayMs}ms`);

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delayMs));

          return submitWithRetry(formDataObj, authToken, attemptCount + 1);
        }

        // No retry for client errors (4xx)
        const message = getErrorMessage(errorInfo.status, errorInfo.data);

        // Handle 401 Unauthorized
        if (errorInfo.status === 401) {
          localStorage.removeItem('authToken');
        }

        throw new Error(message);
      }

      const data = await response.json();
      return {
        success: true,
        reportId: data.reportId || data.id,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      throw err;
    }
  };

  // Nettoie les object URLs
  const revokeObjectUrls = useCallback((urls) => {
    if (Array.isArray(urls)) {
      urls.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn('Erreur lors de la révocation de l\'URL:', e);
        }
      });
    }
  }, []);

  // Soumet le signalement
  const submitReport = useCallback(async (reportData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setReportId(null);

    const objectUrls = [];

    try {
      // Validation et authentification
      if (!reportData.scamType) {
        throw new Error('Type de signalement requis.');
      }

      const token = getAuthToken();
      if (!token) {
        throw new Error('Vous devez être connecté pour signaler une arnaque.');
      }

      // Sauvegarde le brouillon
      saveDraft(reportData);

      // Crée l'objet URL du fichier si présent (pour cleanup)
      if (reportData.rawFile && reportData.screenshot) {
        objectUrls.push(reportData.screenshot);
      }

      // Construit FormData
      const formData = buildFormData(reportData);

      // Soumet avec retry
      const result = await submitWithRetry(formData, token);

      // Succès
      setSuccess(true);
      setReportId(result.reportId);
      clearDraft();
      setIsLoading(false);

      return {
        success: true,
        reportId: result.reportId,
        timestamp: result.timestamp
      };
    } catch (err) {
      const errorMessage = err.message || 'Une erreur inattendue s\'est produite.';
      setError(errorMessage);
      setIsLoading(false);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      // Cleanup object URLs
      revokeObjectUrls(objectUrls);
    }
  }, [saveDraft, clearDraft, revokeObjectUrls]);

  return {
    submitReport,
    isLoading,
    error,
    success,
    reportId,
    loadDraft,
    saveDraft,
    clearDraft
  };
}