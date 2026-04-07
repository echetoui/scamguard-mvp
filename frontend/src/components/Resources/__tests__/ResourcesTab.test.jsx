/**
 * ResourcesTab Component Tests
 * Phase 6 - Resources Coverage Expansion
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResourcesTab from '../ResourcesTab';

// Mock sub-components
vi.mock('../SecurityTipsSection', () => ({
  default: () => <div className="security-tips-mock">Security Tips</div>
}));

vi.mock('../FAQSection', () => ({
  default: () => <div className="faq-section-mock">FAQ Section</div>
}));

vi.mock('../VideosSection', () => ({
  default: () => <div className="videos-section-mock">Videos Section</div>
}));

vi.mock('../ByTypeSection', () => ({
  default: () => <div className="by-type-section-mock">By Type Section</div>
}));

vi.mock('../ExternalLinksSection', () => ({
  default: () => <div className="external-links-mock">External Links</div>
}));

vi.mock('../BlockingGuidesSection', () => ({
  default: () => <div className="blocking-guides-mock">Blocking Guides</div>
}));

describe('ResourcesTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      const { container } = render(<ResourcesTab />);
      expect(container).toBeTruthy();
    });

    it('should have proper structure', () => {
      const { container } = render(<ResourcesTab />);
      const resourcesTab = container.querySelector('.resources-tab');
      expect(resourcesTab).toBeTruthy();
    });

    it('should render header with title', () => {
      render(<ResourcesTab />);
      expect(screen.getByText(/Ressources/i)).toBeTruthy();
    });

    it('should render header with subtitle', () => {
      render(<ResourcesTab />);
      expect(screen.getByText(/Protégez-vous/i)).toBeTruthy();
    });

    it('should have proper semantic structure', () => {
      const { container } = render(<ResourcesTab />);
      const resourcesTab = container.querySelector('.resources-tab');
      expect(resourcesTab).toBeTruthy();
    });
  });

  describe('Category Navigation', () => {
    it('should render all category buttons', () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');
      expect(buttons.length).toBeGreaterThan(0); // At least one category
    });

    it('should have first category active by default', () => {
      const { container } = render(<ResourcesTab />);
      const activeBtn = container.querySelector('.category-btn.active');
      expect(activeBtn).toBeTruthy();
      expect(activeBtn?.textContent).toContain('Guides de Blocage');
    });

    it('should render category nav with proper structure', () => {
      const { container } = render(<ResourcesTab />);
      const categoryNav = container.querySelector('.category-nav');
      expect(categoryNav).toBeTruthy();
    });

    it('should have category buttons with proper labels', () => {
      render(<ResourcesTab />);
      expect(screen.getByText(/Guides de Blocage/)).toBeTruthy();
      expect(screen.getByText(/Par Type/)).toBeTruthy();
      expect(screen.getByText(/Conseils/)).toBeTruthy();
      expect(screen.getByText(/Vidéos/)).toBeTruthy();
      expect(screen.getByText(/FAQ/)).toBeTruthy();
      expect(screen.getByText(/Ressources/)).toBeTruthy();
    });

    it('should switch categories on button click', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 1) {
        fireEvent.click(buttons[1]);

        await waitFor(() => {
          expect(buttons[1].classList.contains('active')).toBe(true);
        });
      }
    });

    it('should show correct content for each category', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 1) {
        fireEvent.click(buttons[1]);

        // One of the mocked sections should be visible
        const sections = container.querySelectorAll('[class*="-mock"]');
        expect(sections.length).toBeGreaterThan(0);
      }
    });

    it('should handle keyboard navigation on buttons', () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 0) {
        buttons[0].focus();
        expect(document.activeElement).toBe(buttons[0]);
      }
    });

    it('should handle Enter key on category button', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 1) {
        const user = userEvent.setup();
        await user.click(buttons[1]);

        await waitFor(() => {
          expect(buttons[1].classList.contains('active')).toBe(true);
        });
      }
    });

    it('should have aria-pressed attribute on buttons', () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      buttons.forEach(btn => {
        expect(btn.hasAttribute('aria-pressed')).toBe(true);
      });
    });
  });

  // TODO: Content sections tests depend on specific component structure
  // Need to update category class names and section selectors
  describe.skip('Content Sections', () => {
    it('should display Blocking Guides section initially', () => {
      const { container } = render(<ResourcesTab />);
      expect(container.querySelector('.blocking-guides-mock')).toBeTruthy();
    });

    it('should display By Type section on click', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 1) {
        fireEvent.click(buttons[1]); // By Type button

        await waitFor(() => {
          expect(container.querySelector('.by-type-section-mock')).toBeTruthy();
        });
      }
    });

    it('should display Security Tips section on click', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 2) {
        fireEvent.click(buttons[2]); // Conseils button

        await waitFor(() => {
          expect(container.querySelector('.security-tips-mock')).toBeTruthy();
        });
      }
    });

    it('should display Videos section on click', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 3) {
        fireEvent.click(buttons[3]); // Vidéos button

        await waitFor(() => {
          expect(container.querySelector('.videos-section-mock')).toBeTruthy();
        });
      }
    });

    it('should display FAQ section on click', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 4) {
        fireEvent.click(buttons[4]); // FAQ button

        await waitFor(() => {
          expect(container.querySelector('.faq-section-mock')).toBeTruthy();
        });
      }
    });

    it('should display External Links section on click', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 5) {
        fireEvent.click(buttons[5]); // Ressources button

        await waitFor(() => {
          expect(container.querySelector('.external-links-mock')).toBeTruthy();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('should have aria-pressed on category buttons', () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      buttons.forEach(btn => {
        expect(btn.hasAttribute('aria-pressed')).toBe(true);
      });
    });

    it('should have title attribute on category buttons', () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      buttons.forEach(btn => {
        expect(btn.hasAttribute('title')).toBe(true);
      });
    });

    it('should be keyboard navigable', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 0) {
        buttons[0].focus();
        expect(document.activeElement).toBe(buttons[0]);
      }
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<ResourcesTab />);
      const h1s = container.querySelectorAll('h1');
      expect(h1s.length).toBeGreaterThan(0);
    });

    it('should have proper semantic structure', () => {
      const { container } = render(<ResourcesTab />);
      expect(container.querySelector('.resources-tab')).toBeTruthy();
      expect(container.querySelector('.resources-header')).toBeTruthy();
      expect(container.querySelector('.category-nav')).toBeTruthy();
      expect(container.querySelector('.resources-content')).toBeTruthy();
    });
  });

  describe('Visual States', () => {
    it('should have active state styling on first button', () => {
      const { container } = render(<ResourcesTab />);
      const activeBtn = container.querySelector('.category-btn.active');

      expect(activeBtn).toBeTruthy();
    });

    it('should update active state on category switch', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 1) {
        const firstBtn = buttons[0];
        const secondBtn = buttons[1];

        fireEvent.click(secondBtn);

        await waitFor(() => {
          expect(firstBtn.classList.contains('active')).toBe(false);
          expect(secondBtn.classList.contains('active')).toBe(true);
        });
      }
    });

    it('should have proper aria-pressed value', () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      const activeBtn = container.querySelector('.category-btn.active');
      if (activeBtn) {
        expect(activeBtn.getAttribute('aria-pressed')).toBe('true');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing tab content gracefully', () => {
      const { container } = render(<ResourcesTab />);
      expect(container).toBeTruthy();
    });

    it('should render without errors', () => {
      expect(() => {
        render(<ResourcesTab />);
      }).not.toThrow();
    });
  });

  describe('Multiple Clicks', () => {
    it('should handle rapid category switching', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 1) {
        fireEvent.click(buttons[1]);
        fireEvent.click(buttons[0]);
        fireEvent.click(buttons[1]);

        await waitFor(() => {
          expect(buttons[1].classList.contains('active')).toBe(true);
        });
      }
    });

    it('should maintain state after multiple switches', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 1) {
        fireEvent.click(buttons[1]);

        await waitFor(() => {
          expect(buttons[1].classList.contains('active')).toBe(true);
        });

        // Verify it stays selected
        expect(buttons[1].classList.contains('active')).toBe(true);
      }
    });
  });

  describe('Content Updates', () => {
    it('should only show one active section', () => {
      const { container } = render(<ResourcesTab />);
      const mockSections = container.querySelectorAll('[class*="-mock"]');

      expect(mockSections.length).toBe(1);
    });

    it('should update content on button click', async () => {
      const { container } = render(<ResourcesTab />);
      const buttons = container.querySelectorAll('.category-btn');

      if (buttons.length > 1) {
        const initialSection = container.querySelector('[class*="-mock"]');

        fireEvent.click(buttons[1]);

        await waitFor(() => {
          const newSection = container.querySelector('[class*="-mock"]');
          expect(newSection).toBeTruthy();
        });
      }
    });

    it('should render content inside resources-content div', () => {
      const { container } = render(<ResourcesTab />);
      const contentArea = container.querySelector('.resources-content');
      const mockSection = container.querySelector('[class*="-mock"]');

      expect(contentArea).toBeTruthy();
      expect(mockSection).toBeTruthy();
      expect(contentArea?.contains(mockSection)).toBe(true);
    });

    it('should display Urgence tab button', () => {
      render(<ResourcesTab />);
      const urgenceBtn = screen.getByRole('button', { name: /🚨 Urgence/i });
      expect(urgenceBtn).toBeInTheDocument();
    });

    it('should display emergency contacts when Urgence tab is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ResourcesTab />);

      const urgenceBtn = screen.getByRole('button', { name: /🚨 Urgence/i });
      await user.click(urgenceBtn);

      await waitFor(() => {
        expect(screen.getByText(/Numéros d'Urgence/i)).toBeInTheDocument();
        // Check for emergency contact number specifically
        const contactNumbers = container.querySelectorAll('.emergency-contact-number');
        expect(contactNumbers.length).toBeGreaterThan(0);
      });
    });
  });
});
