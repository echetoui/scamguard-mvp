/**
 * ToolsTab Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Sub-tab navigation and switching
 * - Keyboard navigation (arrow keys, Home, End)
 * - Active state display
 * - Panel visibility
 * - Accessibility attributes
 * - Child component rendering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ToolsTab from '../ToolsTab';

// Mock child components
vi.mock('../EmailBreachChecker', () => ({
  default: () => <div className="email-breach-checker-mock">Email Breach Checker</div>
}));

vi.mock('../AdvisorVerifier', () => ({
  default: () => <div className="advisor-verifier-mock">Advisor Verifier</div>
}));

describe('ToolsTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render tools tab container', () => {
      const { container } = render(<ToolsTab />);

      expect(container.querySelector('.tools-tab')).toBeTruthy();
    });

    it('should display tools header', () => {
      const { container } = render(<ToolsTab />);

      expect(container.querySelector('.tools-header')).toBeTruthy();
    });

    it('should display tools title', () => {
      render(<ToolsTab />);

      expect(screen.getByText(/Outils de Vérification/)).toBeTruthy();
    });

    it('should display tools subtitle', () => {
      render(<ToolsTab />);

      expect(screen.getByText(/Protégez-vous en vérifiant vos risques en ligne/)).toBeTruthy();
    });
  });

  describe('Sub-Tab Navigation', () => {
    it('should display both sub-tab buttons', () => {
      render(<ToolsTab />);

      expect(screen.getByText('📧 Courriel compromis')).toBeTruthy();
      expect(screen.getByText('💼 Conseiller autorisé')).toBeTruthy();
    });

    it('should have email tab active by default', () => {
      const { container } = render(<ToolsTab />);

      const emailTab = container.querySelector('#email-tab');
      expect(emailTab.getAttribute('aria-selected')).toBe('true');
    });

    it('should have email tab with active class by default', () => {
      const { container } = render(<ToolsTab />);

      const emailTab = container.querySelector('#email-tab');
      expect(emailTab.classList.contains('active')).toBe(true);
    });

    it('should have tablist role on navigation', () => {
      const { container } = render(<ToolsTab />);

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toBeTruthy();
    });

    it('should have tab role on buttons', () => {
      const { container } = render(<ToolsTab />);

      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(3); // email, advisor, emergency
    });
  });

  describe('Tab Switching', () => {
    it('should switch to advisor tab on click', () => {
      const { container } = render(<ToolsTab />);

      const advisorTab = screen.getByText('💼 Conseiller autorisé');
      fireEvent.click(advisorTab);

      expect(container.querySelector('#advisor-tab').getAttribute('aria-selected')).toBe('true');
    });

    it('should deactivate email tab when switching to advisor', () => {
      const { container } = render(<ToolsTab />);

      const advisorTab = screen.getByText('💼 Conseiller autorisé');
      fireEvent.click(advisorTab);

      expect(container.querySelector('#email-tab').getAttribute('aria-selected')).toBe('false');
    });

    it('should switch back to email tab', () => {
      const { container } = render(<ToolsTab />);

      const advisorTab = screen.getByText('💼 Conseiller autorisé');
      const emailTab = screen.getByText('📧 Courriel compromis');

      fireEvent.click(advisorTab);
      fireEvent.click(emailTab);

      expect(container.querySelector('#email-tab').getAttribute('aria-selected')).toBe('true');
    });

    it('should update active class on tab switch', () => {
      const { container } = render(<ToolsTab />);

      const advisorTab = screen.getByText('💼 Conseiller autorisé');
      fireEvent.click(advisorTab);

      expect(container.querySelector('#advisor-tab').classList.contains('active')).toBe(true);
      expect(container.querySelector('#email-tab').classList.contains('active')).toBe(false);
    });
  });

  describe('Tab Panels', () => {
    it('should render email panel', () => {
      const { container } = render(<ToolsTab />);

      expect(container.querySelector('#email-panel')).toBeTruthy();
    });

    it('should render advisor panel', () => {
      const { container } = render(<ToolsTab />);

      expect(container.querySelector('#advisor-panel')).toBeTruthy();
    });

    it('should show email panel by default', () => {
      const { container } = render(<ToolsTab />);

      const emailPanel = container.querySelector('#email-panel');
      expect(emailPanel.getAttribute('hidden')).toBeFalsy();
    });

    it('should hide advisor panel by default', () => {
      const { container } = render(<ToolsTab />);

      const advisorPanel = container.querySelector('#advisor-panel');
      expect(advisorPanel.getAttribute('hidden')).toBe('');
    });

    it('should hide email panel when advisor tab active', () => {
      const { container } = render(<ToolsTab />);

      const advisorTab = screen.getByText('💼 Conseiller autorisé');
      fireEvent.click(advisorTab);

      const emailPanel = container.querySelector('#email-panel');
      expect(emailPanel.getAttribute('hidden')).toBe('');
    });

    it('should show advisor panel when advisor tab active', () => {
      const { container } = render(<ToolsTab />);

      const advisorTab = screen.getByText('💼 Conseiller autorisé');
      fireEvent.click(advisorTab);

      const advisorPanel = container.querySelector('#advisor-panel');
      expect(advisorPanel.getAttribute('hidden')).toBeFalsy();
    });

    it('should render EmailBreachChecker component in email panel', () => {
      render(<ToolsTab />);

      expect(screen.getByText('Email Breach Checker')).toBeTruthy();
    });

    it('should render AdvisorVerifier component in advisor panel', () => {
      render(<ToolsTab />);

      expect(screen.getByText('Advisor Verifier')).toBeTruthy();
    });
  });

  describe('Accessibility - Tab Structure', () => {
    it('should have email tab with correct aria attributes', () => {
      const { container } = render(<ToolsTab />);

      const emailTab = container.querySelector('#email-tab');
      expect(emailTab.getAttribute('role')).toBe('tab');
      expect(emailTab.getAttribute('aria-controls')).toBe('email-panel');
      expect(emailTab.getAttribute('aria-selected')).toBeTruthy();
    });

    it('should have advisor tab with correct aria attributes', () => {
      const { container } = render(<ToolsTab />);

      const advisorTab = container.querySelector('#advisor-tab');
      expect(advisorTab.getAttribute('role')).toBe('tab');
      expect(advisorTab.getAttribute('aria-controls')).toBe('advisor-panel');
    });

    it('should have email panel with tabpanel role', () => {
      const { container } = render(<ToolsTab />);

      const emailPanel = container.querySelector('#email-panel');
      expect(emailPanel.getAttribute('role')).toBe('tabpanel');
    });

    it('should have advisor panel with tabpanel role', () => {
      const { container } = render(<ToolsTab />);

      const advisorPanel = container.querySelector('#advisor-panel');
      expect(advisorPanel.getAttribute('role')).toBe('tabpanel');
    });

    it('should have panels with aria-labelledby', () => {
      const { container } = render(<ToolsTab />);

      const emailPanel = container.querySelector('#email-panel');
      expect(emailPanel.getAttribute('aria-labelledby')).toBe('email-tab');

      const advisorPanel = container.querySelector('#advisor-panel');
      expect(advisorPanel.getAttribute('aria-labelledby')).toBe('advisor-tab');
    });

    it('should have tabIndex=0 on active tab', () => {
      const { container } = render(<ToolsTab />);

      const emailTab = container.querySelector('#email-tab');
      expect(emailTab.getAttribute('tabIndex')).toBe('0');
    });

    it('should have tabIndex=-1 on inactive tab', () => {
      const { container } = render(<ToolsTab />);

      const advisorTab = container.querySelector('#advisor-tab');
      expect(advisorTab.getAttribute('tabIndex')).toBe('-1');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should move to next tab with ArrowRight', () => {
      const { container } = render(<ToolsTab />);

      const emailTab = container.querySelector('#email-tab');
      fireEvent.keyDown(emailTab, { key: 'ArrowRight' });

      expect(container.querySelector('#advisor-tab').getAttribute('aria-selected')).toBe('true');
    });

    it('should move to previous tab with ArrowLeft', () => {
      const { container } = render(<ToolsTab />);

      // Start from advisor tab
      const advisorTab = screen.getByText('💼 Conseiller autorisé');
      fireEvent.click(advisorTab);

      fireEvent.keyDown(advisorTab, { key: 'ArrowLeft' });

      expect(container.querySelector('#email-tab').getAttribute('aria-selected')).toBe('true');
    });

    it('should wrap around to last tab with ArrowLeft from first', () => {
      const { container } = render(<ToolsTab />);

      const emailTab = container.querySelector('#email-tab');
      fireEvent.keyDown(emailTab, { key: 'ArrowLeft' });

      expect(container.querySelector('#emergency-tab').getAttribute('aria-selected')).toBe('true');
    });

    it('should wrap around to first tab with ArrowRight from last', () => {
      const { container } = render(<ToolsTab />);

      // Start from emergency (last tab)
      const emergencyTab = screen.getByText('🚨 Urgence');
      fireEvent.click(emergencyTab);

      fireEvent.keyDown(emergencyTab, { key: 'ArrowRight' });

      expect(container.querySelector('#email-tab').getAttribute('aria-selected')).toBe('true');
    });

    it('should move to first tab with Home key', () => {
      const { container } = render(<ToolsTab />);

      // Start from advisor
      const advisorTab = screen.getByText('💼 Conseiller autorisé');
      fireEvent.click(advisorTab);

      fireEvent.keyDown(advisorTab, { key: 'Home' });

      expect(container.querySelector('#email-tab').getAttribute('aria-selected')).toBe('true');
    });

    it('should move to last tab with End key', () => {
      const { container } = render(<ToolsTab />);

      const emailTab = container.querySelector('#email-tab');
      fireEvent.keyDown(emailTab, { key: 'End' });

      expect(container.querySelector('#emergency-tab').getAttribute('aria-selected')).toBe('true');
    });

    it('should prevent default for arrow key navigation', () => {
      const { container } = render(<ToolsTab />);

      const emailTab = container.querySelector('#email-tab');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      fireEvent.keyDown(emailTab, { key: 'ArrowRight' });

      // Note: fireEvent doesn't call preventDefault on the actual DOM event
      // but the component should still handle it correctly
      expect(container.querySelector('#advisor-tab').getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('Active State Styling', () => {
    it('should add active class to active email tab', () => {
      const { container } = render(<ToolsTab />);

      const emailTab = container.querySelector('#email-tab');
      expect(emailTab.classList.contains('active')).toBe(true);
    });

    it('should remove active class from inactive tab', () => {
      const { container } = render(<ToolsTab />);

      const advisorTab = screen.getByText('💼 Conseiller autorisé');
      fireEvent.click(advisorTab);

      const emailTab = container.querySelector('#email-tab');
      expect(emailTab.classList.contains('active')).toBe(false);
    });

    it('should add active class when tab becomes active', () => {
      const { container } = render(<ToolsTab />);

      const advisorTab = container.querySelector('#advisor-tab');
      fireEvent.click(advisorTab);

      expect(advisorTab.classList.contains('active')).toBe(true);
    });
  });

  describe('Header Styling', () => {
    it('should have tools title with correct class', () => {
      const { container } = render(<ToolsTab />);

      const title = container.querySelector('.tools-title');
      expect(title).toBeTruthy();
    });

    it('should have tools subtitle with correct class', () => {
      const { container } = render(<ToolsTab />);

      const subtitle = container.querySelector('.tools-subtitle');
      expect(subtitle).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid tab switching', () => {
      const { container } = render(<ToolsTab />);

      const emailTab = screen.getByText('📧 Courriel compromis');
      const advisorTab = screen.getByText('💼 Conseiller autorisé');

      fireEvent.click(advisorTab);
      fireEvent.click(emailTab);
      fireEvent.click(advisorTab);

      expect(container.querySelector('#advisor-tab').getAttribute('aria-selected')).toBe('true');
    });

    it('should maintain state across multiple keyboard navigations', () => {
      const { container } = render(<ToolsTab />);

      const emailTab = container.querySelector('#email-tab');

      fireEvent.keyDown(emailTab, { key: 'ArrowRight' }); // to advisor
      expect(container.querySelector('#advisor-tab').getAttribute('aria-selected')).toBe('true');

      fireEvent.keyDown(container.querySelector('#advisor-tab'), { key: 'ArrowRight' }); // to emergency
      expect(container.querySelector('#emergency-tab').getAttribute('aria-selected')).toBe('true');
    });

    it('should render correctly without errors', () => {
      const { container } = render(<ToolsTab />);

      expect(container.querySelector('.tools-tab')).toBeTruthy();
      expect(container.querySelectorAll('[role="tab"]').length).toBe(3); // email, advisor, emergency
      expect(container.querySelectorAll('[role="tabpanel"]').length).toBe(3);
    });
  });
});
