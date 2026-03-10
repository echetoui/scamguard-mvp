/**
 * ModernAuthPage Component Tests
 * Phase 6 - Coverage Expansion Continuation
 *
 * Tests for professional landing and authentication page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModernAuthPage from '../ModernAuthPage';

// Mock SMSAuthScreen component
vi.mock('../SMSAuthScreen', () => ({
  default: () => <div className="sms-auth-screen">SMS Auth Screen</div>
}));

describe('ModernAuthPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation Bar', () => {
    it('should render navigation bar', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.querySelector('.auth-navbar')).toBeTruthy();
    });

    it('should display brand icon', () => {
      const { container } = render(<ModernAuthPage />);

      const brandIcon = container.querySelector('.brand-icon');
      expect(brandIcon.textContent).toBe('🛡️');
    });

    it('should display brand name', () => {
      const { container } = render(<ModernAuthPage />);

      const brandName = container.querySelector('.brand-name');
      expect(brandName.textContent).toBe('ScamGuard');
    });

    it('should have login button in navbar', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('Se connecter')).toBeTruthy();
    });

    it('should have aria-label on login button', () => {
      const { container } = render(<ModernAuthPage />);

      const loginBtn = screen.getByText('Se connecter');
      expect(loginBtn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Hero Section', () => {
    it('should render hero section', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.querySelector('.hero-section')).toBeTruthy();
    });

    it('should display badge text', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('🚀 Nouvelle génération de sécurité')).toBeTruthy();
    });

    it('should display hero title', () => {
      const { container } = render(<ModernAuthPage />);

      const heroTitle = container.querySelector('.hero-title');
      expect(heroTitle.textContent).toContain('Protégez-vous contre les');
    });

    it('should have gradient text in title', () => {
      const { container } = render(<ModernAuthPage />);

      const gradientText = container.querySelector('.gradient-text');
      expect(gradientText).toBeTruthy();
      expect(gradientText.textContent).toBe('arnaques');
    });

    it('should display hero subtitle', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText(/ScamGuard utilise l\'intelligence artificielle/)).toBeTruthy();
    });

    it('should have primary CTA button', () => {
      render(<ModernAuthPage />);

      const buttons = screen.getAllByText('Commencer maintenant');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have secondary CTA button', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText(/En savoir plus/)).toBeTruthy();
    });

    it('should have CTA arrow in primary button', () => {
      const { container } = render(<ModernAuthPage />);

      const arrows = container.querySelectorAll('.cta-arrow');
      expect(arrows.length).toBeGreaterThan(0);
    });
  });

  describe('Trust Badges', () => {
    it('should display trust badges section', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.querySelector('.trust-badges')).toBeTruthy();
    });

    it('should display security badge', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('100% Sécurisé')).toBeTruthy();
    });

    it('should display SSL encryption badge', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('Chiffrement SSL')).toBeTruthy();
    });

    it('should display real-time detection badge', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('Detection Temps Réel')).toBeTruthy();
    });

    it('should have three badges total', () => {
      const { container } = render(<ModernAuthPage />);

      const badges = container.querySelectorAll('.badge');
      expect(badges.length).toBe(3);
    });
  });

  describe('Visual Cards', () => {
    it('should display shield card', () => {
      const { container } = render(<ModernAuthPage />);

      const shieldCard = container.querySelector('.shield-card');
      expect(shieldCard.textContent).toContain('Protection Active');
    });

    it('should display AI card', () => {
      const { container } = render(<ModernAuthPage />);

      const aiCard = container.querySelector('.ai-card');
      expect(aiCard.textContent).toContain('IA Intelligente');
    });

    it('should display results card', () => {
      const { container } = render(<ModernAuthPage />);

      const checkCard = container.querySelector('.check-card');
      expect(checkCard.textContent).toContain('Résultats Instantanés');
    });

    it('should have correct icons in cards', () => {
      const { container } = render(<ModernAuthPage />);

      const shieldCard = container.querySelector('.shield-card');
      const aiCard = container.querySelector('.ai-card');
      const checkCard = container.querySelector('.check-card');

      expect(shieldCard.textContent).toContain('🛡️'); // Shield
      expect(aiCard.textContent).toContain('🤖'); // AI
      expect(checkCard.textContent).toContain('✓');  // Check
    });
  });

  describe('Features Section', () => {
    it('should render features section', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.querySelector('.features-section')).toBeTruthy();
    });

    it('should display features title', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('Pourquoi choisir ScamGuard?')).toBeTruthy();
    });

    it('should display detection feature', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('Détection Avancée')).toBeTruthy();
    });

    it('should display multi-channel feature', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('Multi-Canal')).toBeTruthy();
    });

    it('should display reports feature', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('Rapports Détaillés')).toBeTruthy();
    });

    it('should display training feature', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('Formation Continue')).toBeTruthy();
    });

    it('should display worldwide support feature', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('Support Mondial')).toBeTruthy();
    });

    it('should display ease of use feature', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('Facile à Utiliser')).toBeTruthy();
    });

    it('should have six feature cards', () => {
      const { container } = render(<ModernAuthPage />);

      const cards = container.querySelectorAll('.feature-card');
      expect(cards.length).toBe(6);
    });
  });

  describe('Stats Section', () => {
    it('should render stats section', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.querySelector('.stats-section')).toBeTruthy();
    });

    it('should display user count stat', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('50K+')).toBeTruthy();
      expect(screen.getByText('Utilisateurs Protégés')).toBeTruthy();
    });

    it('should display scams blocked stat', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('1M+')).toBeTruthy();
      expect(screen.getByText('Arnaques Bloquées')).toBeTruthy();
    });

    it('should display detection rate stat', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('99.9%')).toBeTruthy();
      expect(screen.getByText('Taux de Détection')).toBeTruthy();
    });

    it('should display 24/7 protection stat', () => {
      const { container } = render(<ModernAuthPage />);

      const stats = container.querySelectorAll('.stat');
      const lastStat = stats[stats.length - 1];
      expect(lastStat.textContent).toContain('24/7');
      expect(lastStat.textContent).toContain('Protection Active');
    });

    it('should have four stats total', () => {
      const { container } = render(<ModernAuthPage />);

      const stats = container.querySelectorAll('.stat');
      expect(stats.length).toBe(4);
    });
  });

  describe('Final CTA Section', () => {
    it('should render final CTA section', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.querySelector('.final-cta-section')).toBeTruthy();
    });

    it('should display CTA heading', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText('Prêt à vous protéger?')).toBeTruthy();
    });

    it('should display CTA description', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText(/Créez votre compte gratuit/)).toBeTruthy();
    });

    it('should have free account button', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText(/Créer un Compte Gratuit/)).toBeTruthy();
    });
  });

  describe('Footer', () => {
    it('should render footer', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.querySelector('.auth-footer-section')).toBeTruthy();
    });

    it('should display footer brand name', () => {
      const { container } = render(<ModernAuthPage />);

      const footerCols = container.querySelectorAll('.footer-col');
      expect(footerCols[0].textContent).toContain('ScamGuard');
    });

    it('should display footer brand description', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText(/Protégez-vous contre les arnaques/)).toBeTruthy();
    });

    it('should have resources section', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.textContent).toContain('Ressources');
    });

    it('should have legal section', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.textContent).toContain('Légal');
    });

    it('should have copyright notice', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText(/2026 ScamGuard/)).toBeTruthy();
    });

    it('should have footer links', () => {
      const { container } = render(<ModernAuthPage />);

      const links = container.querySelectorAll('a');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Button Interactions', () => {
    it('should show auth screen when navbar login clicked', () => {
      const { container } = render(<ModernAuthPage />);

      const loginBtn = screen.getByText('Se connecter');
      fireEvent.click(loginBtn);

      expect(container.querySelector('.sms-auth-screen')).toBeTruthy();
    });

    it('should show auth screen when hero CTA clicked', () => {
      const { container } = render(<ModernAuthPage />);

      const ctaButtons = screen.getAllByText('Commencer maintenant');
      fireEvent.click(ctaButtons[0]);

      expect(container.querySelector('.sms-auth-screen')).toBeTruthy();
    });

    it('should show auth screen when final CTA clicked', () => {
      const { container } = render(<ModernAuthPage />);

      const finalCtaBtn = screen.getByText(/Créer un Compte Gratuit/);
      fireEvent.click(finalCtaBtn);

      expect(container.querySelector('.sms-auth-screen')).toBeTruthy();
    });

    it('should hide landing page when showing auth', () => {
      const { container } = render(<ModernAuthPage />);

      const loginBtn = screen.getByText('Se connecter');
      fireEvent.click(loginBtn);

      expect(container.querySelector('.modern-auth-page')).toBeFalsy();
    });
  });

  describe('Learn More Button', () => {
    it('should have learn more button', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText(/En savoir plus/)).toBeTruthy();
    });

    it('should have aria-label on learn more button', () => {
      const { container } = render(<ModernAuthPage />);

      const learnMoreBtn = screen.getByText(/En savoir plus/);
      expect(learnMoreBtn.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have info icon in learn more', () => {
      render(<ModernAuthPage />);

      expect(screen.getByText(/ℹ️/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(<ModernAuthPage />);

      const h2s = container.querySelectorAll('h2');
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('should have descriptive aria labels on buttons', () => {
      render(<ModernAuthPage />);

      const buttonsWithLabels = screen.getAllByRole('button');
      const labelsPresent = buttonsWithLabels.some(btn =>
        btn.getAttribute('aria-label')
      );
      expect(labelsPresent).toBe(true);
    });

    it('should have semantic footer structure', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.querySelector('footer')).toBeTruthy();
    });

    it('should have aria-hidden on decorative elements', () => {
      const { container } = render(<ModernAuthPage />);

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });

  describe('Sections Visibility', () => {
    it('should display main page container', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.querySelector('.modern-auth-page')).toBeTruthy();
    });

    it('should display all main sections', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.querySelector('.auth-navbar')).toBeTruthy();
      expect(container.querySelector('.hero-section')).toBeTruthy();
      expect(container.querySelector('.features-section')).toBeTruthy();
      expect(container.querySelector('.stats-section')).toBeTruthy();
      expect(container.querySelector('.final-cta-section')).toBeTruthy();
      expect(container.querySelector('.auth-footer-section')).toBeTruthy();
    });
  });

  describe('Conditional Rendering', () => {
    it('should render landing page initially', () => {
      const { container } = render(<ModernAuthPage />);

      expect(container.querySelector('.modern-auth-page')).toBeTruthy();
      expect(container.querySelector('.sms-auth-screen')).toBeFalsy();
    });

    it('should render SMS auth screen when showAuth is true', () => {
      const { container } = render(<ModernAuthPage />);

      const loginBtn = screen.getByText('Se connecter');
      fireEvent.click(loginBtn);

      expect(container.querySelector('.sms-auth-screen')).toBeTruthy();
    });

    it('should not render landing sections when showing auth', () => {
      const { container } = render(<ModernAuthPage />);

      const loginBtn = screen.getByText('Se connecter');
      fireEvent.click(loginBtn);

      expect(container.querySelector('.hero-section')).toBeFalsy();
    });
  });
});
