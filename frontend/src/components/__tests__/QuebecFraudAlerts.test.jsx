/**
 * Tests for QuebecFraudAlerts Component
 * Phase 2 Sprint 5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuebecFraudAlerts from '../QuebecFraudAlerts';

// Mock the fetch API
global.fetch = vi.fn();

const mockAlerts = {
  threats: [
    {
      threat_id: 'QC_FRAUD_001',
      title: 'Fraude bancaire Desjardins - SMS usurpation',
      description: 'Des cybercriminels envoient des SMS...',
      institution: 'Desjardins',
      threat_level: 'high',
      type: 'SMS',
      regions: ['Montréal', 'Laval'],
      date_detected: '2026-03-15',
      prevention_tips: [
        'Ne cliquez jamais sur les liens',
        'Appelez votre banque directement',
      ],
      report_link: 'https://example.com/report',
      statistics: {
        reports_last_7_days: 127,
        affected_users: 450,
      },
    },
    {
      threat_id: 'QC_FRAUD_002',
      title: 'Arnaque appel téléphonique - TD Bank',
      description: 'Des arnaqueurs appellent...',
      institution: 'TD Bank',
      threat_level: 'medium',
      type: 'Phone',
      regions: ['Ontario', 'Québec'],
      date_detected: '2026-03-14',
      prevention_tips: [
        'Les banques ne demandent jamais votre PIN',
      ],
      report_link: 'https://example.com/report2',
      statistics: {
        reports_last_7_days: 89,
        affected_users: 320,
      },
    },
  ],
};

describe('QuebecFraudAlerts Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Loading State', () => {
    it('should display loading spinner initially', async () => {
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<QuebecFraudAlerts />);

      expect(screen.getByText(/Chargement des alertes/i)).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockAlerts,
      });
    });

    it('should render alert cards after fetching', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText('Fraude bancaire Desjardins - SMS usurpation')).toBeInTheDocument();
      });
    });

    it('should display all alerts', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText('Fraude bancaire Desjardins - SMS usurpation')).toBeInTheDocument();
        expect(screen.getByText('Arnaque appel téléphonique - TD Bank')).toBeInTheDocument();
      });
    });

    it('should display alert count in subtitle', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText(/2 alertes actuelles/i)).toBeInTheDocument();
      });
    });

    it('should display threat levels with correct styling', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText('🔴 DANGER ÉLEVÉ')).toBeInTheDocument();
        expect(screen.getByText('🟠 DANGER MOYEN')).toBeInTheDocument();
      });
    });

    it('should display alert descriptions', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText(/Des cybercriminels envoient des SMS/)).toBeInTheDocument();
      });
    });

    it('should display threat statistics', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText('127 signalements (7j)')).toBeInTheDocument();
        expect(screen.getByText('450 utilisateurs')).toBeInTheDocument();
      });
    });

    it('should display prevention tips toggle button', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        const toggleButtons = screen.getAllByText(/Conseil de prévention/i);
        expect(toggleButtons.length).toBeGreaterThan(0);
      });
    });

    it('should toggle prevention tips when clicked', async () => {
      const user = userEvent.setup();
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText('Fraude bancaire Desjardins - SMS usurpation')).toBeInTheDocument();
      });

      const toggleButtons = screen.getAllByText(/Conseil de prévention/i);
      await user.click(toggleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Ne cliquez jamais sur les liens')).toBeInTheDocument();
      });
    });

    it('should display report buttons with correct links', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        const reportButtons = screen.getAllByText(/Signaler cette fraude/i);
        expect(reportButtons[0].closest('a')).toHaveAttribute('href', 'https://example.com/report');
      });
    });

    it('should open report links in new tab', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        const reportButtons = screen.getAllByText(/Signaler cette fraude/i);
        expect(reportButtons[0].closest('a')).toHaveAttribute('target', '_blank');
        expect(reportButtons[0].closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should display footer information', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText(/Ces alertes sont mises à jour régulièrement/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message on fetch failure', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText(/Impossible de charger les actualités/i)).toBeInTheDocument();
      });
    });

    it('should display error message on HTTP error', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText(/Impossible de charger les actualités/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no alerts', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ threats: [] }),
      });

      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText(/Aucune alerte de fraude/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no Quebec alerts in response', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          threats: [
            {
              threat_id: 'DB_001',
              title: 'Some other threat',
            },
          ],
        }),
      });

      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText(/Aucune alerte de fraude/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter and display only Quebec alerts (QC_ prefix)', async () => {
      const mixedAlerts = {
        threats: [
          ...mockAlerts.threats,
          {
            threat_id: 'DB_001',
            title: 'Database threat',
            threat_level: 'low',
          },
        ],
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => mixedAlerts,
      });

      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByText('Fraude bancaire Desjardins - SMS usurpation')).toBeInTheDocument();
        expect(screen.queryByText('Database threat')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch from correct endpoint', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockAlerts,
      });

      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/threats/feed?include_quebec=true')
        );
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockAlerts,
      });
    });

    it('should have proper heading hierarchy', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      });
    });

    it('should have accessible toggle buttons', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        const toggleButtons = screen.getAllByRole('button');
        expect(toggleButtons.length).toBeGreaterThan(0);
      });
    });

    it('should have accessible links', async () => {
      render(<QuebecFraudAlerts />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
        expect(links[0]).toHaveAttribute('href');
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockAlerts,
      });
    });

    it('should render grid layout for alerts', async () => {
      const { container } = render(<QuebecFraudAlerts />);

      await waitFor(() => {
        // Check that alerts grid layout exists
        const grid = container.querySelector('.alerts-grid');
        expect(grid).toBeTruthy();
        // Check that alert cards are displayed in the grid
        const cards = container.querySelectorAll('.alert-card');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });
});
