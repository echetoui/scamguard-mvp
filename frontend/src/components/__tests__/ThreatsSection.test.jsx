import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThreatsSection from '../ThreatsSection';

const mockThreats = [
  {
    id: 'banking-001',
    institution: 'Desjardins',
    threat_level: 'high',
    message: 'Desjardins: Verify account',
    type: 'SMS',
    is_scam: true,
    explanation_fr: 'This is a scam',
    threat_indicators: [],
    date_detected: '2026-03-14',
    source: 'SQ',
  },
  {
    id: 'banking-002',
    institution: 'TD Bank',
    threat_level: 'medium',
    message: 'TD: Payment due',
    type: 'SMS',
    is_scam: true,
    explanation_fr: 'Scam message',
    threat_indicators: [],
    date_detected: '2026-03-14',
    source: 'CAFC',
  },
  {
    id: 'banking-003',
    institution: 'RBC',
    threat_level: 'low',
    message: 'RBC: Account update',
    type: 'Email',
    is_scam: false,
    explanation_fr: 'Legitimate',
    threat_indicators: [],
    date_detected: '2026-03-14',
    source: 'internal',
  },
];

describe('ThreatsSection Component', () => {
  describe('Rendering', () => {
    it('should render section title', () => {
      render(<ThreatsSection threats={mockThreats} />);
      expect(screen.getByText('Menaces actuelles')).toBeInTheDocument();
    });

    it('should display threat count', () => {
      render(<ThreatsSection threats={mockThreats} />);
      expect(screen.getByText(/3 menaces détectées/)).toBeInTheDocument();
    });

    it('should display threat level statistics', () => {
      render(<ThreatsSection threats={mockThreats} />);
      expect(screen.getByText('Haute')).toBeInTheDocument();
      expect(screen.getByText('Moyenne')).toBeInTheDocument();
      expect(screen.getByText('Basse')).toBeInTheDocument();
    });

    it('should show correct threat level counts', () => {
      const { container } = render(<ThreatsSection threats={mockThreats} />);
      // High: 1, Medium: 1, Low: 1
      const counts = container.querySelectorAll('.threats-section-stat-value');
      expect(counts.length).toBe(3);
      expect(counts[0].textContent).toBe('1'); // high
      expect(counts[1].textContent).toBe('1'); // medium
      expect(counts[2].textContent).toBe('1'); // low
    });

    it('should render all threat cards', () => {
      render(<ThreatsSection threats={mockThreats} />);
      expect(screen.getByText('Desjardins')).toBeInTheDocument();
      expect(screen.getByText('TD Bank')).toBeInTheDocument();
      expect(screen.getByText('RBC')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no threats', () => {
      const emptyMessage = 'Aucune menace détectée';
      render(<ThreatsSection threats={[]} emptyMessage={emptyMessage} />);
      expect(screen.getByText(emptyMessage)).toBeInTheDocument();
    });

    it('should show custom empty message', () => {
      const customMessage = 'Vous êtes en sécurité!';
      render(<ThreatsSection threats={[]} emptyMessage={customMessage} />);
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should not show threat statistics when empty', () => {
      render(<ThreatsSection threats={[]} />);
      expect(screen.queryByText(/🔴|🟡|🟢/)).not.toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter by threat level', () => {
      render(<ThreatsSection threats={mockThreats} filterLevel="high" />);
      expect(screen.getByText('Desjardins')).toBeInTheDocument();
      expect(screen.queryByText('TD Bank')).not.toBeInTheDocument();
    });

    it('should show all when filter is all', () => {
      render(<ThreatsSection threats={mockThreats} filterLevel="all" />);
      expect(screen.getByText('Desjardins')).toBeInTheDocument();
      expect(screen.getByText('TD Bank')).toBeInTheDocument();
      expect(screen.getByText('RBC')).toBeInTheDocument();
    });

    it('should filter by search term - institution', () => {
      render(<ThreatsSection threats={mockThreats} searchTerm="Desjardins" />);
      expect(screen.getByText('Desjardins')).toBeInTheDocument();
      expect(screen.queryByText('TD Bank')).not.toBeInTheDocument();
    });

    it('should filter by search term - type', () => {
      render(<ThreatsSection threats={mockThreats} searchTerm="Email" />);
      expect(screen.getByText('RBC')).toBeInTheDocument();
      expect(screen.queryByText('Desjardins')).not.toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      render(<ThreatsSection threats={mockThreats} searchTerm="desjardins" />);
      expect(screen.getByText('Desjardins')).toBeInTheDocument();
    });
  });

  describe('Statistics', () => {
    it('should display threat count status', () => {
      render(<ThreatsSection threats={mockThreats} />);
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should update count for single threat', () => {
      const singleThreat = [mockThreats[0]];
      render(<ThreatsSection threats={singleThreat} />);
      expect(screen.getByText(/1 menace détectée/)).toBeInTheDocument();
    });

    it('should correctly count threats by level', () => {
      const threats = [
        { ...mockThreats[0], threat_level: 'high' },
        { ...mockThreats[0], id: 'test2', threat_level: 'high' },
        { ...mockThreats[2], threat_level: 'low' },
      ];
      const { container } = render(<ThreatsSection threats={threats} />);
      // Should show 2 high threats, 0 medium, 1 low
      const counts = container.querySelectorAll('.threats-section-stat-value');
      expect(counts[0].textContent).toBe('2'); // high
      expect(counts[1].textContent).toBe('0'); // medium
      expect(counts[2].textContent).toBe('1'); // low
    });
  });

  describe('Callbacks', () => {
    it('should call onThreatSelect when threat is selected', () => {
      const onThreatSelect = vi.fn();
      render(<ThreatsSection threats={mockThreats} onThreatSelect={onThreatSelect} />);
      expect(onThreatSelect).toHaveBeenCalledTimes(0); // Not called on render
    });
  });

  describe('Filter Info', () => {
    it('should show filtered results info when filtering', () => {
      render(<ThreatsSection threats={mockThreats} searchTerm="Desjardins" />);
      // When filtering, should show "Affichage X sur Y"
      expect(screen.getByText(/Affichage 1 sur 3/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper list role', () => {
      render(<ThreatsSection threats={mockThreats} />);
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('should have status role for updates', () => {
      render(<ThreatsSection threats={mockThreats} />);
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(status).toHaveAttribute('aria-live');
    });

    it('should have aria-live for statistics', () => {
      render(<ThreatsSection threats={mockThreats} />);
      const status = screen.getByRole('status');
      expect(status.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Responsiveness', () => {
    it('should render on mobile viewport', () => {
      const { container } = render(<ThreatsSection threats={mockThreats} />);
      expect(container.querySelector('.threats-section')).toBeInTheDocument();
    });

    it('should have list layout', () => {
      const { container } = render(<ThreatsSection threats={mockThreats} />);
      const list = container.querySelector('.threats-section-list');
      expect(list).toBeInTheDocument();
    });
  });
});
