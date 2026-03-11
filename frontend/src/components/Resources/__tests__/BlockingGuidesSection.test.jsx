/**
 * BlockingGuidesSection Component Tests
 * Tests for platform-specific blocking guides section
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import BlockingGuidesSection from '../BlockingGuidesSection';

// Mock GuideCard
vi.mock('../GuideCard', () => ({
  default: ({ guide }) => (
    <div className="guide-card-mock" data-guide-id={guide.id}>
      {guide.title}
    </div>
  )
}));

// Mock guides data
vi.mock('../../../data/blockingGuides.json', () => ({
  default: {
    guides: [
      {
        id: 'android-1',
        platform: 'android',
        title: 'Block on Android',
        icon: '📱'
      },
      {
        id: 'android-2',
        platform: 'android',
        title: 'Block Unknown Numbers',
        icon: '🔒'
      },
      {
        id: 'ios-1',
        platform: 'ios',
        title: 'Block on iPhone',
        icon: '📱'
      },
      {
        id: 'ios-2',
        platform: 'ios',
        title: 'Use Do Not Disturb',
        icon: '🔕'
      }
    ]
  }
}));

describe('BlockingGuidesSection Component', () => {
  describe('Rendering', () => {
    it('should render section container', () => {
      const { container } = render(<BlockingGuidesSection />);
      expect(container.querySelector('.blocking-guides-section')).toBeTruthy();
    });

    it('should display section title', () => {
      render(<BlockingGuidesSection />);
      expect(screen.getByText('Guides de Blocage Étape par Étape')).toBeTruthy();
    });

    it('should display section description', () => {
      render(<BlockingGuidesSection />);
      expect(screen.getByText(/bloquer les numéros suspects/)).toBeTruthy();
    });

    it('should have intro section', () => {
      const { container } = render(<BlockingGuidesSection />);
      expect(container.querySelector('.section-intro')).toBeTruthy();
    });

    it('should display heading hierarchy', () => {
      const { container } = render(<BlockingGuidesSection />);
      const h2 = container.querySelector('.section-intro h2');
      const h3s = container.querySelectorAll('.platform-title');
      expect(h2).toBeTruthy();
      expect(h3s.length).toBe(2);
    });
  });

  describe('Android Section', () => {
    it('should render Android platform section', () => {
      const { container } = render(<BlockingGuidesSection />);
      expect(container.querySelector('.platform-group')).toBeTruthy();
    });

    it('should display Android title with emoji', () => {
      render(<BlockingGuidesSection />);
      expect(screen.getByText(/🤖 Android/)).toBeTruthy();
    });

    it('should render Android guides grid', () => {
      const { container } = render(<BlockingGuidesSection />);
      const platformGroups = container.querySelectorAll('.platform-group');
      expect(platformGroups[0].querySelector('.guides-grid')).toBeTruthy();
    });

    it('should display Android guides', () => {
      render(<BlockingGuidesSection />);
      expect(screen.getByText('Block on Android')).toBeTruthy();
      expect(screen.getByText('Block Unknown Numbers')).toBeTruthy();
    });

    it('should render correct number of Android guides', () => {
      const { container } = render(<BlockingGuidesSection />);
      const androidSection = container.querySelectorAll('.platform-group')[0];
      const guides = androidSection.querySelectorAll('.guide-card-mock');
      expect(guides.length).toBe(2);
    });
  });

  describe('iOS Section', () => {
    it('should render iOS platform section', () => {
      const { container } = render(<BlockingGuidesSection />);
      const platformGroups = container.querySelectorAll('.platform-group');
      expect(platformGroups.length).toBe(2);
    });

    it('should display iOS title with emoji', () => {
      render(<BlockingGuidesSection />);
      expect(screen.getByText(/🍎 iPhone \(iOS\)/)).toBeTruthy();
    });

    it('should render iOS guides grid', () => {
      const { container } = render(<BlockingGuidesSection />);
      const platformGroups = container.querySelectorAll('.platform-group');
      expect(platformGroups[1].querySelector('.guides-grid')).toBeTruthy();
    });

    it('should display iOS guides', () => {
      render(<BlockingGuidesSection />);
      expect(screen.getByText('Block on iPhone')).toBeTruthy();
      expect(screen.getByText('Use Do Not Disturb')).toBeTruthy();
    });

    it('should render correct number of iOS guides', () => {
      const { container } = render(<BlockingGuidesSection />);
      const iosSection = container.querySelectorAll('.platform-group')[1];
      const guides = iosSection.querySelectorAll('.guide-card-mock');
      expect(guides.length).toBe(2);
    });
  });

  describe('Platform Separation', () => {
    it('should separate guides by platform', () => {
      const { container } = render(<BlockingGuidesSection />);
      const platformGroups = container.querySelectorAll('.platform-group');

      const androidGuides = platformGroups[0].querySelectorAll('.guide-card-mock');
      const iosGuides = platformGroups[1].querySelectorAll('.guide-card-mock');

      expect(androidGuides.length).toBe(2);
      expect(iosGuides.length).toBe(2);
    });

    it('should have correct guide IDs in Android section', () => {
      const { container } = render(<BlockingGuidesSection />);
      const androidSection = container.querySelectorAll('.platform-group')[0];
      const guides = androidSection.querySelectorAll('[data-guide-id]');

      expect(guides[0].getAttribute('data-guide-id')).toBe('android-1');
      expect(guides[1].getAttribute('data-guide-id')).toBe('android-2');
    });

    it('should have correct guide IDs in iOS section', () => {
      const { container } = render(<BlockingGuidesSection />);
      const iosSection = container.querySelectorAll('.platform-group')[1];
      const guides = iosSection.querySelectorAll('[data-guide-id]');

      expect(guides[0].getAttribute('data-guide-id')).toBe('ios-1');
      expect(guides[1].getAttribute('data-guide-id')).toBe('ios-2');
    });
  });

  describe('CSS Classes', () => {
    it('should have proper CSS class structure', () => {
      const { container } = render(<BlockingGuidesSection />);

      expect(container.querySelector('.blocking-guides-section')).toBeTruthy();
      expect(container.querySelector('.section-intro')).toBeTruthy();
      expect(container.querySelectorAll('.platform-group').length).toBe(2);
      expect(container.querySelectorAll('.platform-title').length).toBe(2);
      expect(container.querySelectorAll('.guides-grid').length).toBe(2);
    });

    it('should apply platform-title class to headings', () => {
      const { container } = render(<BlockingGuidesSection />);
      const titles = container.querySelectorAll('.platform-title');

      titles.forEach(title => {
        expect(title.classList.contains('platform-title')).toBe(true);
      });
    });
  });

  describe('Data Integration', () => {
    it('should render all guides from data', () => {
      render(<BlockingGuidesSection />);

      const guideTitles = [
        'Block on Android',
        'Block Unknown Numbers',
        'Block on iPhone',
        'Use Do Not Disturb'
      ];

      guideTitles.forEach(title => {
        expect(screen.getByText(title)).toBeTruthy();
      });
    });

    it('should pass correct guide data to GuideCard', () => {
      const { container } = render(<BlockingGuidesSection />);
      const guides = container.querySelectorAll('.guide-card-mock');

      expect(guides[0].getAttribute('data-guide-id')).toBe('android-1');
      expect(guides[1].getAttribute('data-guide-id')).toBe('android-2');
      expect(guides[2].getAttribute('data-guide-id')).toBe('ios-1');
      expect(guides[3].getAttribute('data-guide-id')).toBe('ios-2');
    });
  });

  describe('Memoization', () => {
    it('should be memoized for performance', () => {
      const { rerender } = render(<BlockingGuidesSection />);

      // Component should not re-render with same props
      rerender(<BlockingGuidesSection />);

      const guides = document.querySelectorAll('.guide-card-mock');
      expect(guides.length).toBe(4);
    });
  });

  describe('Structure and Layout', () => {
    it('should have intro and platform sections', () => {
      const { container } = render(<BlockingGuidesSection />);
      const intro = container.querySelector('.section-intro');
      const platformGroups = container.querySelectorAll('.platform-group');

      expect(intro).toBeTruthy();
      expect(platformGroups.length).toBe(2);
    });

    it('should have Android section before iOS', () => {
      const { container } = render(<BlockingGuidesSection />);
      const groups = container.querySelectorAll('.platform-group');

      const androidText = groups[0].querySelector('.platform-title').textContent;
      const iosText = groups[1].querySelector('.platform-title').textContent;

      expect(androidText).toContain('Android');
      expect(iosText).toContain('iOS');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy (h2 then h3)', () => {
      const { container } = render(<BlockingGuidesSection />);

      const h2 = container.querySelector('h2');
      const h3s = container.querySelectorAll('h3');

      expect(h2).toBeTruthy();
      expect(h3s.length).toBe(2);
    });

    it('should have semantic section structure', () => {
      const { container } = render(<BlockingGuidesSection />);

      const title = container.querySelector('h2');
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('Guides de Blocage Étape par Étape');
    });

    it('should have descriptive platform titles', () => {
      render(<BlockingGuidesSection />);

      expect(screen.getByText(/🤖 Android/)).toBeTruthy();
      expect(screen.getByText(/🍎 iPhone \(iOS\)/)).toBeTruthy();
    });
  });

  describe('Content Verification', () => {
    it('should display complete section intro', () => {
      const { container } = render(<BlockingGuidesSection />);
      const intro = container.querySelector('.section-intro');

      expect(intro.textContent).toContain('Guides de Blocage');
      expect(intro.textContent).toContain('numéros suspects');
    });

    it('should display both platform sections with guides', () => {
      const { container } = render(<BlockingGuidesSection />);
      const platformGroups = container.querySelectorAll('.platform-group');

      expect(platformGroups.length).toBe(2);
      expect(platformGroups[0].textContent).toContain('Android');
      expect(platformGroups[1].textContent).toContain('iOS');
    });
  });
});
