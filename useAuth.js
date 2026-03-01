import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté au chargement
    const storedUser = localStorage.getItem('scamguard_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Erreur parsing utilisateur", error);
        localStorage.removeItem('scamguard_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('scamguard_user', JSON.stringify(userData));
    // Synchronisation avec l'ID utilisé par le reste de l'app (pour l'historique et l'API)
    // Gestion de la structure imbriquée { data: { user: { sub: ... } } } ou plate
    const userObj = userData.data?.user || userData.user || userData;
    const userId = userObj.sub || userObj.id || userObj.user_id || userObj.email;
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('scamguard_user');
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
  }, []);

  return { user, isLoading, login, logout };
};