import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GuardianAngelPanel from '../GuardianAngelPanel';

describe('GuardianAngelPanel', () => {
  it('renders title "Mode Ange Gardien"', () => {
    const mockMembers = [
      {
        email: 'granma@example.com',
        role: 'senior',
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      }
    ];

    render(<GuardianAngelPanel members={mockMembers} />);
    const title = screen.getByText(/Mode Ange Gardien/i);
    expect(title).toBeInTheDocument();
  });

  it('filters to show only seniors', () => {
    const mockMembers = [
      {
        email: 'granma@example.com',
        role: 'senior',
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      },
      {
        email: 'caregiver@example.com',
        role: 'family',
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      }
    ];

    render(<GuardianAngelPanel members={mockMembers} />);
    const granmaText = screen.getByText('granma');
    expect(granmaText).toBeInTheDocument();
    // Caregiver should not appear
    expect(screen.queryByText('caregiver')).not.toBeInTheDocument();
  });

  it('shows empty state when no seniors', () => {
    const mockMembers = [
      {
        email: 'caregiver@example.com',
        role: 'family',
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      }
    ];

    render(<GuardianAngelPanel members={mockMembers} />);
    const emptyText = screen.getByText(/Vous n'avez aucun aîné à surveiller/i);
    expect(emptyText).toBeInTheDocument();
  });

  it('renders one card per senior', () => {
    const mockMembers = [
      {
        email: 'granma1@example.com',
        role: 'senior',
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      },
      {
        email: 'granma2@example.com',
        role: 'senior',
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      }
    ];

    render(<GuardianAngelPanel members={mockMembers} />);
    expect(screen.getByText('granma1')).toBeInTheDocument();
    expect(screen.getByText('granma2')).toBeInTheDocument();
  });

  it('displays senior username from email prefix', () => {
    const mockMembers = [
      {
        email: 'jean.dupont@example.com',
        role: 'senior',
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      }
    ];

    render(<GuardianAngelPanel members={mockMembers} />);
    expect(screen.getByText('jean.dupont')).toBeInTheDocument();
  });

  it('shows active status when lastActive is within 5 minutes', () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();

    const mockMembers = [
      {
        email: 'granma@example.com',
        role: 'senior',
        lastActive: twoMinutesAgo,
        joinedAt: new Date().toISOString()
      }
    ];

    render(<GuardianAngelPanel members={mockMembers} />);
    const actifBadges = screen.getAllByText(/Actif/);
    expect(actifBadges.length).toBeGreaterThan(0);
    // Check if the green circle emoji appears in the rendered content
    const regionWithEmoji = screen.getByRole('region').textContent;
    expect(regionWithEmoji).toContain('🟢');
  });

  it('shows inactive status when lastActive is more than 60 minutes ago', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    const mockMembers = [
      {
        email: 'granma@example.com',
        role: 'senior',
        lastActive: twoHoursAgo,
        joinedAt: new Date().toISOString()
      }
    ];

    render(<GuardianAngelPanel members={mockMembers} />);
    expect(screen.getByText(/Inactif/)).toBeInTheDocument();
    expect(screen.getByText(/⚪/)).toBeInTheDocument();
  });

  it('calls onAnalyzeMessage callback when analyze button is clicked', () => {
    const mockOnAnalyzeMessage = vi.fn();
    const mockMembers = [
      {
        email: 'granma@example.com',
        role: 'senior',
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      }
    ];

    render(
      <GuardianAngelPanel
        members={mockMembers}
        onAnalyzeMessage={mockOnAnalyzeMessage}
      />
    );

    const analyzeBtn = screen.getByRole('button', { name: /Analyser un message/i });
    fireEvent.click(analyzeBtn);
    expect(mockOnAnalyzeMessage).toHaveBeenCalledWith(mockMembers[0]);
  });

  it('calls onReportScam callback when report button is clicked', () => {
    const mockOnReportScam = vi.fn();
    const mockMembers = [
      {
        email: 'granma@example.com',
        role: 'senior',
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      }
    ];

    render(
      <GuardianAngelPanel
        members={mockMembers}
        onReportScam={mockOnReportScam}
      />
    );

    const reportBtn = screen.getByRole('button', { name: /Signaler une arnaque/i });
    fireEvent.click(reportBtn);
    expect(mockOnReportScam).toHaveBeenCalledWith(mockMembers[0]);
  });

  it('has aria landmark role="region" with accessible label', () => {
    const mockMembers = [
      {
        email: 'granma@example.com',
        role: 'senior',
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      }
    ];

    render(<GuardianAngelPanel members={mockMembers} />);
    const region = screen.getByRole('region', { name: /Mode Ange Gardien/i });
    expect(region).toBeInTheDocument();
  });
});
