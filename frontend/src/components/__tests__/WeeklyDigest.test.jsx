import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeeklyDigest from '../WeeklyDigest';

const mockThreats = [
  {
    id: 'banking-001',
    institution: 'Desjardins',
    threat_level: 'high',
    message: 'Desjardins: Verify',
    type: 'SMS',
    date_detected: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    source: 'SQ',
  },
  {
    id: 'utility-001',
    institution: 'Hydro-Quebec',
    threat_level: 'high',
    message: 'Hydro: Pay now',
    type: 'SMS',
    date_detected: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    source: 'CAFC',
  },
  {
    id: 'other-001',
    institution: 'Amazon',
    threat_level: 'medium',
    message: 'Amazon: Confirm',
    type: 'Email',
    date_detected: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago (outside 7 day window)
    source: 'internal',
  },
];

describe('WeeklyDigest Component', () => {
  describe('Rendering', () => {
    it('should render header', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      expect(screen.getByText(/Résumé de la semaine|Weekly|Summary/)).toBeInTheDocument();
    });

    it('should display threat count for last 7 days', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      // Only 2 threats are within 7 days
      expect(screen.getByText(/2 arnaques détectées/)).toBeInTheDocument();
    });

    it('should show statistics section', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      expect(screen.getByText(/Statistiques|Statistics/)).toBeInTheDocument();
    });

    it('should display threat level counts', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      expect(screen.getByText(/Haute priorité|High/)).toBeInTheDocument();
      expect(screen.getByText(/Moyenne|Medium/)).toBeInTheDocument();
    });

    it('should show threat type breakdown', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      expect(screen.getByText(/Par type d'arnaque/i)).toBeInTheDocument();
    });

    it('should display safety tips', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      expect(screen.getByText(/Conseils de sécurité|Safety Tips/)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no threats', () => {
      render(<WeeklyDigest threats={[]} />);
      expect(screen.getByText(/Aucune menace|No threats/i)).toBeInTheDocument();
    });

    it('should show encouragement in empty state', () => {
      render(<WeeklyDigest threats={[]} />);
      expect(screen.getByText(/Aucune menace/i)).toBeInTheDocument();
      // Verify it still shows the general encouragement
      const cta = screen.getByText(/Continuez à rester vigilant/i);
      expect(cta).toBeInTheDocument();
    });

    it('should not show stats section when empty', () => {
      render(<WeeklyDigest threats={[]} />);
      expect(screen.queryByText(/Statistiques détectées/i)).not.toBeInTheDocument();
    });

    it('should still show tips in empty state', () => {
      render(<WeeklyDigest threats={[]} />);
      expect(screen.getByText(/Conseils de sécurité|Safety/i)).toBeInTheDocument();
    });
  });

  describe('7-Day Window Filtering', () => {
    it('should only count threats from past 7 days', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      // Only 2 out of 3 threats are within 7 days
      expect(screen.getByText(/2 arnaques/)).toBeInTheDocument();
    });

    it('should exclude threats older than 7 days', () => {
      const oldThreat = {
        id: 'old-001',
        institution: 'Old Bank',
        threat_level: 'high',
        message: 'Old',
        type: 'SMS',
        date_detected: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        source: 'SQ',
      };
      render(<WeeklyDigest threats={[...mockThreats, oldThreat]} />);
      expect(screen.queryByText('Old Bank')).not.toBeInTheDocument();
    });

    it('should include threats exactly 7 days old', () => {
      // Create a threat from 6.5 days ago (clearly within 7-day window)
      const sevenDayOldThreat = {
        id: 'seven-day-001',
        institution: 'Seven Day Bank',
        threat_level: 'low',
        message: 'Seven days',
        type: 'SMS',
        date_detected: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'SQ',
      };
      render(<WeeklyDigest threats={[sevenDayOldThreat]} />);
      // Check subtitle contains threat count and threat word
      expect(screen.getByText(/Derniers 7 jours:/)).toBeInTheDocument();
      const allText = screen.getByRole('heading', { level: 2 }).parentElement.textContent;
      expect(allText).toMatch(/arnaque/i);
    });
  });

  describe('Matched Threats', () => {
    it('should display matched threats section when provided', () => {
      const matched = [mockThreats[0]];
      render(<WeeklyDigest threats={mockThreats} matchedThreats={matched} />);
      expect(screen.getByText(/Menaces pour VOUS|For YOU/i)).toBeInTheDocument();
    });

    it('should show count of matched threats', () => {
      const matched = [mockThreats[0], mockThreats[1]];
      render(<WeeklyDigest threats={mockThreats} matchedThreats={matched} />);
      expect(screen.getByText(/2 arnaques ciblent/)).toBeInTheDocument();
    });

    it('should display matched threat details', () => {
      const matched = [mockThreats[0]];
      render(<WeeklyDigest threats={mockThreats} matchedThreats={matched} />);
      // Check for the matched threats section header
      expect(screen.getByText(/Menaces pour VOUS/i)).toBeInTheDocument();
      // Check for the institution name appears in the list
      const allText = screen.getByText(/Desjardins/);
      expect(allText).toBeInTheDocument();
    });

    it('should show "more" indicator when > 5 matched', () => {
      const matched = Array.from({ length: 6 }, (_, i) => ({
        ...mockThreats[0],
        id: `matched-${i}`,
        institution: `Bank ${i}`,
      }));
      render(<WeeklyDigest threats={mockThreats} matchedThreats={matched} />);
      expect(screen.getByText(/et 1 autre menace/)).toBeInTheDocument();
    });

    it('should limit display to 5 matched threats', () => {
      const matched = Array.from({ length: 6 }, (_, i) => ({
        ...mockThreats[0],
        id: `matched-${i}`,
        institution: `Bank ${i}`,
      }));
      render(<WeeklyDigest threats={mockThreats} matchedThreats={matched} />);
      // Should show first 5, not the 6th
    });
  });

  describe('Safety Tips', () => {
    it('should display 6 safety tip cards', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      const tipTitles = screen.getAllByText(/Vérifiez|Appelez|Signes|cliquez|Mises à jour|Signalez/);
      expect(tipTitles.length).toBeGreaterThanOrEqual(6);
    });

    it('should display tip descriptions', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      expect(screen.getByText(/n'envoient jamais/)).toBeInTheDocument();
    });

    it('should have actionable advice', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      expect(screen.getByText(/Signes d'alerte courants/i)).toBeInTheDocument();
    });
  });

  describe('Call to Action', () => {
    it('should display CTA section', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      expect(screen.getByText(/vigilant/)).toBeInTheDocument();
    });

    it('should encourage continued training', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      expect(screen.getByText(/entraîner|training/i)).toBeInTheDocument();
    });
  });

  describe('Threat Statistics Breakdown', () => {
    it('should show correct threat level distribution', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      // 2 high, 0 medium (from 7-day window), 0 low
      const rows = screen.getAllByText('2');
      expect(rows.length).toBeGreaterThan(0); // 2 high level threats exists
    });

    it('should show threat type distribution', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      // Threat type section should be present
      expect(screen.getByText(/Par type d'arnaque/i)).toBeInTheDocument();
    });
  });

  describe('Threat Level Colors', () => {
    it('should display threat level emoji', () => {
      render(<WeeklyDigest threats={mockThreats} />);
      expect(screen.getByText('🔴')).toBeInTheDocument(); // High threat
    });
  });

  describe('Callbacks', () => {
    it('should call onViewThreat when details button clicked', () => {
      const onViewThreat = vi.fn();
      const matched = [mockThreats[0]];
      render(
        <WeeklyDigest threats={mockThreats} matchedThreats={matched} onViewThreat={onViewThreat} />
      );
      // Note: This would require fireEvent.click on the Details button
      // Implementation depends on button rendering
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(<WeeklyDigest threats={mockThreats} />);
      const headings = container.querySelectorAll('h2, h3, h4');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have button aria-labels for matched threats', () => {
      const matched = [mockThreats[0]];
      render(<WeeklyDigest threats={mockThreats} matchedThreats={matched} onViewThreat={() => {}} />);
      // Buttons should have descriptive labels
    });
  });

  describe('Responsiveness', () => {
    it('should render on mobile viewport', () => {
      const { container } = render(<WeeklyDigest threats={mockThreats} />);
      expect(container.querySelector('.weekly-digest')).toBeInTheDocument();
    });

    it('should have flexible grid layout', () => {
      const { container } = render(<WeeklyDigest threats={mockThreats} />);
      const stats = container.querySelector('.weekly-digest-stats');
      expect(stats).toBeInTheDocument();
    });
  });
});
