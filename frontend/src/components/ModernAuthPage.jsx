/**
 * ModernAuthPage - Professional Landing & Auth Page
 * Modern UX/UI standards with hero section and authentication
 */

import React, { useState, useRef } from 'react';
import './ModernAuthPage.css';
import SMSAuthScreen from './SMSAuthScreen';
// import SSOLogin from './SSOLogin'; // TODO: Implement SSO features

export default function ModernAuthPage() {
  const [showAuth, setShowAuth] = useState(false);
  const featuresRef = useRef(null);

  const handleLearnMore = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (showAuth) {
    return <SMSAuthScreen />;
  }

  return (
    <div className="modern-auth-page">
      {/* Navigation */}
      <nav className="auth-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="brand-icon">🛡️</span>
            <span className="brand-name">ScamGuard</span>
          </div>
          <div className="navbar-actions">
            <button
              className="navbar-btn navbar-btn-secondary"
              onClick={() => setShowAuth(true)}
              aria-label="Accéder à la page de connexion ou créer un compte"
            >
              Se connecter
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">🚀 Nouvelle génération de sécurité</div>

            <h1 className="hero-title">
              Protégez-vous contre les <span className="gradient-text">arnaques</span>
            </h1>

            <p className="hero-subtitle">
              ScamGuard utilise l'intelligence artificielle pour détecter et bloquer les tentatives d'arnaque en temps réel. Restez en sécurité avec nos experts en cybersécurité.
            </p>

            <div className="hero-cta">
              <button
                className="cta-primary"
                onClick={() => setShowAuth(true)}
                aria-label="Commencer maintenant avec ScamGuard - créer un compte ou se connecter"
              >
                Commencer maintenant
                <span className="cta-arrow" aria-hidden="true">→</span>
              </button>
              <button
                className="cta-secondary"
                onClick={handleLearnMore}
                aria-label="En savoir plus sur ScamGuard et ses fonctionnalités de protection"
              >
                <span aria-hidden="true">ℹ️</span> En savoir plus
              </button>
            </div>

            {/* SSO Login Options */}
            {/* <SSOLogin isLoading={false} /> */}
            {/* TODO: Implement SSO features */}

            {/* Trust badges */}
            <div className="trust-badges">
              <div className="badge">
                <span className="badge-icon">✅</span>
                <span>100% Sécurisé</span>
              </div>
              <div className="badge">
                <span className="badge-icon">🔐</span>
                <span>Chiffrement SSL</span>
              </div>
              <div className="badge">
                <span className="badge-icon">⚡</span>
                <span>Detection Temps Réel</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card shield-card">
              <div className="card-icon">🛡️</div>
              <h3>Protection Active</h3>
              <p>Scannez les messages suspects</p>
            </div>
            <div className="visual-card ai-card">
              <div className="card-icon">🤖</div>
              <h3>IA Intelligente</h3>
              <p>Apprentissage automatique avancé</p>
            </div>
            <div className="visual-card check-card">
              <div className="card-icon">✓</div>
              <h3>Résultats Instantanés</h3>
              <p>Détection en moins d'une seconde</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" ref={featuresRef}>
        <div className="features-container">
          <h2 className="section-title">Pourquoi choisir ScamGuard?</h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Détection Avancée</h3>
              <p>Nos algorithmes IA analysent les patterns de fraude connus et émergents.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Multi-Canal</h3>
              <p>Protégez-vous sur SMS, Email, Appels et Messages instantanés.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Rapports Détaillés</h3>
              <p>Accédez à vos historiques d'analyse et statistiques de protection.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>Formation Continue</h3>
              <p>Apprenez à identifier les arnaques avec nos ressources éducatives.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Support Mondial</h3>
              <p>Interface en français, support pour Québec et Canada.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>Facile à Utiliser</h3>
              <p>Interface simple et intuitive, optimisée pour les seniors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat">
            <h3 className="stat-number">50K+</h3>
            <p className="stat-label">Utilisateurs Protégés</p>
          </div>
          <div className="stat">
            <h3 className="stat-number">1M+</h3>
            <p className="stat-label">Arnaques Bloquées</p>
          </div>
          <div className="stat">
            <h3 className="stat-number">99.9%</h3>
            <p className="stat-label">Taux de Détection</p>
          </div>
          <div className="stat">
            <h3 className="stat-number">24/7</h3>
            <p className="stat-label">Protection Active</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta-section">
        <div className="final-cta-container">
          <h2>Prêt à vous protéger?</h2>
          <p>Créez votre compte gratuit et commencez à analyser les messages suspects en quelques secondes.</p>
          <button
            className="cta-primary cta-large"
            onClick={() => setShowAuth(true)}
          >
            Créer un Compte Gratuit
            <span className="cta-arrow">→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="auth-footer-section">
        <div className="footer-container">
          <div className="footer-col">
            <h4>ScamGuard</h4>
            <p>Protégez-vous contre les arnaques avec l'IA.</p>
          </div>
          <div className="footer-col">
            <h4>Ressources</h4>
            <ul>
              <li><a href="#about">À Propos</a></li>
              <li><a href="#guides">Guides</a></li>
              <li><a href="#blog">Blog</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Légal</h4>
            <ul>
              <li><a href="#privacy">Confidentialité</a></li>
              <li><a href="#terms">Conditions</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 ScamGuard. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
