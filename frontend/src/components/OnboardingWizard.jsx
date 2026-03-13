/**
 * OnboardingWizard Component
 * Phase 1 Sprint 4 - First-Run Onboarding Wizard
 *
 * 4-step modal overlay wizard that appears on first login:
 * 1. Welcome - introduce ScamGuard value proposition
 * 2. Profile - set name & avatar
 * 3. Notifications - request permission & explain benefits
 * 4. Tour - teach 3 core scam warning signs
 *
 * Props:
 *  - auth: { user: { email: string, sub: string } | null }
 *  - profile: { name: string, avatar: string }
 *  - onComplete: (name: string, avatar: string) => void
 *  - onSkip: () => void
 */

import { useState, useEffect, useRef } from 'react';
import { requestPermission, getPermissionStatus } from '../utils/notificationService';
import '../styles/OnboardingWizard.css';

const AVATARS = ['🛡️', '👴', '👵', '🧑', '🦸'];

const TOUR_CARDS = [
  {
    icon: '📱',
    title: 'Hameçonnage par SMS',
    description: 'Les vraies banques ne demandent jamais votre NIP par SMS.'
  },
  {
    icon: '💻',
    title: 'Faux support technique',
    description: 'Microsoft et Apple ne vous appellent JAMAIS à l\'improviste.'
  },
  {
    icon: '🛒',
    title: 'Arnaques aux achats',
    description: 'Si le prix semble trop beau pour être vrai, c\'est probablement une arnaque.'
  }
];

export default function OnboardingWizard({ auth, profile, onComplete, onSkip }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🛡️');
  const [ageGroup, setAgeGroup] = useState('');
  const [notifStatus, setNotifStatus] = useState(() => getPermissionStatus());
  const [tourIndex, setTourIndex] = useState(0);
  const containerRef = useRef(null);

  // Initialize name from email prefix or existing profile
  useEffect(() => {
    const emailPrefix = auth?.user?.email?.split('@')[0] || '';
    const hasCustomName = profile.name && profile.name !== 'Mon Profil';
    setName(hasCustomName ? profile.name : emailPrefix);
    setAvatar(profile.avatar || '🛡️');
  }, []);

  // Focus management
  useEffect(() => {
    containerRef.current?.focus();
  }, [step]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && step < 4) {
      handleSkip();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('scamguard_onboarding_complete', 'true');
    if (ageGroup) {
      localStorage.setItem('scamguard_age_group', ageGroup);
    }
    onComplete(name, avatar);
  };

  const handleSkip = () => {
    localStorage.setItem('scamguard_onboarding_complete', 'true');
    onSkip();
  };

  // ============================================================================
  // STEP 1: WELCOME
  // ============================================================================
  const StepWelcome = () => (
    <>
      <div className="onboarding-icon">🛡️</div>
      <h2 className="onboarding-heading">Bienvenue dans ScamGuard</h2>
      <p className="onboarding-tagline">Protégez-vous contre les arnaques en ligne</p>

      <p className="onboarding-description">
        ScamGuard utilise l'intelligence artificielle pour analyser vos messages et vous protéger contre les tentatives d'arnaque. En quelques minutes, vous apprendrez à identifier les signaux d'alerte des arnaques courantes.
      </p>

      <div className="onboarding-button-group">
        <button className="onboarding-btn-primary" onClick={() => setStep(2)}>
          Commencer →
        </button>
        <button className="onboarding-link" onClick={handleSkip}>
          Passer l'introduction
        </button>
      </div>
    </>
  );

  // ============================================================================
  // STEP 2: PROFILE
  // ============================================================================
  const StepProfile = () => (
    <>
      <h2 className="onboarding-heading">Configurez votre profil</h2>

      <div className="onboarding-form-group">
        <label htmlFor="onboarding-name" className="onboarding-form-label">
          Votre prénom :
        </label>
        <input
          id="onboarding-name"
          type="text"
          className="onboarding-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Entrez votre prénom"
        />
      </div>

      <div className="onboarding-form-group">
        <label className="onboarding-form-label">Choisissez un avatar :</label>
        <div className="onboarding-avatar-picker">
          {AVATARS.map((ava) => (
            <button
              key={ava}
              className={`onboarding-avatar-option ${avatar === ava ? 'selected' : ''}`}
              onClick={() => setAvatar(ava)}
              aria-label={`Sélectionner ${ava} comme avatar`}
              aria-pressed={avatar === ava}
            >
              {ava}
            </button>
          ))}
        </div>
      </div>

      <div className="onboarding-form-group">
        <label className="onboarding-form-label">Groupe d'âge (optionnel) :</label>
        <label className="onboarding-radio-label">
          <input
            type="radio"
            name="age-group"
            value="60-70"
            checked={ageGroup === '60-70'}
            onChange={(e) => setAgeGroup(e.target.value)}
          />
          <span>60-70 ans</span>
        </label>
        <label className="onboarding-radio-label">
          <input
            type="radio"
            name="age-group"
            value="70-80"
            checked={ageGroup === '70-80'}
            onChange={(e) => setAgeGroup(e.target.value)}
          />
          <span>70-80 ans</span>
        </label>
        <label className="onboarding-radio-label">
          <input
            type="radio"
            name="age-group"
            value="80+"
            checked={ageGroup === '80+'}
            onChange={(e) => setAgeGroup(e.target.value)}
          />
          <span>80+ ans</span>
        </label>
      </div>

      <div className="onboarding-button-group">
        <button
          className="onboarding-btn-primary"
          disabled={!name.trim()}
          onClick={() => setStep(3)}
        >
          Suivant →
        </button>
      </div>
    </>
  );

  // ============================================================================
  // STEP 3: NOTIFICATIONS
  // ============================================================================
  const StepNotifications = () => (
    <>
      <div className="onboarding-icon">🔔</div>
      <h2 className="onboarding-heading">Activez les notifications</h2>

      <p className="onboarding-description">
        Recevez des alertes de sécurité et des conseils quotidiens pour rester protégé.
      </p>

      <ul className="onboarding-list">
        <li className="onboarding-list-item">Alertes en temps réel pour les analyses suspectes</li>
        <li className="onboarding-list-item">Rappels quotidiens pour apprendre de nouveaux modules</li>
        <li className="onboarding-list-item">Conseils de sécurité personnalisés</li>
      </ul>

      {notifStatus === 'default' ? (
        <div className="onboarding-button-group">
          <button
            className="onboarding-btn-primary"
            onClick={async () => {
              const permission = await requestPermission();
              setNotifStatus(permission);
            }}
          >
            Activer les notifications
          </button>
          <button className="onboarding-link" onClick={() => setStep(4)}>
            Plus tard
          </button>
        </div>
      ) : (
        <>
          <div
            className={`onboarding-notification-status ${
              notifStatus === 'granted' ? 'granted' : 'denied'
            }`}
          >
            {notifStatus === 'granted'
              ? '✅ Notifications activées avec succès!'
              : '❌ Notifications refusées. Vous pouvez les activer plus tard dans les paramètres.'}
          </div>
          <div className="onboarding-button-group">
            <button className="onboarding-btn-primary" onClick={() => setStep(4)}>
              Continuer →
            </button>
          </div>
        </>
      )}
    </>
  );

  // ============================================================================
  // STEP 4: TOUR
  // ============================================================================
  const StepTour = () => {
    const card = TOUR_CARDS[tourIndex];
    const isLastCard = tourIndex === TOUR_CARDS.length - 1;

    return (
      <>
        <div className="onboarding-tour-icon">{card.icon}</div>
        <h2 className="onboarding-tour-title">{card.title}</h2>
        <p className="onboarding-tour-description">{card.description}</p>

        <div
          className="onboarding-tour-counter"
          aria-live="polite"
          aria-label={`Étape ${tourIndex + 1} sur ${TOUR_CARDS.length}`}
        >
          Étape {tourIndex + 1} sur {TOUR_CARDS.length}
        </div>

        <div className="onboarding-button-group">
          {!isLastCard ? (
            <button className="onboarding-btn-primary" onClick={() => setTourIndex(tourIndex + 1)}>
              Suivant
            </button>
          ) : (
            <button className="onboarding-btn-primary" onClick={handleComplete}>
              Terminer →
            </button>
          )}
        </div>
      </>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Assistant de démarrage ScamGuard"
      className="onboarding-overlay"
      onKeyDown={handleKeyDown}
    >
      <div className="onboarding-panel" ref={containerRef} tabIndex={-1}>
        <div className="onboarding-progress" aria-hidden="true">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`progress-dot ${step >= s ? 'active' : ''}`} />
          ))}
        </div>

        <div className="onboarding-step">
          {step === 1 && <StepWelcome />}
          {step === 2 && <StepProfile />}
          {step === 3 && <StepNotifications />}
          {step === 4 && <StepTour />}
        </div>
      </div>
    </div>
  );
}
