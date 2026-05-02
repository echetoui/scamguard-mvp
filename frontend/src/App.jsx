import { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useVoiceGuidance } from './hooks/useVoiceGuidance';
import './App.css';
import './styles/design-tokens-m3.css';
import './styles/utility-classes.css';
import './styles/animations.css';
import ErrorBoundary from './components/ErrorBoundary';
import SecurityHeartDashboard from './components/SecurityHeartDashboard';
import GuardianSummary from './components/GuardianSummary';
import BottomNavigation, { TabPanel } from './components/BottomNavigation';
import useAnalysisHistory from './hooks/useAnalysisHistory';
import AnalysisHistory from './components/AnalysisHistory';
import DashboardStats from './components/DashboardStats';
import QuizAcademie from './components/QuizAcademie';
import useCreditSystem from './hooks/useCreditSystem';
import useAccountProfile from './hooks/useAccountProfile';
import useAuth from './hooks/useAuth';
import AuthFlow from './screens/Auth/AuthFlow'; // Remplacer le chemin selon ta structure exacte
import useFamilyDashboard from './hooks/useFamilyDashboard';
import OnboardingWizard from './components/OnboardingWizard';
import { analysisAPI } from './services/api';
import { sendNotification, shouldSendDailyNotification, getSecurityTips } from './utils/notificationService';
import ThreatsSection from './components/ThreatsSection';
import WeeklyDigest from './components/WeeklyDigest';
import useThreatData from './hooks/useThreatData';

// Lazy-loaded components (defer loading until tab is activated)
const ResourcesTab = lazy(() => import('./components/Resources/ResourcesTab'));
const ToolsTab = lazy(() => import('./components/ToolsTab'));
const FamilyDashboard = lazy(() => import('./components/FamilyDashboard'));
const AccountProfile = lazy(() => import('./components/AccountProfile'));
const CreditSystem = lazy(() => import('./components/CreditSystem'));
const ScamReportingSystem = lazy(() => import('./components/ScamReportingSystem'));
const DesignSystemDemo = lazy(() => import('./components/DesignSystemDemo'));

const TAB_ROUTES = {
  verifier: '/verify',
  securite: '/security',
  academie: '/academy',
  ressources: '/resources',
  outils: '/tools',
  menaces: '/threats',
  signaler: '/report',
  famille: '/family',
  parametres: '/settings',
  design: '/design'
};

const ROUTE_TABS = Object.fromEntries(
  Object.entries(TAB_ROUTES).map(([tabId, route]) => [route, tabId])
);

const getTabFromPath = (pathname) => ROUTE_TABS[pathname] || 'securite';

// Loading placeholder component
const LoadingPlaceholder = () => (
  <div role="status" aria-live="polite" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
    <p>Chargement…</p>
  </div>
);

export default function App() {
  // ============================================================================
  // TOUS les Hooks DOIVENT être appelés en premier (avant tout return conditionnel)
  // ============================================================================

  // Authentication
  const auth = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') {
      return 'securite';
    }
    return getTabFromPath(window.location.pathname);
  }); // Default: Security tab
  const [view, setView] = useState('home');
  const [response, setResponse] = useState('');
  const [image, setImage] = useState(null);
  const [imageStatus, setImageStatus] = useState('');
  const [result, setResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Phase 1 Sprint 4: Onboarding wizard (first-run experience)
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('scamguard_onboarding_complete')
  );

  // Phase 4.0: Analysis history and statistics
  const { analyses, addAnalysis, getStatistics } = useAnalysisHistory();
  const statistics = getStatistics();

  // Phase 4.0.4: Credit system
  const { balance, transactions, earnCredits, getStats: getCreditStats, formatTimeAgo } = useCreditSystem();
  const creditStats = getCreditStats();

  // Phase 4.2: Account profile management
  const { profile, updateName, updateAvatar, togglePreference, resetProfile, getJoinDateFormatted } = useAccountProfile();

  // Phase 5A: Family protection dashboard
  const { familyData, loading: familyLoading, error: familyError, hasFamily } = useFamilyDashboard();

  // Phase 2 Sprint 5: Threat data
  const { threats, matchedThreats } = useThreatData(profile);

  const { theme, toggleTheme } = useTheme();
  const { isVoiceGuidanceEnabled, toggleVoiceGuidance } = useVoiceGuidance();

  const handleTabChange = useCallback((tabId, options = {}) => {
    const route = TAB_ROUTES[tabId];
    setActiveTab(tabId);

    if (!route || typeof window === 'undefined' || window.location.pathname === route) {
      return;
    }

    const navigationMethod = options.replace ? 'replaceState' : 'pushState';
    window.history[navigationMethod]({}, '', route);
  }, []);

  // Phase 1 Sprint 3: Check for and send daily reminder notification on app mount
  useEffect(() => {
    if (shouldSendDailyNotification('QUIZ_REMINDER')) {
      sendNotification('QUIZ_REMINDER', {});
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // a map of tab id to tab name
    const tabNames = {
      'verifier': 'Vérifier',
      'securite': 'Sécurité',
      'academie': 'Académie',
      'ressources': 'Ressources',
      'outils': 'Outils',
      'famille': 'Famille',
      'parametres': 'Paramètres',
      'signaler': 'Signaler',
      'design': 'Design'
    };
    if (isVoiceGuidanceEnabled) {
      speak(`Onglet ${tabNames[activeTab]}`);
    }
  }, [activeTab, isVoiceGuidanceEnabled]);

  useEffect(() => {
    if (activeTab === 'verifier' && view === 'home' && isVoiceGuidanceEnabled) {
      const instructions = "Collez le texte d'un courriel ou d'un SMS ci-dessous. Notre intelligence artificielle vous aidera à déterminer s'il s'agit d'une arnaque.";
      speak(instructions);
    }
  }, [activeTab, view, isVoiceGuidanceEnabled]);

  // Phase 4.0.5: Handle quiz completion and award credits
  const handleQuizComplete = useCallback((score, passed, difficulty = 'intermediaire') => {
    let creditsEarned = 5; // Default for failed attempts
    let description = 'Quiz tenté - continuez votre apprentissage!';

    if (passed) {
      if (difficulty === 'expert') {
        creditsEarned = 30; // Expert bonus
        description = 'Quiz Expert réussi - excellent travail!';
      } else {
        creditsEarned = 20; // Standard pass
        description = 'Quiz réussi - félicitations!';
      }
    }

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
  // Auth guard: Show modern auth page if not authenticated (APRÈS tous les Hooks)
  // ============================================================================
  // DEV MODE: Bypass auth if REACT_APP_BYPASS_AUTH is set
  const bypassAuth = process.env.REACT_APP_BYPASS_AUTH === 'true';
  if (!auth.isAuthenticated && !bypassAuth) {
    return <AuthFlow onLoginSuccess={(user, token) => auth.loginWithToken(user, token)} />;
  }

  // Synthèse vocale (Le téléphone lit le texte)
  const speak = (text) => {
    if (isVoiceGuidanceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Arrêter la lecture précédente
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9; // Légèrement plus lent pour bien comprendre
      window.speechSynthesis.speak(utterance);
    }
  };


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAnalysisError('');
    setImageStatus('');

    // Validation: Type de fichier (doit être une image)
    if (!file.type.startsWith('image/')) {
      setAnalysisError('Veuillez sélectionner une image valide (JPG, PNG, etc.).');
      return;
    }

    // Validation: Taille maximale (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB en bytes
    if (file.size > MAX_SIZE) {
      setAnalysisError(`L'image est trop volumineuse (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum : 5 MB.`);
      return;
    }

    // Validation: Dimensions minimales (au moins 100x100)
    const img = new Image();
    img.onload = () => {
      if (img.width < 100 || img.height < 100) {
        setAnalysisError('L’image est trop petite. Minimum : 100 x 100 pixels.');
        return;
      }
      // Image valide - convertir en base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result.split(',')[1]);
        setImageStatus('Photo ajoutée.');
      };
      reader.readAsDataURL(file);
    };
    img.src = URL.createObjectURL(file);
  };

  const submitAnalysis = async () => {
    if (!response && !image) {
      setAnalysisError('Ajoutez un message ou une photo avant de lancer l’analyse.');
      return;
    }
    setIsLoading(true);
    setAnalysisError('');
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

      // Phase 1 Sprint 3: Send analysis completion notification
      const verdict = data.detection.score > 70 ? '✅ Sûr' : data.detection.score > 40 ? '⚠️ Modéré' : '🔴 Dangereux';
      sendNotification('ANALYSIS_COMPLETE', { verdict });

      // Lecture du feedback principal
      setTimeout(() => speak(`Résultat : ${data.detection.score} sur 100. ${data.coaching.feedback}`), 500);
    } catch (e) {
      setAnalysisError("Impossible d’analyser pour le moment. Réessayez dans quelques instants.");
    } finally {
      setIsLoading(false);
    }
  };

  // Composant de chargement simple et visible
  if (isLoading) {
    return (
      <div className="container loading-screen" role="status" aria-live="polite">
        <div className="spinner">⏳</div>
        <p>L’intelligence artificielle réfléchit…</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <a className="skip-link" href="#main-content">
        Aller au contenu principal
      </a>
      {showOnboarding && auth.isAuthenticated && (
        <OnboardingWizard
          auth={auth}
          profile={profile}
          onComplete={(name, avatar) => {
            updateName(name);
            updateAvatar(avatar);
            handleTabChange('academie', { replace: true });
            setShowOnboarding(false);
          }}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
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
            className="logout-button"
          >
            🚪 Déconnexion
          </button>
        </div>
      </header>

      <main id="main-content" className="navigation-content" style={{flex: 1, overflowY: 'auto', paddingBottom: '100px'}} tabIndex={-1}>
        {/* Tab 1: Vérifier - Message/Photo Analysis */}
        <TabPanel tabId="verifier" activeTab={activeTab}>
          <div className="container">
        {view === 'home' && (
          <div className="detection-card">
            <h2>✏️ Analysez votre message</h2>
            <p className="instruction-text">
              Collez le texte d'un courriel ou d'un SMS ci-dessous. Notre intelligence artificielle vous aidera à déterminer s'il s'agit d'une arnaque.
            </p>

            <label htmlFor="message-input" className="input-label">
              📝 Texte du message :
            </label>
            <textarea
              id="message-input"
              name="message"
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Ex. Collez votre message suspect ici…"
              className="message-textarea"
              aria-label="Entrez le texte du message à analyser"
              autoComplete="off"
            />

            <div className="divider">ou</div>

            <label className="file-upload large-touch">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                aria-label="Télécharger une photo du message"
              />
              <span>📷 Ajouter une photo</span>
            </label>

            {image && <p className="success-msg">✅ Photo ajoutée !</p>}
            <div className="form-status" role="status" aria-live="polite">
              {imageStatus}
            </div>
            {analysisError && (
              <div className="form-error" role="alert">
                {analysisError}
              </div>
            )}

            <button
              onClick={submitAnalysis}
              className="btn-action large-touch"
              disabled={!response && !image}
              aria-label="Lancer l'analyse du message"
            >
              🔍 Analyser le message
            </button>
          </div>
        )}
        
        
        {view === 'result' && result && (
          <div className="result-card" role="status" aria-live="polite">
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
            {/* Guardian Summary - Show if user has family */}
            {hasFamily && (
              <GuardianSummary
                familyData={familyData}
                loading={familyLoading}
                onViewFamily={() => handleTabChange('famille')}
              />
            )}
            {/* Security Heart Dashboard */}
            <SecurityHeartDashboard
              userId="user-demo"
              onContinue={() => handleTabChange('verifier')}
              onOpenSettings={() => handleTabChange('parametres')}
            />
          </div>
        </TabPanel>

        {/* Tab 3: Académie - Quiz Academy with Progress Tracking (Phase 1 Sprint 3) */}
        <TabPanel tabId="academie" activeTab={activeTab}>
          <QuizAcademie onQuizComplete={handleQuizComplete} speak={speak} isVoiceGuidanceEnabled={isVoiceGuidanceEnabled} />
        </TabPanel>

        {/* Tab 4: Ressources - Blocking Guides & Security Tips (Phase 5E.1) */}
        <TabPanel tabId="ressources" activeTab={activeTab}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <ResourcesTab />
          </Suspense>
        </TabPanel>

        {/* Tab 5: Outils - Verification Tools (Phase 5C) */}
        <TabPanel tabId="outils" activeTab={activeTab}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <ToolsTab />
          </Suspense>
        </TabPanel>

        {/* Tab 6: Famille - Family Protection Dashboard (Phase 5A) */}
        <TabPanel tabId="famille" activeTab={activeTab}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <FamilyDashboard />
          </Suspense>
        </TabPanel>

        {/* Tab 6b: Menaces - Threat Dashboard (Phase 2 Sprint 5) */}
        <TabPanel tabId="menaces" activeTab={activeTab}>
          <div style={{padding: '0 0 40px 0'}}>
            <WeeklyDigest
              threats={threats}
              matchedThreats={matchedThreats}
              onViewThreat={(threat) => {/* TODO: show threat detail modal */}}
            />
            <ThreatsSection
              threats={threats}
              filterLevel="all"
            />
          </div>
        </TabPanel>

        {/* Tab 8: Signaler - Scam Reporting System (Phase 5B) */}
        <TabPanel tabId="signaler" activeTab={activeTab}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <ScamReportingSystem />
          </Suspense>
        </TabPanel>

        {/* Tab 7: Paramètres - Account & Credit Settings (Phase 4.2 + 4.0.4) */}
        <TabPanel tabId="parametres" activeTab={activeTab}>
          {/* Phase 4.2: Account Profile Section */}
          <Suspense fallback={<LoadingPlaceholder />}>
            <AccountProfile
              profile={profile}
              statistics={statistics}
              onUpdateName={updateName}
              onUpdateAvatar={updateAvatar}
              onTogglePreference={togglePreference}
              onResetProfile={resetProfile}
              joinDate={getJoinDateFormatted()}
              onExportData={handleExportData}
              onLogout={auth.logout}
              theme={theme}
              onToggleTheme={toggleTheme}
              isVoiceGuidanceEnabled={isVoiceGuidanceEnabled}
              onToggleVoiceGuidance={toggleVoiceGuidance}
            />
          </Suspense>
          {/* Phase 4.0.4: Credit System Section */}
          <Suspense fallback={<LoadingPlaceholder />}>
            <CreditSystem
              balance={balance}
              transactions={transactions}
              stats={creditStats}
              formatTimeAgo={formatTimeAgo}
            />
          </Suspense>
        </TabPanel>

        {/* Tab: Design System Demo */}
        <TabPanel tabId="design" activeTab={activeTab}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <DesignSystemDemo />
          </Suspense>
        </TabPanel>
      </main>

      {/* Bottom Navigation - Sticky Tab Bar */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasFamily={hasFamily}
      />
      </div>
    </ErrorBoundary>
  );
}
