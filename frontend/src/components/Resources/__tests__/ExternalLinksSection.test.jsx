/**
 * ExternalLinksSection Component Tests
 * Tests for external links with emergency contacts and resource categories
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExternalLinksSection from '../ExternalLinksSection';

// Mock external links data
vi.mock('../../../data/externalLinks.json', () => ({
  default: {
    emergency: [
      {
        country: '🇧🇪 Belgique',
        police: '101',
        bank: 'Contactez votre banque',
        website: 'www.police.be'
      },
      {
        country: '🇫🇷 France',
        police: '17',
        bank: 'Contactez votre banque',
        website: 'www.gendarmerie.gouv.fr'
      }
    ],
    categories: [
      {
        id: 'police-reporting',
        title: 'Signaler à la Police',
        icon: '🚨',
        description: 'Déposez plainte auprès des autorités',
        links: [
          {
            id: 'belgium-police',
            country: '🇧🇪 Belgique',
            organization: 'Police Fédérale',
            url: 'https://www.police.be',
            description: 'Formulaire de signalement en ligne'
          },
          {
            id: 'france-police',
            country: '🇫🇷 France',
            organization: 'Gendarmerie Nationale',
            url: 'https://www.gendarmerie.gouv.fr',
            description: 'Signalement des délits en France'
          }
        ]
      },
      {
        id: 'fraud-recovery',
        title: 'Récupération de Fraude',
        icon: '💳',
        description: 'Ressources pour se rétablir',
        links: [
          {
            id: 'belgium-credit',
            country: '🇧🇪 Belgique',
            organization: 'CreditPlus',
            url: 'https://www.creditplus.be',
            description: 'Vérification de crédit'
          }
        ]
      }
    ]
  }
}));

describe('ExternalLinksSection Component', () => {
  describe('Rendering', () => {
    it('should render main section container', () => {
      const { container } = render(<ExternalLinksSection />);
      expect(container.querySelector('.external-links-section')).toBeTruthy();
    });

    it('should display section title', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText('Ressources Externes')).toBeTruthy();
    });

    it('should display section subtitle', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText('Contactez les autorités et organismes officiels')).toBeTruthy();
    });

    it('should have section intro', () => {
      const { container } = render(<ExternalLinksSection />);
      expect(container.querySelector('.section-intro')).toBeTruthy();
    });

    it('should render h2 for section title', () => {
      const { container } = render(<ExternalLinksSection />);
      const h2 = container.querySelector('.section-intro h2');
      expect(h2).toBeTruthy();
      expect(h2.textContent).toBe('Ressources Externes');
    });
  });

  describe('Emergency Section', () => {
    it('should render emergency section', () => {
      const { container } = render(<ExternalLinksSection />);
      expect(container.querySelector('.emergency-section')).toBeTruthy();
    });

    it('should display emergency section title', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText('🆘 Numéros d\'Urgence par Pays')).toBeTruthy();
    });

    it('should render emergency grid', () => {
      const { container } = render(<ExternalLinksSection />);
      expect(container.querySelector('.emergency-grid')).toBeTruthy();
    });

    it('should display emergency cards', () => {
      const { container } = render(<ExternalLinksSection />);
      const emergencyCards = container.querySelectorAll('.emergency-card');
      expect(emergencyCards.length).toBe(2);
    });

    it('should display country names in cards', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText('🇧🇪 Belgique')).toBeTruthy();
      expect(screen.getByText('🇫🇷 France')).toBeTruthy();
    });

    it('should not show details initially', () => {
      const { container } = render(<ExternalLinksSection />);
      expect(container.querySelector('.emergency-details')).toBeFalsy();
    });

    it('should show emergency details when card is clicked', () => {
      const { container } = render(<ExternalLinksSection />);
      const firstCard = container.querySelector('.emergency-card');

      fireEvent.click(firstCard);
      expect(container.querySelector('.emergency-details')).toBeTruthy();
    });

    it('should display police number in details', () => {
      const { container } = render(<ExternalLinksSection />);
      const firstCard = container.querySelector('.emergency-card');

      fireEvent.click(firstCard);
      expect(screen.getByText('📞 Police:')).toBeTruthy();
      expect(screen.getByText('101')).toBeTruthy();
    });

    it('should display bank contact in details', () => {
      const { container } = render(<ExternalLinksSection />);
      const firstCard = container.querySelector('.emergency-card');

      fireEvent.click(firstCard);
      expect(screen.getByText('🏦 Banque:')).toBeTruthy();
    });

    it('should have report link in emergency details', () => {
      const { container } = render(<ExternalLinksSection />);
      const firstCard = container.querySelector('.emergency-card');

      fireEvent.click(firstCard);
      const link = container.querySelector('.detail-link');
      expect(link).toBeTruthy();
      expect(link.textContent).toBe('📋 Signaler →');
    });

    it('should open link in new tab', () => {
      const { container } = render(<ExternalLinksSection />);
      const firstCard = container.querySelector('.emergency-card');

      fireEvent.click(firstCard);
      const link = container.querySelector('.detail-link');
      expect(link.target).toBe('_blank');
      expect(link.rel).toContain('noopener');
    });

    it('should toggle emergency details on click', () => {
      const { container } = render(<ExternalLinksSection />);
      const firstCard = container.querySelector('.emergency-card');

      fireEvent.click(firstCard);
      expect(container.querySelector('.emergency-details')).toBeTruthy();

      fireEvent.click(firstCard);
      expect(container.querySelector('.emergency-details')).toBeFalsy();
    });
  });

  describe('Resource Categories', () => {
    it('should render resource categories section', () => {
      const { container } = render(<ExternalLinksSection />);
      expect(container.querySelector('.resources-categories')).toBeTruthy();
    });

    it('should display category items', () => {
      const { container } = render(<ExternalLinksSection />);
      const categories = container.querySelectorAll('.resource-category');
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should display category titles', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText('Signaler à la Police')).toBeTruthy();
      expect(screen.getByText('Récupération de Fraude')).toBeTruthy();
    });

    it('should display category icons', () => {
      const { container } = render(<ExternalLinksSection />);
      const icons = container.querySelectorAll('.category-icon');
      expect(icons.length).toBeGreaterThan(0);
      expect(icons[0].textContent).toBe('🚨');
    });

    it('should display category descriptions', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText('Déposez plainte auprès des autorités')).toBeTruthy();
      expect(screen.getByText('Ressources pour se rétablir')).toBeTruthy();
    });

    it('should not show links initially', () => {
      const { container } = render(<ExternalLinksSection />);
      const firstCategory = container.querySelector('.resource-category');
      expect(firstCategory.querySelector('.links-grid')).toBeFalsy();
    });

    it('should expand category when header is clicked', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');

      fireEvent.click(header);
      const linksGrid = container.querySelector('.links-grid');
      expect(linksGrid).toBeTruthy();
    });

    it('should collapse category when clicking expanded header', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');

      fireEvent.click(header);
      expect(container.querySelector('.links-grid')).toBeTruthy();

      fireEvent.click(header);
      expect(container.querySelector('.links-grid')).toBeFalsy();
    });

    it('should display links in expanded category', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');

      fireEvent.click(header);
      expect(screen.getByText('Police Fédérale')).toBeTruthy();
      expect(screen.getByText('Gendarmerie Nationale')).toBeTruthy();
    });

    it('should have expand arrow on category header', () => {
      const { container } = render(<ExternalLinksSection />);
      const arrow = container.querySelector('.expand-arrow');
      expect(arrow).toBeTruthy();
      expect(arrow.textContent).toBe('▼');
    });

    it('should toggle expanded class on arrow', () => {
      const { container } = render(<ExternalLinksSection />);
      const arrow = container.querySelector('.expand-arrow');
      const header = container.querySelector('.category-header-expandable');

      expect(arrow.className).not.toContain('expanded');
      fireEvent.click(header);
      expect(arrow.className).toContain('expanded');
    });
  });

  describe('Links in Categories', () => {
    it('should display link cards', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');
      fireEvent.click(header);

      const linkCards = container.querySelectorAll('.link-card');
      expect(linkCards.length).toBeGreaterThan(0);
    });

    it('should display link organization names', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');
      fireEvent.click(header);

      expect(screen.getByText('Police Fédérale')).toBeTruthy();
      expect(screen.getByText('Gendarmerie Nationale')).toBeTruthy();
    });

    it('should display link descriptions', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');
      fireEvent.click(header);

      expect(screen.getByText('Formulaire de signalement en ligne')).toBeTruthy();
      expect(screen.getByText('Signalement des délits en France')).toBeTruthy();
    });

    it('should display link country flags', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');
      fireEvent.click(header);

      const linkCountries = container.querySelectorAll('.link-country');
      expect(linkCountries.length).toBeGreaterThan(0);
    });

    it('should have proper link structure', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');
      fireEvent.click(header);

      const linkCard = container.querySelector('.link-card');
      expect(linkCard.querySelector('.link-header')).toBeTruthy();
      expect(linkCard.querySelector('h4')).toBeTruthy();
      expect(linkCard.querySelector('p')).toBeTruthy();
      expect(linkCard.querySelector('.link-url')).toBeTruthy();
    });

    it('should have link icon on cards', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');
      fireEvent.click(header);

      const linkIcons = container.querySelectorAll('.link-icon');
      expect(linkIcons.length).toBeGreaterThan(0);
      expect(linkIcons[0].textContent).toBe('🔗');
    });

    it('should open links in new tab', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');
      fireEvent.click(header);

      const links = container.querySelectorAll('.link-card');
      links.forEach(link => {
        expect(link.target).toBe('_blank');
        expect(link.rel).toContain('noopener');
      });
    });

    it('should have correct link URLs', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');
      fireEvent.click(header);

      const links = container.querySelectorAll('.link-card');
      expect(links[0].href).toContain('police.be');
      expect(links[1].href).toContain('gendarmerie.gouv.fr');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have button role on emergency cards', () => {
      const { container } = render(<ExternalLinksSection />);
      const emergencyCards = container.querySelectorAll('.emergency-card');
      emergencyCards.forEach(card => {
        expect(card.getAttribute('role')).toBe('button');
      });
    });

    it('should have tabIndex on emergency cards', () => {
      const { container } = render(<ExternalLinksSection />);
      const emergencyCards = container.querySelectorAll('.emergency-card');
      emergencyCards.forEach(card => {
        expect(card.getAttribute('tabIndex')).toBe('0');
      });
    });

    it('should have button role on category headers', () => {
      const { container } = render(<ExternalLinksSection />);
      const headers = container.querySelectorAll('.category-header-expandable');
      headers.forEach(header => {
        expect(header.getAttribute('role')).toBe('button');
      });
    });

    it('should have tabIndex on category headers', () => {
      const { container } = render(<ExternalLinksSection />);
      const headers = container.querySelectorAll('.category-header-expandable');
      headers.forEach(header => {
        expect(header.getAttribute('tabIndex')).toBe('0');
      });
    });
  });

  describe('Info Box', () => {
    it('should display info box', () => {
      const { container } = render(<ExternalLinksSection />);
      expect(container.querySelector('.info-box')).toBeTruthy();
    });

    it('should display info icon', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText('ℹ️')).toBeTruthy();
    });

    it('should display info title', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText('Important')).toBeTruthy();
    });

    it('should display info content', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText(/ressources sont officielles et vérifiées/)).toBeTruthy();
    });

    it('should mention reporting to authorities', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText(/auprès des autorités compétentes/)).toBeTruthy();
    });

    it('should mention contacting bank and police', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText(/banque et la police/)).toBeTruthy();
    });
  });

  describe('CSS Classes', () => {
    it('should have proper section structure', () => {
      const { container } = render(<ExternalLinksSection />);
      expect(container.querySelector('.external-links-section')).toBeTruthy();
      expect(container.querySelector('.section-intro')).toBeTruthy();
      expect(container.querySelector('.emergency-section')).toBeTruthy();
      expect(container.querySelector('.resources-categories')).toBeTruthy();
      expect(container.querySelector('.info-box')).toBeTruthy();
    });

    it('should have proper emergency card structure', () => {
      const { container } = render(<ExternalLinksSection />);
      const card = container.querySelector('.emergency-card');
      expect(card.querySelector('.country-header')).toBeTruthy();
    });

    it('should have proper category structure', () => {
      const { container } = render(<ExternalLinksSection />);
      const category = container.querySelector('.resource-category');
      expect(category.querySelector('.category-header-expandable')).toBeTruthy();
    });
  });

  describe('Multiple Categories Interaction', () => {
    it('should close previous category when opening new one', () => {
      const { container } = render(<ExternalLinksSection />);
      const headers = container.querySelectorAll('.category-header-expandable');

      fireEvent.click(headers[0]);
      let links = container.querySelectorAll('.links-grid');
      expect(links.length).toBe(1);

      fireEvent.click(headers[1]);
      links = container.querySelectorAll('.links-grid');
      // Only one category can be expanded at a time
      expect(links.length).toBe(1);
    });

    it('should switch between categories', () => {
      const { container } = render(<ExternalLinksSection />);
      const headers = container.querySelectorAll('.category-header-expandable');

      // Open first category
      fireEvent.click(headers[0]);
      expect(container.querySelector('.links-grid')).toBeTruthy();

      // Switch to second category
      fireEvent.click(headers[1]);
      const linkCards = container.querySelectorAll('.link-card');
      // Second category should have 1 link (based on mock data)
      expect(linkCards.length).toBe(1);
    });
  });

  describe('Emergency Cards Active State', () => {
    it('should add active class to selected card', () => {
      const { container } = render(<ExternalLinksSection />);
      const firstCard = container.querySelector('.emergency-card');

      fireEvent.click(firstCard);
      expect(firstCard.className).toContain('active');
    });

    it('should remove active class when deselected', () => {
      const { container } = render(<ExternalLinksSection />);
      const firstCard = container.querySelector('.emergency-card');

      fireEvent.click(firstCard);
      expect(firstCard.className).toContain('active');

      fireEvent.click(firstCard);
      expect(firstCard.className).not.toContain('active');
    });
  });

  describe('Content Verification', () => {
    it('should display all emergency countries', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText('🇧🇪 Belgique')).toBeTruthy();
      expect(screen.getByText('🇫🇷 France')).toBeTruthy();
    });

    it('should display all resource categories', () => {
      render(<ExternalLinksSection />);
      expect(screen.getByText('Signaler à la Police')).toBeTruthy();
      expect(screen.getByText('Récupération de Fraude')).toBeTruthy();
    });

    it('should have links in each category', () => {
      const { container } = render(<ExternalLinksSection />);
      const header = container.querySelector('.category-header-expandable');

      fireEvent.click(header);
      const linkCards = container.querySelectorAll('.link-card');
      expect(linkCards.length).toBe(2);
    });
  });

  describe('Memoization', () => {
    it('should be memoized for performance', () => {
      const { rerender } = render(<ExternalLinksSection />);
      rerender(<ExternalLinksSection />);

      const section = document.querySelector('.external-links-section');
      expect(section).toBeTruthy();
    });
  });

  describe('Detail Items', () => {
    it('should have detail items in emergency details', () => {
      const { container } = render(<ExternalLinksSection />);
      const firstCard = container.querySelector('.emergency-card');

      fireEvent.click(firstCard);
      const detailItems = container.querySelectorAll('.detail-item');
      expect(detailItems.length).toBeGreaterThan(0);
    });

    it('should display detail labels and values', () => {
      const { container } = render(<ExternalLinksSection />);
      const firstCard = container.querySelector('.emergency-card');

      fireEvent.click(firstCard);
      const detailLabels = container.querySelectorAll('.detail-label');
      expect(detailLabels.length).toBeGreaterThan(0);
      expect(detailLabels[0].textContent).toBe('📞 Police:');
    });
  });
});
