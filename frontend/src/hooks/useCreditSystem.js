/**
 * useCreditSystem Hook
 * Phase 4.0.4 - Credit system management
 *
 * Manages credit balance, transactions, and subscription state with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'scamguard_credits';

const generateId = () => `credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function useCreditSystem() {
  const [data, setData] = useState({
    balance: 50,
    totalEarned: 50,
    totalSpent: 0,
    transactions: [
      {
        id: generateId(),
        timestamp: Date.now(),
        type: 'earn',
        amount: 50,
        source: 'welcome',
        description: 'Crédits bienvenue'
      }
    ]
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setData(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading credit system:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist to localStorage on change (guarded by isLoading)
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error('Error saving credit system:', error);
      }
    }
  }, [data, isLoading]);

  /**
   * Earn credits - adds a transaction and updates balance
   */
  const earnCredits = useCallback((amount, source, description) => {
    setData(prev => ({
      ...prev,
      balance: prev.balance + amount,
      totalEarned: prev.totalEarned + amount,
      transactions: [
        {
          id: generateId(),
          timestamp: Date.now(),
          type: 'earn',
          amount,
          source,
          description
        },
        ...prev.transactions
      ]
    }));
  }, []);

  /**
   * Spend credits - validates balance and creates transaction
   * Returns true if successful, false if insufficient balance
   */
  const spendCredits = useCallback((amount, description) => {
    if (data.balance < amount) {
      console.warn(`Insufficient credits: need ${amount}, have ${data.balance}`);
      return false;
    }

    setData(prev => ({
      ...prev,
      balance: prev.balance - amount,
      totalSpent: prev.totalSpent + amount,
      transactions: [
        {
          id: generateId(),
          timestamp: Date.now(),
          type: 'spend',
          amount,
          source: 'usage',
          description
        },
        ...prev.transactions
      ]
    }));

    return true;
  }, [data.balance]);

  /**
   * Get current balance
   */
  const getBalance = useCallback(() => data.balance, [data.balance]);

  /**
   * Get transactions sorted by timestamp descending
   */
  const getTransactions = useCallback(() => {
    return [...data.transactions].sort((a, b) => b.timestamp - a.timestamp);
  }, [data.transactions]);

  /**
   * Get credit statistics
   */
  const getStats = useCallback(() => ({
    balance: data.balance,
    totalEarned: data.totalEarned,
    totalSpent: data.totalSpent,
    transactionCount: data.transactions.length,
    lastTransaction: data.transactions[0] || null
  }), [data]);

  /**
   * Reset all credits (clears localStorage)
   */
  const resetCredits = useCallback(() => {
    setData({
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      transactions: []
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Format timestamp to relative time string
   */
  const formatTimeAgo = useCallback((timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes}m`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days}j`;

    return new Date(timestamp).toLocaleDateString('fr-FR');
  }, []);

  return {
    balance: data.balance,
    transactions: data.transactions,
    isLoading,
    earnCredits,
    spendCredits,
    getBalance,
    getTransactions,
    getStats,
    resetCredits,
    formatTimeAgo
  };
}
