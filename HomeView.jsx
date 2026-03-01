import React from 'react';
import Button from '../../Button';
import Card from '../../Card';

const HomeView = ({ onStartScenario, onStartDetection }) => {
  return (
    <div className="home-view fade-in">
      <Card>
        <p className="welcome-sub">Bonjour,</p>
        <h2 className="welcome-title">Prêt à vous protéger ?</h2>
      </Card>

      <Card variant="info" className="tip-card">
        <span className="tip-icon" role="img" aria-hidden="true">💡</span>
        <p><strong>Conseil du jour :</strong> Ne donnez jamais votre mot de passe par téléphone, même à votre banque.</p>
      </Card>
      
      <Button onClick={onStartScenario} icon="🎯" variant="primary">
        M'entraîner avec un faux scénario
      </Button>
      
      <div style={{ height: '16px' }}></div>

      <Button onClick={onStartDetection} icon="📸" variant="secondary">
        Analyser un message suspect reçu
      </Button>
    </div>
  );
};

export default HomeView;