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

// Mock authStorage BEFORE importing component
vi.mock('../../utils/authStorage', () => ({
  getAuthToken: vi.fn(() => 'test-token'),
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Import component after mocks
import FamilyDashboard from '../FamilyDashboard';

describe('FamilyDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('Component Rendering', () => {
    it('should render family dashboard container', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Test Family',
            members: [],
            threats: [],
            inviteCode: 'ABC123'
          }
        })
      });

      const { container } = render(<FamilyDashboard />);

      await waitFor(() => {
        expect(container.querySelector('.family-dashboard')).toBeTruthy();
      });
    });

    it('should render family header with name', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Ma Famille',
            members: [],
            threats: [],
            inviteCode: 'ABC123'
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Ma Famille')).toBeTruthy();
      });
    });

    it('should show loading state initially', () => {
      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<FamilyDashboard />);

      // With auth token present, it will try to fetch and show loading
      expect(screen.getByText('Chargement de votre famille...')).toBeTruthy();
    });

    it('should have loading class on container', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<FamilyDashboard />);

      const loader = container.querySelector('.family-dashboard.loading');
      expect(loader).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty members message when no members', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Aucun membre dans votre groupe/)).toBeTruthy();
      });
    });

    it('should show empty threats message when no threats', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Aucune menace signalée/)).toBeTruthy();
      });
    });

    it('should handle 404 as empty family', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const { container } = render(<FamilyDashboard />);

      await waitFor(() => {
        expect(container.querySelector('.empty')).toBeTruthy();
      });
    });
  });

  describe('Invite Code Section', () => {
    it('should display invite code when available', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: 'ABC123XYZ'
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeTruthy();
      });
    });

    it('should show invite section title', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: 'ABC123'
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Code d'invitation/)).toBeTruthy();
      });
    });

    it('should have copy button for invite code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: 'ABC123'
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        const copyButton = screen.getByText('📋 Copier');
        expect(copyButton).toBeTruthy();
      });
    });

    it('should copy invite code to clipboard on button click', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: 'ABC123'
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        const copyButton = screen.getByText('📋 Copier');
        fireEvent.click(copyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
      });
    });

    it('should show copied feedback when code copied', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: 'ABC123'
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        const copyButton = screen.getByText('📋 Copier');
        fireEvent.click(copyButton);
      });

      await waitFor(() => {
        expect(screen.getByText('✅ Copié!')).toBeTruthy();
      });
    });

    it('should hide invite section when no code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: ''
          }
        })
      });

      const { container } = render(<FamilyDashboard />);

      await waitFor(() => {
        const inviteSection = container.querySelector('.invite-section');
        expect(inviteSection).toBeFalsy();
      });
    });
  });

  describe('Members Section', () => {
    it('should display members section title', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Membres du groupe/)).toBeTruthy();
      });
    });

    it('should display member count in title', async () => {
      const now = new Date().toISOString();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [
              { email: 'alice@example.com', role: 'senior', lastActive: now }
            ],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Membres du groupe \(1\)/)).toBeTruthy();
      });
    });

    it('should display member when present', async () => {
      const now = new Date().toISOString();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [
              { email: 'alice@example.com', role: 'senior', lastActive: now }
            ],
            threats: [],
            inviteCode: ''
          }
        })
      });

      const { container } = render(<FamilyDashboard />);

      await waitFor(() => {
        expect(container.querySelector('.member-card')).toBeTruthy();
      });
    });

    it('should show senior role icon', async () => {
      const now = new Date().toISOString();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [
              { email: 'alice@example.com', role: 'senior', lastActive: now }
            ],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('🧓')).toBeTruthy();
      });
    });

    it('should show family role icon', async () => {
      const now = new Date().toISOString();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [
              { email: 'bob@example.com', role: 'family', lastActive: now }
            ],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('👨‍👩‍👦')).toBeTruthy();
      });
    });

    it('should show member email prefix', async () => {
      const now = new Date().toISOString();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [
              { email: 'alice@example.com', role: 'senior', lastActive: now }
            ],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeTruthy();
      });
    });

    it('should show empty members state', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Aucun membre dans votre groupe/)).toBeTruthy();
      });
    });

    it('should display status indicator for member', async () => {
      const now = new Date().toISOString();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [
              { email: 'alice@example.com', role: 'senior', lastActive: now }
            ],
            threats: [],
            inviteCode: ''
          }
        })
      });

      const { container } = render(<FamilyDashboard />);

      await waitFor(() => {
        const statusIcon = container.querySelector('.member-status');
        expect(statusIcon).toBeTruthy();
      });
    });
  });

  describe('Threats Section', () => {
    it('should display threats section title when threats exist', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [
              { severity: 'HIGH', scamType: 'Phishing', reportedBy: 'bob@example.com' }
            ],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Menaces récentes/)).toBeTruthy();
      });
    });

    it('should display threat item', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [
              { severity: 'HIGH', scamType: 'Phishing', reportedBy: 'bob@example.com' }
            ],
            inviteCode: ''
          }
        })
      });

      const { container } = render(<FamilyDashboard />);

      await waitFor(() => {
        const threatItem = container.querySelector('.threat-item');
        expect(threatItem).toBeTruthy();
      });
    });

    it('should show HIGH severity icon', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [
              { severity: 'HIGH', scamType: 'Phishing', reportedBy: 'bob@example.com' }
            ],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('🟠')).toBeTruthy();
      });
    });

    it('should show empty threats message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Aucune menace signalée/)).toBeTruthy();
      });
    });

    it('should show success icon in empty threats state', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        const icons = screen.queryAllByText('✅');
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Impossible de charger/)).toBeTruthy();
      });
    });

    it('should display error with alert role', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { container } = render(<FamilyDashboard />);

      await waitFor(() => {
        const errorDiv = container.querySelector('[role="alert"]');
        expect(errorDiv).toBeTruthy();
      });
    });

    it('should call fetch with authorization header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const headers = global.fetch.mock.calls[0][1].headers;
        expect(headers.Authorization).toContain('Bearer');
      });
    });
  });

  describe('Utility Functions', () => {
    it('should display role labels correctly', async () => {
      const now = new Date().toISOString();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [
              { email: 'alice@example.com', role: 'senior', lastActive: now }
            ],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Aîné')).toBeTruthy();
      });
    });

    it('should format recent time correctly', async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60000).toISOString();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [
              { email: 'alice@example.com', role: 'senior', lastActive: tenMinutesAgo }
            ],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        // Check that time display matches pattern like "10m", "9m", etc.
        expect(screen.getByText(/\d+m/)).toBeTruthy();
      });
    });

    it('should show appropriate status icon for active member', async () => {
      const now = new Date().toISOString();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [
              { email: 'alice@example.com', role: 'senior', lastActive: now }
            ],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('🟢')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: ''
          }
        })
      });

      const { container } = render(<FamilyDashboard />);

      await waitFor(() => {
        const headings = container.querySelectorAll('h2, h3');
        expect(headings.length).toBeGreaterThan(0);
      });
    });

    it('should have aria-busy during loading', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<FamilyDashboard />);

      const loader = container.querySelector('[aria-busy="true"]');
      expect(loader).toBeTruthy();
    });

    it('should have aria-live on loading message', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<FamilyDashboard />);

      const loader = container.querySelector('[aria-live="polite"]');
      expect(loader).toBeTruthy();
    });

    it('should have copy button with aria-label', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: 'ABC123'
          }
        })
      });

      const { container } = render(<FamilyDashboard />);

      await waitFor(() => {
        const copyButton = container.querySelector('[aria-label*="invitation"]');
        expect(copyButton).toBeTruthy();
      });
    });
  });

  describe('API Integration', () => {
    it('should call fetch with correct endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/family/dashboard'),
          expect.any(Object)
        );
      });
    });

    it('should handle response with data nested in object', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Test Family',
            members: [],
            threats: [],
            inviteCode: 'TEST123'
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test Family')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing data fields gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} })
      });

      const { container } = render(<FamilyDashboard />);

      await waitFor(() => {
        expect(container.querySelector('.family-dashboard')).toBeTruthy();
      });
    });

    it('should handle very long email addresses', async () => {
      const now = new Date().toISOString();
      const longEmail = 'verylongemailaddressfortesting@verylongdomainfortesting.com';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [
              { email: longEmail, role: 'senior', lastActive: now }
            ],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('verylongemailaddressfortesting')).toBeTruthy();
      });
    });

    it('should handle multiple threat severity levels', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [],
            threats: [
              { severity: 'CRITICAL', scamType: 'Impersonation', reportedBy: 'bob@example.com' },
              { severity: 'HIGH', scamType: 'Phishing', reportedBy: 'alice@example.com' }
            ],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('🔴')).toBeTruthy(); // CRITICAL
        expect(screen.getByText('🟠')).toBeTruthy(); // HIGH
      });
    });

    it('should handle multiple members', async () => {
      const now = new Date().toISOString();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            familyName: 'Family',
            members: [
              { email: 'alice@example.com', role: 'senior', lastActive: now },
              { email: 'bob@example.com', role: 'family', lastActive: now },
              { email: 'charlie@example.com', role: 'senior', lastActive: now }
            ],
            threats: [],
            inviteCode: ''
          }
        })
      });

      render(<FamilyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Membres du groupe \(3\)/)).toBeTruthy();
      });
    });
  });
});
