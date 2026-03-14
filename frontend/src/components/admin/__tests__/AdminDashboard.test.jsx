/**
 * AdminDashboard Component Tests
 * Admin interface for institutional partners
 *
 * Coverage:
 * - Permission checks & access control
 * - Tab navigation
 * - Sidebar toggle functionality
 * - Child component rendering
 * - Institution info display
 * - CSS classes & accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminDashboard from '../AdminDashboard';

// Mock child modules
vi.mock('../modules/UserManagement', () => ({
  default: ({ institutionId }) => (
    <div data-testid="user-management">UserManagement - {institutionId}</div>
  ),
}));

vi.mock('../modules/AnalyticsDashboard', () => ({
  default: ({ institutionId }) => (
    <div data-testid="analytics-dashboard">AnalyticsDashboard - {institutionId}</div>
  ),
}));

vi.mock('../modules/APIKeyManagement', () => ({
  default: ({ institutionId }) => (
    <div data-testid="api-key-management">APIKeyManagement - {institutionId}</div>
  ),
}));

vi.mock('../modules/SettingsBranding', () => ({
  default: ({ institutionId }) => (
    <div data-testid="settings-branding">SettingsBranding - {institutionId}</div>
  ),
}));

describe('AdminDashboard Component', () => {
  // ============================================================================
  // PERMISSION CHECKS & ACCESS CONTROL
  // ============================================================================
  describe('Permission Checks & Access Control', () => {
    it('should render dashboard for admin role', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      expect(screen.getByText('Tableau de Bord Administrateur')).toBeTruthy();
    });

    it('should render dashboard for institutional_admin role', () => {
      render(<AdminDashboard institutionId="inst-123" role="institutional_admin" />);
      expect(screen.getByText('Tableau de Bord Administrateur')).toBeTruthy();
    });

    it('should show access denied message for user role', () => {
      render(<AdminDashboard institutionId="inst-123" role="user" />);
      expect(screen.getByText('Accès Refusé')).toBeTruthy();
    });

    it('should show access denied message for guest role', () => {
      render(<AdminDashboard institutionId="inst-123" role="guest" />);
      expect(screen.getByText('Accès Refusé')).toBeTruthy();
    });

    it('should show permission message for unauthorized users', () => {
      render(<AdminDashboard institutionId="inst-123" role="user" />);
      expect(
        screen.getByText(
          'Vous n\'avez pas les permissions nécessaires pour accéder au tableau de bord administrateur.'
        )
      ).toBeTruthy();
    });

    it('should use default admin role when not provided', () => {
      render(<AdminDashboard institutionId="inst-123" />);
      expect(screen.getByText('Tableau de Bord Administrateur')).toBeTruthy();
    });

    it('should not render child modules for unauthorized users', () => {
      render(<AdminDashboard institutionId="inst-123" role="user" />);
      expect(screen.queryByTestId('analytics-dashboard')).toBeFalsy();
      expect(screen.queryByTestId('user-management')).toBeFalsy();
    });
  });

  // ============================================================================
  // INITIAL RENDERING & DEFAULTS
  // ============================================================================
  describe('Initial Rendering & Defaults', () => {
    it('should render admin dashboard container', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      const container = document.querySelector('.admin-dashboard-container');
      expect(container).toBeTruthy();
    });

    it('should display sidebar header', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      expect(screen.getByText('ScamGuard Admin')).toBeTruthy();
    });

    it('should display main header', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      expect(screen.getByText('Tableau de Bord Administrateur')).toBeTruthy();
    });

    it('should display all navigation items', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      expect(screen.getByText(/📊 Analytiques/)).toBeTruthy();
      expect(screen.getByText(/👥 Gestion Utilisateurs/)).toBeTruthy();
      expect(screen.getByText(/🔑 Clés API/)).toBeTruthy();
      expect(screen.getByText(/⚙️ Paramètres/)).toBeTruthy();
    });

    it('should show analytics tab by default', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      expect(screen.getByTestId('analytics-dashboard')).toBeTruthy();
    });

    it('should have sidebar open by default', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );
      const sidebar = container.querySelector('.admin-sidebar.open');
      expect(sidebar).toBeTruthy();
    });
  });

  // ============================================================================
  // TAB NAVIGATION
  // ============================================================================
  describe('Tab Navigation', () => {
    it('should switch to users tab when clicked', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      fireEvent.click(screen.getByText(/👥 Gestion Utilisateurs/));
      expect(screen.getByTestId('user-management')).toBeTruthy();
    });

    it('should switch to api-keys tab when clicked', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      fireEvent.click(screen.getByText(/🔑 Clés API/));
      expect(screen.getByTestId('api-key-management')).toBeTruthy();
    });

    it('should switch to settings tab when clicked', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      fireEvent.click(screen.getByText(/⚙️ Paramètres/));
      expect(screen.getByTestId('settings-branding')).toBeTruthy();
    });

    it('should switch back to analytics tab', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      fireEvent.click(screen.getByText(/👥 Gestion Utilisateurs/));
      fireEvent.click(screen.getByText(/📊 Analytiques/));
      expect(screen.getByTestId('analytics-dashboard')).toBeTruthy();
    });

    it('should add active class to selected tab', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );
      fireEvent.click(screen.getByText(/👥 Gestion Utilisateurs/));

      const userButton = screen.getByText(/👥 Gestion Utilisateurs/);
      expect(userButton.className).toContain('active');
    });

    it('should remove active class from previous tab', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );

      const analyticsButton = screen.getByText(/📊 Analytiques/);
      expect(analyticsButton.className).toContain('active');

      fireEvent.click(screen.getByText(/👥 Gestion Utilisateurs/));

      expect(analyticsButton.className).not.toContain('active');
    });

    it('should only render one tab content at a time', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);

      // Initially analytics is shown
      expect(screen.getByTestId('analytics-dashboard')).toBeTruthy();
      expect(screen.queryByTestId('user-management')).toBeFalsy();

      // Switch to users
      fireEvent.click(screen.getByText(/👥 Gestion Utilisateurs/));

      expect(screen.queryByTestId('analytics-dashboard')).toBeFalsy();
      expect(screen.getByTestId('user-management')).toBeTruthy();
    });
  });

  // ============================================================================
  // SIDEBAR TOGGLE
  // ============================================================================
  describe('Sidebar Toggle Functionality', () => {
    it('should have toggle button', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      const toggleButton = screen.getByRole('button', { name: /Toggle sidebar/ });
      expect(toggleButton).toBeTruthy();
    });

    it('should toggle sidebar when button clicked', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );

      const toggleButton = screen.getByRole('button', { name: /Toggle sidebar/ });

      // Initially open
      let sidebar = container.querySelector('.admin-sidebar.open');
      expect(sidebar).toBeTruthy();

      // Click to close
      fireEvent.click(toggleButton);
      sidebar = container.querySelector('.admin-sidebar.closed');
      expect(sidebar).toBeTruthy();

      // Click to open
      fireEvent.click(toggleButton);
      sidebar = container.querySelector('.admin-sidebar.open');
      expect(sidebar).toBeTruthy();
    });

    it('should display toggle button with menu icon', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      const toggleButton = screen.getByRole('button', { name: /Toggle sidebar/ });
      expect(toggleButton.textContent).toContain('☰');
    });

    it('should have proper aria-label on toggle button', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      const toggleButton = screen.getByRole('button', { name: /Toggle sidebar/ });
      expect(toggleButton.getAttribute('aria-label')).toBe('Toggle sidebar');
    });
  });

  // ============================================================================
  // INSTITUTION INFO DISPLAY
  // ============================================================================
  describe('Institution Info Display', () => {
    it('should display institution ID', () => {
      render(<AdminDashboard institutionId="inst-456" role="admin" />);
      expect(screen.getByText(/ID: inst-456/)).toBeTruthy();
    });

    it('should display user role', () => {
      render(<AdminDashboard institutionId="inst-123" role="institutional_admin" />);
      expect(screen.getByText(/Rôle: institutional_admin/)).toBeTruthy();
    });

    it('should display admin role label', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      expect(screen.getByText(/Rôle: admin/)).toBeTruthy();
    });

    it('should display institution info in sidebar footer', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-789" role="admin" />
      );
      const sidebarFooter = container.querySelector('.sidebar-footer');
      expect(sidebarFooter).toBeTruthy();
      expect(sidebarFooter.textContent).toContain('inst-789');
    });
  });

  // ============================================================================
  // CHILD COMPONENT RENDERING
  // ============================================================================
  describe('Child Component Rendering', () => {
    it('should render AnalyticsDashboard with institutionId prop', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      expect(screen.getByText(/AnalyticsDashboard - inst-123/)).toBeTruthy();
    });

    it('should render UserManagement with institutionId prop', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      fireEvent.click(screen.getByText(/👥 Gestion Utilisateurs/));
      expect(screen.getByText(/UserManagement - inst-123/)).toBeTruthy();
    });

    it('should render APIKeyManagement with institutionId prop', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      fireEvent.click(screen.getByText(/🔑 Clés API/));
      expect(screen.getByText(/APIKeyManagement - inst-123/)).toBeTruthy();
    });

    it('should render SettingsBranding with institutionId prop', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      fireEvent.click(screen.getByText(/⚙️ Paramètres/));
      expect(screen.getByText(/SettingsBranding - inst-123/)).toBeTruthy();
    });

    it('should pass different institutionId to child components', () => {
      render(<AdminDashboard institutionId="inst-999" role="admin" />);
      expect(screen.getByText(/AnalyticsDashboard - inst-999/)).toBeTruthy();
    });
  });

  // ============================================================================
  // CSS CLASSES & STRUCTURE
  // ============================================================================
  describe('CSS Classes & Structure', () => {
    it('should have admin-sidebar class on sidebar', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );
      const sidebar = container.querySelector('.admin-sidebar');
      expect(sidebar).toBeTruthy();
    });

    it('should have admin-content class on main area', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );
      const content = container.querySelector('.admin-content');
      expect(content).toBeTruthy();
    });

    it('should have admin-header class on header', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );
      const header = container.querySelector('.admin-header');
      expect(header).toBeTruthy();
    });

    it('should have tab-content class on tab panels', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );
      const tabContent = container.querySelector('.tab-content');
      expect(tabContent).toBeTruthy();
    });

    it('should have admin-access-denied class on access denied page', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="user" />
      );
      const denied = container.querySelector('.admin-access-denied');
      expect(denied).toBeTruthy();
    });

    it('should have proper ARIA roles on tab panels', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );
      const tabPanel = container.querySelector('[role="tabpanel"]');
      expect(tabPanel).toBeTruthy();
    });

    it('should have aria-label on tab panels', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );
      const tabPanel = container.querySelector('[role="tabpanel"]');
      expect(tabPanel.getAttribute('aria-label')).toBe('Analytiques');
    });
  });

  // ============================================================================
  // TIMESTAMP DISPLAY
  // ============================================================================
  describe('Timestamp Display', () => {
    it('should display update timestamp', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      expect(screen.getByText(/Mis à jour:/)).toBeTruthy();
    });

    it('should display timestamp in French locale', () => {
      render(<AdminDashboard institutionId="inst-123" role="admin" />);
      const timestamp = screen.getByText(/Mis à jour:/);
      expect(timestamp.textContent).toContain('Mis à jour:');
    });
  });

  // ============================================================================
  // NAVIGATION ITEM STYLING
  // ============================================================================
  describe('Navigation Item Styling', () => {
    it('should have nav-item class on navigation buttons', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );
      const navItems = container.querySelectorAll('.nav-item');
      expect(navItems.length).toBe(4);
    });

    it('should have active class on default analytics button', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );
      const analyticsButton = screen.getByText(/📊 Analytiques/);
      expect(analyticsButton.className).toContain('nav-item');
      expect(analyticsButton.className).toContain('active');
    });

    it('should toggle active class on navigation items', () => {
      const { container } = render(
        <AdminDashboard institutionId="inst-123" role="admin" />
      );

      const analyticsButton = screen.getByText(/📊 Analytiques/);
      const usersButton = screen.getByText(/👥 Gestion Utilisateurs/);

      expect(analyticsButton.className).toContain('active');
      expect(usersButton.className).not.toContain('active');

      fireEvent.click(usersButton);

      expect(analyticsButton.className).not.toContain('active');
      expect(usersButton.className).toContain('active');
    });
  });
});
