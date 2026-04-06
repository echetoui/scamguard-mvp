/**
 * Settings & Branding Module Tests
 * Tests for settings, branding customization, and compliance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsBranding from '../SettingsBranding';

describe('SettingsBranding Module', () => {
  const mockInstitutionId = 'inst-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render settings header', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(screen.getByText('Paramètres et Branding')).toBeTruthy();
    });

    it('should render save button', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(screen.getByText('💾 Enregistrer')).toBeTruthy();
    });

    it('should render all tab buttons', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(screen.getAllByText('Paramètres Généraux').length).toBeGreaterThan(0);
      expect(screen.getByText('Branding')).toBeTruthy();
      expect(screen.getByText('Modèles Email')).toBeTruthy();
      expect(screen.getByText('Conformité')).toBeTruthy();
    });
  });

  describe('Tab Navigation', () => {
    it('should display general settings tab by default', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(screen.getAllByText('Paramètres Généraux').length).toBeGreaterThan(0);
    });

    it('should switch to branding tab', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const brandingTab = screen.getByText('Branding');
      fireEvent.click(brandingTab);

      expect(screen.getByText('Personnalisation de la Marque')).toBeTruthy();
    });

    it('should switch to email templates tab', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const emailTab = screen.getByText('Modèles Email');
      fireEvent.click(emailTab);

      expect(screen.getByText('Modèles Email', { selector: 'h3' })).toBeTruthy();
    });

    it('should switch to compliance tab', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const complianceTab = screen.getByText('Conformité');
      fireEvent.click(complianceTab);

      expect(screen.getByText('Documents de Conformité')).toBeTruthy();
    });

    it('should highlight active tab', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const brandingTab = screen.getByText('Branding').closest('button');
      fireEvent.click(brandingTab);

      expect(brandingTab.className).toContain('active');
    });
  });

  describe('General Settings', () => {
    it('should display institution name input', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(screen.getByDisplayValue('Institution Partner')).toBeTruthy();
    });

    it('should update institution name', async () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const nameInput = screen.getByDisplayValue('Institution Partner');

      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'My Institution');

      expect(nameInput.value).toBe('My Institution');
    });

    it('should display custom domain input', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(screen.getByPlaceholderText('https://custom.monentreprise.ca')).toBeTruthy();
    });

    it('should display compliance level selector', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(screen.getByText('Niveau de Conformité')).toBeTruthy();
    });

    it('should change compliance level', async () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const complianceSelects = document.querySelectorAll('select');
      const complianceSelect = complianceSelects[0]; // First select is compliance level

      if (complianceSelect) {
        fireEvent.change(complianceSelect, { target: { value: 'gdpr' } });
        expect(complianceSelect.value).toBe('gdpr');
      }
    });
  });

  describe('Branding Settings', () => {
    it('should display color picker for primary color', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const brandingTab = screen.getByText('Branding');
      fireEvent.click(brandingTab);

      expect(screen.getByDisplayValue('#3498db')).toBeTruthy();
    });

    it('should update primary color', async () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const brandingTab = screen.getByText('Branding');
      fireEvent.click(brandingTab);

      const colorInput = screen.getByDisplayValue('#3498db');
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });

      expect(colorInput.value).toBe('#ff0000');
    });

    it('should display color picker for secondary color', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const brandingTab = screen.getByText('Branding');
      fireEvent.click(brandingTab);

      expect(screen.getByDisplayValue('#2ecc71')).toBeTruthy();
    });

    it('should display logo URL input', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const brandingTab = screen.getByText('Branding');
      fireEvent.click(brandingTab);

      expect(screen.getByDisplayValue('/logo.png')).toBeTruthy();
    });

    it('should display branding preview', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const brandingTab = screen.getByText('Branding');
      fireEvent.click(brandingTab);

      expect(screen.getByText('Aperçu du Branding')).toBeTruthy();
      expect(screen.getByText('Institution Partner')).toBeTruthy();
    });

    it('should update preview when colors change', async () => {
      const { container } = render(<SettingsBranding institutionId={mockInstitutionId} />);
      const brandingTab = screen.getByText('Branding');
      fireEvent.click(brandingTab);

      const primaryColorInput = screen.getByDisplayValue('#3498db');
      fireEvent.change(primaryColorInput, { target: { value: '#ff0000' } });

      const previewCard = container.querySelector('.preview-card');
      expect(previewCard.style.getPropertyValue('--primary-color')).toBe('#ff0000');
    });
  });

  describe('Email Templates', () => {
    it('should display email template selector', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const emailTab = screen.getByText('Modèles Email');
      fireEvent.click(emailTab);

      expect(screen.getByText('Modèle Prédéfini')).toBeTruthy();
    });

    it('should display template options', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const emailTab = screen.getByText('Modèles Email');
      fireEvent.click(emailTab);

      expect(screen.getByText('ScamGuard Standard')).toBeTruthy();
      expect(screen.getByText('Professionnel')).toBeTruthy();
      expect(screen.getByText('Amical')).toBeTruthy();
      expect(screen.getByText('Personnalisé')).toBeTruthy();
    });

    it('should display template cards', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const emailTab = screen.getByText('Modèles Email');
      fireEvent.click(emailTab);

      expect(screen.getByText('Email de Bienvenue')).toBeTruthy();
      expect(screen.getByText('Alerte de Menace')).toBeTruthy();
      expect(screen.getByText('Rapport Hebdomadaire')).toBeTruthy();
      expect(screen.getByText('Réinitialisation Mot de Passe')).toBeTruthy();
    });

    it('should have edit buttons for each template', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const emailTab = screen.getByText('Modèles Email');
      fireEvent.click(emailTab);

      const editButtons = screen.getAllByText('Éditer');
      expect(editButtons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Compliance Settings', () => {
    it('should display compliance documents section', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const complianceTab = screen.getByText('Conformité');
      fireEvent.click(complianceTab);

      expect(screen.getByText('Documents de Conformité')).toBeTruthy();
    });

    it('should display DPA document', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const complianceTab = screen.getByText('Conformité');
      fireEvent.click(complianceTab);

      expect(screen.getByText(/Accord de Traitement des Données/)).toBeTruthy();
    });

    it('should display security policy document', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const complianceTab = screen.getByText('Conformité');
      fireEvent.click(complianceTab);

      expect(screen.getByText(/Politique de Sécurité/)).toBeTruthy();
    });

    it('should display certification document', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const complianceTab = screen.getByText('Conformité');
      fireEvent.click(complianceTab);

      expect(screen.getByText(/Certifications de Conformité/)).toBeTruthy();
    });

    it('should display document status badges', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const complianceTab = screen.getByText('Conformité');
      fireEvent.click(complianceTab);

      expect(screen.getByText('✓ Signé')).toBeTruthy();
      expect(screen.getByText('⏳ En Révision')).toBeTruthy();
    });

    it('should display document dates', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const complianceTab = screen.getByText('Conformité');
      fireEvent.click(complianceTab);

      expect(screen.getByText('15 janvier 2026')).toBeTruthy();
      expect(screen.getByText('1er mars 2026')).toBeTruthy();
    });

    it('should have download buttons for documents', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const complianceTab = screen.getByText('Conformité');
      fireEvent.click(complianceTab);

      const downloadButtons = screen.getAllByText('Télécharger');
      expect(downloadButtons.length).toBeGreaterThan(0);
    });

    it('should display compliance level info', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const complianceTab = screen.getByText('Conformité');
      fireEvent.click(complianceTab);

      expect(screen.getByText('Niveau de Conformité Actuel')).toBeTruthy();
      expect(screen.getAllByText(/HIPAA/).length).toBeGreaterThan(0);
    });
  });

  describe('Save Functionality', () => {
    it('should save settings on button click', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const saveButton = screen.getByText('💾 Enregistrer');

      expect(saveButton).toBeTruthy();
      expect(saveButton.disabled).toBe(false);

      fireEvent.click(saveButton);

      // Button should show loading state
      const loadingButton = screen.getByText('⏳ Enregistrement...');
      expect(loadingButton).toBeTruthy();
      expect(loadingButton.closest('button').disabled).toBe(true);
    });

    it('should disable save button while saving', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      const saveButton = screen.getByText('💾 Enregistrer');

      fireEvent.click(saveButton);

      // Button should be disabled while saving
      const loadingButton = screen.getByText('⏳ Enregistrement...').closest('button');
      expect(loadingButton.disabled).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(screen.getByText('Nom de l\'Institution')).toBeTruthy();
      expect(screen.getByText('Domaine Personnalisé')).toBeTruthy();
      expect(screen.getByText('Niveau de Conformité')).toBeTruthy();
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(container.querySelector('h2')).toBeTruthy();
      expect(container.querySelector('h3')).toBeTruthy();
      expect(container.querySelector('input')).toBeTruthy();
    });

    it('should have semantic form structure', () => {
      const { container } = render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(container.querySelector('input')).toBeTruthy();
      expect(container.querySelector('select')).toBeTruthy();
      expect(container.querySelector('button')).toBeTruthy();
    });

    it('should have input descriptions', () => {
      render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(screen.getByText('Le nom affiché aux utilisateurs finaux')).toBeTruthy();
      expect(screen.getByText(/Laissez vide pour utiliser/)).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    it('should render all sections', () => {
      const { container } = render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(container.querySelector('.settings-header')).toBeTruthy();
      expect(container.querySelector('.settings-tabs')).toBeTruthy();
      expect(container.querySelector('.settings-content')).toBeTruthy();
    });

    it('should have proper layout structure', () => {
      const { container } = render(<SettingsBranding institutionId={mockInstitutionId} />);
      expect(container.querySelector('.settings-branding-container')).toBeTruthy();
    });
  });
});
