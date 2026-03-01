import React from 'react';
import Card from '../Card';
import Button from '../Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher l'interface de repli
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Vous pouvez aussi enregistrer l'erreur dans un service de rapport d'erreurs
    console.error("Erreur d'interface capturée:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ paddingTop: '40px' }}>
          <Card title="Une erreur est survenue" variant="alert">
            <p>L'application a rencontré un problème inattendu.</p>
            <p>Nous vous invitons à recharger la page pour continuer.</p>
            <Button onClick={this.handleReload} variant="primary" icon="🔄">
              Recharger l'application
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;