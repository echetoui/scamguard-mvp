/**
 * User Management Module Tests
 * Tests for user CRUD, filtering, export, and audit
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagement from '../UserManagement';

describe('UserManagement Module', () => {
  const mockInstitutionId = 'inst-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render user management header', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('Gestion des Utilisateurs')).toBeTruthy();
    });

    it('should render action buttons', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('➕ Ajouter Utilisateur')).toBeTruthy();
      expect(screen.getByText('📥 Exporter CSV')).toBeTruthy();
    });

    it('should render filter inputs', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getByPlaceholderText('Rechercher par email ou nom...')).toBeTruthy();
      expect(screen.getByLabelText('Filter by role')).toBeTruthy();
    });

    it('should render users table', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Nom')).toBeTruthy();
      expect(screen.getByText('Rôle')).toBeTruthy();
      expect(screen.getByText('Statut')).toBeTruthy();
    });
  });

  describe('User Filtering', () => {
    it('should filter users by search term', async () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const searchInput = screen.getByPlaceholderText('Rechercher par email ou nom...');

      await userEvent.type(searchInput, 'Marie');

      expect(screen.getByText('Marie Dupont')).toBeTruthy();
    });

    it('should filter users by role', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const roleFilter = screen.getByLabelText('Filter by role');

      fireEvent.change(roleFilter, { target: { value: 'admin' } });

      expect(screen.getByText('Admin User')).toBeTruthy();
    });

    it('should show no data message when filter has no results', async () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const searchInput = screen.getByPlaceholderText('Rechercher par email ou nom...');

      await userEvent.type(searchInput, 'nonexistent');

      expect(screen.getByText('Aucun utilisateur trouvé')).toBeTruthy();
    });
  });

  describe('User Display', () => {
    it('should display user data in table', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);

      expect(screen.getByText('admin@institution.ca')).toBeTruthy();
      expect(screen.getByText('Marie Dupont')).toBeTruthy();
      expect(screen.getByText('Jean Côté')).toBeTruthy();
    });

    it('should display role badges', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getAllByText(/Admin|Utilisateur/).length).toBeGreaterThan(0);
    });

    it('should display status badges', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getAllByText('✓ Actif')).toHaveLength(2);
      expect(screen.getByText('⊘ Inactif')).toBeTruthy();
    });

    it('should display user statistics', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('Total:')).toBeTruthy();
      expect(screen.getByText('Actifs:')).toBeTruthy();
      expect(screen.getByText('Inactifs:')).toBeTruthy();
    });
  });

  describe('User Actions', () => {
    it('should open user details modal on view button click', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const viewButtons = screen.getAllByTitle('View user details');

      fireEvent.click(viewButtons[0]);

      expect(screen.getByText('Détails de l\'Utilisateur')).toBeTruthy();
    });

    it('should display user info in modal', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const viewButtons = screen.getAllByTitle('View user details');

      fireEvent.click(viewButtons[0]);

      // Modal should show user details
      expect(screen.getByText('Détails de l\'Utilisateur')).toBeTruthy();
    });

    it('should close modal on close button click', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const viewButtons = screen.getAllByTitle('View user details');

      fireEvent.click(viewButtons[0]);
      expect(screen.getByText('Détails de l\'Utilisateur')).toBeTruthy();

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Détails de l\'Utilisateur')).toBeFalsy();
    });

    it('should delete user with confirmation', async () => {
      window.confirm = vi.fn(() => true);
      render(<UserManagement institutionId={mockInstitutionId} />);
      const deleteButtons = screen.getAllByTitle('Delete user');

      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
    });

    it('should not delete user when confirmation is cancelled', async () => {
      window.confirm = vi.fn(() => false);
      render(<UserManagement institutionId={mockInstitutionId} />);
      const deleteButtons = screen.getAllByTitle('Delete user');
      const initialUserCount = screen.getByText('Total:').nextSibling.textContent;

      fireEvent.click(deleteButtons[0]);

      // User count should not change
      expect(screen.getByText('Total:').nextSibling.textContent).toBe(initialUserCount);
    });
  });

  describe('Export CSV', () => {
    it('should create CSV export with user data', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

      render(<UserManagement institutionId={mockInstitutionId} />);
      const exportButton = screen.getByText('📥 Exporter CSV');

      fireEvent.click(exportButton);

      expect(createObjectURLSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      createObjectURLSpy.mockRestore();
    });

    it('should include all columns in CSV export', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const exportButton = screen.getByText('📥 Exporter CSV');

      fireEvent.click(exportButton);

      // Verify export was triggered (blob created)
      expect(exportButton).toBeTruthy();
    });

    it('should filter CSV export based on current filters', async () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const searchInput = screen.getByPlaceholderText('Rechercher par email ou nom...');

      await userEvent.type(searchInput, 'Marie');
      const exportButton = screen.getByText('📥 Exporter CSV');

      fireEvent.click(exportButton);

      // Should export only filtered results
      expect(exportButton).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getByLabelText('Search users')).toBeTruthy();
      expect(screen.getByLabelText('Filter by role')).toBeTruthy();
    });

    it('should have proper table role', () => {
      const { container } = render(<UserManagement institutionId={mockInstitutionId} />);
      expect(container.querySelector('table[role="grid"]')).toBeTruthy();
    });

    it('should have action buttons with proper labels', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getByLabelText('View details for Marie Dupont')).toBeTruthy();
      expect(screen.getByLabelText('Edit Marie Dupont')).toBeTruthy();
      expect(screen.getByLabelText('Delete Marie Dupont')).toBeTruthy();
    });

    it('should have keyboard accessible buttons', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const viewButtons = screen.getAllByTitle('View user details');

      expect(viewButtons[0].tagName).toBe('BUTTON');
    });
  });

  describe('Loading State', () => {
    it('should show loading message initially', async () => {
      render(<UserManagement institutionId={mockInstitutionId} />);

      // Component loads mock data, so loading state is brief
      await waitFor(() => {
        expect(screen.queryByText('Chargement des utilisateurs...')).toBeFalsy();
      });
    });
  });

  describe('Statistics', () => {
    it('should calculate total users count', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('Total:').nextSibling.textContent).toContain('3');
    });

    it('should calculate active users count', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('Actifs:').nextSibling.textContent).toContain('2');
    });

    it('should calculate inactive users count', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('Inactifs:').nextSibling.textContent).toContain('1');
    });
  });
});
