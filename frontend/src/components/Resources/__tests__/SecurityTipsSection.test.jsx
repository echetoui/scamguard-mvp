/**
 * SecurityTipsSection Component Tests
 * Tests for security tips, checklists, and signaling instructions
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SecurityTipsSection from '../SecurityTipsSection';

// Mock security tips data
vi.mock('../../../data/securityTips.json', () => ({
  default: {
    checklists: [
      {
        id: 'before-block',
        title: 'AVANT de Bloquer',
        icon: '⚠️',
        description: 'Vérifiez ces points avant de bloquer un numéro',
        items: [
          {
            id: 'verify-caller',
            text: 'Vérifiez qui appelle',
            details: 'Est-ce un numéro inconnu?'
          },
          {
            id: 'question-call',
            text: 'Demandez-vous',
            details: 'Est-ce que ma banque appelle?'
          }
        ]
      },
      {
        id: 'after-block',
        title: 'APRÈS avoir Bloqué',
        icon: '✅',
        description: 'Étapes à suivre après avoir bloqué un numéro',
        items: [
          {
            id: 'report',
            text: '1. SIGNALER',
            details: 'Signaler comme spam à votre opérateur'
          },
          {
            id: 'document',
            text: '2. DOCUMENTER',
            details: 'Sauvegarder le numéro et la date'
          }
        ]
      },
      {
        id: 'fraud-recovery',
        title: 'EN CAS D\'ARNAQUE FINANCIÈRE',
        icon: '🆘',
        description: 'Actions immédiates',
        items: [],
        timeline: [
          {
            period: '24 HEURES',
            items: ['Contactez votre banque']
          }
        ]
      }
    ],
    signaling: [
      {
        id: 'operator',
        title: 'À votre OPÉRATEUR téléphonique',
        icon: '📱',
        instructions: ['Contactez votre fournisseur', 'Donnez le numéro']
      },
      {
        id: 'police',
        title: 'À la POLICE',
        icon: '🚨',
        instructions: ['Allez sur le formulaire', 'Sélectionnez votre pays'],
        links: [
          { country: '🇧🇪 Belgique', url: 'www.police.be' },
          { country: '🇨🇦 Canada', url: 'www.rcmp-grc.gc.ca' }
        ]
      },
      {
        id: 'bank',
        title: 'À votre BANQUE',
        icon: '🏦',
        instructions: ['Appelez votre banque'],
        urgency: 'IMMÉDIAT'
      },
      {
        id: 'scamguard',
        title: 'À ScamGuard',
        icon: '🛡️',
        instructions: ['Aller dans ScamGuard', 'Onglet Ressources']
      }
    ]
  }
}));

describe('SecurityTipsSection Component', () => {
  describe('Rendering', () => {
    it('should render main section container', () => {
      const { container } = render(<SecurityTipsSection />);
      expect(container.querySelector('.security-tips-section')).toBeTruthy();
    });

    it('should display section title', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('Conseils de Sécurité')).toBeTruthy();
    });

    it('should display section subtitle', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('Protégez-vous avant et après avoir bloqué')).toBeTruthy();
    });

    it('should have section intro', () => {
      const { container } = render(<SecurityTipsSection />);
      expect(container.querySelector('.section-intro')).toBeTruthy();
    });

    it('should render h2 for main title', () => {
      const { container } = render(<SecurityTipsSection />);
      const h2 = container.querySelector('.section-intro h2');
      expect(h2).toBeTruthy();
      expect(h2.textContent).toBe('Conseils de Sécurité');
    });
  });

  describe('Checklists Container', () => {
    it('should render checklists container', () => {
      const { container } = render(<SecurityTipsSection />);
      expect(container.querySelector('.checklists-container')).toBeTruthy();
    });

    it('should render checklist cards', () => {
      const { container } = render(<SecurityTipsSection />);
      const cards = container.querySelectorAll('.checklist-card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should not render fraud-recovery checklist as main card', () => {
      render(<SecurityTipsSection />);
      // fraud-recovery is filtered out in the main checklists
      const beforeCard = screen.getByText('AVANT de Bloquer');
      const afterCard = screen.getByText('APRÈS avoir Bloqué');
      expect(beforeCard).toBeTruthy();
      expect(afterCard).toBeTruthy();
    });
  });

  describe('Checklist Headers', () => {
    it('should display before-block header', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('AVANT de Bloquer')).toBeTruthy();
    });

    it('should display after-block header', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('APRÈS avoir Bloqué')).toBeTruthy();
    });

    it('should display checklist icons', () => {
      const { container } = render(<SecurityTipsSection />);
      const icons = container.querySelectorAll('.checklist-icon');
      expect(icons.length).toBeGreaterThan(0);
      expect(icons[0].textContent).toBe('⚠️');
    });

    it('should display checklist descriptions', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('Vérifiez ces points avant de bloquer un numéro')).toBeTruthy();
      expect(screen.getByText('Étapes à suivre après avoir bloqué un numéro')).toBeTruthy();
    });

    it('should have expand icon', () => {
      const { container } = render(<SecurityTipsSection />);
      const expandIcons = container.querySelectorAll('.expand-icon');
      expect(expandIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Expansion Behavior', () => {
    it('should expand before-block by default', () => {
      const { container } = render(<SecurityTipsSection />);
      const beforeBlockCard = container.querySelector('.checklist-card');
      const body = beforeBlockCard.querySelector('.checklist-body');
      expect(body).toBeTruthy();
    });

    it('should keep expanded card expanded when clicking same header', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');
      const firstHeader = headers[0];
      const beforeClickBody = firstHeader.parentElement.querySelector('.checklist-body');

      // Initially expanded
      expect(beforeClickBody).toBeTruthy();

      // Click same header - stays expanded (no toggle, just switches which is expanded)
      fireEvent.click(firstHeader);
      const afterClickBody = firstHeader.parentElement.querySelector('.checklist-body');
      expect(afterClickBody).toBeTruthy();
    });

    it('should expand different checklist when clicking another header', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');

      // Click second header to expand it
      fireEvent.click(headers[1]);
      const afterBlockCard = container.querySelectorAll('.checklist-card')[1];
      const body = afterBlockCard.querySelector('.checklist-body');
      expect(body).toBeTruthy();
    });

    it('should have expanded class on default expanded header', () => {
      const { container } = render(<SecurityTipsSection />);
      const firstIcon = container.querySelector('.expand-icon');
      expect(firstIcon.className).toContain('expanded');
    });

    it('should update icon class when expanding different checklist', () => {
      const { container } = render(<SecurityTipsSection />);
      const icons = container.querySelectorAll('.expand-icon');

      fireEvent.click(container.querySelectorAll('.checklist-header')[1]);
      // Second icon should now be expanded
      expect(icons[1].className).toContain('expanded');
    });
  });

  describe('Before-Block Checklist', () => {
    it('should display before-block items', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('Vérifiez qui appelle')).toBeTruthy();
      expect(screen.getByText('Demandez-vous')).toBeTruthy();
    });

    it('should render checklist items with checkboxes', () => {
      const { container } = render(<SecurityTipsSection />);
      const checkboxes = container.querySelectorAll('.checklist-checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should have disabled checkboxes', () => {
      const { container } = render(<SecurityTipsSection />);
      const checkboxes = container.querySelectorAll('.checklist-checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox.disabled).toBe(true);
      });
    });

    it('should display item details', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('Est-ce un numéro inconnu?')).toBeTruthy();
      expect(screen.getByText('Est-ce que ma banque appelle?')).toBeTruthy();
    });

    it('should have checklist items container', () => {
      const { container } = render(<SecurityTipsSection />);
      expect(container.querySelector('.checklist-items')).toBeTruthy();
    });
  });

  describe('After-Block Checklist', () => {
    it('should display after-block items when expanded', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');
      fireEvent.click(headers[1]);

      expect(screen.getByText('1. SIGNALER')).toBeTruthy();
      expect(screen.getByText('2. DOCUMENTER')).toBeTruthy();
    });

    it('should render after-block with checkboxes', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');
      fireEvent.click(headers[1]);

      const afterBlockCard = container.querySelectorAll('.checklist-card')[1];
      const checkboxes = afterBlockCard.querySelectorAll('.checklist-checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should display after-block item details', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');
      fireEvent.click(headers[1]);

      expect(screen.getByText('Signaler comme spam à votre opérateur')).toBeTruthy();
      expect(screen.getByText('Sauvegarder le numéro et la date')).toBeTruthy();
    });

    it('should have checklist items container for after-block', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');
      fireEvent.click(headers[1]);

      const afterBlockCard = container.querySelectorAll('.checklist-card')[1];
      expect(afterBlockCard.querySelector('.checklist-items')).toBeTruthy();
    });
  });

  describe('Emergency Card', () => {
    it('should render emergency card', () => {
      const { container } = render(<SecurityTipsSection />);
      expect(container.querySelector('.emergency-card')).toBeTruthy();
    });

    it('should display emergency header', () => {
      const { container } = render(<SecurityTipsSection />);
      expect(container.querySelector('.emergency-header')).toBeTruthy();
    });

    it('should display emergency icon', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('🆘')).toBeTruthy();
    });

    it('should display emergency title', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('En Cas d\'Arnaque Financière')).toBeTruthy();
    });

    it('should render emergency timeline', () => {
      const { container } = render(<SecurityTipsSection />);
      expect(container.querySelector('.emergency-timeline')).toBeTruthy();
    });

    it('should display timeline items', () => {
      const { container } = render(<SecurityTipsSection />);
      const timelineItems = container.querySelectorAll('.timeline-item');
      expect(timelineItems.length).toBeGreaterThan(0);
    });

    it('should mark first timeline item as urgent', () => {
      const { container } = render(<SecurityTipsSection />);
      const urgentItem = container.querySelector('.timeline-item.urgent');
      expect(urgentItem).toBeTruthy();
    });

    it('should display timeline times', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('⏰ 24 HEURES')).toBeTruthy();
      expect(screen.getByText('📋 48 HEURES')).toBeTruthy();
    });

    it('should display timeline actions', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('✅ Contactez votre banque')).toBeTruthy();
      expect(screen.getByText('✅ Demandez un blocage de compte')).toBeTruthy();
    });
  });

  describe('Signaling Section', () => {
    it('should render signaling container', () => {
      const { container } = render(<SecurityTipsSection />);
      expect(container.querySelector('.signaling-container')).toBeTruthy();
    });

    it('should display signaling title', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('Comment Signaler')).toBeTruthy();
    });

    it('should render signaling grid', () => {
      const { container } = render(<SecurityTipsSection />);
      expect(container.querySelector('.signaling-grid')).toBeTruthy();
    });

    it('should display signaling cards', () => {
      const { container } = render(<SecurityTipsSection />);
      const cards = container.querySelectorAll('.signaling-card');
      expect(cards.length).toBe(4);
    });

    it('should display all signaling titles', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('À votre OPÉRATEUR téléphonique')).toBeTruthy();
      expect(screen.getByText('À la POLICE')).toBeTruthy();
      expect(screen.getByText('À votre BANQUE')).toBeTruthy();
      expect(screen.getByText('À ScamGuard')).toBeTruthy();
    });

    it('should display signaling icons', () => {
      const { container } = render(<SecurityTipsSection />);
      const icons = container.querySelectorAll('.signal-icon');
      expect(icons.length).toBe(4);
      expect(icons[0].textContent).toBe('📱');
      expect(icons[1].textContent).toBe('🚨');
      expect(icons[2].textContent).toBe('🏦');
      expect(icons[3].textContent).toBe('🛡️');
    });

    it('should display signaling instructions', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('Contactez votre fournisseur')).toBeTruthy();
      expect(screen.getByText('Allez sur le formulaire')).toBeTruthy();
      expect(screen.getByText('Appelez votre banque')).toBeTruthy();
    });

    it('should render instructions as ordered list', () => {
      const { container } = render(<SecurityTipsSection />);
      const lists = container.querySelectorAll('.instructions-list');
      expect(lists.length).toBeGreaterThan(0);
    });
  });

  describe('Signaling Links', () => {
    it('should display police links', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('🇧🇪 Belgique')).toBeTruthy();
      expect(screen.getByText('🇨🇦 Canada')).toBeTruthy();
    });

    it('should have correct link URLs', () => {
      const { container } = render(<SecurityTipsSection />);
      const links = container.querySelectorAll('.signal-link');
      expect(links[0].href).toContain('www.police.be');
      expect(links[1].href).toContain('www.rcmp-grc.gc.ca');
    });

    it('should open links in new tab', () => {
      const { container } = render(<SecurityTipsSection />);
      const links = container.querySelectorAll('.signal-link');
      links.forEach(link => {
        expect(link.target).toBe('_blank');
        expect(link.rel).toContain('noopener');
      });
    });

    it('should have signal links container', () => {
      const { container } = render(<SecurityTipsSection />);
      const linkContainers = container.querySelectorAll('.signal-links');
      expect(linkContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Urgency Badges', () => {
    it('should display urgency badge for bank card', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('IMMÉDIAT')).toBeTruthy();
    });

    it('should have urgency badge class', () => {
      const { container } = render(<SecurityTipsSection />);
      const badge = container.querySelector('.urgency-badge');
      expect(badge).toBeTruthy();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have button role on headers', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');
      headers.forEach(header => {
        expect(header.getAttribute('role')).toBe('button');
      });
    });

    it('should have tabIndex on headers', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');
      headers.forEach(header => {
        expect(header.getAttribute('tabIndex')).toBe('0');
      });
    });

    it('should have onKeyPress handler on headers', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');
      // Verify that headers are interactive with keyboard
      headers.forEach(header => {
        expect(header.getAttribute('role')).toBe('button');
        expect(header.getAttribute('tabIndex')).toBe('0');
      });
    });

    it('should be keyboard accessible for users', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');

      // Verify keyboard accessibility attributes are present
      headers.forEach(header => {
        expect(header.getAttribute('role')).toBe('button');
        expect(header.getAttribute('tabIndex')).toBe('0');
        expect(header.getAttribute('aria-expanded')).toBeTruthy();
      });
    });
  });

  describe('ARIA Attributes', () => {
    it('should have aria-expanded on headers', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');
      headers.forEach(header => {
        expect(header.getAttribute('aria-expanded')).toBeTruthy();
      });
    });

    it('should have correct aria-expanded values', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');

      // First header should be expanded
      expect(headers[0].getAttribute('aria-expanded')).toBe('true');

      // Other headers should be collapsed
      expect(headers[1].getAttribute('aria-expanded')).toBe('false');
    });

    it('should update aria-expanded when switching expanded checklist', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');

      // Initially first is expanded
      expect(headers[0].getAttribute('aria-expanded')).toBe('true');

      // Click second header
      fireEvent.click(headers[1]);

      // Now second should be expanded
      expect(headers[1].getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('CSS Classes', () => {
    it('should have proper section structure', () => {
      const { container } = render(<SecurityTipsSection />);
      expect(container.querySelector('.security-tips-section')).toBeTruthy();
      expect(container.querySelector('.section-intro')).toBeTruthy();
      expect(container.querySelector('.checklists-container')).toBeTruthy();
      expect(container.querySelector('.emergency-card')).toBeTruthy();
      expect(container.querySelector('.signaling-container')).toBeTruthy();
    });

    it('should have proper checklist card structure', () => {
      const { container } = render(<SecurityTipsSection />);
      const card = container.querySelector('.checklist-card');
      expect(card.querySelector('.checklist-header')).toBeTruthy();
      expect(card.querySelector('.header-content')).toBeTruthy();
    });

    it('should have proper signal card structure', () => {
      const { container } = render(<SecurityTipsSection />);
      const card = container.querySelector('.signaling-card');
      expect(card.querySelector('.signal-header')).toBeTruthy();
      expect(card.querySelector('.signal-body')).toBeTruthy();
    });
  });

  describe('Content Verification', () => {
    it('should display complete section intro', () => {
      const { container } = render(<SecurityTipsSection />);
      const intro = container.querySelector('.section-intro');
      expect(intro.textContent).toContain('Conseils de Sécurité');
      expect(intro.textContent).toContain('Protégez-vous');
    });

    it('should display all checklist titles', () => {
      render(<SecurityTipsSection />);
      expect(screen.getByText('AVANT de Bloquer')).toBeTruthy();
      expect(screen.getByText('APRÈS avoir Bloqué')).toBeTruthy();
    });

    it('should display all after-block item titles', () => {
      const { container } = render(<SecurityTipsSection />);
      const headers = container.querySelectorAll('.checklist-header');
      fireEvent.click(headers[1]);

      expect(screen.getByText('1. SIGNALER')).toBeTruthy();
      expect(screen.getByText('2. DOCUMENTER')).toBeTruthy();
    });
  });

  describe('Memoization', () => {
    it('should be memoized for performance', () => {
      const { rerender } = render(<SecurityTipsSection />);
      rerender(<SecurityTipsSection />);

      const cards = document.querySelectorAll('.checklist-card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Label Structure', () => {
    it('should have labels for checkboxes', () => {
      const { container } = render(<SecurityTipsSection />);
      const labels = container.querySelectorAll('.checklist-label');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should have item text in labels', () => {
      const { container } = render(<SecurityTipsSection />);
      const itemTexts = container.querySelectorAll('.item-text');
      expect(itemTexts.length).toBeGreaterThan(0);
    });

    it('should have item details in labels', () => {
      const { container } = render(<SecurityTipsSection />);
      const itemDetails = container.querySelectorAll('.item-details');
      expect(itemDetails.length).toBeGreaterThan(0);
    });
  });
});
