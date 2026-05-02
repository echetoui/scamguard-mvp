/**
 * API Key Management Module Tests
 * Tests for key generation, rate limiting, and usage tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import APIKeyManagement from '../APIKeyManagement';

describe('APIKeyManagement Module', () => {
  const mockInstitutionId = 'inst-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      }
    });
  });

  describe('Component Rendering', () => {
    it('should render API key management header', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('Gestion des Clés API')).toBeTruthy();
    });

    it('should render create key button', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('➕ Créer Nouvelle Clé')).toBeTruthy();
    });

    it('should display existing API keys', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('Production API Key')).toBeTruthy();
      expect(screen.getByText('Development API Key')).toBeTruthy();
    });
  });

  describe('API Key Display', () => {
    it('should display key ID', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText(/key_123abc/)).toBeTruthy();
      expect(screen.getByText(/key_456def/)).toBeTruthy();
    });

    it('should display key creation date', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('2026-01-15')).toBeTruthy();
      expect(screen.getByText('2026-02-01')).toBeTruthy();
    });

    it('should display key rate limit', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('1000 requêtes/jour')).toBeTruthy();
      expect(screen.getByText('100 requêtes/jour')).toBeTruthy();
    });

    it('should display active status badge', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      const activeButtons = screen.getAllByText('✓ Active');
      expect(activeButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Create Key Form', () => {
    it('should toggle create form visibility', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      const createButton = screen.getByText('➕ Créer Nouvelle Clé');

      fireEvent.click(createButton);
      expect(screen.getByText('Créer une Nouvelle Clé API')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ex. Production, Développement, Test…')).toBeTruthy();

      const cancelButton = screen.getByText('✕ Annuler');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Créer une Nouvelle Clé API')).toBeFalsy();
    });

    it('should accept key name input', async () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      fireEvent.click(screen.getByText('➕ Créer Nouvelle Clé'));

      const nameInput = screen.getByPlaceholderText('Ex. Production, Développement, Test…');
      await userEvent.type(nameInput, 'Staging API Key');

      expect(nameInput.value).toBe('Staging API Key');
    });

    it('should accept rate limit input', async () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      fireEvent.click(screen.getByText('➕ Créer Nouvelle Clé'));

      const rateLimitInput = screen.getByDisplayValue('1000');
      await userEvent.clear(rateLimitInput);
      await userEvent.type(rateLimitInput, '5000');

      expect(rateLimitInput.value).toBe('5000');
    });

    it('should show validation error for empty name', async () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      fireEvent.click(screen.getByText('➕ Créer Nouvelle Clé'));

      const createButton = screen.getByText('Créer la Clé');
      fireEvent.click(createButton);

      expect(screen.getByRole('alert').textContent).toContain('Veuillez entrer un nom pour la clé.');
    });
  });

  describe('Key Actions', () => {
    it('should copy key to clipboard', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      const copyButtons = screen.getAllByText('📋 Copier Clé');

      fireEvent.click(copyButtons[0]);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('key_123abc');
    });

    it('should show copied confirmation', async () => {
      vi.useFakeTimers();
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      const copyButtons = screen.getAllByText('📋 Copier Clé');

      fireEvent.click(copyButtons[0]);

      expect(screen.getByText('✓ Copié!')).toBeTruthy();

      vi.advanceTimersByTime(2000);
      vi.useRealTimers();
    });

    it('should revoke key with confirmation', () => {
      window.confirm = vi.fn(() => true);
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      const revokeButtons = screen.getAllByText('🗑️ Révoquer');

      fireEvent.click(revokeButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
    });

    it('should not revoke key when confirmation is cancelled', () => {
      window.confirm = vi.fn(() => false);
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      const initialKeyCount = screen.getAllByText(/key_/).length;
      const revokeButtons = screen.getAllByText('🗑️ Révoquer');

      fireEvent.click(revokeButtons[0]);

      // Key count should remain the same
      expect(screen.getAllByText(/key_/).length).toBe(initialKeyCount);
    });
  });

  describe('Usage Tracking', () => {
    it('should display usage percentage', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText(/456.*1000.*requêtes/)).toBeTruthy();
    });

    it('should display usage bar', () => {
      const { container } = render(<APIKeyManagement institutionId={mockInstitutionId} />);
      const usageBars = container.querySelectorAll('.usage-bar');
      expect(usageBars.length).toBeGreaterThan(0);
    });

    it('should calculate usage percentage correctly', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      // 456 / 1000 = 45.6%
      expect(screen.getByText(/45.6%/)).toBeTruthy();
    });

    it('should highlight warning for high usage', () => {
      const { container } = render(<APIKeyManagement institutionId={mockInstitutionId} />);
      // Production key has 45.6% usage, so no warning
      // Development key has 12% usage, so no warning
      const warningBars = container.querySelectorAll('.usage-fill.warning');
      expect(warningBars.length).toBe(0);
    });
  });

  describe('Documentation', () => {
    it('should display API documentation section', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText('Documentation API')).toBeTruthy();
    });

    it('should display API endpoint', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getAllByText(/https:\/\/api.scamguard.ca\/v1\/analyze/).length).toBeGreaterThan(0);
    });

    it('should display authentication instruction', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getAllByText(/Authorization: Bearer YOUR_API_KEY/).length).toBeGreaterThan(0);
    });

    it('should display example request', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getByText(/curl -X POST/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      fireEvent.click(screen.getByText('➕ Créer Nouvelle Clé'));

      expect(screen.getByText('Nom de la Clé')).toBeTruthy();
      expect(screen.getByText('Limite de Taux (requêtes/jour)')).toBeTruthy();
    });

    it('should have button titles for accessibility', () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(screen.getAllByTitle('Copy key to clipboard').length).toBeGreaterThan(0);
      expect(screen.getAllByTitle('Regenerate key').length).toBeGreaterThan(0);
      expect(screen.getAllByTitle('Revoke key').length).toBeGreaterThan(0);
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(<APIKeyManagement institutionId={mockInstitutionId} />);
      expect(container.querySelector('h2')).toBeTruthy();
      expect(container.querySelector('h3')).toBeTruthy();
      expect(container.querySelector('h4')).toBeTruthy();
    });
  });

  describe('Form Interactions', () => {
    it('should reset form after creating key', async () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      fireEvent.click(screen.getByText('➕ Créer Nouvelle Clé'));

      const nameInput = screen.getByPlaceholderText('Ex. Production, Développement, Test…');
      await userEvent.type(nameInput, 'New Test Key');

      const createButton = screen.getByText('Créer la Clé');
      fireEvent.click(createButton);

      // After creating key, form should close
      await waitFor(() => {
        expect(screen.queryByText('Créer une Nouvelle Clé API')).toBeFalsy();
      });
    });

    it('should close form after creating key', async () => {
      render(<APIKeyManagement institutionId={mockInstitutionId} />);
      fireEvent.click(screen.getByText('➕ Créer Nouvelle Clé'));

      const nameInput = screen.getByPlaceholderText('Ex. Production, Développement, Test…');
      await userEvent.type(nameInput, 'New Test Key');

      const createButton = screen.getByText('Créer la Clé');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.queryByText('Créer une Nouvelle Clé API')).toBeFalsy();
      });
    });
  });
});
