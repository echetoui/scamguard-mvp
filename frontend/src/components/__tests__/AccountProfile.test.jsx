/**
 * AccountProfile Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Profile card rendering and avatar selection
 * - Name editing and updating
 * - Statistics display
 * - Preference toggles
 * - Data management (export, reset)
 * - Logout functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountProfile from '../AccountProfile';

describe('AccountProfile Component', () => {
  const mockProfile = {
    name: 'John Doe',
    avatar: '👴',
    preferences: {
      notifications: true,
      dailyReminder: true,
      soundEffects: false
    }
  };

  const mockStats = {
    total: 42,
    safe: 38,
    totalXpEarned: 250,
    safePercentage: 90
  };

  const mockHandlers = {
    onUpdateName: vi.fn(),
    onUpdateAvatar: vi.fn(),
    onTogglePreference: vi.fn(),
    onResetProfile: vi.fn(),
    onExportData: vi.fn(),
    onLogout: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
  });

  describe('Profile Card Rendering', () => {
    it('should render account profile container', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(container.querySelector('.account-profile')).toBeTruthy();
    });

    it('should display profile card section', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(container.querySelector('.profile-card')).toBeTruthy();
    });

    it('should show default avatar when not provided', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={{}} statistics={mockStats} />
      );

      const avatarDisplay = container.querySelector('.avatar-display');
      expect(avatarDisplay.textContent).toBe('🛡️');
    });

    it('should display user avatar', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const avatarDisplay = container.querySelector('.avatar-display');
      expect(avatarDisplay.textContent).toBe('👴');
    });
  });

  describe('Avatar Selection', () => {
    it('should display avatar picker with all options', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const picker = container.querySelector('.avatar-picker');
      expect(picker).toBeTruthy();
      expect(picker.querySelectorAll('.avatar-option').length).toBe(5);
    });

    it('should call onUpdateAvatar when avatar selected', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const avatarButton = screen.getAllByRole('button').find(btn => btn.textContent === '🧑');
      fireEvent.click(avatarButton);

      expect(mockHandlers.onUpdateAvatar).toHaveBeenCalledWith('🧑');
    });

    it('should highlight selected avatar', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const selectedAvatar = container.querySelector('.avatar-option.selected');
      expect(selectedAvatar).toBeTruthy();
      expect(selectedAvatar.textContent).toContain('👴');
    });

    it('should accept all 5 avatar options', () => {
      const avatars = ['🛡️', '👴', '👵', '🧑', '🦸'];

      avatars.forEach(emoji => {
        vi.clearAllMocks();
        const { container } = render(
          <AccountProfile
            {...mockHandlers}
            profile={{ ...mockProfile, avatar: emoji }}
            statistics={mockStats}
          />
        );

        const avatarDisplay = container.querySelector('.avatar-display');
        expect(avatarDisplay.textContent).toContain(emoji);
      });
    });
  });

  describe('Name Editing', () => {
    it('should display name in non-editing mode', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    it('should show edit button next to name', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const editButton = container.querySelector('.btn-edit');
      expect(editButton).toBeTruthy();
      expect(editButton.textContent).toContain('✏️');
    });

    it('should enter edit mode when edit button clicked', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const editButton = container.querySelector('.btn-edit');
      fireEvent.click(editButton);

      const input = container.querySelector('.name-input');
      expect(input).toBeTruthy();
      expect(input.value).toBe('John Doe');
    });

    it('should show save and cancel buttons in edit mode', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const editButton = container.querySelector('.btn-edit');
      fireEvent.click(editButton);

      expect(container.querySelector('.btn-save')).toBeTruthy();
      expect(container.querySelector('.btn-cancel')).toBeTruthy();
    });

    it('should update name when save clicked with new value', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const editButton = container.querySelector('.btn-edit');
      fireEvent.click(editButton);

      const input = container.querySelector('.name-input');
      fireEvent.change(input, { target: { value: 'Jane Smith' } });

      const saveButton = container.querySelector('.btn-save');
      fireEvent.click(saveButton);

      expect(mockHandlers.onUpdateName).toHaveBeenCalledWith('Jane Smith');
    });

    it('should not call onUpdateName when name unchanged', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const editButton = container.querySelector('.btn-edit');
      fireEvent.click(editButton);

      const saveButton = container.querySelector('.btn-save');
      fireEvent.click(saveButton);

      expect(mockHandlers.onUpdateName).not.toHaveBeenCalled();
    });

    it('should save name on Enter key press', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const editButton = container.querySelector('.btn-edit');
      fireEvent.click(editButton);

      const input = container.querySelector('.name-input');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(mockHandlers.onUpdateName).toHaveBeenCalledWith('New Name');
    });

    it('should cancel edit and revert changes', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const editButton = container.querySelector('.btn-edit');
      fireEvent.click(editButton);

      const input = container.querySelector('.name-input');
      fireEvent.change(input, { target: { value: 'Cancelled Name' } });

      const cancelButton = container.querySelector('.btn-cancel');
      fireEvent.click(cancelButton);

      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(mockHandlers.onUpdateName).not.toHaveBeenCalled();
    });

    it('should not save empty name', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const editButton = container.querySelector('.btn-edit');
      fireEvent.click(editButton);

      const input = container.querySelector('.name-input');
      fireEvent.change(input, { target: { value: '   ' } });

      const saveButton = container.querySelector('.btn-save');
      fireEvent.click(saveButton);

      expect(mockHandlers.onUpdateName).not.toHaveBeenCalled();
    });
  });

  describe('Join Date Display', () => {
    it('should display join date when provided', () => {
      render(
        <AccountProfile
          {...mockHandlers}
          profile={mockProfile}
          statistics={mockStats}
          joinDate="Member since: March 1, 2024"
        />
      );

      expect(screen.getByText('Member since: March 1, 2024')).toBeTruthy();
    });

    it('should handle empty join date', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} joinDate="" />
      );

      const joinDateDiv = container.querySelector('.join-date');
      expect(joinDateDiv).toBeTruthy();
    });
  });

  describe('Statistics Display', () => {
    it('should display statistics section title', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText(/Vos statistiques/)).toBeTruthy();
    });

    it('should display total analyses statistic', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText('42')).toBeTruthy();
    });

    it('should display safe count statistic', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText('38')).toBeTruthy();
    });

    it('should display XP earned statistic', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText('250')).toBeTruthy();
    });

    it('should display success percentage', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText('90%')).toBeTruthy();
    });

    it('should display all stat icons', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText('🔍')).toBeTruthy(); // analyses
      expect(screen.getByText('✅')).toBeTruthy(); // safe
      expect(screen.getByText('🎖️')).toBeTruthy(); // XP
      expect(screen.getByText('📈')).toBeTruthy(); // percentage
    });

    it('should default to 0 for missing statistics', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={{}} />
      );

      const statBoxes = screen.getAllByText('0');
      expect(statBoxes.length).toBeGreaterThan(0);
    });
  });

  describe('Preferences Section', () => {
    it('should display preferences section', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText(/Préférences/)).toBeTruthy();
    });

    it('should display all three preference toggles', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const toggleSwitches = container.querySelectorAll('.toggle-switch');
      expect(toggleSwitches.length).toBe(3);
    });

    it('should display notifications preference', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText('Notifications')).toBeTruthy();
    });

    it('should display daily reminder preference', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText('Rappel quotidien')).toBeTruthy();
    });

    it('should display sound effects preference', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText('Effets sonores')).toBeTruthy();
    });

    it('should toggle notifications preference', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      expect(mockHandlers.onTogglePreference).toHaveBeenCalledWith('notifications');
    });

    it('should toggle daily reminder preference', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      fireEvent.click(checkboxes[1]);

      expect(mockHandlers.onTogglePreference).toHaveBeenCalledWith('dailyReminder');
    });

    it('should toggle sound effects preference', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      fireEvent.click(checkboxes[2]);

      expect(mockHandlers.onTogglePreference).toHaveBeenCalledWith('soundEffects');
    });

    it('should reflect checked state for enabled preferences', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes[0].checked).toBe(true); // notifications
      expect(checkboxes[1].checked).toBe(true); // dailyReminder
      expect(checkboxes[2].checked).toBe(false); // soundEffects
    });

    it('should default to true for notifications and daily reminder', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={{}} statistics={mockStats} />
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes[0].checked).toBe(true);
      expect(checkboxes[1].checked).toBe(true);
    });
  });

  describe('Data & Privacy Section', () => {
    it('should display data and privacy section', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText(/Données & Confidentialité/)).toBeTruthy();
    });

    it('should display export data button', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText(/Exporter mes données/)).toBeTruthy();
    });

    it('should display reset account button', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText(/Réinitialiser le compte/)).toBeTruthy();
    });

    it('should call onExportData when export button clicked', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const exportButton = screen.getByText(/Exporter mes données/);
      fireEvent.click(exportButton);

      expect(mockHandlers.onExportData).toHaveBeenCalled();
    });

    it('should confirm before resetting profile', () => {
      window.confirm.mockReturnValue(true);

      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const resetButton = screen.getByText(/Réinitialiser le compte/);
      fireEvent.click(resetButton);

      expect(window.confirm).toHaveBeenCalled();
    });

    it('should call onResetProfile after confirmation', () => {
      window.confirm.mockReturnValue(true);

      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const resetButton = screen.getByText(/Réinitialiser le compte/);
      fireEvent.click(resetButton);

      expect(mockHandlers.onResetProfile).toHaveBeenCalled();
    });

    it('should not call onResetProfile if not confirmed', () => {
      window.confirm.mockReturnValue(false);

      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const resetButton = screen.getByText(/Réinitialiser le compte/);
      fireEvent.click(resetButton);

      expect(mockHandlers.onResetProfile).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Section', () => {
    it('should display authentication section', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText(/Authentification/)).toBeTruthy();
    });

    it('should display logout button', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText(/Se déconnecter/)).toBeTruthy();
    });

    it('should confirm before logout', () => {
      window.confirm.mockReturnValue(true);

      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const logoutButton = screen.getByText(/Se déconnecter/);
      fireEvent.click(logoutButton);

      expect(window.confirm).toHaveBeenCalled();
    });

    it('should call onLogout after confirmation', () => {
      window.confirm.mockReturnValue(true);

      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const logoutButton = screen.getByText(/Se déconnecter/);
      fireEvent.click(logoutButton);

      expect(mockHandlers.onLogout).toHaveBeenCalled();
    });

    it('should not call onLogout if not confirmed', () => {
      window.confirm.mockReturnValue(false);

      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const logoutButton = screen.getByText(/Se déconnecter/);
      fireEvent.click(logoutButton);

      expect(mockHandlers.onLogout).not.toHaveBeenCalled();
    });
  });

  describe('Default Props and Edge Cases', () => {
    it('should render with minimal props', () => {
      const { container } = render(
        <AccountProfile onUpdateName={() => {}} onUpdateAvatar={() => {}} />
      );

      expect(container.querySelector('.account-profile')).toBeTruthy();
    });

    it('should handle empty profile object', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={{}} statistics={{}} />
      );

      expect(container.querySelector('.account-profile')).toBeTruthy();
    });

    it('should render all sections', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(container.querySelector('.profile-card')).toBeTruthy();
      expect(container.querySelector('.stats-section')).toBeTruthy();
      expect(container.querySelector('.preferences-section')).toBeTruthy();
      expect(container.querySelector('.data-section')).toBeTruthy();
      expect(container.querySelector('.auth-section')).toBeTruthy();
    });

    it('should display preference icons', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText('🔔')).toBeTruthy(); // notifications
      expect(screen.getByText('📅')).toBeTruthy(); // daily reminder
      expect(screen.getByText('🔊')).toBeTruthy(); // sound effects
    });

    it('should display section icons', () => {
      render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      expect(screen.getByText(/📊/)).toBeTruthy(); // stats
      expect(screen.getByText(/⚙️/)).toBeTruthy(); // preferences
      expect(screen.getByText(/🔒/)).toBeTruthy(); // data
      expect(screen.getByText(/🔐/)).toBeTruthy(); // auth
    });
  });

  describe('Accessibility', () => {
    it('should have semantic section structure', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const headings = container.querySelectorAll('h3.section-title');
      expect(headings.length).toBe(4); // stats, prefs, data, auth
    });

    it('should have title attributes on avatar buttons', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const avatarButtons = container.querySelectorAll('.avatar-option');
      avatarButtons.forEach(btn => {
        expect(btn.getAttribute('title')).toBeTruthy();
      });
    });

    it('should have title attribute on logout button', () => {
      const { container } = render(
        <AccountProfile {...mockHandlers} profile={mockProfile} statistics={mockStats} />
      );

      const logoutButton = container.querySelector('.btn-logout');
      expect(logoutButton.getAttribute('title')).toBeTruthy();
    });
  });
});
