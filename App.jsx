import { useState, useEffect, useRef } from 'react';
import './App.css';

const LAMBDA_URL = process.env.REACT_APP_LAMBDA_URL;

export default function App() {
  const [view, setView] = useState('home');
  const [scenario, setScenario] = useState(null);
  const [response, setResponse] = useState('');
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Synthèse vocale (Le téléphone lit le texte)
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Arrêter la lecture précédente
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9; // Légèrement plus lent pour bien comprendre
      window.speechSynthesis.speak(utterance);
    }
  };

  // Reconnaissance vocale (L'utilisateur parle au lieu de taper)
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("La dictée vocale n'est pas supportée sur ce navigateur.");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setResponse(prev => prev + " " + transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const getScenario = async () => {
    setIsLoading(true);
    setResponse('');
    try {
      const res = await fetch(LAMBDA_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate_scenario',
          userId: localStorage.getItem('userId') || 'anonymous'
        })
      });
      const data = await res.json();
      setScenario(data);
      setView('scenario');
      // Lecture automatique du scénario pour l'accessibilité
      setTimeout(() => speak(`Nouveau message reçu. ${data.content}. Que faites-vous ?`), 500);
    } catch (e) {
      alert("Une petite erreur de connexion. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    }
  };

  const submitAnalysis = async () => {
    if (!response && !image) return;
    setIsLoading(true);
    window.speechSynthesis.cancel();
    
    try {
      const res = await fetch(LAMBDA_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'analyze',
          userId: localStorage.getItem('userId') || 'anonymous',
          scenario,
          userResponse: response,
          imageBase64: image
        })
      });
      const data = await res.json();
      setResult(data);
      setView('result');
      // Lecture du feedback principal
      setTimeout(() => speak(`Résultat : ${data.detection.score} sur 100. ${data.coaching.feedback}`), 500);
    } catch (e) {
      alert("Impossible d'analyser pour le moment.");
    } finally {
      setIsLoading(false);
    }
  };

  // Composant de chargement simple et visible
  if (isLoading) {
    return (
      <div className="container loading-screen">
        <div className="spinner">⏳</div>
        <p>L'intelligence artificielle réfléchit...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1>🛡️ ScamGuard</h1>
      </header>
      
      <main>
        {view === 'home' && (
          <div className="menu-grid">
            <p className="welcome-text">Bonjour ! Que voulez-vous faire aujourd'hui ?</p>
            
            <button onClick={getScenario} className="btn-primary large-touch">
              <span className="icon">🎯</span>
              <span className="text">M'entraîner avec un faux scénario</span>
            </button>
            
            <button onClick={() => setView('detection')} className="btn-secondary large-touch">
              <span className="icon">📸</span>
              <span className="text">Analyser un message suspect reçu</span>
            </button>
          </div>
        )}
        
        {view === 'scenario' && scenario && (
          <div className="scenario-card">
            <div className="scenario-header">
              <h2>{scenario.title}</h2>
              <button onClick={() => speak(scenario.content)} className="btn-icon" aria-label="Relire le message">
                🔊
              </button>
            </div>
            
            <div className="message-box">
              {scenario.content}
            </div>
            
            <label htmlFor="response" className="instruction-label">
              ❓ Que faites-vous face à ce message ?
            </label>
            
            <div className="input-area">
              <textarea 
                id="response"
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder="Ex: Je supprime le message..."
              />
              <button 
                onClick={startListening} 
                className={`btn-mic ${isListening ? 'listening' : ''}`}
                aria-label="Dicter ma réponse"
              >
                {isListening ? '🛑 Écoute...' : '🎙️ Dicter'}
              </button>
            </div>

            <button onClick={submitAnalysis} className="btn-action large-touch" disabled={!response}>
              ✅ Valider ma réponse
            </button>
            <button onClick={() => setView('home')} className="btn-text">
              Annuler
            </button>
          </div>
        )}
        
        {view === 'detection' && (
          <div className="detection-card">
            <h2>📸 Analyse de message</h2>
            <p>Prenez une photo de l'écran ou du message qui vous inquiète.</p>
            
            <label className="file-upload large-touch">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={handleImageUpload}
              />
              <span>📷 Prendre une photo</span>
            </label>
            
            {image && <p className="success-msg">✅ Photo ajoutée !</p>}
            
            <textarea 
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Ou décrivez ce qui vous semble bizarre..."
            />
            
            <button onClick={submitAnalysis} className="btn-action large-touch">
              🔍 Lancer l'analyse
            </button>
            <button onClick={() => setView('home')} className="btn-text">Retour</button>
          </div>
        )}
        
        {view === 'result' && result && (
          <div className="result-card">
            <h2>Résultat de l'analyse</h2>
            <div className={`score-circle score-${result.detection.score > 50 ? 'good' : 'bad'}`}>
              {result.detection.score}/100
            </div>
            
            <div className="feedback-box">
              {result.coaching.feedback}
            </div>
            
            <div className="xp-badge">
              🎖️ +{result.coaching.xp_earned} XP gagnés
            </div>
            
            <button onClick={() => setView('home')} className="btn-primary large-touch">
              🏠 Retour à l'accueil
            </button>
          </div>
        )}
      </main>
    </div>
  );
}