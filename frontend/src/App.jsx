import { useState, useCallback } from 'react';
import './App.css';
import './styles/design-tokens.css';
import './styles/animations.css';
import SecurityHeartDashboard from './components/SecurityHeartDashboard';
import BottomNavigation, { TabPanel } from './components/BottomNavigation';
import useAnalysisHistory from './hooks/useAnalysisHistory';
import AnalysisHistory from './components/AnalysisHistory';
import DashboardStats from './components/DashboardStats';
import QuizModule from './components/QuizModule';
import useCreditSystem from './hooks/useCreditSystem';
import CreditSystem from './components/CreditSystem';
import useAccountProfile from './hooks/useAccountProfile';
import AccountProfile from './components/AccountProfile';
import useAuth from './hooks/useAuth';
import SMSAuthScreen from './components/SMSAuthScreen';
import { analysisAPI } from './services/api';

export default function App() {
  // ============================================================================
  // TOUS les Hooks DOIVENT être appelés en premier (avant tout return conditionnel)
  // ============================================================================

  // Authentication
  const auth = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState('securite'); // Default: Security tab
  const [view, setView] = useState('home');
  const [scenario, setScenario] = useState(null);
  const [response, setResponse] = useState('');
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Phase 4.0: Analysis history and statistics
  const { analyses, addAnalysis, getStatistics } = useAnalysisHistory();
  const statistics = getStatistics();

  // Phase 4.0.4: Credit system
  const { balance, transactions, earnCredits, getStats: getCreditStats, formatTimeAgo } = useCreditSystem();
  const creditStats = getCreditStats();

  // Phase 4.2: Account profile management
  const { profile, updateName, updateAvatar, togglePreference, resetProfile, getJoinDateFormatted } = useAccountProfile();

  // Phase 4.0.5: Handle quiz completion and award credits
  const handleQuizComplete = useCallback((score, passed) => {
    const creditsEarned = passed ? 20 : 5;
    const description = passed
      ? 'Quiz réussi - félicitations!'
      : 'Quiz tenté - continuez votre apprentissage!';
    earnCredits(creditsEarned, 'quiz', description);
  }, [earnCredits]);

  // Phase 4.2: Export user data as JSON file
  const handleExportData = useCallback(() => {
    const exportData = {
      exportDate: new Date().toISOString(),
      profile,
      analyses,
      credits: { balance, transactions }
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scamguard-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [profile, analyses, balance, transactions]);

  // ============================================================================
  // Auth guard: Show SMS OTP auth if not authenticated (APRÈS tous les Hooks)
  // ============================================================================
  if (!auth.isAuthenticated) {
    return <SMSAuthScreen />;
  }

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
      const data = await analysisAPI.generateScenario(auth.user?.sub);
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
      const data = await analysisAPI.analyze(response, auth.user?.sub, scenario, image);
      setResult(data);
      setView('result');

      // Phase 4.0: Persist analysis to history
      const analysisType = image ? 'image' : 'message';
      const analysisContent = response || 'Screenshot analyzed';
      const riskLevel = data.detection.score > 70 ? 'safe' : data.detection.score > 40 ? 'moderate' : 'danger';

      addAnalysis({
        type: analysisType,
        content: analysisContent,
        result: {
          score: data.detection.score,
          riskLevel,
          message: data.coaching.feedback,
          scamType: scenario?.title || 'Manual Analysis',
          feedback: data.coaching.feedback,
          xpEarned: data.coaching.xp_earned || 0
        }
      });

      // Phase 4.0.4: Earn credits for completing analysis
      earnCredits(10, 'analysis', 'Analyse de message complétée');

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
    <div className="app-wrapper" style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
      <header className="app-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '20px'}}>
        <h1>🛡️ ScamGuard MVP - Phase 4</h1>
        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          {auth.user?.email && (
            <span style={{fontSize: '14px', color: '#666'}}>
              {auth.user.email}
            </span>
          )}
          <button
            onClick={auth.logout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              border: '2px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e0e0e0'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#f0f0f0'}
          >
            🚪 Déconnexion
          </button>
        </div>
      </header>

      <div className="navigation-content" style={{flex: 1, overflowY: 'auto', paddingBottom: '100px'}}>
        {/* Tab 1: Vérifier - Message/Photo Analysis */}
        <TabPanel tabId="verifier" activeTab={activeTab}>
          <div className="container">
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

        {/* Phase 4.0: Analysis History */}
        {view === 'home' && analyses.length > 0 && (
          <div style={{marginTop: '32px'}}>
            <AnalysisHistory analyses={analyses} />
          </div>
        )}
          </div>
        </TabPanel>

        {/* Tab 2: Sécurité - Security Heart Dashboard (DEFAULT) */}
        <TabPanel tabId="securite" activeTab={activeTab}>
          <div className="security-view" style={{paddingBottom: '40px'}}>
            {/* Phase 4.0: Dashboard Statistics */}
            <DashboardStats statistics={statistics} analyses={analyses} />
            {/* Security Heart Dashboard */}
            <SecurityHeartDashboard userId="user-demo" />
          </div>
        </TabPanel>

        {/* Tab 3: Académie - Interactive Learning Quizzes (Phase 4.0.3) */}
        <TabPanel tabId="academie" activeTab={activeTab}>
          <QuizModule onComplete={handleQuizComplete} />
        </TabPanel>

        {/* Tab 4: Paramètres - Account & Credit Settings (Phase 4.2 + 4.0.4) */}
        <TabPanel tabId="parametres" activeTab={activeTab}>
          {/* Phase 4.2: Account Profile Section */}
          <AccountProfile
            profile={profile}
            statistics={statistics}
            onUpdateName={updateName}
            onUpdateAvatar={updateAvatar}
            onTogglePreference={togglePreference}
            onResetProfile={resetProfile}
            joinDate={getJoinDateFormatted()}
            onExportData={handleExportData}
          />
          {/* Phase 4.0.4: Credit System Section */}
          <CreditSystem
            balance={balance}
            transactions={transactions}
            stats={creditStats}
            formatTimeAgo={formatTimeAgo}
          />
        </TabPanel>
      </div>

      {/* Bottom Navigation - Sticky Tab Bar */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}