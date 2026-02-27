/**
 * CreditSystem Component
 * Phase 4.0.4 - Credit management and subscription display
 *
 * Displays credit balance, subscription tiers, earning methods, and transaction history
 */

import React from 'react';
import '../styles/CreditSystem.css';

const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    icon: '🆓',
    monthlyCredits: 50,
    monthlyPrice: '0 €',
    monthlyPriceUSD: '0 $',
    features: ['3 analyses/jour', 'Quiz illimitée', 'Historique basique']
  },
  {
    id: 'starter',
    name: 'Starter',
    icon: '⭐',
    monthlyCredits: 200,
    monthlyPrice: '9,99 €',
    monthlyPriceUSD: '$9.99/mo',
    features: ['Analyses illimitées', 'Rapports détaillés', 'Exportation données', 'Priorité support'],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: '🏆',
    monthlyCredits: null,
    monthlyPrice: '24,99 €',
    monthlyPriceUSD: '$24.99/mo',
    features: ['Illimité tout', 'IA avancée', 'Alertes temps réel', 'Accès API'],
    popular: false
  }
];

const EARN_METHODS = [
  { icon: '🔍', label: 'Analyser un message', amount: '+10 cr' },
  { icon: '🎓', label: 'Réussir un quiz', amount: '+20 cr' },
  { icon: '📅', label: 'Connexion quotidienne', amount: '+5 cr' },
  { icon: '👥', label: 'Parrainer un ami', amount: '+100 cr' }
];

export default function CreditSystem({ balance = 0, transactions = [], stats = {}, formatTimeAgo }) {
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="credit-system">
      {/* Hero: Balance Display */}
      <div className="credit-hero">
        <h2 className="credit-title">💳 Mes Crédits</h2>
        <div className="credit-balance-display">
          <div className="credit-amount">⭐ {balance}</div>
          <div className="credit-label">crédits disponibles</div>
        </div>
        <div className="credit-summary">
          <span>Total gagné: {stats.totalEarned || 0}</span>
          <span className="separator">•</span>
          <span>Dépensé: {stats.totalSpent || 0}</span>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="plans-section">
        <h3 className="section-title">📋 Plans d'abonnement</h3>
        <div className="plans-grid">
          {SUBSCRIPTION_PLANS.map(plan => (
            <div
              key={plan.id}
              className={`plan-card ${plan.id === 'free' ? 'current' : ''} ${plan.popular ? 'popular' : ''}`}
            >
              <div className="plan-header">
                <span className="plan-icon">{plan.icon}</span>
                <h4 className="plan-name">{plan.name}</h4>
              </div>

              <div className="plan-price">
                <div className="price-amount">{plan.monthlyPrice}</div>
                <div className="price-label">/mois</div>
              </div>

              <div className="plan-credits">
                {plan.monthlyCredits
                  ? `${plan.monthlyCredits} crédits/mois`
                  : 'Illimité'}
              </div>

              <div className="plan-features">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="plan-feature">
                    <span className="checkmark">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`plan-button ${plan.id === 'free' ? 'current-plan' : ''}`}
                disabled={plan.id === 'free'}
              >
                {plan.id === 'free' ? 'Plan actuel' : 'Choisir'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* How to Earn */}
      <div className="earn-section">
        <h3 className="section-title">🎯 Comment gagner des crédits?</h3>
        <div className="earn-list">
          {EARN_METHODS.map((method, idx) => (
            <div key={idx} className="earn-item">
              <span className="earn-icon">{method.icon}</span>
              <span className="earn-label">{method.label}</span>
              <span className="earn-amount">{method.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      {recentTransactions.length > 0 && (
        <div className="history-section">
          <h3 className="section-title">📋 Historique transactions</h3>
          <div className="transaction-list">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div className="transaction-icon">
                  {tx.type === 'earn' ? (
                    <span className="earn-badge">+</span>
                  ) : (
                    <span className="spend-badge">−</span>
                  )}
                </div>
                <div className="transaction-content">
                  <div className="transaction-description">{tx.description}</div>
                  <div className="transaction-time">
                    {formatTimeAgo ? formatTimeAgo(tx.timestamp) : new Date(tx.timestamp).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className={`transaction-amount ${tx.type}`}>
                  {tx.type === 'earn' ? '+' : '−'}{tx.amount} cr
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentTransactions.length === 0 && (
        <div className="empty-state">
          <p>📭 Aucune transaction yet</p>
          <p className="empty-hint">Complétez une analyse pour gagner vos premiers crédits!</p>
        </div>
      )}
    </div>
  );
}
