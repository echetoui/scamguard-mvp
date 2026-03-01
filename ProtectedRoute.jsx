import React from 'react';
import AuthScreen from './AuthScreen';
import LoadingSpinner from './LoadingSpinner';

/**
 * Composant de protection de route.
 * Affiche l'écran de connexion si l'utilisateur n'est pas authentifié.
 */
const ProtectedRoute = ({ user, isLoading, onLogin, children }) => {
  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (!user) {
    return (
      <div className="container">
        <header className="app-header">
          <div className="logo-area">
            <h1>🛡️ ScamGuard</h1>
          </div>
        </header>
        <AuthScreen onLoginSuccess={onLogin} />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;