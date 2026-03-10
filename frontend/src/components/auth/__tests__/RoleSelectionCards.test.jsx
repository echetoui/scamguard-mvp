import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RoleSelectionCards from '../RoleSelectionCards';

describe('RoleSelectionCards', () => {
  it('renders all 3 role cards with correct labels', () => {
    const mockOnSelectRole = vi.fn();
    render(
      <RoleSelectionCards
        selectedRole=""
        onSelectRole={mockOnSelectRole}
        loading={false}
      />
    );

    expect(screen.getByText(/Je suis un Aîné/i)).toBeInTheDocument();
    expect(screen.getByText(/Je protège ma famille/i)).toBeInTheDocument();
    expect(screen.getByText(/Je souhaite une protection personnelle/i)).toBeInTheDocument();
  });

  it('fires onSelectRole callback on card click', () => {
    const mockOnSelectRole = vi.fn();
    render(
      <RoleSelectionCards
        selectedRole=""
        onSelectRole={mockOnSelectRole}
        loading={false}
      />
    );

    const seniorCards = screen.getAllByRole('button');
    fireEvent.click(seniorCards[0]);

    expect(mockOnSelectRole).toHaveBeenCalledWith('senior');
  });

  it('shows visual feedback when role is selected', () => {
    const mockOnSelectRole = vi.fn();
    const { rerender } = render(
      <RoleSelectionCards
        selectedRole="senior"
        onSelectRole={mockOnSelectRole}
        loading={false}
      />
    );

    const cards = screen.getAllByRole('button');
    expect(cards[0]).toHaveClass('selected');
  });

  it('disables buttons when loading is true', () => {
    const mockOnSelectRole = vi.fn();
    render(
      <RoleSelectionCards
        selectedRole=""
        onSelectRole={mockOnSelectRole}
        loading={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });
});
