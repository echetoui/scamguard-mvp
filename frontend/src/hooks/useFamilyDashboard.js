/**
 * useFamilyDashboard Hook
 * Phase 5A - Family Protection Dashboard
 *
 * Manages family data fetching and state
 */

import { useState, useEffect } from 'react';
import { getAuthToken, getAuth } from '../utils/authStorage';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export default function useFamilyDashboard() {
  const [familyData, setFamilyData] = useState({
    familyName: '',
    members: [],
    threats: [],
    inviteCode: '',
    currentUserRole: 'senior',
    currentUserEmail: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasFamily, setHasFamily] = useState(false);

  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();

        if (!token) {
          setError('Authentification requise');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/family/dashboard`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            // User doesn't have a family
            setHasFamily(false);
            setFamilyData({
              familyName: '',
              members: [],
              threats: [],
              inviteCode: ''
            });
            setLoading(false);
            return;
          }
          throw new Error(`Erreur ${response.status}`);
        }

        const data = await response.json();
        setFamilyData({
          familyName: data.data?.familyName || 'Ma Famille',
          members: data.data?.members || [],
          threats: data.data?.threats || [],
          inviteCode: data.data?.inviteCode || '',
          currentUserRole: data.data?.currentUserRole || 'senior',
          currentUserEmail: data.data?.currentUserEmail || ''
        });
        setHasFamily(data.data?.members?.length > 0 || !!data.data?.familyName);
        setError('');
      } catch (err) {
        console.error('Family dashboard error:', err);
        setError('Impossible de charger les données familiales');
        setHasFamily(false);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, []);

  return {
    familyData,
    loading,
    error,
    hasFamily
  };
}
