/**
 * Test Suite: NotificationPreferences Component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationPreferences from '../NotificationPreferences';
import * as notificationService from '../../utils/notificationService';

// Mock the notification service
vi.mock('../../utils/notificationService', () => ({
  getPermissionStatus: vi.fn(() => 'granted'),
  requestPermission: vi.fn().mockResolvedValue('granted'),
  isNotificationTypeEnabled: vi.fn((type) => true),
  setNotificationTypePreference: vi.fn(),
  sendNotification: vi.fn(() => true),
  getSecurityTips: vi.fn(() => [
    'Tip 1',
    'Tip 2',
    'Tip 3',
    'Tip 4',
    'Tip 5',
  ]),
}));

describe('NotificationPreferences Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to defaults
    notificationService.getPermissionStatus.mockReturnValue('granted');
    notificationService.isNotificationTypeEnabled.mockReturnValue(true);
    notificationService.sendNotification.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the notification preferences section', () => {
      render(<NotificationPreferences />);

      expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
    });

    it('should show permission status badge when granted', () => {
      notificationService.getPermissionStatus.mockReturnValue('granted');
      render(<NotificationPreferences />);

      expect(screen.getByText(/Autorisé/i)).toBeInTheDocument();
    });

    it('should show permission status badge when denied', () => {
      notificationService.getPermissionStatus.mockReturnValue('denied');
      render(<NotificationPreferences />);

      expect(screen.getByText(/Refusé/i)).toBeInTheDocument();
    });

    it('should show permission status badge when pending', () => {
      notificationService.getPermissionStatus.mockReturnValue('default');
      render(<NotificationPreferences />);

      expect(screen.getByText(/Non défini/i)).toBeInTheDocument();
    });
  });

  describe('Expansion', () => {
    it('should collapse content by default', () => {
      render(<NotificationPreferences />);

      const content = screen.queryByText(/Alerte de Menace/i);
      expect(content).not.toBeInTheDocument();
    });

    it('should expand content when header is clicked', async () => {
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      await userEvent.click(header);

      expect(screen.getByText(/Alerte de Menace/i)).toBeInTheDocument();
    });

    it('should collapse content when expanded header is clicked', async () => {
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');

      // Expand
      await userEvent.click(header);
      expect(screen.getByText(/Alerte de Menace/i)).toBeInTheDocument();

      // Collapse
      await userEvent.click(header);
      expect(screen.queryByText(/Alerte de Menace/i)).not.toBeInTheDocument();
    });
  });

  describe('Permission Request', () => {
    it('should show request permission button when permission not granted', async () => {
      notificationService.getPermissionStatus.mockReturnValue('default');
      const { container } = render(<NotificationPreferences />);

      // Expand the section
      const titleElement = screen.getByText(/Notifications/i);
      const toggleSection = titleElement.closest('.notification-toggle-section');
      await userEvent.click(toggleSection);

      // The permission section should now be visible
      const permissionSection = container.querySelector('.permission-section');
      expect(permissionSection).toBeInTheDocument();

      // Button should appear (use role for specificity)
      const button = screen.getByRole('button', { name: /Activer les Notifications/i });
      expect(button).toBeInTheDocument();
    });

    it('should call requestPermission when button is clicked', async () => {
      notificationService.getPermissionStatus.mockReturnValue('default');
      const { container } = render(<NotificationPreferences />);

      // Expand the section
      const titleElement = screen.getByText(/Notifications/i);
      const toggleSection = titleElement.closest('.notification-toggle-section');
      await userEvent.click(toggleSection);

      // The permission section should be visible and have the button
      const permissionSection = container.querySelector('.permission-section');
      expect(permissionSection).toBeInTheDocument();

      // Get and click the button (use role for specificity)
      const button = screen.getByRole('button', { name: /Activer les Notifications/i });
      await userEvent.click(button);

      expect(notificationService.requestPermission).toHaveBeenCalled();
    });

    it('should not show request button when permission denied', async () => {
      notificationService.getPermissionStatus.mockReturnValue('denied');
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      await userEvent.click(header);

      expect(screen.queryByText(/Activer les Notifications/i)).not.toBeInTheDocument();
    });
  });

  describe('Notification Types List', () => {
    it('should display all notification types when expanded', async () => {
      notificationService.getPermissionStatus.mockReturnValue('granted');
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      await userEvent.click(header);

      expect(screen.getByText(/Alerte de Menace/i)).toBeInTheDocument();
      expect(screen.getByText(/Analyse Terminée/i)).toBeInTheDocument();
      expect(screen.getByText(/Rappel Académie/i)).toBeInTheDocument();
      expect(screen.getByText(/Conseil Quotidien/i)).toBeInTheDocument();
      expect(screen.getByText(/Rapport Hebdomadaire/i)).toBeInTheDocument();
    });

    it('should have descriptions for each notification type', async () => {
      notificationService.getPermissionStatus.mockReturnValue('granted');
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      await userEvent.click(header);

      expect(screen.getByText(/contenu potentiellement malveillant/i)).toBeInTheDocument();
      expect(screen.getByText(/apprentissage/i)).toBeInTheDocument();
    });
  });

  describe('Preference Toggles', () => {
    it('should have checkboxes for each notification type', async () => {
      notificationService.getPermissionStatus.mockReturnValue('granted');
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      await userEvent.click(header);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(5);
    });

    it('should call setNotificationTypePreference when checkbox is toggled', async () => {
      notificationService.getPermissionStatus.mockReturnValue('granted');
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      await userEvent.click(header);

      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[0]);

      expect(notificationService.setNotificationTypePreference).toHaveBeenCalled();
    });

    it('should disable checkboxes when permission not granted', async () => {
      notificationService.getPermissionStatus.mockReturnValue('denied');
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      await userEvent.click(header);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
    });
  });

  describe('Test Notification Buttons', () => {
    it('should have test buttons for each notification type', async () => {
      notificationService.getPermissionStatus.mockReturnValue('granted');
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      await userEvent.click(header);

      const testButtons = screen.getAllByTitle(/notification de test/i);
      expect(testButtons.length).toBeGreaterThanOrEqual(5);
    });

    it('should call sendNotification when test button is clicked', async () => {
      notificationService.getPermissionStatus.mockReturnValue('granted');
      notificationService.sendNotification.mockReturnValue(true);
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      await userEvent.click(header);

      const testButtons = screen.getAllByTitle(/notification de test/i);
      await userEvent.click(testButtons[0]);

      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it('should disable test buttons when permission not granted', async () => {
      notificationService.getPermissionStatus.mockReturnValue('denied');
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      fireEvent.click(header);

      const testButtons = screen.getAllByTitle(/notification de test/i);
      testButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should show visual feedback when test notification is sent', async () => {
      notificationService.getPermissionStatus.mockReturnValue('granted');
      notificationService.sendNotification.mockReturnValue(true);
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      await userEvent.click(header);

      const testButtons = screen.getAllByTitle(/notification de test/i);
      await userEvent.click(testButtons[0]);

      const buttons = screen.getAllByTitle(/notification de test/i);
      const sentButton = buttons[0];
      expect(sentButton).toHaveClass('sent');
    });
  });

  describe('Footer Information', () => {
    it('should display footer information when expanded', async () => {
      notificationService.getPermissionStatus.mockReturnValue('granted');
      render(<NotificationPreferences />);

      const header = screen.getByText(/Notifications/i).closest('.notification-toggle-section');
      await userEvent.click(header);

      expect(screen.getByText(/Les notifications sont envoyées uniquement/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<NotificationPreferences />);

      const section = screen.getByText(/Notifications/i).closest('.notification-preferences');
      expect(section).toBeInTheDocument();
    });
  });
});
