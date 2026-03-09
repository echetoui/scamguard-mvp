/**
 * Error Boundary Component
 * Catches errors in child components and displays fallback UI
 *
 * WCAG AAA compliant error recovery UI for seniors
 */

import React from 'react';
import './ErrorBoundary.css';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for development
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // TODO: Send error to error tracking service (Sentry, etc.)
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="error-boundary-container" role="alert">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>

            <h1 className="error-title">Oups, une erreur s'est produite</h1>

            <p className="error-message">
              Nous regrettons le désagrément. Une erreur inattendue s'est produite dans l'application.
            </p>

            {/* Error details (development only) */}
            {isDevelopment && this.state.error && (
              <details className="error-details">
                <summary>Détails techniques (développement uniquement)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Error count warning */}
            {this.state.errorCount > 2 && (
              <div className="error-warning" role="alert" aria-live="polite">
                ⚠️ Plusieurs erreurs détectées. Un rechargement peut être nécessaire.
              </div>
            )}

            {/* Action buttons */}
            <div className="error-actions">
              <button
                onClick={this.handleReset}
                className="btn-reset"
                aria-label="Essayer de reprendre l'application"
              >
                🔄 Réessayer
              </button>

              <button
                onClick={this.handleReload}
                className="btn-reload"
                aria-label="Recharger la page"
              >
                🔁 Recharger la page
              </button>
            </div>

            {/* Support message */}
            <div className="error-support">
              <p className="support-text">
                Si le problème persiste, veuillez:
              </p>
              <ul className="support-list">
                <li>Vider le cache de votre navigateur</li>
                <li>Fermer et rouvrir ScamGuard</li>
                <li>Contacter notre équipe de support</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
