/**
 * Analytics Dashboard Module Tests
 * Tests for metrics, charts, trends, and health status
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalyticsDashboard from '../AnalyticsDashboard';

describe('AnalyticsDashboard Module', () => {
  const mockInstitutionId = 'inst-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render analytics header', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('Analytiques et Statistiques')).toBeTruthy();
    });

    it('should render time range selector buttons', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('Jour')).toBeTruthy();
      expect(screen.getByText('Semaine')).toBeTruthy();
      expect(screen.getByText('Mois')).toBeTruthy();
      expect(screen.getByText('Année')).toBeTruthy();
    });

    it('should render all metric cards', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('Utilisateurs Actifs Quotidiens')).toBeTruthy();
      expect(screen.getByText('Utilisateurs Actifs Mensuels')).toBeTruthy();
      expect(screen.getByText('Total Analyses')).toBeTruthy();
      expect(screen.getByText('Menaces Détectées')).toBeTruthy();
      expect(screen.getByText('Taux de Rétention')).toBeTruthy();
      expect(screen.getByText('Temps Moyen par Analyse')).toBeTruthy();
    });
  });

  describe('Metrics Display', () => {
    it('should display metric values', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('1 250')).toBeTruthy(); // DAU
      expect(screen.getByText('4 850')).toBeTruthy(); // MAU
      expect(screen.getByText('18 750')).toBeTruthy(); // Total analyses
    });

    it('should display metric units', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('utilisateurs', { exact: false })).toBeTruthy();
      expect(screen.getByText('analyses', { exact: false })).toBeTruthy();
      expect(screen.getByText('arnaques', { exact: false })).toBeTruthy();
    });

    it('should display metric trend indicators', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      const trendElements = screen.getAllByText(/↑ 12%/);
      expect(trendElements.length).toBeGreaterThan(0);
    });

    it('should display metric icons', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('👥')).toBeTruthy();
      expect(screen.getByText('📊')).toBeTruthy();
      expect(screen.getByText('🔍')).toBeTruthy();
      expect(screen.getByText('⚠️')).toBeTruthy();
    });
  });

  describe('Time Range Selection', () => {
    it('should highlight active time range button', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      const monthButton = screen.getByText('Mois').closest('button');
      expect(monthButton.className).toContain('active');
    });

    it('should change active time range on button click', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      const weekButton = screen.getByText('Semaine');

      fireEvent.click(weekButton);

      expect(weekButton.closest('button').className).toContain('active');
    });

    it('should have all time range buttons clickable', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      const buttons = [
        screen.getByText('Jour'),
        screen.getByText('Semaine'),
        screen.getByText('Mois'),
        screen.getByText('Année')
      ];

      buttons.forEach(button => {
        expect(button.closest('button')).toBeTruthy();
      });
    });
  });

  describe('Charts Section', () => {
    it('should render trend chart card', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('Tendance DAU/MAU')).toBeTruthy();
    });

    it('should render analysis by type chart', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('Analyses par Type')).toBeTruthy();
    });

    it('should render chart placeholders', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText(/Graphique DAU\/MAU/)).toBeTruthy();
      expect(screen.getByText(/Graphique camembert/)).toBeTruthy();
    });

    it('should render bar chart visualization', () => {
      const { container } = render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      const bars = container.querySelectorAll('.bar');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('Threats Table', () => {
    it('should render top threats table', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('Menaces les Plus Fréquentes')).toBeTruthy();
    });

    it('should display threat table headers', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('Type d\'Arnaque')).toBeTruthy();
      expect(screen.getByText('Détections')).toBeTruthy();
      expect(screen.getByText('% du Total')).toBeTruthy();
      expect(screen.getByText('Tendance')).toBeTruthy();
    });

    it('should display threat data rows', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('SMS Phishing Bancaire')).toBeTruthy();
      expect(screen.getByText('Email Faux Paiement')).toBeTruthy();
      expect(screen.getByText('Arnaque au Support Client')).toBeTruthy();
    });

    it('should display threat statistics', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('456')).toBeTruthy(); // SMS Phishing detections
      expect(screen.getByText('36.8%')).toBeTruthy(); // SMS Phishing percentage
    });

    it('should display threat trends', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('↑ +15%')).toBeTruthy(); // Uptrend
      expect(screen.getByText('↓ -5%')).toBeTruthy(); // Downtrend
      expect(screen.getByText('→ 0%')).toBeTruthy(); // Stable
    });
  });

  describe('Health Status', () => {
    it('should render health status section', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('État de Santé de la Plateforme')).toBeTruthy();
    });

    it('should display health indicators', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText(/API Response Time/)).toBeTruthy();
      expect(screen.getByText('Database: Connected')).toBeTruthy();
      expect(screen.getByText('LLM Service: Operational')).toBeTruthy();
      expect(screen.getByText('Email Service: Operational')).toBeTruthy();
    });

    it('should display health indicator dots', () => {
      const { container } = render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      const indicators = container.querySelectorAll('.health-indicator');
      expect(indicators.length).toBeGreaterThan(0);
    });

    it('should display health metrics', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(screen.getByText('145ms')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(container.querySelector('h2')).toBeTruthy();
      expect(container.querySelector('h3')).toBeTruthy();
      expect(container.querySelector('h4')).toBeTruthy();
    });

    it('should have proper table structure', () => {
      const { container } = render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      const table = container.querySelector('table');
      expect(table.querySelector('thead')).toBeTruthy();
      expect(table.querySelector('tbody')).toBeTruthy();
    });

    it('should have properly labeled buttons', () => {
      render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button.textContent).toBeTruthy();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render metrics grid', () => {
      const { container } = render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(container.querySelector('.metrics-grid')).toBeTruthy();
    });

    it('should render charts section', () => {
      const { container } = render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(container.querySelector('.charts-section')).toBeTruthy();
    });

    it('should render threats section', () => {
      const { container } = render(<AnalyticsDashboard institutionId={mockInstitutionId} />);
      expect(container.querySelector('.threats-section')).toBeTruthy();
    });
  });
});
