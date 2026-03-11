/**
 * FAQSection Component Tests
 * Phase 6 - Resource Sub-components Coverage
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FAQSection from '../FAQSection';

// Mock FAQ data
vi.mock('../../../data/faqData.json', () => ({
  default: {
    questions: [
      {
        id: '1',
        question: 'Comment bloquer un numéro?',
        answer: 'Pour bloquer un numéro, allez aux paramètres et sélectionnez blocage',
        category: 'blocage'
      },
      {
        id: '2',
        question: 'Comment signaler une arnaque?',
        answer: 'Utilisez le bouton signalement sur l\'écran principal',
        category: 'signalement'
      },
      {
        id: '3',
        question: 'Quels types de fraude existent?',
        answer: 'Les principales fraudes sont les fraudes bancaires, le phishing, etc.',
        category: 'arnaque'
      },
      {
        id: '4',
        question: 'Comment fonctionne ScamGuard?',
        answer: 'ScamGuard utilise l\'IA pour détecter les arnaques',
        category: 'scamguard'
      }
    ]
  }
}));

// Mock FAQItem component
vi.mock('../FAQItem', () => ({
  default: ({ faq, isExpanded, onToggle }) => (
    <div className="faq-item-mock">
      <button onClick={onToggle} aria-expanded={isExpanded}>
        {faq.question}
      </button>
      {isExpanded && <p>{faq.answer}</p>}
    </div>
  )
}));

describe('FAQSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the FAQ section', () => {
      const { container } = render(<FAQSection />);
      expect(container.querySelector('.faq-section')).toBeInTheDocument();
    });

    it('displays the section title', () => {
      render(<FAQSection />);
      expect(screen.getByText(/Questions Fréquemment Posées/)).toBeInTheDocument();
    });

    it('displays the section subtitle', () => {
      render(<FAQSection />);
      expect(screen.getByText(/Trouvez les réponses/)).toBeInTheDocument();
    });

    it('renders the search input', () => {
      const { container } = render(<FAQSection />);
      const searchInput = container.querySelector('.search-input');
      expect(searchInput).toBeInTheDocument();
    });

    it('displays quick tips section', () => {
      render(<FAQSection />);
      expect(screen.getByText(/Conseils Rapides/)).toBeInTheDocument();
    });

    it('renders all quick tip cards', () => {
      const { container } = render(<FAQSection />);
      const tipCards = container.querySelectorAll('.tip-card');
      expect(tipCards.length).toBe(4);
    });
  });

  describe('Search Functionality', () => {
    it('has search input field', () => {
      const { container } = render(<FAQSection />);
      const searchInput = container.querySelector('.search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.type).toBe('text');
    });

    it('search input can be typed into', async () => {
      const user = userEvent.setup();
      const { container } = render(<FAQSection />);

      const searchInput = container.querySelector('.search-input');
      await user.type(searchInput, 'test');

      expect(searchInput.value).toBe('test');
    });

    it('shows no results message when search matches nothing', async () => {
      const user = userEvent.setup();
      const { container } = render(<FAQSection />);

      const searchInput = container.querySelector('.search-input');
      await user.type(searchInput, 'xyzabc123nonexistent');

      await waitFor(() => {
        expect(screen.getByText(/Aucune question ne correspond/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('search input has placeholder text', () => {
      const { container } = render(<FAQSection />);
      const searchInput = container.querySelector('.search-input');
      expect(searchInput).toHaveAttribute('placeholder');
      expect(searchInput.placeholder).toContain('Rechercher');
    });

    it('clears search when input is cleared', async () => {
      const user = userEvent.setup();
      const { container } = render(<FAQSection />);

      const searchInput = container.querySelector('.search-input');
      await user.type(searchInput, 'test');
      expect(searchInput.value).toBe('test');

      await user.clear(searchInput);
      expect(searchInput.value).toBe('');
    });
  });

  describe('Category Expansion', () => {
    it('displays all categories initially', () => {
      const { container } = render(<FAQSection />);
      const categories = container.querySelectorAll('.faq-category');
      expect(categories.length).toBeGreaterThan(0);
    });

    it('displays category labels with emojis', () => {
      render(<FAQSection />);
      expect(screen.getByText(/🛡️ Blocage/)).toBeInTheDocument();
      expect(screen.getByText(/🚨 Signalement/)).toBeInTheDocument();
    });

    it('category headers have button role', () => {
      const { container } = render(<FAQSection />);
      const categoryHeaders = container.querySelectorAll('.category-header-toggle');
      categoryHeaders.forEach(header => {
        expect(header).toHaveAttribute('role', 'button');
      });
    });

    it('category headers are keyboard focusable', () => {
      const { container } = render(<FAQSection />);
      const categoryHeaders = container.querySelectorAll('.category-header-toggle');
      categoryHeaders.forEach(header => {
        expect(header).toHaveAttribute('tabIndex', '0');
      });
    });

    it('toggles expand indicator exists on category', () => {
      const { container } = render(<FAQSection />);
      const categoryHeader = container.querySelector('.category-header-toggle');
      const toggle = categoryHeader.querySelector('.category-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('handles keyboard Enter key press on category', () => {
      const { container } = render(<FAQSection />);
      const categoryHeader = container.querySelector('.category-header-toggle');

      // Should not throw when key is pressed
      fireEvent.keyPress(categoryHeader, { key: 'Enter', code: 'Enter' });
      expect(categoryHeader).toBeInTheDocument();
    });

    it('handles keyboard Space key press on category', () => {
      const { container } = render(<FAQSection />);
      const categoryHeader = container.querySelector('.category-header-toggle');

      // Should not throw when key is pressed
      fireEvent.keyPress(categoryHeader, { key: ' ', code: 'Space' });
      expect(categoryHeader).toBeInTheDocument();
    });
  });

  describe('FAQ Items', () => {
    it('has FAQ items container in structure', () => {
      const { container } = render(<FAQSection />);
      const faqContainer = container.querySelector('.faq-container');
      expect(faqContainer).toBeInTheDocument();
    });

    it('renders mocked FAQ item components when available', () => {
      const { container } = render(<FAQSection />);
      // At minimum, the component structure is correct
      const categories = container.querySelectorAll('.faq-category');
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('shows no results when search returns empty', async () => {
      const user = userEvent.setup();
      const { container } = render(<FAQSection />);

      const searchInput = container.querySelector('.search-input');
      await user.type(searchInput, 'nonexistentquery123');

      await waitFor(() => {
        expect(screen.getByText(/Aucune question ne correspond/)).toBeInTheDocument();
        expect(screen.getByText(/Essayez avec d'autres mots-clés/)).toBeInTheDocument();
      });
    });

    it('displays no-results div for empty search', async () => {
      const user = userEvent.setup();
      const { container } = render(<FAQSection />);

      const searchInput = container.querySelector('.search-input');
      await user.type(searchInput, 'xyznoexist');

      await waitFor(() => {
        expect(container.querySelector('.no-results')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('search input has aria-label', () => {
      const { container } = render(<FAQSection />);
      const searchInput = container.querySelector('.search-input');
      expect(searchInput).toHaveAttribute('aria-label');
      expect(searchInput.getAttribute('aria-label')).toContain('Rechercher dans la FAQ');
    });

    it('category header has role="button"', () => {
      const { container } = render(<FAQSection />);
      const categoryHeader = container.querySelector('.category-header-toggle');
      expect(categoryHeader).toHaveAttribute('role', 'button');
    });

    it('category header is keyboard focusable', () => {
      const { container } = render(<FAQSection />);
      const categoryHeader = container.querySelector('.category-header-toggle');
      expect(categoryHeader).toHaveAttribute('tabIndex', '0');
    });

    it('search input is accessible', () => {
      const { container } = render(<FAQSection />);
      const searchInput = container.querySelector('.search-input');
      expect(searchInput.type).toBe('text');
      expect(searchInput).toHaveAttribute('placeholder');
    });
  });

  describe('UI Elements', () => {
    it('displays search icon', () => {
      const { container } = render(<FAQSection />);
      const searchIcon = container.querySelector('.search-icon');
      expect(searchIcon).toBeInTheDocument();
      expect(searchIcon.textContent).toBe('🔍');
    });

    it('displays tip card icons', () => {
      const { container } = render(<FAQSection />);
      const tipIcons = container.querySelectorAll('.tip-icon');
      expect(tipIcons.length).toBe(4);
      expect(tipIcons[0].textContent).toBe('📞');
    });

    it('displays quick tips with proper structure', () => {
      render(<FAQSection />);
      expect(screen.getByText('Blocage Rapide')).toBeInTheDocument();
      expect(screen.getByText('Signalement')).toBeInTheDocument();
      expect(screen.getByText('Déblocage')).toBeInTheDocument();
      expect(screen.getByText('Fraude')).toBeInTheDocument();
    });
  });
});
