import React, { useState } from 'react';
import RiskScore from './RiskScore';
import ThreatCard from './ThreatCard';
import SMSMessage from './SMSMessage';
import QuizCard from './QuizCard';
import './DesignSystemDemo.css';

export default function DesignSystemDemo() {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [demoStatus, setDemoStatus] = useState('');

  const quizOptions = [
    { id: 'a', text: 'C’est clairement un courriel d’hameçonnage', correct: true },
    { id: 'b', text: 'Cela semble légitime, je peux cliquer', correct: false },
    { id: 'c', text: 'J’ai besoin de plus d’informations pour décider', correct: false }
  ];

  const handleQuizAnswer = (questionId, id, correct) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: { id, correct }
    }));
  };

  const showDemoStatus = (message) => {
    setDemoStatus(message);
  };

  return (
    <div className="design-system-demo">
      {/* Header */}
      <header className="demo-header">
        <h1>🎨 Système de design ScamGuard</h1>
        <p>Composants Material Design 3 synchronisés avec Figma</p>
      </header>

      {/* Risk Score Section */}
      <section className="demo-section">
        <h2>Score de risque</h2>
        <p className="demo-description">Évaluation visuelle du risque avec gravité codée par couleur</p>
        
        <div className="demo-grid">
          <div className="demo-item">
            <h3>Niveau sûr</h3>
            <RiskScore level="safe" score={15} label="Connexion bancaire" animated={true} />
          </div>
          
          <div className="demo-item">
            <h3>Niveau modéré</h3>
            <RiskScore level="moderate" score={55} label="Expéditeur inconnu" animated={true} />
          </div>
          
          <div className="demo-item">
            <h3>Niveau dangereux</h3>
            <RiskScore level="danger" score={92} label="Lien d’hameçonnage" animated={true} />
          </div>
        </div>
      </section>

      {/* Threat Card Section */}
      <section className="demo-section">
        <h2>Carte de menace</h2>
        <p className="demo-description">Affiche une menace avec un style adapté à sa gravité</p>
        
        <div className="demo-grid">
          <ThreatCard
            severity="low"
            title="Tentative de connexion inhabituelle"
            description="Connexion détectée depuis un lieu ou un appareil inconnu."
            icon="📍"
            onAction={() => showDemoStatus('Détails ouverts : connexion inhabituelle')}
          />
          
          <ThreatCard
            severity="medium"
            title="Courriel suspect"
            description="Le courriel contient des signes d’hameçonnage et des liens suspects."
            icon="📧"
            onAction={() => showDemoStatus('Détails ouverts : courriel suspect')}
          />
          
          <ThreatCard
            severity="danger"
            title="Logiciel malveillant confirmé"
            description="Le fichier contient une signature malveillante connue. Ne l’ouvrez pas."
            icon="⚠️"
            onAction={() => showDemoStatus('Détails ouverts : logiciel malveillant')}
          />
        </div>
      </section>

      {/* SMS Message Section */}
      <section className="demo-section">
        <h2>Message SMS</h2>
        <p className="demo-description">Affichage d’un verdict SMS avec arrière-plan codé par couleur</p>
        
        <div className="demo-grid">
          <SMSMessage
            verdict="scam"
            message="Vérifiez votre compte : bit.ly/verify123 Cliquez maintenant ou vous perdrez l’accès."
            sender="+1 234 567 890"
            onReport={() => showDemoStatus('Signalement envoyé : SMS frauduleux')}
          />
          
          <SMSMessage
            verdict="legitimate"
            message="Votre rendez-vous avec le Dr Smith est confirmé demain à 14 h."
            sender="Clinique du Dr Smith"
            onReport={() => showDemoStatus('Signalement envoyé : SMS légitime')}
          />
          
          <SMSMessage
            verdict="suspicious"
            message="Confirmez vos informations de paiement pour vérifier votre compte."
            sender="Support bancaire"
            onReport={() => showDemoStatus('Signalement envoyé : SMS suspect')}
          />
        </div>
      </section>

      <div className="demo-status" role="status" aria-live="polite">
        {demoStatus}
      </div>

      {/* Quiz Card Section */}
      <section className="demo-section">
        <h2>Carte de quiz</h2>
        <p className="demo-description">Question interactive avec validation de la réponse</p>
        
        <div className="demo-quiz">
          <QuizCard
            question="Lequel de ces courriels est une tentative d’hameçonnage ?"
            options={quizOptions}
            onAnswer={(id, correct) => handleQuizAnswer('q1', id, correct)}
            category="Sécurité courriel"
            number={1}
          />
          
          <div className="quiz-feedback">
            {quizAnswers.q1 && (
              <div className={`feedback ${quizAnswers.q1.correct ? 'correct' : 'incorrect'}`}>
                {quizAnswers.q1.correct 
                  ? '✅ Correct ! Les courriels d’hameçonnage créent souvent un sentiment d’urgence.'
                  : '❌ Incorrect. Réessayez.'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="demo-section features">
        <h2>Fonctionnalités du système de design</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">♿</span>
            <h3>WCAG AAA</h3>
            <p>Contrastes élevés et composants pensés pour l’accessibilité</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">📱</span>
            <h3>Adaptatif</h3>
            <p>Fonctionne sur mobile, tablette et ordinateur</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">🎨</span>
            <h3>Material Design 3</h3>
            <p>Couleurs, tokens et typographie alignés sur Figma</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">✨</span>
            <h3>Animations</h3>
            <p>Transitions avec prise en charge du mouvement réduit</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">🌓</span>
            <h3>Mode sombre</h3>
            <p>Palette adaptée aux interfaces sombres</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Prêt pour production</h3>
            <p>Composants couverts par des tests unitaires ciblés</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="demo-footer">
        <p>Tous les composants suivent les lignes directrices MD3 et les couleurs ScamGuard.</p>
        <p>Primaire : #005FAF | Secondaire : #1B6B3A | Erreur : #BA1A1A</p>
      </footer>
    </div>
  );
}
