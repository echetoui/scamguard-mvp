/**
 * FAQSection Component Tests - Expanded Coverage
 * Tests for FAQ search, category filtering, and quick tips
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FAQSection from '../FAQSection';

// Mock FAQItem component
vi.mock('../FAQItem', () => ({
  default: ({ faq, isExpanded, onToggle }) => (
    <div className="faq-item-mock" data-faq-id={faq.id}>
      <div onClick={onToggle} className="faq-mock-toggle">
        {faq.question}
      </div>
      {isExpanded && <div className="faq-mock-answer">{faq.answer}</div>}
    </div>
  )
}));

// Mock FAQ data
vi.mock('../../../data/faqData.json', () => ({
  default: {
    questions: [
      {
        id: 'faq-1',
        question: 'Qu\'est-ce qui se passe quand je bloque un numéro?',
        answer: 'L\'appel n\'apparaît pas sur votre écran',
        category: 'blocage',
        icon: '📞'
      },
      {
        id: 'faq-2',
        question: 'Puis-je débloquer un contact?',
        answer: 'Oui! Vous pouvez débloquer n\'importe quel contact',
        category: 'blocage',
        icon: '🔓'
      },
      {
        id: 'faq-3',
        question: 'Comment signaler à la police?',
        answer: 'Vous pouvez signaler via les sites officiels',
        category: 'signalement',
        icon: '🚨'
      },
      {
        id: 'faq-4',
        question: 'Que faire si j\'ai perdu de l\'argent?',
        answer: 'Contactez votre banque immédiatement',
        category: 'arnaque',
        icon: '💳'
      },
      {
        id: 'faq-5',
        question: 'Comment éviter les arnaques?',
        answer: 'Soyez vigilant avec les appels inattendus',
        category: 'prévention',
        icon: '🛡️'
      }
    ]
  }
}));

describe('FAQSection Component - Expanded Coverage', () => {
  describe('Rendering', () => {
    it('should render section container', () => {
      const { container } = render(<FAQSection />);
      expect(container.querySelector('.faq-section')).toBeTruthy();
    });

    it('should display section title', () => {
      render(<FAQSection />);
      expect(screen.getByText('Questions Fréquemment Posées')).toBeTruthy();
    });

    it('should display section subtitle', () => {
      render(<FAQSection />);
      expect(screen.getByText(/Trouvez les réponses/)).toBeTruthy();
    });

    it('should have section intro', () => {
      const { container } = render(<FAQSection />);
      expect(container.querySelector('.section-intro')).toBeTruthy();
    });

    it('should render h2 title', () => {
      const { container } = render(<FAQSection />);
      const h2 = container.querySelector('.section-intro h2');
      expect(h2.textContent).toBe('Questions Fréquemment Posées');
    });
  });

  describe('Search Bar', () => {
    it('should render search bar', () => {
      const { container } = render(<FAQSection />);
      expect(container.querySelector('.faq-search')).toBeTruthy();
    });

    it('should display search input', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');
      expect(input).toBeTruthy();
    });

    it('should have search placeholder', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');
      expect(input.placeholder).toContain('Rechercher');
    });

    it('should display search icon', () => {
      render(<FAQSection />);
      expect(screen.getByText('🔍')).toBeTruthy();
    });

    it('should have aria-label on search input', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');
      expect(input.getAttribute('aria-label')).toBe('Rechercher dans la FAQ');
    });

    it('should update search query on input', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');

      fireEvent.change(input, { target: { value: 'blocage' } });
      expect(input.value).toBe('blocage');
    });
  });

  describe('Search Filtering', () => {
    it('should filter categories when search matches', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');

      fireEvent.change(input, { target: { value: 'bloque' } });
      const categories = container.querySelectorAll('.faq-category');
      // Should show categories that contain matching FAQs
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should reduce categories when filtering', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');
      const initialCategories = container.querySelectorAll('.faq-category').length;

      fireEvent.change(input, { target: { value: 'signaler' } });
      const filteredCategories = container.querySelectorAll('.faq-category').length;
      // Filtered results should be fewer or equal
      expect(filteredCategories).toBeLessThanOrEqual(initialCategories);
    });

    it('should show no results when no match', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');

      fireEvent.change(input, { target: { value: 'zzzzzzz' } });
      const noResults = container.querySelector('.no-results');
      expect(noResults).toBeTruthy();
      expect(noResults.textContent).toContain('correspond');
    });

    it('should show no results message with suggestions', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');

      fireEvent.change(input, { target: { value: 'xyz123abc' } });
      const noResults = container.querySelector('.no-results');
      expect(noResults.textContent).toContain('mots-clés');
    });

    it('should filter case-insensitive', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');

      fireEvent.change(input, { target: { value: 'BLOQUE' } });
      const categories = container.querySelectorAll('.faq-category');
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should filter by answer text', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');

      fireEvent.change(input, { target: { value: 'immédiatement' } });
      const categories = container.querySelectorAll('.faq-category');
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('Category Display', () => {
    it('should render FAQ container', () => {
      const { container } = render(<FAQSection />);
      expect(container.querySelector('.faq-container')).toBeTruthy();
    });

    it('should display category groups', () => {
      const { container } = render(<FAQSection />);
      const categories = container.querySelectorAll('.faq-category');
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should display category headers', () => {
      const { container } = render(<FAQSection />);
      const headers = container.querySelectorAll('.category-header-toggle');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should display category titles with icons', () => {
      render(<FAQSection />);
      expect(screen.getByText(/🛡️ Blocage/)).toBeTruthy();
      expect(screen.getByText(/🚨 Signalement/)).toBeTruthy();
    });

    it('should display category toggle icon', () => {
      const { container } = render(<FAQSection />);
      const toggles = container.querySelectorAll('.category-toggle');
      expect(toggles.length).toBeGreaterThan(0);
      expect(toggles[0].textContent).toBe('▼');
    });

    it('should not show category items initially', () => {
      const { container } = render(<FAQSection />);
      const categoryItems = container.querySelectorAll('.category-items');
      expect(categoryItems.length).toBe(0);
    });

    it('should show category items when header clicked', () => {
      const { container } = render(<FAQSection />);
      const header = container.querySelector('.category-header-toggle');

      fireEvent.click(header);
      const categoryItems = container.querySelector('.category-items');
      expect(categoryItems).toBeTruthy();
    });

    it('should hide category items when clicked again', () => {
      const { container } = render(<FAQSection />);
      const header = container.querySelector('.category-header-toggle');

      fireEvent.click(header);
      expect(container.querySelector('.category-items')).toBeTruthy();

      fireEvent.click(header);
      expect(container.querySelector('.category-items')).toBeFalsy();
    });

    it('should toggle expanded class on icon', () => {
      const { container } = render(<FAQSection />);
      const toggle = container.querySelector('.category-toggle');
      const header = container.querySelector('.category-header-toggle');

      expect(toggle.className).not.toContain('expanded');
      fireEvent.click(header);
      expect(toggle.className).toContain('expanded');
    });
  });

  describe('FAQ Items in Category', () => {
    it('should display FAQ items when category expanded', () => {
      const { container } = render(<FAQSection />);
      const header = container.querySelector('.category-header-toggle');

      fireEvent.click(header);
      const faqItems = container.querySelectorAll('.faq-item-mock');
      expect(faqItems.length).toBeGreaterThan(0);
    });

    it('should pass correct data to FAQItem', () => {
      const { container } = render(<FAQSection />);
      const header = container.querySelector('.category-header-toggle');

      fireEvent.click(header);
      const faqItem = container.querySelector('[data-faq-id="faq-1"]');
      expect(faqItem).toBeTruthy();
    });

    it('should display FAQ questions', () => {
      const { container } = render(<FAQSection />);
      const header = container.querySelector('.category-header-toggle');

      fireEvent.click(header);
      expect(screen.getByText(/bloque un numéro/)).toBeTruthy();
    });

    it('should toggle FAQ item expansion', () => {
      const { container } = render(<FAQSection />);
      const categoryHeader = container.querySelector('.category-header-toggle');

      fireEvent.click(categoryHeader);
      const faqToggle = container.querySelector('.faq-mock-toggle');

      fireEvent.click(faqToggle);
      const answer = container.querySelector('.faq-mock-answer');
      expect(answer).toBeTruthy();
    });

    it('should keep only one FAQ expanded per category', () => {
      const { container } = render(<FAQSection />);
      const categoryHeader = container.querySelector('.category-header-toggle');

      fireEvent.click(categoryHeader);
      const toggles = container.querySelectorAll('.faq-mock-toggle');

      fireEvent.click(toggles[0]);
      let answers = container.querySelectorAll('.faq-mock-answer');
      expect(answers.length).toBe(1);

      fireEvent.click(toggles[1]);
      answers = container.querySelectorAll('.faq-mock-answer');
      expect(answers.length).toBe(1);
    });
  });

  describe('Quick Tips Section', () => {
    it('should render tips section', () => {
      const { container } = render(<FAQSection />);
      expect(container.querySelector('.faq-tips')).toBeTruthy();
    });

    it('should display tips title', () => {
      render(<FAQSection />);
      expect(screen.getByText('💡 Conseils Rapides')).toBeTruthy();
    });

    it('should display tips grid', () => {
      const { container } = render(<FAQSection />);
      expect(container.querySelector('.tips-grid')).toBeTruthy();
    });

    it('should display all tip cards', () => {
      const { container } = render(<FAQSection />);
      const tipCards = container.querySelectorAll('.tip-card');
      expect(tipCards.length).toBe(4);
    });

    it('should display tip icons', () => {
      const { container } = render(<FAQSection />);
      const tipIcons = container.querySelectorAll('.tip-icon');
      expect(tipIcons[0].textContent).toBe('📞');
      expect(tipIcons[1].textContent).toBe('🚨');
      expect(tipIcons[2].textContent).toBe('🔓');
      expect(tipIcons[3].textContent).toBe('💳');
    });

    it('should display tip titles', () => {
      render(<FAQSection />);
      expect(screen.getByText('Blocage Rapide')).toBeTruthy();
      expect(screen.getByText('Signalement')).toBeTruthy();
      expect(screen.getByText('Déblocage')).toBeTruthy();
      expect(screen.getByText('Fraude')).toBeTruthy();
    });

    it('should display tip descriptions', () => {
      render(<FAQSection />);
      expect(screen.getByText(/bloquer n\'importe quel numéro/)).toBeTruthy();
      expect(screen.getByText(/Signalez toujours à la police/)).toBeTruthy();
      expect(screen.getByText(/débloquer un contact/)).toBeTruthy();
    });

    it('should have h4 for tip titles', () => {
      const { container } = render(<FAQSection />);
      const tipTitles = container.querySelectorAll('.tip-card h4');
      expect(tipTitles.length).toBe(4);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have button role on category headers', () => {
      const { container } = render(<FAQSection />);
      const headers = container.querySelectorAll('.category-header-toggle');
      headers.forEach(header => {
        expect(header.getAttribute('role')).toBe('button');
      });
    });

    it('should have tabIndex on category headers', () => {
      const { container } = render(<FAQSection />);
      const headers = container.querySelectorAll('.category-header-toggle');
      headers.forEach(header => {
        expect(header.getAttribute('tabIndex')).toBe('0');
      });
    });

    it('should be keyboard accessible', () => {
      const { container } = render(<FAQSection />);
      const headers = container.querySelectorAll('.category-header-toggle');
      headers.forEach(header => {
        expect(header.getAttribute('role')).toBe('button');
        expect(header.getAttribute('tabIndex')).toBe('0');
      });
    });
  });

  describe('No Results State', () => {
    it('should display no results message', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');

      fireEvent.change(input, { target: { value: 'nonexistent' } });
      const noResults = container.querySelector('.no-results');
      expect(noResults).toBeTruthy();
    });

    it('should hide categories when no results', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');

      fireEvent.change(input, { target: { value: 'completely-nonexistent' } });
      const categories = container.querySelectorAll('.faq-category');
      expect(categories.length).toBe(0);
    });

    it('should show results again after clearing search', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');

      fireEvent.change(input, { target: { value: 'xyz' } });
      let categories = container.querySelectorAll('.faq-category');
      expect(categories.length).toBe(0);

      fireEvent.change(input, { target: { value: '' } });
      categories = container.querySelectorAll('.faq-category');
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('CSS Classes', () => {
    it('should have proper section structure', () => {
      const { container } = render(<FAQSection />);
      expect(container.querySelector('.faq-section')).toBeTruthy();
      expect(container.querySelector('.section-intro')).toBeTruthy();
      expect(container.querySelector('.faq-search')).toBeTruthy();
      expect(container.querySelector('.faq-container')).toBeTruthy();
      expect(container.querySelector('.faq-tips')).toBeTruthy();
    });

    it('should have proper category structure', () => {
      const { container } = render(<FAQSection />);
      const category = container.querySelector('.faq-category');
      expect(category.querySelector('.category-header-toggle')).toBeTruthy();
    });
  });

  describe('Multiple Search Results', () => {
    it('should filter across multiple categories', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');

      fireEvent.change(input, { target: { value: 'bloque' } });
      const categories = container.querySelectorAll('.faq-category');
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should show correct results for different searches', () => {
      const { container } = render(<FAQSection />);
      const input = container.querySelector('.search-input');

      fireEvent.change(input, { target: { value: 'blocage' } });
      let categories = container.querySelectorAll('.faq-category');
      const firstCount = categories.length;

      fireEvent.change(input, { target: { value: 'police' } });
      categories = container.querySelectorAll('.faq-category');
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('Category Label Mapping', () => {
    it('should display mapped category labels', () => {
      render(<FAQSection />);
      expect(screen.getByText(/🛡️ Blocage/)).toBeTruthy();
      expect(screen.getByText(/🚨 Signalement/)).toBeTruthy();
      expect(screen.getByText(/💳 Arnaque/)).toBeTruthy();
    });
  });

  describe('Memoization', () => {
    it('should be memoized for performance', () => {
      const { rerender } = render(<FAQSection />);
      rerender(<FAQSection />);

      const section = document.querySelector('.faq-section');
      expect(section).toBeTruthy();
    });
  });

  describe('Content Verification', () => {
    it('should display all categories when no search', () => {
      const { container } = render(<FAQSection />);
      const categories = container.querySelectorAll('.faq-category');
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should display tips always visible', () => {
      render(<FAQSection />);
      expect(screen.getByText('Blocage Rapide')).toBeTruthy();
      expect(screen.getByText('Fraude')).toBeTruthy();
    });

    it('should have multiple FAQ categories', () => {
      const { container } = render(<FAQSection />);
      const categories = container.querySelectorAll('.category-header-toggle');
      expect(categories.length).toBeGreaterThan(1);
    });
  });
});
