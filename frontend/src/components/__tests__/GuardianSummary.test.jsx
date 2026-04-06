import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuardianSummary from '../GuardianSummary';

describe('GuardianSummary Component', () => {
  const mockFamilyData = {
    familyName: 'Famille Martin',
    members: [
      { id: '1', name: 'Jean', role: 'guardian' },
      { id: '2', name: 'Marie', role: 'senior' },
      { id: '3', name: 'Sophie', role: 'senior' },
    ],
    threats: [],
  };

  const mockCallback = vi.fn();

  it('should return null when no family name and no members', () => {
    const { container } = render(
      <GuardianSummary
        familyData={{ familyName: '', members: [], threats: [] }}
        loading={false}
        onViewFamily={mockCallback}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should return null when loading is true', () => {
    const { container } = render(
      <GuardianSummary
        familyData={mockFamilyData}
        loading={true}
        onViewFamily={mockCallback}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should show family emoji and title', () => {
    render(
      <GuardianSummary
        familyData={mockFamilyData}
        loading={false}
        onViewFamily={mockCallback}
      />
    );
    expect(screen.getByText(/👨‍👩‍👧‍👦 Ma Famille/i)).toBeInTheDocument();
  });

  it('should show singular member count "1 membre protégé"', () => {
    const singleMemberFamily = { ...mockFamilyData, members: [mockFamilyData.members[0]] };
    render(
      <GuardianSummary
        familyData={singleMemberFamily}
        loading={false}
        onViewFamily={mockCallback}
      />
    );
    expect(screen.getByText(/1 membre protégé/)).toBeInTheDocument();
  });

  it('should show plural member count "3 membres protégés"', () => {
    render(
      <GuardianSummary
        familyData={mockFamilyData}
        loading={false}
        onViewFamily={mockCallback}
      />
    );
    expect(screen.getByText(/3 membres protégés/)).toBeInTheDocument();
  });

  it('should show "Voir Famille" button', () => {
    render(
      <GuardianSummary
        familyData={mockFamilyData}
        loading={false}
        onViewFamily={mockCallback}
      />
    );
    const button = screen.getByRole('button', { name: /Voir Famille/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onViewFamily when button clicked', async () => {
    const user = userEvent.setup();
    render(
      <GuardianSummary
        familyData={mockFamilyData}
        loading={false}
        onViewFamily={mockCallback}
      />
    );
    const button = screen.getByRole('button', { name: /Voir Famille/i });
    await user.click(button);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should show threat badge when threats array has items', () => {
    const familyWithThreats = {
      ...mockFamilyData,
      threats: [
        { id: '1', type: 'phishing', detected: true },
        { id: '2', type: 'sms', detected: true },
      ],
    };
    render(
      <GuardianSummary
        familyData={familyWithThreats}
        loading={false}
        onViewFamily={mockCallback}
      />
    );
    expect(screen.getByText(/⚠️ 2 menaces/)).toBeInTheDocument();
  });

  it('should show safe message when no threats', () => {
    render(
      <GuardianSummary
        familyData={mockFamilyData}
        loading={false}
        onViewFamily={mockCallback}
      />
    );
    expect(screen.getByText(/✅ Aucune menace récente/)).toBeInTheDocument();
  });

  it('should render Card component', () => {
    const { container } = render(
      <GuardianSummary
        familyData={mockFamilyData}
        loading={false}
        onViewFamily={mockCallback}
      />
    );
    expect(container.querySelector('.guardian-summary')).toBeInTheDocument();
  });
});
