/**
 * BottomNavigation Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Tab rendering and switching
 * - Active state management
 * - Keyboard navigation (arrow keys)
 * - Accessibility features
 * - Optional family tab
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BottomNavigation, { TabPanel, NavigationLayout } from '../BottomNavigation';

describe('BottomNavigation Component', () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render navigation bar', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      expect(container.querySelector('.bottom-navigation')).toBeTruthy();
    });

    it('should render all default tabs', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const buttons = container.querySelectorAll('.nav-item');
      expect(buttons.length).toBe(6);
    });

    it('should render with family tab when hasFamily=true', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} hasFamily={true} />
      );
      const buttons = container.querySelectorAll('.nav-item');
      expect(buttons.length).toBe(7);
    });

    it('should not render family tab when hasFamily=false', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} hasFamily={false} />
      );
      const buttons = container.querySelectorAll('.nav-item');
      expect(buttons.length).toBe(6);
    });

    it('should display all tab labels', () => {
      render(<BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />);
      expect(screen.getByText('Vérifier')).toBeTruthy();
      expect(screen.getByText('Sécurité')).toBeTruthy();
      expect(screen.getByText('Académie')).toBeTruthy();
    });

    it('should display all tab icons', () => {
      render(<BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />);
      expect(screen.getByText('🔍')).toBeTruthy();
      expect(screen.getByText('❤️')).toBeTruthy();
      expect(screen.getByText('🎓')).toBeTruthy();
    });
  });

  describe('Tab Switching', () => {
    it('should call onTabChange when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />);

      const verifierTab = screen.getByText('Vérifier').closest('button');
      await user.click(verifierTab);

      expect(mockOnTabChange).toHaveBeenCalledWith('verifier');
    });

    it('should call onTabChange with correct tab IDs', async () => {
      const user = userEvent.setup();
      render(<BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />);

      const academieTab = screen.getByText('Académie').closest('button');
      await user.click(academieTab);
      expect(mockOnTabChange).toHaveBeenCalledWith('academie');
    });

    it('should update active state when activeTab prop changes', () => {
      const { rerender, container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );

      let activeTab = container.querySelector('.nav-item.active');
      expect(activeTab.textContent).toContain('Sécurité');

      rerender(
        <BottomNavigation activeTab="verifier" onTabChange={mockOnTabChange} />
      );

      activeTab = container.querySelector('.nav-item.active');
      expect(activeTab.textContent).toContain('Vérifier');
    });
  });

  describe('Active State Display', () => {
    it('should show active indicator on active tab', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const activeTab = container.querySelector('.nav-item.active');
      const indicator = activeTab.querySelector('.active-indicator');
      expect(indicator).toBeTruthy();
    });

    it('should not show active indicator on inactive tabs', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const tabs = container.querySelectorAll('.nav-item:not(.active)');
      tabs.forEach((tab) => {
        const indicator = tab.querySelector('.active-indicator');
        expect(indicator).toBeFalsy();
      });
    });

    it('should apply active class to active tab', () => {
      const { container } = render(
        <BottomNavigation activeTab="verifier" onTabChange={mockOnTabChange} />
      );
      const verifierTab = screen.getByText('Vérifier').closest('button');
      expect(verifierTab.classList.contains('active')).toBe(true);
    });

    it('should not apply active class to inactive tabs', () => {
      const { container } = render(
        <BottomNavigation activeTab="verifier" onTabChange={mockOnTabChange} />
      );
      const securityTab = screen.getByText('Sécurité').closest('button');
      expect(securityTab.classList.contains('active')).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate to previous tab with ArrowLeft', () => {
      render(<BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />);

      const securityTab = screen.getByText('Sécurité').closest('button');
      fireEvent.keyDown(securityTab, { key: 'ArrowLeft' });

      expect(mockOnTabChange).toHaveBeenCalledWith('verifier');
    });

    it('should navigate to next tab with ArrowRight', () => {
      render(<BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />);

      const securityTab = screen.getByText('Sécurité').closest('button');
      fireEvent.keyDown(securityTab, { key: 'ArrowRight' });

      expect(mockOnTabChange).toHaveBeenCalledWith('academie');
    });

    it('should not navigate left at first tab', () => {
      render(<BottomNavigation activeTab="verifier" onTabChange={mockOnTabChange} />);

      const verifierTab = screen.getByText('Vérifier').closest('button');
      fireEvent.keyDown(verifierTab, { key: 'ArrowLeft' });

      expect(mockOnTabChange).not.toHaveBeenCalled();
    });

    it('should not navigate right at last tab', () => {
      render(<BottomNavigation activeTab="parametres" onTabChange={mockOnTabChange} />);

      const parametresTab = screen.getByText('Paramètres').closest('button');
      fireEvent.keyDown(parametresTab, { key: 'ArrowRight' });

      expect(mockOnTabChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="tablist" on nav element', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const nav = container.querySelector('[role="tablist"]');
      expect(nav).toBeTruthy();
    });

    it('should have aria-label on nav', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const nav = container.querySelector('[aria-label="Navigation principale"]');
      expect(nav).toBeTruthy();
    });

    it('should have role="tab" on tab buttons', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(6);
    });

    it('should have aria-selected on tabs', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const activeTab = container.querySelector('[aria-selected="true"]');
      expect(activeTab).toBeTruthy();
    });

    it('should have aria-controls linking to tab panel', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const tab = container.querySelector('[aria-controls="securite-panel"]');
      expect(tab).toBeTruthy();
    });

    it('should have descriptive aria-label on tabs', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const securityTab = screen.getByText('Sécurité').closest('button');
      expect(securityTab.getAttribute('aria-label')).toContain('Sécurité');
    });

    it('should hide decorative icons from screen readers', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Props Handling', () => {
    it('should have default activeTab value', () => {
      const { container } = render(
        <BottomNavigation onTabChange={mockOnTabChange} />
      );
      const activeTab = container.querySelector('.nav-item.active');
      expect(activeTab.textContent).toContain('Sécurité');
    });

    it('should handle missing onTabChange callback', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" />
      );
      expect(container.querySelector('.bottom-navigation')).toBeTruthy();
    });

    it('should have default hasFamily=false', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const buttons = container.querySelectorAll('.nav-item');
      const hasFamily = Array.from(buttons).some((btn) =>
        btn.textContent.includes('Famille')
      );
      expect(hasFamily).toBe(false);
    });
  });

  describe('Family Tab', () => {
    it('should include famille tab when hasFamily=true', () => {
      render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} hasFamily={true} />
      );
      expect(screen.getByText('Famille')).toBeTruthy();
    });

    it('should navigate to famille tab', async () => {
      const user = userEvent.setup();
      render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} hasFamily={true} />
      );

      const familleTab = screen.getByText('Famille').closest('button');
      await user.click(familleTab);

      expect(mockOnTabChange).toHaveBeenCalledWith('famille');
    });
  });

  describe('Styling', () => {
    it('should have nav-item class on tabs', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const items = container.querySelectorAll('.nav-item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should have nav-icon class on icons', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const icons = container.querySelectorAll('.nav-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have nav-label class on labels', () => {
      const { container } = render(
        <BottomNavigation activeTab="securite" onTabChange={mockOnTabChange} />
      );
      const labels = container.querySelectorAll('.nav-label');
      expect(labels.length).toBeGreaterThan(0);
    });
  });
});

describe('TabPanel Component', () => {
  it('should render tab panel content when active', () => {
    render(
      <TabPanel tabId="test" activeTab="test">
        <div>Test Content</div>
      </TabPanel>
    );
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('should hide tab panel when inactive', () => {
    const { container } = render(
      <TabPanel tabId="test" activeTab="other">
        <div>Test Content</div>
      </TabPanel>
    );
    const panel = container.querySelector('[hidden]');
    expect(panel).toBeTruthy();
  });

  it('should have correct role and aria attributes', () => {
    const { container } = render(
      <TabPanel tabId="test" activeTab="test">
        <div>Test Content</div>
      </TabPanel>
    );
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel).toBeTruthy();
  });

  it('should have correct ID for panel', () => {
    const { container } = render(
      <TabPanel tabId="security" activeTab="security">
        <div>Security Content</div>
      </TabPanel>
    );
    const panel = container.querySelector('#security-panel');
    expect(panel).toBeTruthy();
  });
});

describe('NavigationLayout Component', () => {
  it('should render layout with navigation', () => {
    const { container } = render(
      <NavigationLayout>
        <div>Test Content</div>
      </NavigationLayout>
    );
    expect(container.querySelector('.navigation-layout')).toBeTruthy();
    expect(container.querySelector('.bottom-navigation')).toBeTruthy();
  });

  it('should display children content', () => {
    render(
      <NavigationLayout>
        <div>Test Content</div>
      </NavigationLayout>
    );
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('should have main content area', () => {
    const { container } = render(
      <NavigationLayout>
        <div>Test Content</div>
      </NavigationLayout>
    );
    expect(container.querySelector('.navigation-content')).toBeTruthy();
  });

  it('should initialize with default active tab', () => {
    const { container } = render(
      <NavigationLayout>
        <div>Test Content</div>
      </NavigationLayout>
    );
    const activeTab = container.querySelector('.nav-item.active');
    expect(activeTab.textContent).toContain('Sécurité');
  });

  it('should handle tab changes in layout', async () => {
    const user = userEvent.setup();
    render(
      <NavigationLayout>
        <div>Test Content</div>
      </NavigationLayout>
    );

    const verifierTab = screen.getByText('Vérifier').closest('button');
    await user.click(verifierTab);

    expect(verifierTab.classList.contains('active')).toBe(true);
  });
});
