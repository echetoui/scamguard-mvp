import { useState } from 'react';
import { getAuthToken } from '../utils/authStorage';

/**
 * Hook pour gérer l'envoi des signalements d'arnaques vers le backend API.
 *
 * Features:
 * - Input validation (scamType required, file size ≤5MB)
 * - FormData submission when rawFile present, JSON otherwise
 * - Retry logic: up to 3 attempts for 5xx errors, no retry for 4xx
 * - 401 handling: clears localStorage authToken
 * - Draft persistence via localStorage (key: scamReportDraft)
 * - success / reportId state exposed directly on hook result
 * - URL.revokeObjectURL cleanup for blob screenshot URLs
 */

const DRAFT_KEY = 'scamReportDraft';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_RETRIES = 3;
const NO_RETRY_STATUSES = new Set([400, 401, 403, 413, 422, 429]);

export default function useScamReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [reportId, setReportId] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

  // -------------------------------------------------------------------------
  // Draft management
  // -------------------------------------------------------------------------

  const saveDraft = (data) => {
    try {
      const draft = { ...data, timestamp: new Date().toISOString() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // localStorage unavailable — silently ignore
    }
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // silently ignore
    }
  };

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  const buildPayload = (reportData) => {
    if (reportData.rawFile) {
      const fd = new FormData();
      fd.append('scamType', reportData.scamType);
      fd.append('description', reportData.description);
      fd.append('file', reportData.rawFile);
      if (reportData.screenshotName) {
        fd.append('fileName', reportData.screenshotName);
      }
      return { body: fd, headers: {} };
    }

    const payload = {
      scamType: reportData.scamType,
      description: reportData.description,
      fileName: reportData.screenshotName || undefined,
    };
    return {
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    };
  };

  const attemptFetch = async (token, reportData) => {
    const { body, headers: extraHeaders } = buildPayload(reportData);

    const response = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...extraHeaders,
      },
      body,
    });

    return response;
  };

  // -------------------------------------------------------------------------
  // Main submit
  // -------------------------------------------------------------------------

  const submitReport = async (reportData) => {
    // Reset state
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setReportId(null);

    try {
      // --- Validation ---
      if (!reportData.scamType) {
        throw Object.assign(new Error('Type de signalement requis.'), { noRetry: true, clientError: true });
      }

      if (reportData.rawFile && reportData.rawFile.size > MAX_FILE_SIZE) {
        throw Object.assign(new Error('Le fichier dépasse la limite de 5MB.'), { noRetry: true, clientError: true });
      }

      const token = getAuthToken();
      if (!token) {
        throw Object.assign(
          new Error('Vous devez être connecté pour signaler une arnaque.'),
          { noRetry: true, clientError: true }
        );
      }

      // --- Retry loop ---
      let lastError = null;
      let attempt = 0;

      while (attempt < MAX_RETRIES) {
        attempt++;
        const response = await attemptFetch(token, reportData);

        if (response.ok) {
          const data = await response.json();
          const id = data.reportId || data.id || null;

          // Cleanup
          clearDraft();
          if (reportData.screenshot && reportData.screenshot.startsWith('blob:')) {
            URL.revokeObjectURL(reportData.screenshot);
          }

          setSuccess(true);
          setReportId(id);
          setIsLoading(false);

          return { success: true, reportId: id, data };
        }

        // Non-ok response
        if (response.status === 401) {
          localStorage.removeItem('authToken');
        }

        const shouldRetry = !NO_RETRY_STATUSES.has(response.status);

        let errMsg;
        try {
          const errData = await response.json();
          errMsg = errData.message || errData.error?.message || `Erreur ${response.status}`;
        } catch {
          errMsg = `Erreur ${response.status}`;
        }

        lastError = Object.assign(new Error(errMsg), { status: response.status });

        if (!shouldRetry) {
          break;
        }

        // If we've exhausted retries, stop
        if (attempt >= MAX_RETRIES) {
          break;
        }
      }

      throw lastError;
    } catch (err) {
      setIsLoading(false);
      setSuccess(false);
      const message = err.message || "Une erreur inattendue s'est produite lors du signalement.";
      setError(message);
      return { success: false, error: message };
    }
  };

  return {
    submitReport,
    isLoading,
    error,
    success,
    reportId,
    saveDraft,
    loadDraft,
    clearDraft,
  };
}
