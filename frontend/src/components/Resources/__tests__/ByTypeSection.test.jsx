/**
 * ByTypeSection Component Tests
 * Tests for guides organized by communication type
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ByTypeSection from '../ByTypeSection';

// Mock guides data
vi.mock('../../../data/blockingGuides.json', () => ({
  default: {
    guides: [
      {
        id: 'call-1',
        platform: 'android',
        type: 'appel',
        title: 'Block Calls Android',
        icon: '☎️',
        description: 'How to block calls on Android'
      },
      {
        id: 'sms-1',
        platform: 'ios',
        type: 'sms',
        title: 'Block SMS iPhone',
        icon: '💬',
        description: 'How to block SMS on iPhone'
      },
      {
        id: 'app-1',
        platform: 'android',
        type: 'app',
        title: 'Block WhatsApp',
        icon: '📱',
        description: 'How to block on WhatsApp'
      }
    ]
  }
}));

describe('ByTypeSection Component', () => {
  describe('Rendering', () => {
    it('should render section container', () => {
      const { container } = render(<ByTypeSection />);
      expect(container.querySelector('.by-type-section')).toBeTruthy();
    });

    it('should display section title', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('Blocage par Type de Contact')).toBeTruthy();
    });

    it('should display section description', () => {
      render(<ByTypeSection />);
      expect(screen.getByText(/guide spécifique/)).toBeTruthy();
    });

    it('should have section intro', () => {
      const { container } = render(<ByTypeSection />);
      expect(container.querySelector('.section-intro')).toBeTruthy();
    });
  });

  describe('Type Organization', () => {
    it('should display type groups', () => {
      const { container } = render(<ByTypeSection />);
      const typeGroups = container.querySelectorAll('.type-group');
      expect(typeGroups.length).toBeGreaterThan(0);
    });

    it('should display type headers with icons', () => {
      const { container } = render(<ByTypeSection />);
      const typeIcons = container.querySelectorAll('.type-icon');
      expect(typeIcons.length).toBeGreaterThan(0);
    });

    it('should display guides by type', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('Block Calls Android')).toBeTruthy();
      expect(screen.getByText('Block SMS iPhone')).toBeTruthy();
      expect(screen.getByText('Block WhatsApp')).toBeTruthy();
    });

    it('should have type guides containers', () => {
      const { container } = render(<ByTypeSection />);
      const typeGuides = container.querySelectorAll('.type-guides');
      expect(typeGuides.length).toBeGreaterThan(0);
    });
  });

  describe('Guide Cards', () => {
    it('should display guide cards', () => {
      const { container } = render(<ByTypeSection />);
      const guideCards = container.querySelectorAll('.type-guide-card');
      expect(guideCards.length).toBeGreaterThan(0);
    });

    it('should display guide platform icon', () => {
      const { container } = render(<ByTypeSection />);
      const platformIcons = container.querySelectorAll('.platform-icon');
      expect(platformIcons.length).toBeGreaterThan(0);
    });

    it('should display guide titles', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('Block Calls Android')).toBeTruthy();
    });

    it('should display guide descriptions', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('How to block calls on Android')).toBeTruthy();
    });

    it('should have guide links', () => {
      const { container } = render(<ByTypeSection />);
      const guideLinks = container.querySelectorAll('.guide-link');
      expect(guideLinks.length).toBeGreaterThan(0);
    });

    it('should have correct link format', () => {
      const { container } = render(<ByTypeSection />);
      const guideLink = container.querySelector('.guide-link');
      expect(guideLink.href).toContain('#guide-');
      expect(guideLink.textContent).toBe('Voir le guide →');
    });
  });

  describe('Popular Apps Section', () => {
    it('should display popular apps section', () => {
      const { container } = render(<ByTypeSection />);
      expect(container.querySelector('.popular-apps')).toBeTruthy();
    });

    it('should display popular apps title', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('Applications Populaires')).toBeTruthy();
    });

    it('should display apps grid', () => {
      const { container } = render(<ByTypeSection />);
      expect(container.querySelector('.apps-grid')).toBeTruthy();
    });

    it('should display WhatsApp', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('WhatsApp')).toBeTruthy();
    });

    it('should display Telegram', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('Telegram')).toBeTruthy();
    });

    it('should display Messenger', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('Messenger')).toBeTruthy();
    });

    it('should display Gmail', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('Gmail')).toBeTruthy();
    });

    it('should display app quick links', () => {
      const { container } = render(<ByTypeSection />);
      const appLinks = container.querySelectorAll('.app-quick-link');
      expect(appLinks.length).toBe(4);
    });

    it('should display app icons', () => {
      const { container } = render(<ByTypeSection />);
      const appIcons = container.querySelectorAll('.app-icon');
      expect(appIcons.length).toBe(4);
    });

    it('should display app descriptions', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('Bloquer sur WhatsApp')).toBeTruthy();
      expect(screen.getByText('Bloquer sur Telegram')).toBeTruthy();
      expect(screen.getByText('Bloquer sur Messenger')).toBeTruthy();
      expect(screen.getByText('Bloquer emails')).toBeTruthy();
    });
  });

  describe('CSS Classes', () => {
    it('should have proper section class', () => {
      const { container } = render(<ByTypeSection />);
      expect(container.querySelector('.by-type-section')).toBeTruthy();
    });

    it('should have types container', () => {
      const { container } = render(<ByTypeSection />);
      expect(container.querySelector('.types-container')).toBeTruthy();
    });

    it('should have type headers with correct class', () => {
      const { container } = render(<ByTypeSection />);
      const headers = container.querySelectorAll('.type-header');
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('Content Verification', () => {
    it('should display section title and intro', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('Blocage par Type de Contact')).toBeTruthy();
    });

    it('should display popular apps', () => {
      render(<ByTypeSection />);
      expect(screen.getByText('WhatsApp')).toBeTruthy();
      expect(screen.getByText('Telegram')).toBeTruthy();
    });
  });

  describe('Structure', () => {
    it('should have h2 title', () => {
      const { container } = render(<ByTypeSection />);
      const h2 = container.querySelector('.section-intro h2');
      expect(h2).toBeTruthy();
      expect(h2.textContent).toBe('Blocage par Type de Contact');
    });

    it('should have h3 headers for types and apps', () => {
      const { container } = render(<ByTypeSection />);
      const h3s = container.querySelectorAll('h3');
      expect(h3s.length).toBeGreaterThan(1);
    });

    it('should have h4 for guide titles', () => {
      const { container } = render(<ByTypeSection />);
      const h4s = container.querySelectorAll('h4');
      expect(h4s.length).toBeGreaterThan(0);
    });
  });

});
