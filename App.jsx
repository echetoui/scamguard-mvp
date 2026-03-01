import { useState, useEffect, useRef } from 'react';
import Button from './Button';
import Card from './Card';
import { STORAGE_KEYS, DEFAULTS, TIMEOUTS, LIMITS } from './constants';
import HomeView from './components/views/HomeView';
import ScenarioView from './components/views/ScenarioView';
import DetectionView from './components/views/DetectionView';
import ResultView from './components/views/ResultView';
import HistoryView from './components/views/HistoryView';
import { apiService } from './services/api';
import { useSpeech } from './hooks/useSpeech';
import { useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const [view, setView] = useState('home');
  const [scenario, setScenario] = useState(null);
  const [response, setResponse] = useState('');
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [];
  });
  const [toast, setToast] = useState(null); // { message, type }
  const mainRef = useRef(null); // Référence pour la gestion du focus
  const { speak, cancelSpeech, startListening, isListening } = useSpeech();
  const { user, isLoading: isAuthLoading, login, logout } = useAuth();

  // Accessibilité : Définir la langue et le titre
  useEffect(() => {
    document.documentElement.lang = 'fr';
    document.title = 'ScamGuard - Protection contre la fraude';
  }, []);

  // UX & A11y : Remonter en haut et gérer le focus à chaque changement de vue
  useEffect(() => {
    window.scrollTo(0, 0);
    // Déplacer le focus sur le contenu principal pour les lecteurs d'écran
    if (mainRef.current) {
      mainRef.current.focus();
    }
  }, [view]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), TIMEOUTS.TOAST);
  };

  // Wrapper pour la reconnaissance vocale avec gestion d'état locale
  const handleStartListening = () => {
    startListening(
      (text) => setResponse(prev => prev + " " + text),
      (errorMsg) => showToast(errorMsg, "error")
    );
  };

  const getScenario = async () => {
    setIsLoading(true);
    setResponse('');
    try {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID) || DEFAULTS.USER_ID;
      const data = await apiService.generateScenario(userId);
      setScenario(data);
      setView('scenario');
      // Lecture automatique du scénario pour l'accessibilité
      setTimeout(() => speak(`Nouveau message reçu. ${data.content}. Que faites-vous ?`), TIMEOUTS.SPEECH_DELAY);
    } catch (e) {
      showToast("Erreur de connexion. Vérifiez votre internet.", "error");
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

  const saveToHistory = (analysisResult) => {
    const newItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString(DEFAULTS.LANG),
      score: analysisResult.detection.score,
      summary: analysisResult.coaching.feedback.substring(0, 60) + "..."
    };
    const updatedHistory = [newItem, ...history].slice(0, LIMITS.HISTORY_MAX_ITEMS);
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
  };

  const submitAnalysis = async () => {
    if (!response && !image) return;
    setIsLoading(true);
    cancelSpeech();
    
    try {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID) || DEFAULTS.USER_ID;
      const data = await apiService.analyzeMessage(userId, scenario, response, image);
      setResult(data);
      setView('result');
      saveToHistory(data);
      showToast("Analyse terminée !", "success");
      // Lecture du feedback principal
      setTimeout(() => speak(`Résultat : ${data.detection.score} sur 100. ${data.coaching.feedback}`), TIMEOUTS.SPEECH_DELAY);
    } catch (e) {
      showToast("Impossible d'analyser pour le moment.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <ProtectedRoute user={user} isLoading={isAuthLoading} onLogin={login}>
        {isLoading ? (
          <LoadingSpinner message="Analyse en cours..." />
        ) : (
          <div className="container">
            {/* Accessibilité : Lien d'évitement */}
            <a href="#main-content" className="skip-link">Aller au contenu principal</a>

            <header className="app-header">
              <div className="logo-area">
                <h1>🛡️ ScamGuard</h1>
              </div>
              {view !== 'home' && view !== 'history' ? (
                <Button variant="outline" onClick={() => setView('home')} className="header-close-btn">
                  Fermer
                </Button>
              ) : (
                <Button variant="outline" onClick={logout} className="header-close-btn" style={{ fontSize: '16px', padding: '0 16px' }}>
                  Déconnexion
                </Button>
              )}
            </header>
            
            <main id="main-content" className="main-content" tabIndex="-1" ref={mainRef}>
              {view === 'home' && (
                <HomeView 
                  onStartScenario={getScenario} 
                  onStartDetection={() => setView('detection')} 
                />
              )}
              
              {view === 'scenario' && scenario && (
                <ScenarioView
                  scenario={scenario}
                  response={response}
                  setResponse={setResponse}
                  isListening={isListening}
                  onSpeak={speak}
                  onStartListening={handleStartListening}
                  onSubmit={submitAnalysis}
                  onCancel={() => setView('home')}
                />
              )}
              
              {view === 'detection' && (
                <DetectionView
                  image={image}
                  response={response}
                  setResponse={setResponse}
                  onImageUpload={handleImageUpload}
                  onSubmit={submitAnalysis}
                  onCancel={() => setView('home')}
                />
              )}
              
              {view === 'result' && result && (
                <ResultView 
                  result={result} 
                  onHome={() => setView('home')} 
                />
              )}

              {view === 'history' && (
                <HistoryView history={history} user={user} onLogout={logout} />
              )}
            </main>

            {/* Navigation du bas */}
            <nav className="bottom-nav">
              <button 
                onClick={() => setView('home')} 
                className={`nav-item ${view === 'home' ? 'active' : ''}`}
                aria-current={view === 'home' ? 'page' : undefined}
              >
                <span className="nav-icon">🏠</span>
                <span>Accueil</span>
              </button>
              <button 
                onClick={() => setView('history')} 
                className={`nav-item ${view === 'history' ? 'active' : ''}`}
                aria-current={view === 'history' ? 'page' : undefined}
              >
                <span className="nav-icon">📜</span>
                <span>Historique</span>
              </button>
            </nav>

            {/* Toast Notification */}
            {toast && <div className={`toast toast-${toast.type}`} role="alert" aria-live="assertive">{toast.message}</div>}
          </div>
        )}
      </ProtectedRoute>
    </ErrorBoundary>
  );
}