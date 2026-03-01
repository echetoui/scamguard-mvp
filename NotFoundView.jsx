import React from 'react';
import Card from '../../Card';
import Button from '../../Button';

const NotFoundView = ({ onHome }) => {
  return (
    <div className="fade-in">
      <Card title="Page introuvable" variant="alert">
        <div className="text-center" style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }} role="img" aria-label="Visage confus">
            😕
          </div>
          <p><strong>Oups !</strong></p>
          <p>Nous ne trouvons pas la page que vous cherchez.</p>
          <p>Ne vous inquiétez pas, vous pouvez revenir au début.</p>
        </div>
        
        <Button onClick={onHome} variant="primary" icon="🏠">
          Retour à l'accueil
        </Button>
      </Card>
    </div>
  );
};

export default NotFoundView;