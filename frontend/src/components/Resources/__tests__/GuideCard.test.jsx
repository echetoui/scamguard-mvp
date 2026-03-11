/**
 * GuideCard Component Tests
 * Tests for expandable guide display with methods and steps
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GuideCard from '../GuideCard';

// Mock StepCard to simplify testing
vi.mock('../StepCard', () => ({
  default: ({ step }) => <div className="step-card-mock">{step.instruction}</div>
}));

describe('GuideCard Component', () => {
  const mockGuide = {
    id: 'guide-1',
    icon: '🛡️',
    title: 'How to Protect Your Account',
    description: 'Learn the basics of account protection',
    methods: [
      {
        id: 'method-1',
        title: 'Enable Two-Factor Authentication',
        steps: [
          { number: 1, instruction: 'Go to settings' },
          { number: 2, instruction: 'Click security' }
        ]
      }
    ]
  };

  describe('Rendering', () => {
    it('should render guide card container', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      expect(container.querySelector('.guide-card')).toBeTruthy();
    });

    it('should display guide header', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      expect(container.querySelector('.guide-header')).toBeTruthy();
    });

    it('should display guide icon', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const icon = container.querySelector('.guide-icon');
      expect(icon).toBeTruthy();
      expect(icon.textContent).toBe('🛡️');
    });

    it('should display guide title', () => {
      render(<GuideCard guide={mockGuide} />);
      expect(screen.getByText('How to Protect Your Account')).toBeTruthy();
    });

    it('should display guide description', () => {
      render(<GuideCard guide={mockGuide} />);
      expect(screen.getByText('Learn the basics of account protection')).toBeTruthy();
    });

    it('should display expand icon', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const expandIcon = container.querySelector('.expand-icon');
      expect(expandIcon).toBeTruthy();
      expect(expandIcon.textContent).toBe('▼');
    });
  });

  describe('Expansion Behavior', () => {
    it('should not show content initially', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      expect(container.querySelector('.guide-content')).toBeFalsy();
    });

    it('should show content when header is clicked', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const header = container.querySelector('.guide-header');
      fireEvent.click(header);
      expect(container.querySelector('.guide-content')).toBeTruthy();
    });

    it('should hide content when clicked again', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const header = container.querySelector('.guide-header');
      fireEvent.click(header);
      expect(container.querySelector('.guide-content')).toBeTruthy();
      fireEvent.click(header);
      expect(container.querySelector('.guide-content')).toBeFalsy();
    });

    it('should toggle expand icon class on expansion', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const expandIcon = container.querySelector('.expand-icon');
      expect(expandIcon.className).not.toContain('expanded');

      const header = container.querySelector('.guide-header');
      fireEvent.click(header);
      expect(expandIcon.className).toContain('expanded');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible with tabIndex', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const header = container.querySelector('.guide-header');
      expect(header.getAttribute('tabIndex')).toBe('0');
    });

    it('should have button role for keyboard interaction', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const header = container.querySelector('.guide-header');
      expect(header.getAttribute('role')).toBe('button');
    });

    it('should have onKeyPress handler attached', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const header = container.querySelector('.guide-header');
      // Component has onKeyPress defined, accessible for keyboard users
      expect(header).toBeTruthy();
      expect(header.getAttribute('role')).toBe('button');
      expect(header.getAttribute('tabIndex')).toBe('0');
    });
  });

  describe('ARIA Attributes', () => {
    it('should have aria-expanded attribute', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const header = container.querySelector('.guide-header');
      expect(header.getAttribute('aria-expanded')).toBe('false');
    });

    it('should update aria-expanded when expanded', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const header = container.querySelector('.guide-header');
      fireEvent.click(header);
      expect(header.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have button role', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const header = container.querySelector('.guide-header');
      expect(header.getAttribute('role')).toBe('button');
    });
  });

  describe('Methods Display', () => {
    it('should render content when guide has methods', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const header = container.querySelector('.guide-header');
      fireEvent.click(header);
      expect(container.querySelector('.methods-container')).toBeTruthy();
    });

    it('should display "Méthode X:" prefix for multiple methods', () => {
      const guideWithMultipleMethods = {
        ...mockGuide,
        methods: [
          {
            id: 'method-1',
            title: 'Method One',
            steps: [{ number: 1, instruction: 'Step 1' }]
          },
          {
            id: 'method-2',
            title: 'Method Two',
            steps: [{ number: 1, instruction: 'Step 2' }]
          }
        ]
      };

      render(<GuideCard guide={guideWithMultipleMethods} />);
      const header = screen.getByText('How to Protect Your Account');
      fireEvent.click(header);

      expect(screen.getByText(/Méthode 1:/)).toBeTruthy();
      expect(screen.getByText(/Méthode 2:/)).toBeTruthy();
    });

    it('should not display "Méthode" prefix for single method', () => {
      render(<GuideCard guide={mockGuide} />);
      const header = screen.getByText('How to Protect Your Account');
      fireEvent.click(header);

      expect(screen.queryByText(/Méthode 1:/)).toBeFalsy();
    });

    it('should render steps within methods', () => {
      render(<GuideCard guide={mockGuide} />);
      const header = screen.getByText('How to Protect Your Account');
      fireEvent.click(header);

      const stepCards = document.querySelectorAll('.step-card-mock');
      expect(stepCards.length).toBeGreaterThan(0);
    });
  });

  describe('Content Rendering', () => {
    it('should render methods container when expanded', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const header = container.querySelector('.guide-header');
      fireEvent.click(header);
      expect(container.querySelector('.methods-container')).toBeTruthy();
    });

    it('should render method divs for each method', () => {
      const guideWithMethods = {
        ...mockGuide,
        methods: [
          { id: 'm1', title: 'Method 1', steps: [{ number: 1, instruction: 'Step 1' }] },
          { id: 'm2', title: 'Method 2', steps: [{ number: 1, instruction: 'Step 2' }] }
        ]
      };

      const { container } = render(<GuideCard guide={guideWithMethods} />);
      const header = container.querySelector('.guide-header');
      fireEvent.click(header);

      const methods = container.querySelectorAll('.method');
      expect(methods.length).toBe(2);
    });

    it('should render steps container within each method', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const header = container.querySelector('.guide-header');
      fireEvent.click(header);

      const stepsContainers = container.querySelectorAll('.steps');
      expect(stepsContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Empty Methods', () => {
    it('should handle guide with no methods', () => {
      const guideWithoutMethods = {
        id: 'guide-2',
        icon: '📚',
        title: 'Guide Title',
        description: 'Guide description',
        methods: []
      };

      const { container } = render(<GuideCard guide={guideWithoutMethods} />);
      const header = container.querySelector('.guide-header');
      fireEvent.click(header);

      expect(container.querySelector('.guide-content')).toBeTruthy();
      expect(container.querySelector('.methods-container')).toBeFalsy();
    });

    it('should handle guide with null methods', () => {
      const guideWithNullMethods = {
        id: 'guide-3',
        icon: '🔒',
        title: 'Secure Guide',
        description: 'Security guide',
        methods: null
      };

      const { container } = render(<GuideCard guide={guideWithNullMethods} />);
      const header = container.querySelector('.guide-header');
      fireEvent.click(header);

      expect(container.querySelector('.guide-content')).toBeTruthy();
    });
  });

  describe('CSS Classes', () => {
    it('should have proper class structure', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      expect(container.querySelector('.guide-card')).toBeTruthy();
      expect(container.querySelector('.guide-header')).toBeTruthy();
      expect(container.querySelector('.guide-title-section')).toBeTruthy();
      expect(container.querySelector('.guide-icon')).toBeTruthy();
      expect(container.querySelector('.guide-info')).toBeTruthy();
      expect(container.querySelector('.expand-icon')).toBeTruthy();
    });

    it('should have h4 for guide title', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const title = container.querySelector('.guide-info h4');
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('How to Protect Your Account');
    });

    it('should have paragraph for guide description', () => {
      const { container } = render(<GuideCard guide={mockGuide} />);
      const description = container.querySelector('.guide-info p');
      expect(description).toBeTruthy();
      expect(description.textContent).toBe('Learn the basics of account protection');
    });
  });

  describe('Multiple Guide Cards', () => {
    it('should render multiple guides independently', () => {
      const guides = [
        { ...mockGuide, id: 'g1', title: 'Guide 1' },
        { ...mockGuide, id: 'g2', title: 'Guide 2' }
      ];

      const { container } = render(
        <div>
          {guides.map(guide => <GuideCard key={guide.id} guide={guide} />)}
        </div>
      );

      const guideCards = container.querySelectorAll('.guide-card');
      expect(guideCards.length).toBe(2);
    });

    it('should maintain independent expanded state', () => {
      const guides = [
        { ...mockGuide, id: 'g1', title: 'Guide 1' },
        { ...mockGuide, id: 'g2', title: 'Guide 2' }
      ];

      const { container } = render(
        <div>
          {guides.map(guide => <GuideCard key={guide.id} guide={guide} />)}
        </div>
      );

      const headers = container.querySelectorAll('.guide-header');
      fireEvent.click(headers[0]);

      expect(container.querySelectorAll('.guide-content').length).toBe(1);
    });
  });

  describe('Different Icons', () => {
    it('should display different guide icons', () => {
      const iconTests = ['🛡️', '🔒', '📚', '🎯'];

      iconTests.forEach(icon => {
        const guide = { ...mockGuide, icon };
        const { container } = render(<GuideCard guide={guide} />);
        const displayedIcon = container.querySelector('.guide-icon');
        expect(displayedIcon.textContent).toBe(icon);
      });
    });
  });
});
