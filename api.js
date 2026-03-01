const LAMBDA_URL = process.env.REACT_APP_LAMBDA_URL;

if (!LAMBDA_URL) {
  console.error("⚠️ Configuration manquante: REACT_APP_LAMBDA_URL n'est pas défini. Vérifiez votre fichier .env");
}

// Helper pour construire les en-têtes avec le token d'authentification
const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const userStr = localStorage.getItem('scamguard_user');
  if (userStr) {
    try {
      const userData = JSON.parse(userStr);
      // Récupère le token depuis la structure de réponse (data.id_token ou racine)
      const token = userData.data?.id_token || userData.id_token || userData.access_token;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Erreur lecture token", e);
    }
  }
  return headers;
};

// Fonction pour rafraîchir le token
const refreshToken = async () => {
  const userStr = localStorage.getItem('scamguard_user');
  if (!userStr) return null;

  try {
    const userData = JSON.parse(userStr);
    // Le refresh token est souvent stocké à la racine ou dans data
    const refreshToken = userData.data?.refresh_token || userData.refresh_token;
    const email = userData.data?.user?.email || userData.user?.email || userData.email;

    if (!refreshToken || !email) return null;

    const response = await fetch(`${LAMBDA_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, refresh_token: refreshToken })
    });

    if (!response.ok) return null;

    const newData = await response.json();
    
    // Mise à jour du localStorage avec les nouveaux tokens
    // On fusionne avec les données existantes pour ne pas perdre les infos utilisateur
    const updatedUser = {
      ...userData,
      data: {
        ...userData.data,
        ...newData.data // Suppose que l'API renvoie { data: { id_token, access_token, ... } }
      }
    };
    
    // Si la structure est plate, on adapte
    if (newData.id_token) {
      updatedUser.id_token = newData.id_token;
      updatedUser.access_token = newData.access_token;
    }

    localStorage.setItem('scamguard_user', JSON.stringify(updatedUser));
    return newData.data?.id_token || newData.id_token;
  } catch (e) {
    console.error("Erreur refresh token", e);
    return null;
  }
};

/**
 * Service centralisé pour les appels API vers AWS Lambda
 */
export const apiService = {
  /**
   * Génère un nouveau scénario d'entraînement
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {Promise<Object>} - Le scénario généré
   */
  generateScenario: async (userId) => {
    try {
      let response = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: getAuthHeaders(), // Utilisation des headers avec token
        body: JSON.stringify({
          action: 'generate_scenario',
          userId
        })
      });

      // Gestion automatique du refresh token (401)
      if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          // Réessayer la requête avec le nouveau token
          response = await fetch(LAMBDA_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'generate_scenario', userId })
          });
        }
      }
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la génération du scénario:", error);
      throw error;
    }
  },

  /**
   * Analyse une réponse utilisateur ou une image
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {Object} scenario - Le scénario en cours (optionnel)
   * @param {string} userResponse - La réponse textuelle de l'utilisateur
   * @param {string} imageBase64 - L'image en base64 (optionnel)
   * @returns {Promise<Object>} - Le résultat de l'analyse
   */
  analyzeMessage: async (userId, scenario, userResponse, imageBase64) => {
    try {
      let response = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: getAuthHeaders(), // Utilisation des headers avec token
        body: JSON.stringify({
          action: 'analyze',
          userId,
          scenario,
          userResponse,
          imageBase64
        })
      });

      // Gestion automatique du refresh token (401)
      if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          // Réessayer la requête avec le nouveau token
          response = await fetch(LAMBDA_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              action: 'analyze',
              userId,
              scenario,
              userResponse,
              imageBase64
            })
          });
        }
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error);
      throw error;
    }
  },

  /**
   * Inscription d'un nouvel utilisateur
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  signup: async (email, password) => {
    try {
      const response = await fetch(`${LAMBDA_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${response.status}: Impossible de créer le compte`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      throw error;
    }
  },

  /**
   * Vérification du code reçu par email
   * @param {string} email
   * @param {string} code
   * @returns {Promise<Object>}
   */
  verify: async (email, code) => {
    try {
      const response = await fetch(`${LAMBDA_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code })
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${response.status}: Code invalide`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      throw error;
    }
  },

  /**
   * Connexion utilisateur
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  login: async (email, password) => {
    try {
      const response = await fetch(`${LAMBDA_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${response.status}: Échec de connexion`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      throw error;
    }
  }
};