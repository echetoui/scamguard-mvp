import React from 'react';
import Button from '../../Button';
import Card from '../../Card';
import { LIMITS } from '../../constants';

const ResultView = ({ result, onHome }) => {
  return (
    <Card title="Résultat de l'analyse" className="fade-in">
      <div className={`score-circle score-${result.detection.score > LIMITS.SCORE_THRESHOLD ? 'good' : 'bad'}`}>
        {result.detection.score}/100
      </div>
      
      <div className="feedback-box">
        {result.coaching.feedback}
      </div>
      
      <div className="xp-badge">
        🎖️ +{result.coaching.xp_earned} XP gagnés
      </div>
      
      <Button onClick={onHome} variant="primary">
        🏠 Retour à l'accueil
      </Button>
    </Card>
  );
};

export default ResultView;