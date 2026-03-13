/**
 * OnboardingWizard Component Tests
 * Phase 1 Sprint 4 - First-Run Onboarding Wizard
 *
 * Tests for 4-step onboarding flow:
 * 1. Welcome step - value proposition + CTA
 * 2. Profile step - name input + avatar picker
 * 3. Notifications step - permission request
 * 4. Tour step - 3 scam warning signs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingWizard from '../OnboardingWizard';
import * as notificationService from '../../utils/notificationService';

vi.mock('../../utils/notificationService', () => ({
  requestPermission: vi.fn().mockResolvedValue('granted'),
  getPermissionStatus: vi.fn(() => 'default'),
}));

const mockAuth = {
  isAuthenticated: true,
  user: { email: 'marie.dupont@example.com', sub: 'user-123' },
};

const mockProfile = {
  name: 'Mon Profil',
  avatar: '🛡️',
};

const mockOnComplete = vi.fn();
const mockOnSkip = vi.fn();

const renderWizard = (auth = mockAuth, profile = mockProfile) => {
  return render(
    <OnboardingWizard
      auth={auth}
      profile={profile}
      onComplete={mockOnComplete}
      onSkip={mockOnSkip}
    />
  );
};

describe('OnboardingWizard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ============================================================================
  // STEP 1: WELCOME
  // ============================================================================
  describe('Step 1: Welcome', () => {
    it('should render welcome heading and tagline', () => {
      renderWizard();
      expect(screen.getByText('Bienvenue dans ScamGuard')).toBeTruthy();
      expect(screen.getByText('Protégez-vous contre les arnaques en ligne')).toBeTruthy();
    });

    it('should render welcome CTA button "Commencer"', () => {
      renderWizard();
      expect(screen.getByText('Commencer →')).toBeTruthy();
    });

    it('should render skip link "Passer l\'introduction"', () => {
      renderWizard();
      expect(screen.getByText('Passer l\'introduction')).toBeTruthy();
    });

    it('should display step 1 progress dot as active', () => {
      const { container } = renderWizard();
      const dots = container.querySelectorAll('.progress-dot');
      expect(dots[0].classList.contains('active')).toBe(true);
      expect(dots[1].classList.contains('active')).toBe(false);
    });

    it('should skip wizard when skip link is clicked', () => {
      renderWizard();
      fireEvent.click(screen.getByText('Passer l\'introduction'));
      expect(mockOnSkip).toHaveBeenCalled();
      expect(localStorage.getItem('scamguard_onboarding_complete')).toBe('true');
    });

    it('should advance to step 2 when "Commencer" is clicked', () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      expect(screen.getByText('Configurez votre profil')).toBeTruthy();
    });

    it('should call onSkip when Escape is pressed on step 1', () => {
      renderWizard();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(mockOnSkip).toHaveBeenCalled();
    });

    it('should have dialog role and aria attributes', () => {
      renderWizard();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeTruthy();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-label')).toBe('Assistant de démarrage ScamGuard');
    });
  });

  // ============================================================================
  // STEP 2: PROFILE
  // ============================================================================
  describe('Step 2: Profile', () => {
    const advanceToStep2 = () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
    };

    it('should render profile heading', () => {
      advanceToStep2();
      expect(screen.getByText('Configurez votre profil')).toBeTruthy();
    });

    it('should pre-fill name from email prefix', () => {
      advanceToStep2();
      const input = screen.getByDisplayValue('marie.dupont');
      expect(input).toBeTruthy();
    });

    it('should pre-fill custom name if profile has custom name', () => {
      const customProfile = { ...mockProfile, name: 'Marie' };
      render(
        <OnboardingWizard
          auth={mockAuth}
          profile={customProfile}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );
      fireEvent.click(screen.getByText('Commencer →'));
      const input = screen.getByDisplayValue('Marie');
      expect(input).toBeTruthy();
    });

    it('should disable "Suivant" button when name is empty', () => {
      advanceToStep2();
      const input = screen.getByDisplayValue('marie.dupont');
      fireEvent.change(input, { target: { value: '' } });
      const nextButton = screen.getByText('Suivant →');
      expect(nextButton.disabled).toBe(true);
    });

    it('should disable "Suivant" button when name is only whitespace', () => {
      advanceToStep2();
      const input = screen.getByDisplayValue('marie.dupont');
      fireEvent.change(input, { target: { value: '   ' } });
      const nextButton = screen.getByText('Suivant →');
      expect(nextButton.disabled).toBe(true);
    });

    it('should enable "Suivant" button when name is valid', () => {
      advanceToStep2();
      const input = screen.getByDisplayValue('marie.dupont');
      fireEvent.change(input, { target: { value: 'Marie' } });
      const nextButton = screen.getByText('Suivant →');
      expect(nextButton.disabled).toBe(false);
    });

    it('should display all 5 avatar options', () => {
      advanceToStep2();
      expect(screen.getByText('🛡️')).toBeTruthy();
      expect(screen.getByText('👴')).toBeTruthy();
      expect(screen.getByText('👵')).toBeTruthy();
      expect(screen.getByText('🧑')).toBeTruthy();
      expect(screen.getByText('🦸')).toBeTruthy();
    });

    it('should mark selected avatar with .selected class', () => {
      const { container } = renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));

      // Get avatar picker buttons
      let avatarButtons = container.querySelectorAll('.onboarding-avatar-option');
      expect(avatarButtons.length).toBe(5);

      // First button (shield) should be selected
      expect(avatarButtons[0].classList.contains('selected')).toBe(true);

      // Click second button (grandpa)
      fireEvent.click(avatarButtons[1]);

      // Re-query buttons after state update
      avatarButtons = container.querySelectorAll('.onboarding-avatar-option');
      expect(avatarButtons[0].classList.contains('selected')).toBe(false);
      expect(avatarButtons[1].classList.contains('selected')).toBe(true);
    });

    it('should handle avatar selection', () => {
      const { container } = renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));

      let avatarButtons = container.querySelectorAll('.onboarding-avatar-option');
      // Click third button (grandma)
      fireEvent.click(avatarButtons[2]);

      // Re-query buttons after state update
      avatarButtons = container.querySelectorAll('.onboarding-avatar-option');
      expect(avatarButtons[2].classList.contains('selected')).toBe(true);
    });

    it('should display age group radio options (optional)', () => {
      advanceToStep2();
      expect(screen.getByLabelText('60-70 ans')).toBeTruthy();
      expect(screen.getByLabelText('70-80 ans')).toBeTruthy();
      expect(screen.getByLabelText('80+ ans')).toBeTruthy();
    });

    it('should allow age group selection', () => {
      advanceToStep2();
      const radio = screen.getByLabelText('70-80 ans');
      fireEvent.click(radio);
      expect(radio.checked).toBe(true);
    });

    it('should display step 2 progress dots as active', () => {
      advanceToStep2();
      const { container } = renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      const dots = container.querySelectorAll('.progress-dot');
      expect(dots[0].classList.contains('active')).toBe(true);
      expect(dots[1].classList.contains('active')).toBe(true);
      expect(dots[2].classList.contains('active')).toBe(false);
    });

    it('should advance to step 3 when "Suivant" is clicked with valid name', () => {
      advanceToStep2();
      const button = screen.getByText('Suivant →');
      fireEvent.click(button);
      expect(screen.getByText('Activez les notifications')).toBeTruthy();
    });

    it('should call onSkip when Escape is pressed on step 2', () => {
      advanceToStep2();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(mockOnSkip).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // STEP 3: NOTIFICATIONS
  // ============================================================================
  describe('Step 3: Notifications', () => {
    const advanceToStep3 = async () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      fireEvent.change(screen.getByDisplayValue('marie.dupont'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByText('Suivant →'));
    };

    it('should render notifications heading', async () => {
      await advanceToStep3();
      expect(screen.getByText('Activez les notifications')).toBeTruthy();
    });

    it('should display permission button "Activer les notifications"', async () => {
      await advanceToStep3();
      expect(screen.getByText('Activer les notifications')).toBeTruthy();
    });

    it('should display "Plus tard" link', async () => {
      await advanceToStep3();
      expect(screen.getByText('Plus tard')).toBeTruthy();
    });

    it('should display 3 bullet points explaining benefits', async () => {
      await advanceToStep3();
      expect(
        screen.getByText('Alertes en temps réel pour les analyses suspectes')
      ).toBeTruthy();
      expect(
        screen.getByText('Rappels quotidiens pour apprendre de nouveaux modules')
      ).toBeTruthy();
      expect(screen.getByText('Conseils de sécurité personnalisés')).toBeTruthy();
    });

    it('should call requestPermission when permission button is clicked', async () => {
      await advanceToStep3();
      fireEvent.click(screen.getByText('Activer les notifications'));
      expect(notificationService.requestPermission).toHaveBeenCalled();
    });

    it('should show granted status after permission granted', async () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      fireEvent.change(screen.getByDisplayValue('marie.dupont'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByText('Suivant →'));

      // Mock the request to return granted
      notificationService.requestPermission.mockResolvedValueOnce('granted');
      const button = screen.getByText('Activer les notifications');
      fireEvent.click(button);

      // Wait for async state update
      await waitFor(
        () => {
          expect(
            screen.queryByText('✅ Notifications activées avec succès!')
          ).toBeTruthy();
        },
        { timeout: 500 }
      );
    });

    it('should show denied status after permission denied', async () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      fireEvent.change(screen.getByDisplayValue('marie.dupont'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByText('Suivant →'));

      notificationService.requestPermission.mockResolvedValueOnce('denied');
      const button = screen.getByText('Activer les notifications');
      fireEvent.click(button);

      await waitFor(
        () => {
          expect(
            screen.queryByText(
              /Notifications refusées. Vous pouvez les activer plus tard dans les paramètres./
            )
          ).toBeTruthy();
        },
        { timeout: 500 }
      );
    });

    it('should display "Continuer" button after permission response', async () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      fireEvent.change(screen.getByDisplayValue('marie.dupont'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByText('Suivant →'));

      notificationService.requestPermission.mockResolvedValueOnce('granted');
      const button = screen.getByText('Activer les notifications');
      fireEvent.click(button);

      await waitFor(
        () => {
          expect(screen.queryByText('Continuer →')).toBeTruthy();
        },
        { timeout: 500 }
      );
    });

    it('should advance to step 4 when "Plus tard" is clicked', async () => {
      await advanceToStep3();
      fireEvent.click(screen.getByText('Plus tard'));
      expect(screen.getByText('Hameçonnage par SMS')).toBeTruthy();
    });

    it('should advance to step 4 when "Continuer" is clicked after permission', async () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      fireEvent.change(screen.getByDisplayValue('marie.dupont'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByText('Suivant →'));

      notificationService.requestPermission.mockResolvedValueOnce('granted');
      const button = screen.getByText('Activer les notifications');
      fireEvent.click(button);

      await waitFor(
        () => {
          expect(screen.queryByText('Continuer →')).toBeTruthy();
        },
        { timeout: 500 }
      );

      fireEvent.click(screen.getByText('Continuer →'));
      expect(screen.getByText('Hameçonnage par SMS')).toBeTruthy();
    });

    it('should call onSkip when Escape is pressed on step 3', async () => {
      await advanceToStep3();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(mockOnSkip).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // STEP 4: TOUR
  // ============================================================================
  describe('Step 4: Tour', () => {
    const advanceToStep4 = async () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      fireEvent.change(screen.getByDisplayValue('marie.dupont'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByText('Suivant →'));
      fireEvent.click(screen.getByText('Plus tard'));
    };

    it('should render tour heading', async () => {
      await advanceToStep4();
      expect(screen.getByText('Hameçonnage par SMS')).toBeTruthy();
    });

    it('should display first tour card content', async () => {
      await advanceToStep4();
      expect(screen.getByText('📱')).toBeTruthy();
      expect(screen.getByText('Hameçonnage par SMS')).toBeTruthy();
      expect(
        screen.getByText('Les vraies banques ne demandent jamais votre NIP par SMS.')
      ).toBeTruthy();
    });

    it('should display counter "Étape 1 sur 3"', async () => {
      await advanceToStep4();
      expect(screen.getByText(/Étape 1 sur 3/)).toBeTruthy();
    });

    it('should display "Suivant" button on first card', async () => {
      await advanceToStep4();
      expect(screen.getByText('Suivant')).toBeTruthy();
    });

    it('should advance to card 2 when "Suivant" is clicked', async () => {
      await advanceToStep4();
      fireEvent.click(screen.getByText('Suivant'));
      expect(screen.getByText('Faux support technique')).toBeTruthy();
      expect(
        screen.getByText('Microsoft et Apple ne vous appellent JAMAIS à l\'improviste.')
      ).toBeTruthy();
      expect(screen.getByText('💻')).toBeTruthy();
    });

    it('should display counter "Étape 2 sur 3"', async () => {
      await advanceToStep4();
      fireEvent.click(screen.getByText('Suivant'));
      expect(screen.getByText(/Étape 2 sur 3/)).toBeTruthy();
    });

    it('should advance to card 3 when "Suivant" is clicked again', async () => {
      await advanceToStep4();
      fireEvent.click(screen.getByText('Suivant'));
      fireEvent.click(screen.getByText('Suivant'));
      expect(screen.getByText('Arnaques aux achats')).toBeTruthy();
      expect(
        screen.getByText(
          'Si le prix semble trop beau pour être vrai, c\'est probablement une arnaque.'
        )
      ).toBeTruthy();
      expect(screen.getByText('🛒')).toBeTruthy();
    });

    it('should display counter "Étape 3 sur 3"', async () => {
      await advanceToStep4();
      fireEvent.click(screen.getByText('Suivant'));
      fireEvent.click(screen.getByText('Suivant'));
      expect(screen.getByText(/Étape 3 sur 3/)).toBeTruthy();
    });

    it('should display "Terminer →" button on last card', async () => {
      await advanceToStep4();
      fireEvent.click(screen.getByText('Suivant'));
      fireEvent.click(screen.getByText('Suivant'));
      expect(screen.getByText('Terminer →')).toBeTruthy();
    });

    it('should call onComplete with name and avatar when "Terminer" is clicked', async () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      fireEvent.change(screen.getByDisplayValue('marie.dupont'), {
        target: { value: 'Marie' },
      });

      // Select a different avatar
      fireEvent.click(screen.getByText('👵'));

      fireEvent.click(screen.getByText('Suivant →'));
      fireEvent.click(screen.getByText('Plus tard'));
      fireEvent.click(screen.getByText('Suivant'));
      fireEvent.click(screen.getByText('Suivant'));
      fireEvent.click(screen.getByText('Terminer →'));

      expect(mockOnComplete).toHaveBeenCalledWith('Marie', '👵');
      expect(localStorage.getItem('scamguard_onboarding_complete')).toBe('true');
    });

    it('should save age group to localStorage if selected', async () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      fireEvent.change(screen.getByDisplayValue('marie.dupont'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByLabelText('70-80 ans'));
      fireEvent.click(screen.getByText('Suivant →'));
      fireEvent.click(screen.getByText('Plus tard'));
      fireEvent.click(screen.getByText('Suivant'));
      fireEvent.click(screen.getByText('Suivant'));
      fireEvent.click(screen.getByText('Terminer →'));

      expect(localStorage.getItem('scamguard_age_group')).toBe('70-80');
    });

    it('should not save age group if not selected', async () => {
      await advanceToStep4();
      fireEvent.click(screen.getByText('Suivant'));
      fireEvent.click(screen.getByText('Suivant'));
      fireEvent.click(screen.getByText('Terminer →'));

      expect(localStorage.getItem('scamguard_age_group')).toBeFalsy();
    });

    it('should display all 4 progress dots as active on step 4', async () => {
      await advanceToStep4();
      const { container } = renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      fireEvent.change(screen.getByDisplayValue('marie.dupont'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByText('Suivant →'));
      fireEvent.click(screen.getByText('Plus tard'));

      const dots = container.querySelectorAll('.progress-dot');
      expect(dots[0].classList.contains('active')).toBe(true);
      expect(dots[1].classList.contains('active')).toBe(true);
      expect(dots[2].classList.contains('active')).toBe(true);
      expect(dots[3].classList.contains('active')).toBe(true);
    });

    it('should NOT call onSkip when Escape is pressed on step 4', async () => {
      await advanceToStep4();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(mockOnSkip).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================
  describe('Accessibility', () => {
    it('should have dialog role with aria-modal and aria-label', () => {
      renderWizard();
      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-label')).toBe('Assistant de démarrage ScamGuard');
    });

    it('should hide progress dots from screen readers', () => {
      const { container } = renderWizard();
      const progress = container.querySelector('.onboarding-progress');
      expect(progress.getAttribute('aria-hidden')).toBe('true');
    });

    it('should announce tour counter with aria-live', async () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      fireEvent.change(screen.getByDisplayValue('marie.dupont'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByText('Suivant →'));
      fireEvent.click(screen.getByText('Plus tard'));

      const counter = screen.getByText(/Étape 1 sur 3/);
      expect(counter.getAttribute('aria-live')).toBe('polite');
    });

    it('should have label for name input', async () => {
      renderWizard();
      fireEvent.click(screen.getByText('Commencer →'));
      const label = screen.getByText('Votre prénom :');
      expect(label).toBeTruthy();
      const input = screen.getByDisplayValue('marie.dupont');
      expect(input.id).toBe('onboarding-name');
    });

    it('should have focus management on panel', () => {
      const { container } = renderWizard();
      const panel = container.querySelector('.onboarding-panel');
      expect(panel.getAttribute('tabindex')).toBe('-1');
    });
  });
});
