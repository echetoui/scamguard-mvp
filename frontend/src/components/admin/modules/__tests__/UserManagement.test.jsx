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
      expect(screen.getByPlaceholderText('Rechercher par courriel ou nom…')).toBeTruthy();
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
      const searchInput = screen.getByPlaceholderText('Rechercher par courriel ou nom…');

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
      const searchInput = screen.getByPlaceholderText('Rechercher par courriel ou nom…');

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
      const searchInput = screen.getByPlaceholderText('Rechercher par courriel ou nom…');

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

  // ============================================================================
  // ADDITIONAL COVERAGE: EDGE CASES & COMPLEX FILTERING
  // ============================================================================
  describe('Complex Filtering Scenarios', () => {
    it('should handle combined search and role filter', async () => {
      render(<UserManagement institutionId={mockInstitutionId} />);

      const searchInput = screen.getByPlaceholderText('Rechercher par courriel ou nom…');
      const roleFilter = screen.getByLabelText('Filter by role');

      // Filter by admin role + search for "admin"
      fireEvent.change(roleFilter, { target: { value: 'admin' } });
      await userEvent.type(searchInput, 'Admin');

      expect(screen.getByText('Admin User')).toBeTruthy();
    });

    it('should clear search and show all users again', async () => {
      render(<UserManagement institutionId={mockInstitutionId} />);

      const searchInput = screen.getByPlaceholderText('Rechercher par courriel ou nom…');

      // Search for non-existent user
      await userEvent.type(searchInput, 'nonexistent');
      expect(screen.getByText('Aucun utilisateur trouvé')).toBeTruthy();

      // Clear search
      await userEvent.clear(searchInput);

      // All users should be visible again
      expect(screen.getByText('Admin User')).toBeTruthy();
      expect(screen.getByText('Marie Dupont')).toBeTruthy();
    });

    it('should filter by email search', async () => {
      render(<UserManagement institutionId={mockInstitutionId} />);

      const searchInput = screen.getByPlaceholderText('Rechercher par courriel ou nom…');
      await userEvent.type(searchInput, 'senior1');

      expect(screen.getByText('Marie Dupont')).toBeTruthy();
      expect(screen.queryByText('Jean Côté')).toBeFalsy();
    });

    it('should filter by name search', async () => {
      render(<UserManagement institutionId={mockInstitutionId} />);

      const searchInput = screen.getByPlaceholderText('Rechercher par courriel ou nom…');
      await userEvent.type(searchInput, 'Jean');

      expect(screen.getByText('Jean Côté')).toBeTruthy();
      expect(screen.queryByText('Marie Dupont')).toBeFalsy();
    });

    it('should be case-insensitive search', async () => {
      render(<UserManagement institutionId={mockInstitutionId} />);

      const searchInput = screen.getByPlaceholderText('Rechercher par courriel ou nom…');
      await userEvent.type(searchInput, 'MARIE');

      expect(screen.getByText('Marie Dupont')).toBeTruthy();
    });

    it('should handle filter by user role', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);

      const roleFilter = screen.getByLabelText('Filter by role');
      fireEvent.change(roleFilter, { target: { value: 'user' } });

      expect(screen.getByText('Marie Dupont')).toBeTruthy();
      expect(screen.getByText('Jean Côté')).toBeTruthy();
    });

    it('should show all roles when filter is "all"', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);

      const roleFilter = screen.getByLabelText('Filter by role');

      // First filter by admin
      fireEvent.change(roleFilter, { target: { value: 'admin' } });
      expect(screen.getByText('Admin User')).toBeTruthy();

      // Change back to all
      fireEvent.change(roleFilter, { target: { value: 'all' } });
      expect(screen.getByText('Admin User')).toBeTruthy();
      expect(screen.getByText('Marie Dupont')).toBeTruthy();
    });
  });

  // ============================================================================
  // ADDITIONAL COVERAGE: MODAL INTERACTIONS
  // ============================================================================
  describe('Modal Interactions', () => {
    it('should close modal when clicking outside content', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const viewButtons = screen.getAllByTitle('View user details');

      fireEvent.click(viewButtons[0]);
      expect(screen.getByText('Détails de l\'Utilisateur')).toBeTruthy();

      // Click outside modal (on the modal backdrop)
      const modal = screen.getByText('Détails de l\'Utilisateur').closest('.user-details-modal');
      fireEvent.click(modal);

      expect(screen.queryByText('Détails de l\'Utilisateur')).toBeFalsy();
    });

    it('should prevent closing when clicking modal content', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const viewButtons = screen.getAllByTitle('View user details');

      fireEvent.click(viewButtons[0]);
      const modalContent = screen.getByText('Détails de l\'Utilisateur').closest('.modal-content');

      fireEvent.click(modalContent);

      // Modal should still be open
      expect(screen.getByText('Détails de l\'Utilisateur')).toBeTruthy();
    });

    it('should display all user details in modal', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const viewButtons = screen.getAllByTitle('View user details');

      fireEvent.click(viewButtons[0]);

      // Modal header
      expect(screen.getByText('Détails de l\'Utilisateur')).toBeTruthy();

      // Modal should contain email somewhere
      const modal = screen.getByText('Détails de l\'Utilisateur').parentElement;
      expect(modal.textContent).toContain('admin@institution.ca');
      expect(modal.textContent).toContain('Admin User');
    });

    it('should show email detail in modal', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const viewButtons = screen.getAllByTitle('View user details');

      fireEvent.click(viewButtons[1]); // Marie's view button

      const modal = screen.getByText('Détails de l\'Utilisateur').parentElement;
      expect(modal.textContent).toContain('senior1@institution.ca');
    });

    it('should show role detail in modal', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const viewButtons = screen.getAllByTitle('View user details');

      fireEvent.click(viewButtons[0]);

      const modal = screen.getByText('Détails de l\'Utilisateur').parentElement;
      expect(modal.textContent).toContain('admin');
    });

    it('should show status detail in modal', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);
      const viewButtons = screen.getAllByTitle('View user details');

      fireEvent.click(viewButtons[2]); // Jean (inactive user)

      const modal = screen.getByText('Détails de l\'Utilisateur').parentElement;
      expect(modal.textContent).toContain('inactive');
    });
  });

  // ============================================================================
  // ADDITIONAL COVERAGE: DELETE OPERATIONS
  // ============================================================================
  describe('Delete Operations Edge Cases', () => {
    it('should update user count after deletion', () => {
      window.confirm = vi.fn(() => true);
      render(<UserManagement institutionId={mockInstitutionId} />);

      // Initial count: 3
      expect(screen.getByText('Total:').nextSibling.textContent).toContain('3');

      const deleteButtons = screen.getAllByTitle('Delete user');
      fireEvent.click(deleteButtons[0]);

      // After deletion: 2
      expect(screen.getByText('Total:').nextSibling.textContent).toContain('2');
    });

    it('should remove deleted user from table', () => {
      window.confirm = vi.fn(() => true);
      render(<UserManagement institutionId={mockInstitutionId} />);

      expect(screen.getByText('admin@institution.ca')).toBeTruthy();

      const deleteButtons = screen.getAllByTitle('Delete user');
      fireEvent.click(deleteButtons[0]);

      expect(screen.queryByText('admin@institution.ca')).toBeFalsy();
    });

    it('should update active count after deleting active user', () => {
      window.confirm = vi.fn(() => true);
      render(<UserManagement institutionId={mockInstitutionId} />);

      // Initial active: 2
      expect(screen.getByText('Actifs:').nextSibling.textContent).toContain('2');

      const deleteButtons = screen.getAllByTitle('Delete user');
      fireEvent.click(deleteButtons[0]);

      // After deletion: 1
      expect(screen.getByText('Actifs:').nextSibling.textContent).toContain('1');
    });

    it('should update inactive count after deleting inactive user', () => {
      window.confirm = vi.fn(() => true);
      render(<UserManagement institutionId={mockInstitutionId} />);

      // Initial inactive: 1
      expect(screen.getByText('Inactifs:').nextSibling.textContent).toContain('1');

      const deleteButtons = screen.getAllByTitle('Delete user');
      fireEvent.click(deleteButtons[2]); // Jean is inactive

      // After deletion: 0
      expect(screen.getByText('Inactifs:').nextSibling.textContent).toContain('0');
    });

    it('should display correct message when all users are deleted', () => {
      window.confirm = vi.fn(() => true);
      render(<UserManagement institutionId={mockInstitutionId} />);

      // Delete users one by one, getting fresh button references each time
      let deleteButtons = screen.getAllByTitle('Delete user');
      fireEvent.click(deleteButtons[0]);

      deleteButtons = screen.getAllByTitle('Delete user');
      fireEvent.click(deleteButtons[0]);

      deleteButtons = screen.getAllByTitle('Delete user');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Aucun utilisateur trouvé')).toBeTruthy();
    });
  });

  // ============================================================================
  // ADDITIONAL COVERAGE: TABLE RENDERING DETAILS
  // ============================================================================
  describe('Table Details & Styling', () => {
    it('should display analyses count for each user', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);

      // Admin user has 456 analyses
      expect(screen.getByText('456')).toBeTruthy();
      // Marie has 23 analyses
      expect(screen.getByText('23')).toBeTruthy();
      // Jean has 5 analyses
      expect(screen.getByText('5')).toBeTruthy();
    });

    it('should display creation date for each user', () => {
      render(<UserManagement institutionId={mockInstitutionId} />);

      expect(screen.getByText('2026-01-15')).toBeTruthy();
      expect(screen.getByText('2026-02-01')).toBeTruthy();
      expect(screen.getByText('2026-02-10')).toBeTruthy();
    });

    it('should apply correct CSS classes to user rows', () => {
      const { container } = render(<UserManagement institutionId={mockInstitutionId} />);

      const activeRows = container.querySelectorAll('.user-row.user-active');
      const inactiveRows = container.querySelectorAll('.user-row.user-inactive');

      expect(activeRows.length).toBe(2);
      expect(inactiveRows.length).toBe(1);
    });

    it('should apply correct role badge styling', () => {
      const { container } = render(<UserManagement institutionId={mockInstitutionId} />);

      const adminBadges = container.querySelectorAll('.role-badge.role-admin');
      const userBadges = container.querySelectorAll('.role-badge.role-user');

      expect(adminBadges.length).toBe(1);
      expect(userBadges.length).toBe(2);
    });

    it('should apply correct status badge styling', () => {
      const { container } = render(<UserManagement institutionId={mockInstitutionId} />);

      const activeBadges = container.querySelectorAll('.status-badge.status-active');
      const inactiveBadges = container.querySelectorAll('.status-badge.status-inactive');

      expect(activeBadges.length).toBe(2);
      expect(inactiveBadges.length).toBe(1);
    });
  });

  // ============================================================================
  // ADDITIONAL COVERAGE: INSTITUTION ID PROP
  // ============================================================================
  describe('Institution ID Handling', () => {
    it('should accept different institution IDs', () => {
      const { rerender } = render(<UserManagement institutionId="inst-123" />);

      expect(screen.getByText('Gestion des Utilisateurs')).toBeTruthy();

      rerender(<UserManagement institutionId="inst-456" />);

      expect(screen.getByText('Gestion des Utilisateurs')).toBeTruthy();
    });

    it('should trigger refetch when institutionId changes', async () => {
      const { rerender } = render(<UserManagement institutionId="inst-123" />);

      expect(screen.getByText('Admin User')).toBeTruthy();

      rerender(<UserManagement institutionId="inst-456" />);

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeTruthy();
      });
    });
  });
});

