import { useState } from 'react';
import { getAuthToken } from '../utils/authStorage';

/**
 * Hook pour gérer l'envoi des signalements d'arnaques vers le backend API.
 */
export default function useScamReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

  // Convertir le fichier en Base64 pour l'envoi via JSON (Standard AWS Lambda)
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const submitReport = async (reportData) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Vous devez être connecté pour signaler une arnaque.");
      }

      let base64Image = null;
      if (reportData.rawFile) {
        base64Image = await convertFileToBase64(reportData.rawFile);
      }

      const payload = {
        scamType: reportData.scamType,
        description: reportData.description,
        image: base64Image,
        fileName: reportData.screenshotName
      };

      const response = await fetch(`${API_URL}/scam-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error?.message || 'Erreur lors de l\'envoi du signalement.');
      }

      setIsLoading(false);
      return { success: true, data };
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Une erreur inattendue s'est produite lors du signalement.");
      return { success: false, error: err.message };
    }
  };

  return { submitReport, isLoading, error };
}