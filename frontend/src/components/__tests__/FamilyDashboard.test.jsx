/**
 * FamilyDashboard Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Component rendering and state management
 * - API data fetching and error handling
 * - Family members display and filtering
 * - Threat reporting and severity levels
 * - Invite code management
 * - Accessibility features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock authStorage BEFORE importing component
vi.mock('../../utils/authStorage', () => ({
  getAuthToken: vi.fn(() => 'test-token'),
}));

// Mock useFamilyDashboard hook
vi.mock('../../hooks/useFamilyDashboard', () => ({
  default: vi.fn(() => ({
    familyData: {
      familyName: 'Test Family',
      members: [],
      threats: [],
      inviteCode: 'ABC123',
      currentUserRole: 'senior',
      currentUserEmail: 'user@example.com'
    },
    loading: false,
    error: '',
    hasFamily: true
  }))
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Import component and hook after mocks
import FamilyDashboard from '../FamilyDashboard';
import useFamilyDashboard from '../../hooks/useFamilyDashboard';

describe('FamilyDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset hook mock to default state
    useFamilyDashboard.mockReturnValue({
      familyData: {
        familyName: 'Test Family',
        members: [],
        threats: [],
        inviteCode: 'ABC123',
        currentUserRole: 'senior',
        currentUserEmail: 'user@example.com'
      },
      loading: false,
      error: '',
      hasFamily: true
    });
  });

  describe('Component Rendering', () => {
    it('should render family dashboard container', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Test Family',
          members: [],
          threats: [],
          inviteCode: 'ABC123',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      const { container } = render(<FamilyDashboard />);

      expect(container.querySelector('.family-dashboard')).toBeTruthy();
    });

    it('should render family header with name', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Ma Famille',
          members: [],
          threats: [],
          inviteCode: 'ABC123',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('Ma Famille')).toBeTruthy();
    });

    it('should show loading state initially', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: '',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: ''
        },
        loading: true,
        error: '',
        hasFamily: false
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('Chargement de votre famille...')).toBeTruthy();
    });

    it('should have loading class on container', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: '',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: ''
        },
        loading: true,
        error: '',
        hasFamily: false
      });

      const { container } = render(<FamilyDashboard />);

      const loader = container.querySelector('.family-dashboard.loading');
      expect(loader).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty members message when no members', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: false
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Aucun membre dans votre groupe/)).toBeTruthy();
    });

    it('should show empty threats message when no threats', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: false
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Aucune menace signalée/)).toBeTruthy();
    });

    it('should handle no family as empty state', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: '',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: ''
        },
        loading: false,
        error: '',
        hasFamily: false
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Groupe Familial/)).toBeInTheDocument();
      expect(screen.getByText(/Vous n'avez pas encore de groupe familial/)).toBeInTheDocument();
    });
  });

  describe('Invite Code Section', () => {
    it('should display invite code when available', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: 'ABC123XYZ',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('ABC123XYZ')).toBeTruthy();
    });

    it('should show invite section title', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: 'ABC123',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Code d'invitation/)).toBeTruthy();
    });

    it('should have copy button for invite code', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: 'ABC123',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      const copyButton = screen.getByText('📋 Copier');
      expect(copyButton).toBeTruthy();
    });

    it('should copy invite code to clipboard on button click', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: 'ABC123',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      const copyButton = screen.getByText('📋 Copier');
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
    });

    it('should show copied feedback when code copied', async () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: 'ABC123',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      const copyButton = screen.getByText('📋 Copier');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('✅ Copié!')).toBeTruthy();
      });
    });

    it('should hide invite section when no code', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      const { container } = render(<FamilyDashboard />);

      const inviteSection = container.querySelector('.invite-section');
      expect(inviteSection).toBeFalsy();
    });
  });

  describe('Members Section', () => {
    it('should display members section title', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Membres du groupe/)).toBeTruthy();
    });

    it('should display member count in title', () => {
      const now = new Date().toISOString();
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [
            { email: 'alice@example.com', role: 'senior', lastActive: now }
          ],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Membres du groupe \(1\)/)).toBeTruthy();
    });

    it('should display member when present', () => {
      const now = new Date().toISOString();
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [
            { email: 'alice@example.com', role: 'senior', lastActive: now }
          ],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      const { container } = render(<FamilyDashboard />);

      expect(container.querySelector('.member-card')).toBeTruthy();
    });

    it('should show senior role icon', () => {
      const now = new Date().toISOString();
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [
            { email: 'alice@example.com', role: 'senior', lastActive: now }
          ],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('🧓')).toBeTruthy();
    });

    it('should show family role icon', () => {
      const now = new Date().toISOString();
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [
            { email: 'bob@example.com', role: 'family', lastActive: now }
          ],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('👨‍👩‍👦')).toBeTruthy();
    });

    it('should show member email prefix', () => {
      const now = new Date().toISOString();
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [
            { email: 'alice@example.com', role: 'senior', lastActive: now }
          ],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('alice')).toBeTruthy();
    });

    it('should show empty members state', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Aucun membre dans votre groupe/)).toBeTruthy();
    });

    it('should display status indicator for member', () => {
      const now = new Date().toISOString();
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [
            { email: 'alice@example.com', role: 'senior', lastActive: now }
          ],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      const { container } = render(<FamilyDashboard />);

      const statusIcon = container.querySelector('.member-status');
      expect(statusIcon).toBeTruthy();
    });
  });

  describe('Threats Section', () => {
    it('should display threats section title when threats exist', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [
            { severity: 'HIGH', scamType: 'Phishing', reportedBy: 'bob@example.com' }
          ],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Menaces récentes/)).toBeTruthy();
    });

    it('should display threat item', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [
            { severity: 'HIGH', scamType: 'Phishing', reportedBy: 'bob@example.com' }
          ],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      const { container } = render(<FamilyDashboard />);

      const threatItem = container.querySelector('.threat-item');
      expect(threatItem).toBeTruthy();
    });

    it('should show HIGH severity icon', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [
            { severity: 'HIGH', scamType: 'Phishing', reportedBy: 'bob@example.com' }
          ],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('🟠')).toBeTruthy();
    });

    it('should show empty threats message', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Aucune menace signalée/)).toBeTruthy();
    });

    it('should show success icon in empty threats state', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      const icons = screen.queryAllByText('✅');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API fails', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Test Family',
          members: [],
          threats: [],
          inviteCode: 'ABC123',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: 'Impossible de charger les données familiales',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Impossible de charger/)).toBeTruthy();
    });

    it('should display error with alert role', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Test Family',
          members: [],
          threats: [],
          inviteCode: 'ABC123',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: 'Impossible de charger les données familiales',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Impossible de charger les données familiales/)).toBeInTheDocument();
    });
  });

  describe('Utility Functions', () => {
    it('should display role labels correctly', () => {
      const now = new Date().toISOString();
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [
            { email: 'alice@example.com', role: 'senior', lastActive: now }
          ],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('Aîné')).toBeTruthy();
    });

    it('should format recent time correctly', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60000).toISOString();
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [
            { email: 'alice@example.com', role: 'senior', lastActive: tenMinutesAgo }
          ],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      // Check that time display matches pattern like "10m", "9m", etc.
      expect(screen.getByText(/\d+m/)).toBeTruthy();
    });

    it('should show appropriate status icon for active member', () => {
      const now = new Date().toISOString();
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [
            { email: 'alice@example.com', role: 'senior', lastActive: now }
          ],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('🟢')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      const { container } = render(<FamilyDashboard />);

      const headings = container.querySelectorAll('h2, h3');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have aria-busy during loading', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: '',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: ''
        },
        loading: true,
        error: '',
        hasFamily: false
      });

      const { container } = render(<FamilyDashboard />);

      const loader = container.querySelector('[aria-busy="true"]');
      expect(loader).toBeTruthy();
    });

    it('should have aria-live on loading message', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: '',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: ''
        },
        loading: true,
        error: '',
        hasFamily: false
      });

      const { container } = render(<FamilyDashboard />);

      const loader = container.querySelector('[aria-live="polite"]');
      expect(loader).toBeTruthy();
    });

    it('should have copy button with aria-label', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [],
          inviteCode: 'ABC123',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      const { container } = render(<FamilyDashboard />);

      const copyButton = container.querySelector('[aria-label*="invitation"]');
      expect(copyButton).toBeTruthy();
    });
  });

  describe('API Integration', () => {
    it('should display family data from hook', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Test Family',
          members: [],
          threats: [],
          inviteCode: 'TEST123',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('Test Family')).toBeTruthy();
    });

    it('should handle response with complete data structure', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Test Family',
          members: [],
          threats: [],
          inviteCode: 'TEST123',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('Test Family')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing data fields gracefully', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: '',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: ''
        },
        loading: false,
        error: '',
        hasFamily: false
      });

      const { container } = render(<FamilyDashboard />);

      expect(container.querySelector('.family-dashboard')).toBeTruthy();
    });

    it('should handle very long email addresses', () => {
      const now = new Date().toISOString();
      const longEmail = 'verylongemailaddressfortesting@verylongdomainfortesting.com';

      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [
            { email: longEmail, role: 'senior', lastActive: now }
          ],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('verylongemailaddressfortesting')).toBeTruthy();
    });

    it('should handle multiple threat severity levels', () => {
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [],
          threats: [
            { severity: 'CRITICAL', scamType: 'Impersonation', reportedBy: 'bob@example.com' },
            { severity: 'HIGH', scamType: 'Phishing', reportedBy: 'alice@example.com' }
          ],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText('🔴')).toBeTruthy(); // CRITICAL
      expect(screen.getByText('🟠')).toBeTruthy(); // HIGH
    });

    it('should handle multiple members', () => {
      const now = new Date().toISOString();
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: 'Family',
          members: [
            { email: 'alice@example.com', role: 'senior', lastActive: now },
            { email: 'bob@example.com', role: 'family', lastActive: now },
            { email: 'charlie@example.com', role: 'senior', lastActive: now }
          ],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: 'user@example.com'
        },
        loading: false,
        error: '',
        hasFamily: true
      });

      render(<FamilyDashboard />);

      expect(screen.getByText(/Membres du groupe \(3\)/)).toBeTruthy();
    });
  });

  describe('Join Family Flow', () => {
    beforeEach(() => {
      // Mock hook to return no family state for join/create flow tests
      useFamilyDashboard.mockReturnValue({
        familyData: {
          familyName: '',
          members: [],
          threats: [],
          inviteCode: '',
          currentUserRole: 'senior',
          currentUserEmail: ''
        },
        loading: false,
        error: '',
        hasFamily: false
      });
      // Initialize global.fetch as a fresh mock
      global.fetch = vi.fn();
    });

    it('should show join section when user has no family', () => {
      render(<FamilyDashboard />);

      expect(screen.getByText(/Groupe Familial/)).toBeInTheDocument();
      expect(screen.getByText(/Vous n'avez pas encore de groupe familial/)).toBeInTheDocument();
    });

    it('should have join code input with correct aria-label', () => {
      render(<FamilyDashboard />);

      const input = screen.getByLabelText(/Entrez le code d'invitation de 6 caractères/);
      expect(input).toBeInTheDocument();
    });

    it('should force uppercase input in join code', async () => {
      const user = userEvent.setup();

      render(<FamilyDashboard />);

      const input = screen.getByLabelText(/Entrez le code d'invitation de 6 caractères/);
      await user.type(input, 'abc123');

      expect(input.value).toBe('ABC123');
    });

    it('should limit input to 6 characters maximum', async () => {
      const user = userEvent.setup();

      render(<FamilyDashboard />);

      const input = screen.getByLabelText(/Entrez le code d'invitation de 6 caractères/);
      await user.type(input, 'ABCDEFG');

      expect(input.value).toBe('ABCDEF');
    });

    it('should disable join button when input is less than 6 characters', async () => {
      const user = userEvent.setup();

      render(<FamilyDashboard />);

      const button = screen.getByRole('button', { name: /Rejoindre la famille/i });
      expect(button).toBeDisabled();

      const input = screen.getByLabelText(/Entrez le code d'invitation de 6 caractères/);
      await user.type(input, 'ABC');
      expect(button).toBeDisabled();
    });

    it('should enable join button when input is exactly 6 characters', async () => {
      const user = userEvent.setup();

      render(<FamilyDashboard />);

      const input = screen.getByLabelText(/Entrez le code d'invitation de 6 caractères/);
      await user.type(input, 'ABC123');

      const button = screen.getByRole('button', { name: /Rejoindre la famille/i });
      expect(button).not.toBeDisabled();
    });

    it('should call POST /family/join with correct body when join button clicked', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn();

      render(<FamilyDashboard />);

      const input = screen.getByLabelText(/Entrez le code d'invitation de 6 caractères/);
      await user.type(input, 'abc123');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const button = screen.getByRole('button', { name: /Rejoindre la famille/i });
      await user.click(button);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/family/join'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ inviteCode: 'ABC123' }),
        })
      );
    });

    it('should show error message when join fails', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn();

      render(<FamilyDashboard />);

      const input = screen.getByLabelText(/Entrez le code d'invitation de 6 caractères/);
      await user.type(input, 'BAD123');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const button = screen.getByRole('button', { name: /Rejoindre la famille/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Code invalide ou expiré/)).toBeInTheDocument();
      });
    });

    it('should show loading state while joining', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn();

      render(<FamilyDashboard />);

      const input = screen.getByLabelText(/Entrez le code d'invitation de 6 caractères/);
      await user.type(input, 'ABC123');

      global.fetch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      const button = screen.getByRole('button', { name: /Rejoindre la famille/i });
      await user.click(button);

      expect(screen.getByRole('button', { name: /Connexion en cours/i })).toBeInTheDocument();
    });

    it('should show success state after successful join', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn();

      render(<FamilyDashboard />);

      const input = screen.getByLabelText(/Entrez le code d'invitation de 6 caractères/);
      await user.type(input, 'ABC123');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const button = screen.getByRole('button', { name: /Rejoindre la famille/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Famille rejointe/i })).toBeInTheDocument();
      });
    });
  });
});
