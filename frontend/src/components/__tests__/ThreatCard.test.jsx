import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThreatCard from '../ThreatCard';

const mockThreat = {
  id: 'banking-001',
  type: 'SMS',
  institution: 'Desjardins',
  threat_level: 'high',
  message: 'Desjardins: Verify account now. Click here: https://fake-link.com',
  is_scam: true,
  explanation_fr: 'This is a phishing scam. Real banks never ask for verification via SMS links.',
  threat_indicators: ['suspicious link', 'urgency', 'bank impersonation'],
  category: 'banking',
  region: 'Quebec',
  date_detected: '2026-03-14T10:00:00Z',
  source: 'SQ',
};

describe('ThreatCard Component', () => {
  describe('Rendering', () => {
    it('should render threat card with basic info', () => {
      render(<ThreatCard threat={mockThreat} />);
      expect(screen.getByText('Desjardins')).toBeInTheDocument();
      expect(screen.getByText('SMS')).toBeInTheDocument();
    });

    it('should display threat level badge', () => {
      render(<ThreatCard threat={mockThreat} />);
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });

    it('should display threat level emoji', () => {
      render(<ThreatCard threat={mockThreat} />);
      expect(screen.getByText('🔴')).toBeInTheDocument();
    });

    it('should display message preview', () => {
      render(<ThreatCard threat={mockThreat} />);
      expect(screen.getByText(/Desjardins: Verify account/)).toBeInTheDocument();
    });

    it('should display formatted date', () => {
      render(<ThreatCard threat={mockThreat} />);
      expect(screen.getByText(/2026-03-14|14\/03\/2026|03\/14\/2026/)).toBeInTheDocument();
    });

    it('should display threat indicators preview', () => {
      render(<ThreatCard threat={mockThreat} />);
      expect(screen.getByText('Signes d\'alerte:')).toBeInTheDocument();
      expect(screen.getByText('suspicious link')).toBeInTheDocument();
    });

    it('should limit indicators preview to 2 items', () => {
      render(<ThreatCard threat={mockThreat} />);
      const indicators = screen.getAllByText(/suspicious link|urgency/);
      expect(indicators.length).toBeGreaterThanOrEqual(2);
    });

    it('should show more indicator count when > 2', () => {
      render(<ThreatCard threat={mockThreat} />);
      expect(screen.getByText(/\+1/)).toBeInTheDocument();
    });
  });

  describe('Expandable Functionality', () => {
    it('should be expandable by default', () => {
      const { container } = render(<ThreatCard threat={mockThreat} expandable={true} />);
      const card = container.querySelector('.threat-card');
      expect(card).not.toHaveClass('threat-card-expanded');
    });

    it('should expand on click', () => {
      render(<ThreatCard threat={mockThreat} expandable={true} />);
      const card = screen.getByRole('article');
      fireEvent.click(card);
      expect(card).toHaveAttribute('aria-expanded', 'true');
    });

    it('should display expanded content when expanded', () => {
      render(<ThreatCard threat={mockThreat} expandable={true} />);
      const card = screen.getByRole('article');
      fireEvent.click(card);
      expect(screen.getByText('Message complet:')).toBeInTheDocument();
      expect(screen.getByText('Explication:')).toBeInTheDocument();
    });

    it('should display full message in expanded view', () => {
      render(<ThreatCard threat={mockThreat} expandable={true} />);
      const card = screen.getByRole('article');
      fireEvent.click(card);
      expect(screen.getByText(mockThreat.message)).toBeInTheDocument();
    });

    it('should display all threat indicators in expanded view', () => {
      render(<ThreatCard threat={mockThreat} expandable={true} />);
      const card = screen.getByRole('article');
      fireEvent.click(card);
      expect(screen.getByText('bank impersonation')).toBeInTheDocument();
    });

    it('should display full explanation in expanded view', () => {
      render(<ThreatCard threat={mockThreat} expandable={true} />);
      const card = screen.getByRole('article');
      fireEvent.click(card);
      expect(screen.getByText(mockThreat.explanation_fr)).toBeInTheDocument();
    });

    it('should toggle expanded state on multiple clicks', () => {
      render(<ThreatCard threat={mockThreat} expandable={true} />);
      const card = screen.getByRole('article');
      
      fireEvent.click(card);
      expect(card).toHaveAttribute('aria-expanded', 'true');
      
      fireEvent.click(card);
      expect(card).toHaveAttribute('aria-expanded', 'false');
    });

    it('should display source info in expanded view', () => {
      render(<ThreatCard threat={mockThreat} expandable={true} />);
      const card = screen.getByRole('article');
      fireEvent.click(card);
      expect(screen.getByText(/Source|SQ/)).toBeInTheDocument();
    });

    it('should show click hint when collapsed', () => {
      render(<ThreatCard threat={mockThreat} expandable={true} />);
      expect(screen.getByText(/Cliquez pour/)).toBeInTheDocument();
    });

    it('should hide click hint when expanded', () => {
      render(<ThreatCard threat={mockThreat} expandable={true} />);
      const card = screen.getByRole('article');
      fireEvent.click(card);
      expect(screen.queryByText(/Cliquez pour/)).not.toBeInTheDocument();
    });
  });

  describe('Threat Level Styling', () => {
    it('should have danger class for high threat level', () => {
      const { container } = render(<ThreatCard threat={mockThreat} />);
      const card = container.querySelector('.threat-card-danger');
      expect(card).toBeInTheDocument();
    });

    it('should have warning class for medium threat level', () => {
      const mediumThreat = { ...mockThreat, threat_level: 'medium' };
      const { container } = render(<ThreatCard threat={mediumThreat} />);
      const card = container.querySelector('.threat-card-warning');
      expect(card).toBeInTheDocument();
    });

    it('should have success class for low threat level', () => {
      const lowThreat = { ...mockThreat, threat_level: 'low' };
      const { container } = render(<ThreatCard threat={lowThreat} />);
      const card = container.querySelector('.threat-card-success');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Message Truncation', () => {
    it('should truncate long messages in preview', () => {
      const longMessage = 'a'.repeat(150);
      const threatWithLongMsg = { ...mockThreat, message: longMessage };
      render(<ThreatCard threat={threatWithLongMsg} />);
      
      const displayedText = screen.getByText(/aaa\.\.\./);
      expect(displayedText).toBeInTheDocument();
    });

    it('should not truncate short messages', () => {
      const shortThreat = { ...mockThreat, message: 'Short' };
      render(<ThreatCard threat={shortThreat} />);
      expect(screen.getByText('Short')).toBeInTheDocument();
    });
  });

  describe('Threat Types', () => {
    it('should display correct emoji for SMS type', () => {
      render(<ThreatCard threat={mockThreat} />);
      expect(screen.getByText('📱')).toBeInTheDocument();
    });

    it('should display correct emoji for Email type', () => {
      const emailThreat = { ...mockThreat, type: 'Email' };
      render(<ThreatCard threat={emailThreat} />);
      expect(screen.getByText('💌')).toBeInTheDocument();
    });

    it('should display correct emoji for Call type', () => {
      const callThreat = { ...mockThreat, type: 'Call' };
      render(<ThreatCard threat={callThreat} />);
      expect(screen.getByText('☎️')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should handle missing threat indicators', () => {
      const threatNoIndicators = { ...mockThreat, threat_indicators: [] };
      render(<ThreatCard threat={threatNoIndicators} />);
      expect(screen.queryByText('Signes d\'alerte:')).not.toBeInTheDocument();
    });

    it('should handle missing explanation', () => {
      const threatNoExplain = { ...mockThreat, explanation_fr: null };
      render(<ThreatCard threat={threatNoExplain} expandable={true} />);
      const card = screen.getByRole('article');
      fireEvent.click(card);
      expect(screen.queryByText('Explication:')).not.toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onSelect callback when card is clicked', () => {
      const onSelect = vi.fn();
      render(<ThreatCard threat={mockThreat} onSelect={onSelect} />);
      const card = screen.getByRole('article');
      fireEvent.click(card);
      expect(onSelect).toHaveBeenCalledWith(mockThreat);
    });

    it('should pass correct threat data to callback', () => {
      const onSelect = vi.fn();
      render(<ThreatCard threat={mockThreat} onSelect={onSelect} />);
      const card = screen.getByRole('article');
      fireEvent.click(card);
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'banking-001',
          institution: 'Desjardins',
          threat_level: 'high',
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ThreatCard threat={mockThreat} />);
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-expanded');
      expect(card).toHaveAttribute('aria-label');
    });

    it('should have descriptive aria-label', () => {
      render(<ThreatCard threat={mockThreat} />);
      const card = screen.getByRole('article');
      expect(card.getAttribute('aria-label')).toContain('high');
      expect(card.getAttribute('aria-label')).toContain('Desjardins');
    });
  });

  describe('Non-Expandable Mode', () => {
    it('should not be expandable when prop is false', () => {
      const { container } = render(<ThreatCard threat={mockThreat} expandable={false} />);
      const card = container.querySelector('.threat-card');
      fireEvent.click(card);
      expect(card).not.toHaveClass('threat-card-expanded');
    });

    it('should not show click hint when not expandable', () => {
      render(<ThreatCard threat={mockThreat} expandable={false} />);
      expect(screen.queryByText(/Cliquez pour/)).not.toBeInTheDocument();
    });
  });
});
